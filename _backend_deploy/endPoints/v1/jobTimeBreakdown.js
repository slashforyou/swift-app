/**
 * Job Time Breakdown — Calcul détaillé durée + coût par segment et par employé
 * GET /v1/jobs/:id/time-breakdown
 *
 * Response shape:
 * {
 *   success: true,
 *   breakdown: {
 *     totalDurationMs, billableDurationMs, nonBillableDurationMs,
 *     perSegment: [{ segmentId, label, type, isBillable, durationMs, employees: [...] }],
 *     perEmployee: [{ employeeId, name, totalMs, billableMs, totalCost }]
 *   }
 * }
 */
const { connect } = require('../../swiftDb');

// ─── GET TIME BREAKDOWN ───
const getJobTimeBreakdown = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Company ID required' });
    }

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Load all segment instances for this job
    const [segments] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE job_id = ? ORDER BY segment_order',
      [jobId]
    );

    // Load all employee assignments for this job's segments in one query
    const [assignments] = await connection.execute(
      `SELECT sea.*, u.first_name, u.last_name
       FROM segment_employee_assignments sea
       JOIN job_segment_instances jsi ON jsi.id = sea.segment_instance_id
       JOIN users u ON u.id = sea.employee_id
       WHERE jsi.job_id = ?`,
      [jobId]
    );

    // Build assignment map: segment_instance_id → [assignments]
    const assignmentMap = {};
    for (const a of assignments) {
      if (!assignmentMap[a.segment_instance_id]) {
        assignmentMap[a.segment_instance_id] = [];
      }
      assignmentMap[a.segment_instance_id].push(a);
    }

    let totalDurationMs = 0;
    let billableDurationMs = 0;
    let nonBillableDurationMs = 0;

    const perSegment = [];
    // employeeId → { employeeId, name, totalMs, billableMs, totalCost }
    const employeeTotals = {};

    for (const seg of segments) {
      // Resolve segment duration: prefer stored duration_ms, fallback to
      // start/complete timestamps, then configured_duration_minutes.
      let durationMs = 0;
      if (seg.duration_ms) {
        durationMs = Number(seg.duration_ms);
      } else if (seg.started_at && seg.completed_at) {
        durationMs = new Date(seg.completed_at).getTime() - new Date(seg.started_at).getTime();
      } else if (seg.configured_duration_minutes) {
        durationMs = Number(seg.configured_duration_minutes) * 60 * 1000;
      }

      totalDurationMs += durationMs;
      if (seg.is_billable) {
        billableDurationMs += durationMs;
      } else {
        nonBillableDurationMs += durationMs;
      }

      const segAssignments = assignmentMap[seg.id] || [];
      const employees = segAssignments.map(a => {
        // worked_duration_ms may be set on complete; fall back to segment duration
        const workedMs = a.worked_duration_ms ? Number(a.worked_duration_ms) : durationMs;
        const rate = a.hourly_rate ? Number(a.hourly_rate) : 0;
        // cost = rate (AUD/h) × hours worked — round to cents
        const cost = rate > 0 ? Math.round((rate * workedMs / 3600000) * 100) / 100 : 0;
        const name = ((a.first_name || '') + ' ' + (a.last_name || '')).trim();

        // Accumulate per-employee totals
        if (!employeeTotals[a.employee_id]) {
          employeeTotals[a.employee_id] = {
            employeeId: a.employee_id,
            name,
            totalMs: 0,
            billableMs: 0,
            totalCost: 0,
          };
        }
        employeeTotals[a.employee_id].totalMs += workedMs;
        if (seg.is_billable) {
          employeeTotals[a.employee_id].billableMs += workedMs;
        }
        employeeTotals[a.employee_id].totalCost =
          Math.round((employeeTotals[a.employee_id].totalCost + cost) * 100) / 100;

        return {
          employeeId: a.employee_id,
          name,
          role: a.role,
          workedMs,
          rate,
          cost,
        };
      });

      perSegment.push({
        segmentId: seg.id,
        label: seg.label || '',
        type: seg.type,
        isBillable: !!seg.is_billable,
        durationMs,
        employees,
      });
    }

    res.json({
      success: true,
      breakdown: {
        totalDurationMs,
        billableDurationMs,
        nonBillableDurationMs,
        perSegment,
        perEmployee: Object.values(employeeTotals),
      },
    });
  } catch (error) {
    console.error('Error getting job time breakdown:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getJobTimeBreakdown };

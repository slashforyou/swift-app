/**
 * Job Time Breakdown — Calculates detailed cost recap for a completed job
 * GET /v1/jobs/:id/time-breakdown
 */
const { connect } = require('../../swiftDb');

const getJobTimeBreakdown = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    connection = await connect();

    // Load job info
    const [jobRows] = await connection.execute(
      `SELECT j.id, j.billing_mode, j.flat_rate_amount, j.flat_rate_max_hours,
              j.flat_rate_overage_rate, j.return_trip_minutes, j.modular_template_id,
              j.hourly_rate
       FROM jobs j WHERE j.id = ?`,
      [jobId]
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    const job = jobRows[0];

    // Load all segments
    const [segments] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE job_id = ? ORDER BY segment_order',
      [jobId]
    );

    // Load all employee assignments grouped by segment
    const segmentDetails = [];
    let totalDurationMs = 0;
    let billableDurationMs = 0;

    for (const seg of segments) {
      const [assignments] = await connection.execute(
        `SELECT sea.*, u.first_name, u.last_name
         FROM segment_employee_assignments sea
         JOIN users u ON u.id = sea.employee_id
         WHERE sea.segment_instance_id = ?`,
        [seg.id]
      );

      const durationMs = seg.duration_ms ? Number(seg.duration_ms) : 0;
      totalDurationMs += durationMs;
      if (seg.is_billable) billableDurationMs += durationMs;

      let segmentCost = 0;
      const employeeCosts = assignments.map(a => {
        const empDurationMs = a.worked_duration_ms ? Number(a.worked_duration_ms) : durationMs;
        const rate = a.hourly_rate ? Number(a.hourly_rate) : (job.hourly_rate ? Number(job.hourly_rate) : 0);
        const empCost = (empDurationMs / 3600000) * rate;
        segmentCost += empCost;
        return {
          employeeId: String(a.employee_id),
          employeeName: ((a.first_name || '') + ' ' + (a.last_name || '')).trim(),
          role: a.role || 'mover',
          workedDurationMs: empDurationMs,
          hourlyRate: rate,
          cost: Math.round(empCost * 100) / 100,
        };
      });

      segmentDetails.push({
        id: String(seg.id),
        order: seg.segment_order,
        type: seg.type,
        label: seg.label || '',
        isBillable: !!seg.is_billable,
        isReturnTrip: !!seg.is_return_trip,
        startedAt: seg.started_at || null,
        completedAt: seg.completed_at || null,
        durationMs,
        employees: employeeCosts,
        segmentCost: Math.round(segmentCost * 100) / 100,
      });
    }

    // Build breakdown depending on billing mode
    const billingMode = job.billing_mode || 'location_to_location';

    // Employee aggregated costs
    const employeeAgg = {};
    for (const seg of segmentDetails) {
      if (!seg.isBillable) continue;
      for (const emp of seg.employees) {
        if (!employeeAgg[emp.employeeId]) {
          employeeAgg[emp.employeeId] = {
            employeeId: emp.employeeId,
            employeeName: emp.employeeName,
            role: emp.role,
            totalDurationMs: 0,
            hourlyRate: emp.hourlyRate,
            totalCost: 0,
          };
        }
        employeeAgg[emp.employeeId].totalDurationMs += emp.workedDurationMs;
        employeeAgg[emp.employeeId].totalCost += emp.cost;
      }
    }
    const employeeSummaries = Object.values(employeeAgg).map(e => ({
      ...e,
      totalCost: Math.round(e.totalCost * 100) / 100,
    }));

    const totalHourlyCost = employeeSummaries.reduce((sum, e) => sum + e.totalCost, 0);

    // Flat rate calculation
    let flatRateBreakdown = null;
    if (billingMode === 'flat_rate') {
      const flatBase = job.flat_rate_amount ? Number(job.flat_rate_amount) : 0;
      const maxHours = job.flat_rate_max_hours ? Number(job.flat_rate_max_hours) : null;
      const overageRate = job.flat_rate_overage_rate ? Number(job.flat_rate_overage_rate) : 0;
      const totalHours = billableDurationMs / 3600000;

      let overageCost = 0;
      let overageHours = 0;
      if (maxHours && totalHours > maxHours) {
        overageHours = totalHours - maxHours;
        overageCost = overageHours * overageRate;
      }

      // Load selected options
      const [opts] = await connection.execute(
        'SELECT * FROM job_selected_flat_rate_options WHERE job_id = ?',
        [jobId]
      );
      const selectedOptions = opts.map(o => ({
        id: String(o.id),
        label: o.option_label,
        price: Number(o.option_price),
      }));
      const optionsTotal = selectedOptions.reduce((s, o) => s + o.price, 0);

      flatRateBreakdown = {
        baseAmount: flatBase,
        maxIncludedHours: maxHours,
        actualHours: Math.round(totalHours * 100) / 100,
        overageHours: Math.round(overageHours * 100) / 100,
        overageRate,
        overageCost: Math.round(overageCost * 100) / 100,
        selectedOptions,
        optionsTotal: Math.round(optionsTotal * 100) / 100,
        totalCost: Math.round((flatBase + overageCost + optionsTotal) * 100) / 100,
      };
    }

    const totalCost = billingMode === 'flat_rate'
      ? flatRateBreakdown.totalCost
      : Math.round(totalHourlyCost * 100) / 100;

    res.json({
      success: true,
      breakdown: {
        jobId: String(jobId),
        billingMode,
        totalDurationMs,
        billableDurationMs,
        returnTripMinutes: job.return_trip_minutes ? Number(job.return_trip_minutes) : 0,
        segments: segmentDetails,
        employeeSummaries,
        flatRateBreakdown,
        totalCost,
      },
    });
  } catch (error) {
    console.error('Error computing time breakdown:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getJobTimeBreakdown };

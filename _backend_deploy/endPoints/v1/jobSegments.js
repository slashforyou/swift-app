/**
 * Job Segments — Endpoints for managing segment instances on a job
 *
 * POST   /v1/jobs/:id/segments                    — Init segments from template
 * GET    /v1/jobs/:id/segments                    — List segments for a job
 * POST   /v1/jobs/:id/segments/:segId/start       — Start a segment
 * POST   /v1/jobs/:id/segments/:segId/complete    — Complete a segment
 * PUT    /v1/jobs/:id/segments/:segId/employees   — Assign employees to a segment
 * PATCH  /v1/jobs/:id/segments/:segId             — Update segment metadata
 * DELETE /v1/jobs/:id/segments/:segId             — Delete a segment
 * POST   /v1/jobs/:id/segments/add                — Add a custom segment
 * PATCH  /v1/jobs/:id/return-trip                 — Update return trip minutes
 * GET    /v1/jobs/:id/flat-rate-options           — Get flat rate options
 * PUT    /v1/jobs/:id/flat-rate-options           — Update flat rate options
 */
const { connect } = require('../../swiftDb');

// ─── Helper ───
function formatSegmentInstance(seg) {
  return {
    id: String(seg.id),
    templateSegmentId: seg.template_segment_id ? String(seg.template_segment_id) : undefined,
    order: seg.segment_order,
    type: seg.type,
    label: seg.label || '',
    locationType: seg.location_type || undefined,
    isBillable: !!seg.is_billable,
    startedAt: seg.started_at || undefined,
    completedAt: seg.completed_at || undefined,
    durationMs: seg.duration_ms ? Number(seg.duration_ms) : undefined,
    isReturnTrip: !!seg.is_return_trip,
    configuredDurationMinutes: seg.configured_duration_minutes || undefined,
    assignedEmployees: [],
  };
}

// ─── INIT SEGMENTS (from template) ───
const initJobSegments = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const companyId = req.user?.company_id;
    const { templateId } = req.body;

    if (!templateId) {
      return res.status(400).json({ success: false, error: 'templateId required' });
    }

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    // Load template segments
    const [templateSegs] = await connection.execute(
      'SELECT * FROM job_template_segments WHERE template_id = ? ORDER BY segment_order',
      [templateId]
    );
    if (templateSegs.length === 0) {
      return res.status(400).json({ success: false, error: 'Template has no segments' });
    }

    // Load template for billing mode info
    const [tpl] = await connection.execute(
      'SELECT billing_mode, flat_rate_amount, flat_rate_max_hours, flat_rate_overage_rate, return_trip_default_minutes FROM job_templates_modular WHERE id = ?',
      [templateId]
    );

    await connection.beginTransaction();

    // Clear any existing segments
    await connection.execute('DELETE FROM job_segment_instances WHERE job_id = ?', [jobId]);

    // Update job with template info
    if (tpl.length > 0) {
      await connection.execute(
        `UPDATE jobs SET modular_template_id = ?, billing_mode = ?,
         flat_rate_amount = ?, flat_rate_max_hours = ?, flat_rate_overage_rate = ?,
         return_trip_minutes = ?
         WHERE id = ?`,
        [templateId, tpl[0].billing_mode, tpl[0].flat_rate_amount,
         tpl[0].flat_rate_max_hours, tpl[0].flat_rate_overage_rate,
         tpl[0].return_trip_default_minutes, jobId]
      );
    }

    // Create segment instances
    for (const seg of templateSegs) {
      await connection.execute(
        `INSERT INTO job_segment_instances
         (job_id, template_segment_id, segment_order, type, label,
          location_type, is_billable, is_return_trip, configured_duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jobId, seg.id, seg.segment_order, seg.type, seg.label,
          seg.location_type, seg.is_billable ? 1 : 0, 0, null,
        ]
      );
    }

    // Copy flat rate options to job
    if (tpl[0]?.billing_mode === 'flat_rate') {
      const [opts] = await connection.execute(
        'SELECT * FROM job_template_flat_rate_options WHERE template_id = ? ORDER BY display_order',
        [templateId]
      );
      await connection.execute('DELETE FROM job_selected_flat_rate_options WHERE job_id = ?', [jobId]);
      for (const opt of opts) {
        await connection.execute(
          'INSERT INTO job_selected_flat_rate_options (job_id, option_label, option_price) VALUES (?, ?, ?)',
          [jobId, opt.label, opt.price]
        );
      }
    }

    await connection.commit();

    // Return created segments
    const [segments] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE job_id = ? ORDER BY segment_order',
      [jobId]
    );

    res.status(201).json({ success: true, segments: segments.map(formatSegmentInstance) });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error init job segments:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── GET SEGMENTS ───
const getJobSegments = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const companyId = req.user?.company_id;

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    const [segments] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE job_id = ? ORDER BY segment_order',
      [jobId]
    );

    // Load employee assignments for each segment
    const results = [];
    for (const seg of segments) {
      const [assignments] = await connection.execute(
        `SELECT sea.*, u.first_name, u.last_name
         FROM segment_employee_assignments sea
         JOIN users u ON u.id = sea.employee_id
         WHERE sea.segment_instance_id = ?`,
        [seg.id]
      );
      results.push({
        ...formatSegmentInstance(seg),
        assignedEmployees: assignments.map(a => ({
          employeeId: String(a.employee_id),
          employeeName: ((a.first_name || '') + ' ' + (a.last_name || '')).trim(),
          role: a.role,
          workedDurationMs: a.worked_duration_ms ? Number(a.worked_duration_ms) : undefined,
          hourlyRate: a.hourly_rate ? Number(a.hourly_rate) : undefined,
          cost: a.cost ? Number(a.cost) : undefined,
        })),
      });
    }

    res.json({ success: true, segments: results });
  } catch (error) {
    console.error('Error getting job segments:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── START SEGMENT ───
const startSegment = async (req, res) => {
  let connection;
  try {
    const { id: jobId, segId } = req.params;
    const companyId = req.user?.company_id;

    connection = await connect();

    // Verify job belongs to company and segment belongs to job
    const [seg] = await connection.execute(
      `SELECT jsi.* FROM job_segment_instances jsi
       JOIN jobs j ON j.id = jsi.job_id
       WHERE jsi.id = ? AND jsi.job_id = ? AND j.company_id = ?`,
      [segId, jobId, companyId]
    );
    if (seg.length === 0) return res.status(404).json({ success: false, error: 'Segment not found' });

    if (seg[0].started_at) {
      return res.status(400).json({ success: false, error: 'Segment already started' });
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await connection.execute(
      'UPDATE job_segment_instances SET started_at = ? WHERE id = ?',
      [now, segId]
    );

    res.json({ success: true, startedAt: now });
  } catch (error) {
    console.error('Error starting segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── COMPLETE SEGMENT ───
const completeSegment = async (req, res) => {
  let connection;
  try {
    const { id: jobId, segId } = req.params;
    const companyId = req.user?.company_id;

    connection = await connect();

    // Verify job belongs to company and segment belongs to job
    const [seg] = await connection.execute(
      `SELECT jsi.* FROM job_segment_instances jsi
       JOIN jobs j ON j.id = jsi.job_id
       WHERE jsi.id = ? AND jsi.job_id = ? AND j.company_id = ?`,
      [segId, jobId, companyId]
    );
    if (seg.length === 0) return res.status(404).json({ success: false, error: 'Segment not found' });

    if (!seg[0].started_at) {
      return res.status(400).json({ success: false, error: 'Segment not started yet' });
    }

    const now = new Date();
    const startedAt = new Date(seg[0].started_at);
    const durationMs = now.getTime() - startedAt.getTime();
    const nowStr = now.toISOString().slice(0, 19).replace('T', ' ');

    await connection.execute(
      'UPDATE job_segment_instances SET completed_at = ?, duration_ms = ? WHERE id = ?',
      [nowStr, durationMs, segId]
    );

    // Update employee assignments with duration
    await connection.execute(
      'UPDATE segment_employee_assignments SET worked_duration_ms = ? WHERE segment_instance_id = ?',
      [durationMs, segId]
    );

    res.json({ success: true, completedAt: nowStr, durationMs });
  } catch (error) {
    console.error('Error completing segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── ASSIGN EMPLOYEES ───
const assignEmployeesToSegment = async (req, res) => {
  let connection;
  try {
    const { id: jobId, segId } = req.params;
    const companyId = req.user?.company_id;
    const { employees } = req.body; // [{ employeeId, role, hourlyRate }]

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({ success: false, error: 'employees array required' });
    }

    connection = await connect();

    // Verify job belongs to company and segment belongs to job
    const [seg] = await connection.execute(
      `SELECT jsi.* FROM job_segment_instances jsi
       JOIN jobs j ON j.id = jsi.job_id
       WHERE jsi.id = ? AND jsi.job_id = ? AND j.company_id = ?`,
      [segId, jobId, companyId]
    );
    if (seg.length === 0) return res.status(404).json({ success: false, error: 'Segment not found' });

    await connection.beginTransaction();

    // Clear existing assignments
    await connection.execute(
      'DELETE FROM segment_employee_assignments WHERE segment_instance_id = ?',
      [segId]
    );

    // Insert new assignments
    for (const emp of employees) {
      if (!emp.employeeId) continue;
      await connection.execute(
        `INSERT INTO segment_employee_assignments
         (segment_instance_id, employee_id, role, hourly_rate)
         VALUES (?, ?, ?, ?)`,
        [segId, emp.employeeId, emp.role || 'mover', emp.hourlyRate || null]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Employees assigned' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error assigning employees:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── UPDATE SEGMENT ───
const updateJobSegment = async (req, res) => {
  let connection;
  try {
    const { id: jobId, segId } = req.params;
    const companyId = req.user?.company_id;
    const { label, isBillable, locationType, configuredDurationMinutes } = req.body;

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    // Verify segment belongs to job
    const [seg] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ? AND job_id = ?',
      [segId, jobId]
    );
    if (seg.length === 0) return res.status(404).json({ success: false, error: 'Segment not found' });

    const fields = [];
    const values = [];

    if (label !== undefined) { fields.push('label = ?'); values.push(label); }
    if (isBillable !== undefined) { fields.push('is_billable = ?'); values.push(isBillable ? 1 : 0); }
    if (locationType !== undefined) { fields.push('location_type = ?'); values.push(locationType); }
    if (configuredDurationMinutes !== undefined) {
      fields.push('configured_duration_minutes = ?');
      values.push(configuredDurationMinutes);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(segId);
    await connection.execute(
      `UPDATE job_segment_instances SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ?',
      [segId]
    );

    res.json({ success: true, segment: formatSegmentInstance(updated[0]) });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── DELETE SEGMENT ───
const deleteJobSegment = async (req, res) => {
  let connection;
  try {
    const { id: jobId, segId } = req.params;
    const companyId = req.user?.company_id;

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    // Verify segment belongs to job
    const [seg] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ? AND job_id = ?',
      [segId, jobId]
    );
    if (seg.length === 0) return res.status(404).json({ success: false, error: 'Segment not found' });

    if (seg[0].started_at) {
      return res.status(400).json({ success: false, error: 'Cannot delete a segment that has already started' });
    }

    await connection.beginTransaction();

    // Explicit cascade (FK may not have ON DELETE CASCADE)
    await connection.execute(
      'DELETE FROM segment_employee_assignments WHERE segment_instance_id = ?',
      [segId]
    );
    await connection.execute(
      'DELETE FROM job_segment_instances WHERE id = ?',
      [segId]
    );

    // Re-order remaining segments contiguously
    const [remaining] = await connection.execute(
      'SELECT id FROM job_segment_instances WHERE job_id = ? ORDER BY segment_order',
      [jobId]
    );
    for (let i = 0; i < remaining.length; i++) {
      await connection.execute(
        'UPDATE job_segment_instances SET segment_order = ? WHERE id = ?',
        [i + 1, remaining[i].id]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Segment deleted' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── ADD CUSTOM SEGMENT ───
const addCustomSegment = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const companyId = req.user?.company_id;
    const { type, label, isBillable, locationType, configuredDurationMinutes } = req.body;

    if (!type || !type.trim()) {
      return res.status(400).json({ success: false, error: 'type is required' });
    }

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    // Determine next order
    const [maxRow] = await connection.execute(
      'SELECT MAX(segment_order) AS maxOrder FROM job_segment_instances WHERE job_id = ?',
      [jobId]
    );
    const nextOrder = (maxRow[0].maxOrder || 0) + 1;

    const [result] = await connection.execute(
      `INSERT INTO job_segment_instances
       (job_id, template_segment_id, segment_order, type, label,
        location_type, is_billable, is_return_trip, configured_duration_minutes)
       VALUES (?, NULL, ?, ?, ?, ?, ?, 0, ?)`,
      [
        jobId, nextOrder, type.trim(), label || null,
        locationType || null, isBillable !== false ? 1 : 0,
        configuredDurationMinutes || null,
      ]
    );

    const [created] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, segment: formatSegmentInstance(created[0]) });
  } catch (error) {
    console.error('Error adding custom segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── UPDATE RETURN TRIP ───
const updateReturnTrip = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const companyId = req.user?.company_id;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ success: false, error: 'Valid minutes required' });
    }

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    await connection.execute(
      'UPDATE jobs SET return_trip_minutes = ? WHERE id = ?',
      [minutes, jobId]
    );

    await connection.execute(
      `UPDATE job_segment_instances
       SET configured_duration_minutes = ?, duration_ms = ?
       WHERE job_id = ? AND is_return_trip = 1`,
      [minutes, minutes * 60 * 1000, jobId]
    );

    res.json({ success: true, returnTripMinutes: minutes });
  } catch (error) {
    console.error('Error updating return trip:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── GET FLAT RATE OPTIONS ───
const getFlatRateOptions = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const companyId = req.user?.company_id;

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    const [options] = await connection.execute(
      'SELECT * FROM job_selected_flat_rate_options WHERE job_id = ?',
      [jobId]
    );

    res.json({
      success: true,
      options: options.map(o => ({
        id: String(o.id),
        label: o.option_label,
        price: Number(o.option_price),
      })),
    });
  } catch (error) {
    console.error('Error getting flat rate options:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── UPDATE FLAT RATE OPTIONS ───
const updateFlatRateOptions = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const companyId = req.user?.company_id;
    const { options } = req.body; // [{ label, price }]

    if (!options || !Array.isArray(options)) {
      return res.status(400).json({ success: false, error: 'options array required' });
    }

    connection = await connect();

    // Verify job belongs to company
    const [job] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    await connection.beginTransaction();

    await connection.execute(
      'DELETE FROM job_selected_flat_rate_options WHERE job_id = ?',
      [jobId]
    );

    for (const opt of options) {
      if (opt.label && opt.label.trim()) {
        await connection.execute(
          'INSERT INTO job_selected_flat_rate_options (job_id, option_label, option_price) VALUES (?, ?, ?)',
          [jobId, opt.label.trim(), opt.price || 0]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Options updated' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating flat rate options:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  initJobSegments,
  getJobSegments,
  startSegment,
  completeSegment,
  assignEmployeesToSegment,
  updateJobSegment,
  deleteJobSegment,
  addCustomSegment,
  updateReturnTrip,
  getFlatRateOptions,
  updateFlatRateOptions,
};

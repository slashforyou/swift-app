/**
 * Modular Templates — CRUD endpoints
 * GET    /v1/templates/modular          — List templates for company
 * POST   /v1/templates/modular          — Create template
 * GET    /v1/templates/modular/:id      — Get single template
 * PUT    /v1/templates/modular/:id      — Update template
 * DELETE /v1/templates/modular/:id      — Delete template
 */
const { connect } = require('../../swiftDb');

// ─── Helpers ───
async function loadFullTemplate(connection, templateId) {
  const [segments] = await connection.execute(
    'SELECT * FROM job_template_segments WHERE template_id = ? ORDER BY segment_order',
    [templateId]
  );
  const [options] = await connection.execute(
    'SELECT * FROM job_template_flat_rate_options WHERE template_id = ? ORDER BY display_order',
    [templateId]
  );
  return { segments, options };
}

function formatTemplate(template, segments, options) {
  return {
    id: String(template.id),
    nameKey: template.name_key || null,
    companyId: String(template.company_id),
    name: template.name,
    description: template.description || '',
    category: template.category || 'residential',
    billingMode: template.billing_mode || 'location_to_location',
    defaultHourlyRate: template.default_hourly_rate ? Number(template.default_hourly_rate) : undefined,
    minimumHours: template.minimum_hours ? Number(template.minimum_hours) : undefined,
    timeRoundingMinutes: template.time_rounding_minutes ? Number(template.time_rounding_minutes) : 15,
    returnTripDefaultMinutes: template.return_trip_default_minutes ? Number(template.return_trip_default_minutes) : undefined,
    flatRateAmount: template.flat_rate_amount ? Number(template.flat_rate_amount) : undefined,
    flatRateMaxHours: template.flat_rate_max_hours ? Number(template.flat_rate_max_hours) : undefined,
    flatRateOverageRate: template.flat_rate_overage_rate ? Number(template.flat_rate_overage_rate) : undefined,
    isDefault: !!template.is_default,
    segments: segments.map(s => ({
      id: String(s.id),
      order: s.segment_order,
      type: s.type,
      label: s.label || '',
      labelKey: s.label_key || null,
      locationType: s.location_type || undefined,
      isBillable: !!s.is_billable,
    })),
    flatRateOptions: options.map(o => ({
      id: String(o.id),
      label: o.label,
      price: Number(o.price),
      order: o.display_order,
    })),
    createdAt: template.created_at,
    updatedAt: template.updated_at,
  };
}

// ─── LIST ───
const listModularTemplates = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Company ID required' });
    }

    connection = await connect();
    const [templates] = await connection.execute(
      'SELECT * FROM job_templates_modular WHERE company_id = ? OR is_default = 1 ORDER BY is_default DESC, name ASC',
      [companyId]
    );

    const results = [];
    for (const tpl of templates) {
      const { segments, options } = await loadFullTemplate(connection, tpl.id);
      results.push(formatTemplate(tpl, segments, options));
    }

    res.json({ success: true, templates: results });
  } catch (error) {
    console.error('Error listing modular templates:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── CREATE ───
const createModularTemplate = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Company ID required' });
    }

    const {
      name, description, category, billingMode,
      defaultHourlyRate, minimumHours, timeRoundingMinutes,
      returnTripDefaultMinutes, flatRateAmount, flatRateMaxHours,
      flatRateOverageRate, segments, flatRateOptions,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    connection = await connect();
    await connection.beginTransaction();

    // Insert template
    const [result] = await connection.execute(
      `INSERT INTO job_templates_modular
       (company_id, name, description, category, billing_mode,
        default_hourly_rate, minimum_hours, time_rounding_minutes,
        return_trip_default_minutes, flat_rate_amount, flat_rate_max_hours,
        flat_rate_overage_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId, name.trim(), description || null, category || 'residential',
        billingMode || 'location_to_location',
        defaultHourlyRate || null, minimumHours || null,
        timeRoundingMinutes || 15, returnTripDefaultMinutes || null,
        flatRateAmount || null, flatRateMaxHours || null,
        flatRateOverageRate || null,
      ]
    );

    const templateId = result.insertId;

    // Insert segments
    if (segments && Array.isArray(segments)) {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        await connection.execute(
          `INSERT INTO job_template_segments
           (template_id, segment_order, type, label, location_type, is_billable)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [templateId, i + 1, seg.type, seg.label || null, seg.locationType || null, seg.isBillable !== false ? 1 : 0]
        );
      }
    }

    // Insert flat rate options
    if (flatRateOptions && Array.isArray(flatRateOptions)) {
      for (let i = 0; i < flatRateOptions.length; i++) {
        const opt = flatRateOptions[i];
        await connection.execute(
          `INSERT INTO job_template_flat_rate_options
           (template_id, label, price, display_order) VALUES (?, ?, ?, ?)`,
          [templateId, opt.label, opt.price || 0, i + 1]
        );
      }
    }

    await connection.commit();

    // Return full template
    const { segments: segs, options: opts } = await loadFullTemplate(connection, templateId);
    const [tplRows] = await connection.execute('SELECT * FROM job_templates_modular WHERE id = ?', [templateId]);

    res.status(201).json({ success: true, template: formatTemplate(tplRows[0], segs, opts) });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating modular template:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── GET ONE ───
const getModularTemplate = async (req, res) => {
  let connection;
  try {
    const templateId = req.params.id;
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Company ID required' });
    }

    connection = await connect();
    const [tplRows] = await connection.execute(
      'SELECT * FROM job_templates_modular WHERE id = ?',
      [templateId]
    );
    if (tplRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const tpl = tplRows[0];
    if (tpl.company_id !== companyId && !tpl.is_default) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { segments, options } = await loadFullTemplate(connection, tpl.id);
    res.json({ success: true, template: formatTemplate(tpl, segments, options) });
  } catch (error) {
    console.error('Error getting modular template:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── UPDATE ───
const updateModularTemplate = async (req, res) => {
  let connection;
  try {
    const templateId = req.params.id;
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Company ID required' });
    }

    const {
      name, description, category, billingMode,
      defaultHourlyRate, minimumHours, timeRoundingMinutes,
      returnTripDefaultMinutes, flatRateAmount, flatRateMaxHours,
      flatRateOverageRate, segments, flatRateOptions,
    } = req.body;

    connection = await connect();

    const [tplRows] = await connection.execute(
      'SELECT * FROM job_templates_modular WHERE id = ?',
      [templateId]
    );
    if (tplRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (tplRows[0].company_id !== companyId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await connection.beginTransaction();

    await connection.execute(
      `UPDATE job_templates_modular SET
       name = ?, description = ?, category = ?, billing_mode = ?,
       default_hourly_rate = ?, minimum_hours = ?, time_rounding_minutes = ?,
       return_trip_default_minutes = ?, flat_rate_amount = ?,
       flat_rate_max_hours = ?, flat_rate_overage_rate = ?
       WHERE id = ?`,
      [
        name || tplRows[0].name, description !== undefined ? description : tplRows[0].description,
        category || tplRows[0].category, billingMode || tplRows[0].billing_mode,
        defaultHourlyRate !== undefined ? defaultHourlyRate : tplRows[0].default_hourly_rate,
        minimumHours !== undefined ? minimumHours : tplRows[0].minimum_hours,
        timeRoundingMinutes !== undefined ? timeRoundingMinutes : tplRows[0].time_rounding_minutes,
        returnTripDefaultMinutes !== undefined ? returnTripDefaultMinutes : tplRows[0].return_trip_default_minutes,
        flatRateAmount !== undefined ? flatRateAmount : tplRows[0].flat_rate_amount,
        flatRateMaxHours !== undefined ? flatRateMaxHours : tplRows[0].flat_rate_max_hours,
        flatRateOverageRate !== undefined ? flatRateOverageRate : tplRows[0].flat_rate_overage_rate,
        templateId,
      ]
    );

    // Replace segments if provided
    if (segments && Array.isArray(segments)) {
      await connection.execute('DELETE FROM job_template_segments WHERE template_id = ?', [templateId]);
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        await connection.execute(
          `INSERT INTO job_template_segments
           (template_id, segment_order, type, label, location_type, is_billable)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [templateId, i + 1, seg.type, seg.label || null, seg.locationType || null, seg.isBillable !== false ? 1 : 0]
        );
      }
    }

    // Replace flat rate options if provided
    if (flatRateOptions && Array.isArray(flatRateOptions)) {
      await connection.execute('DELETE FROM job_template_flat_rate_options WHERE template_id = ?', [templateId]);
      for (let i = 0; i < flatRateOptions.length; i++) {
        const opt = flatRateOptions[i];
        await connection.execute(
          `INSERT INTO job_template_flat_rate_options
           (template_id, label, price, display_order) VALUES (?, ?, ?, ?)`,
          [templateId, opt.label, opt.price || 0, i + 1]
        );
      }
    }

    await connection.commit();

    const { segments: segs, options: opts } = await loadFullTemplate(connection, templateId);
    const [updated] = await connection.execute('SELECT * FROM job_templates_modular WHERE id = ?', [templateId]);

    res.json({ success: true, template: formatTemplate(updated[0], segs, opts) });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating modular template:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── DELETE ───
const deleteModularTemplate = async (req, res) => {
  let connection;
  try {
    const templateId = req.params.id;
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Company ID required' });
    }

    connection = await connect();
    const [tplRows] = await connection.execute(
      'SELECT * FROM job_templates_modular WHERE id = ?',
      [templateId]
    );
    if (tplRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (tplRows[0].company_id !== companyId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    if (tplRows[0].is_default) {
      return res.status(400).json({ success: false, error: 'Cannot delete default templates' });
    }

    // CASCADE handles child tables (job_template_segments, job_template_flat_rate_options)
    await connection.execute('DELETE FROM job_templates_modular WHERE id = ?', [templateId]);

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting modular template:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  listModularTemplates,
  createModularTemplate,
  getModularTemplate,
  updateModularTemplate,
  deleteModularTemplate,
};

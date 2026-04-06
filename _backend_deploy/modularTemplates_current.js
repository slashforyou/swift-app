/**
 * Modular Job Templates ÔÇö CRUD Endpoints
 * GET    /v1/templates/modular         ÔÇö List templates for company
 * POST   /v1/templates/modular         ÔÇö Create template
 * GET    /v1/templates/modular/:id     ÔÇö Get template detail
 * PUT    /v1/templates/modular/:id     ÔÇö Update template
 * DELETE /v1/templates/modular/:id     ÔÇö Delete template
 */
const { connect } = require('../../swiftDb');

// ÔöÇÔöÇÔöÇ Helper: load full template with segments + options ÔöÇÔöÇÔöÇ
async function loadFullTemplate(connection, templateId) {
  const [rows] = await connection.execute(
    'SELECT * FROM job_templates_modular WHERE id = ?', [templateId]
  );
  if (rows.length === 0) return null;

  const template = rows[0];

  const [segments] = await connection.execute(
    'SELECT * FROM job_template_segments WHERE template_id = ? ORDER BY segment_order', [templateId]
  );

  const [options] = await connection.execute(
    'SELECT * FROM job_template_flat_rate_options WHERE template_id = ? ORDER BY display_order', [templateId]
  );

  return formatTemplate(template, segments, options);
}

function formatTemplate(template, segments, options) {
  return {
    id: String(template.id),
    name: template.name,
    description: template.description || '',
    category: template.category || 'residential',
    billingMode: template.billing_mode,
    segments: segments.map(s => ({
      id: String(s.id),
      order: s.segment_order,
      type: s.type,
      label: s.label || '',
      locationType: s.location_type || undefined,
      isBillable: !!s.is_billable,
      estimatedDurationMinutes: s.estimated_duration_minutes || undefined,
      requiredRoles: s.required_roles ? (typeof s.required_roles === 'string' ? JSON.parse(s.required_roles) : s.required_roles) : undefined,
    })),
    defaultHourlyRate: template.default_hourly_rate ? Number(template.default_hourly_rate) : undefined,
    minimumHours: template.minimum_hours ? Number(template.minimum_hours) : undefined,
    timeRoundingMinutes: template.time_rounding_minutes,
    returnTripDefaultMinutes: template.return_trip_default_minutes || undefined,
    flatRateAmount: template.flat_rate_amount ? Number(template.flat_rate_amount) : undefined,
    flatRateMaxHours: template.flat_rate_max_hours ? Number(template.flat_rate_max_hours) : undefined,
    flatRateOverageRate: template.flat_rate_overage_rate ? Number(template.flat_rate_overage_rate) : undefined,
    flatRateOptions: options.map(o => ({
      id: String(o.id),
      label: o.label,
      price: Number(o.price),
    })),
    isDefault: !!template.is_default,
    companyId: template.company_id,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
  };
}

// ÔöÇÔöÇÔöÇ LIST ÔöÇÔöÇÔöÇ
const listModularTemplates = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(403).json({ success: false, error: 'No company_id' });

    connection = await connect();
    const [templates] = await connection.execute(
      'SELECT * FROM job_templates_modular WHERE company_id = ? ORDER BY is_default DESC, name ASC',
      [companyId]
    );

    const results = [];
    for (const t of templates) {
      const full = await loadFullTemplate(connection, t.id);
      if (full) results.push(full);
    }

    res.json({ success: true, templates: results });
  } catch (error) {
    console.error('Error listing modular templates:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ÔöÇÔöÇÔöÇ CREATE ÔöÇÔöÇÔöÇ
const createModularTemplate = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(403).json({ success: false, error: 'No company_id' });

    const {
      name, description, category, billingMode,
      segments, defaultHourlyRate, minimumHours, timeRoundingMinutes,
      returnTripDefaultMinutes, flatRateAmount, flatRateMaxHours,
      flatRateOverageRate, flatRateOptions,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    connection = await connect();
    await connection.beginTransaction();

    // Insert template
    const [result] = await connection.execute(
      INSERT INTO job_templates_modular
       (company_id, name, description, category, billing_mode,
        default_hourly_rate, minimum_hours, time_rounding_minutes,
        return_trip_default_minutes, flat_rate_amount, flat_rate_max_hours,
        flat_rate_overage_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
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
    if (segments && segments.length > 0) {
      for (const seg of segments) {
        await connection.execute(
          INSERT INTO job_template_segments
           (template_id, segment_order, type, label, location_type, is_billable,
            estimated_duration_minutes, required_roles)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?),
          [
            templateId, seg.order, seg.type, seg.label || null,
            seg.locationType || null, seg.isBillable !== false ? 1 : 0,
            seg.estimatedDurationMinutes || null,
            seg.requiredRoles ? JSON.stringify(seg.requiredRoles) : null,
          ]
        );
      }
    }

    // Insert flat rate options
    if (flatRateOptions && flatRateOptions.length > 0) {
      for (let i = 0; i < flatRateOptions.length; i++) {
        const opt = flatRateOptions[i];
        if (opt.label && opt.label.trim()) {
          await connection.execute(
            INSERT INTO job_template_flat_rate_options
             (template_id, label, price, display_order)
             VALUES (?, ?, ?, ?),
            [templateId, opt.label.trim(), opt.price || 0, i]
          );
        }
      }
    }

    await connection.commit();

    const full = await loadFullTemplate(connection, templateId);
    res.status(201).json({ success: true, template: full });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating modular template:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ÔöÇÔöÇÔöÇ GET ONE ÔöÇÔöÇÔöÇ
const getModularTemplate = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const templateId = req.params.id;

    connection = await connect();
    const template = await loadFullTemplate(connection, templateId);

    if (!template || template.companyId !== companyId) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('Error getting modular template:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ÔöÇÔöÇÔöÇ UPDATE ÔöÇÔöÇÔöÇ
const updateModularTemplate = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const templateId = req.params.id;

    connection = await connect();

    // Verify ownership
    const [existing] = await connection.execute(
      'SELECT id, company_id FROM job_templates_modular WHERE id = ?', [templateId]
    );
    if (existing.length === 0 || existing[0].company_id !== companyId) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const {
      name, description, category, billingMode,
      segments, defaultHourlyRate, minimumHours, timeRoundingMinutes,
      returnTripDefaultMinutes, flatRateAmount, flatRateMaxHours,
      flatRateOverageRate, flatRateOptions,
    } = req.body;

    await connection.beginTransaction();

    // Update template row
    await connection.execute(
      UPDATE job_templates_modular SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        billing_mode = COALESCE(?, billing_mode),
        default_hourly_rate = COALESCE(?, default_hourly_rate),
        minimum_hours = COALESCE(?, minimum_hours),
        time_rounding_minutes = COALESCE(?, time_rounding_minutes),
        return_trip_default_minutes = ?,
        flat_rate_amount = ?,
        flat_rate_max_hours = ?,
        flat_rate_overage_rate = ?
       WHERE id = ?,
      [
        name || null, description !== undefined ? description : null,
        category || null, billingMode || null,
        defaultHourlyRate || null, minimumHours || null,
        timeRoundingMinutes || null,
        returnTripDefaultMinutes || null,
        flatRateAmount || null, flatRateMaxHours || null,
        flatRateOverageRate || null,
        templateId,
      ]
    );

    // Replace segments if provided
    if (segments) {
      await connection.execute(
        'DELETE FROM job_template_segments WHERE template_id = ?', [templateId]
      );
      for (const seg of segments) {
        await connection.execute(
          INSERT INTO job_template_segments
           (template_id, segment_order, type, label, location_type, is_billable,
            estimated_duration_minutes, required_roles)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?),
          [
            templateId, seg.order, seg.type, seg.label || null,
            seg.locationType || null, seg.isBillable !== false ? 1 : 0,
            seg.estimatedDurationMinutes || null,
            seg.requiredRoles ? JSON.stringify(seg.requiredRoles) : null,
          ]
        );
      }
    }

    // Replace flat rate options if provided
    if (flatRateOptions !== undefined) {
      await connection.execute(
        'DELETE FROM job_template_flat_rate_options WHERE template_id = ?', [templateId]
      );
      if (flatRateOptions && flatRateOptions.length > 0) {
        for (let i = 0; i < flatRateOptions.length; i++) {
          const opt = flatRateOptions[i];
          if (opt.label && opt.label.trim()) {
            await connection.execute(
              INSERT INTO job_template_flat_rate_options
               (template_id, label, price, display_order)
               VALUES (?, ?, ?, ?),
              [templateId, opt.label.trim(), opt.price || 0, i]
            );
          }
        }
      }
    }

    await connection.commit();

    const full = await loadFullTemplate(connection, templateId);
    res.json({ success: true, template: full });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating modular template:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ÔöÇÔöÇÔöÇ DELETE ÔöÇÔöÇÔöÇ
const deleteModularTemplate = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const templateId = req.params.id;

    connection = await connect();

    const [existing] = await connection.execute(
      'SELECT id, company_id, is_default FROM job_templates_modular WHERE id = ?', [templateId]
    );
    if (existing.length === 0 || existing[0].company_id !== companyId) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (existing[0].is_default) {
      return res.status(400).json({ success: false, error: 'Cannot delete default template' });
    }

    // CASCADE will delete segments and options
    await connection.execute(
      'DELETE FROM job_templates_modular WHERE id = ?', [templateId]
    );

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

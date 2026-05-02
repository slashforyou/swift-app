/**
 * Patch jobSegments.js :
 * 1. service_type dans formatSegmentInstance
 * 2. Endpoint PATCH /:id/segments/:segId — modifier un segment futur
 * 3. Endpoint DELETE /:id/segments/:segId — supprimer un segment futur
 * 4. Endpoint POST /:id/segments/add — ajouter un segment custom à un job en cours
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'endPoints/v1/jobSegments.js');
let content = fs.readFileSync(FILE, 'utf8');
const original = content;

// 1. Mettre à jour formatSegmentInstance pour inclure service_type
content = content.replace(
  `function formatSegmentInstance(seg) {
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
}`,
  `function formatSegmentInstance(seg) {
  return {
    id: String(seg.id),
    templateSegmentId: seg.template_segment_id ? String(seg.template_segment_id) : undefined,
    order: seg.segment_order,
    type: seg.type,
    serviceType: seg.service_type || undefined,
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
}`
);

// 2. Ajouter les 3 nouveaux endpoints avant module.exports
const newEndpoints = `
// ─── PATCH SEGMENT (futur uniquement) ───
const updateJobSegment = async (req, res) => {
  let connection;
  try {
    const { id: jobId, segId } = req.params;
    const { label, type, serviceType, locationType, isBillable, order } = req.body;

    connection = await connect();
    const [seg] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ? AND job_id = ?',
      [segId, jobId]
    );
    if (seg.length === 0) return res.status(404).json({ success: false, error: 'Segment not found' });
    if (seg[0].started_at) {
      return res.status(400).json({ success: false, error: 'Cannot modify a segment that has already started' });
    }

    const updates = [];
    const params = [];
    if (label !== undefined)      { updates.push('label = ?');       params.push(label); }
    if (type !== undefined)       { updates.push('type = ?');         params.push(type); }
    if (serviceType !== undefined){ updates.push('service_type = ?'); params.push(serviceType || null); }
    if (locationType !== undefined){ updates.push('location_type = ?');params.push(locationType || null); }
    if (isBillable !== undefined) { updates.push('is_billable = ?');  params.push(isBillable ? 1 : 0); }
    if (order !== undefined)      { updates.push('segment_order = ?');params.push(order); }

    if (updates.length === 0) return res.status(400).json({ success: false, error: 'Nothing to update' });

    params.push(segId);
    await connection.execute(
      \`UPDATE job_segment_instances SET \${updates.join(', ')} WHERE id = ?\`,
      params
    );

    const [updated] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ?', [segId]
    );
    res.json({ success: true, segment: formatSegmentInstance(updated[0]) });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── DELETE SEGMENT (futur uniquement) ───
const deleteJobSegment = async (req, res) => {
  let connection;
  try {
    const { id: jobId, segId } = req.params;
    connection = await connect();

    const [seg] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ? AND job_id = ?',
      [segId, jobId]
    );
    if (seg.length === 0) return res.status(404).json({ success: false, error: 'Segment not found' });
    if (seg[0].started_at) {
      return res.status(400).json({ success: false, error: 'Cannot delete a segment that has already started' });
    }

    await connection.execute('DELETE FROM job_segment_instances WHERE id = ?', [segId]);
    res.json({ success: true, message: 'Segment deleted' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

// ─── ADD CUSTOM SEGMENT (job en cours) ───
const addCustomSegment = async (req, res) => {
  let connection;
  try {
    const jobId = req.params.id;
    const { type, serviceType, label, locationType, isBillable, order } = req.body;

    const VALID_TYPES = ['location', 'travel', 'storage', 'loading', 'service'];
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: 'Valid type required' });
    }
    if (!label || !label.trim()) {
      return res.status(400).json({ success: false, error: 'Label required' });
    }

    connection = await connect();
    const [job] = await connection.execute(
      "SELECT id, status FROM jobs WHERE id = ?",
      [jobId]
    );
    if (job.length === 0) return res.status(404).json({ success: false, error: 'Job not found' });

    const MODIFIABLE_STATUSES = ['pending', 'accepted', 'in-progress'];
    if (!MODIFIABLE_STATUSES.includes(job[0].status)) {
      return res.status(400).json({ success: false, error: 'Job is not in a modifiable state' });
    }

    // Determine order — append after last non-started segment
    let segmentOrder = order;
    if (!segmentOrder) {
      const [lastSeg] = await connection.execute(
        'SELECT MAX(segment_order) as max_order FROM job_segment_instances WHERE job_id = ?',
        [jobId]
      );
      segmentOrder = (lastSeg[0].max_order || 0) + 1;
    }

    const [result] = await connection.execute(
      `INSERT INTO job_segment_instances
       (job_id, template_segment_id, segment_order, type, service_type, label,
        location_type, is_billable, is_return_trip)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0)`,
      [
        jobId, segmentOrder, type, serviceType || null, label.trim(),
        locationType || null, isBillable !== false ? 1 : 0,
      ]
    );

    const [created] = await connection.execute(
      'SELECT * FROM job_segment_instances WHERE id = ?', [result.insertId]
    );
    res.status(201).json({ success: true, segment: formatSegmentInstance(created[0]) });
  } catch (error) {
    console.error('Error adding custom segment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    if (connection) connection.release();
  }
};

`;

content = content.replace(
  '// ─── Helper ───',
  newEndpoints + '// ─── Helper ───'
);

// 3. Exporter les nouvelles fonctions
content = content.replace(
  `module.exports = {
  initJobSegments,
  getJobSegments,
  startSegment,
  completeSegment,
  assignEmployeesToSegment,
  updateReturnTrip,
  getFlatRateOptions,
  updateFlatRateOptions,
};`,
  `module.exports = {
  initJobSegments,
  getJobSegments,
  startSegment,
  completeSegment,
  assignEmployeesToSegment,
  updateReturnTrip,
  getFlatRateOptions,
  updateFlatRateOptions,
  updateJobSegment,
  deleteJobSegment,
  addCustomSegment,
};`
);

if (content === original) {
  console.error('❌ Aucune modification appliquée');
  process.exit(1);
}
fs.writeFileSync(FILE, content, 'utf8');
console.log('✅ jobSegments.js patché avec 3 nouveaux endpoints + service_type');

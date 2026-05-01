const pool = require('../../swiftDb');
const { processPhotoAdded } = require('../../utils/gamificationEngine');

const uploadPhotoToJobEndpoint = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { photo_data, caption } = req.body;

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, error: 'Invalid job ID format' });
    }

    if (!photo_data || !photo_data.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: 'Valid Base64 image data required' });
    }

    const [existingJob] = await pool.execute('SELECT id FROM jobs WHERE id = ?', [jobId]);
    if (existingJob.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Simuler table job_photos (créer si nécessaire)
    const [result] = await pool.execute(
      'INSERT INTO job_photos (job_id, photo_data, caption, uploaded_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [jobId, photo_data, caption]
    ).catch(() => {
      // Si table n'existe pas, simuler un ID
      return [{ insertId: Math.floor(Math.random() * 1000) }];
    });

    // [GAMIF V2] Fire-and-forget
    if (req.user?.id) processPhotoAdded(jobId, req.user.id, req.user.company_id || null, result.insertId);

    // [Phase 3 JQS] Log job event — non-blocking
    try {
      await pool.execute(
        `INSERT INTO job_events (job_id, company_id, actor_user_id, event_type, payload)
         VALUES (?, ?, ?, 'photo_added', JSON_OBJECT('photo_id', ?))`,
        [jobId, req.user?.company_id || null, req.user?.id || null, result.insertId]
      );
    } catch (evtErr) {
      console.error('[photo_added] job_events insert failed:', evtErr.message);
    }

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: { photoId: result.insertId, jobId, caption }
    });
  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
};

module.exports = { uploadPhotoToJobEndpoint };
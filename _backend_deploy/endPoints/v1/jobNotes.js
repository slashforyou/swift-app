const pool = require('../../swiftDb');

/**
 * GET /v1/jobs/:jobId/notes
 * Returns all internal notes for a job (company-scoped).
 */
const getJobNotes = async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;
    if (!userId || !companyId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { jobId } = req.params;

    // Verify the job belongs to this company
    const [jobCheck] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (!jobCheck.length) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const [notes] = await pool.execute(
      `SELECT
         n.id,
         n.job_id,
         n.user_id,
         n.content,
         n.created_at,
         n.updated_at,
         u.name AS author_name,
         u.avatar_url AS author_avatar
       FROM job_notes n
       JOIN users u ON u.id = n.user_id
       WHERE n.job_id = ? AND n.deleted_at IS NULL
       ORDER BY n.created_at ASC`,
      [jobId]
    );

    return res.json({ success: true, notes });
  } catch (err) {
    console.error('[jobNotes] getJobNotes error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * POST /v1/jobs/:jobId/notes
 * Body: { content: string }
 */
const createJobNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;
    if (!userId || !companyId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { jobId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const trimmed = content.trim().slice(0, 2000);

    // Verify the job belongs to this company
    const [jobCheck] = await pool.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (!jobCheck.length) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const [result] = await pool.execute(
      'INSERT INTO job_notes (job_id, user_id, content) VALUES (?, ?, ?)',
      [jobId, userId, trimmed]
    );

    const [rows] = await pool.execute(
      `SELECT
         n.id,
         n.job_id,
         n.user_id,
         n.content,
         n.created_at,
         n.updated_at,
         u.name AS author_name,
         u.avatar_url AS author_avatar
       FROM job_notes n
       JOIN users u ON u.id = n.user_id
       WHERE n.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, note: rows[0] });
  } catch (err) {
    console.error('[jobNotes] createJobNote error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * DELETE /v1/jobs/:jobId/notes/:noteId
 * Only the author (or admin) can delete their note.
 */
const deleteJobNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;
    const userRole = req.user?.company_role;
    if (!userId || !companyId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { jobId, noteId } = req.params;

    const [noteCheck] = await pool.execute(
      `SELECT n.id, n.user_id
       FROM job_notes n
       JOIN jobs j ON j.id = n.job_id
       WHERE n.id = ? AND n.job_id = ? AND j.company_id = ? AND n.deleted_at IS NULL`,
      [noteId, jobId, companyId]
    );

    if (!noteCheck.length) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const note = noteCheck[0];
    const isOwner = String(note.user_id) === String(userId);
    const isAdmin = userRole === 'admin' || userRole === 'owner';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await pool.execute(
      'UPDATE job_notes SET deleted_at = NOW() WHERE id = ?',
      [noteId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[jobNotes] deleteJobNote error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { getJobNotes, createJobNote, deleteJobNote };

/**
 * jobAttachments.js — Pièces jointes sur les jobs
 *
 * Routes:
 *   GET    /v1/jobs/:jobId/attachments           → liste les pièces jointes (company-scoped)
 *   POST   /v1/jobs/:jobId/attachments           → ajouter une pièce jointe
 *   DELETE /v1/jobs/:jobId/attachments/:id       → supprimer une pièce jointe
 *
 * Table: job_attachments (migration 037)
 */

const { connect } = require('../../swiftDb');

/* ─── GET /v1/jobs/:jobId/attachments ─────────────────────────────────────── */
const listAttachments = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const connection = await connect();
  try {
    // Vérifier que le job appartient à cette company
    const [jobCheck] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (!jobCheck.length) return res.status(404).json({ success: false, message: 'Job not found' });

    const [rows] = await connection.execute(
      `SELECT a.id, a.file_name, a.file_url, a.file_type, a.file_size_kb, a.label,
              a.created_at, u.first_name, u.last_name
       FROM job_attachments a
       JOIN users u ON u.id = a.uploaded_by
       WHERE a.job_id = ? AND a.company_id = ?
       ORDER BY a.created_at DESC`,
      [jobId, companyId]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/jobs/:jobId/attachments ────────────────────────────────────── */
const addAttachment = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const { file_url, file_name, file_type, file_size_kb, label } = req.body;
  if (!file_url || !file_name) {
    return res.status(400).json({ success: false, message: 'file_url and file_name are required' });
  }

  const VALID_TYPES = ['pdf', 'image', 'document', 'other'];
  const resolvedType = VALID_TYPES.includes(file_type) ? file_type : 'other';
  const resolvedSize = Math.max(0, parseInt(file_size_kb, 10) || 0);

  const connection = await connect();
  try {
    // Vérifier ownership du job
    const [jobCheck] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (!jobCheck.length) return res.status(404).json({ success: false, message: 'Job not found' });

    const [result] = await connection.execute(
      `INSERT INTO job_attachments (job_id, company_id, uploaded_by, file_name, file_url, file_type, file_size_kb, label)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [jobId, companyId, userId, file_name, file_url, resolvedType, resolvedSize, label || null]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── DELETE /v1/jobs/:jobId/attachments/:id ──────────────────────────────── */
const deleteAttachment = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  const attachId = parseInt(req.params.id, 10);
  if (isNaN(jobId) || isNaN(attachId)) {
    return res.status(400).json({ success: false, message: 'Invalid parameters' });
  }

  const connection = await connect();
  try {
    const [result] = await connection.execute(
      'DELETE FROM job_attachments WHERE id = ? AND job_id = ? AND company_id = ?',
      [attachId, jobId, companyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { listAttachments, addAttachment, deleteAttachment };

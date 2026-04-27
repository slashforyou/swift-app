/**
 * jobLinks.js — Liaison entre jobs (interstate, follow-up, related)
 *
 * Routes:
 *   GET    /v1/jobs/:jobId/links                 → liste les jobs liés avec détails
 *   POST   /v1/jobs/:jobId/links                 → lier deux jobs (bidirectionnel)
 *   DELETE /v1/jobs/:jobId/links/:linkedJobId    → supprimer le lien (deux sens)
 *
 * Table: job_links (migration 038)
 * Note: la relation est insérée dans les 2 sens pour symétrie.
 */

const { connect } = require('../../swiftDb');

/* ─── GET /v1/jobs/:jobId/links ───────────────────────────────────────────── */
const listLinks = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const connection = await connect();
  try {
    // Vérifier ownership du job source
    const [jobCheck] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (!jobCheck.length) return res.status(404).json({ success: false, message: 'Job not found' });

    const [rows] = await connection.execute(
      `SELECT jl.id, jl.linked_job_id, jl.link_type, jl.created_at,
              j.code AS linked_job_code, j.status AS linked_job_status,
              j.company_id AS linked_job_company_id
       FROM job_links jl
       JOIN jobs j ON j.id = jl.linked_job_id
       WHERE jl.job_id = ?
       ORDER BY jl.created_at DESC`,
      [jobId]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── POST /v1/jobs/:jobId/links ──────────────────────────────────────────── */
const createLink = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  if (isNaN(jobId)) return res.status(400).json({ success: false, message: 'Invalid jobId' });

  const { linked_job_id, link_type } = req.body;
  const linkedJobId = parseInt(linked_job_id, 10);
  if (isNaN(linkedJobId)) return res.status(400).json({ success: false, message: 'Invalid linked_job_id' });
  if (linkedJobId === jobId) return res.status(400).json({ success: false, message: 'Cannot link a job to itself' });

  const VALID_TYPES = ['interstate', 'follow_up', 'related'];
  const resolvedType = VALID_TYPES.includes(link_type) ? link_type : 'related';

  const connection = await connect();
  try {
    // Vérifier ownership du job source
    const [jobCheck] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (!jobCheck.length) return res.status(404).json({ success: false, message: 'Job not found' });

    // Vérifier que le job lié existe (pas forcément même company)
    const [linkedCheck] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ?',
      [linkedJobId]
    );
    if (!linkedCheck.length) return res.status(404).json({ success: false, message: 'Linked job not found' });

    // Insérer les 2 sens avec IGNORE pour éviter doublon (contrainte UNIQUE)
    await connection.execute(
      'INSERT IGNORE INTO job_links (job_id, linked_job_id, link_type, created_by) VALUES (?, ?, ?, ?)',
      [jobId, linkedJobId, resolvedType, userId]
    );
    await connection.execute(
      'INSERT IGNORE INTO job_links (job_id, linked_job_id, link_type, created_by) VALUES (?, ?, ?, ?)',
      [linkedJobId, jobId, resolvedType, userId]
    );
    return res.status(201).json({ success: true, message: 'Jobs linked' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

/* ─── DELETE /v1/jobs/:jobId/links/:linkedJobId ───────────────────────────── */
const deleteLink = async (req, res) => {
  const userId = req.user?.id;
  const companyId = req.user?.company_id;
  if (!userId || !companyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const jobId = parseInt(req.params.jobId, 10);
  const linkedJobId = parseInt(req.params.linkedJobId, 10);
  if (isNaN(jobId) || isNaN(linkedJobId)) {
    return res.status(400).json({ success: false, message: 'Invalid parameters' });
  }

  const connection = await connect();
  try {
    // Vérifier ownership du job source (le demandeur doit posséder au moins un des deux)
    const [jobCheck] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND company_id = ?',
      [jobId, companyId]
    );
    if (!jobCheck.length) return res.status(403).json({ success: false, message: 'Access denied' });

    // Supprimer les 2 sens
    await connection.execute(
      'DELETE FROM job_links WHERE (job_id = ? AND linked_job_id = ?) OR (job_id = ? AND linked_job_id = ?)',
      [jobId, linkedJobId, linkedJobId, jobId]
    );
    return res.status(200).json({ success: true, message: 'Link removed' });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    await connection.end();
  }
};

module.exports = { listLinks, createLink, deleteLink };

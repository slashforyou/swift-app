const pool = require('../../swiftDb');
const { logJobAction } = require('../../utils/jobActionLogger');

/**
 * Archive (soft-delete) a job — sets status to 'archived'
 * DELETE /swift-app/v1/job/:id
 *
 * Permissions:
 * - Admin / Manager / Dispatcher from the contractee company only
 * - Job must be in a non-active status (pending, draft, declined)
 *
 * Purpose: preserve job data for analysis of common creation mistakes
 */
const archiveJobByIdEndpoint = async (req, res) => {
  console.log('[ Archive Job by ID ]', { method: req.method, url: req.originalUrl, params: req.params });

  try {
    const jobId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const userCompanyId = req.user?.company_id;
    const userRole = req.user?.role;

    // Auth guard
    if (!userId || !userCompanyId) {
      return res.status(403).json({ success: false, error: 'Access denied — missing user context' });
    }

    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, error: 'Invalid job ID format' });
    }

    // Role guard — only admin / manager / dispatcher can archive
    const allowedRoles = ['admin', 'manager', 'dispatcher'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to archive this job' });
    }

    // Fetch job
    const [rows] = await pool.execute(
      'SELECT id, status, contractee_company_id FROM jobs WHERE id = ?',
      [jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const job = rows[0];

    // Company isolation — only the contractee (owner) company can archive
    if (parseInt(job.contractee_company_id) !== parseInt(userCompanyId)) {
      return res.status(403).json({ success: false, error: 'Access denied — you do not own this job' });
    }

    // Status guard — cannot archive a job that is in progress or completed
    const archivableStatuses = ['pending', 'draft', 'declined'];
    if (!archivableStatuses.includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: `Job cannot be archived from status: ${job.status}`,
        currentStatus: job.status
      });
    }

    // Soft-delete: set status to 'archived'
    await pool.execute(
      'UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['archived', jobId]
    );

    // Log the action (non-blocking)
    try {
      await logJobAction(jobId, userId, 'archived', { reason: 'user_initiated', previous_status: job.status });
    } catch (_) { /* non-critical */ }

    return res.json({
      success: true,
      message: 'Job archived successfully',
      jobId,
      status: 'archived'
    });

  } catch (error) {
    console.error('❌ [archiveJobById] Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { archiveJobByIdEndpoint };

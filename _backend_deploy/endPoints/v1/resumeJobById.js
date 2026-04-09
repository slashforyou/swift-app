const { logJobAction } = require('../../utils/jobActionLogger');
const pool = require('../../swiftDb');
const { notifyJobStatusChange } = require('./startJobById');

const resumeJobByIdEndpoint = async (req, res) => {
  console.log('[ Resume Job by ID ]', { method: req.method, url: req.originalUrl, params: req.params });

  try {
    const jobId = parseInt(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID format'
      });
    }

    const [existingJob] = await pool.execute(
      'SELECT id, status FROM jobs WHERE id = ?',
      [jobId]
    );

    if (existingJob.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const currentStatus = existingJob[0].status;

    if (currentStatus !== 'paused') {
      return res.status(400).json({
        success: false,
        error: `Job can only be resumed from paused status. Current status: ${currentStatus}`,
        currentStatus
      });
    }

    await pool.execute(
      'UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['resumed', jobId]
    );

    console.log(`✅ Job ${jobId} resumed successfully (previous status: ${currentStatus})`);

    logJobAction({ jobId, actionType: 'job_resumed', userId: req.user?.id, companyId: req.user?.company_id, actorRole: req.user?.role || 'employee', permissionLevel: 'manager', oldStatus: currentStatus, newStatus: 'resumed' });

    // ── Push notifications ──
    await notifyJobStatusChange(pool, jobId, 'resumed', req.user?.id);

    res.json({
      success: true,
      message: 'Job resumed successfully',
      data: {
        jobId,
        previousStatus: currentStatus,
        newStatus: 'resumed',
        resumedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error resuming job:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

module.exports = { resumeJobByIdEndpoint };

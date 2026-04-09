const { logJobAction } = require('../../utils/jobActionLogger');
const { connect, close } = require('../../swiftDb');
const { notifyCompany, sendPushToUser, insertNotification } = require('../../utils/pushHelper');

/**
 * Notify all assigned staff + company managers when a job changes status.
 * Non-blocking.
 */
async function notifyJobStatusChange(connection, jobId, newStatus, triggeredByUserId) {
  try {
    // Get job info
    const [jobRows] = await connection.execute(
      'SELECT code, contractor_company_id, contractee_company_id FROM jobs WHERE id = ?',
      [jobId]
    );
    if (!jobRows.length) return;
    const job = jobRows[0];
    const jobCode = job.code || jobId;

    const statusLabels = {
      started: { emoji: '▶️', label: 'démarré' },
      paused: { emoji: '⏸️', label: 'en pause' },
      resumed: { emoji: '▶️', label: 'repris' },
      completed: { emoji: '✅', label: 'terminé' },
    };
    const info = statusLabels[newStatus] || { emoji: '🔔', label: newStatus };
    const title = `${info.emoji} Job ${jobCode} ${info.label}`;
    const body = `Le job #${jobCode} est maintenant ${info.label}.`;

    // Find all assigned staff for this job (excluding the person who triggered the action)
    const [assignedStaff] = await connection.execute(
      `SELECT DISTINCT resource_id AS user_id
       FROM job_assignments
       WHERE job_id = ? AND resource_type = 'staff' AND status = 'confirmed'
         AND resource_id != ?`,
      [jobId, triggeredByUserId || 0]
    );

    // Notify each assigned staff member
    for (const staff of assignedStaff) {
      await sendPushToUser(connection, staff.user_id, title, body, {
        type: 'job_status_change',
        job_id: String(jobId),
        job_code: String(jobCode),
        new_status: newStatus,
        screen: 'Calendar',
      });
      await insertNotification(connection, staff.user_id, 'job_update', title, body, jobId, 'normal');
    }

    // Notify contractee (boss) if different from the triggering user's company
    if (job.contractee_company_id && job.contractee_company_id !== job.contractor_company_id) {
      await notifyCompany(connection, job.contractee_company_id, 'job_update', title, body, {
        jobId,
        pushData: {
          type: 'job_status_change',
          job_id: String(jobId),
          job_code: String(jobCode),
          new_status: newStatus,
          screen: 'Calendar',
        },
      });
    }
  } catch (err) {
    console.warn('[notifyJobStatusChange] Non-blocking error:', err.message);
  }
}

const startJobByIdEndpoint = async (req, res) => {
  console.log('[ Start Job by ID ]', { method: req.method, url: req.originalUrl, params: req.params });

  let connection;
  try {
    const jobIdOrCode = req.params.id;

    if (!jobIdOrCode) {
      return res.status(400).json({
        success: false,
        error: 'Job ID or code is required'
      });
    }

    connection = await connect();

    let jobQuery, jobParams;
    if (/^\d+$/.test(jobIdOrCode)) {
      jobQuery = 'SELECT id, code, status FROM jobs WHERE id = ?';
      jobParams = [parseInt(jobIdOrCode)];
    } else {
      jobQuery = 'SELECT id, code, status FROM jobs WHERE code = ?';
      jobParams = [jobIdOrCode];
    }

    const [existingJob] = await connection.execute(jobQuery, jobParams);

    if (existingJob.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const job = existingJob[0];
    const jobId = job.id;
    const currentStatus = job.status;

    const startableStatuses = ['pending', 'scheduled'];
    if (!startableStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Job cannot be started from status: ${currentStatus}. Only pending or scheduled jobs can be started.`,
        currentStatus
      });
    }

    await connection.execute(
      'UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['started', jobId]
    );

    console.log(`✅ Job ${jobId} started successfully (previous status: ${currentStatus})`);

    logJobAction({ jobId, actionType: 'job_started', userId: req.user?.id, companyId: req.user?.company_id, actorRole: req.user?.role || 'employee', permissionLevel: 'manager', oldStatus: currentStatus, newStatus: 'started' });

    // ── Push notifications ──
    await notifyJobStatusChange(connection, jobId, 'started', req.user?.id);

    res.json({
      success: true,
      message: 'Job started successfully',
      data: {
        jobId,
        previousStatus: currentStatus,
        newStatus: 'started',
        startedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error starting job:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  } finally {
    if (connection) close(connection);
  }
};

module.exports = { startJobByIdEndpoint, notifyJobStatusChange };

/**
 * Accept Job Endpoint
 * POST /v1/job/:id/accept    (singular — legacy)
 * POST /v1/jobs/:id/accept   (plural   — frontend uses this)
 *
 * :id can be a numeric job ID OR a job code string (e.g. JOB-NERD-001)
 *
 * Permet à un membre de la company assignée (contractor) d'accepter un job.
 * Change assignment_status de 'pending' à 'accepted'.
 * Notifie le contractee (push + DB).
 */

const { connect } = require('../../swiftDb');
const { logJobAction } = require('../../utils/jobActionLogger');
const { notifyCompany } = require('../../utils/pushHelper');

const acceptJobEndpoint = async (req, res) => {
  console.log('[ Accept Job ]', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    body: req.body,
  });

  let connection;
  try {
    const jobRef = req.params.id;
    const isNumericId = /^\d+$/.test(jobRef);

    const userId = req.user?.id || req.body?.user_id || req.query?.user_id;
    const userCompanyId =
      req.user?.company_id || req.body?.company_id || req.query?.company_id;

    if (!userId || !userCompanyId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User ID and Company ID are required to accept a job',
      });
    }

    connection = await connect();

    const whereClause = isNumericId ? 'WHERE j.id = ?' : 'WHERE j.code = ?';
    const whereParam = isNumericId ? parseInt(jobRef) : jobRef;

    const [jobResult] = await connection.execute(
      `SELECT j.id, j.code, j.status, j.contractor_company_id, j.contractee_company_id, j.assignment_status
       FROM jobs j
       ${whereClause}`,
      [whereParam],
    );

    if (jobResult.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found', jobRef });
    }

    const job = jobResult[0];

    if (parseInt(job.contractor_company_id) !== parseInt(userCompanyId)) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        message: 'Only members of the assigned company can accept this job',
      });
    }

    if (job.assignment_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Invalid job state',
        message: `Cannot accept job with assignment_status '${job.assignment_status}'. Job must be 'pending'.`,
        currentStatus: job.assignment_status,
      });
    }

    if (!['pending', 'draft', 'assigned'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job status',
        message: `Cannot accept job with status '${job.status}'.`,
        currentStatus: job.status,
      });
    }

    const now = new Date();
    await connection.execute(
      `UPDATE jobs
       SET assignment_status = 'accepted',
           assignment_responded_at = ?,
           assignment_responded_by_user_id = ?,
           status = 'accepted',
           updated_at = ?
       WHERE id = ?`,
      [now, userId, now, job.id],
    );

    const [updatedJob] = await connection.execute(
      `SELECT j.*,
              c.name as contractor_company_name,
              u.first_name as responder_first_name,
              u.last_name as responder_last_name
       FROM jobs j
       LEFT JOIN companies c ON j.contractor_company_id = c.id
       LEFT JOIN users u ON j.assignment_responded_by_user_id = u.id
       WHERE j.id = ?`,
      [job.id],
    );

    const updated = updatedJob[0];

    console.log(`✅ Job ${job.code} (id=${job.id}) accepted by user ${userId} from company ${userCompanyId}`);

    logJobAction({ jobId: job.id, actionType: 'job_accepted', userId, companyId: userCompanyId, actorRole: 'contractor', permissionLevel: 'contractor', oldStatus: 'pending', newStatus: 'accepted' });

    // ── Push + DB notification au contractee ──
    if (job.contractee_company_id) {
      try {
        const [contractorInfo] = await connection.execute(
          'SELECT name FROM companies WHERE id = ?', [userCompanyId]
        );
        const contractorName = contractorInfo[0]?.name || 'Un transporteur';
        const jobCode = job.code || job.id;

        await notifyCompany(
          connection,
          job.contractee_company_id,
          'job_update',
          '✅ Job accepté',
          `${contractorName} a accepté le job #${jobCode}`,
          {
            jobId: job.id,
            priority: 'high',
            pushData: {
              type: 'job_accepted',
              job_id: String(job.id),
              job_code: String(jobCode),
              screen: 'Calendar',
            },
          }
        );
      } catch (pushErr) {
        console.warn('[acceptJob] Push failed (non-blocking):', pushErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Job accepted successfully',
      data: {
        job: {
          id: updated.id,
          code: updated.code,
          status: updated.status,
          assignment: {
            status: updated.assignment_status,
            respondedAt: updated.assignment_responded_at,
            respondedBy: {
              id: updated.assignment_responded_by_user_id,
              firstName: updated.responder_first_name,
              lastName: updated.responder_last_name,
            },
          },
          contractor: {
            companyId: updated.contractor_company_id,
            companyName: updated.contractor_company_name,
          },
        },
      },
    });
  } catch (error) {
    console.error('❌ Error accepting job:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { acceptJobEndpoint };

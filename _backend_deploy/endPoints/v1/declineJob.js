/**
 * Decline Job Endpoint
 * POST /v1/job/:id/decline    (singular — legacy)
 * POST /v1/jobs/:id/decline   (plural   — frontend uses this)
 *
 * :id can be a numeric job ID OR a job code string (e.g. JOB-NERD-001)
 *
 * Permet à un membre de la company assignée (contractor) de refuser un job.
 * Change assignment_status de 'pending' à 'declined'.
 * Notifie le contractee (Entreprise A).
 */

const { connect } = require('../../swiftDb');
const { logJobAction } = require('../../utils/jobActionLogger');
const { notifyCompany } = require('../../utils/pushHelper');

const declineJobEndpoint = async (req, res) => {
  console.log('[ Decline Job ]', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    body: req.body,
  });

  let connection;
  try {
    const jobRef = req.params.id;

    // Support numeric ID OR string code
    const isNumericId = /^\d+$/.test(jobRef);

    const { reason, reset_contractor } = req.body;

    // Récupérer user_id et company_id (auth middleware ou body fallback)
    const userId = req.user?.id || req.body?.user_id || req.query?.user_id;
    const userCompanyId =
      req.user?.company_id || req.body?.company_id || req.query?.company_id;

    if (!userId || !userCompanyId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User ID and Company ID are required to decline a job',
      });
    }

    connection = await connect();

    // Récupérer le job (par ID numérique ou par code)
    const whereClause = isNumericId ? 'WHERE j.id = ?' : 'WHERE j.code = ?';
    const whereParam = isNumericId ? parseInt(jobRef) : jobRef;

    const [jobResult] = await connection.execute(
      `SELECT j.id, j.code, j.status, j.contractor_company_id, j.contractee_company_id, j.assignment_status
       FROM jobs j
       ${whereClause}`,
      [whereParam],
    );

    if (jobResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        jobRef,
      });
    }

    const job = jobResult[0];

    // Vérifier que l'utilisateur appartient à la company assignée (contractor)
    if (parseInt(job.contractor_company_id) !== parseInt(userCompanyId)) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        message: 'Only members of the assigned company can decline this job',
      });
    }

    // Vérifier que le job est en attente d'acceptation
    if (job.assignment_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Invalid job state',
        message: `Cannot decline job with assignment_status '${job.assignment_status}'. Job must be 'pending'.`,
        currentStatus: job.assignment_status,
      });
    }

    // Vérifier que le status du job permet le refus
    if (!['pending', 'draft', 'assigned'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job status',
        message: `Cannot decline job with status '${job.status}'.`,
        currentStatus: job.status,
      });
    }

    const now = new Date();

    // Mettre à jour le job
    if (reset_contractor === true) {
      await connection.execute(
        `UPDATE jobs
         SET assignment_status = 'declined',
             assignment_responded_at = ?,
             assignment_responded_by_user_id = ?,
             assignment_decline_reason = ?,
             contractor_company_id = contractee_company_id,
             contractor_name = NULL,
             contractor_contact_name = NULL,
             contractor_phone = NULL,
             contractor_email = NULL,
             assigned_at = NULL,
             status = 'pending',
             updated_at = ?
         WHERE id = ?`,
        [now, userId, reason || null, now, job.id],
      );
    } else {
      await connection.execute(
        `UPDATE jobs
         SET assignment_status = 'declined',
             assignment_responded_at = ?,
             assignment_responded_by_user_id = ?,
             assignment_decline_reason = ?,
             status = 'declined',
             updated_at = ?
         WHERE id = ?`,
        [now, userId, reason || null, now, job.id],
      );
    }

    // Récupérer les infos mises à jour
    const [updatedJob] = await connection.execute(
      `SELECT j.*,
              contractor_comp.name as contractor_company_name,
              contractee_comp.name as contractee_company_name,
              u.first_name as responder_first_name,
              u.last_name as responder_last_name
       FROM jobs j
       LEFT JOIN companies contractor_comp ON j.contractor_company_id = contractor_comp.id
       LEFT JOIN companies contractee_comp ON j.contractee_company_id = contractee_comp.id
       LEFT JOIN users u ON j.assignment_responded_by_user_id = u.id
       WHERE j.id = ?`,
      [job.id],
    );

    const updated = updatedJob[0];

    console.log(
      `❌ Job ${job.code} (id=${job.id}) declined by user ${userId} from company ${userCompanyId}. Reason: ${reason || 'None'}`,
    );

    logJobAction({ jobId: job.id, actionType: 'job_declined', userId, companyId: userCompanyId, actorRole: 'contractor', permissionLevel: 'contractor', oldStatus: 'pending', newStatus: 'declined' });

    // ── Push notification au contractee ──
    if (job.contractee_company_id) {
      try {
        const [contractorInfo] = await connection.execute(
          'SELECT name FROM companies WHERE id = ?', [userCompanyId]
        );
        const contractorName = contractorInfo[0]?.name || 'Un transporteur';
        const jobCode = job.code || job.id;
        const reasonText = reason ? ` — "${reason.substring(0, 80)}"` : '';

        await notifyCompany(
          connection,
          job.contractee_company_id,
          'job_update',
          '❌ Job refusé',
          `${contractorName} a refusé le job #${jobCode}${reasonText}`,
          {
            jobId: job.id,
            priority: 'high',
            pushData: {
              type: 'job_declined',
              job_id: String(job.id),
              job_code: String(jobCode),
              screen: 'Calendar',
            },
            metadata: { reason: reason || null, contractor_company_id: userCompanyId },
          }
        );
      } catch (pushErr) {
        console.warn('[declineJob] Push failed (non-blocking):', pushErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Job declined successfully',
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
            declineReason: updated.assignment_decline_reason,
          },
          contractor: updated.contractor_company_id
            ? {
                companyId: updated.contractor_company_id,
                companyName: updated.contractor_company_name,
              }
            : null,
          contractee: {
            companyId: updated.contractee_company_id,
            companyName: updated.contractee_company_name,
          },
          canBeReassigned: updated.contractor_company_id === null,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error declining job:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { declineJobEndpoint };

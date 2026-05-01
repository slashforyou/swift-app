const { logJobAction } = require('../../utils/jobActionLogger');
const { processJobCompleted } = require('../../utils/gamificationEngine');
const { connect, close } = require('../../swiftDb');
const { getUserByToken } = require('../database/user');
const consoleStyle = require('../../utils/consoleStyle');

/**
 * Complete a job by changing its status from 'pending' to 'completed'
 * POST /swift-app/v1/job/:id/complete
 * 
 * Permissions:
 * - Admin/Manager: Can complete any job
 * - Job supervisor: Can complete jobs they supervise
 * - Primary driver: Can complete jobs they are primary driver on
 */
const completeJobByIdEndpoint = async (req, res) => {
  const startTime = Date.now();
  const { id: jobIdOrCode } = req.params;
  
  consoleStyle.info('ENDPOINT', 'CompleteJob - Start', { 
    jobIdOrCode 
  });

  // Validation des paramÃ¨tres
  if (!jobIdOrCode) {
    consoleStyle.error('VALIDATION', 'Missing job ID or code', { jobIdOrCode });
    return res.status(400).json({
      success: false,
      message: 'Job ID or code is required'
    });
  }

  let connection;
  
  try {
    // Authentification
    consoleStyle.debug('AUTH', 'Authenticating user for job completion');
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      consoleStyle.error('AUTH', 'Missing or invalid authorization header');
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserByToken(token);
    
    if (!user) {
      consoleStyle.error('AUTH', 'Invalid token');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token'
      });
    }

    consoleStyle.success('AUTH', 'User authenticated', {
      userId: user.id,
      email: user.email
    });

    // Connexion Ã  la base de donnÃ©es
    connection = await connect();
    consoleStyle.success('DATABASE', 'Connection established');

    // VÃ©rification des permissions
    consoleStyle.debug('AUTH', 'Checking user permissions for job completion');
    
    // RÃ©cupÃ©ration du rÃ´le utilisateur
    const [userRoleResults] = await connection.execute(
      'SELECT role FROM users WHERE id = ?',
      [user.id]
    );

    if (userRoleResults.length === 0) {
      consoleStyle.error('AUTH', 'User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userRole = userRoleResults[0].role;
    consoleStyle.debug('AUTH', 'User role retrieved', {
      userId: user.id,
      role: userRole
    });

    // DÃ©terminer si c'est un ID numÃ©rique ou un CODE
    let jobQuery, jobParams;
    if (/^\d+$/.test(jobIdOrCode)) {
      // C'est un ID numÃ©rique
      jobQuery = `SELECT id, code, status, current_step, contact_first_name, contact_last_name,
                        contractor_name, contractee_name, contractee_company_id, contractor_company_id, created_at, updated_at
                 FROM jobs WHERE id = ?`;
      jobParams = [parseInt(jobIdOrCode)];
    } else {
      // C'est un CODE
      jobQuery = `SELECT id, code, status, current_step, contact_first_name, contact_last_name,
                        contractor_name, contractee_name, contractee_company_id, contractor_company_id, created_at, updated_at
                 FROM jobs WHERE code = ?`;
      jobParams = [jobIdOrCode];
    }

    // VÃ©rification que le job existe et rÃ©cupÃ©ration de ses infos
    const [jobResults] = await connection.execute(jobQuery, jobParams);

    if (jobResults.length === 0) {
      consoleStyle.error('VALIDATION', 'Job not found', { jobIdOrCode });
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const job = jobResults[0];
    const jobId = job.id; // ID numÃ©rique from DB
    
    // VÃ©rification du statut du job
    if (job.status === 'completed') {
      consoleStyle.error('VALIDATION', 'Job already completed', { 
        jobId, 
        jobCode: job.code,
        status: job.status 
      });
      return res.status(400).json({
        success: false,
        message: 'Job is already completed'
      });
    }

    if (job.status === 'archived') {
      consoleStyle.error('VALIDATION', 'Cannot complete archived job', { 
        jobId, 
        jobCode: job.code,
        status: job.status 
      });
      return res.status(400).json({
        success: false,
        message: 'Cannot complete an archived job'
      });
    }

    if (job.status !== 'pending') {
      consoleStyle.error('VALIDATION', 'Job not in pending status', { 
        jobId, 
        jobCode: job.code,
        status: job.status 
      });
      return res.status(400).json({
        success: false,
        message: `Job must be in pending status to be completed (current: ${job.status})`
      });
    }

    let hasPermission = false;
    let permissionReason = '';

    // Admin et manager ont toujours accÃ¨s
    if (userRole === 'admin' || userRole === 'manager') {
      hasPermission = true;
      permissionReason = `User role: ${userRole}`;
    } else {
      // Pour les autres, vÃ©rifier s'ils sont superviseur ou conducteur principal du job
      const [jobAssignmentResults] = await connection.execute(
        'SELECT role, is_primary FROM job_users WHERE job_id = ? AND user_id = ? AND unassigned_at IS NULL',
        [jobId, user.id]
      );

      if (jobAssignmentResults.length > 0) {
        const assignment = jobAssignmentResults[0];
        
        // Superviseur ou conducteur principal peuvent complÃ©ter
        if (assignment.role === 'supervisor') {
          hasPermission = true;
          permissionReason = 'Job supervisor';
        } else if (assignment.role === 'driver' && assignment.is_primary === 1) {
          hasPermission = true;
          permissionReason = 'Primary driver';
        }
      }
    }

    if (!hasPermission) {
      consoleStyle.error('AUTH', 'Permission denied for job completion', {
        userId: user.id,
        userRole,
        jobId
      });
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to complete this job'
      });
    }

    // [PATCH] company_ownership_v1 â€” cross-company guard
    if (user.company_id && job.contractee_company_id) {
      const allowed = user.company_id === job.contractee_company_id ||
                      user.company_id === job.contractor_company_id;
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: this job belongs to another company'
        });
      }
    }

    consoleStyle.debug('AUTH', 'Permission granted for job completion', {
      userId: user.id,
      permissionReason
    });

    // VÃ©rifications mÃ©tier avant completion
    
    // VÃ©rifier qu'il y a une Ã©quipe assignÃ©e
    const [crewResults] = await connection.execute(
      'SELECT COUNT(*) as crew_count FROM job_users WHERE job_id = ? AND unassigned_at IS NULL',
      [jobId]
    );

    if (crewResults[0].crew_count === 0) {
      consoleStyle.error('VALIDATION', 'No crew assigned to job', { 
        jobId, 
        jobCode: job.code 
      });
      return res.status(400).json({
        success: false,
        message: 'Cannot complete job: no crew members assigned'
      });
    }

    // VÃ©rifier qu'il y a au moins un truck assignÃ©
    // Check trucks: legacy job_trucks table OR new job_assignments (resource_type='vehicle')
    const [truckResults] = await connection.execute(
      'SELECT COUNT(*) as truck_count FROM job_trucks WHERE job_id = ? AND unassigned_at IS NULL',
      [jobId]
    );
    const [vehicleAssignmentResults] = await connection.execute(
      "SELECT COUNT(*) as vehicle_count FROM job_assignments WHERE job_id = ? AND resource_type = 'vehicle' AND status NOT IN ('cancelled','declined','replaced')",
      [jobId]
    );
    const hasTruck = (truckResults[0].truck_count > 0) || (vehicleAssignmentResults[0].vehicle_count > 0);

    if (!hasTruck) {
      consoleStyle.error('VALIDATION', 'No trucks assigned to job', { 
        jobId, 
        jobCode: job.code 
      });
      return res.status(400).json({
        success: false,
        message: 'Cannot complete job: no trucks assigned'
      });
    }

    consoleStyle.info('JOB', 'Completing job', {
      jobId,
      jobCode: job.code,
      currentStatus: job.status,
      currentStep: job.current_step,
      crewCount: crewResults[0].crew_count,
      truckCount: truckResults[0].truck_count
    });

    // ComplÃ©ter le job
    const completionTime = new Date();
    
    await connection.execute(
      `UPDATE jobs 
       SET status = 'completed', 
           updated_at = NOW()
       WHERE id = ?`,
      [jobId]
    );

    // Optionnel : Enregistrer qui a complÃ©tÃ© le job et quand
    // (On pourrait ajouter des colonnes completed_by et completed_at si nÃ©cessaire)

    // [PHASE 2] Log job event — non-blocking, ne doit jamais bloquer le flux principal
    try {
      const companyId = user.company_id || job.contractee_company_id || job.contractor_company_id || null;
      await connection.execute(
        `INSERT INTO job_events (job_id, company_id, actor_user_id, event_type, payload)
         VALUES (?, ?, ?, 'job.completed', JSON_OBJECT('completed_at', NOW()))`,
        [jobId, companyId, user.id]
      );
    } catch (eventErr) {
      // Non-blocking — le job est déjà complété, on log juste l'erreur
      console.error('[completeJob] job_events insert failed:', eventErr.message);
    }

    // [Phase 3 JQS] damage_reported — non-blocking
    if (req.body?.has_damage || req.body?.damage_notes) {
      try {
        const damageCompanyId = user.company_id || job.contractee_company_id || job.contractor_company_id || null;
        await connection.execute(
          `INSERT INTO job_events (job_id, company_id, actor_user_id, event_type, payload)
           VALUES (?, ?, ?, 'damage_reported', JSON_OBJECT('reported_at', NOW()))`,
          [jobId, damageCompanyId, user.id]
        );
      } catch (evtErr) {
        console.error('[damage_reported] job_events insert failed:', evtErr.message);
      }
    }

    // RÃ©cupÃ©ration des dÃ©tails de l'Ã©quipe et des trucks pour la rÃ©ponse
    const [assignedCrewResults] = await connection.execute(
      `SELECT u.id, u.email, CONCAT(u.first_name, ' ', u.last_name) as name, 
              ju.role, ju.is_primary
       FROM job_users ju
       JOIN users u ON ju.user_id = u.id
       WHERE ju.job_id = ? AND ju.unassigned_at IS NULL
       ORDER BY ju.is_primary DESC, ju.role`,
      [jobId]
    );

    const [assignedTrucksResults] = await connection.execute(
      `SELECT t.id, t.name, t.license_plate, jt.role
       FROM job_trucks jt
       JOIN trucks t ON jt.truck_id = t.id
       WHERE jt.job_id = ? AND jt.unassigned_at IS NULL
       ORDER BY jt.role = 'primary' DESC, jt.role`,
      [jobId]
    );

    consoleStyle.debug('JOB', 'Job completion details recorded', {
      jobId,
      completedBy: user.email,
      completionTime: completionTime.toISOString(),
      crewMembers: assignedCrewResults.length,
      trucks: assignedTrucksResults.length
    });

    // Fermeture de la connexion
    consoleStyle.info('DATABASE', 'Connection closed');
    close(connection);

    const duration = Date.now() - startTime;
    
    consoleStyle.success('JOB', 'Job completion successful', {
      jobId,
      jobCode: job.code,
      completedBy: user.email,
      permissionReason,
      duration: `${duration}ms`
    });

    consoleStyle.debug('PERFORMANCE', `CompleteJob took ${duration}ms`);
    consoleStyle.success('ENDPOINT', 'CompleteJob - Success', { 
      jobId, 
      duration: `${duration}ms`
    });

    // Log job action
    logJobAction({ jobId: numericJobId || job.id, actionType: 'job_completed', userId: user && (user.id || user.user_id), companyId: user && user.company_id, actorRole: (user && user.role) || 'employee', permissionLevel: 'manager', oldStatus: job.status, newStatus: 'completed' });
    // [GAMIF V2] Fire-and-forget
    
    // [PHASE 4] Générer le scorecard — fire-and-forget
    try {
      const { generateScorecard } = require('../../utils/scoreEngine');
      generateScorecard(jobId).catch(e => console.error('[scoreEngine] error:', e.message));
    } catch (_) {}
    // [AUTO REVIEW] Send review request to client (fire-and-forget)
    try {
      const { autoSendReviewRequest } = require('../v1/clientReview');
      autoSendReviewRequest(jobId).catch(() => {});
    } catch (_) {}
    processJobCompleted(
      jobId, user.id,
      user.company_id || job.contractor_company_id || null
    );
    // [PHASE 6] Perfect job + On-time bonus
    const { processPerfectJob, processJobOnTime } = require('../../utils/gamificationEngine');
    processPerfectJob(jobId, user.id, user.company_id || job.contractor_company_id || null);
    processJobOnTime(jobId, user.id, user.company_id || job.contractor_company_id || null);
    return res.status(200).json({
      success: true,
      message: 'Job completed successfully',
      job: {
        id: parseInt(jobId),
        code: job.code,
        status: 'completed',
        previous_status: job.status,
        current_step: job.current_step,
        contact_name: `${job.contact_first_name || ''} ${job.contact_last_name || ''}`.trim(),
        contractor_name: job.contractor_name,
        contractee_name: job.contractee_name,
        completed_at: completionTime.toISOString()
      },
      assigned_crew: assignedCrewResults.map(crew => ({
        user_id: crew.id,
        name: crew.name,
        email: crew.email,
        job_role: crew.role,
        is_primary: crew.is_primary === 1
      })),
      assigned_trucks: assignedTrucksResults.map(truck => ({
        truck_id: truck.id,
        name: truck.name,
        license_plate: truck.license_plate,
        role: truck.role
      })),
      completed_by: {
        id: user.id,
        email: user.email
      },
      permission_reason: permissionReason
    });

  } catch (error) {
    if (connection) {
      close(connection);
    }
    
    consoleStyle.error('ERROR', 'CompleteJob failed', {
      jobId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during job completion'
    });
  }
};

module.exports = { completeJobByIdEndpoint };

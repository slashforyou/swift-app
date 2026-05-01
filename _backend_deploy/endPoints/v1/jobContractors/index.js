/**
 * /swift-app/v1/jobs/:jobId/contractors
 *
 * POST  /jobs/:jobId/contractors                        — assigne un contractor au job
 * POST  /jobs/:jobId/contractors/:assignmentId/respond  — accept / decline
 * GET   /jobs/:jobId/contractors                        — liste les assignments du job
 */

const { connect } = require('../../../swiftDb');

const VALID_RATE_TYPES = ['hourly', 'flat', 'per_item'];

// ── Helper ─────────────────────────────────────────────────────────────────

function canAssignStaff(req) {
  return (
    req.user?.account_type === 'business_owner' ||
    req.membership?.can_assign_staff === 1
  );
}

// ── POST /jobs/:jobId/contractors ──────────────────────────────────────────

const assignContractor = async (req, res) => {
  const { jobId } = req.params;
  console.log('[ POST /jobs/:jobId/contractors ]', { jobId, body: req.body });

  let connection;
  try {
    const companyId  = req.user?.company_id;
    const assignedBy = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!canAssignStaff(req)) {
      return res.status(403).json({ success: false, message: 'Permission denied: can_assign_staff' });
    }

    const { contractor_user_id, role_label, rate_type, rate_amount } = req.body;

    if (!contractor_user_id) {
      return res.status(400).json({ success: false, message: 'contractor_user_id is required' });
    }
    if (!rate_type || !VALID_RATE_TYPES.includes(rate_type)) {
      return res.status(400).json({
        success: false,
        message: `rate_type must be one of: ${VALID_RATE_TYPES.join(', ')}`,
      });
    }
    if (rate_amount === undefined || isNaN(parseFloat(rate_amount))) {
      return res.status(400).json({ success: false, message: 'rate_amount is required and must be a number' });
    }

    const numJobId = parseInt(jobId);
    if (isNaN(numJobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }

    connection = await connect();

    // Vérifier que le job appartient à la company (scoping critique)
    const [jobRows] = await connection.execute(
      'SELECT id, status FROM jobs WHERE id = ? AND contractee_company_id = ?',
      [numJobId, companyId],
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Vérifier que le contractor est dans le réseau actif de la company
    const [ccRows] = await connection.execute(
      `SELECT id FROM company_contractors
       WHERE company_id = ? AND contractor_user_id = ? AND status = 'active'`,
      [companyId, contractor_user_id],
    );
    if (ccRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contractor is not in the active network of this company',
      });
    }

    // Vérifier assignation dupliquée (statuts actifs uniquement)
    const [existingAssignment] = await connection.execute(
      `SELECT id FROM job_contractor_assignments
       WHERE job_id = ? AND company_id = ? AND contractor_user_id = ?
         AND status NOT IN ('declined', 'cancelled')`,
      [numJobId, companyId, contractor_user_id],
    );
    if (existingAssignment.length > 0) {
      return res.status(409).json({ success: false, message: 'Contractor is already assigned to this job' });
    }

    const [insertResult] = await connection.execute(
      `INSERT INTO job_contractor_assignments
         (job_id, company_id, contractor_user_id, role_label,
          rate_type, rate_amount, status, assigned_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        numJobId,
        companyId,
        contractor_user_id,
        role_label || null,
        rate_type,
        parseFloat(rate_amount),
        assignedBy,
      ],
    );

    // Traçabilité
    await connection.execute(
      `INSERT INTO job_events
         (job_id, company_id, event_type, actor_user_id, payload, created_at)
       VALUES (?, ?, 'contractor.assigned', ?, ?, NOW())`,
      [
        numJobId,
        companyId,
        assignedBy,
        JSON.stringify({
          contractor_user_id,
          assignment_id: insertResult.insertId,
        }),
      ],
    );

    return res.status(201).json({
      success: true,
      data:    { assignment_id: insertResult.insertId },
      message: 'Contractor assigned successfully',
    });
  } catch (error) {
    console.error('[POST /jobs/:jobId/contractors]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── POST /jobs/:jobId/contractors/:assignmentId/respond ────────────────────

const respondToAssignment = async (req, res) => {
  const { jobId, assignmentId } = req.params;
  console.log('[ POST /jobs/:jobId/contractors/:assignmentId/respond ]', {
    jobId,
    assignmentId,
    body: req.body,
  });

  let connection;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { action, reason } = req.body;
    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'accept' or 'decline'" });
    }

    const numJobId        = parseInt(jobId);
    const numAssignmentId = parseInt(assignmentId);
    if (isNaN(numJobId) || isNaN(numAssignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid job or assignment id' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT id, contractor_user_id, company_id, status
       FROM job_contractor_assignments
       WHERE id = ? AND job_id = ?`,
      [numAssignmentId, numJobId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const assignment = rows[0];

    // Seul le contractor concerné peut répondre — jamais le body
    if (assignment.contractor_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Only the assigned contractor can respond' });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Assignment is already ${assignment.status}`,
      });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const eventType = action === 'accept' ? 'contractor.accepted' : 'contractor.declined';

    await connection.execute(
      `UPDATE job_contractor_assignments
       SET status = ?, decline_reason = ?, responded_at = NOW()
       WHERE id = ?`,
      [
        newStatus,
        action === 'decline' ? (reason || null) : null,
        numAssignmentId,
      ],
    );

    await connection.execute(
      `INSERT INTO job_events
         (job_id, company_id, event_type, actor_user_id, payload, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        numJobId,
        assignment.company_id,
        eventType,
        userId,
        JSON.stringify({
          assignment_id: numAssignmentId,
          reason:        reason || null,
        }),
      ],
    );

    return res.json({ success: true, message: `Assignment ${newStatus}` });
  } catch (error) {
    console.error('[POST /jobs/:jobId/contractors/:assignmentId/respond]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── GET /jobs/:jobId/contractors ───────────────────────────────────────────

const listJobContractors = async (req, res) => {
  const { jobId } = req.params;
  console.log('[ GET /jobs/:jobId/contractors ]', { jobId, companyId: req.user?.company_id });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }

    const numJobId = parseInt(jobId);
    if (isNaN(numJobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }

    connection = await connect();

    // Vérifier accès au job (scoping company)
    const [jobRows] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND contractee_company_id = ?',
      [numJobId, companyId],
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const [rows] = await connection.execute(
      `SELECT jca.id, jca.contractor_user_id, jca.role_label,
              jca.rate_type, jca.rate_amount, jca.status,
              jca.decline_reason, jca.assigned_by_user_id, jca.responded_at,
              u.first_name, u.last_name, u.email,
              cp.abn, cp.trade_name
       FROM job_contractor_assignments jca
       JOIN users u ON u.id = jca.contractor_user_id
       LEFT JOIN contractor_profiles cp ON cp.user_id = jca.contractor_user_id
       WHERE jca.job_id = ? AND jca.company_id = ?
       ORDER BY jca.id ASC`,
      [numJobId, companyId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /jobs/:jobId/contractors]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { assignContractor, respondToAssignment, listJobContractors };

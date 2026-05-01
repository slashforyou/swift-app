/**
 * /swift-app/v1/jobs/:jobId/payables
 *
 * GET    /jobs/:jobId/payables                          — liste les payables du job
 * POST   /jobs/:jobId/payables                          — génère un payable contractor
 * PATCH  /jobs/:jobId/payables/:payableId/approve       — owner approuve
 * PATCH  /jobs/:jobId/payables/:payableId/pay           — owner marque comme payé
 */

const { connect } = require('../../../swiftDb');

// ── Helper ─────────────────────────────────────────────────────────────────

function isOwnerOrManager(req) {
  return (
    req.user?.account_type === 'business_owner' ||
    req.membership?.role === 'owner' ||
    req.membership?.role === 'manager'
  );
}

// ── GET /jobs/:jobId/payables ──────────────────────────────────────────────

const listPayables = async (req, res) => {
  const { jobId } = req.params;
  console.log('[ GET /jobs/:jobId/payables ]', { jobId, companyId: req.user?.company_id });

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

    // Vérifier accès au job
    const [jobRows] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND contractee_company_id = ?',
      [numJobId, companyId],
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const [rows] = await connection.execute(
      `SELECT cp.id, cp.contractor_user_id, cp.amount, cp.currency,
              cp.rate_type, cp.hours_worked, cp.status,
              cp.approved_by_user_id, cp.approved_at,
              cp.paid_at, cp.payment_method, cp.payment_reference,
              cp.notes, cp.generated_at,
              u.first_name, u.last_name, u.email,
              cpr.trade_name
       FROM contractor_payables cp
       JOIN users u ON u.id = cp.contractor_user_id
       LEFT JOIN contractor_profiles cpr ON cpr.user_id = cp.contractor_user_id
       WHERE cp.job_id = ? AND cp.company_id = ?
       ORDER BY cp.generated_at DESC`,
      [numJobId, companyId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /jobs/:jobId/payables]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── POST /jobs/:jobId/payables ─────────────────────────────────────────────

const createPayable = async (req, res) => {
  const { jobId } = req.params;
  console.log('[ POST /jobs/:jobId/payables ]', { jobId, body: req.body });

  let connection;
  try {
    const companyId = req.user?.company_id;
    const actorId   = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwnerOrManager(req)) {
      return res.status(403).json({ success: false, message: 'Only owner or manager can generate payables' });
    }

    const { contractor_user_id, amount, rate_type, hours_worked } = req.body;

    if (!contractor_user_id) {
      return res.status(400).json({ success: false, message: 'contractor_user_id is required' });
    }
    if (amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ success: false, message: 'amount is required and must be a number' });
    }
    const VALID_RATE_TYPES = ['hourly', 'flat', 'per_item'];
    if (!rate_type || !VALID_RATE_TYPES.includes(rate_type)) {
      return res.status(400).json({
        success: false,
        message: `rate_type must be one of: ${VALID_RATE_TYPES.join(', ')}`,
      });
    }

    const numJobId = parseInt(jobId);
    if (isNaN(numJobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id' });
    }

    connection = await connect();

    // Vérifier ownership du job
    const [jobRows] = await connection.execute(
      'SELECT id FROM jobs WHERE id = ? AND contractee_company_id = ?',
      [numJobId, companyId],
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Vérifier que l'assignment existe et est complété
    const [assignmentRows] = await connection.execute(
      `SELECT id, status FROM job_contractor_assignments
       WHERE job_id = ? AND company_id = ? AND contractor_user_id = ?
         AND status IN ('accepted', 'completed')
       LIMIT 1`,
      [numJobId, companyId, contractor_user_id],
    );
    if (assignmentRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No accepted/completed assignment found for this contractor on this job',
      });
    }

    // Éviter les doublons (un payable pending/approved par assignment)
    const [existingPayable] = await connection.execute(
      `SELECT id FROM contractor_payables
       WHERE job_id = ? AND company_id = ? AND contractor_user_id = ?
         AND status NOT IN ('cancelled')`,
      [numJobId, companyId, contractor_user_id],
    );
    if (existingPayable.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A payable already exists for this contractor on this job',
      });
    }

    const [insertResult] = await connection.execute(
      `INSERT INTO contractor_payables
         (job_id, company_id, contractor_user_id, amount, currency,
          rate_type, hours_worked, status, generated_at)
       VALUES (?, ?, ?, ?, 'AUD', ?, ?, 'pending', NOW())`,
      [
        numJobId,
        companyId,
        contractor_user_id,
        parseFloat(amount),
        rate_type,
        hours_worked != null ? parseFloat(hours_worked) : null,
      ],
    );

    // Traçabilité
    await connection.execute(
      `INSERT INTO job_events
         (job_id, company_id, event_type, actor_user_id, payload, created_at)
       VALUES (?, ?, 'contractor.payable_created', ?, ?, NOW())`,
      [
        numJobId,
        companyId,
        actorId,
        JSON.stringify({
          payable_id:         insertResult.insertId,
          contractor_user_id,
          amount:             parseFloat(amount),
        }),
      ],
    );

    const [created] = await connection.execute(
      'SELECT * FROM contractor_payables WHERE id = ?',
      [insertResult.insertId],
    );

    return res.status(201).json({ success: true, data: created[0], message: 'Payable created' });
  } catch (error) {
    console.error('[POST /jobs/:jobId/payables]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── PATCH /jobs/:jobId/payables/:payableId/approve ─────────────────────────

const approvePayable = async (req, res) => {
  const { jobId, payableId } = req.params;
  console.log('[ PATCH /jobs/:jobId/payables/:payableId/approve ]', { jobId, payableId });

  let connection;
  try {
    const companyId  = req.user?.company_id;
    const approverId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwnerOrManager(req)) {
      return res.status(403).json({ success: false, message: 'Only owner or manager can approve payables' });
    }

    const numJobId     = parseInt(jobId);
    const numPayableId = parseInt(payableId);
    if (isNaN(numJobId) || isNaN(numPayableId)) {
      return res.status(400).json({ success: false, message: 'Invalid job or payable id' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT id, status FROM contractor_payables
       WHERE id = ? AND job_id = ? AND company_id = ?`,
      [numPayableId, numJobId, companyId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payable is already ${rows[0].status}`,
      });
    }

    await connection.execute(
      `UPDATE contractor_payables
       SET status = 'approved', approved_by_user_id = ?, approved_at = NOW()
       WHERE id = ? AND company_id = ?`,
      [approverId, numPayableId, companyId],
    );

    return res.json({ success: true, message: 'Payable approved' });
  } catch (error) {
    console.error('[PATCH /jobs/:jobId/payables/:payableId/approve]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── PATCH /jobs/:jobId/payables/:payableId/pay ─────────────────────────────

const payPayable = async (req, res) => {
  const { jobId, payableId } = req.params;
  console.log('[ PATCH /jobs/:jobId/payables/:payableId/pay ]', { jobId, payableId, body: req.body });

  let connection;
  try {
    const companyId = req.user?.company_id;
    const actorId   = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwnerOrManager(req)) {
      return res.status(403).json({ success: false, message: 'Only owner or manager can mark payables as paid' });
    }

    const { payment_method, payment_reference } = req.body;
    if (!payment_method) {
      return res.status(400).json({ success: false, message: 'payment_method is required' });
    }

    const numJobId     = parseInt(jobId);
    const numPayableId = parseInt(payableId);
    if (isNaN(numJobId) || isNaN(numPayableId)) {
      return res.status(400).json({ success: false, message: 'Invalid job or payable id' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT id, status, contractor_user_id, amount FROM contractor_payables
       WHERE id = ? AND job_id = ? AND company_id = ?`,
      [numPayableId, numJobId, companyId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    const payable = rows[0];

    // Doit être approuvé avant d'être payé
    if (payable.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Payable must be approved before marking as paid. Current status: ${payable.status}`,
      });
    }

    await connection.execute(
      `UPDATE contractor_payables
       SET status = 'paid', paid_at = NOW(), payment_method = ?, payment_reference = ?
       WHERE id = ? AND company_id = ?`,
      [
        payment_method,
        payment_reference || null,
        numPayableId,
        companyId,
      ],
    );

    // Traçabilité
    await connection.execute(
      `INSERT INTO job_events
         (job_id, company_id, event_type, actor_user_id, payload, created_at)
       VALUES (?, ?, 'contractor.paid', ?, ?, NOW())`,
      [
        numJobId,
        companyId,
        actorId,
        JSON.stringify({
          payable_id:         numPayableId,
          contractor_user_id: payable.contractor_user_id,
          amount:             payable.amount,
          payment_method,
          payment_reference:  payment_reference || null,
        }),
      ],
    );

    return res.json({ success: true, message: 'Payable marked as paid' });
  } catch (error) {
    console.error('[PATCH /jobs/:jobId/payables/:payableId/pay]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { listPayables, createPayable, approvePayable, payPayable };

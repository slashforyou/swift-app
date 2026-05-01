/**
 * CRUD /swift-app/v1/contractors
 *
 * GET    /contractors              — liste les contractors actifs du réseau
 * POST   /contractors/invite       — invite un contractor dans le réseau
 * PATCH  /contractors/:id/status   — active ou suspend un contractor
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

// ── GET /contractors ───────────────────────────────────────────────────────

const listContractors = async (req, res) => {
  console.log('[ GET /contractors ]', { companyId: req.user?.company_id });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT cc.id, cc.contractor_user_id, cc.status,
              cc.invited_at, cc.accepted_at,
              u.first_name, u.last_name, u.email,
              cp.abn, cp.trade_name, cp.rate_type, cp.rate_amount,
              cp.currency, cp.gst_registered
       FROM company_contractors cc
       JOIN users u ON u.id = cc.contractor_user_id
       LEFT JOIN contractor_profiles cp ON cp.user_id = cc.contractor_user_id
       WHERE cc.company_id = ? AND cc.status = 'active'
       ORDER BY cc.accepted_at DESC`,
      [companyId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /contractors]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── POST /contractors/invite ───────────────────────────────────────────────

const inviteContractor = async (req, res) => {
  console.log('[ POST /contractors/invite ]', {
    companyId: req.user?.company_id,
    body: req.body,
  });

  let connection;
  try {
    const companyId = req.user?.company_id;
    const invitedBy = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwnerOrManager(req)) {
      return res.status(403).json({ success: false, message: 'Only owner or manager can invite contractors' });
    }

    const { contractor_user_id } = req.body;
    if (!contractor_user_id) {
      return res.status(400).json({ success: false, message: 'contractor_user_id is required' });
    }

    connection = await connect();

    // Vérifier que le user existe et est bien de type contractor
    const [userRows] = await connection.execute(
      'SELECT id, account_type FROM users WHERE id = ?',
      [contractor_user_id],
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (userRows[0].account_type !== 'contractor') {
      return res.status(400).json({ success: false, message: 'User is not a contractor account' });
    }

    // Vérifier si déjà dans le réseau
    const [existing] = await connection.execute(
      'SELECT id, status FROM company_contractors WHERE company_id = ? AND contractor_user_id = ?',
      [companyId, contractor_user_id],
    );

    if (existing.length > 0) {
      if (existing[0].status === 'active') {
        return res.status(409).json({ success: false, message: 'Contractor is already in the network' });
      }
      // Réactiver si précédemment suspendu
      await connection.execute(
        `UPDATE company_contractors
         SET status = 'active', invited_by_user_id = ?, invited_at = NOW(), accepted_at = NULL
         WHERE company_id = ? AND contractor_user_id = ?`,
        [invitedBy, companyId, contractor_user_id],
      );
    } else {
      await connection.execute(
        `INSERT INTO company_contractors
           (company_id, contractor_user_id, status, invited_by_user_id, invited_at)
         VALUES (?, ?, 'active', ?, NOW())`,
        [companyId, contractor_user_id, invitedBy],
      );
    }

    return res.status(201).json({ success: true, message: 'Contractor invited successfully' });
  } catch (error) {
    console.error('[POST /contractors/invite]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── PATCH /contractors/:id/status ─────────────────────────────────────────

const updateContractorStatus = async (req, res) => {
  const { id } = req.params;
  console.log('[ PATCH /contractors/:id/status ]', { id, body: req.body });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwnerOrManager(req)) {
      return res.status(403).json({ success: false, message: 'Only owner or manager can update contractor status' });
    }

    const { status } = req.body;
    const VALID_STATUSES = ['active', 'suspended'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const contractorRelId = parseInt(id);
    if (isNaN(contractorRelId)) {
      return res.status(400).json({ success: false, message: 'Invalid contractor relation id' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      'SELECT id FROM company_contractors WHERE id = ? AND company_id = ?',
      [contractorRelId, companyId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contractor not found in network' });
    }

    await connection.execute(
      'UPDATE company_contractors SET status = ? WHERE id = ? AND company_id = ?',
      [status, contractorRelId, companyId],
    );

    return res.json({ success: true, message: `Contractor status updated to ${status}` });
  } catch (error) {
    console.error('[PATCH /contractors/:id/status]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { listContractors, inviteContractor, updateContractorStatus };

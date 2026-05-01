/**
 * CRUD /swift-app/v1/memberships
 *
 * GET    /memberships                  — liste les membres actifs de la company
 * POST   /memberships/invite           — invite un user dans la company
 * PATCH  /memberships/:id/permissions  — met à jour les permissions d'un membre
 * DELETE /memberships/:id              — suspend un membre (jamais DELETE réel)
 */

const { connect } = require('../../../swiftDb');

// ── Helpers rôles ──────────────────────────────────────────────────────────

function isOwnerOrManager(req) {
  const role = req.membership?.role;
  return (
    req.user?.account_type === 'business_owner' ||
    role === 'owner' ||
    role === 'manager'
  );
}

function isOwner(req) {
  return (
    req.user?.account_type === 'business_owner' ||
    req.membership?.role === 'owner'
  );
}

// ── GET /memberships ───────────────────────────────────────────────────────

const listMemberships = async (req, res) => {
  console.log('[ GET /memberships ]', { companyId: req.user?.company_id });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT cm.id, cm.user_id, cm.role,
              cm.can_create_jobs, cm.can_assign_staff,
              cm.can_view_financials, cm.can_collect_payment, cm.can_manage_stripe,
              cm.status, cm.joined_at, cm.created_at,
              u.first_name, u.last_name, u.email, u.account_type
       FROM company_memberships cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.company_id = ? AND cm.status = 'active'
       ORDER BY cm.created_at ASC`,
      [companyId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET /memberships]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── POST /memberships/invite ───────────────────────────────────────────────

const inviteMember = async (req, res) => {
  console.log('[ POST /memberships/invite ]', {
    companyId: req.user?.company_id,
    body: req.body,
  });

  let connection;
  try {
    const companyId  = req.user?.company_id;
    const invitedBy  = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwnerOrManager(req)) {
      return res.status(403).json({ success: false, message: 'Only owner or manager can invite members' });
    }

    const {
      user_id,
      role                = 'employee',
      can_create_jobs     = 0,
      can_assign_staff    = 0,
      can_view_financials = 0,
      can_collect_payment = 0,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }

    const VALID_ROLES = ['owner', 'manager', 'employee'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`,
      });
    }

    connection = await connect();

    // Vérifier que le user cible existe
    const [userRows] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [user_id],
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Vérifier s'il est déjà membre
    const [existing] = await connection.execute(
      'SELECT id, status FROM company_memberships WHERE user_id = ? AND company_id = ?',
      [user_id, companyId],
    );

    if (existing.length > 0 && existing[0].status === 'active') {
      return res.status(409).json({ success: false, message: 'User is already an active member' });
    }

    const boolFlags = [
      can_create_jobs     ? 1 : 0,
      can_assign_staff    ? 1 : 0,
      can_view_financials ? 1 : 0,
      can_collect_payment ? 1 : 0,
    ];

    if (existing.length > 0) {
      // Réactiver si précédemment suspendu
      await connection.execute(
        `UPDATE company_memberships
         SET role = ?, can_create_jobs = ?, can_assign_staff = ?,
             can_view_financials = ?, can_collect_payment = ?,
             status = 'active', invited_by_user_id = ?, joined_at = NOW()
         WHERE user_id = ? AND company_id = ?`,
        [role, ...boolFlags, invitedBy, user_id, companyId],
      );
    } else {
      await connection.execute(
        `INSERT INTO company_memberships
           (user_id, company_id, role,
            can_create_jobs, can_assign_staff, can_view_financials, can_collect_payment,
            can_manage_stripe, status, invited_by_user_id, joined_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active', ?, NOW(), NOW())`,
        [user_id, companyId, role, ...boolFlags, invitedBy],
      );
    }

    return res.status(201).json({ success: true, message: 'Member invited successfully' });
  } catch (error) {
    console.error('[POST /memberships/invite]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── PATCH /memberships/:id/permissions ────────────────────────────────────

const updatePermissions = async (req, res) => {
  const { id } = req.params;
  console.log('[ PATCH /memberships/:id/permissions ]', { id, body: req.body });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwner(req)) {
      return res.status(403).json({ success: false, message: 'Only owner can modify permissions' });
    }

    const membershipId = parseInt(id);
    if (isNaN(membershipId)) {
      return res.status(400).json({ success: false, message: 'Invalid membership id' });
    }

    const { can_create_jobs, can_assign_staff, can_view_financials, can_collect_payment } = req.body;

    if (
      can_create_jobs     === undefined &&
      can_assign_staff    === undefined &&
      can_view_financials === undefined &&
      can_collect_payment === undefined
    ) {
      return res.status(400).json({ success: false, message: 'At least one permission field is required' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT id FROM company_memberships
       WHERE id = ? AND company_id = ? AND status = 'active'`,
      [membershipId, companyId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Active membership not found' });
    }

    // Construire dynamiquement — uniquement les champs fournis
    const fields = [];
    const values = [];

    if (can_create_jobs     !== undefined) { fields.push('can_create_jobs = ?');     values.push(can_create_jobs     ? 1 : 0); }
    if (can_assign_staff    !== undefined) { fields.push('can_assign_staff = ?');    values.push(can_assign_staff    ? 1 : 0); }
    if (can_view_financials !== undefined) { fields.push('can_view_financials = ?'); values.push(can_view_financials ? 1 : 0); }
    if (can_collect_payment !== undefined) { fields.push('can_collect_payment = ?'); values.push(can_collect_payment ? 1 : 0); }

    values.push(membershipId, companyId);

    await connection.execute(
      `UPDATE company_memberships SET ${fields.join(', ')} WHERE id = ? AND company_id = ?`,
      values,
    );

    return res.json({ success: true, message: 'Permissions updated' });
  } catch (error) {
    console.error('[PATCH /memberships/:id/permissions]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

// ── DELETE /memberships/:id → suspend ─────────────────────────────────────

const suspendMember = async (req, res) => {
  const { id } = req.params;
  console.log('[ DELETE /memberships/:id ]', { id, companyId: req.user?.company_id });

  let connection;
  try {
    const companyId  = req.user?.company_id;
    const requesterId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'No company associated' });
    }
    if (!isOwner(req)) {
      return res.status(403).json({ success: false, message: 'Only owner can suspend members' });
    }

    const membershipId = parseInt(id);
    if (isNaN(membershipId)) {
      return res.status(400).json({ success: false, message: 'Invalid membership id' });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT id, user_id FROM company_memberships
       WHERE id = ? AND company_id = ? AND status = 'active'`,
      [membershipId, companyId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Active membership not found' });
    }

    // Empêcher l'auto-suspension
    if (rows[0].user_id === requesterId) {
      return res.status(400).json({ success: false, message: 'Cannot suspend your own membership' });
    }

    await connection.execute(
      `UPDATE company_memberships SET status = 'suspended' WHERE id = ? AND company_id = ?`,
      [membershipId, companyId],
    );

    return res.json({ success: true, message: 'Member suspended' });
  } catch (error) {
    console.error('[DELETE /memberships/:id]', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { listMemberships, inviteMember, updatePermissions, suspendMember };

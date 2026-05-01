/**
 * loadUserContext.js
 *
 * Middleware post-JWT : charge le membership actif de l'utilisateur
 * depuis company_memberships.
 *
 * Résultat disponible sur :
 *   req.membership   — row company_memberships ou null
 *   req.userContext  — { accountType, membership }
 *
 * NE BLOQUE JAMAIS. L'autorisation est gérée par requirePermission.
 * Les permissions ne sont JAMAIS lues depuis le JWT — toujours depuis la DB.
 */

const { connect } = require('../swiftDb');

const loadUserContext = async (req, res, next) => {
  const userId    = req.user?.id;
  const companyId = req.user?.company_id;

  // Pas de user ou pas de company → endpoints publics ou pre-company
  if (!userId || !companyId) {
    req.membership  = null;
    req.userContext = {
      accountType: req.user?.account_type || null,
      membership:  null,
    };
    return next();
  }

  let connection;
  try {
    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT user_id, company_id, role,
              can_create_jobs, can_assign_staff,
              can_view_financials, can_collect_payment, can_manage_stripe,
              status, joined_at
       FROM company_memberships
       WHERE user_id = ? AND company_id = ? AND status = 'active'
       LIMIT 1`,
      [userId, companyId],
    );

    req.membership  = rows[0] || null;
    req.userContext = {
      accountType: req.user?.account_type || 'business_owner',
      membership:  req.membership,
    };

    return next();
  } catch (error) {
    // Ne jamais bloquer sur une erreur de contexte — l'endpoint décide
    console.error('[loadUserContext] DB error:', error);
    req.membership  = null;
    req.userContext = {
      accountType: req.user?.account_type || null,
      membership:  null,
    };
    return next();
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { loadUserContext };

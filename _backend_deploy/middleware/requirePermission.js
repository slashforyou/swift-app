/**
 * requirePermission.js
 *
 * Factory de guards de permission basés sur company_memberships.
 * Dépend de loadUserContext (doit être appelé avant dans la chaîne).
 *
 * Usage :
 *   router.post('/jobs',       requirePermission('can_create_jobs'),    handler)
 *   router.get('/financials',  requirePermission('can_view_financials'), handler)
 *
 * Les business_owner (account_type) passent toujours — ils ont accès à tout
 * même si leur membership n'est pas encore créé (cas legacy / premier login).
 */

const VALID_PERMISSIONS = [
  'can_create_jobs',
  'can_assign_staff',
  'can_view_financials',
  'can_collect_payment',
  'can_manage_stripe',
];

const requirePermission = (permission) => {
  if (!VALID_PERMISSIONS.includes(permission)) {
    // Erreur de configuration — échouer au démarrage, pas en runtime
    throw new Error(`[requirePermission] Unknown permission: "${permission}". Valid: ${VALID_PERMISSIONS.join(', ')}`);
  }

  return (req, res, next) => {
    // business_owner bypasse les guards (owner du compte principal)
    if (req.user?.account_type === 'business_owner') {
      return next();
    }

    if (!req.membership) {
      return res.status(403).json({
        success: false,
        message: 'No active membership',
      });
    }

    // Vérification stricte : 0 ou false → refusé
    if (!req.membership[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission}`,
      });
    }

    return next();
  };
};

module.exports = { requirePermission };

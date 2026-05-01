-- Migration 056b : Backfill company_memberships pour les users existants
-- ══════════════════════════════════════════════════════════════════════════
-- Contexte : la migration 056 crée la table company_memberships, mais les
--   users existants (inscrits avant le déploiement Phase 1) n'ont aucune
--   ligne dans cette table. Sans ce backfill, le middleware loadUserContext
--   ne peut pas charger leur rôle/permissions → 403 sur toutes les routes
--   protégées après déploiement.
--
-- Règle appliquée :
--   Tout user avec un company_id NON NULL et account_type = 'business_owner'
--   (valeur par défaut migration 055) devient 'owner' de sa company avec
--   toutes les permissions à 1. Ces users étaient les seuls avant Phase 1,
--   ils ont donc tous les droits.
--
-- Idempotente : INSERT IGNORE respecte la UNIQUE KEY (user_id, company_id).
-- joined_at = created_at de l'user (date d'inscription = date d'entrée).
--
-- À exécuter APRÈS migration 055 et 056, AVANT pm2 restart.
-- ══════════════════════════════════════════════════════════════════════════

INSERT IGNORE INTO company_memberships
  (user_id, company_id, role,
   can_create_jobs, can_assign_staff, can_view_financials,
   can_collect_payment, can_manage_stripe,
   status, invited_by_user_id, joined_at, created_at)
SELECT
  u.id                  AS user_id,
  u.company_id          AS company_id,
  'owner'               AS role,
  1                     AS can_create_jobs,
  1                     AS can_assign_staff,
  1                     AS can_view_financials,
  1                     AS can_collect_payment,
  1                     AS can_manage_stripe,
  'active'              AS status,
  NULL                  AS invited_by_user_id,
  u.created_at          AS joined_at,
  NOW()                 AS created_at
FROM users u
WHERE u.company_id IS NOT NULL
  AND u.account_type = 'business_owner';

-- ── Vérification post-backfill ────────────────────────────────────────────
-- Ces deux requêtes doivent retourner des chiffres cohérents
-- (= nombre de business_owners avec company_id)
SELECT
  COUNT(*)              AS memberships_created,
  COUNT(DISTINCT company_id) AS companies_covered
FROM company_memberships
WHERE role = 'owner' AND status = 'active';

-- Diagnostic : users sans membership après backfill (doit être vide ou = users sans company_id)
SELECT u.id, u.email, u.company_id, u.account_type
FROM users u
LEFT JOIN company_memberships cm
  ON cm.user_id = u.id AND cm.company_id = u.company_id
WHERE u.company_id IS NOT NULL
  AND cm.id IS NULL;

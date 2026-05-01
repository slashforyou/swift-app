-- Migration 050 : Modèle d'abonnement Cobbr
-- Trial 30j → Essential ($59/mois) ou Business ($119/mois)
-- Commissions abandonnées

-- ===========================================================================
-- ÉTAT CONNU DE LA TABLE companies AVANT CETTE MIGRATION
-- ===========================================================================
-- Colonnes déjà présentes (ne pas re-créer) :
--   plan_type                    VARCHAR  — ancien modèle (free/pro/expert)
--   subscription_status          (type inconnu) — statuts Stripe bruts :
--                                 'active', 'canceled', 'canceling',
--                                 'past_due', 'incomplete', 'incomplete_expired'
--                                 ⚠ NE PAS MODIFIER L'ENUM sans audit prod
--   subscription_id              VARCHAR  — Stripe Subscription ID (ancien)
--   stripe_customer_id           VARCHAR(255) ajouté migration 017
--   stripe_platform_fee_percentage DECIMAL — taux plateforme (sera mis à 0)
-- ===========================================================================

-- ===========================================================================
-- 1. Table companies — nouvelles colonnes du modèle d'abonnement v2
-- ===========================================================================

-- Plan actif (remplace plan_type basé sur la table plans)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS plan
    ENUM('essential', 'business') NOT NULL DEFAULT 'essential'
    COMMENT 'Plan actif Cobbr v2 — essential ou business';

-- subscription_status : ADD IF NOT EXISTS = no-op si la colonne existe déjà.
-- La colonne existante stocke les statuts Stripe bruts (ne pas modifier l''ENUM
-- sans valider les valeurs actuelles en production).
-- Si la colonne n''existe pas encore, elle sera créée avec les valeurs standard.
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS subscription_status
    ENUM('trial', 'active', 'past_due', 'cancelled') NOT NULL DEFAULT 'trial'
    COMMENT 'Statut abonnement Cobbr — trial/active/past_due/cancelled';

-- Date de fin du trial (J+30 depuis created_at)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS trial_ends_at
    DATETIME NULL
    COMMENT 'Expiration du trial — DATE_ADD(created_at, INTERVAL 30 DAY)';

-- stripe_customer_id : déjà présent (migration 017, VARCHAR 255).
-- ADD IF NOT EXISTS = no-op. Documenté ici pour cohérence du modèle.
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id
    VARCHAR(64) NULL
    COMMENT 'Stripe Customer ID (Billing) — existe depuis migration 017';

-- stripe_subscription_id : nouveau champ distinct de subscription_id (ancien modèle)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS stripe_subscription_id
    VARCHAR(64) NULL
    COMMENT 'Stripe Subscription ID actif (nouveau modèle v2)';

-- had_trial : empêche le trial infini (annulation + recréation subscription)
-- ⚠️ CRITIQUE — toujours vérifier ce flag avant de passer trial_period_days à Stripe
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS had_trial
    TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Flag anti-abus : 1 si un trial a déjà été utilisé par cette company';

-- Plateforme fee : mise à 0 pour toutes les companies (commissions abandonnées)
UPDATE companies
SET stripe_platform_fee_percentage = 0.00
WHERE stripe_platform_fee_percentage IS NOT NULL
  AND stripe_platform_fee_percentage > 0;

-- ===========================================================================
-- 2. Index
-- ===========================================================================

-- Résolution rapide customer → company (webhooks Stripe, billing)
-- Vérifie si l''index n''existe pas avant création (idempotent)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME  = 'companies'
    AND INDEX_NAME  = 'idx_companies_stripe_customer_id'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_companies_stripe_customer_id ON companies (stripe_customer_id)',
  'SELECT ''index idx_companies_stripe_customer_id already exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Filtres dashboard admin / cron de relance / gate multi-company
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME  = 'companies'
    AND INDEX_NAME  = 'idx_companies_subscription_status'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_companies_subscription_status ON companies (subscription_status)',
  'SELECT ''index idx_companies_subscription_status already exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- 3. Neutralisation des commissions — table plans
-- ===========================================================================
-- Les commissions sont abandonnées dans le modèle v2.
-- On ne supprime PAS la table plans : des endpoints backend la référencent
-- encore (selectPlan.js, plans.js, stripe_subscription_webhooks.js).
-- On met à zéro les taux, on masque les anciens plans, on insère les nouveaux.

-- Mettre commission_rate et platform_fee_percentage à 0 pour tous les plans
UPDATE plans
SET
  commission_rate         = 0.00,
  platform_fee_percentage = 0.00;

-- Remettre stripe_platform_fee à 0 en cascade dans les companies ayant
-- un plan_type correspondant aux anciens plans (free/pro/expert)
UPDATE companies
SET stripe_platform_fee_percentage = 0.00
WHERE plan_type IN ('free', 'pro', 'expert', 'unlimited');

-- Masquer les anciens plans — ils ne doivent plus apparaître dans le picker
-- (ne pas supprimer : les factures monthly_invoices les référencent)
UPDATE plans
SET is_public = 0
WHERE id IN ('free', 'pro', 'expert', 'unlimited');

-- Upsert des 2 nouveaux plans Essential et Business
INSERT INTO plans (
  id, label, display_name, price_monthly,
  included_users, extra_user_price,
  max_jobs_created, max_jobs_accepted,
  platform_fee_percentage, commission_rate,
  min_fee_aud, features, is_public, sort_order
) VALUES
  (
    'essential', 'Essential', 'Essential', 59.00,
    -1, 0.00,
    -1, -1,
    0.00, 0.00,
    0.00, '{"branding":true,"priority_support":false}', 1, 10
  ),
  (
    'business', 'Business', 'Business', 119.00,
    -1, 0.00,
    -1, -1,
    0.00, 0.00,
    0.00, '{"branding":true,"priority_support":true}', 1, 11
  )
ON DUPLICATE KEY UPDATE
  label                   = VALUES(label),
  display_name            = VALUES(display_name),
  price_monthly           = VALUES(price_monthly),
  included_users          = VALUES(included_users),
  extra_user_price        = VALUES(extra_user_price),
  platform_fee_percentage = VALUES(platform_fee_percentage),
  commission_rate         = VALUES(commission_rate),
  min_fee_aud             = VALUES(min_fee_aud),
  features                = VALUES(features),
  is_public               = VALUES(is_public),
  sort_order              = VALUES(sort_order);

-- ===========================================================================
-- 4. Initialisation des trials pour les companies existantes
-- ===========================================================================
-- Règle :
--   trial_ends_at = created_at + 30 jours (pour toutes les companies)
--   subscription_status :
--     → 'trial'     si trial pas encore expiré ET pas d''abonnement actif
--     → 'cancelled' si trial déjà dépassé ET pas d''abonnement actif
--     → inchangé    si subscription_status = 'active' (abonnement payant actif)

-- Étape A : remplir trial_ends_at sur toutes les companies sans valeur
UPDATE companies
SET trial_ends_at = DATE_ADD(created_at, INTERVAL 30 DAY)
WHERE trial_ends_at IS NULL;

-- Étape B : mettre à jour subscription_status uniquement pour les companies
-- sans abonnement Stripe actif (ne pas écraser 'active')
UPDATE companies
SET subscription_status = CASE
    WHEN trial_ends_at >= NOW() THEN 'trial'
    ELSE 'cancelled'
  END
WHERE subscription_status NOT IN ('active');

-- Étape C : aligner plan sur le plan_type existant quand compatible
-- (companies qui avaient déjà sélectionné un plan connu)
UPDATE companies
SET plan = 'business'
WHERE plan_type IN ('expert', 'unlimited')
  AND plan = 'essential';

-- ===========================================================================
-- NOTES DE RÉVERSION
-- ===========================================================================
-- Cette migration est PARTIELLEMENT réversible :
--   - DROP COLUMN : plan, trial_ends_at, stripe_subscription_id
--   - Les UPDATE de plans (commission_rate = 0, is_public = 0) peuvent être
--     annulés manuellement.
--   - Les INSERT des plans essential/business peuvent être supprimés :
--       DELETE FROM plans WHERE id IN ('essential', 'business');
--   - subscription_status mis à jour (trial/cancelled) ne peut PAS être
--     rétabli automatiquement (valeurs originales non sauvegardées).
--
-- COLONNES LAISSÉES EN PLACE (backward compat) :
--   companies.plan_type, companies.subscription_id,
--   companies.stripe_platform_fee_percentage
--   plans.commission_rate, plans.platform_fee_percentage
--   monthly_invoices.commission_rate, monthly_invoices.commission_amount
--     → colonnes historiques, à archiver dans une future migration.
-- ===========================================================================

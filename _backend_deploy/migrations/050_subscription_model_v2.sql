-- ===========================================================================
-- Migration 050_subscription_model_v2.sql
-- Free Trial 14 jours — colonnes manquantes + cohérence prod
-- ===========================================================================
-- Contexte :
--   La migration 050 n'a jamais été déployée en prod.
--   Cette migration v2 est idempotente (ADD COLUMN IF NOT EXISTS partout).
--   Elle ajoute UNIQUEMENT les colonnes nécessaires au free trial 14 jours.
--   Les autres ajouts de 050 (plans, stripe_subscription_id, commission à 0)
--   sont indépendants et doivent être validés séparément.
-- ===========================================================================

-- ===========================================================================
-- 1. Colonnes manquantes sur companies
-- ===========================================================================

-- Expiration du trial (14 jours depuis la création de la company)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS trial_ends_at
    DATETIME NULL
    COMMENT 'Expiration du free trial 14 jours — DATE_ADD(created_at, INTERVAL 14 DAY)';

-- Flag anti-abus : empêche un deuxième trial en cas de recréation
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS had_trial
    TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Flag anti-abus : 1 si un trial a déjà été consommé par cette company';

-- ===========================================================================
-- 2. Cohérence des companies existantes
-- ===========================================================================
-- DÉCISION PRODUIT (Romain, 3 mai 2026) :
--   Toutes les companies existantes sont des comptes test.
--   → Plan "comped" : accès gratuit permanent à toutes les features.
--   → subscription_status = 'active' (pas de trial, pas d'expiration)
--   → trial_ends_at = NULL, had_trial = 1 (anti-abus : aucun trial Stripe ne leur sera proposé)
--
--   Les NOUVELLES inscriptions (post-migration) bénéficient du trial 14j classique.
-- ===========================================================================

UPDATE companies
SET
  plan_type           = 'comped',
  subscription_status = 'active',
  trial_ends_at       = NULL,
  had_trial           = 1
WHERE subscription_status NOT IN ('active', 'cancelled', 'canceling')
   OR subscription_status IS NULL;

-- ===========================================================================
-- 3. Index — résolution rapide pour le cron de vérification
-- ===========================================================================

-- Index pour le cron trialExpirationCron (filtre WHERE subscription_status + trial_ends_at)
SET @idx_exists = (
  SELECT COUNT(*)
  FROM   information_schema.STATISTICS
  WHERE  TABLE_SCHEMA = DATABASE()
    AND  TABLE_NAME   = 'companies'
    AND  INDEX_NAME   = 'idx_companies_trial_ends_at'
);
SET @sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_companies_trial_ends_at ON companies (trial_ends_at)',
  'SELECT ''index idx_companies_trial_ends_at already exists'''
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- =====================================================
-- Migration: add plan limits columns
-- Table: plans
-- =====================================================
-- Ajoute les colonnes de limites métier sur les plans.
-- -1 = illimité (convention Cobbr).
-- =====================================================

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS max_team_members   INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_jobs_per_month INT NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS max_trucks         INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS history_days       INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS trial_days         INT NOT NULL DEFAULT 0;

-- =====================================================
-- Valeurs par plan
-- =====================================================

-- Plan Free : limites strictes, pas de trial
UPDATE plans SET
  max_team_members   = 3,
  max_jobs_per_month = 25,
  max_trucks         = 1,
  history_days       = 30,
  trial_days         = 0
WHERE id = 'free';

-- Plan Pro ($99) : 5 membres, camions illimités, jobs illimités, 0% commission, 30 jours d'essai
UPDATE plans SET
  max_team_members       = 5,
  max_jobs_per_month     = -1,
  max_trucks             = -1,
  history_days           = 365,
  trial_days             = 30,
  platform_fee_percentage = 0.00,
  commission_rate        = 0.00
WHERE id = 'pro';

-- Plan Expert ($179) : 10 membres, camions illimités, jobs illimités, 0% commission, 30 jours d'essai
UPDATE plans SET
  max_team_members       = 10,
  max_jobs_per_month     = -1,
  max_trucks             = -1,
  history_days           = -1,
  trial_days             = 30,
  platform_fee_percentage = 0.00,
  commission_rate        = 0.00
WHERE id = 'expert';

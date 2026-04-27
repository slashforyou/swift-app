-- Migration 041: Employee hour quotas & weekly tracking
-- Date: 2026-04-28
-- Ajoute max_hours_per_week sur users (NULL = pas de limite contractuelle).
-- employee_weekly_hours : agrégat des heures travaillées par semaine ISO.
--   week_start = lundi de la semaine (DATE).
--   total_hours et job_count sont mis à jour par le backend à chaque
--   complétion de job (ou recalculés via cron).
-- UNIQUE (user_id, week_start) garantit une seule ligne par user par semaine.

-- ─── Quota hebdomadaire sur le profil user ────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS max_hours_per_week DECIMAL(5,2) DEFAULT NULL
    COMMENT 'Quota max hebdomadaire en heures. NULL = pas de limite.';

-- ─── Suivi hebdomadaire agrégé ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_weekly_hours (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  company_id  INT UNSIGNED NOT NULL,
  week_start  DATE         NOT NULL
              COMMENT 'Date du lundi (semaine ISO). Ex: 2026-04-27',
  total_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  job_count   INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Une seule ligne par user par semaine (upsert backend)
  UNIQUE KEY uq_ewh_user_week (user_id, week_start),

  CONSTRAINT fk_ewh_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ewh_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  -- Requête dashboard company : toutes les semaines d'une période
  INDEX idx_ewh_company_week (company_id, week_start)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Migration 026: Gamification V2 — Tables fondamentales
-- Date: 2026-04-25
-- ============================================================
-- Crée:
--   gamification_profiles   -> profil XP/trophées par entité (user|company)
--   gamification_reward_ledger -> ledger universel append-only (source de vérité)
--   gamification_quest_progress -> suivi des quêtes en cours
-- Modifie:
--   job_review_tokens -> ajoute xp_distributed, xp_distributed_at
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. gamification_profiles
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_profiles (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  entity_type      ENUM('user','company') NOT NULL,
  entity_id        INT NOT NULL,

  -- XP cumulatif à vie (synchronisé depuis le ledger via le moteur)
  lifetime_xp      INT NOT NULL DEFAULT 0,

  -- Trophées période courante (reset à chaque nouvelle période)
  current_weekly_trophies   INT NOT NULL DEFAULT 0,
  current_monthly_trophies  INT NOT NULL DEFAULT 0,
  current_yearly_trophies   INT NOT NULL DEFAULT 0,

  -- Level (calculé depuis lifetime_xp)
  current_level    INT NOT NULL DEFAULT 1,

  -- Streaks
  current_streak_days   INT NOT NULL DEFAULT 0,
  longest_streak_days   INT NOT NULL DEFAULT 0,
  last_active_date      DATE DEFAULT NULL,

  -- Stats cumulatives
  total_jobs_completed  INT NOT NULL DEFAULT 0,
  total_photos_uploaded INT NOT NULL DEFAULT 0,
  total_signatures      INT NOT NULL DEFAULT 0,
  total_reviews_received INT NOT NULL DEFAULT 0,
  total_5star_reviews   INT NOT NULL DEFAULT 0,

  -- Scores moyens
  avg_review_overall  DECIMAL(3,2) DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_entity (entity_type, entity_id),
  INDEX idx_level (current_level),
  INDEX idx_lifetime_xp (lifetime_xp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Profil gamification V2 par entité (user ou company)';


-- ────────────────────────────────────────────────────────────
-- 2. gamification_reward_ledger
-- Source de vérité de tous les gains XP + trophées
-- Append-only. Jamais UPDATE ni DELETE.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_reward_ledger (
  id            INT AUTO_INCREMENT PRIMARY KEY,

  -- Entité bénéficiaire
  entity_type   ENUM('user','company') NOT NULL,
  entity_id     INT NOT NULL,

  -- Type de récompense
  reward_type   ENUM('xp','trophy') NOT NULL,
  amount        INT NOT NULL DEFAULT 0,

  -- Origine de la récompense
  source_type   ENUM('job','review','action','streak','milestone','badge','quest','admin') NOT NULL,

  -- Code unique de la source pour idempotence
  -- Pattern: <trigger>_<entity_type><entity_id>_<optional_qualifier>
  -- Ex: job_completed_job44_user12, photo_added_job44_img7_user12
  source_code   VARCHAR(200) NOT NULL,

  -- Événement déclencheur (pour analytics)
  trigger_event VARCHAR(100) NOT NULL,

  -- Références FK optionnelles
  job_id           INT DEFAULT NULL,
  review_token_id  INT DEFAULT NULL,

  -- Texte lisible
  reason VARCHAR(500) NOT NULL DEFAULT '',

  -- Données brutes du déclencheur
  metadata JSON DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Idempotence: un event ne peut distribuer qu'une fois par entité
  UNIQUE KEY uq_idempotent (entity_type, entity_id, reward_type, source_code),

  INDEX idx_entity      (entity_type, entity_id),
  INDEX idx_job         (job_id),
  INDEX idx_review      (review_token_id),
  INDEX idx_trigger     (trigger_event),
  INDEX idx_source      (source_type, source_code),
  INDEX idx_created     (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Ledger universel append-only de toutes les distributions de récompenses';


-- ────────────────────────────────────────────────────────────
-- 3. gamification_quest_progress
-- Suivi de la progression des quêtes actives par entité
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_quest_progress (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  entity_type  ENUM('user','company') NOT NULL,
  entity_id    INT NOT NULL,
  quest_code   VARCHAR(50) NOT NULL,

  -- Période de la quête (ISO: 2026-W17, 2026-04, 2026-04-25, etc.)
  period_key   VARCHAR(20) NOT NULL,

  -- Progression actuelle vs objectif
  current_count INT NOT NULL DEFAULT 0,
  target_count  INT NOT NULL DEFAULT 1,

  -- Status
  status       ENUM('in_progress','completed','claimed','expired') NOT NULL DEFAULT 'in_progress',
  completed_at DATETIME DEFAULT NULL,
  claimed_at   DATETIME DEFAULT NULL,

  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_quest_period (entity_type, entity_id, quest_code, period_key),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_status (status),
  INDEX idx_period (period_key)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Suivi des quêtes en cours par entité et par période';


-- ────────────────────────────────────────────────────────────
-- 4. Alter job_review_tokens
-- ────────────────────────────────────────────────────────────
ALTER TABLE job_review_tokens
  ADD COLUMN IF NOT EXISTS xp_distributed     TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 si la gamification a déjà été distribuée pour cette review',
  ADD COLUMN IF NOT EXISTS xp_distributed_at  DATETIME DEFAULT NULL
    COMMENT 'Timestamp de la distribution XP';

-- Index pour le moteur gamification (requêtes de reviews non traitées)
ALTER TABLE job_review_tokens
  ADD INDEX IF NOT EXISTS idx_xp_distributed (xp_distributed, submitted_at);


-- ────────────────────────────────────────────────────────────
-- Fin de la migration 026
-- ────────────────────────────────────────────────────────────

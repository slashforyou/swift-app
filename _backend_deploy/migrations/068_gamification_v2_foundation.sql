-- ============================================================
-- Migration 068 — Gamification V2 Foundation (Additive)
-- Adapté à l'état réel de la DB (tables existantes conservées)
-- Date : 2 mai 2026
-- ============================================================

-- ─── 1. TABLES MANQUANTES À CRÉER ────────────────────────────

-- Historique XP par entité (append-only, idempotent)
-- Distinct de gamification_xp_rewards (config) qui existe déjà
CREATE TABLE IF NOT EXISTS gamification_xp_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  xp_amount INT NOT NULL,
  source_type VARCHAR(50) NOT NULL COMMENT 'job_score, quest, badge, checkpoint, review, bonus',
  source_id VARCHAR(100) NOT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_source (source_type, source_id),
  INDEX idx_created (created_at),
  UNIQUE KEY uq_idempotent (entity_type, entity_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Badges débloqués par entité
CREATE TABLE IF NOT EXISTS gamification_badge_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  badge_id INT NOT NULL COMMENT 'FK vers gamification_badge_definitions.id',
  badge_code VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_job_id INT DEFAULT NULL,
  UNIQUE KEY uq_badge (entity_type, entity_id, badge_code),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_badge (badge_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leagues / tiers compétitifs (basés sur trophées)
CREATE TABLE IF NOT EXISTS league_tiers (
  code VARCHAR(50) PRIMARY KEY,
  label VARCHAR(50) NOT NULL,
  min_trophies INT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL,
  sort_order INT NOT NULL,
  INDEX idx_trophies (min_trophies)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO league_tiers (code, label, min_trophies, icon, color, sort_order) VALUES
('unranked',   'Unranked',     0,    '⚪', '#808080', 0),
('bronze_3',   'Bronze III',   50,   '🥉', '#CD7F32', 1),
('bronze_2',   'Bronze II',    100,  '🥉', '#CD7F32', 2),
('bronze_1',   'Bronze I',     175,  '🥉', '#CD7F32', 3),
('silver_3',   'Silver III',   275,  '🥈', '#C0C0C0', 4),
('silver_2',   'Silver II',    400,  '🥈', '#C0C0C0', 5),
('silver_1',   'Silver I',     550,  '🥈', '#C0C0C0', 6),
('gold_3',     'Gold III',     750,  '🥇', '#FFD700', 7),
('gold_2',     'Gold II',      1000, '🥇', '#FFD700', 8),
('gold_1',     'Gold I',       1300, '🥇', '#FFD700', 9),
('platinum_3', 'Platinum III', 1700, '💎', '#E5E4E2', 10),
('platinum_2', 'Platinum II',  2200, '💎', '#E5E4E2', 11),
('platinum_1', 'Platinum I',   2800, '💎', '#E5E4E2', 12),
('diamond',    'Diamond',      3500, '👑', '#B9F2FF', 13),
('champion',   'Champion',     5000, '🏆', '#FF4500', 14);

-- Récompenses configurées par level
CREATE TABLE IF NOT EXISTS level_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level INT NOT NULL,
  reward_type ENUM('cosmetic','functional','badge_slot','title','avatar_frame','theme') NOT NULL,
  reward_code VARCHAR(50) NOT NULL,
  reward_name VARCHAR(100) NOT NULL,
  reward_description TEXT DEFAULT NULL,
  reward_payload JSON DEFAULT NULL,
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Récompenses effectivement débloquées par les entités
CREATE TABLE IF NOT EXISTS unlocked_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  reward_id INT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entity_reward (entity_type, entity_id, reward_id),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Snapshots leaderboard figés pour historique
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  period_type ENUM('weekly','monthly','yearly') NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  trophies INT NOT NULL,
  rank_position INT NOT NULL,
  league_code VARCHAR(50) DEFAULT NULL,
  snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_snapshot (entity_type, entity_id, period_type, period_key),
  INDEX idx_period (period_type, period_key),
  INDEX idx_rank (rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notes individuelles par participant (liées à client_reviews existante)
CREATE TABLE IF NOT EXISTS client_review_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL COMMENT 'FK vers client_reviews.id',
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  rating TINYINT NOT NULL COMMENT '1-5',
  comment TEXT DEFAULT NULL,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_review (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 2. ALTER TABLE — COLONNES MANQUANTES ────────────────────

-- gamification_profiles : ajouter avg_app_score et avg_client_score
ALTER TABLE gamification_profiles
  ADD COLUMN IF NOT EXISTS avg_app_score DECIMAL(5,2) DEFAULT NULL AFTER avg_review_overall,
  ADD COLUMN IF NOT EXISTS avg_client_score DECIMAL(5,2) DEFAULT NULL AFTER avg_app_score;

-- gamification_levels : ajouter reward_type et reward_payload
ALTER TABLE gamification_levels
  ADD COLUMN IF NOT EXISTS reward_type ENUM('none','cosmetic','functional') NOT NULL DEFAULT 'none' AFTER title,
  ADD COLUMN IF NOT EXISTS reward_payload JSON DEFAULT NULL AFTER reward_type;

-- job_scorecards : ajouter colonnes de scoring détaillé
ALTER TABLE job_scorecards
  ADD COLUMN IF NOT EXISTS app_score_total DECIMAL(5,2) DEFAULT NULL AFTER percentage,
  ADD COLUMN IF NOT EXISTS client_score_total DECIMAL(5,2) DEFAULT NULL AFTER app_score_total,
  ADD COLUMN IF NOT EXISTS final_score DECIMAL(5,2) DEFAULT NULL AFTER client_score_total,
  ADD COLUMN IF NOT EXISTS checkpoints_completed INT NOT NULL DEFAULT 0 AFTER final_score,
  ADD COLUMN IF NOT EXISTS checkpoints_total INT NOT NULL DEFAULT 0 AFTER checkpoints_completed,
  ADD COLUMN IF NOT EXISTS incidents_count INT NOT NULL DEFAULT 0 AFTER checkpoints_total,
  ADD COLUMN IF NOT EXISTS photos_count INT NOT NULL DEFAULT 0 AFTER incidents_count,
  ADD COLUMN IF NOT EXISTS time_variance_minutes INT DEFAULT NULL AFTER photos_count,
  ADD COLUMN IF NOT EXISTS xp_distributed INT NOT NULL DEFAULT 0 AFTER time_variance_minutes,
  ADD COLUMN IF NOT EXISTS trophies_distributed INT NOT NULL DEFAULT 0 AFTER xp_distributed;

-- job_checkpoints : ajouter colonnes manquantes de la spec V2
ALTER TABLE job_checkpoints
  ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) NOT NULL DEFAULT '*' AFTER id,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL AFTER label_en,
  ADD COLUMN IF NOT EXISTS category_v2 ENUM('timing','photo','article_state','incident','communication','completion','safety','documentation') DEFAULT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS scoring_method ENUM('boolean','time_delta','percentage','rating') NOT NULL DEFAULT 'boolean' AFTER category_v2,
  ADD COLUMN IF NOT EXISTS required TINYINT(1) NOT NULL DEFAULT 0 AFTER scoring_method,
  ADD COLUMN IF NOT EXISTS xp_reward INT NOT NULL DEFAULT 5 AFTER required,
  ADD COLUMN IF NOT EXISTS trophy_reward INT NOT NULL DEFAULT 1 AFTER xp_reward,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0 AFTER trophy_reward;

-- trophy_ledgers : ajouter colonnes period_type et period_key (v2)
-- On garde season_key existante et on ajoute les nouvelles sans conflit
ALTER TABLE trophy_ledgers
  ADD COLUMN IF NOT EXISTS period_type ENUM('weekly','monthly','yearly','alltime') DEFAULT NULL AFTER season_key,
  ADD COLUMN IF NOT EXISTS period_key VARCHAR(20) DEFAULT NULL AFTER period_type,
  ADD COLUMN IF NOT EXISTS trophies_earned INT NOT NULL DEFAULT 0 AFTER trophies;

-- ─── 3. SEEDS POUR TABLES EXISTANTES ────────────────────────

-- Seed gamification_levels (reward_type/payload maintenant disponibles)
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"avatar_frame","code":"starter_frame"}' WHERE level = 2 AND reward_type = 'none';
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"title","code":"mover"}' WHERE level = 4 AND reward_type = 'none';
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"badge_slot","extra_slots":1}' WHERE level = 6 AND reward_type = 'none';
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"avatar_frame","code":"expert_frame"}' WHERE level = 8 AND reward_type = 'none';
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"title","code":"elite"}' WHERE level = 10 AND reward_type = 'none';
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"avatar_frame","code":"hero_frame"}' WHERE level = 12 AND reward_type = 'none';
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"theme","code":"legend_theme"}' WHERE level = 13 AND reward_type = 'none';
UPDATE gamification_levels SET reward_type = 'cosmetic', reward_payload = '{"type":"confetti","code":"transcendent_confetti"}' WHERE level = 15 AND reward_type = 'none';

-- Seed job_checkpoints universels (si pas encore présents)
INSERT IGNORE INTO job_checkpoints (job_type, code, label_fr, label_en, category, category_v2, scoring_method, weight, required, xp_reward, trophy_reward, sort_order, is_active) VALUES
('*', 'on_time_arrival',      'Arrivée à l''heure',          'Arrived on time',                  'steps', 'timing',        'time_delta', 8, 1, 10, 2, 1, 1),
('*', 'on_time_completion',   'Terminé dans les temps',      'Completed within estimated time',  'steps', 'timing',        'time_delta', 8, 0, 10, 2, 2, 1),
('*', 'photo_before',         'Photos avant job',            'Photos taken before job',          'photos','photo',         'boolean',    5, 0, 5,  1, 3, 1),
('*', 'photo_after',          'Photos après job',            'Photos taken after job',           'photos','photo',         'boolean',    5, 0, 5,  1, 4, 1),
('*', 'no_damage_reported',   'Aucun dommage signalé',       'No damage incidents',              'steps', 'article_state', 'boolean',    10,0, 15, 3, 5, 1),
('*', 'client_signature',     'Signature client collectée',  'Client signature collected',       'documents','documentation','boolean',  5, 1, 5,  1, 6, 1),
('*', 'inventory_complete',   'Inventaire complété',         'Inventory list completed',         'documents','documentation','boolean',  4, 0, 5,  1, 7, 1),
('*', 'communication_update', 'Client informé en cours',     'Client updated during job',        'notes', 'communication', 'boolean',    3, 0, 5,  1, 9, 1);

SELECT 'Migration 068 — Gamification V2 Foundation (Additive) : OK' AS result;


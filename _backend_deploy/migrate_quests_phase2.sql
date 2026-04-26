-- migrate_quests_phase2.sql
-- Phase 2.2 : Mise à jour du schéma quêtes pour supporter les catégories intro et event
-- À exécuter via deploy_quests_phase2.py

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Table des événements de quêtes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_quest_events (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(50) NOT NULL UNIQUE,
  name                VARCHAR(100) NOT NULL,
  icon                VARCHAR(10)  NOT NULL DEFAULT '',
  color               VARCHAR(7)   NOT NULL DEFAULT '#FF6A4A',
  xp_bonus_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  start_date          DATETIME     NULL,
  end_date            DATETIME     NULL,
  active              TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (active),
  INDEX idx_dates  (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Étendre le ENUM type pour inclure intro et event
--    (doit être fait avant UPDATE pour éviter l'erreur d'ENUM inconnu)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE quests
  MODIFY COLUMN type ENUM('daily','weekly','monthly','general','onboarding','intro','event') NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Ajouter les nouvelles colonnes
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS category    ENUM('intro','daily','weekly','monthly','event') NULL AFTER type,
  ADD COLUMN IF NOT EXISTS trophy_count INT NOT NULL DEFAULT 0 AFTER trophy_reward,
  ADD COLUMN IF NOT EXISTS end_date    DATETIME NULL AFTER sort_order,
  ADD COLUMN IF NOT EXISTS event_id    INT NULL AFTER end_date,
  ADD INDEX  IF NOT EXISTS idx_category (category),
  ADD INDEX  IF NOT EXISTS idx_event_id (event_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Migrer category depuis type
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE quests SET category = 'daily'   WHERE type = 'daily'                        AND category IS NULL;
UPDATE quests SET category = 'weekly'  WHERE type = 'weekly'                       AND category IS NULL;
UPDATE quests SET category = 'monthly' WHERE type = 'monthly'                      AND category IS NULL;
UPDATE quests SET category = 'intro'   WHERE type IN ('general','onboarding')      AND category IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Migrer le type lui-même : general/onboarding → intro
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE quests SET type = 'intro' WHERE type IN ('general','onboarding');

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. trophy_count = trophy_reward (copie initiale)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE quests SET trophy_count = trophy_reward WHERE trophy_count = 0 AND trophy_reward > 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Rendre category NOT NULL maintenant que tout est migré
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE quests
  MODIFY COLUMN category ENUM('intro','daily','weekly','monthly','event') NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Vérification
-- ─────────────────────────────────────────────────────────────────────────────
SELECT CONCAT('✅ quests migrated: ', COUNT(*), ' rows') AS status FROM quests;
SELECT category, type, COUNT(*) AS count FROM quests GROUP BY category, type ORDER BY category;
SELECT 'gamification_quest_events created' AS events_table;

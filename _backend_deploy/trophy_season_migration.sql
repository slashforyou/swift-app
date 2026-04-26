-- trophy_season_migration.sql
-- Phase 3 : Trophées saisonniers
-- Crée les tables trophy_events, trophy_ledgers, trophy_season_archives

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. trophy_events — Historique idempotent de chaque gain de trophées
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trophy_events (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  entity_type   ENUM('user','company') NOT NULL,
  entity_id     INT NOT NULL,
  source_type   ENUM('job','review','quest','manual') NOT NULL,
  source_id     VARCHAR(100) NOT NULL,
  trophy_amount INT NOT NULL,
  season_key    VARCHAR(30) NOT NULL,  -- ex: 'season_winter_2026'
  job_id        INT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity  (entity_type, entity_id),
  INDEX idx_season  (season_key),
  UNIQUE KEY uq_idempotent (entity_type, entity_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. trophy_ledgers — Compteur cumulé par entité + saison
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trophy_ledgers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id   INT NOT NULL,
  season_key  VARCHAR(30) NOT NULL,
  trophies    INT NOT NULL DEFAULT 0,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_entity_season (entity_type, entity_id, season_key),
  INDEX idx_season (season_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. trophy_season_archives — Résultats archivés à la fin de chaque saison
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trophy_season_archives (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id   INT NOT NULL,
  season_key  VARCHAR(30) NOT NULL,
  season_name VARCHAR(100) NOT NULL,
  season_icon VARCHAR(10)  NOT NULL DEFAULT '',
  trophies    INT NOT NULL DEFAULT 0,
  rank        INT NULL,                -- classement au sein de la saison
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_entity_season (entity_type, entity_id, season_key),
  INDEX idx_season (season_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Vérification
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 'trophy_events created'          AS status;
SELECT 'trophy_ledgers created'         AS status;
SELECT 'trophy_season_archives created' AS status;

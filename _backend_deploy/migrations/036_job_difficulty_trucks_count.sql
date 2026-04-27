-- Migration 036: Job difficulty + multi-trucks enable
-- Date: 2026-04-28
-- Ajoute difficulty (niveau de complexité du job) et trucks_count (nb de camions requis)
-- sur la table jobs. Idempotent via IF NOT EXISTS.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS difficulty ENUM('easy','medium','hard','expert') DEFAULT NULL
    COMMENT 'Niveau de difficulté estimé du job';

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS trucks_count TINYINT UNSIGNED NOT NULL DEFAULT 1
    COMMENT 'Nombre de camions requis pour ce job';

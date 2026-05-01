-- =============================================================================
-- Migration: 064_create_job_quality_scores.sql
-- Phase 3 Gamification: Job Quality Score (JQS)
-- Author: Nora — Database Engineer
-- Date: 2026-05-01
-- Status: LOCALE UNIQUEMENT — ne pas exécuter avant que les 6 event_types
--         manquants soient injectés dans le code serveur
-- =============================================================================
-- Réversible : OUI — voir section DOWN en bas de fichier
-- =============================================================================

-- ============================================================
-- BLOC 1 — Table job_quality_scores
-- ============================================================
-- Une ligne par job complété.
-- job_id est la PK (1 score par job, pas de recalcul multiple).
-- user_id : acteur principal du job (peut être NULL si non tracké).
-- company_id : isolation multi-tenant obligatoire.
-- score : 0-100 TINYINT UNSIGNED — total JQS calculé à la completion.
-- criteria_json : détail par critère pour audit et affichage frontend.
-- calculated_at : horodatage du calcul (≠ created_at du job).

CREATE TABLE IF NOT EXISTS job_quality_scores (
  job_id         INT                NOT NULL,
  user_id        INT                NULL,
  company_id     INT                NOT NULL,
  score          TINYINT UNSIGNED   NOT NULL DEFAULT 0,
  criteria_json  JSON               NOT NULL,
  calculated_at  DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (job_id),

  -- FKs : tous INT (signed) pour correspondre exactement aux tables cibles
  CONSTRAINT fk_jqs_job      FOREIGN KEY (job_id)     REFERENCES jobs(id)      ON DELETE CASCADE,
  CONSTRAINT fk_jqs_user     FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE SET NULL,
  CONSTRAINT fk_jqs_company  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Job Quality Score calculé à la completion de chaque job (Phase 3 Gamification)';

-- ============================================================
-- BLOC 2 — Index sur job_quality_scores
-- ============================================================

-- (user_id, calculated_at) : requêtes leaderboard et historique JQS par user
-- Exemple : SELECT * FROM job_quality_scores WHERE user_id = ? ORDER BY calculated_at DESC
CREATE INDEX idx_jqs_user_time ON job_quality_scores (user_id, calculated_at);

-- (company_id) : agrégation et filtrage multi-tenant
-- Exemple : SELECT AVG(score) FROM job_quality_scores WHERE company_id = ?
CREATE INDEX idx_jqs_company   ON job_quality_scores (company_id);

-- Note : (score) non indexé — les requêtes de tri par score passent par user_id ou company_id d'abord.

-- ============================================================
-- BLOC 3 — Ajout de reputation_score dans users
-- ============================================================
-- Moyenne glissante des JQS d'un user sur ses derniers jobs complétés.
-- DECIMAL(4,2) : plage 0.00 à 99.99 — suffisant pour une moyenne (100.00 exact
-- est théoriquement impossible en pratique). Si la logique permet 100.00,
-- migrer vers DECIMAL(5,2) lors d'une prochaine migration.
-- NULL par défaut : NULL = pas encore de score calculé (≠ 0 qui signifie mauvais score).

ALTER TABLE users
  ADD COLUMN reputation_score DECIMAL(4,2) NULL DEFAULT NULL
  COMMENT 'Moyenne glissante des Job Quality Scores (JQS Phase 3 Gamification)';

-- ============================================================
-- Format attendu de criteria_json
-- ============================================================
-- {
--   "photo_added":         { "earned": true,  "points": 20, "max": 20 },
--   "signature_collected": { "earned": true,  "points": 20, "max": 20 },
--   "payment_collected":   { "earned": false, "points": 0,  "max": 20 },
--   "damage_reported":     { "earned": true,  "points": 15, "max": 15 },
--   "review_submitted":    { "earned": false, "points": 0,  "max": 15, "stars": null },
--   "note_added":          { "earned": true,  "points": 5,  "max": 5  },
--   "job_completed":       { "earned": true,  "points": 5,  "max": 5  }
-- }

-- ============================================================
-- DOWN — Rollback complet
-- ============================================================
-- IMPORTANT : exécuter dans cet ordre (FK en premier)
--
-- ALTER TABLE users DROP COLUMN reputation_score;
-- DROP TABLE IF EXISTS job_quality_scores;

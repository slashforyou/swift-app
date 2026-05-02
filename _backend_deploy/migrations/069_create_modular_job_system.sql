-- =============================================================================
-- 069 — Système de job modulaire : segments + assignations employés + colonnes jobs
-- Idempotent — peut être relancé sans danger
-- Auteur : Nora — 2026-05-02
--
-- Crée :
--   - job_segment_instances (runtime segments d'un job)
--   - segment_employee_assignments (employé ↔ segment)
--   - Colonnes sur jobs : modular_template_id, billing_mode, flat_rate_*, return_trip_minutes
-- =============================================================================

SET foreign_key_checks = 0;

-- =============================================================================
-- TABLE : job_segment_instances
-- Instances runtime des segments d'un job (créées à partir du template).
-- Reliée à jobs(id) — isolation multi-company garantie via jobs.company_id.
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_segment_instances (
  id                           INT NOT NULL AUTO_INCREMENT,
  job_id                       INT NOT NULL,
  template_segment_id          INT DEFAULT NULL,
  segment_order                INT NOT NULL,
  type                         ENUM('location','travel','storage','loading','service') NOT NULL,
  label                        VARCHAR(100) DEFAULT NULL,
  location_type                ENUM('house','apartment','garage','private_storage','depot','office','other') DEFAULT NULL,
  is_billable                  TINYINT(1) NOT NULL DEFAULT 1,
  started_at                   TIMESTAMP NULL DEFAULT NULL,
  completed_at                 TIMESTAMP NULL DEFAULT NULL,
  duration_ms                  BIGINT DEFAULT NULL,
  is_return_trip               TINYINT(1) NOT NULL DEFAULT 0,
  configured_duration_minutes  INT DEFAULT NULL,
  created_at                   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_jsi_job_id     (job_id),
  KEY idx_jsi_order      (job_id, segment_order),
  KEY idx_jsi_template   (template_segment_id),
  CONSTRAINT fk_jsi_job      FOREIGN KEY (job_id)              REFERENCES jobs(id)               ON DELETE CASCADE,
  CONSTRAINT fk_jsi_template FOREIGN KEY (template_segment_id) REFERENCES job_template_segments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE : segment_employee_assignments
-- Assignation N-N employé ↔ instance de segment.
-- Pas de company_id direct : isolation garantie via job_segment_instances → jobs.
-- =============================================================================
CREATE TABLE IF NOT EXISTS segment_employee_assignments (
  id                   INT NOT NULL AUTO_INCREMENT,
  segment_instance_id  INT NOT NULL,
  employee_id          INT NOT NULL,
  role                 VARCHAR(50) NOT NULL DEFAULT 'mover',
  worked_duration_ms   BIGINT DEFAULT NULL,
  hourly_rate          DECIMAL(10,2) DEFAULT NULL,
  cost                 DECIMAL(10,2) DEFAULT NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sea_segment  (segment_instance_id),
  KEY idx_sea_employee (employee_id),
  CONSTRAINT fk_sea_segment  FOREIGN KEY (segment_instance_id) REFERENCES job_segment_instances(id) ON DELETE CASCADE,
  CONSTRAINT fk_sea_employee FOREIGN KEY (employee_id)         REFERENCES users(id)                 ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- COLONNES sur jobs
-- Ajout conditionnel via procédure stockée (MariaDB : pas de ADD COLUMN IF NOT EXISTS natif)
-- =============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS _add_col_if_missing$$
CREATE PROCEDURE _add_col_if_missing(
  IN p_table VARCHAR(64),
  IN p_col   VARCHAR(64),
  IN p_def   TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name   = p_table
      AND column_name  = p_col
  ) THEN
    SET @_sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);
    PREPARE _stmt FROM @_sql;
    EXECUTE _stmt;
    DEALLOCATE PREPARE _stmt;
  END IF;
END$$

DELIMITER ;

-- ─── modular_template_id ─────────────────────────────────────────────────────
-- FK vers job_templates_modular (template utilisé pour initialiser ce job)
CALL _add_col_if_missing(
  'jobs',
  'modular_template_id',
  'INT DEFAULT NULL AFTER id'
);

-- ─── billing_mode ─────────────────────────────────────────────────────────────
-- Mode de facturation hérité du template au moment de l'init du job.
-- 'unpacking_only' inclus pour aligner avec le type BillingMode TypeScript.
CALL _add_col_if_missing(
  'jobs',
  'billing_mode',
  "ENUM('location_to_location','depot_to_depot','flat_rate','packing_only','unpacking_only') DEFAULT 'location_to_location'"
);

-- ─── flat_rate_amount ─────────────────────────────────────────────────────────
-- Montant forfaitaire fixe (mode flat_rate)
CALL _add_col_if_missing(
  'jobs',
  'flat_rate_amount',
  'DECIMAL(10,2) DEFAULT NULL'
);

-- ─── flat_rate_max_hours ──────────────────────────────────────────────────────
-- Plafond horaire inclus dans le forfait
CALL _add_col_if_missing(
  'jobs',
  'flat_rate_max_hours',
  'DECIMAL(4,2) DEFAULT NULL'
);

-- ─── flat_rate_overage_rate ───────────────────────────────────────────────────
-- Taux horaire si dépassement du plafond forfait
CALL _add_col_if_missing(
  'jobs',
  'flat_rate_overage_rate',
  'DECIMAL(10,2) DEFAULT NULL'
);

-- ─── return_trip_minutes ──────────────────────────────────────────────────────
-- Durée configurée du trajet retour (override du template)
CALL _add_col_if_missing(
  'jobs',
  'return_trip_minutes',
  'INT DEFAULT NULL'
);

-- ─── FK index sur modular_template_id ─────────────────────────────────────────
-- Ajout de l'index séparément (idempotent via CREATE INDEX IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_jobs_modular_template ON jobs (modular_template_id);

-- Nettoyage
DROP PROCEDURE IF EXISTS _add_col_if_missing;

SET foreign_key_checks = 1;

-- =============================================================================
-- Diagnostic final
-- =============================================================================
SELECT
  CONCAT(
    'job_segment_instances : ',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_schema = DATABASE()
                        AND table_name = 'job_segment_instances')
         THEN 'OK' ELSE 'MANQUANT' END,
    ' | segment_employee_assignments : ',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_schema = DATABASE()
                        AND table_name = 'segment_employee_assignments')
         THEN 'OK' ELSE 'MANQUANT' END
  ) AS tables_status;

SELECT
  CONCAT(
    'jobs.modular_template_id : ',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = DATABASE() AND table_name = 'jobs'
                        AND column_name = 'modular_template_id')
         THEN 'OK' ELSE 'MANQUANT' END,
    ' | billing_mode : ',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = DATABASE() AND table_name = 'jobs'
                        AND column_name = 'billing_mode')
         THEN 'OK' ELSE 'MANQUANT' END,
    ' | flat_rate_amount : ',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = DATABASE() AND table_name = 'jobs'
                        AND column_name = 'flat_rate_amount')
         THEN 'OK' ELSE 'MANQUANT' END,
    ' | return_trip_minutes : ',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = DATABASE() AND table_name = 'jobs'
                        AND column_name = 'return_trip_minutes')
         THEN 'OK' ELSE 'MANQUANT' END
  ) AS columns_status;

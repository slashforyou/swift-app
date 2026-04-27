-- Migration 042: Vehicle mileage tracking (suivi kilométrique)
-- Date: 2026-04-28
-- Ajoute les colonnes de suivi odomètre sur vehicles.
-- vehicle_mileage_logs : log immuable de chaque relevé kilométrique.
--   km_driven est une colonne calculée STORED (odometer_after - odometer_before).
--   job_id est nullable : un log peut être fait hors-job (entretien, transfert dépôt).
-- logged_by sans CASCADE : log d'audit conservé même si l'user est supprimé.

-- ─── Colonnes odomètre sur vehicles ──────────────────────────────────────────
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS current_odometer_km  DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Kilométrage actuel (mis à jour à chaque log)',
  ADD COLUMN IF NOT EXISTS last_service_km       DECIMAL(10,2) DEFAULT NULL
    COMMENT 'Kilométrage au dernier entretien',
  ADD COLUMN IF NOT EXISTS next_service_km       DECIMAL(10,2) DEFAULT NULL
    COMMENT 'Kilométrage cible du prochain entretien',
  ADD COLUMN IF NOT EXISTS next_service_date     DATE          DEFAULT NULL
    COMMENT 'Date cible du prochain entretien (si basé sur calendrier)',
  ADD COLUMN IF NOT EXISTS service_interval_km   DECIMAL(10,2) NOT NULL DEFAULT 10000.00
    COMMENT 'Intervalle entre entretiens en km';

-- ─── Log kilométrique par trajet / job ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_mileage_logs (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  vehicle_id       INT UNSIGNED  NOT NULL,
  company_id       INT UNSIGNED  NOT NULL,
  job_id           INT UNSIGNED  DEFAULT NULL,
  logged_by        INT UNSIGNED  NOT NULL,
  odometer_before  DECIMAL(10,2) NOT NULL,
  odometer_after   DECIMAL(10,2) NOT NULL,
  km_driven        DECIMAL(8,2)  GENERATED ALWAYS AS (odometer_after - odometer_before) STORED
                   COMMENT 'Calculé automatiquement : odometer_after - odometer_before',
  note             VARCHAR(255)  DEFAULT NULL,
  logged_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_vml_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_vml_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_vml_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_vml_logger
    FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE RESTRICT,

  -- Historique par véhicule
  INDEX idx_vml_vehicle (vehicle_id),
  -- Isolation multi-company
  INDEX idx_vml_company (company_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

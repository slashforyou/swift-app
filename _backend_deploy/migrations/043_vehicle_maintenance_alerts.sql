-- Migration 043: Vehicle maintenance alerts
-- Date: 2026-04-28
-- Alertes d'entretien planifiées ou déclenchées sur un véhicule.
-- due_date ET due_km sont nullable : une alerte peut être basée sur l'un, l'autre, ou les deux.
-- resolved_by sans CASCADE : audit trail conservé.
-- Index compound (vehicle_id, status) et (company_id, status) pour les requêtes
-- de tableau de bord : "tous les entretiens pending de la company".

CREATE TABLE IF NOT EXISTS vehicle_maintenance_alerts (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  vehicle_id   INT UNSIGNED  NOT NULL,
  company_id   INT UNSIGNED  NOT NULL,
  alert_type   ENUM('oil_change','tyre','brake','registration','inspection','other')
               NOT NULL,
  title        VARCHAR(150)  NOT NULL,
  due_date     DATE          DEFAULT NULL
               COMMENT 'Date limite si alerte calendaire',
  due_km       DECIMAL(10,2) DEFAULT NULL
               COMMENT 'Kilométrage limite si alerte basée sur odomètre',
  status       ENUM('pending','done','overdue','snoozed') NOT NULL DEFAULT 'pending',
  notes        VARCHAR(500)  DEFAULT NULL,
  created_by   INT UNSIGNED  NOT NULL,
  resolved_by  INT UNSIGNED  DEFAULT NULL,
  resolved_at  TIMESTAMP     DEFAULT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_vma_vehicle
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_vma_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_vma_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vma_resolver
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,

  -- Dashboard véhicule : alertes actives
  INDEX idx_vma_vehicle_status  (vehicle_id, status),
  -- Dashboard company : toutes les alertes actives
  INDEX idx_vma_company_status  (company_id, status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

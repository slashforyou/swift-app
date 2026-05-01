-- Migration 059 : Création de job_contractor_assignments
-- Assignation d'un contractor individuel (utilisateur app) à un job spécifique.
--
-- ══════════════════════════════════════════════════════════════════════════════
-- DISTINCTION CRITIQUE — NE PAS CONFONDRE :
--
--   job_transfers (migration 014)
--     = transfert B2B company-to-company
--     = une COMPANY sous-traite un job ENTIER à une autre COMPANY Cobbr
--     = l'unité est la company, pas l'individu
--
--   job_contractor_assignments (cette table)
--     = assignation P2P user-level
--     = une company assigne un CONTRACTOR INDIVIDUEL pour travailler sur un job
--     = l'unité est l'utilisateur (user_id), pas la company
--
-- Ces deux tables coexistent sans se remplacer ni se lier.
-- ══════════════════════════════════════════════════════════════════════════════
--
-- company_id : scope multi-company de l'assignation (la company qui assigne).
-- assigned_by_user_id ON DELETE SET NULL : traçabilité même si le manager part.
-- decline_reason TEXT NULL : raison optionnelle fournie par le contractor.
-- responded_at : date à laquelle le contractor a accepté ou refusé.
-- Idempotente (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS job_contractor_assignments (
  id                  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  job_id              INT UNSIGNED   NOT NULL,
  company_id          INT UNSIGNED   NOT NULL,
  contractor_user_id  INT UNSIGNED   NOT NULL,
  role_label          VARCHAR(100)   NULL
                      COMMENT 'Rôle libre sur ce job : "offsider", "driver", "packer", etc.',
  rate_type           ENUM('hourly', 'flat', 'daily') NOT NULL DEFAULT 'flat',
  rate_amount         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  status              ENUM('pending', 'accepted', 'declined', 'completed') NOT NULL DEFAULT 'pending',
  decline_reason      TEXT           NULL,
  assigned_by_user_id INT UNSIGNED   NULL,
  responded_at        DATETIME       NULL,
  created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_jca_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_jca_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_jca_contractor
    FOREIGN KEY (contractor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_jca_assigned_by
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Requête : "toutes les assignations d'un job" (vue job detail)
  INDEX idx_jca_job_status (job_id, status),
  -- Requête : "tous les jobs d'un contractor" (vue contractor dashboard)
  INDEX idx_jca_contractor_status (contractor_user_id, status),
  -- Scope multi-company : "toutes les assignations d'une company"
  INDEX idx_jca_company (company_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

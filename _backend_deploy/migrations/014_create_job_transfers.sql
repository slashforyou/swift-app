-- Migration 014: Create job_transfers table
-- Table de délégation B2B de jobs entre entreprises

CREATE TABLE IF NOT EXISTS job_transfers (
  id                        INT(11) NOT NULL AUTO_INCREMENT,
  job_id                    INT(11) NOT NULL,

  -- Entreprise qui délègue (owner du job)
  sender_company_id         INT(11) NOT NULL,

  -- Destinataire (entreprise ou contractor individuel)
  recipient_type            ENUM('company','contractor') NOT NULL DEFAULT 'company',
  recipient_company_id      INT(11) NULL,
  recipient_contractor_id   INT(11) NULL,

  -- Rôle délégué
  delegated_role            ENUM('driver','offsider','full_job','custom') NOT NULL DEFAULT 'full_job',
  delegated_role_label      VARCHAR(100) NULL COMMENT 'Utilisé si role=custom',

  -- Tarification proposée
  pricing_type              ENUM('flat','hourly','daily') NOT NULL DEFAULT 'flat',
  pricing_amount            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency                  VARCHAR(10) NOT NULL DEFAULT 'AUD',

  -- Message optionnel
  message                   TEXT NULL,

  -- Statut
  status                    ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
  decline_reason            TEXT NULL,

  -- Timestamps
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at              DATETIME NULL,
  cancelled_at              DATETIME NULL,
  created_by_user_id        INT(11) NULL,
  responded_by_user_id      INT(11) NULL,

  PRIMARY KEY (id),
  KEY idx_jt_job_id           (job_id),
  KEY idx_jt_sender           (sender_company_id),
  KEY idx_jt_recipient_co     (recipient_company_id),
  KEY idx_jt_status           (status),

  CONSTRAINT fk_jt_job        FOREIGN KEY (job_id)               REFERENCES jobs(id)      ON DELETE CASCADE,
  CONSTRAINT fk_jt_sender     FOREIGN KEY (sender_company_id)    REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PHASE 1 — Migration consolidée server (sushinari)
-- Adapté au schéma réel : users.id = INT(11), companies.id = INT(11)
-- Idempotent — peut être relancé sans danger
-- =============================================================================
-- Généré le : 2026-05-01
-- =============================================================================

SET foreign_key_checks = 0;

-- -----------------------------------------------------------------------------
-- 055 — account_type sur users
-- La colonne existe déjà avec ENUM('business_owner','abn_contractor','employee')
-- On ajoute 'contractor' pour aligner avec le code mobile
-- -----------------------------------------------------------------------------
ALTER TABLE users MODIFY COLUMN account_type
  ENUM('business_owner','abn_contractor','employee','contractor')
  NOT NULL DEFAULT 'business_owner';

-- -----------------------------------------------------------------------------
-- 056 — company_memberships
-- FK vers int(11) — on utilise INT (signé) pour correspondre
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_memberships (
  id                  INT NOT NULL AUTO_INCREMENT,
  user_id             INT NOT NULL,
  company_id          INT NOT NULL,
  role                ENUM('owner','manager','employee') NOT NULL DEFAULT 'employee',
  can_create_jobs     TINYINT(1) NOT NULL DEFAULT 0,
  can_assign_staff    TINYINT(1) NOT NULL DEFAULT 0,
  can_view_financials TINYINT(1) NOT NULL DEFAULT 0,
  can_collect_payment TINYINT(1) NOT NULL DEFAULT 0,
  can_manage_stripe   TINYINT(1) NOT NULL DEFAULT 0,
  status              ENUM('active','invited','suspended') NOT NULL DEFAULT 'active',
  invited_by_user_id  INT NULL,
  joined_at           DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cm_user_company (user_id, company_id),
  KEY idx_cm_company  (company_id),
  KEY idx_cm_status   (status),
  CONSTRAINT fk_cm_user    FOREIGN KEY (user_id)            REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_cm_company FOREIGN KEY (company_id)         REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_inviter FOREIGN KEY (invited_by_user_id) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 056b — Backfill : créer un membership owner pour tous les business_owners
-- INSERT IGNORE = idempotent
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO company_memberships
  (user_id, company_id, role,
   can_create_jobs, can_assign_staff, can_view_financials,
   can_collect_payment, can_manage_stripe,
   status, invited_by_user_id, joined_at, created_at)
SELECT
  u.id,
  u.company_id,
  'owner',
  1, 1, 1, 1, 1,
  'active',
  NULL,
  u.created_at,
  NOW()
FROM users u
WHERE u.company_id IS NOT NULL
  AND u.account_type IN ('business_owner', 'abn_contractor');

-- Diagnostic
SELECT
  CONCAT('Backfill OK — ', COUNT(*), ' memberships owner insérés/existants') AS backfill_status
FROM company_memberships WHERE role = 'owner';

SELECT
  CONCAT('Attention : ', COUNT(*), ' users sans membership (company_id IS NULL ou non owner)')
  AS users_sans_membership
FROM users u
LEFT JOIN company_memberships cm ON cm.user_id = u.id AND cm.company_id = u.company_id
WHERE cm.id IS NULL;

-- -----------------------------------------------------------------------------
-- 057 — contractor_profiles (1-1 avec users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id              INT NOT NULL AUTO_INCREMENT,
  user_id         INT NOT NULL,
  abn             VARCHAR(20)  NULL,
  rate_type       ENUM('hourly','flat','daily') NOT NULL DEFAULT 'hourly',
  rate_amount     DECIMAL(10,2) NULL,
  gst_registered  TINYINT(1)   NOT NULL DEFAULT 0,
  bio             TEXT NULL,
  specialties     TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cp_user (user_id),
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 058 — company_contractors (N-N company ↔ contractor users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_contractors (
  id                  INT NOT NULL AUTO_INCREMENT,
  company_id          INT NOT NULL,
  contractor_user_id  INT NOT NULL,
  status              ENUM('invited','active','suspended') NOT NULL DEFAULT 'invited',
  invited_by_user_id  INT NULL,
  joined_at           DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cc_company_contractor (company_id, contractor_user_id),
  KEY idx_cc_company    (company_id),
  KEY idx_cc_contractor (contractor_user_id),
  CONSTRAINT fk_cc_company    FOREIGN KEY (company_id)         REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cc_contractor FOREIGN KEY (contractor_user_id) REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_cc_inviter    FOREIGN KEY (invited_by_user_id) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 059 — job_contractor_assignments
-- DISTINCT de job_transfers (B2B) — c'est l'assignation d'un contractor à un job
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_contractor_assignments (
  id                  INT NOT NULL AUTO_INCREMENT,
  job_id              INT NOT NULL,
  contractor_user_id  INT NOT NULL,
  company_id          INT NOT NULL,
  status              ENUM('pending','accepted','declined','completed') NOT NULL DEFAULT 'pending',
  assigned_by_user_id INT NULL,
  responded_at        DATETIME NULL,
  decline_reason      TEXT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_jca_job_contractor (job_id, contractor_user_id),
  KEY idx_jca_job        (job_id),
  KEY idx_jca_contractor (contractor_user_id),
  KEY idx_jca_company    (company_id),
  CONSTRAINT fk_jca_job        FOREIGN KEY (job_id)              REFERENCES jobs(id)    ON DELETE CASCADE,
  CONSTRAINT fk_jca_contractor FOREIGN KEY (contractor_user_id)  REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_jca_company    FOREIGN KEY (company_id)          REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_jca_assigner   FOREIGN KEY (assigned_by_user_id) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 060 — client_invoices (flux entrant — argent du client vers la company)
-- SÉPARÉ de contractor_payables (flux sortant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_invoices (
  id                              INT NOT NULL AUTO_INCREMENT,
  company_id                      INT NOT NULL,
  job_id                          INT NULL,
  client_id                       INT NULL,
  invoice_number                  VARCHAR(60)  NOT NULL,
  status                          ENUM('draft','deposit_pending','deposit_paid','balance_pending','paid','void')
                                    NOT NULL DEFAULT 'draft',
  deposit_amount                  DECIMAL(10,2) NULL,
  balance_amount                  DECIMAL(10,2) NULL,
  total_amount                    DECIMAL(10,2) NULL,
  currency                        VARCHAR(3)   NOT NULL DEFAULT 'AUD',
  signed_at                       DATETIME NULL,
  signed_by_user_id               INT NULL,
  stripe_payment_intent_deposit   VARCHAR(100) NULL,
  stripe_payment_intent_balance   VARCHAR(100) NULL,
  notes                           TEXT NULL,
  created_by_user_id              INT NULL,
  created_at                      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ci_invoice_number (company_id, invoice_number),
  KEY idx_ci_company (company_id),
  KEY idx_ci_job     (job_id),
  KEY idx_ci_status  (status),
  CONSTRAINT fk_ci_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_job     FOREIGN KEY (job_id)     REFERENCES jobs(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 061 — contractor_payables (flux sortant — argent de la company vers contractor)
-- JAMAIS lié à client_invoices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contractor_payables (
  id                    INT NOT NULL AUTO_INCREMENT,
  company_id            INT NOT NULL,
  job_id                INT NOT NULL,
  contractor_user_id    INT NOT NULL,
  amount                DECIMAL(10,2) NOT NULL,
  currency              VARCHAR(3)    NOT NULL DEFAULT 'AUD',
  status                ENUM('pending','approved','paid','voided') NOT NULL DEFAULT 'pending',
  payment_method        ENUM('cash','bank_transfer','stripe','other') NULL,
  payment_reference     VARCHAR(200) NULL,
  description           TEXT NULL,
  approved_by_user_id   INT NULL,
  paid_at               DATETIME NULL,
  created_by_user_id    INT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cp_job_contractor (job_id, contractor_user_id),
  KEY idx_cp_company    (company_id),
  KEY idx_cp_contractor (contractor_user_id),
  KEY idx_cp_status     (status),
  CONSTRAINT fk_cpay_company    FOREIGN KEY (company_id)          REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cpay_job        FOREIGN KEY (job_id)              REFERENCES jobs(id)      ON DELETE CASCADE,
  CONSTRAINT fk_cpay_contractor FOREIGN KEY (contractor_user_id)  REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_cpay_approver   FOREIGN KEY (approved_by_user_id) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 062 — job_events (log audit append-only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_events (
  id              INT NOT NULL AUTO_INCREMENT,
  job_id          INT NOT NULL,
  company_id      INT NOT NULL,
  actor_user_id   INT NULL,
  event_type      VARCHAR(100) NOT NULL,
  payload         JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_je_job     (job_id),
  KEY idx_je_company (company_id),
  KEY idx_je_type    (event_type),
  CONSTRAINT fk_je_job     FOREIGN KEY (job_id)       REFERENCES jobs(id)     ON DELETE CASCADE,
  CONSTRAINT fk_je_company FOREIGN KEY (company_id)   REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_je_actor   FOREIGN KEY (actor_user_id) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;

-- -----------------------------------------------------------------------------
-- Vérification finale
-- -----------------------------------------------------------------------------
SELECT
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'swiftapp'
  AND TABLE_NAME IN (
    'company_memberships',
    'contractor_profiles',
    'company_contractors',
    'job_contractor_assignments',
    'client_invoices',
    'contractor_payables',
    'job_events'
  )
ORDER BY TABLE_NAME;

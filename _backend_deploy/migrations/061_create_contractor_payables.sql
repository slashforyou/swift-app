-- Migration 061 : Création de contractor_payables
-- Paiements dus aux contractors — argent SORTANT de la company.
--
-- ══════════════════════════════════════════════════════════════════════════════
-- DISTINCTION CRITIQUE — NE PAS CONFONDRE :
--
--   contractor_payables (cette table)
--     = ce que la COMPANY doit payer au CONTRACTOR
--     = flux SORTANT (charges)
--     = lié à users(id) [contractor]
--
--   client_invoices (migration 060)
--     = ce que le CLIENT doit payer à la COMPANY
--     = flux ENTRANT (recettes)
--     = lié à clients(id)
--
-- NE JAMAIS lier ces deux tables via FK ou jointure implicite.
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Phase 1 : validation manuelle uniquement.
--   Flux : pending → approved (par un manager) → paid (avec payment_reference)
-- Phase 2 (futur) : Stripe Connect — ajouter stripe_transfer_id via ALTER TABLE.
--
-- UNIQUE (job_id, contractor_user_id) : un seul payable par contractor par job.
--   Hypothèse Phase 1 : un contractor ne fait qu'une prestation par job.
--   Si besoin de multi-session → lever cette contrainte via migration.
--
-- hours_worked NULL si rate_type != 'hourly'.
-- approved_by_user_id ON DELETE SET NULL : traçabilité même si le manager part.
-- Idempotente (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS contractor_payables (
  id                  INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  job_id              INT UNSIGNED   NOT NULL,
  company_id          INT UNSIGNED   NOT NULL,
  contractor_user_id  INT UNSIGNED   NOT NULL,
  amount              DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  currency            VARCHAR(10)    NOT NULL DEFAULT 'AUD',
  rate_type           ENUM('hourly', 'flat', 'daily') NOT NULL DEFAULT 'flat',
  hours_worked        DECIMAL(5,2)   NULL
                      COMMENT 'Rempli si rate_type = hourly. NULL sinon.',
  status              ENUM('pending', 'approved', 'paid', 'voided') NOT NULL DEFAULT 'pending',
  approved_by_user_id INT UNSIGNED   NULL,
  approved_at         DATETIME       NULL,
  paid_at             DATETIME       NULL,
  payment_method      ENUM('cash', 'bank_transfer', 'stripe', 'other') NULL,
  payment_reference   VARCHAR(255)   NULL
                      COMMENT 'Référence bancaire, ID transaction Stripe, ou note manuelle',
  notes               TEXT           NULL,
  generated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Un seul payable par contractor par job (Phase 1)
  -- Si multi-session nécessaire en Phase 2 : supprimer cette contrainte via migration.
  UNIQUE KEY uq_cpay_job_contractor (job_id, contractor_user_id),

  CONSTRAINT fk_cpay_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_cpay_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cpay_contractor
    FOREIGN KEY (contractor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cpay_approved_by
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Dashboard finance : payables d'une company par statut
  INDEX idx_cpay_company_status (company_id, status),
  -- Requête : "tout ce qu'on doit à ce contractor" (vue contractor)
  INDEX idx_cpay_contractor_status (contractor_user_id, status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

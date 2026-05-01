-- Migration 060 : Création de client_invoices
-- Facturation client final — argent ENTRANT pour la company.
--
-- ══════════════════════════════════════════════════════════════════════════════
-- DISTINCTION CRITIQUE — NE PAS CONFONDRE :
--
--   client_invoices (cette table)
--     = ce que le CLIENT doit payer à la COMPANY
--     = flux ENTRANT (recettes)
--     = lié à clients(id)
--
--   contractor_payables (migration 061)
--     = ce que la COMPANY doit payer au CONTRACTOR
--     = flux SORTANT (charges)
--     = lié à users(id)
--
-- Ces deux tables représentent des flux financiers OPPOSÉS.
-- NE JAMAIS les lier via FK ou jointure implicite.
-- ══════════════════════════════════════════════════════════════════════════════
--
-- Deposit + balance en champs séparés : paiement en 2 fois (acompte + solde).
-- stripe_payment_intent_* : identifiants Stripe pour traçabilité et réconciliation.
-- client_id ON DELETE SET NULL : la facture est conservée même si le client est supprimé.
-- invoice_number NULL par défaut : généré par le backend au moment de la finalisation.
-- Idempotente (CREATE TABLE IF NOT EXISTS)
--
-- NOTE FK clients(id) : vérifier que clients.id est INT UNSIGNED en production.
--   Référence : migration 047 (quotes) utilise déjà INT UNSIGNED → clients(id).

CREATE TABLE IF NOT EXISTS client_invoices (
  id                            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  job_id                        INT UNSIGNED   NOT NULL,
  company_id                    INT UNSIGNED   NOT NULL,
  client_id                     INT UNSIGNED   NULL
                                COMMENT 'NULL toléré : client supprimé, facture conservée',
  invoice_number                VARCHAR(50)    NULL
                                COMMENT 'Généré par le backend à la finalisation (ex: INV-2026-0042)',
  deposit_amount                DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  deposit_paid_at               DATETIME       NULL,
  balance_amount                DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  balance_paid_at               DATETIME       NULL,
  total_amount                  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  status                        ENUM(
                                  'draft',
                                  'deposit_pending',
                                  'deposit_paid',
                                  'balance_pending',
                                  'paid',
                                  'void'
                                ) NOT NULL DEFAULT 'draft',
  stripe_payment_intent_deposit VARCHAR(255)   NULL
                                COMMENT 'Stripe PaymentIntent ID pour l\'acompte',
  stripe_payment_intent_balance VARCHAR(255)   NULL
                                COMMENT 'Stripe PaymentIntent ID pour le solde',
  signed_at                     DATETIME       NULL
                                COMMENT 'Date de signature du devis/contrat par le client',
  notes                         TEXT           NULL,
  created_at                    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_ci_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_client
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,

  -- Dashboard finance : factures d'une company par statut
  INDEX idx_ci_company_status (company_id, status),
  -- Requête : "facture(s) d'un job"
  INDEX idx_ci_job (job_id),
  -- Requête : "toutes les factures d'un client"
  INDEX idx_ci_client (client_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

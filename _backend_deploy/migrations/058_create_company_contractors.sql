-- Migration 058 : Création de company_contractors
-- Réseau N-N entre companies et contractors (users.account_type = 'contractor').
-- DISTINCTE de company_memberships : les contractors sont des prestataires EXTERNES —
--   ils ne sont pas des membres internes de la company.
--   company_memberships = équipe interne (salariés, managers)
--   company_contractors = réseau de sous-traitants ABN approuvés
-- Un contractor doit être approuvé (status = 'active') avant de pouvoir être
--   assigné à un job via job_contractor_assignments.
-- invited_by_user_id ON DELETE SET NULL : trace de l'invitation même si l'invitant part.
-- accepted_at NULL = invitation envoyée mais pas encore acceptée.
-- Idempotente (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS company_contractors (
  id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  company_id         INT UNSIGNED  NOT NULL,
  contractor_user_id INT UNSIGNED  NOT NULL,
  status             ENUM('invited', 'active', 'suspended') NOT NULL DEFAULT 'invited',
  invited_by_user_id INT UNSIGNED  NULL,
  invited_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at        DATETIME      NULL
                     COMMENT 'NULL = invitation en attente ; rempli quand le contractor accepte',

  PRIMARY KEY (id),

  -- Un contractor ne peut être lié qu'une seule fois à une company
  UNIQUE KEY uq_cc_company_contractor (company_id, contractor_user_id),

  CONSTRAINT fk_cc_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cc_contractor
    FOREIGN KEY (contractor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cc_invited_by
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Requête : "tous les contractors actifs d'une company"
  INDEX idx_cc_company_status (company_id, status),
  -- Requête : "toutes les companies pour lesquelles ce contractor est actif"
  INDEX idx_cc_contractor_status (contractor_user_id, status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

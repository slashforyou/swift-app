-- Migration 056 : Création de company_memberships
-- Un utilisateur peut appartenir à plusieurs companies avec un rôle et des permissions granulaires.
-- Remplace la logique implicite user/company par un contrôle explicite des droits.
-- Permissions stockées en TINYINT(1) séparés : plus flexible qu'un ENUM ou bitmask,
--   chaque permission peut être activée indépendamment du rôle.
-- invited_by_user_id ON DELETE SET NULL : l'invitation reste traçable même si l'invitant quitte.
-- Idempotente (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS company_memberships (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id             INT UNSIGNED  NOT NULL,
  company_id          INT UNSIGNED  NOT NULL,
  role                ENUM('owner', 'manager', 'employee') NOT NULL DEFAULT 'employee',

  -- Permissions granulaires (indépendantes du rôle, activables à la carte)
  can_create_jobs     TINYINT(1)    NOT NULL DEFAULT 0,
  can_assign_staff    TINYINT(1)    NOT NULL DEFAULT 0,
  can_view_financials TINYINT(1)    NOT NULL DEFAULT 0,
  can_collect_payment TINYINT(1)    NOT NULL DEFAULT 0,
  can_manage_stripe   TINYINT(1)    NOT NULL DEFAULT 0,

  status              ENUM('active', 'invited', 'suspended') NOT NULL DEFAULT 'active',
  invited_by_user_id  INT UNSIGNED  NULL,
  joined_at           DATETIME      NULL
                      COMMENT 'NULL = invitation en attente (status = invited)',
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Un utilisateur ne peut appartenir qu'une seule fois à une company
  UNIQUE KEY uq_cm_user_company (user_id, company_id),

  CONSTRAINT fk_cm_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_invited_by
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Requête fréquente : "tous les membres actifs d'une company"
  INDEX idx_cm_company_status (company_id, status),
  -- Requête : "toutes les companies auxquelles un utilisateur appartient"
  INDEX idx_cm_user_status (user_id, status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

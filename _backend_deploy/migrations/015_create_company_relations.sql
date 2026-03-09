-- Migration 015: Create company_relations table
-- Carnet de relations B2B (entreprises partenaires mémorisées)

CREATE TABLE IF NOT EXISTS company_relations (
  id                        INT(11) NOT NULL AUTO_INCREMENT,

  -- Entreprise qui détient cette relation (l'utilisateur connecté)
  owner_company_id          INT(11) NOT NULL,

  -- Partenaire enregistré
  related_type              ENUM('company','contractor') NOT NULL DEFAULT 'company',
  related_company_id        INT(11) NULL,
  related_contractor_id     INT(11) NULL,

  -- Nom affiché (résolu depuis la table companies si null)
  related_company_name      VARCHAR(255) NULL,
  related_contractor_name   VARCHAR(255) NULL,

  -- Pseudo / surnom personnalisé
  nickname                  VARCHAR(100) NULL,

  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_relation (owner_company_id, related_company_id, related_contractor_id),
  KEY idx_cr_owner          (owner_company_id),
  KEY idx_cr_related_co     (related_company_id),

  CONSTRAINT fk_cr_owner    FOREIGN KEY (owner_company_id)   REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

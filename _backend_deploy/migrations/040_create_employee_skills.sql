-- Migration 040: Employee skills & qualifications
-- Date: 2026-04-28
-- Stocke les compétences déclarées ou certifiées d'un employé.
-- Contrainte UNIQUE (user_id, skill_name) : une compétence = une ligne par user.
-- cert_expiry_date : NULL si non certifié ou sans expiry.
-- Le backend doit alerter quand cert_expiry_date < NOW() + 30 jours.

CREATE TABLE IF NOT EXISTS employee_skills (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id       INT UNSIGNED NOT NULL,
  user_id          INT UNSIGNED NOT NULL,
  skill_name       VARCHAR(100) NOT NULL,
  skill_level      ENUM('beginner','intermediate','advanced','expert')
                   NOT NULL DEFAULT 'intermediate',
  certified        TINYINT(1)   NOT NULL DEFAULT 0,
  cert_expiry_date DATE         DEFAULT NULL
                   COMMENT 'NULL si pas de certificat ou pas d'expiry',
  notes            VARCHAR(255) DEFAULT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Une compétence unique par user (ex: "Forklift licence" ne peut exister qu'une fois)
  UNIQUE KEY uq_es_user_skill (user_id, skill_name),

  CONSTRAINT fk_es_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_es_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  -- Requête : toutes les compétences de la company (dashboard)
  INDEX idx_es_company (company_id),
  -- Requête : compétences bientôt expirées (cron alert)
  INDEX idx_es_expiry (cert_expiry_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

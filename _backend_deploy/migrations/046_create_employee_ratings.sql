-- Migration 046: Employee internal ratings (notation interne)
-- Date: 2026-04-28
-- Permet à un manager/collègue de noter un employé après un job.
-- job_id nullable : notation possible hors contexte job (évaluation périodique).
-- rated_by sans CASCADE : l'évaluation reste même si l'évaluateur quitte la company.
-- Pas de UNIQUE sur (rated_user_id, job_id) intentionnellement :
--   plusieurs managers peuvent noter le même employé sur le même job.
-- Le backend doit vérifier que rated_by et rated_user_id appartiennent
--   à la même company_id pour éviter toute fuite inter-company.

CREATE TABLE IF NOT EXISTS employee_ratings (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rated_user_id  INT UNSIGNED NOT NULL,
  rated_by       INT UNSIGNED NOT NULL,
  company_id     INT UNSIGNED NOT NULL,
  job_id         INT UNSIGNED DEFAULT NULL,
  rating         TINYINT UNSIGNED NOT NULL
                 COMMENT '1 à 5',
  comment        VARCHAR(500) DEFAULT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_er_rated_user
    FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_er_rater
    FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_er_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_er_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,

  -- Requête : "toutes les notes d'un employé dans cette company"
  INDEX idx_er_company_user (company_id, rated_user_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

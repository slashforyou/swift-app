-- Migration 045: Post-job client reviews (notation externe)
-- Date: 2026-04-28
-- Système d'avis client envoyé après complétion d'un job (email avec token unique).
-- job_id UNIQUE : un seul avis par job (l'avis est lié au job, pas au client).
-- review_token : UUID ou hash sécurisé généré côté backend, envoyé dans le lien email.
--   Ce token ne doit jamais être devinable → le backend doit utiliser crypto.randomBytes.
-- submitted_at NULL = avis non encore soumis (lien envoyé mais pas répondu).
-- reviewer_name / reviewer_email : dupliqués depuis clients au moment de l'envoi
--   pour conserver l'historique même si le client est modifié.

CREATE TABLE IF NOT EXISTS job_reviews (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  job_id           INT UNSIGNED  NOT NULL,
  company_id       INT UNSIGNED  NOT NULL,
  reviewer_name    VARCHAR(100)  DEFAULT NULL,
  reviewer_email   VARCHAR(150)  DEFAULT NULL,
  rating           TINYINT UNSIGNED NOT NULL
                   COMMENT '1 à 5 étoiles',
  comment          TEXT          DEFAULT NULL,
  would_recommend  TINYINT(1)    DEFAULT NULL
                   COMMENT 'NULL = non répondu, 0 = non, 1 = oui',
  review_token     VARCHAR(64)   NOT NULL
                   COMMENT 'Token unique (crypto.randomBytes 32) pour lien email sécurisé',
  submitted_at     TIMESTAMP     DEFAULT NULL
                   COMMENT 'NULL = invitation envoyée mais pas encore soumise',
  reminder_sent_at TIMESTAMP     DEFAULT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Un seul avis par job
  UNIQUE KEY uq_jr_job    (job_id),
  -- Token de lien email : doit être globalement unique
  UNIQUE KEY uq_jr_token  (review_token),

  CONSTRAINT fk_jr_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_jr_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

  -- Dashboard company : avis d'une company
  INDEX idx_jr_company        (company_id),
  -- Tri/filtre par note : "moyenne des avis" ou "avis < 3 étoiles"
  INDEX idx_jr_company_rating (company_id, rating)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

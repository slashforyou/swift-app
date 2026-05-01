-- Migration 062 : Création de job_events
-- Audit log minimal des événements métier liés aux jobs.
-- Sert de rail pour Phase 2 : notifications push, gamification, analytics, reporting.
--
-- Convention event_type : 'domaine.action' en snake_case
--   Exemples : 'job.created', 'job.completed', 'contractor.accepted',
--              'contractor.declined', 'signature.completed',
--              'payment.deposit_paid', 'payment.balance_paid'
--
-- actor_user_id NULL = événement système (cron, webhook Stripe, action automatique).
-- payload JSON NULL : contexte optionnel de l'événement.
--   RÈGLE ABSOLUE : ne JAMAIS stocker de données sensibles dans payload —
--   passwords, tokens d'auth, numéros de carte, IBAN, données personnelles brutes.
--
-- Table intentionnellement append-only : pas d'UPDATE, pas de DELETE.
--   Si correction nécessaire → insérer un événement correctif.
--
-- Scalabilité : si volume > 10M lignes/mois → envisager partitioning par mois (Phase 3).
--
-- actor_user_id ON DELETE SET NULL : l'événement est conservé même si l'acteur est supprimé.
-- Idempotente (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS job_events (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  job_id        INT UNSIGNED  NOT NULL,
  company_id    INT UNSIGNED  NOT NULL,
  event_type    VARCHAR(100)  NOT NULL
                COMMENT 'Convention domaine.action — ex: job.created, contractor.accepted, payment.deposit_paid',
  actor_user_id INT UNSIGNED  NULL
                COMMENT 'NULL si événement système (cron, webhook, action automatique)',
  payload       JSON          NULL
                COMMENT 'Contexte de l\'événement. JAMAIS de données sensibles (tokens, passwords, IBAN, PAN)',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  CONSTRAINT fk_je_job
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_je_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_je_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Requête fréquente : "timeline complète d'un job" (ORDER BY created_at)
  INDEX idx_je_job (job_id),
  -- Requête : "tous les événements d'un type dans une company" (analytics, triggers)
  INDEX idx_je_company_type (company_id, event_type),
  -- Requête : "feed d'événements récents d'une company" (dashboard live)
  INDEX idx_je_company_created (company_id, created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

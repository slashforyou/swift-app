-- Migration 063 : Création de notification_queue
-- File d'attente pour les notifications event-driven (Phase 3).
-- Alimente les canaux push, email, sms, in_app depuis job_events et autres triggers.
--
-- Table intentionnellement append-only : pas d'UPDATE, pas de DELETE de lignes.
--   Si annulation nécessaire → passer status = 'skipped' via un consumer autorisé.
--
-- notification_type : convention 'domaine.action' — ex: 'job.assigned', 'invoice.paid'
-- payload JSON NULL : contexte optionnel pour construire le message.
--   RÈGLE ABSOLUE : ne JAMAIS stocker données sensibles (tokens, passwords, PAN, IBAN).
--
-- retry_count : incrémenté par le worker à chaque tentative échouée.
-- scheduled_at : permet différer une notification (DEFAULT = maintenant).
-- sent_at : NULL tant que non envoyé, renseigné par le worker.
--
-- FK signed INT (companies.id et users.id sont int(11) signed, vérifié en prod).
-- ON DELETE CASCADE : si une company ou un user est supprimé, la queue est purgée.
-- Idempotente (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS notification_queue (
  id                INT            NOT NULL AUTO_INCREMENT,
  company_id        INT            NOT NULL,
  recipient_user_id INT            NOT NULL,
  notification_type VARCHAR(100)   NOT NULL
                    COMMENT 'Convention domaine.action — ex: job.assigned, invoice.paid',
  channel           ENUM('push', 'email', 'sms', 'in_app')
                    NOT NULL DEFAULT 'push',
  payload           JSON           NULL
                    COMMENT 'Contexte pour construire le message. JAMAIS de données sensibles.',
  status            ENUM('pending', 'sent', 'failed', 'skipped')
                    NOT NULL DEFAULT 'pending',
  retry_count       TINYINT        NOT NULL DEFAULT 0,
  scheduled_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at           DATETIME       NULL,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Requête principale du worker : "entrées pending à traiter maintenant"
  INDEX idx_nq_status      (status),
  -- Filtrage par company (isolation multi-tenant)
  INDEX idx_nq_company     (company_id),
  -- Requête : "toutes les notifications d'un destinataire" (in_app feed)
  INDEX idx_nq_recipient   (recipient_user_id),
  -- Requête : notifications différées planifiées (scheduled_at <= NOW())
  INDEX idx_nq_scheduled   (scheduled_at),

  CONSTRAINT fk_nq_company
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT fk_nq_recipient
    FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

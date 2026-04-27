-- Migration 047: Quotes / Devis
-- Date: 2026-04-28
-- Deux tables :
--   quotes      : en-tête du devis (métadonnées, totaux, statut)
--   quote_items : lignes de détail (description, qté, prix unitaire)
-- converted_to_job_id : FK nullable vers jobs (null tant que le devis n'est pas accepté).
--   ON DELETE SET NULL : si le job est supprimé, le devis redevient "non converti".
-- UNIQUE (company_id, quote_number) : numérotation libre mais unique par company
--   (ex: "D-2026-001", "Q-001"). Le backend gère la séquence.
-- quote_items.total est GENERATED ALWAYS AS (quantity * unit_price) STORED.
-- quote_items n'a pas de company_id : la company est portée par quotes.
--   L'accès est toujours quotes JOIN quote_items, jamais quote_items seul.

-- ─── Devis ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  company_id           INT UNSIGNED  NOT NULL,
  client_id            INT UNSIGNED  DEFAULT NULL,
  quote_number         VARCHAR(50)   NOT NULL,
  title                VARCHAR(200)  NOT NULL,
  status               ENUM('draft','sent','accepted','rejected','expired')
                       NOT NULL DEFAULT 'draft',
  valid_until          DATE          DEFAULT NULL,
  subtotal             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_rate             DECIMAL(5,2)  NOT NULL DEFAULT 10.00
                       COMMENT 'GST 10% par défaut (Australie)',
  tax_amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total                DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes                TEXT          DEFAULT NULL,
  terms                TEXT          DEFAULT NULL,
  converted_to_job_id  INT UNSIGNED  DEFAULT NULL
                       COMMENT 'Rempli quand le devis est converti en job',
  created_by           INT UNSIGNED  NOT NULL,
  created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Numérotation unique par company
  UNIQUE KEY uq_quote_number (company_id, quote_number),

  CONSTRAINT fk_q_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_q_client
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_q_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_q_job
    FOREIGN KEY (converted_to_job_id) REFERENCES jobs(id) ON DELETE SET NULL,

  -- Dashboard : devis d'une company par statut
  INDEX idx_q_company_status (company_id, status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Lignes de devis ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_items (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  quote_id     INT UNSIGNED  NOT NULL,
  description  VARCHAR(300)  NOT NULL,
  quantity     DECIMAL(8,2)  NOT NULL DEFAULT 1.00,
  unit_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total        DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
               COMMENT 'Calculé automatiquement : quantity × unit_price',
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0
               COMMENT 'Ordre d'affichage des lignes',

  PRIMARY KEY (id),

  CONSTRAINT fk_qi_quote
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,

  -- Récupération de toutes les lignes d'un devis
  INDEX idx_qi_quote (quote_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

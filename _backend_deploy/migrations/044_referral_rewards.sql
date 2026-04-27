-- Migration 044: Referral backend tables
-- Date: 2026-04-28
-- Ajoute referral_code et referred_by_code sur companies si absents.
-- referral_code : code unique généré à la création de la company (A-Z0-9, 8 chars)
-- referred_by_code : code de la company parrain (peut être NULL si inscription directe)
-- referral_rewards : table des récompenses accordées suite à un parrainage.
--   UNIQUE (referrer_company_id, referred_company_id) : un seul reward par paire.
--   ON DELETE CASCADE des deux côtés : si la company disparaît, le reward disparaît.

-- ─── Colonnes parrainage sur companies ───────────────────────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS referral_code     VARCHAR(20) UNIQUE DEFAULT NULL
    COMMENT 'Code unique de parrainage de cette company',
  ADD COLUMN IF NOT EXISTS referred_by_code  VARCHAR(20) DEFAULT NULL
    COMMENT 'Code parrain utilisé lors de l'inscription';

-- ─── Récompenses de parrainage ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_rewards (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  referrer_company_id INT UNSIGNED  NOT NULL,
  referred_company_id INT UNSIGNED  NOT NULL,
  reward_type         ENUM('discount','credit','badge') NOT NULL DEFAULT 'badge',
  reward_value        DECIMAL(8,2)  NOT NULL DEFAULT 0.00
                      COMMENT 'Valeur monétaire (0 si badge)',
  granted             TINYINT(1)    NOT NULL DEFAULT 0,
  granted_at          TIMESTAMP     DEFAULT NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Un seul reward par paire parrain/parrainé
  UNIQUE KEY uq_rr_pair (referrer_company_id, referred_company_id),

  CONSTRAINT fk_rr_referrer
    FOREIGN KEY (referrer_company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_referred
    FOREIGN KEY (referred_company_id) REFERENCES companies(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

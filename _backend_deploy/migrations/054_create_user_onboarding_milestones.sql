-- Migration 054 : Création de la table user_onboarding_milestones
-- Onboarding progressif — chaque milestone débloque un élément UI
-- Idempotente (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS user_onboarding_milestones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  company_id      INT NOT NULL,
  milestone       VARCHAR(64) NOT NULL,
  unlocked_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  shown_at        DATETIME NULL,
  UNIQUE KEY uq_user_milestone (user_id, milestone),
  KEY idx_uid (user_id),
  KEY idx_cid (company_id),
  CONSTRAINT fk_uom_user    FOREIGN KEY (user_id)    REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_uom_company FOREIGN KEY (company_id) REFERENCES companies(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

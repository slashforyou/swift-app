-- Migration 035: Create user_push_tokens table
--
-- Stocke les tokens push Expo par utilisateur/device.
-- Un token Expo est unique globalement (UNIQUE KEY sur push_token).
-- La colonne is_active permet la désactivation sans suppression (audit trail).
--
-- Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id           INT          UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT          UNSIGNED NOT NULL,
  push_token   VARCHAR(255) NOT NULL,
  platform     VARCHAR(20)  NOT NULL DEFAULT 'ios',   -- 'ios' | 'android' | 'web'
  device_id    VARCHAR(255) NULL,
  device_name  VARCHAR(255) NULL,
  app_version  VARCHAR(50)  NULL,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Un token Expo est globalement unique (peut changer d'user si l'app est réinstallée)
  UNIQUE KEY uq_push_token (push_token),

  -- Lookup rapide pour envoyer les notifs à tous les devices d'un user
  KEY idx_user_active (user_id, is_active),

  -- Lookup par device (désactivation en masse)
  KEY idx_device_id (device_id),

  CONSTRAINT fk_upt_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

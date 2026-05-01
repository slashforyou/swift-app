-- Migration 057 : Création de contractor_profiles
-- Profil ABN pour les utilisateurs de type contractor (account_type = 'contractor').
-- Relation 1-1 avec users via UNIQUE KEY sur user_id.
-- Tous les champs business (ABN, taux, GST) sont NULL par défaut :
--   un contractor peut s'enregistrer sans les remplir immédiatement.
-- Le backend DOIT vérifier que users.account_type = 'contractor'
--   avant d'accéder à cette table (pas de contrainte FK possible sur un ENUM).
-- updated_at ON UPDATE CURRENT_TIMESTAMP : permet de détecter les modifications de taux.
-- Idempotente (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS contractor_profiles (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED   NOT NULL,
  abn            VARCHAR(20)    NULL
                 COMMENT 'Australian Business Number — 11 chiffres, sans espaces ni tirets',
  trade_name     VARCHAR(255)   NULL
                 COMMENT 'Nom commercial / trading name (différent du nom légal users.name)',
  rate_type      ENUM('hourly', 'flat', 'daily') NOT NULL DEFAULT 'hourly',
  rate_amount    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  currency       VARCHAR(10)    NOT NULL DEFAULT 'AUD',
  gst_registered TINYINT(1)     NOT NULL DEFAULT 0
                 COMMENT '1 = enregistré GST → doit facturer +10% GST sur ses prestations',
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- Relation 1-1 : un seul profil contractor par utilisateur
  UNIQUE KEY uq_cp_user (user_id),

  CONSTRAINT fk_cp_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

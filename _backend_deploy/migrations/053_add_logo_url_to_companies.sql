-- Migration 053 : Ajout colonne logo_url sur la table companies
-- Idempotente (ADD COLUMN IF NOT EXISTS supporté MariaDB 10.0+)

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL AFTER company_code;

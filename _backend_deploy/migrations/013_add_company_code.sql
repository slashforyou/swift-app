-- Migration 013: Add company_code to companies
-- Ajoute un code unique de 8 chars (A-Z0-9) à chaque entreprise

ALTER TABLE companies
  ADD COLUMN company_code CHAR(8) NULL UNIQUE
  COMMENT '8-char unique public code used for B2B relations'
  AFTER updated_at;

-- Back-fill codes for existing companies (MD5 hex, 8 chars, uppercase)
UPDATE companies
SET company_code = UPPER(SUBSTRING(REPLACE(MD5(CONCAT(id, '-', IFNULL(name,''), '-', IFNULL(created_at,''))), '-', ''), 1, 8))
WHERE company_code IS NULL;

-- Make NOT NULL now that all rows have a value
ALTER TABLE companies MODIFY COLUMN company_code CHAR(8) NOT NULL;

-- Migration 025: Create modular contracts system
-- Tables for contract clauses, conditions, and job contracts

-- Contract clauses: reusable clause templates per company
CREATE TABLE IF NOT EXISTS contract_clauses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  company_id    INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  content       TEXT NOT NULL,
  clause_order  INT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clause_company (company_id),
  INDEX idx_clause_order (company_id, clause_order)
);

-- Clause conditions: when to include a clause in a contract
CREATE TABLE IF NOT EXISTS clause_conditions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  clause_id       INT NOT NULL,
  condition_type  ENUM('always','segment_type','postcode','city','state') NOT NULL,
  condition_value VARCHAR(255) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cond_clause (clause_id),
  FOREIGN KEY (clause_id) REFERENCES contract_clauses(id) ON DELETE CASCADE
);

-- Job contracts: generated contracts for specific jobs
CREATE TABLE IF NOT EXISTS job_contracts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  job_id          INT NOT NULL,
  company_id      INT NOT NULL,
  client_name     VARCHAR(255) DEFAULT NULL,
  client_email    VARCHAR(255) DEFAULT NULL,
  status          ENUM('draft','sent','signed','expired') NOT NULL DEFAULT 'draft',
  generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signed_at       TIMESTAMP NULL DEFAULT NULL,
  signature_data  LONGTEXT DEFAULT NULL,
  INDEX idx_jc_job (job_id),
  INDEX idx_jc_company (company_id),
  INDEX idx_jc_status (status)
);

-- Job contract clauses: snapshot of clauses included in a specific contract
CREATE TABLE IF NOT EXISTS job_contract_clauses (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  job_contract_id   INT NOT NULL,
  clause_id         INT DEFAULT NULL,
  clause_title      VARCHAR(255) NOT NULL,
  clause_content    TEXT NOT NULL,
  clause_order      INT NOT NULL DEFAULT 0,
  INDEX idx_jcc_contract (job_contract_id),
  FOREIGN KEY (job_contract_id) REFERENCES job_contracts(id) ON DELETE CASCADE
);

-- Insert default damage waiver clause for all existing companies
-- This ensures every company starts with at least one useful clause
INSERT INTO contract_clauses (company_id, title, content, clause_order, is_active)
SELECT id, 
  'Damage Waiver',
  'The client acknowledges that the moving company takes all reasonable care during the transport and handling of goods. However, the company shall not be held liable for damage to items that are:\n\n• Not properly packed by the owner or a professional packer\n• Fragile items not declared before the move\n• Items of extraordinary value not disclosed and insured separately\n• Damage caused by pre-existing defects\n\nThe client may opt for additional insurance coverage at the time of booking.',
  0,
  1
FROM companies
WHERE id NOT IN (SELECT DISTINCT company_id FROM contract_clauses WHERE title = 'Damage Waiver');

-- Add "always" condition to the damage waiver clauses
INSERT INTO clause_conditions (clause_id, condition_type, condition_value)
SELECT cc.id, 'always', NULL 
FROM contract_clauses cc
WHERE cc.title = 'Damage Waiver'
AND cc.id NOT IN (SELECT clause_id FROM clause_conditions WHERE condition_type = 'always');

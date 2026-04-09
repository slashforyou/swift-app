-- Migration 029: Add period_type to monthly_invoices
-- Supports weekly and fortnightly invoice generation (common in Australia)
-- Date: 2026-04-09

ALTER TABLE monthly_invoices
  ADD COLUMN period_type ENUM('monthly','weekly','fortnightly') NOT NULL DEFAULT 'monthly'
  AFTER company_id;

-- Update index to include period_type for duplicate detection
ALTER TABLE monthly_invoices
  DROP INDEX idx_company_period,
  ADD INDEX idx_company_period_type (company_id, period_type, period_start);

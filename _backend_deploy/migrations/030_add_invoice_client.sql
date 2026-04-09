-- Migration 030: Add client_id and client_name to monthly_invoices
-- Allows per-client invoice generation

ALTER TABLE monthly_invoices
  ADD COLUMN client_id INT DEFAULT NULL AFTER company_id,
  ADD COLUMN client_name VARCHAR(255) DEFAULT NULL AFTER client_id;

ALTER TABLE monthly_invoices
  ADD INDEX idx_monthly_invoices_client (client_id);

-- Migration 026: Add billing tracking columns to job_transfers
-- Date: 2026-04-07

ALTER TABLE job_transfers
  ADD COLUMN billing_status ENUM('not_billed','invoiced','paid','overdue') NOT NULL DEFAULT 'not_billed' AFTER status,
  ADD COLUMN invoiced_at DATETIME NULL AFTER billing_status,
  ADD COLUMN paid_at DATETIME NULL AFTER invoiced_at,
  ADD COLUMN payment_due_date DATE NULL AFTER paid_at,
  ADD COLUMN payment_reference VARCHAR(100) NULL AFTER payment_due_date,
  ADD COLUMN payment_notes TEXT NULL AFTER payment_reference;

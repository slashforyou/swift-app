-- Migration: add hour_counting_type, vehicle_id, vehicle_label to job_transfers
-- Date: 2026-03-26

ALTER TABLE job_transfers
  ADD COLUMN hour_counting_type VARCHAR(20) DEFAULT NULL AFTER pricing_amount,
  ADD COLUMN vehicle_id INT DEFAULT NULL AFTER hour_counting_type,
  ADD COLUMN vehicle_label VARCHAR(100) DEFAULT NULL AFTER vehicle_id;

-- Add counter-proposal columns to job_transfers
ALTER TABLE job_transfers
  ADD COLUMN counter_offer_amount DECIMAL(10,2) NULL AFTER decline_reason,
  ADD COLUMN counter_offer_message TEXT NULL AFTER counter_offer_amount,
  ADD COLUMN counter_offered_at DATETIME NULL AFTER counter_offer_message;

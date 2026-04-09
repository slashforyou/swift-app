-- Migration: Add stripe_mode to stripe_connected_accounts
-- Allows dual-mode Stripe (test accounts use test keys, live accounts use live keys)

ALTER TABLE stripe_connected_accounts 
  ADD COLUMN stripe_mode ENUM('test', 'live') NOT NULL DEFAULT 'test' AFTER stripe_account_id;

-- Mark all existing accounts as 'test' (they were all created with test keys)
UPDATE stripe_connected_accounts SET stripe_mode = 'test';

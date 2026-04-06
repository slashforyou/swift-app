-- 017: Add Stripe subscription columns to companies and plans
-- companies: stripe_customer_id for Stripe Billing
-- plans: stripe_price_id to link to Stripe Price objects

ALTER TABLE companies
  ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL AFTER logo_url;

ALTER TABLE plans
  ADD COLUMN stripe_price_id VARCHAR(255) DEFAULT NULL AFTER is_public;

-- Set Stripe Price IDs (to be updated with real IDs after creating products in Stripe Dashboard)
-- UPDATE plans SET stripe_price_id = 'price_xxx' WHERE id = 'pro';
-- UPDATE plans SET stripe_price_id = 'price_xxx' WHERE id = 'expert';

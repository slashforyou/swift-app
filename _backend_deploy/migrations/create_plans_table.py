#!/usr/bin/env python3
"""
Migration: Create plans table and seed with initial plans.
Plans are stored in DB so they can be modified without app update.
"""
import subprocess
import sys

SQL = """
-- Add missing columns to existing plans table
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100) NOT NULL DEFAULT '' AFTER label,
  ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER display_name,
  ADD COLUMN IF NOT EXISTS included_users INT NOT NULL DEFAULT 5 AFTER price_monthly,
  ADD COLUMN IF NOT EXISTS extra_user_price DECIMAL(10,2) NOT NULL DEFAULT 5.00 AFTER included_users,
  ADD COLUMN IF NOT EXISTS max_jobs_created INT NOT NULL DEFAULT 30 AFTER extra_user_price,
  ADD COLUMN IF NOT EXISTS max_jobs_accepted INT NOT NULL DEFAULT -1 AFTER max_jobs_created,
  ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.50 AFTER max_jobs_accepted,
  ADD COLUMN IF NOT EXISTS features TEXT DEFAULT NULL AFTER platform_fee_percentage,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0 AFTER is_public;

-- Upsert plans with full data
INSERT INTO plans (id, label, display_name, price_monthly, included_users, extra_user_price, max_jobs_created, max_jobs_accepted, platform_fee_percentage, commission_rate, min_fee_aud, features, is_public, sort_order) VALUES
  ('free', 'Free', 'Free', 0.00, 5, 5.00, 30, -1, 2.50, 0.0250, 0.00, '{"branding": false, "priority_support": false}', 1, 0),
  ('pro', 'Pro', 'Pro', 79.00, 10, 5.00, 30, -1, 1.60, 0.0160, 0.00, '{"branding": true, "priority_support": false}', 1, 1),
  ('expert', 'Expert', 'Expert', 179.00, 50, 5.00, -1, -1, 0.60, 0.0060, 0.00, '{"branding": true, "priority_support": true}', 1, 2),
  ('unlimited', 'Unlimited', 'Unlimited', 0.00, 9999, 0.00, -1, -1, 0.00, 0.0000, 0.00, '{"branding": true, "priority_support": true, "admin_only": true}', 0, 99)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  display_name = VALUES(display_name),
  price_monthly = VALUES(price_monthly),
  included_users = VALUES(included_users),
  extra_user_price = VALUES(extra_user_price),
  max_jobs_created = VALUES(max_jobs_created),
  max_jobs_accepted = VALUES(max_jobs_accepted),
  platform_fee_percentage = VALUES(platform_fee_percentage),
  commission_rate = VALUES(commission_rate),
  min_fee_aud = VALUES(min_fee_aud),
  features = VALUES(features),
  is_public = VALUES(is_public),
  sort_order = VALUES(sort_order);

-- Sync existing companies: set their fee based on their plan
UPDATE companies c
  JOIN plans p ON c.plan_type = p.id
  SET c.stripe_platform_fee_percentage = p.platform_fee_percentage
  WHERE c.plan_type != 'unlimited';
"""

DB_USER = "swiftapp_user"
DB_PASS = "U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME = "swiftapp"

def run():
    cmd = ["mysql", "-u", DB_USER, "-p" + DB_PASS, DB_NAME]
    result = subprocess.run(cmd, input=SQL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)
    
    if result.returncode != 0:
        print("Migration failed: " + result.stderr)
        sys.exit(1)
    else:
        print("Plans table created and seeded successfully")
        if result.stdout:
            print(result.stdout)

if __name__ == "__main__":
    run()

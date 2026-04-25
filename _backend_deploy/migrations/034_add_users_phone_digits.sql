-- Migration 034: Add phone_digits column for fast cross-format phone lookups.
--
-- Stores the last 9 digits of `phone` (digits-only). This makes the
-- /v1/users/lookup-by-phones endpoint O(log N) and tolerant of formatting
-- differences between a user's signup phone and a contact-book phone.
--
-- Safe to run multiple times.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_digits VARCHAR(9) DEFAULT NULL;

-- Backfill from existing phone column.
UPDATE users
   SET phone_digits = RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), 9)
 WHERE phone IS NOT NULL
   AND phone <> ''
   AND (phone_digits IS NULL OR phone_digits = '');

CREATE INDEX IF NOT EXISTS idx_users_phone_digits
  ON users (phone_digits);

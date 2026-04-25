-- Add profile_picture column to users for custom avatar support.
-- Safe to run multiple times on MySQL 8+.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) NULL AFTER avatar_url;

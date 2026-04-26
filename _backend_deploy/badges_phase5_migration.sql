-- ═══════════════════════════════════════════════════════════════════════════════
-- Phase 5 — Badges: migration
-- Adds notified_at column to user_badges for push-notification dedup guard
-- Tables gamification_badge_definitions and user_badges already exist (35 badges seeded)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add notified_at column (safe — only runs if column doesn't exist)
ALTER TABLE user_badges
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP NULL DEFAULT NULL;

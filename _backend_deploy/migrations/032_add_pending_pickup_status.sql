-- Add pending_pickup status to storage_lots for delivery scheduling
ALTER TABLE storage_lots
  MODIFY COLUMN status ENUM('active', 'completed', 'overdue', 'pending_pickup') NOT NULL DEFAULT 'active';

-- Add identifier_tag column if not exists
ALTER TABLE storage_lots
  ADD COLUMN IF NOT EXISTS identifier_tag VARCHAR(100) NULL AFTER notes;

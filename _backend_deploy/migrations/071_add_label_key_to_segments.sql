-- Migration 071: Add label_key to job template segments and instances
-- Purpose: Map segment labels to frontend i18n keys for proper translation
-- Covers both template definitions and live job segment instances

-- ─── 1. job_template_segments ────────────────────────────────────────────────
ALTER TABLE job_template_segments
  ADD COLUMN IF NOT EXISTS label_key VARCHAR(100) DEFAULT NULL
  COMMENT 'i18n slug for frontend translation (e.g. travelToLocation1)';

-- Update default template segments by ID (determined from initial seed data)
UPDATE job_template_segments SET label_key = 'travelToLocation1'  WHERE id IN (22, 27, 34, 54);
UPDATE job_template_segments SET label_key = 'location1'          WHERE id IN (23, 28, 35, 55);
UPDATE job_template_segments SET label_key = 'travelToLocation2'  WHERE id IN (24, 29, 36, 56);
UPDATE job_template_segments SET label_key = 'location2'          WHERE id IN (25, 30, 37, 57);
UPDATE job_template_segments SET label_key = 'returnTrip'         WHERE id IN (26, 33, 50, 58);
UPDATE job_template_segments SET label_key = 'travelToLocation3'  WHERE id IN (31);
UPDATE job_template_segments SET label_key = 'location3'          WHERE id IN (32);
UPDATE job_template_segments SET label_key = 'returnToDepot'      WHERE id IN (38, 47);
UPDATE job_template_segments SET label_key = 'storageDropoff'     WHERE id IN (39);
UPDATE job_template_segments SET label_key = 'loadingAtDepot'     WHERE id IN (44);
UPDATE job_template_segments SET label_key = 'travelToLocation'   WHERE id IN (45, 48);
UPDATE job_template_segments SET label_key = 'deliveryAddress'    WHERE id IN (46);
UPDATE job_template_segments SET label_key = 'locationPacking'    WHERE id IN (49);

-- ─── 2. job_segment_instances ────────────────────────────────────────────────
ALTER TABLE job_segment_instances
  ADD COLUMN IF NOT EXISTS label_key VARCHAR(100) DEFAULT NULL
  COMMENT 'i18n slug copied from template segment at job init';

-- Backfill existing instances from their template segment
UPDATE job_segment_instances jsi
  INNER JOIN job_template_segments jts ON jsi.template_segment_id = jts.id
  SET jsi.label_key = jts.label_key
  WHERE jts.label_key IS NOT NULL;

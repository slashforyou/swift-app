-- Migration 070: Add name_key column to job_templates_modular
-- Purpose: Map server templates to frontend i18n keys (e.g. "default-simple-move")
-- This allows translateTemplateName() to look up translations regardless of DB language

ALTER TABLE job_templates_modular
  ADD COLUMN IF NOT EXISTS name_key VARCHAR(100) DEFAULT NULL COMMENT 'i18n slug for frontend translation (e.g. default-simple-move)';

-- Update default templates using billing_mode + additional criteria
-- flat_rate, packing_only, unpacking_only: one default each → unambiguous
UPDATE job_templates_modular
  SET name_key = 'default-flat-rate'
  WHERE is_default = 1 AND billing_mode = 'flat_rate' AND name_key IS NULL;

UPDATE job_templates_modular
  SET name_key = 'default-packing-only'
  WHERE is_default = 1 AND billing_mode = 'packing_only' AND name_key IS NULL;

UPDATE job_templates_modular
  SET name_key = 'default-delivery-only'
  WHERE is_default = 1 AND billing_mode = 'depot_to_depot' AND name_key IS NULL;

-- location_to_location: 3 defaults → differentiate by name keywords (multilingual)
UPDATE job_templates_modular
  SET name_key = 'default-with-storage'
  WHERE is_default = 1
    AND billing_mode = 'location_to_location'
    AND name_key IS NULL
    AND (
      name LIKE '%storage%' OR name LIKE '%garde%' OR name LIKE '%Storage%'
      OR name LIKE '%Stockage%' OR name LIKE '%Deposito%' OR name LIKE '%Almacen%'
    );

UPDATE job_templates_modular
  SET name_key = 'default-multi-stop'
  WHERE is_default = 1
    AND billing_mode = 'location_to_location'
    AND name_key IS NULL
    AND (
      name LIKE '%multi%' OR name LIKE '%Multiple%' OR name LIKE '%multiples%'
      OR name LIKE '%Múltiples%' OR name LIKE '%Fermate%' OR name LIKE '%Paradas%'
    );

-- Remaining location_to_location default = simple move
UPDATE job_templates_modular
  SET name_key = 'default-simple-move'
  WHERE is_default = 1
    AND billing_mode = 'location_to_location'
    AND name_key IS NULL;

-- =============================================================================
-- Migration: 066_fix_account_type_enum.sql
-- Normalise account_type 'abn_contractor' → 'contractor' en prod
-- Author: Nora + Eva — Database / Chief of Staff
-- Date: 2026-05-01
-- Context: Ancien code backend/API pouvait insérer 'abn_contractor' ;
--          le frontend normalise à la lecture mais le backend ne filter
--          que 'contractor'. Des users mal routés en résultaient.
-- Idempotente : OK à relancer plusieurs fois.
-- =============================================================================

-- 1. Vérification avant (à lire dans les logs)
SELECT account_type, COUNT(*) AS nb
FROM users
GROUP BY account_type;

-- 2. Normalisation : abn_contractor → contractor
UPDATE users
SET account_type = 'contractor'
WHERE account_type = 'abn_contractor';

-- 3. Nettoyage défensif : '' (empty string, mode SQL non-strict) → business_owner
UPDATE users
SET account_type = 'business_owner'
WHERE account_type = '' OR account_type IS NULL;

-- 4. Re-déclarer l'ENUM pour rejeter les valeurs inconnues à l'avenir
ALTER TABLE users
  MODIFY COLUMN account_type
    ENUM('business_owner', 'employee', 'contractor')
    NOT NULL DEFAULT 'business_owner';

-- 5. Vérification après
SELECT account_type, COUNT(*) AS nb
FROM users
GROUP BY account_type;

-- =============================================================================
-- DOWN (réversible — ajouter 'abn_contractor' si besoin de rollback)
-- ALTER TABLE users MODIFY COLUMN account_type
--   ENUM('business_owner', 'employee', 'contractor', 'abn_contractor')
--   NOT NULL DEFAULT 'business_owner';
-- =============================================================================

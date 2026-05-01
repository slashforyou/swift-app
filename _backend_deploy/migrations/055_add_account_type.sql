-- Migration 055 : Ajout de account_type à la table users
-- Distingue les 3 types d'utilisateurs de l'app Cobbr :
--   business_owner : patron d'une entreprise de déménagement (DEFAULT — préserve tous les users existants)
--   employee       : salarié rattaché à une company via company_memberships
--   contractor     : travailleur ABN indépendant, profil dans contractor_profiles
-- Idempotente (ADD COLUMN IF NOT EXISTS — MariaDB 10.3+)
-- DEFAULT 'business_owner' : aucun UPDATE requis sur les lignes existantes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type
    ENUM('business_owner', 'employee', 'contractor')
    NOT NULL DEFAULT 'business_owner';

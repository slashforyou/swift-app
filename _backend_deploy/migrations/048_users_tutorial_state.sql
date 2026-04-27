-- Migration 048: Onboarding tutorial state
-- Date: 2026-04-28
-- Ajoute deux colonnes sur users pour suivre la progression du tutoriel in-app.
-- tutorial_completed : TRUE quand l'utilisateur a terminé OU volontairement sauté.
-- tutorial_step : numéro de la dernière étape vue (0 = jamais démarré).
-- Le backend NE DOIT PAS forcer tutorial_completed = FALSE lors d'un reset de mot de passe.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tutorial_completed TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = tutoriel terminé ou ignoré par l'utilisateur',
  ADD COLUMN IF NOT EXISTS tutorial_step INT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Dernière étape vue (0 = non démarré)';

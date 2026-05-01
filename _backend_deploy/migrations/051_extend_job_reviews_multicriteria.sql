-- ============================================================
-- Migration 051: Notation multi-critères dans job_reviews
-- Date: 2026-04-29
-- ============================================================
-- Extension de la table job_reviews (créée en migration 045)
-- pour supporter la notation multi-critères envoyée depuis la
-- page web de review (/review/:token).
--
-- Critères retenus (5) :
--   rating_overall     → note globale  (bénéficie à TOUS)
--   rating_team        → équipe terrain (bénéficie aux employés + entreprise réalisatrice)
--   rating_service     → service client (bénéficie à l'entreprise créatrice)
--   rating_punctuality → ponctualité    (bénéficie aux employés + entreprise réalisatrice)
--   rating_care        → soin du matériel (bénéficie aux employés + entreprise réalisatrice)
--
-- staff_ratings      JSON → notes individuelles par membre de l'équipe
-- staff_adjectives   JSON → adjectifs positifs attribués par membre
-- price_opinion      → opinion prix : 'fair' | 'expensive' | 'cheap'
-- price_expected     → prix attendu par le client (décimal)
-- ============================================================

-- Renommer la colonne 'rating' → 'rating_overall' (compatibilité)
ALTER TABLE job_reviews
  CHANGE COLUMN rating rating_overall TINYINT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Note globale 1-5 (anciennement rating)';

-- Ajouter les nouvelles colonnes multi-critères
ALTER TABLE job_reviews
  ADD COLUMN IF NOT EXISTS rating_team        TINYINT UNSIGNED DEFAULT NULL
    COMMENT 'Note équipe terrain 1-5 — bénéficie aux employés + entreprise réalisatrice',
  ADD COLUMN IF NOT EXISTS rating_service     TINYINT UNSIGNED DEFAULT NULL
    COMMENT 'Note service client 1-5 — bénéficie à l''entreprise créatrice du job',
  ADD COLUMN IF NOT EXISTS rating_punctuality TINYINT UNSIGNED DEFAULT NULL
    COMMENT 'Note ponctualité 1-5 — bénéficie aux employés + entreprise réalisatrice',
  ADD COLUMN IF NOT EXISTS rating_care        TINYINT UNSIGNED DEFAULT NULL
    COMMENT 'Note soin du matériel 1-5 — bénéficie aux employés + entreprise réalisatrice',
  ADD COLUMN IF NOT EXISTS staff_ratings      JSON DEFAULT NULL
    COMMENT 'Notes individuelles par membre : [{user_id, rating, adjectives:[]}]',
  ADD COLUMN IF NOT EXISTS price_opinion      VARCHAR(20) DEFAULT NULL
    COMMENT '''fair'' | ''expensive'' | ''cheap''',
  ADD COLUMN IF NOT EXISTS price_expected     DECIMAL(10,2) DEFAULT NULL
    COMMENT 'Prix que le client estimait juste';

-- Mise à jour du flag xp_distributed (déjà créé en 026 sur job_review_tokens,
-- ici on l'ajoute sur job_reviews pour cohérence avec l'endpoint app)
ALTER TABLE job_reviews
  ADD COLUMN IF NOT EXISTS xp_distributed    TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 si la distribution XP/trophées a déjà été effectuée',
  ADD COLUMN IF NOT EXISTS xp_distributed_at DATETIME DEFAULT NULL
    COMMENT 'Timestamp de la distribution XP';

-- Index supplémentaires
ALTER TABLE job_reviews
  ADD INDEX IF NOT EXISTS idx_jr_xp_dist (xp_distributed, submitted_at),
  ADD INDEX IF NOT EXISTS idx_jr_overall  (company_id, rating_overall);

-- ============================================================
-- Fin migration 051
-- ============================================================

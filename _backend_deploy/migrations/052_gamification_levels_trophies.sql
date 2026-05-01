-- ============================================================
-- Migration 052: Niveaux, grades et trophées saisonniers
-- Date: 2026-04-29
-- ============================================================
-- Crée :
--   gamification_levels         → table de niveaux avec grades
--   gamification_trophies_def   → définition des trophées disponibles
--   gamification_trophies_earned → trophées gagnés par entité
--   gamification_seasons        → définition des saisons
-- Modifie :
--   gamification_profiles       → ajout colonnes trophées par saison
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. gamification_levels — Table des niveaux et grades
-- ────────────────────────────────────────────────────────────
-- Courbe XP : progressive (~200 XP par job 5 étoiles complet)
-- 15 niveaux pour horizon ~2-3 ans d'utilisation intensive

CREATE TABLE IF NOT EXISTS gamification_levels (
  level            SMALLINT UNSIGNED NOT NULL,
  grade_code       VARCHAR(30)  NOT NULL  COMMENT 'Code interne (ex: rookie, apprentice)',
  grade_name       VARCHAR(50)  NOT NULL  COMMENT 'Nom affiché (ex: Rookie, Pro Mover)',
  grade_emoji      VARCHAR(10)  NOT NULL  COMMENT 'Emoji du grade',
  grade_color      VARCHAR(10)  NOT NULL  COMMENT 'Couleur hex (ex: #808080)',
  xp_required      INT UNSIGNED NOT NULL  COMMENT 'XP total cumulé pour atteindre ce niveau',
  description      VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (level),
  UNIQUE KEY uq_grade_code (grade_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Niveaux et grades de la gamification (XP-based)';

INSERT INTO gamification_levels (level, grade_code, grade_name, grade_emoji, grade_color, xp_required, description) VALUES
  ( 1, 'recruit',      'Recruit',         '🌱', '#808080',      0,     'Just starting out'),
  ( 2, 'apprentice',   'Apprentice',      '⭐', '#6b9bd2',    200,    'Learning the ropes'),
  ( 3, 'mover',        'Mover',           '📦', '#5aab8c',    500,    'Getting things done'),
  ( 4, 'reliable',     'Reliable Mover',  '🔧', '#4ea06a',   1000,   'Consistently solid'),
  ( 5, 'pro_mover',    'Pro Mover',       '💪', '#e8a020',   1800,   'Professional-grade'),
  ( 6, 'senior',       'Senior Mover',    '🎯', '#e07020',   3000,   'Trusted by everyone'),
  ( 7, 'expert',       'Expert',          '🏆', '#d05010',   5000,   'Top-tier performer'),
  ( 8, 'specialist',   'Specialist',      '⚡', '#c03090',   8000,   'Domain expertise'),
  ( 9, 'elite',        'Elite',           '🔥', '#a020c0',  12000,  'Among the best'),
  (10, 'master',       'Master',          '💎', '#5020d0',  18000,  'Excellence mastered'),
  (11, 'grand_master', 'Grand Master',    '🌟', '#3040e0',  27000,  'Legendary status'),
  (12, 'champion',     'Champion',        '👑', '#1060f0',  40000,  'A champion of the trade'),
  (13, 'legend',       'Legend',          '🦁', '#ff4500',  58000,  'Their name is known'),
  (14, 'mythic',       'Mythic',          '🔮', '#8b00ff',  82000,  'Beyond the charts'),
  (15, 'cobbr_legend', 'Cobbr Legend',    '🌈', '#ff6b35', 120000, 'The pinnacle of Cobbr');

-- ────────────────────────────────────────────────────────────
-- 2. gamification_seasons — Définition des saisons (trophées)
-- ────────────────────────────────────────────────────────────
-- Saisons trimestrielles. Trophées = récompenses provisoires par saison.
-- À la fin d'une saison, les trophées sont archivés et remis à zéro.

CREATE TABLE IF NOT EXISTS gamification_seasons (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(20) NOT NULL  COMMENT 'Ex: S1-2026, S2-2026',
  name         VARCHAR(80) NOT NULL  COMMENT 'Ex: Spring 2026',
  emoji        VARCHAR(10) DEFAULT '🏅',
  starts_at    DATE        NOT NULL,
  ends_at      DATE        NOT NULL,
  is_active    TINYINT(1)  NOT NULL DEFAULT 0,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_season_code (code),
  INDEX idx_season_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Saisons de la gamification (trophées reset par saison)';

INSERT INTO gamification_seasons (code, name, emoji, starts_at, ends_at, is_active) VALUES
  ('S1-2026', 'Founding Season',  '🌱', '2026-01-01', '2026-06-30', 1),
  ('S2-2026', 'Winter Run',       '❄️', '2026-07-01', '2026-09-30', 0),
  ('S3-2026', 'Spring Sprint',    '🌸', '2026-10-01', '2026-12-31', 0);

-- ────────────────────────────────────────────────────────────
-- 3. gamification_trophies_def — Définition des trophées
-- ────────────────────────────────────────────────────────────
-- Les trophées sont des récompenses secondaires (provisoires).
-- Ils ne font pas monter de niveau mais influencent les classements.
-- On en gagne bien moins que d'XP.

CREATE TABLE IF NOT EXISTS gamification_trophies_def (
  id           SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code         VARCHAR(50) NOT NULL,
  name         VARCHAR(80) NOT NULL,
  description  VARCHAR(300) DEFAULT NULL,
  icon         VARCHAR(10) NOT NULL DEFAULT '🏅',
  rarity       ENUM('common','rare','epic','legendary') NOT NULL DEFAULT 'common'
    COMMENT 'Rareté : impact sur le score de classement',
  rarity_weight TINYINT UNSIGNED NOT NULL DEFAULT 1
    COMMENT 'Poids dans le score de classement (common=1, rare=3, epic=7, legendary=15)',
  max_per_season TINYINT UNSIGNED DEFAULT NULL
    COMMENT 'Nombre max par saison (NULL = illimité)',
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trophy_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Catalogue des trophées disponibles';

INSERT INTO gamification_trophies_def
  (code, name, description, icon, rarity, rarity_weight, max_per_season) VALUES
  -- Trophées revue client
  ('review_first',       'First Review',      'Received your first client review',                  '🌟', 'common',    1, NULL),
  ('review_5star',       'Five Star Job',     'Received a 5-star overall review',                   '⭐', 'common',    1,    5),
  ('review_perfect',     'Perfect Score',     'All criteria rated 5/5 by the client',               '💎', 'rare',      3,    3),
  ('review_10_reviews',  '10 Reviews',        'Accumulated 10 client reviews',                      '📋', 'rare',      3,    1),
  ('review_perfect_run', 'Perfect Run',       '3 consecutive 5-star reviews',                       '🔥', 'epic',      7,    2),
  -- Trophées d'excellence
  ('top_team_mention',   'Team Star',         'Individually rated 5 stars by a client',             '🌠', 'common',    1,    5),
  ('service_excellence', 'Service Excellence','Service rated 5 stars by a client',                  '🎯', 'rare',      3,    3),
  ('punctuality_king',   'Punctuality King',  'Punctuality rated 5 stars 3 times in a season',      '⏰', 'rare',      3,    2),
  ('care_master',        'Care Master',       'Care & handling rated 5 stars 3 times in a season',  '🛡️', 'rare',      3,    2),
  -- Trophées saisonniers rares
  ('season_top10',       'Top 10 Mover',      'Reached the top 10 leaderboard of the season',       '🏆', 'epic',      7,    1),
  ('season_mvp',         'Season MVP',        'Highest trophy score at the end of the season',      '👑', 'legendary', 15,   1),
  -- Trophées de contribution
  ('team_spirit',        'Team Spirit',       'Every team member rated 5 stars on the same job',    '🤝', 'epic',      7,    2),
  ('comeback',           'Comeback',          'First 5-star review after a 3-star or below',        '💪', 'rare',      3,    2);

-- ────────────────────────────────────────────────────────────
-- 4. gamification_trophies_earned — Trophées gagnés par entité
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_trophies_earned (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type  ENUM('user','company') NOT NULL,
  entity_id    INT NOT NULL,
  season_id    SMALLINT UNSIGNED NOT NULL,
  trophy_code  VARCHAR(50) NOT NULL,

  -- Références déclencheur
  job_id       INT DEFAULT NULL,
  review_id    INT DEFAULT NULL,

  -- Poids enregistré au moment du gain (pour immutabilité du classement)
  trophy_weight TINYINT UNSIGNED NOT NULL DEFAULT 1,

  earned_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  -- Idempotence : un trophée commun peut être gagné plusieurs fois par saison
  -- (max_per_season est vérifié applicativement)
  INDEX idx_entity_season  (entity_type, entity_id, season_id),
  INDEX idx_trophy_season  (trophy_code, season_id),
  INDEX idx_job            (job_id),

  CONSTRAINT fk_trophy_season
    FOREIGN KEY (season_id) REFERENCES gamification_seasons(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Trophées gagnés par entité par saison';

-- ────────────────────────────────────────────────────────────
-- 5. Colonnes saison courante dans gamification_profiles
-- ────────────────────────────────────────────────────────────
ALTER TABLE gamification_profiles
  ADD COLUMN IF NOT EXISTS current_season_id    SMALLINT UNSIGNED DEFAULT NULL
    COMMENT 'Saison courante (FK gamification_seasons)',
  ADD COLUMN IF NOT EXISTS current_season_score INT NOT NULL DEFAULT 0
    COMMENT 'Score de classement trophées saison courante (somme trophy_weight)',
  ADD COLUMN IF NOT EXISTS total_trophies_ever  INT NOT NULL DEFAULT 0
    COMMENT 'Nombre total de trophées gagnés (toutes saisons confondues)';

-- ────────────────────────────────────────────────────────────
-- 6. XP rewards pour la notation multi-critères
-- (insert ou mise à jour des seeds existants de 027)
-- ────────────────────────────────────────────────────────────
-- Vérifier que la table gamification_xp_rewards existe bien avant
-- (créée dans une migration précédente). Si non, on la crée inline.
CREATE TABLE IF NOT EXISTS gamification_xp_rewards (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  action_code VARCHAR(60) NOT NULL,
  action_name VARCHAR(120) NOT NULL,
  xp_amount   INT NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_action_code (action_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seeds multi-critères (note globale, équipe, service, etc.)
-- Ces valeurs sont des BASES — le moteur applique des multiplicateurs par rôle
INSERT INTO gamification_xp_rewards (action_code, action_name, xp_amount, active) VALUES
  -- ── Note globale (bénéficie à TOUS) ──
  ('review_overall_1star',    'Note globale 1★ reçue',        0,   1),
  ('review_overall_2star',    'Note globale 2★ reçue',        5,   1),
  ('review_overall_3star',    'Note globale 3★ reçue',       15,   1),
  ('review_overall_4star',    'Note globale 4★ reçue',       30,   1),
  ('review_overall_5star',    'Note globale 5★ reçue',       60,   1),
  -- ── Note équipe terrain (employés + entreprise réalisatrice) ──
  ('review_team_3star',       'Équipe notée 3★',              8,   1),
  ('review_team_4star',       'Équipe notée 4★',             20,   1),
  ('review_team_5star',       'Équipe notée 5★',             40,   1),
  -- ── Note service client (entreprise créatrice uniquement) ──
  ('review_service_3star',    'Service noté 3★',             10,   1),
  ('review_service_4star',    'Service noté 4★',             25,   1),
  ('review_service_5star',    'Service noté 5★',             50,   1),
  -- ── Ponctualité (employés + entreprise réalisatrice) ──
  ('review_punctuality_4star','Ponctualité notée 4★',        12,   1),
  ('review_punctuality_5star','Ponctualité notée 5★',        25,   1),
  -- ── Soin du matériel (employés + entreprise réalisatrice) ──
  ('review_care_4star',       'Soin matériel noté 4★',       12,   1),
  ('review_care_5star',       'Soin matériel noté 5★',       25,   1),
  -- ── Notes staff individuelles ──
  ('staff_review_4star',      'Note individuelle 4★',        15,   1),
  ('staff_review_5star',      'Note individuelle 5★',        30,   1),
  ('staff_positive_adj',      'Adjectif positif reçu',        5,   1)
ON DUPLICATE KEY UPDATE
  action_name = VALUES(action_name),
  xp_amount   = VALUES(xp_amount);

-- ────────────────────────────────────────────────────────────
-- Fin migration 052
-- ────────────────────────────────────────────────────────────

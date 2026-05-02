-- =============================================================================
-- Migration: 065_create_cosmetic_system.sql
-- Feature: Arcade Profile — Système de cosmétiques pixel art débloquables
-- Author: Nora — Database Engineer
-- Date: 2026-05-01
-- Status: PRÊTE POUR PROD — feature cachée côté app jusqu'à activation explicite
-- =============================================================================
-- Réversible : OUI — voir section DOWN en bas de fichier
-- Dépendances : users(id) INT, companies(id) INT (migration 064 pas requise)
-- Impact prod : additive uniquement — aucune table existante modifiée
-- =============================================================================

-- ============================================================
-- BLOC 1 — Table cosmetic_items
-- ============================================================
-- Catalogue global des cosmétiques disponibles sur la plateforme.
-- Pas de company_id : les items sont communs à toutes les companies.
-- is_default = 1 → item équipé à la création du profil, sans condition.
-- unlock_condition_value JSON :
--   { "min_reputation": 70 }
--   { "criteria": "photo_added", "min_count": 10 }
--   {} (vide pour is_default = 1 ou unlock_condition_type = 'manual')
-- asset_key : clé référençant le bundle d'assets côté app (ex: "cap_orange_basic")
-- layer_order : ordre d'affichage des layers pixel art (plus grand = devant)

CREATE TABLE IF NOT EXISTS cosmetic_items (
  id                       INT            NOT NULL AUTO_INCREMENT,
  slug                     VARCHAR(64)    NOT NULL COMMENT 'Identifiant unique lisible ex: cap_orange_basic',
  name                     VARCHAR(128)   NOT NULL,
  category                 ENUM(
                             'cap', 'vest', 'gloves', 'boots', 'shirt',
                             'trolley', 'decor', 'trophy', 'frame', 'effect'
                           )              NOT NULL,
  layer_order              TINYINT        NOT NULL DEFAULT 0 COMMENT 'Ordre de rendu pixel art (0 = fond, max = premier plan)',
  rarity                   ENUM(
                             'common', 'rare', 'epic', 'legendary'
                           )              NOT NULL DEFAULT 'common',
  unlock_condition_type    ENUM(
                             'reputation_score', 'criteria_jqs', 'badge', 'manual'
                           )              NOT NULL DEFAULT 'manual',
  unlock_condition_value   JSON           NOT NULL COMMENT 'Paramètres de déverrouillage — {} si is_default=1 ou manual',
  asset_key                VARCHAR(128)   NOT NULL COMMENT 'Clé asset côté app (correspond au slug en général)',
  is_default               TINYINT(1)     NOT NULL DEFAULT 0 COMMENT '1 = accordé automatiquement à tous les users sans condition',
  created_at               DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cosmetic_slug (slug)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catalogue global des cosmétiques pixel art débloquables (Arcade Profile)';

-- ============================================================
-- BLOC 2 — Index sur cosmetic_items
-- ============================================================

-- (category) : filtrage par catégorie pour le menu équipement
-- Exemple : SELECT * FROM cosmetic_items WHERE category = 'cap'
CREATE INDEX idx_cosmetic_category ON cosmetic_items (category);

-- (rarity) : filtrage pour l'affichage des cosmétiques rares/légendaires
-- Exemple : SELECT * FROM cosmetic_items WHERE rarity IN ('epic', 'legendary')
CREATE INDEX idx_cosmetic_rarity ON cosmetic_items (rarity);

-- (is_default) : récupération des items accordés par défaut à la création de profil
-- Exemple : SELECT * FROM cosmetic_items WHERE is_default = 1
CREATE INDEX idx_cosmetic_default ON cosmetic_items (is_default);

-- (unlock_condition_type) : batch unlock workers (cron reputation_score, badge rewards)
CREATE INDEX idx_cosmetic_unlock_type ON cosmetic_items (unlock_condition_type);

-- ============================================================
-- BLOC 3 — Table user_cosmetic_inventory
-- ============================================================
-- Enregistre chaque item débloqué par un user.
-- Un user ne peut pas débloquer deux fois le même item → UNIQUE (user_id, cosmetic_item_id).
-- company_id : isolation multi-tenant pour queries agrégées par company.
-- unlock_source : traçabilité de l'origine du déblocage (audit, support).

CREATE TABLE IF NOT EXISTS user_cosmetic_inventory (
  id                INT           NOT NULL AUTO_INCREMENT,
  user_id           INT           NOT NULL,
  cosmetic_item_id  INT           NOT NULL,
  company_id        INT           NOT NULL,
  unlocked_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unlock_source     VARCHAR(64)   NOT NULL DEFAULT 'manual_grant'
                    COMMENT 'ex: reputation_auto | badge_reward | manual_grant | default_init',

  PRIMARY KEY (id),

  -- Un user ne peut posséder qu'une fois le même item
  UNIQUE KEY uq_inventory_user_item (user_id, cosmetic_item_id),

  -- FKs : tous INT signé — correspond exactement à users.id, companies.id, cosmetic_items.id
  CONSTRAINT fk_inv_user     FOREIGN KEY (user_id)          REFERENCES users(id)          ON DELETE CASCADE,
  CONSTRAINT fk_inv_item     FOREIGN KEY (cosmetic_item_id) REFERENCES cosmetic_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_company  FOREIGN KEY (company_id)       REFERENCES companies(id)      ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Inventaire des cosmétiques débloqués par user (Arcade Profile)';

-- ============================================================
-- BLOC 4 — Index sur user_cosmetic_inventory
-- ============================================================

-- (user_id, unlocked_at) : historique des déblocages d'un user, trié par date
-- Exemple : SELECT * FROM user_cosmetic_inventory WHERE user_id = ? ORDER BY unlocked_at DESC
CREATE INDEX idx_inv_user_time     ON user_cosmetic_inventory (user_id, unlocked_at);

-- (company_id) : scope multi-tenant pour requêtes agrégées
-- Exemple : SELECT COUNT(*) FROM user_cosmetic_inventory WHERE company_id = ?
CREATE INDEX idx_inv_company       ON user_cosmetic_inventory (company_id);

-- (cosmetic_item_id) : stats de popularité d'un item
-- Exemple : SELECT COUNT(*) FROM user_cosmetic_inventory WHERE cosmetic_item_id = ?
CREATE INDEX idx_inv_item          ON user_cosmetic_inventory (cosmetic_item_id);

-- ============================================================
-- BLOC 5 — Table user_avatar_loadout
-- ============================================================
-- Une seule ligne par user — état d'équipement actuel du personnage pixel art.
-- user_id est la PK : un user = un loadout actif, INSERT ON DUPLICATE KEY UPDATE.
-- company_id : présent pour filtres RH / export company — pas pour l'unicité.
-- equipped_items JSON :
--   { "cap": 3, "vest": 7, "gloves": null, "boots": 1, "shirt": null,
--     "trolley": null, "decor": null, "trophy": null, "frame": null, "effect": null }
-- Clés = categories, valeurs = cosmetic_item_id (INT) ou null si rien d'équipé.
-- ATTENTION : l'intégrité référentielle des IDs dans equipped_items est
--             responsabilité du backend (vérifier que l'item est bien dans
--             user_cosmetic_inventory avant d'autoriser l'équipement).

CREATE TABLE IF NOT EXISTS user_avatar_loadout (
  user_id        INT       NOT NULL,
  company_id     INT       NOT NULL,
  equipped_items JSON      NOT NULL COMMENT 'Map category → cosmetic_item_id ou null',
  updated_at     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),

  -- FKs
  CONSTRAINT fk_loadout_user     FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_loadout_company  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Loadout actif du personnage pixel art par user (Arcade Profile)';

-- ============================================================
-- BLOC 6 — Index sur user_avatar_loadout
-- ============================================================

-- (company_id) : liste des loadouts actifs par company (ex: page équipe)
-- Exemple : SELECT * FROM user_avatar_loadout WHERE company_id = ?
CREATE INDEX idx_loadout_company ON user_avatar_loadout (company_id);

-- ============================================================
-- BLOC 7 — Données de base : cosmétiques par défaut
-- ============================================================
-- Ces items sont accordés automatiquement à tous les users.
-- is_default = 1 → le backend les insère dans user_cosmetic_inventory
--                  lors de l'initialisation du profil Arcade.
-- unlock_condition_type = 'manual' + is_default = 1 : pas de condition à vérifier.
-- layer_order :
--   10 = shirt (fond du corps)
--   20 = vest  (par-dessus shirt)
--   30 = boots (bas)
--   40 = gloves
--   50 = cap   (chapeau, premier plan)

INSERT INTO cosmetic_items
  (slug, name, category, layer_order, rarity, unlock_condition_type, unlock_condition_value, asset_key, is_default)
VALUES
  -- Items par défaut (débloqués à la création du profil)
  ('cap_orange_basic',  'Orange Cap',     'cap',   50, 'common', 'manual', '{}', 'cap_orange_basic',  1),
  ('vest_orange_basic', 'Orange Vest',    'vest',  20, 'common', 'manual', '{}', 'vest_orange_basic', 1),
  ('boots_basic',       'Work Boots',     'boots', 30, 'common', 'manual', '{}', 'boots_basic',       1),
  ('shirt_white_basic', 'White T-Shirt',  'shirt', 10, 'common', 'manual', '{}', 'shirt_white_basic', 1),
  ('gloves_basic',      'Work Gloves',    'gloves',40, 'common', 'manual', '{}', 'gloves_basic',      1),

  -- Items débloqués par reputation_score
  ('cap_blue_pro',      'Pro Blue Cap',   'cap',   50, 'rare',   'reputation_score', '{"min_reputation": 50}', 'cap_blue_pro',      0),
  ('vest_blue_pro',     'Pro Blue Vest',  'vest',  20, 'rare',   'reputation_score', '{"min_reputation": 50}', 'vest_blue_pro',     0),
  ('cap_gold_elite',    'Elite Gold Cap', 'cap',   50, 'epic',   'reputation_score', '{"min_reputation": 80}', 'cap_gold_elite',    0),
  ('vest_gold_elite',   'Elite Gold Vest','vest',  20, 'epic',   'reputation_score', '{"min_reputation": 80}', 'vest_gold_elite',   0),

  -- Items débloqués par critère JQS
  ('gloves_photo_pro',  'Photo Pro Gloves','gloves',40,'rare',   'criteria_jqs', '{"criteria": "photo_added", "min_count": 10}',       'gloves_photo_pro',  0),
  ('boots_sig_master',  'Signature Master Boots','boots',30,'rare','criteria_jqs','{"criteria": "signature_collected", "min_count": 10}','boots_sig_master', 0),

  -- Trophée légendaire — attribution manuelle (staff Cobbr)
  ('trophy_pioneer',    'Pioneer Trophy', 'trophy', 5, 'legendary','manual', '{}', 'trophy_pioneer',    0)
;

-- ============================================================
-- SECTION DOWN — Rollback complet
-- ============================================================
-- À exécuter manuellement en cas de rollback (ordre important : FK d'abord)
--
-- DROP TABLE IF EXISTS user_avatar_loadout;
-- DROP TABLE IF EXISTS user_cosmetic_inventory;
-- DROP TABLE IF EXISTS cosmetic_items;
--
-- ============================================================

-- =============================================================================
-- Notes de déploiement
-- =============================================================================
-- 1. Migration ADDITIVE — aucune table existante modifiée. Safe en prod.
-- 2. La feature est inactive côté app jusqu'à activation explicite (feature flag).
-- 3. Les items is_default=1 doivent être insérés en user_cosmetic_inventory
--    par le backend lors de l'init profil (endpoint à créer : POST /profile/arcade/init).
-- 4. equipped_items dans user_avatar_loadout : le backend DOIT vérifier que
--    cosmetic_item_id est présent dans user_cosmetic_inventory avant tout UPDATE.
-- 5. Pas de FK sur les valeurs JSON de equipped_items → responsabilité backend.
-- 6. INSERT INTO cosmetic_items utilise ON DUPLICATE KEY UPDATE implicitement
--    si rejoué (slug est UNIQUE — pas d'erreur à la réexécution).
--    → Attention : INSERT classique, pas INSERT IGNORE. Un rejeu échoue sur le slug.
--    → Pour un rejeu propre, utiliser : INSERT IGNORE INTO cosmetic_items ...
-- =============================================================================

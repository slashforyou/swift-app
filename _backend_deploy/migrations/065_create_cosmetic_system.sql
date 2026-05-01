-- 065_create_cosmetic_system.sql
-- Arcade Profile: tables cosmétiques (dev feature, migration additive sans risque prod)
-- Auteur: Nora (via Eva) — 01/05/2026

-- ─── 1. Catalogue global des cosmétiques ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS cosmetic_items (
  id                      INT NOT NULL AUTO_INCREMENT,
  slug                    VARCHAR(100) NOT NULL,
  name                    VARCHAR(150) NOT NULL,
  category                ENUM('cap','vest','gloves','boots','shirt','trolley','decor','trophy','frame','effect') NOT NULL,
  layer_order             TINYINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'Ordre de rendu (1=bas, 10=haut)',
  rarity                  ENUM('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
  unlock_condition_type   ENUM('default','reputation_score','criteria_jqs','badge','manual') NOT NULL DEFAULT 'default',
  unlock_condition_value  JSON NULL COMMENT 'Ex: {"min_reputation": 70} ou {"criteria": "photo_added", "min_count": 10}',
  asset_key               VARCHAR(200) NOT NULL COMMENT 'Clé asset côté app (ex: cap_orange_basic)',
  is_default              TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = accordé à tous les users à linit',
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slug (slug),
  KEY idx_ci_category (category),
  KEY idx_ci_rarity (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 2. Inventaire utilisateur ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_cosmetic_inventory (
  id                INT NOT NULL AUTO_INCREMENT,
  user_id           INT NOT NULL,
  cosmetic_item_id  INT NOT NULL,
  company_id        INT NOT NULL,
  unlocked_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unlock_source     VARCHAR(100) NOT NULL DEFAULT 'reputation_auto' COMMENT 'reputation_auto | badge_reward | manual_grant | jqs_criteria',
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_item (user_id, cosmetic_item_id),
  KEY idx_uci_user (user_id),
  KEY idx_uci_company (company_id),
  CONSTRAINT fk_uci_user    FOREIGN KEY (user_id)          REFERENCES users          (id) ON DELETE CASCADE,
  CONSTRAINT fk_uci_company FOREIGN KEY (company_id)       REFERENCES companies      (id) ON DELETE CASCADE,
  CONSTRAINT fk_uci_item    FOREIGN KEY (cosmetic_item_id) REFERENCES cosmetic_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. Loadout actif de l'utilisateur ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_avatar_loadout (
  user_id         INT NOT NULL,
  company_id      INT NOT NULL,
  equipped_items  JSON NOT NULL DEFAULT ('{}') COMMENT 'Ex: {"cap": 3, "vest": 7, "boots": null}',
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_ual_company (company_id),
  CONSTRAINT fk_ual_user    FOREIGN KEY (user_id)    REFERENCES users     (id) ON DELETE CASCADE,
  CONSTRAINT fk_ual_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 4. Seed : cosmétiques de base ───────────────────────────────────────────
INSERT INTO cosmetic_items (slug, name, category, layer_order, rarity, unlock_condition_type, unlock_condition_value, asset_key, is_default) VALUES
-- Items default (accordés à tous)
('cap_orange_basic',   'Orange Cap',    'cap',    10, 'common', 'default', NULL, 'cap_orange_basic',   1),
('vest_orange_basic',  'Orange Vest',   'vest',    6, 'common', 'default', NULL, 'vest_orange_basic',  1),
('boots_basic',        'Work Boots',    'boots',   1, 'common', 'default', NULL, 'boots_basic',        1),
('shirt_navy_basic',   'Navy Shirt',    'shirt',   5, 'common', 'default', NULL, 'shirt_navy_basic',   1),
('gloves_white_basic', 'Work Gloves',   'gloves',  7, 'common', 'default', NULL, 'gloves_white_basic', 1),
-- Débloqués à reputation_score >= 50
('cap_yellow_veteran', 'Veteran Cap',   'cap',    10, 'rare',   'reputation_score', '{"min_reputation": 50}', 'cap_yellow_veteran', 0),
('vest_gray_pro',      'Pro Vest',      'vest',    6, 'rare',   'reputation_score', '{"min_reputation": 50}', 'vest_gray_pro',      0),
-- Débloqués à reputation_score >= 80
('cap_black_elite',    'Elite Cap',     'cap',    10, 'epic',   'reputation_score', '{"min_reputation": 80}', 'cap_black_elite',    0),
('vest_black_elite',   'Elite Vest',    'vest',    6, 'epic',   'reputation_score', '{"min_reputation": 80}', 'vest_black_elite',   0),
-- Débloqués via critères JQS
('trophy_photo_master',     'Photo Master',     'trophy', 2, 'rare',      'criteria_jqs', '{"criteria": "photo_added",        "min_count": 10}', 'trophy_photo_master',     0),
('trophy_signature_pro',    'Signature Pro',    'trophy', 2, 'rare',      'criteria_jqs', '{"criteria": "signature_collected", "min_count": 10}', 'trophy_signature_pro',    0),
-- Attribution manuelle (fondateur, support)
('trophy_cobbr_founder',    'Cobbr Founder',    'trophy', 2, 'legendary', 'manual',       NULL, 'trophy_cobbr_founder', 0);

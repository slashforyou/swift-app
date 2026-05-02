# Gamification V2 — Spécification Technique Complète

**Date** : 26 avril 2026 *(mis à jour)*  
**Statut** : Implémentation partielle en cours  
**Scope** : Backend (Node.js/Express/MariaDB) + Frontend (React Native Expo)

---

## Table des matières

1. [Principes fondamentaux](#1-principes-fondamentaux)
2. [Entités du système](#2-entités-du-système)
3. [Schéma base de données](#3-schéma-base-de-données)
4. [Moteur d'événements et de règles](#4-moteur-dévénements-et-de-règles)
5. [Système de score par job](#5-système-de-score-par-job)
6. [Distribution des récompenses](#6-distribution-des-récompenses)
7. [Système de quêtes et achievements](#7-système-de-quêtes-et-achievements)
8. [Système de review client](#8-système-de-review-client)
9. [Système de saisons et trophées](#9-système-de-saisons-et-trophées)
10. [API endpoints](#10-api-endpoints)
11. [Frontend — Écrans et composants](#11-frontend--écrans-et-composants)
12. [Protections anti-abus](#12-protections-anti-abus)
13. [Gestion des périodes et fuseaux](#13-gestion-des-périodes-et-fuseaux)
14. [Récompenses de level](#14-récompenses-de-level)
15. [Migration depuis le système actuel](#15-migration-depuis-le-système-actuel)
16. [Roadmap d'implémentation par phases](#16-roadmap-dimplémentation-par-phases)
17. [Catalogue complet des actions trackables](#17-catalogue-complet-des-actions-trackables)

---

## 0. Contexte Produit Cobbr

### 0.1 Vision produit

Cobbr est une application mobile métier pour le secteur du déménagement. Son but est de centraliser l'exécution d'un job de déménagement, la coordination des équipes, la relation client, la signature, les paiements, et à terme la qualité de service, la réputation et la gamification.

Le produit est pensé comme une solution **field-first**, orientée terrain avant tout :

- Usage mobile
- Clarté des jobs
- Coordination bureau ↔ équipe terrain
- Suivi d'exécution
- Encaissement / signature
- Réduction du chaos opérationnel

Le projet existe sous forme d'application React Native / Expo, avec gestion de jobs, calendrier, détails job, paiement, onboarding Stripe, business hub, badges, XP, leaderboard et historique XP.

### 0.2 Cible métier

Cobbr cible principalement :

- Les entreprises de déménagement (petites et moyennes removal companies)
- Les entreprises qui délèguent ou sous-traitent des jobs
- Les chauffeurs / déménageurs / offsiders
- Les entreprises qui veulent structurer leur exécution terrain et leurs paiements

Le marché fonctionne souvent avec **plusieurs acteurs sur un même job** :

- Une entreprise **crée ou vend** le job
- Une autre entreprise **l'exécute**
- Des prestataires ou déménageurs individuels peuvent être impliqués
- Le client final paie à la fin
- Plusieurs entités doivent ensuite être rémunérées ou évaluées

### 0.3 Fonctions principales actuelles

- Gestion des jobs et du calendrier
- Gestion client, notes et instructions
- Inventaire / items
- Signature électronique
- Paiements Stripe (Connect + PaymentSheet)
- Business hub / entreprise
- Relations entre entreprises
- Leaderboard / badges / XP history
- Onboarding Stripe / comptes connectés
- Templates modulaires de job
- Contrats modulaires
- Système de plans/abonnements

### 0.4 Direction produit gamification

La gamification de Cobbr ne doit **pas** être une gamification gadget. Elle doit :

- Renforcer l'engagement
- Améliorer la qualité d'exécution
- Récompenser les bons comportements
- Rendre visible la qualité du service
- Créer une boucle de progression pour les utilisateurs
- Créer une couche de réputation pour les entreprises

**L'objectif n'est pas "jouer". L'objectif est : mieux travailler, mieux mesurer la qualité, mieux motiver, mieux classer, mieux récompenser.**

La gamification se divise en deux systèmes complémentaires :

**A. Système de quêtes / achievements** (inspiré du jeu vidéo, appliqué au travail réel) :

- Catégories : **Intro**, **Daily**, **Weekly**, **Monthly**, + **Événements** (temporaires, bonus)
- Chaque achievement rapporte de l'**XP** (plus c'est difficile, plus ça rapporte)
- Les quêtes événementielles offrent un multiplicateur XP sur une période définie
- Badges permanents, affichables sur le profil, débloqués selon conditions
- **Le classement (leaderboard) n'est pas dans le scope actuel** — focus quêtes en priorité

**B. Système de notes / qualité / réputation** :

- Note app : générée automatiquement à partir de checkpoints par type de job
- Note client : envoyée par lien email après le job, notation individuelle par déménageur + job global
- Transformation en XP, trophées, note de réputation

### 0.5 Besoins techniques identifiés

| Composant | Description |
|-----------|-------------|
| **Moteur d'événements métier** | job.created, job.started, job.completed, checkpoint.completed, photo.added, etc. |
| **Moteur de quêtes** | Daily/weekly/monthly/general, conditions dynamiques, progression, complétion |
| **Moteur de score job** | Note app + note client → note finale, distribution XP/trophées multi-entités |
| **Distribution multi-entités** | Utilisateurs + entreprise exécutrice + entreprise créatrice |
| **Leaderboard multi-périodes** | Hebdo, mensuel, annuel, total (potentiellement glissant) |
| **Profil gamifié** | XP, level, badges, trophées, rang, notes app/client, réputation globale |

---

## Système actuel (à refondre)

Le système existant est basique et mélange les concepts :

| Fichier | Rôle actuel |
|---------|-------------|
| `src/services/gamification.ts` | API fetch gamification, leaderboard, XP history |
| `src/hooks/useGamification.ts` | Hook avec données affichage, leaderboard, legacy addXP |
| `src/hooks/useGamificationFixed.ts` | Variante fixée du hook |
| `src/screens/leaderboard.tsx` | Écran leaderboard (XP-based uniquement) |
| `src/screens/badges.tsx` | Écran badges |
| `RANK_CONFIG` | 7 rangs liés au level (Starter → Diamond) |

**Problèmes** :

- Rang = level (pas de séparation progression/compétition)
- Leaderboard basé uniquement sur XP cumulé
- Pas de trophées périodiques
- Pas de quêtes
- Pas de score par job (checkpoints)
- Pas de review client structurée
- Badges rudimentaires (pas de système de conditions)
- Pas de multi-entités (user uniquement, pas company)

---

## 1. Principes fondamentaux

### 1.1 Les 4 objets du système

| Objet | Nature | Lifecycle | Source |
|-------|--------|-----------|--------|
| **XP** | Cumul à vie | **Jamais remis à zéro** | Quêtes, actions job, badges, onboarding |
| **Trophées** | Performance saisonnière | **Reset à chaque saison** (2×/an) | **Actions job uniquement** (complétion, avis client) |
| **Badges** | Reconnaissance durable | Débloqués une fois, persistants | Conditions spécifiques, permanents |
| **Notes** | Mesure qualité | Calculées par job, historisées | Checkpoints app + review client |

### 1.2 XP — Expérience permanente

L'**XP** est la devise de progression à vie :

- Augmente en permanence, **ne descend jamais**, **ne repart jamais à zéro**
- Détermine le **niveau** de l'utilisateur (1 à 15+)
- Sources : complétion de quêtes, actions job, déblocage badges, onboarding
- Chaque achievement a un montant d'XP défini (peut aller de 10 à 500 XP)

### 1.3 Trophées — Devise saisonnière

Les **trophées** sont la devise compétitive périodique :

- **Sources exclusives** : qualité d'exécution des **jobs** uniquement
  - Compléter un job correctement (score scorecard)
  - Avoir de bons avis clients
  - Checkpoints de qualité validés
- **Disparaissent** à la fin de chaque saison (reset complet)
- **2 saisons par an** de 6 mois chacune :
  - **Saison Hiver** : 1er janvier → 30 juin
  - **Saison Été** : 1er juillet → 31 décembre
- Les trophées de la saison précédente sont archivés (visible dans l'historique) mais ne comptent plus
- **Pas de trophées via les quêtes** (les quêtes donnent uniquement de l'XP)

### 1.4 Règles invariantes

- **XP** : ne descend jamais, ne reset jamais, source unique de progression de level
- **Trophées** : reset automatique à chaque début de saison, **actions job uniquement**
- **Badges** : une fois débloqué, jamais perdu. Ne peut pas être réattribué
- **Notes** : toujours rattachées à un job, séparées par type (app/client), historisées
- **Un même événement** ne peut récompenser 2 fois la même entité (idempotence)

### 1.5 Vocabulaire normé

| Ancien terme | Nouveau terme | Justification |
|---|---|---|
| Rank (basé sur level) | **Level Title** | Progression permanente |
| — | **Saison** | Compétition trophées bi-annuelle |
| XP + Rank mélangés | XP → Level → Level Title | Séparation stricte |
| Quest "general" | **Intro** | Quêtes d'onboarding/découverte |
| — | **Event** | Catégorie événementielle temporaire avec bonus XP |

---

## 2. Entités du système

### 2.1 Utilisateur (User)

Rôles : chauffeur, offsider, manager terrain

| Attribut | Description |
|----------|-------------|
| XP à vie | `lifetime_xp` dans `gamification_profiles` |
| Level | Calculé depuis XP via `gamification_levels` |
| Level Title | Titre associé au level (ex: "Expert", "Légende") |
| Badges | Débloqués dans `gamification_badge_unlocks` |
| Trophées | Par période dans `trophy_ledgers` |
| League | Calculée depuis trophées période via `league_tiers` |
| Note app | Agrégée depuis `job_checkpoint_results` (reviewer_type=system) |
| Note client | Agrégée depuis `client_review_targets` |
| Quality score | Agrégé depuis `job_scorecards` |

### 2.2 Entreprise Exécutrice (Company Executor)

L'entreprise qui **réalise** le job.

| Attribut | Description |
|----------|-------------|
| XP entreprise | Cumulée à vie |
| Badges entreprise | Débloqués une fois |
| Trophées entreprise | Par période |
| Note service d'équipe | Score app agrégé |
| Note client | Score client agrégé |
| Historique par période | Trophy ledger par semaine/mois/année |

### 2.3 Entreprise Créatrice (Company Creator)

L'entreprise qui **vend, crée, ou attribue** le job.

| Attribut | Description |
|----------|-------------|
| XP entreprise créatrice | Cumulée à vie |
| Trophées | Par période |
| Note communication | Score sur la qualité du brief |
| Note pricing | Note sur la justesse des prix |
| Note matching | Note sur le choix du partenaire |
| Note client | Score client agrégé |
| Réputation coordination | Score composite |

### 2.4 Job

Unité centrale de calcul. Le job est l'événement producteur de toutes les métriques.

| Attribut | Description |
|----------|-------------|
| Participants | Liste des users + companies |
| Type de job | Template utilisé (segments) |
| Checkpoints attendus | Depuis `job_checkpoints` par type |
| Temps prévu / réel | Durée estimée vs durée réelle |
| Incidents | Compteur et détails |
| Photos | Compteur et vérification |
| Validations | Signatures, confirmations |
| Note app | `app_score_total` dans `job_scorecards` |
| Note client | `client_score_total` dans `job_scorecards` |
| Distribution XP | Multi-entités |
| Distribution trophées | Multi-entités |

---

## 3. Schéma base de données

### 3.1 Bloc Progression

#### `gamification_profiles`

Profil gamification par entité (user OU company).

```sql
CREATE TABLE gamification_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  lifetime_xp INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 1,
  current_streak_days INT NOT NULL DEFAULT 0,
  longest_streak_days INT NOT NULL DEFAULT 0,
  last_active_date DATE DEFAULT NULL,
  total_jobs_completed INT NOT NULL DEFAULT 0,
  avg_app_score DECIMAL(5,2) DEFAULT NULL,
  avg_client_score DECIMAL(5,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entity (entity_type, entity_id),
  INDEX idx_level (current_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `gamification_xp_events`

Historique brut de chaque gain d'XP. Table append-only.

```sql
CREATE TABLE gamification_xp_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  xp_amount INT NOT NULL,
  source_type VARCHAR(50) NOT NULL COMMENT 'job_score, quest, badge, checkpoint, review, bonus',
  source_id VARCHAR(100) NOT NULL COMMENT 'job_id, quest_id, badge_code, etc.',
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_source (source_type, source_id),
  INDEX idx_created (created_at),
  UNIQUE KEY uq_idempotent (entity_type, entity_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `gamification_levels`

Table de configuration des niveaux et seuils XP.

```sql
CREATE TABLE gamification_levels (
  level INT PRIMARY KEY,
  xp_required INT NOT NULL,
  title VARCHAR(50) NOT NULL,
  reward_type ENUM('none','cosmetic','functional') NOT NULL DEFAULT 'none',
  reward_payload JSON DEFAULT NULL,
  INDEX idx_xp (xp_required)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data
INSERT INTO gamification_levels (level, xp_required, title, reward_type, reward_payload) VALUES
(1,  0,       'Newcomer',     'none',     NULL),
(2,  100,     'Starter',      'cosmetic', '{"type":"avatar_frame","code":"starter_frame"}'),
(3,  300,     'Apprentice',   'none',     NULL),
(4,  600,     'Mover',        'cosmetic', '{"type":"title","code":"mover"}'),
(5,  1000,    'Professional', 'none',     NULL),
(6,  1500,    'Experienced',  'cosmetic', '{"type":"badge_slot","extra_slots":1}'),
(7,  2200,    'Veteran',      'none',     NULL),
(8,  3000,    'Expert',       'cosmetic', '{"type":"avatar_frame","code":"expert_frame"}'),
(9,  4000,    'Master',       'none',     NULL),
(10, 5200,    'Elite',        'cosmetic', '{"type":"title","code":"elite"}'),
(11, 6500,    'Champion',     'none',     NULL),
(12, 8000,    'Hero',         'cosmetic', '{"type":"avatar_frame","code":"hero_frame"}'),
(13, 10000,   'Legend',       'cosmetic', '{"type":"theme","code":"legend_theme"}'),
(14, 12500,   'Mythic',       'none',     NULL),
(15, 15000,   'Transcendent', 'cosmetic', '{"type":"confetti","code":"transcendent_confetti"}');
```

#### `gamification_badges`

Catalogue de tous les badges possibles.

```sql
CREATE TABLE gamification_badges (
  badge_code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT '🏅',
  category ENUM('driver','quality','streak','rating','business','onboarding','special') NOT NULL,
  entity_scope ENUM('user','company','both') NOT NULL DEFAULT 'user',
  unlock_rule_type VARCHAR(50) NOT NULL COMMENT 'job_count, rating_avg, streak_days, review_count, photo_count, no_incident_streak, onboarding_complete, manual',
  unlock_rule_payload JSON NOT NULL,
  xp_bonus INT NOT NULL DEFAULT 0 COMMENT 'XP awarded when badge is unlocked',
  rarity ENUM('common','uncommon','rare','epic','legendary') NOT NULL DEFAULT 'common',
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_rarity (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed exemples
INSERT INTO gamification_badges (badge_code, name, description, category, entity_scope, unlock_rule_type, unlock_rule_payload, xp_bonus, rarity) VALUES
('FIRST_JOB',        'First Move',        'Complete your first job',                      'driver',     'user',    'job_count',           '{"threshold":1}',                  50,  'common'),
('SPEED_DEMON',      'Speed Demon',       'Complete 50 jobs ahead of schedule',           'driver',     'user',    'job_count',           '{"threshold":50,"condition":"early"}', 200, 'rare'),
('PERFECTIONIST',    'Perfectionist',     'Maintain 4.8+ rating for 20 consecutive jobs', 'rating',     'user',    'rating_avg',          '{"min_rating":4.8,"min_jobs":20}',  300, 'epic'),
('STREAK_7',         '7-Day Streak',      'Work 7 consecutive days',                      'streak',     'user',    'streak_days',         '{"threshold":7}',                   100, 'common'),
('STREAK_30',        'Monthly Machine',   'Work 30 consecutive days',                     'streak',     'user',    'streak_days',         '{"threshold":30}',                  250, 'uncommon'),
('STREAK_100',       'Iron Will',         '100 consecutive days of work',                 'streak',     'user',    'streak_days',         '{"threshold":100}',                 500, 'legendary'),
('ZERO_INCIDENTS',   'Safe Hands',        '20 jobs with zero incidents',                  'quality',    'both',    'no_incident_streak',  '{"threshold":20}',                  200, 'rare'),
('PHOTO_PRO',        'Photo Pro',         'Add 500 photos across all jobs',               'quality',    'user',    'photo_count',         '{"threshold":500}',                 150, 'uncommon'),
('FIVE_STAR_50',     'Five Star Legend',  'Receive 50 five-star client reviews',          'rating',     'both',    'review_count',        '{"threshold":50,"min_rating":5}',   400, 'epic'),
('ONBOARDING_DONE',  'Ready to Roll',     'Complete all onboarding steps',                'onboarding', 'user',    'onboarding_complete', '{}',                                75,  'common'),
('TOP_COMPANY',      'Top Company',       'Reach #1 on the weekly leaderboard',           'business',   'company', 'manual',              '{}',                                500, 'legendary');
```

#### `gamification_badge_unlocks`

Badges effectivement débloqués.

```sql
CREATE TABLE gamification_badge_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  badge_code VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_job_id INT DEFAULT NULL COMMENT 'Job qui a déclenché le déblocage',
  UNIQUE KEY uq_badge (entity_type, entity_id, badge_code),
  FOREIGN KEY (badge_code) REFERENCES gamification_badges(badge_code),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.2 Bloc Quêtes

#### `gamification_quest_events`

Catégories événementielles : des événements temporaires sur une période donnée, avec un multiplicateur XP bonus. À créer **avant** la table `quests` (FK).

```sql
CREATE TABLE gamification_quest_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,             -- ex: "Summer Challenge 2026"
  description TEXT DEFAULT NULL,
  icon VARCHAR(10) DEFAULT '🎪',
  color VARCHAR(7) NOT NULL DEFAULT '#FF6B35',  -- couleur accent de l'événement
  xp_bonus_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00, -- ex: 1.5 = +50% XP
  start_date DATE NOT NULL,               -- début de l'événement
  end_date DATE NOT NULL,                 -- fin de l'événement
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dates (start_date, end_date),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exemple
INSERT INTO gamification_quest_events (code, name, description, icon, color, xp_bonus_multiplier, start_date, end_date) VALUES
('summer_2026', 'Summer Challenge 2026', 'Des défis estivaux avec +50% XP', '☀️', '#FF8C00', 1.50, '2026-07-01', '2026-07-31');
```

#### `quests`

Catalogue de tous les achievements/quêtes. Structure complète d'un achievement :

- **But** (`description`) : ce qu'il faut réaliser  
- **Date de fin** (`end_date`) : deadline, `NULL` = illimité (ex: quêtes Intro)  
- **Catégorie** (`category`) : Intro / Daily / Weekly / Monthly / Event  
- **Nom** (`title`) : nom affiché  
- **Récompense** (`xp_reward`) : montant d'XP attribué  
- **Trophées** (`trophy_count`) : nombre de trophées (0 pour la plupart, trophées viennent principalement des jobs)

```sql
CREATE TABLE quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL COMMENT 'But : ce que l utilisateur doit réaliser',
  icon VARCHAR(10) DEFAULT '⚔️',
  category ENUM('intro','daily','weekly','monthly','event') NOT NULL,
  entity_scope ENUM('user','company') NOT NULL DEFAULT 'user',
  xp_reward INT NOT NULL DEFAULT 0 COMMENT 'XP attribués à la complétion',
  trophy_count INT NOT NULL DEFAULT 0 COMMENT 'Trophées (0 pour quasi toutes les quêtes)',
  conditions JSON NOT NULL COMMENT '{"event":"job_completed","count":3}',
  repeatable TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=daily/weekly/monthly, 0=intro/event one-time',
  end_date DATE DEFAULT NULL COMMENT 'NULL = illimité. Pour les intros par ex.',
  event_id INT DEFAULT NULL COMMENT 'FK -> gamification_quest_events si category=event',
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES gamification_quest_events(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_event (event_id),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed : quêtes Intro (one-time, pas d'end_date, repeatable=0)
INSERT INTO quests (code, title, description, category, xp_reward, trophy_count, conditions, repeatable, end_date, sort_order) VALUES
('INTRO_FIRST_JOB',   'Premier job',         'Compléter ton premier job',                'intro', 50,  0, '{"event":"job_completed","count":1}',    0, NULL, 1),
('INTRO_PROFILE',     'Profil complété',      'Renseigner toutes les infos de profil',    'intro', 30,  0, '{"event":"profile_complete","count":1}', 0, NULL, 2),
('INTRO_FIRST_PHOTO', 'Première photo',       'Ajouter une photo à un job',               'intro', 20,  0, '{"event":"photo_added","count":1}',      0, NULL, 3),
('INTRO_FIRST_STEP',  'Première étape',       'Avancer un job à une nouvelle étape',      'intro', 20,  0, '{"event":"step_completed","count":1}',   0, NULL, 4),
('INTRO_5_JOBS',      '5 jobs complétés',     'Compléter 5 jobs au total',                'intro', 100, 0, '{"event":"job_completed","count":5}',    0, NULL, 5);

-- Seed : quêtes Daily (repeatable, pas d'end_date)
INSERT INTO quests (code, title, description, category, xp_reward, trophy_count, conditions, repeatable, end_date, sort_order) VALUES
('DAILY_COMPLETE_1',    'Journée active',     'Compléter 1 job aujourd''hui',             'daily', 25, 0, '{"event":"job_completed","count":1}',  1, NULL, 10),
('DAILY_PHOTO_5',       'Photographe du jour','Ajouter 5 photos aujourd''hui',            'daily', 15, 0, '{"event":"photo_added","count":5}',    1, NULL, 11),
('DAILY_NO_INCIDENT',   'Journée sans accroc','Terminer tous les jobs sans incident',     'daily', 20, 0, '{"event":"no_incident_day","count":1}', 1, NULL, 12);

-- Seed : quêtes Weekly (repeatable, pas d'end_date)
INSERT INTO quests (code, title, description, category, xp_reward, trophy_count, conditions, repeatable, end_date, sort_order) VALUES
('WEEKLY_COMPLETE_5',   'Semaine productive', 'Compléter 5 jobs cette semaine',           'weekly', 100, 0, '{"event":"job_completed","count":5}',           1, NULL, 20),
('WEEKLY_5_STAR',       'Semaine en étoiles', 'Recevoir 3 avis 5 étoiles cette semaine',  'weekly', 75,  0, '{"event":"five_star_review","count":3}',        1, NULL, 21);

-- Seed : quêtes Monthly (repeatable, pas d'end_date)
INSERT INTO quests (code, title, description, category, xp_reward, trophy_count, conditions, repeatable, end_date, sort_order) VALUES
('MONTHLY_COMPLETE_20', 'Marathon mensuel',   'Compléter 20 jobs ce mois',                'monthly', 300, 0, '{"event":"job_completed","count":20}',  1, NULL, 30),
('MONTHLY_STREAK_14',   'Deux semaines forte','14 jours consécutifs de travail',          'monthly', 200, 0, '{"event":"streak_reached","count":14}', 1, NULL, 31);
```

#### `quest_progress`

Suivi de la progression de chaque entité sur chaque quête.

```sql
CREATE TABLE quest_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quest_id INT NOT NULL,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  period_key VARCHAR(20) NOT NULL COMMENT 'Format: daily_2026-04-03, weekly_2026-W14, monthly_2026-04, general, event_summer_2026',
  current_progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL,
  status ENUM('active','completed','claimed','expired') NOT NULL DEFAULT 'active',
  completed_at TIMESTAMP NULL DEFAULT NULL,
  claimed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_quest_entity_period (quest_id, entity_type, entity_id, period_key),
  FOREIGN KEY (quest_id) REFERENCES quests(id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.3 Bloc Qualité / Notation

#### `job_scorecards`

Une fiche score générée par job après complétion.

```sql
CREATE TABLE job_scorecards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL UNIQUE,
  app_score_total DECIMAL(5,2) DEFAULT NULL COMMENT 'Score app 0-100',
  client_score_total DECIMAL(5,2) DEFAULT NULL COMMENT 'Score client 0-100',
  final_score DECIMAL(5,2) DEFAULT NULL COMMENT 'Score combiné pondéré',
  checkpoints_completed INT NOT NULL DEFAULT 0,
  checkpoints_total INT NOT NULL DEFAULT 0,
  incidents_count INT NOT NULL DEFAULT 0,
  photos_count INT NOT NULL DEFAULT 0,
  time_variance_minutes INT DEFAULT NULL COMMENT 'Positif = en retard, négatif = en avance',
  xp_distributed INT NOT NULL DEFAULT 0,
  trophies_distributed INT NOT NULL DEFAULT 0,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job (job_id),
  INDEX idx_generated (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `job_checkpoints`

Définition des points de contrôle possibles par type de job.

```sql
CREATE TABLE job_checkpoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL DEFAULT '*' COMMENT '* = tous les types, ou code template spécifique',
  code VARCHAR(50) NOT NULL,
  label VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  category ENUM('timing','photo','article_state','incident','communication','completion','safety','documentation') NOT NULL,
  scoring_method ENUM('boolean','time_delta','percentage','rating') NOT NULL DEFAULT 'boolean',
  weight DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  required TINYINT(1) NOT NULL DEFAULT 0,
  xp_reward INT NOT NULL DEFAULT 5,
  trophy_reward INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_type_code (job_type, code),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed : checkpoints universels (s'appliquent à tous les types de job)
INSERT INTO job_checkpoints (job_type, code, label, category, scoring_method, weight, required, xp_reward, trophy_reward) VALUES
('*', 'on_time_arrival',      'Arrived on time',                     'timing',        'time_delta', 1.50, TRUE,  10, 2),
('*', 'on_time_completion',   'Completed within estimated time',     'timing',        'time_delta', 1.50, FALSE, 10, 2),
('*', 'photo_before',         'Photos taken before job',             'photo',         'boolean',    1.00, FALSE, 5,  1),
('*', 'photo_after',          'Photos taken after job',              'photo',         'boolean',    1.00, FALSE, 5,  1),
('*', 'no_damage_reported',   'No damage incidents',                 'article_state', 'boolean',    2.00, FALSE, 15, 3),
('*', 'client_signature',     'Client signature collected',          'documentation', 'boolean',    1.00, TRUE,  5,  1),
('*', 'inventory_complete',   'Inventory list completed',            'documentation', 'boolean',    0.80, FALSE, 5,  1),
('*', 'safety_ppe_worn',      'PPE worn throughout job',             'safety',        'boolean',    0.50, FALSE, 3,  0),
('*', 'communication_update', 'Client updated during job',           'communication', 'boolean',    0.70, FALSE, 5,  1);
```

#### `job_checkpoint_results`

Résultat concret d'un checkpoint sur un job donné + qui l'a validé.

```sql
CREATE TABLE job_checkpoint_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  checkpoint_id INT NOT NULL,
  entity_type ENUM('user','company','system') NOT NULL DEFAULT 'system',
  entity_id INT DEFAULT NULL,
  passed TINYINT(1) NOT NULL DEFAULT 0,
  score DECIMAL(5,2) DEFAULT NULL COMMENT '0-100',
  value JSON DEFAULT NULL COMMENT 'Données brutes : temps, photos, etc.',
  reviewer_type ENUM('system','manager','client') NOT NULL DEFAULT 'system',
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_checkpoint_entity (job_id, checkpoint_id, entity_type, entity_id),
  FOREIGN KEY (checkpoint_id) REFERENCES job_checkpoints(id),
  INDEX idx_job (job_id),
  INDEX idx_checkpoint (checkpoint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `client_reviews`

Review globale du client sur le job.

```sql
CREATE TABLE client_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  review_token VARCHAR(64) NOT NULL UNIQUE COMMENT 'Token signé pour le lien email',
  overall_rating TINYINT NOT NULL COMMENT '1-5 étoiles',
  time_rating TINYINT DEFAULT NULL COMMENT '1-5',
  service_rating TINYINT DEFAULT NULL COMMENT '1-5',
  communication_rating TINYINT DEFAULT NULL COMMENT '1-5',
  price_rating TINYINT DEFAULT NULL COMMENT '1-5',
  comment TEXT DEFAULT NULL,
  would_recommend TINYINT(1) DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  client_email VARCHAR(255) DEFAULT NULL,
  client_name VARCHAR(100) DEFAULT NULL,
  external_publish_consent TINYINT(1) NOT NULL DEFAULT 0,
  external_platform VARCHAR(50) DEFAULT NULL COMMENT 'google, facebook, etc.',
  INDEX idx_job (job_id),
  INDEX idx_token (review_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `client_review_targets`

Notes individuelles par participant et par entreprise.

```sql
CREATE TABLE client_review_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  rating TINYINT NOT NULL COMMENT '1-5',
  comment TEXT DEFAULT NULL,
  FOREIGN KEY (review_id) REFERENCES client_reviews(id) ON DELETE CASCADE,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_review (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.4 Bloc Compétition / Saisons

#### `trophy_ledgers`

Compteur de trophées par entité et par période.

```sql
CREATE TABLE trophy_ledgers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  period_type ENUM('weekly','monthly','yearly','alltime') NOT NULL,
  period_key VARCHAR(20) NOT NULL COMMENT 'Ex: 2026-W14, 2026-04, 2026, alltime',
  trophies_earned INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_entity_period (entity_type, entity_id, period_type, period_key),
  INDEX idx_period (period_type, period_key),
  INDEX idx_trophies (trophies_earned DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `trophy_events`

Historique brut de chaque gain de trophées (mirror de xp_events pour trophées).

```sql
CREATE TABLE trophy_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  trophy_amount INT NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(100) NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at),
  UNIQUE KEY uq_idempotent (entity_type, entity_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `leaderboard_snapshots`

Snapshots figés pour historique (optionnel mais recommandé).

```sql
CREATE TABLE leaderboard_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  period_type ENUM('weekly','monthly','yearly') NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  trophies INT NOT NULL,
  rank_position INT NOT NULL,
  league_code VARCHAR(50) DEFAULT NULL,
  snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_snapshot (entity_type, entity_id, period_type, period_key),
  INDEX idx_period (period_type, period_key),
  INDEX idx_rank (rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `league_tiers`

Définition des leagues compétitives (remplace l'ancien RANK_CONFIG pour la compétition).

```sql
CREATE TABLE league_tiers (
  code VARCHAR(50) PRIMARY KEY,
  label VARCHAR(50) NOT NULL,
  min_trophies INT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL,
  sort_order INT NOT NULL,
  INDEX idx_trophies (min_trophies)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO league_tiers (code, label, min_trophies, icon, color, sort_order) VALUES
('unranked',   'Unranked',     0,    '⚪', '#808080', 0),
('bronze_3',   'Bronze III',   50,   '🥉', '#CD7F32', 1),
('bronze_2',   'Bronze II',    100,  '🥉', '#CD7F32', 2),
('bronze_1',   'Bronze I',     175,  '🥉', '#CD7F32', 3),
('silver_3',   'Silver III',   275,  '🥈', '#C0C0C0', 4),
('silver_2',   'Silver II',    400,  '🥈', '#C0C0C0', 5),
('silver_1',   'Silver I',     550,  '🥈', '#C0C0C0', 6),
('gold_3',     'Gold III',     750,  '🥇', '#FFD700', 7),
('gold_2',     'Gold II',      1000, '🥇', '#FFD700', 8),
('gold_1',     'Gold I',       1300, '🥇', '#FFD700', 9),
('platinum_3', 'Platinum III', 1700, '💎', '#E5E4E2', 10),
('platinum_2', 'Platinum II',  2200, '💎', '#E5E4E2', 11),
('platinum_1', 'Platinum I',   2800, '💎', '#E5E4E2', 12),
('diamond',    'Diamond',      3500, '👑', '#B9F2FF', 13),
('champion',   'Champion',     5000, '🏆', '#FF4500', 14);
```

---

### 3.5 Bloc Récompenses de Level

#### `level_rewards`

Récompenses débloquées à chaque level (cosmétiques/confort).

```sql
CREATE TABLE level_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level INT NOT NULL,
  reward_type ENUM('cosmetic','functional','badge_slot','title','avatar_frame','theme') NOT NULL,
  reward_code VARCHAR(50) NOT NULL,
  reward_name VARCHAR(100) NOT NULL,
  reward_description TEXT DEFAULT NULL,
  reward_payload JSON DEFAULT NULL,
  FOREIGN KEY (level) REFERENCES gamification_levels(level),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `unlocked_rewards`

Récompenses effectivement débloquées par les entités.

```sql
CREATE TABLE unlocked_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  reward_id INT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entity_reward (entity_type, entity_id, reward_id),
  FOREIGN KEY (reward_id) REFERENCES level_rewards(id),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. Moteur d'événements et de règles

### 4.1 Architecture

Le moteur est le cœur du système. Il transforme des **événements métier** en **récompenses**.

```
Événement métier
    ↓
[Event Bus] — enregistre l'événement brut
    ↓
[Rule Engine] — évalue les règles applicables
    ├── Quest Rules   → progression quête → XP + trophées si complétée
    ├── Badge Rules   → vérification conditions → badge unlock + XP bonus
    ├── Score Rules   → scorecard job → XP + trophées selon score
    └── Streak Rules  → mise à jour streak → badges streak
    ↓
[Reward Writer] — persiste les récompenses (idempotent)
    ├── gamification_xp_events
    ├── gamification_profiles (lifetime_xp += amount)
    ├── trophy_events + trophy_ledgers
    ├── gamification_badge_unlocks
    └── level check → level_rewards → unlocked_rewards
    ↓
[Notification Dispatcher] — push/in-app notifications
```

### 4.2 Événements métier à écouter

| Événement | Déclencheur | Données |
|-----------|-------------|---------|
| `job.created` | Création d'un job | job_id, creator_company_id |
| `job.accepted` | Assignation acceptée | job_id, user_id, company_id |
| `job.started` | Début du job | job_id, start_time, expected_start |
| `checkpoint.completed` | Un checkpoint validé | job_id, checkpoint_code, entity_type, entity_id, value |
| `photo.added` | Photo ajoutée au job | job_id, user_id, photo_count |
| `note.added` | Note ajoutée au job | job_id, user_id |
| `incident.reported` | Incident signalé | job_id, user_id, severity |
| `incident.resolved` | Incident résolu | job_id, incident_id |
| `signature.collected` | Signature client | job_id, signer_type |
| `job.completed` | Job terminé | job_id, actual_duration, participants[] |
| `client_review.submitted` | Avis client reçu | review_id, job_id, ratings |
| `external_review.published` | Avis externe publié | review_id, platform |
| `streak.reached` | Streak atteint un seuil | user_id, streak_days |
| `onboarding.completed` | Onboarding terminé | user_id |

### 4.3 Implémentation backend

```
server/
  services/
    gamification/
      eventBus.js
      ruleEngine.js
      questEngine.js
      scoreEngine.js
      rewardWriter.js
      badgeChecker.js
      streakTracker.js
```

#### `eventBus.js` — Structure

```javascript
// Singleton EventEmitter
const EventEmitter = require('events');
const bus = new EventEmitter();

// Émet un événement métier
function emit(eventType, payload) {
  bus.emit('gamification_event', { type: eventType, ...payload, timestamp: new Date() });
}

// Les listeners sont enregistrés au démarrage du serveur
function registerListeners(ruleEngine) {
  bus.on('gamification_event', async (event) => {
    try {
      await ruleEngine.processEvent(event);
    } catch (err) {
      console.error('[Gamification] Error processing event:', event.type, err);
    }
  });
}

module.exports = { emit, registerListeners };
```

#### `ruleEngine.js` — Structure

```javascript
async function processEvent(event) {
  // 1. Quêtes : incrémenter les progressions
  await questEngine.onEvent(event);

  // 2. Badges : vérifier les conditions de déblocage
  await badgeChecker.checkBadges(event);

  // 3. Streaks : mettre à jour si job.completed
  if (event.type === 'job.completed') {
    await streakTracker.updateStreak(event);
  }

  // 4. Score : générer scorecard si job terminé
  if (event.type === 'job.completed') {
    await scoreEngine.generateScorecard(event.job_id);
  }

  // 5. Reviews : intégrer dans scorecard si review soumise
  if (event.type === 'client_review.submitted') {
    await scoreEngine.integrateClientReview(event.review_id);
  }
}
```

#### `questEngine.js` — Structure

```javascript
async function onEvent(event) {
  // 1. Trouver les quêtes actives correspondant à cet event
  const activeQuests = await db.query(`
    SELECT q.*, qp.id as progress_id, qp.current_progress, qp.target, qp.status
    FROM quests q
    LEFT JOIN quest_progress qp ON q.id = qp.quest_id
      AND qp.entity_type = ? AND qp.entity_id = ?
      AND qp.period_key = ?
    WHERE q.active = 1
      AND q.entity_scope = ?
      AND JSON_EXTRACT(q.conditions, '$.event') = ?
  `, [event.entity_type, event.entity_id, getCurrentPeriodKey(quest.type), event.entity_type, event.type]);

  for (const quest of activeQuests) {
    // 2. Créer ou incrémenter la progression
    if (!quest.progress_id) {
      await db.query(`INSERT INTO quest_progress (quest_id, entity_type, entity_id, period_key, current_progress, target)
        VALUES (?, ?, ?, ?, 1, ?)`, [quest.id, event.entity_type, event.entity_id, periodKey, quest.target]);
    } else if (quest.status === 'active') {
      const newProgress = quest.current_progress + 1;
      await db.query(`UPDATE quest_progress SET current_progress = ? WHERE id = ?`, [newProgress, quest.progress_id]);

      // 3. Complétion ?
      if (newProgress >= quest.target) {
        await db.query(`UPDATE quest_progress SET status = 'completed', completed_at = NOW() WHERE id = ?`, [quest.progress_id]);
      }
    }
  }
}
```

#### `rewardWriter.js` — Structure (idempotent)

```javascript
async function awardXP(entityType, entityId, sourceType, sourceId, amount, metadata) {
  // INSERT IGNORE pour idempotence
  const result = await db.query(`
    INSERT IGNORE INTO gamification_xp_events (entity_type, entity_id, xp_amount, source_type, source_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [entityType, entityId, amount, sourceType, sourceId, JSON.stringify(metadata)]);

  if (result.affectedRows > 0) {
    // Mettre à jour le profil
    await db.query(`
      UPDATE gamification_profiles SET lifetime_xp = lifetime_xp + ?, updated_at = NOW() WHERE entity_type = ? AND entity_id = ?
    `, [amount, entityType, entityId]);

    // Vérifier level up
    await checkLevelUp(entityType, entityId);
  }
}

async function awardTrophies(entityType, entityId, sourceType, sourceId, amount, periodKey, metadata) {
  const result = await db.query(`
    INSERT IGNORE INTO trophy_events (entity_type, entity_id, trophy_amount, source_type, source_id, period_key, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [entityType, entityId, amount, sourceType, sourceId, periodKey, JSON.stringify(metadata)]);

  if (result.affectedRows > 0) {
    // Upsert trophy_ledgers pour chaque période type
    for (const periodType of ['weekly', 'monthly', 'yearly', 'alltime']) {
      const key = getPeriodKey(periodType);
      await db.query(`
        INSERT INTO trophy_ledgers (entity_type, entity_id, period_type, period_key, trophies_earned)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE trophies_earned = trophies_earned + ?
      `, [entityType, entityId, periodType, key, amount, amount]);
    }
  }
}
```

---

## 5. Système de score par job

### 5.1 Architecture

Chaque job terminé génère un **scorecard** automatiquement.

```
Job Completed
    ↓
scoreEngine.generateScorecard(job_id)
    ↓
  1. Récupérer les checkpoints applicable au type de job
  2. Évaluer chaque checkpoint (auto-détection ou validation manuelle)
  3. Calculer app_score_total (pondéré par weights)
  4. Si client_review existe → calculer client_score_total
  5. Calculer final_score = pondération client/app
  6. Créer ou mettre à jour job_scorecards
  7. Évaluer les bonus multiplicateurs
  8. Distribuer XP + trophées aux participants
```

### 5.2 Formule de scoring

```
app_quality_score = Σ(checkpoint_score × weight) / Σ(weight) × 100

client_quality_score = moyenne pondérée des ratings client × 20 (pour ramener à /100)

final_quality_score = (0.60 × client_quality_score) + (0.40 × app_quality_score)
```

La pondération 60/40 peut varier par type de job :

| Job Type | Client Weight | App Weight |
|----------|--------------|------------|
| Déménagement résidentiel | 60% | 40% |
| Déménagement commercial | 50% | 50% |
| Livraison simple | 70% | 30% |
| Pack/Unpack | 55% | 45% |

### 5.3 Catégories de checkpoints

| Catégorie | Exemples | Scoring |
|-----------|----------|---------|
| **Timing** | Arrivée à l'heure, fin dans les temps | time_delta : 100 si à l'heure, -5 par tranche de 5min de retard |
| **Photo** | Photos avant/après, photos inventaire | boolean : 100 si fait, 0 sinon |
| **Article state** | Pas de casse, état du mobilier | boolean/rating |
| **Incident** | Aucun incident signalé | boolean inversé : 100 si 0 incidents |
| **Communication** | Client informé, updates envoyées | boolean |
| **Completion** | Toutes les tâches terminées | pourcentage |
| **Safety** | EPI portés, procédures respectées | boolean |
| **Documentation** | Inventaire, signature, contrat | boolean |

### 5.4 Transformation score → récompenses

| Score final | XP attribuée | Trophées attribués |
|-------------|-------------|-------------------|
| 90-100 | 50 XP | 10 trophées |
| 80-89 | 35 XP | 7 trophées |
| 70-79 | 25 XP | 5 trophées |
| 60-69 | 15 XP | 3 trophées |
| < 60 | 10 XP | 1 trophée |

Bonus multiplicateurs :

- Job 5 étoiles client : ×1.5
- Zéro incident : ×1.2
- Complétion 100% checkpoints : ×1.3

---

## 6. Distribution des récompenses

### 6.1 Principe

Un même job produit **plusieurs récompenses parallèles**, pas une seule. Chaque entité est récompensée indépendamment.

### 6.2 Utilisateur (participant)

Récompensé selon :

| Critère | Source |
|---------|--------|
| Actions réelles | Checkpoints validés par ce user |
| Note client individuelle | `client_review_targets` pour ce user |
| Comportement | Absence d'incidents, ponctualité |
| Rôle | Driver vs offsider (multiplicateur éventuel) |

### 6.3 Entreprise exécutrice

Récompensée selon :

| Critère | Source |
|---------|--------|
| Note globale d'exécution | Moyenne des checkpoint_results de l'équipe |
| Cohérence d'équipe | Écart-type faible des scores individuels |
| Temps | Respect de la durée prévue |
| Satisfaction client | Review globale du job |

### 6.4 Entreprise créatrice

Récompensée selon :

| Critère | Source |
|---------|--------|
| Qualité du brief | Checkpoints communication creator-side |
| Précision du pricing | Écart devis/réalité |
| Matching prestataire | Score du prestataire choisi |
| Note client | Review client sur la coordination |

### 6.5 Algorithme de distribution

```javascript
async function distributeRewards(jobId, scorecard) {
  const participants = await getJobParticipants(jobId);
  const job = await getJobDetails(jobId);

  // Base XP/trophies from score tier
  const { baseXP, baseTrophies } = getRewardTier(scorecard.final_score);

  // Bonus multipliers
  let multiplier = 1.0;
  if (scorecard.client_score_total >= 100) multiplier *= 1.5; // 5 étoiles
  if (scorecard.incidents_count === 0) multiplier *= 1.2;
  if (scorecard.checkpoints_completed === scorecard.checkpoints_total) multiplier *= 1.3;

  // 1. Récompenser chaque participant (user)
  for (const participant of participants) {
    const userCheckpoints = await getUserCheckpointScore(jobId, participant.user_id);
    const userClientRating = await getUserClientRating(jobId, participant.user_id);
    const userXP = Math.round(baseXP * multiplier * (userCheckpoints.score / 100));
    const userTrophies = Math.round(baseTrophies * multiplier * (userCheckpoints.score / 100));

    await rewardWriter.awardXP('user', participant.user_id, 'job_score', `job_${jobId}`, userXP, { jobId, role: participant.role });
    await rewardWriter.awardTrophies('user', participant.user_id, 'job_score', `job_${jobId}`, userTrophies, getCurrentWeekKey(), { jobId });
  }

  // 2. Récompenser l'entreprise exécutrice
  const executorXP = Math.round(baseXP * multiplier * 0.8);
  await rewardWriter.awardXP('company', job.executor_company_id, 'job_score', `job_${jobId}`, executorXP, { jobId });
  await rewardWriter.awardTrophies('company', job.executor_company_id, 'job_score', `job_${jobId}`, Math.round(baseTrophies * 0.8), getCurrentWeekKey(), { jobId });

  // 3. Récompenser l'entreprise créatrice (si différente)
  if (job.creator_company_id !== job.executor_company_id) {
    const creatorXP = Math.round(baseXP * multiplier * 0.5);
    await rewardWriter.awardXP('company', job.creator_company_id, 'job_score', `job_${jobId}`, creatorXP, { jobId });
    await rewardWriter.awardTrophies('company', job.creator_company_id, 'job_score', `job_${jobId}`, Math.round(baseTrophies * 0.5), getCurrentWeekKey(), { jobId });
  }

  // 4. Mettre à jour le scorecard
  await db.query(`UPDATE job_scorecards SET xp_distributed = ?, trophies_distributed = ? WHERE job_id = ?`,
    [scorecard.xp_distributed, scorecard.trophies_distributed, jobId]);
}
```

---

## 7. Système de quêtes et achievements

### 7.1 Principes

- Les quêtes sont **déclaratives** (définies en base, pas hardcodées)
- Le `questEngine` évalue les conditions automatiquement à chaque événement
- Les quêtes expirent avec leur période (daily → fin de journée, etc.)
- Le joueur doit **claim** la récompense (bouton "Réclamer")
- Les quêtes `repeatable` se réinitialisent à chaque nouvelle période

### 7.2 Structure d'un achievement

Chaque quête/achievement possède les éléments suivants :

| Champ | Rôle | Exemple |
|-------|------|---------|
| **title** | Nom de la quête | "Premier job" |
| **description** | But — ce qu'il faut réaliser | "Compléter ton premier job" |
| **category** | Catégorie de la quête | `intro` / `daily` / `weekly` / `monthly` / `event` |
| **xp_reward** | XP accordés à la complétion | `50` |
| **trophy_count** | Trophées accordés (souvent 0) | `0` |
| **end_date** | Date limite, `NULL` = illimité | `2026-07-31` ou `NULL` |
| **event_id** | Événement associé si catégorie `event` | FK → `gamification_quest_events` |
| **conditions** | Condition JSON de progression | `{"event":"job_completed","count":3}` |

### 7.3 Catégories de quêtes

| Catégorie | Période | Reset | Repeatable | End date |
|-----------|---------|-------|------------|----------|
| `intro` | Permanente | Jamais | Non (one-time) | `NULL` (illimité) |
| `daily` | 1 jour | Chaque jour à 00:00 | Oui | `NULL` |
| `weekly` | Semaine ISO | Chaque lundi | Oui | `NULL` |
| `monthly` | Mois calendaire | Le 1er du mois | Oui | `NULL` |
| `event` | Définie par l'événement | À la fin de l'événement | Non | Date de fin de l'événement |

**Intro** : Quêtes de découverte / onboarding. Affichées en premier dans l'écran, à faire une seule fois, récompense à vie.  
**Daily/Weekly/Monthly** : Quêtes récurrentes qui se régénèrent chaque période.  
**Event** : Quêtes temporaires liées à une période événementielle (ex: Summer Challenge 2026), avec un multiplicateur XP défini dans `gamification_quest_events`.

### 7.4 Quêtes événementielles (Event)

Les événements permettent de créer des catégories de quêtes spéciales sur une période donnée, avec des bonus XP :

```
[gamification_quest_events]
  id=1, code='summer_2026'
  name='Summer Challenge 2026'
  icon='☀️', color='#FF8C00'
  xp_bonus_multiplier=1.50        ← +50% XP sur toutes les quêtes de cet événement
  start_date='2026-07-01'
  end_date='2026-07-31'

[quests]
  category='event'
  event_id=1
  title='Roi de l'été', xp_reward=200
  → XP réellement attribué : 200 × 1.50 = 300 XP
```

L'affichage dans l'écran Quêtes regroupera les quêtes événementielles sous une **bannière colorée** avec le nom de l'événement, la date de fin, et le badge du bonus XP.

### 7.5 Cycle de vie d'une quête

```
[active]  → progression via événements
    ↓ (progress >= target)
[completed] → bouton "Réclamer" disponible
    ↓ (user clique claim)
[claimed] → XP attribués (× multiplicateur si event)
    ↓ (si repeatable + nouvelle période)
[active] → nouvelle instance (period_key différent)
```

```
[active] → fin de période sans complétion
    ↓
[expired] → pas de récompense
```

### 7.6 Format des conditions JSON

**Simple** (un seul événement) :

```json
{ "event": "job_completed", "count": 3 }
```

**Multi-conditions** (toutes requises) :

```json
{
  "events": [
    { "event": "job_completed", "count": 3 },
    { "event": "photo_added", "count": 10 }
  ],
  "mode": "all"
}
```

**Avec filtre** :

```json
{
  "event": "job_completed",
  "count": 5,
  "filter": { "job_type": "residential_move" }
}
```

---

## 8. Système de review client

### 8.1 Chaîne complète

```
Job complété
    ↓ (délai configurable, ex: 2h après fin)
Email/SMS automatique au client
    ↓
Client clique le lien signé
    ↓
Formulaire de review (page web publique)
    ├── Note globale (1-5 étoiles obligatoire)
    ├── Note temps (1-5 optionnel)
    ├── Note service (1-5 optionnel)
    ├── Note communication (1-5 optionnel)
    ├── Note prix (1-5 optionnel)
    ├── Note individuelle par déménageur (1-5)
    ├── Commentaire libre
    └── Consentement publication externe
    ↓
Soumission → API POST /jobs/:id/client-review
    ↓
[Event Bus] émet "client_review.submitted"
    ↓
Moteur de règles → XP + trophées + scorecard update
```

### 8.2 Sécurité du lien

- Token UUID signé avec HMAC-SHA256
- Expiration configurable (default 7 jours)
- Usage unique (marqué à la soumission)
- Rate-limit par IP

### 8.3 Transformation review → récompenses

| Composant | Formule |
|-----------|---------|
| Note globale client | `overall_rating × 20 = score /100` |
| Bonus 5 étoiles | +25 XP, +5 trophées à l'exécuteur et aux participants |
| Note 1-2 étoiles | Aucun malus XP (XP ne descend jamais), mais trophées réduits |
| Publication externe | +15 XP bonus pour l'entreprise |

---

## 9. Système de saisons et trophées

### 9.1 Les deux saisons annuelles

Les trophées sont liés au concept de **saison** : chaque saison dure 6 mois et se termine par un reset.

| Saison | Période | Reset |
|--------|---------|-------|
| **Saison Hiver** | 1er janvier → 30 juin | Nuit du 30 juin → 1er juillet |
| **Saison Été** | 1er juillet → 31 décembre | Nuit du 31 décembre → 1er janvier |

À la fin d'une saison :

- Le compteur de trophées de chaque utilisateur/entreprise **est archivé** dans `trophy_season_archives`
- Le compteur **repart à zéro**
- Un **récapitulatif de saison** est envoyé en push notification (classement final, récompenses de saison)

### 9.2 Sources de trophées

Les trophées proviennent **uniquement des actions liées aux jobs** :

| Action | Trophées |
|--------|----------|
| Complétion job (score 90-100) | 10 trophées |
| Complétion job (score 80-89) | 7 trophées |
| Complétion job (score 70-79) | 5 trophées |
| Complétion job (score 60-69) | 3 trophées |
| Complétion job (score < 60) | 1 trophée |
| Avis client 5 étoiles | +5 trophées bonus |
| Zéro incident sur le job | +2 trophées bonus |
| 100% checkpoints validés | +3 trophées bonus |

**Les quêtes ne donnent pas de trophées.** Le champ `trophy_count` sur les quêtes existe pour des cas exceptionnels mais sera à `0` par défaut.

### 9.3 Tables de saison

```sql
-- Archive des saisons passées (snapshot au moment du reset)
CREATE TABLE trophy_season_archives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user','company') NOT NULL,
  entity_id INT NOT NULL,
  season_code VARCHAR(20) NOT NULL COMMENT 'ex: hiver_2026, ete_2026',
  season_name VARCHAR(50) NOT NULL COMMENT 'ex: Saison Hiver 2026',
  trophies_earned INT NOT NULL DEFAULT 0,
  rank_position INT DEFAULT NULL COMMENT 'Position dans le classement final',
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entity_season (entity_type, entity_id, season_code),
  INDEX idx_season (season_code),
  INDEX idx_trophies (trophies_earned DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 9.4 Récompenses de fin de saison (à venir)

À la fin d'une saison, des récompenses cosmétiques sont attribuées selon le classement :

- Top 1% → Badge légendaire de saison + titre
- Top 5% → Badge épique de saison
- Top 20% → Badge rare de saison

Ces récompenses sont permanentes et affichables sur le profil.

---

## 10. API endpoints

### 10.1 Profil gamification

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/v1/gamification/profile` | Profil complet de l'utilisateur connecté |
| GET | `/v1/gamification/profile/:entityType/:entityId` | Profil d'une entité (user/company) |
| GET | `/v1/gamification/xp-history` | Historique XP paginé |
| GET | `/v1/gamification/trophy-history` | Historique trophées paginé |

### 10.2 Badges

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/v1/gamification/badges` | Catalogue complet avec statut unlocked/locked |
| GET | `/v1/gamification/badges/:entityType/:entityId` | Badges d'une entité |

### 9.3 Quêtes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/v1/gamification/quests` | Quêtes disponibles avec progression |
| POST | `/v1/gamification/quests/:questId/claim` | Réclamer la récompense d'une quête complétée |

### 9.4 Leaderboard

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/v1/gamification/leaderboard?period=weekly&type=user` | Classement par trophées |
| GET | `/v1/gamification/leaderboard?period=monthly&type=company` | Classement entreprises |
| GET | `/v1/gamification/leagues` | Configuration des leagues |

### 9.5 Scorecards

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/v1/jobs/:jobId/scorecard` | Scorecard d'un job |
| GET | `/v1/gamification/scorecard-history` | Historique des scorecards paginé |

### 9.6 Reviews

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/v1/jobs/:jobId/review-request` | Envoyer une demande de review au client |
| GET | `/v1/reviews/:token` | Charger le formulaire de review (public) |
| POST | `/v1/reviews/:token` | Soumettre la review (public) |
| GET | `/v1/gamification/reviews` | Reviews reçues par l'entité connectée |

### 9.7 Checkpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/v1/jobs/:jobId/checkpoints` | Checkpoints applicables au job avec résultats |
| POST | `/v1/jobs/:jobId/checkpoints/:code/complete` | Marquer un checkpoint comme complété |
| GET | `/v1/gamification/checkpoint-definitions` | Catalogue des checkpoints par type de job |

---

## 11. Frontend — Écrans et composants

### 11.1 Écrans

| Écran | Statut | Description |
|-------|--------|-------------|
| `GamificationV2Screen` | ✅ Existant | Profil gamifié (XP, level, stats, historique). Point d'entrée depuis ProfileHeader |
| `QuestsScreen` | 🔄 À enrichir | Quêtes par catégories : **Intro → Daily → Weekly → Monthly → Events** |
| `BadgesScreen` | 🔄 À refaire | Catalogue de badges locked/unlocked par catégorie |
| `JobScorecardScreen` | 📋 À créer | Détail scorecard d'un job |
| `ReviewFormScreen` | 📋 À créer | Formulaire review client |
| ~~LeaderboardScreen~~ | ❌ **Hors scope** | Classement retiré du scope actuel |

### 11.2 Écran QuestsScreen — Structure par catégories

L'écran quêtes affiche les achievements groupés par catégorie dans cet ordre :

```
┌─────────────────────────────────────────┐
│  ⚔️  Quêtes                ← header     │
├─────────────────────────────────────────┤
│  🚀 INTRO                               │
│    [QuestCard] Premier job              │
│    [QuestCard] Profil complété          │
│    [QuestCard] 5 jobs complétés         │
├─────────────────────────────────────────┤
│  📅 QUOTIDIENNES                        │
│    [QuestCard] Journée active           │
│    [QuestCard] Photographe du jour      │
├─────────────────────────────────────────┤
│  📆 HEBDOMADAIRES                       │
│    [QuestCard] Semaine productive       │
├─────────────────────────────────────────┤
│  🗓️ MENSUELLES                          │
│    [QuestCard] Marathon mensuel         │
├─────────────────────────────────────────┤
│  ☀️ SUMMER CHALLENGE 2026        🎪     │
│    [bannière colorée avec date fin]     │
│    [⚡ +50% XP  ·  Finit le 31 juil.]  │
│    [QuestCard] Roi de l'été             │
└─────────────────────────────────────────┘
```

Les **sections événementielles** ont un traitement visuel spécial :

- Fond coloré selon `gamification_quest_events.color`
- Badge "⚡ +50% XP" affiché sur chaque carte de la section
- Compte à rebours jusqu'à la date de fin

### 11.3 Composants

| Composant | Description |
|-----------|-------------|
| `XPProgressBar` | Barre de progression XP vers le prochain level |
| `LevelBadge` | Affichage du level + title (ex: "Level 8 — Expert") |
| `TrophySeasonCard` | Compteur de trophées saison en cours + nom de la saison |
| `QuestCard` | Carte quête : nom, but, progression, récompense XP, bouton claim |
| `EventQuestBanner` | Bannière colorée pour les quêtes événementielles |
| `BadgeGrid` | Grille de badges locked/unlocked par catégorie |
| `ScorecardSummary` | Résumé compact du scorecard (dans le job detail) |
| `CheckpointList` | Liste de checkpoints avec statut ✅/❌ |
| `ReviewStars` | Composant de notation étoiles (réutilisable) |
| `StreakIndicator` | Indicateur de streak en jours |

### 11.4 Hooks

| Hook | Description |
|------|-------------|
| `useGamificationV2` | Profil + historique XP (existant) |
| `useQuests` | Quêtes avec progression, groupées par catégorie |
| `useBadges` | Badges avec statut |
| `useScorecard` | Scorecard d'un job |
| `useCheckpoints` | Checkpoints d'un job |
| `useReviews` | Reviews reçues |
| `useTrophySeason` | Trophées saison en cours + infos saison |

---

## 12. Protections anti-abus

### 12.1 Idempotence

- Clé d'idempotence `(entity_type, entity_id, source_type, source_id)` sur `gamification_xp_events` et `trophy_events`
- Un même job ne peut pas distribuer de l'XP deux fois à la même entité

### 12.2 Rate limits

- Maximum 500 XP/jour par job pour un user
- Maximum 100 trophées/jour par user
- Maximum 3 reviews par IP par heure
- Claim quest : 1 par quête/période

### 12.3 Validation des checkpoints

- Checkpoints timing : vérifiés automatiquement par le système (comparaison timestamps)
- Checkpoints photo : vérifiés par présence de photos dans le job
- Checkpoints incidents : vérifiés automatiquement par absence d'incidents
- Checkpoints signature : vérifiés par présence de signature

### 11.4 Alertes

- Détection de patterns anormaux (ex: 100% de checkpoints validés sur tous les jobs)
- Alerte admin si un user clique "complete" sur tous les checkpoints en < 5 secondes
- Review token à usage unique + expiration

---

## 12. Gestion des périodes et fuseaux

### 12.1 Timezone

- La timezone de référence est celle de la **company** de l'utilisateur
- Le reset daily se fait à 00:00 dans la timezone company
- Le reset weekly se fait le lundi 00:00 timezone company
- Le reset monthly se fait le 1er du mois 00:00 timezone company

### 12.2 Period keys

| Type | Format | Exemple |
|------|--------|---------|
| daily | `daily_YYYY-MM-DD` | `daily_2026-04-03` |
| weekly | `weekly_YYYY-WNN` | `weekly_2026-W14` |
| monthly | `monthly_YYYY-MM` | `monthly_2026-04` |
| yearly | `yearly_YYYY` | `yearly_2026` |
| alltime | `alltime` | `alltime` |

### 12.3 Cron jobs nécessaires

| Cron | Fréquence | Action |
|------|-----------|--------|
| `expireQuests` | Toutes les heures | Passer les quêtes non complétées en `expired` si période dépassée |
| `snapshotLeaderboard` | Dimanche 23:59 UTC | Snapshot du classement weekly dans `leaderboard_snapshots` |
| `resetTrophyLedgers` | Lundi 00:00 UTC | Rien à reset (les nouveaux periods ont des trophies=0 automatiquement) |

---

## 13. Récompenses de level

### 13.1 Principe

Chaque level peut débloquer une ou plusieurs récompenses **cosmétiques ou de confort** :

- **Avatar frames** : cadres décoratifs autour de l'avatar
- **Titles** : titres affichables sous le nom
- **Themes** : thèmes de couleur pour l'app
- **Badge slots** : emplacements supplémentaires pour badges sur le profil
- **Confetti** : effets visuels lors de moments clés

### 13.2 Vérification automatique

À chaque gain d'XP, le `rewardWriter` vérifie :

```javascript
async function checkLevelUp(entityType, entityId) {
  const profile = await getProfile(entityType, entityId);
  const newLevel = await db.query(
    'SELECT MAX(level) as level FROM gamification_levels WHERE xp_required <= ?',
    [profile.lifetime_xp]
  );

  if (newLevel.level > profile.current_level) {
    await db.query('UPDATE gamification_profiles SET current_level = ? WHERE id = ?',
      [newLevel.level, profile.id]);

    // Débloquer les récompenses de tous les levels manqués
    const rewards = await db.query(
      'SELECT * FROM level_rewards WHERE level > ? AND level <= ?',
      [profile.current_level, newLevel.level]
    );

    for (const reward of rewards) {
      await db.query(
        'INSERT IGNORE INTO unlocked_rewards (entity_type, entity_id, reward_id) VALUES (?, ?, ?)',
        [entityType, entityId, reward.id]
      );
    }

    // Notification level up
    return { leveledUp: true, oldLevel: profile.current_level, newLevel: newLevel.level, rewards };
  }
  return { leveledUp: false };
}
```

---

## 14. Migration depuis le système actuel

### 14.1 Fichiers à refactorer

| Fichier actuel | Action |
|----------------|--------|
| `src/services/gamification.ts` | Remplacer par nouveaux services (GamificationProfileService, QuestService, etc.) |
| `src/hooks/useGamification.ts` | Remplacer par hooks spécialisés (useGamificationProfile, useQuests, etc.) |
| `src/hooks/useGamificationFixed.ts` | Supprimer |
| `src/screens/leaderboard.tsx` | Refactorer pour supporter multi-périodes et trophées |
| `src/screens/badges.tsx` | Refactorer avec nouveau catalogue et unlock conditions |
| `RANK_CONFIG` dans gamification.ts | Remplacer par `gamification_levels` (progression) + `league_tiers` (compétition) |

### 14.2 Migration données

```sql
-- 1. Créer les profils gamification depuis les données existantes
INSERT INTO gamification_profiles (entity_type, entity_id, lifetime_xp, current_level)
SELECT 'user', u.id,
  COALESCE((SELECT SUM(xp_amount) FROM gamification_xp_events WHERE entity_type='user' AND entity_id=u.id), 0),
  1
FROM users u
ON DUPLICATE KEY UPDATE entity_type = entity_type;

-- 2. Recalculer les levels
UPDATE gamification_profiles gp
SET current_level = (
  SELECT MAX(level) FROM gamification_levels WHERE xp_required <= gp.lifetime_xp
);

-- 3. Données existantes XP → migrer vers gamification_xp_events
-- (Script spécifique selon la structure actuelle des données XP)
```

### 14.3 Feature flags

Pour un déploiement progressif :

```javascript
const GAMIFICATION_V2_FLAGS = {
  ENABLE_QUESTS: false,        // Phase 1
  ENABLE_CHECKPOINTS: false,   // Phase 1
  ENABLE_SCORECARDS: false,    // Phase 1
  ENABLE_CLIENT_REVIEWS: false, // Phase 2
  ENABLE_TROPHIES: false,      // Phase 3
  ENABLE_LEAGUES: false,       // Phase 3
  ENABLE_LEVEL_REWARDS: false, // Phase 4
};
```

---

## 15. Roadmap d'implémentation par phases

### Phase 1 — Fondation (XP + Badges + Checkpoints + Scorecard basique)

**Backend** :

- Migration SQL : `gamification_profiles`, `gamification_xp_events`, `gamification_levels`, `gamification_badges`, `gamification_badge_unlocks`, `job_scorecards`, `job_checkpoints`, `job_checkpoint_results`
- Services : `eventBus.js`, `ruleEngine.js`, `rewardWriter.js`, `scoreEngine.js`, `badgeChecker.js`, `streakTracker.js`
- Endpoints : profil, XP history, badges, scorecard, checkpoints

**Frontend** :

- `useGamificationProfile`, `useBadges`, `useScorecard`, `useCheckpoints`
- `GamificationProfileScreen`, `BadgesScreen` (refonte), `JobScorecardScreen`
- `XPProgressBar`, `LevelBadge`, `ScorecardSummary`, `CheckpointList`, `BadgeGrid`
- `GamificationMiniCard` sur la home

### Phase 2 — Quêtes + Reviews client

**Backend** :

- Migration SQL : `quests`, `quest_progress`, `client_reviews`, `client_review_targets`
- Services : `questEngine.js`
- Endpoints : quêtes, claim, review-request, review submission

**Frontend** :

- `useQuests`, `useReviews`
- `QuestsScreen`, `ReviewFormScreen`
- `QuestCard`, `ReviewStars`
- Intégration review dans scorecard

### Phase 3 — Trophées + Compétition

**Backend** :

- Migration SQL : `trophy_ledgers`, `trophy_events`, `leaderboard_snapshots`, `league_tiers`
- Trophées dans `rewardWriter`
- Leaderboard multi-périodes
- Cron jobs (snapshot, expire)

**Frontend** :

- `useTrophies`, `useLeaderboard` (refonte)
- `LeaderboardScreen` (refonte multi-périodes)
- `LeagueBadge`, `TrophyCounter`

### Phase 4 — Récompenses + Polish

**Backend** :

- Migration SQL : `level_rewards`, `unlocked_rewards`
- Level-up rewards dans `rewardWriter`
- Notifications push

**Frontend** :

- Animations level-up
- `StreakIndicator`
- Profil gamifié enrichi (rewards, streak, stats)

### Phase 5 — Engagement avancé

- Saisons compétitives (reset trimestriel, rewards de fin de saison)
- Quêtes événementielles (seasonal, holidays)
- Company vs Company challenges
- Review externe integration (Google, Facebook)
- Analytics dashboard gamification (admin)

---

## 3. Schéma base de données

### 3.1 Bloc Progression

#### `gamification_profiles`

Profil gamification par entité (user OU company).

```sql
CREATE TABLE gamification_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  lifetime_xp INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 1,
  total_badges INT NOT NULL DEFAULT 0,
  current_league_code VARCHAR(50) DEFAULT NULL,
  display_badges JSON DEFAULT NULL,  -- badges choisis pour affichage profil
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_entity (entity_type, entity_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_level (current_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `gamification_xp_events`

Historique brut de chaque gain d'XP. Table append-only.

```sql
CREATE TABLE gamification_xp_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  source_type ENUM(
    'quest', 'badge', 'job_score', 'client_review',
    'checkpoint', 'manual', 'onboarding', 'streak',
    'referral', 'training'
  ) NOT NULL,
  source_id VARCHAR(100) DEFAULT NULL,       -- ex: job_id, quest_id, badge_code
  xp_amount INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON DEFAULT NULL,                -- contexte libre (job_type, action, etc.)

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_source (source_type, source_id),
  INDEX idx_created (created_at),
  -- Anti-doublon : un même source ne peut pas donner 2 fois XP à la même entité
  UNIQUE KEY uq_idempotent (entity_type, entity_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `gamification_levels`

Table de configuration des niveaux et seuils XP.

```sql
CREATE TABLE gamification_levels (
  level INT PRIMARY KEY,
  xp_required INT NOT NULL,
  title VARCHAR(100) NOT NULL,             -- "Newcomer", "Apprentice", "Expert", ...
  reward_type ENUM('cosmetic', 'comfort', 'none') DEFAULT 'none',
  reward_payload JSON DEFAULT NULL,        -- { "type": "avatar_frame", "code": "gold_frame" }

  INDEX idx_xp (xp_required)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data
INSERT INTO gamification_levels (level, xp_required, title, reward_type, reward_payload) VALUES
(1,  0,       'Newcomer',     'none',     NULL),
(2,  100,     'Starter',      'cosmetic', '{"type":"avatar_frame","code":"starter_frame"}'),
(3,  300,     'Apprentice',   'none',     NULL),
(4,  600,     'Mover',        'cosmetic', '{"type":"title","code":"mover"}'),
(5,  1000,    'Professional', 'none',     NULL),
(6,  1500,    'Experienced',  'cosmetic', '{"type":"badge_slot","extra_slots":1}'),
(7,  2200,    'Veteran',      'none',     NULL),
(8,  3000,    'Expert',       'cosmetic', '{"type":"avatar_frame","code":"expert_frame"}'),
(9,  4000,    'Master',       'none',     NULL),
(10, 5200,    'Elite',        'cosmetic', '{"type":"title","code":"elite"}'),
(11, 6500,    'Champion',     'none',     NULL),
(12, 8000,    'Hero',         'cosmetic', '{"type":"avatar_frame","code":"hero_frame"}'),
(13, 10000,   'Legend',       'cosmetic', '{"type":"theme","code":"legend_theme"}'),
(14, 12500,   'Mythic',       'none',     NULL),
(15, 15000,   'Transcendent', 'cosmetic', '{"type":"confetti","code":"transcendent_confetti"}');
```

#### `gamification_badges`

Catalogue de tous les badges possibles.

```sql
CREATE TABLE gamification_badges (
  badge_code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('driver', 'offsider', 'business', 'rating', 'streak', 'special', 'onboarding', 'quality') NOT NULL,
  entity_scope ENUM('user', 'company', 'both') NOT NULL DEFAULT 'user',
  unlock_rule_type ENUM(
    'job_count', 'streak_days', 'rating_avg', 'no_incident_streak',
    'photo_count', 'review_count', 'xp_threshold', 'manual',
    'onboarding_complete', 'first_action', 'checkpoint_rate'
  ) NOT NULL,
  unlock_rule_payload JSON NOT NULL,       -- { "threshold": 50 } ou { "min_rating": 4.8, "min_jobs": 20 }
  xp_bonus INT DEFAULT 0,                 -- XP gagné à l'obtention
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
  visibility ENUM('visible', 'hidden', 'secret') NOT NULL DEFAULT 'visible',
  icon VARCHAR(50) DEFAULT NULL,           -- nom icône ou emoji
  sort_order INT DEFAULT 0,

  INDEX idx_category (category),
  INDEX idx_scope (entity_scope),
  INDEX idx_rarity (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed exemples
INSERT INTO gamification_badges (badge_code, name, description, category, entity_scope, unlock_rule_type, unlock_rule_payload, xp_bonus, rarity) VALUES
('FIRST_JOB',        'First Move',        'Complete your first job',                      'driver',     'user',    'job_count',           '{"threshold":1}',                  50,  'common'),
('SPEED_DEMON',      'Speed Demon',       'Complete 50 jobs ahead of schedule',           'driver',     'user',    'job_count',           '{"threshold":50,"condition":"early"}', 200, 'rare'),
('PERFECTIONIST',    'Perfectionist',     'Maintain 4.8+ rating for 20 consecutive jobs', 'rating',     'user',    'rating_avg',          '{"min_rating":4.8,"min_jobs":20}',  300, 'epic'),
('STREAK_7',         '7-Day Streak',      'Work 7 consecutive days',                      'streak',     'user',    'streak_days',         '{"threshold":7}',                   100, 'common'),
('STREAK_30',        'Monthly Machine',   'Work 30 consecutive days',                     'streak',     'user',    'streak_days',         '{"threshold":30}',                  250, 'uncommon'),
('STREAK_100',       'Iron Will',         '100 consecutive days of work',                 'streak',     'user',    'streak_days',         '{"threshold":100}',                 500, 'legendary'),
('ZERO_INCIDENTS',   'Safe Hands',        '20 jobs with zero incidents',                  'quality',    'both',    'no_incident_streak',  '{"threshold":20}',                  200, 'rare'),
('PHOTO_PRO',        'Photo Pro',         'Add 500 photos across all jobs',               'quality',    'user',    'photo_count',         '{"threshold":500}',                 150, 'uncommon'),
('FIVE_STAR_50',     'Five Star Legend',  'Receive 50 five-star client reviews',          'rating',     'both',    'review_count',        '{"threshold":50,"min_rating":5}',   400, 'epic'),
('ONBOARDING_DONE',  'Ready to Roll',     'Complete all onboarding steps',                'onboarding', 'user',    'onboarding_complete', '{}',                                75,  'common'),
('TOP_COMPANY',      'Top Company',       'Reach #1 on the weekly leaderboard',           'business',   'company', 'manual',              '{}',                                500, 'legendary');
```

#### `gamification_badge_unlocks`

Badges effectivement débloqués.

```sql
CREATE TABLE gamification_badge_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  badge_code VARCHAR(50) NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_id VARCHAR(100) DEFAULT NULL,     -- job_id, quest_id qui a déclenché

  UNIQUE KEY uq_unlock (entity_type, entity_id, badge_code),
  FOREIGN KEY (badge_code) REFERENCES gamification_badges(badge_code),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.2 Bloc Quêtes

#### `quests`

Catalogue des quêtes déclaratives.

```sql
CREATE TABLE quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  type ENUM('daily', 'weekly', 'monthly', 'general', 'onboarding') NOT NULL,
  entity_scope ENUM('user', 'company') NOT NULL DEFAULT 'user',
  active_from DATE DEFAULT NULL,
  active_to DATE DEFAULT NULL,
  repeatable BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward INT NOT NULL DEFAULT 0,
  trophy_reward INT NOT NULL DEFAULT 0,
  conditions JSON NOT NULL,
  /*
    Exemples de conditions JSON :
    { "event": "job_completed", "count": 3 }
    { "event": "photo_added", "count": 10, "period": "daily" }
    { "event": "five_star_review", "count": 1 }
    { "event": "checkpoint_completed", "checkpoint_code": "on_time_arrival", "count": 5 }
    { "events": [
        { "event": "job_completed", "count": 2 },
        { "event": "no_incident", "count": 2 }
      ],
      "mode": "all"
    }
  */
  priority INT DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  icon VARCHAR(50) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_type (type),
  INDEX idx_active (active_from, active_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed exemples
INSERT INTO quests (code, title, description, type, entity_scope, xp_reward, trophy_reward, conditions) VALUES
('DAILY_COMPLETE_1',    'Daily Mover',          'Complete 1 job today',              'daily',   'user',    25,  5,   '{"event":"job_completed","count":1}'),
('DAILY_PHOTO_5',       'Snap Happy',           'Take 5 photos today',              'daily',   'user',    15,  3,   '{"event":"photo_added","count":5}'),
('DAILY_NO_INCIDENT',   'Clean Day',            'Finish all jobs without incidents', 'daily',   'user',    20,  5,   '{"event":"no_incident_day","count":1}'),
('WEEKLY_COMPLETE_5',   'Weekly Warrior',        'Complete 5 jobs this week',         'weekly',  'user',    100, 20,  '{"event":"job_completed","count":5}'),
('WEEKLY_5_STAR',       'Star Collector',        'Get 3 five-star reviews this week', 'weekly',  'user',    75,  15,  '{"event":"five_star_review","count":3}'),
('MONTHLY_COMPLETE_20', 'Monthly Marathon',      'Complete 20 jobs this month',       'monthly', 'user',    300, 50,  '{"event":"job_completed","count":20}'),
('MONTHLY_STREAK_14',   'Two-Week Streak',       '14 consecutive working days',       'monthly', 'user',    200, 30,  '{"event":"streak_reached","count":14}'),
('ONBOARD_PROFILE',     'Get Started',           'Complete your profile',             'general', 'user',    50,  0,   '{"event":"onboarding_complete","count":1}'),
('COMPANY_WEEKLY_10',   'Company Hustle',        'Company completes 10 jobs/week',    'weekly',  'company', 150, 30,  '{"event":"job_completed","count":10}');
```

#### `quest_progress`

Suivi de la progression de chaque entité sur chaque quête.

```sql
CREATE TABLE quest_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quest_id INT NOT NULL,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  period_key VARCHAR(20) DEFAULT NULL,     -- "2026-04-03" (daily), "2026-W14" (weekly), "2026-04" (monthly), NULL (general)
  progress_value INT NOT NULL DEFAULT 0,
  target_value INT NOT NULL,               -- dénormalisé depuis quest.conditions.count
  completed_at DATETIME DEFAULT NULL,
  claimed_at DATETIME DEFAULT NULL,
  status ENUM('active', 'completed', 'claimed', 'expired') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (quest_id) REFERENCES quests(id),
  UNIQUE KEY uq_progress (quest_id, entity_type, entity_id, period_key),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.3 Bloc Qualité / Notation

#### `job_scorecards`

Une fiche score générée par job après complétion.

```sql
CREATE TABLE job_scorecards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  job_type VARCHAR(50) DEFAULT NULL,       -- template type
  expected_duration_minutes INT DEFAULT NULL,
  actual_duration_minutes INT DEFAULT NULL,
  app_score_total DECIMAL(5,2) DEFAULT NULL,       -- score /100 basé checkpoints
  client_score_total DECIMAL(5,2) DEFAULT NULL,    -- score /100 basé review client
  final_quality_score DECIMAL(5,2) DEFAULT NULL,   -- pondéré : 60% client + 40% app
  incident_count INT NOT NULL DEFAULT 0,
  photo_count INT NOT NULL DEFAULT 0,
  checkpoint_completion_rate DECIMAL(5,2) DEFAULT NULL,  -- % de checkpoints complétés
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_job (job_id),
  INDEX idx_quality (final_quality_score),
  INDEX idx_generated (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `job_checkpoints`

Définition des points de contrôle possibles par type de job.

```sql
CREATE TABLE job_checkpoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,           -- type de template/segment
  code VARCHAR(50) NOT NULL,               -- ex: "on_time_arrival", "photo_before", "damage_check"
  label VARCHAR(200) NOT NULL,
  category ENUM(
    'timing', 'photo', 'article_state', 'incident',
    'communication', 'completion', 'safety', 'documentation'
  ) NOT NULL,
  scoring_method ENUM(
    'boolean',          -- oui/non → 0 ou max score
    'numeric',          -- valeur numérique
    'time_delta',       -- écart temps prévu/réel
    'rating'            -- note 1-5
  ) NOT NULL DEFAULT 'boolean',
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,   -- poids dans le score final
  required BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward INT NOT NULL DEFAULT 0,            -- XP gagnée si check réussi
  trophy_reward INT NOT NULL DEFAULT 0,

  UNIQUE KEY uq_type_code (job_type, code),
  INDEX idx_job_type (job_type),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed : checkpoints universels (s'appliquent à tous les types de job)
INSERT INTO job_checkpoints (job_type, code, label, category, scoring_method, weight, required, xp_reward, trophy_reward) VALUES
('*', 'on_time_arrival',      'Arrived on time',                     'timing',        'time_delta', 1.50, TRUE,  10, 2),
('*', 'on_time_completion',   'Completed within estimated time',     'timing',        'time_delta', 1.50, FALSE, 10, 2),
('*', 'photo_before',         'Photos taken before job',             'photo',         'boolean',    1.00, FALSE, 5,  1),
('*', 'photo_after',          'Photos taken after job',              'photo',         'boolean',    1.00, FALSE, 5,  1),
('*', 'no_damage_reported',   'No damage incidents',                 'article_state', 'boolean',    2.00, FALSE, 15, 3),
('*', 'client_signature',     'Client signature collected',          'documentation', 'boolean',    1.00, TRUE,  5,  1),
('*', 'inventory_complete',   'Inventory list completed',            'documentation', 'boolean',    0.80, FALSE, 5,  1),
('*', 'safety_ppe_worn',      'PPE worn throughout job',             'safety',        'boolean',    0.50, FALSE, 3,  0),
('*', 'communication_update', 'Client updated during job',           'communication', 'boolean',    0.70, FALSE, 5,  1);
```

#### `job_checkpoint_results`

Résultat concret d'un checkpoint sur un job donné + qui l'a validé.

```sql
CREATE TABLE job_checkpoint_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  checkpoint_id INT NOT NULL,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  value VARCHAR(100) DEFAULT NULL,         -- ex: "true", "4.5", "+12" (minutes de retard)
  normalized_score DECIMAL(5,2) DEFAULT NULL,  -- score normalisé 0-100
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewer_type ENUM('system', 'manager', 'client') NOT NULL DEFAULT 'system',
  metadata JSON DEFAULT NULL,

  FOREIGN KEY (checkpoint_id) REFERENCES job_checkpoints(id),
  INDEX idx_job (job_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_checkpoint (checkpoint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `client_reviews`

Review globale du client sur le job.

```sql
CREATE TABLE client_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  client_email VARCHAR(255) DEFAULT NULL,
  client_name VARCHAR(200) DEFAULT NULL,
  overall_rating TINYINT NOT NULL,                 -- 1-5
  comment TEXT DEFAULT NULL,
  time_rating TINYINT DEFAULT NULL,                -- 1-5
  politeness_rating TINYINT DEFAULT NULL,           -- 1-5
  communication_rating TINYINT DEFAULT NULL,        -- 1-5
  pricing_rating TINYINT DEFAULT NULL,              -- 1-5
  care_rating TINYINT DEFAULT NULL,                 -- 1-5 (soin des biens)
  external_review_consent BOOLEAN DEFAULT FALSE,
  external_review_platform VARCHAR(50) DEFAULT NULL,  -- "google", "trustpilot"
  review_token VARCHAR(100) NOT NULL,              -- token signé pour sécuriser le lien
  token_expires_at DATETIME NOT NULL,              -- expiration du lien
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_job_review (job_id),               -- un seul review par job
  INDEX idx_submitted (submitted_at),
  INDEX idx_token (review_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `client_review_targets`

Notes individuelles par participant et par entreprise.

```sql
CREATE TABLE client_review_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  target_entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  target_entity_id INT NOT NULL,
  rating TINYINT NOT NULL,                         -- 1-5
  comment_optional TEXT DEFAULT NULL,
  xp_awarded INT DEFAULT 0,
  trophies_awarded INT DEFAULT 0,

  FOREIGN KEY (review_id) REFERENCES client_reviews(id) ON DELETE CASCADE,
  INDEX idx_target (target_entity_type, target_entity_id),
  INDEX idx_review (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.4 Bloc Compétition / Saisons

#### `trophy_ledgers`

Compteur de trophées par entité et par période.

```sql
CREATE TABLE trophy_ledgers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  period_type ENUM('week', 'month', 'year', 'all_time') NOT NULL,
  period_key VARCHAR(20) NOT NULL,         -- "2026-W14", "2026-04", "2026", "all"
  trophies_earned INT NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_ledger (entity_type, entity_id, period_type, period_key),
  INDEX idx_period (period_type, period_key),
  INDEX idx_trophies (trophies_earned DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `trophy_events`

Historique brut de chaque gain de trophées (mirror de xp_events pour trophées).

```sql
CREATE TABLE trophy_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  source_type ENUM('quest', 'job_score', 'client_review', 'checkpoint', 'manual') NOT NULL,
  source_id VARCHAR(100) DEFAULT NULL,
  trophy_amount INT NOT NULL,
  period_key VARCHAR(20) NOT NULL,         -- période à laquelle les trophées sont comptabilisés
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON DEFAULT NULL,

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_period (period_key),
  UNIQUE KEY uq_idempotent (entity_type, entity_id, source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `leaderboard_snapshots`

Snapshots figés pour historique (optionnel mais recommandé).

```sql
CREATE TABLE leaderboard_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_type ENUM('week', 'month', 'year') NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  rank_position INT NOT NULL,
  score INT NOT NULL,
  league_code VARCHAR(50) DEFAULT NULL,
  snapshot_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_period (period_type, period_key),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_rank (rank_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `league_tiers`

Définition des leagues compétitives (remplace l'ancien RANK_CONFIG pour la compétition).

```sql
CREATE TABLE league_tiers (
  code VARCHAR(50) PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  min_trophies INT NOT NULL,
  icon VARCHAR(50) DEFAULT NULL,
  color VARCHAR(7) NOT NULL,               -- hex color
  resets_with_period BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,

  INDEX idx_trophies (min_trophies)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO league_tiers (code, label, min_trophies, icon, color, sort_order) VALUES
('unranked',   'Unranked',     0,    '⚪', '#808080', 0),
('bronze_3',   'Bronze III',   50,   '🥉', '#CD7F32', 1),
('bronze_2',   'Bronze II',    100,  '🥉', '#CD7F32', 2),
('bronze_1',   'Bronze I',     175,  '🥉', '#CD7F32', 3),
('silver_3',   'Silver III',   275,  '🥈', '#C0C0C0', 4),
('silver_2',   'Silver II',    400,  '🥈', '#C0C0C0', 5),
('silver_1',   'Silver I',     550,  '🥈', '#C0C0C0', 6),
('gold_3',     'Gold III',     750,  '🥇', '#FFD700', 7),
('gold_2',     'Gold II',      1000, '🥇', '#FFD700', 8),
('gold_1',     'Gold I',       1300, '🥇', '#FFD700', 9),
('platinum_3', 'Platinum III', 1700, '💎', '#E5E4E2', 10),
('platinum_2', 'Platinum II',  2200, '💎', '#E5E4E2', 11),
('platinum_1', 'Platinum I',   2800, '💎', '#E5E4E2', 12),
('diamond',    'Diamond',      3500, '👑', '#B9F2FF', 13),
('champion',   'Champion',     5000, '🏆', '#FF4500', 14);
```

---

### 3.5 Bloc Récompenses de Level

#### `level_rewards`

Récompenses débloquées à chaque level (cosmétiques/confort).

```sql
CREATE TABLE level_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level INT NOT NULL,
  reward_type ENUM(
    'avatar_frame', 'profile_theme', 'badge_slot',
    'title', 'confetti_animation', 'mascot',
    'dashboard_widget', 'custom_color'
  ) NOT NULL,
  reward_code VARCHAR(50) NOT NULL,
  reward_label VARCHAR(200) NOT NULL,
  reward_payload JSON DEFAULT NULL,

  FOREIGN KEY (level) REFERENCES gamification_levels(level),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### `unlocked_rewards`

Récompenses effectivement débloquées par les entités.

```sql
CREATE TABLE unlocked_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user', 'company_executor', 'company_creator') NOT NULL,
  entity_id INT NOT NULL,
  reward_id INT NOT NULL,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,   -- actuellement active/affichée

  FOREIGN KEY (reward_id) REFERENCES level_rewards(id),
  UNIQUE KEY uq_entity_reward (entity_type, entity_id, reward_id),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. Moteur d'événements et de règles

### 4.1 Architecture

Le moteur est le cœur du système. Il transforme des **événements métier** en **récompenses**.

```
Événement métier
    ↓
[Event Bus] — enregistre l'événement brut
    ↓
[Rule Engine] — évalue les règles applicables
    ├── Quest Rules   → progression quête → XP + trophées si complétée
    ├── Badge Rules   → check unlock → badge + bonus XP
    ├── Score Rules   → checkpoint scoring → XP + trophées
    └── Review Rules  → si review client → XP + trophées + réputation
    ↓
[Reward Writer] — persiste les récompenses (idempotent)
    ├── gamification_xp_events
    ├── trophy_events + trophy_ledgers
    ├── gamification_badge_unlocks
    ├── quest_progress
    └── gamification_profiles (mise à jour lifetime_xp, level)
    ↓
[Notification Dispatcher] — push/in-app notifications
```

### 4.2 Événements métier à écouter

| Événement | Déclencheur | Données |
|-----------|-------------|---------|
| `job.created` | Création d'un job | job_id, creator_company_id |
| `job.accepted` | Assignation acceptée | job_id, user_id, company_id |
| `job.started` | Début du job | job_id, start_time, expected_start |
| `checkpoint.completed` | Un checkpoint validé | job_id, checkpoint_code, entity_type, entity_id, value |
| `photo.added` | Photo ajoutée au job | job_id, user_id, photo_count |
| `note.added` | Note ajoutée au job | job_id, user_id |
| `incident.reported` | Incident signalé | job_id, user_id, severity |
| `incident.resolved` | Incident résolu | job_id, incident_id |
| `signature.collected` | Signature client | job_id, signer_type |
| `job.completed` | Job terminé | job_id, actual_duration, participants[] |
| `client_review.submitted` | Avis client reçu | review_id, job_id, ratings |
| `external_review.published` | Avis externe publié | review_id, platform |
| `streak.reached` | Streak atteint un seuil | user_id, streak_days |
| `onboarding.completed` | Onboarding terminé | user_id |

### 4.3 Implémentation backend

```
server/
  services/
    gamification/
      eventBus.js           — Pub/sub simple (EventEmitter)
      ruleEngine.js         — Évalue les règles pour un événement
      questEngine.js        — Gère la progression des quêtes
      badgeEngine.js        — Vérifie les conditions de badges
      scoreEngine.js        — Calcule le score par job
      rewardWriter.js       — Écrit les récompenses (idempotent)
      notificationDispatcher.js — Envoie les notifications
      index.js              — Point d'entrée, wiring
```

#### `eventBus.js` — Structure

```javascript
// Singleton EventEmitter
const EventEmitter = require('events');
const bus = new EventEmitter();

// Émet un événement métier
function emit(eventType, payload) {
  bus.emit('gamification_event', { type: eventType, ...payload, timestamp: new Date() });
}

// Les listeners sont enregistrés au démarrage du serveur
function registerListeners(ruleEngine) {
  bus.on('gamification_event', async (event) => {
    try {
      await ruleEngine.processEvent(event);
    } catch (err) {
      console.error(`[Gamification] Error processing event ${event.type}:`, err);
    }
  });
}

module.exports = { emit, registerListeners };
```

#### `ruleEngine.js` — Structure

```javascript
async function processEvent(event) {
  // 1. Quêtes : incrémenter les progressions
  await questEngine.onEvent(event);

  // 2. Badges : vérifier si un badge est débloqué
  await badgeEngine.onEvent(event);

  // 3. Score : si c'est un événement de checkpoint ou fin de job
  if (event.type === 'job.completed') {
    await scoreEngine.generateScorecard(event.job_id);
  }
  if (event.type === 'checkpoint.completed') {
    await scoreEngine.recordCheckpoint(event);
  }

  // 4. Review : si c'est un avis client
  if (event.type === 'client_review.submitted') {
    await scoreEngine.processReview(event);
  }
}
```

#### `questEngine.js` — Structure

```javascript
async function onEvent(event) {
  // 1. Trouver les quêtes actives correspondant à cet event
  const matchingQuests = await db.query(`
    SELECT q.*, qp.id as progress_id, qp.progress_value, qp.target_value, qp.status
    FROM quests q
    LEFT JOIN quest_progress qp ON qp.quest_id = q.id
      AND qp.entity_type = ? AND qp.entity_id = ?
      AND (qp.period_key = ? OR qp.period_key IS NULL)
    WHERE q.type IN (?) 
      AND (q.active_from IS NULL OR q.active_from <= CURDATE())
      AND (q.active_to IS NULL OR q.active_to >= CURDATE())
      AND JSON_EXTRACT(q.conditions, '$.event') = ?
  `, [entity_type, entity_id, currentPeriodKey, activeQuestTypes, event.type]);

  // 2. Pour chaque quête, incrémenter le progress
  for (const quest of matchingQuests) {
    if (quest.status === 'claimed') continue;  // déjà réclamée

    const newProgress = (quest.progress_value || 0) + 1;
    const isCompleted = newProgress >= quest.target_value;

    // UPSERT progress
    await db.query(`
      INSERT INTO quest_progress (quest_id, entity_type, entity_id, period_key, progress_value, target_value, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        progress_value = VALUES(progress_value),
        status = VALUES(status),
        completed_at = VALUES(completed_at)
    `, [quest.id, entity_type, entity_id, periodKey, newProgress, quest.target_value,
        isCompleted ? 'completed' : 'active', isCompleted ? new Date() : null]);
  }
}
```

#### `rewardWriter.js` — Structure (idempotent)

```javascript
async function awardXP(entityType, entityId, sourceType, sourceId, amount, metadata) {
  // INSERT IGNORE pour idempotence
  const result = await db.query(`
    INSERT IGNORE INTO gamification_xp_events
      (entity_type, entity_id, source_type, source_id, xp_amount, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [entityType, entityId, sourceType, sourceId, amount, JSON.stringify(metadata)]);

  if (result.affectedRows === 0) return; // déjà attribué

  // Mettre à jour le profil
  await db.query(`
    INSERT INTO gamification_profiles (entity_type, entity_id, lifetime_xp, current_level)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      lifetime_xp = lifetime_xp + VALUES(lifetime_xp),
      current_level = (SELECT MAX(level) FROM gamification_levels WHERE xp_required <= lifetime_xp + VALUES(lifetime_xp))
  `, [entityType, entityId, amount]);
}

async function awardTrophies(entityType, entityId, sourceType, sourceId, amount, periodKey, metadata) {
  const result = await db.query(`
    INSERT IGNORE INTO trophy_events
      (entity_type, entity_id, source_type, source_id, trophy_amount, period_key, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [entityType, entityId, sourceType, sourceId, amount, periodKey, JSON.stringify(metadata)]);

  if (result.affectedRows === 0) return;

  // Mettre à jour tous les ledgers concernés
  const periodTypes = getPeriodTypes(periodKey); // retourne [{type:'week',key:'2026-W14'}, {type:'month',key:'2026-04'}, ...]
  for (const p of periodTypes) {
    await db.query(`
      INSERT INTO trophy_ledgers (entity_type, entity_id, period_type, period_key, trophies_earned)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE trophies_earned = trophies_earned + VALUES(trophies_earned)
    `, [entityType, entityId, p.type, p.key, amount]);
  }
}
```

---

## 5. Système de score par job

### 5.1 Architecture

Chaque job terminé génère un **scorecard** automatiquement.

```
Job Completed
    ↓
scoreEngine.generateScorecard(job_id)
    ↓
  1. Charger les checkpoints attendus (par job_type + universels '*')
  2. Charger les checkpoint_results existants pour ce job
  3. Calculer app_score (pondéré par weights)
  4. Charger la client_review si existante
  5. Calculer client_score
  6. Calculer final_quality_score
  7. Persister dans job_scorecards
  8. Distribuer XP + trophées aux participants
```

### 5.2 Formule de scoring

```
app_quality_score = Σ(checkpoint_score × weight) / Σ(weight) × 100

client_quality_score = moyenne pondérée des ratings client × 20 (pour ramener à /100)

final_quality_score = (0.60 × client_quality_score) + (0.40 × app_quality_score)
```

La pondération 60/40 peut varier par type de job :

| Job Type | Client Weight | App Weight |
|----------|--------------|------------|
| Déménagement résidentiel | 60% | 40% |
| Déménagement commercial | 50% | 50% |
| Livraison simple | 70% | 30% |
| Pack/Unpack | 55% | 45% |

### 5.3 Catégories de checkpoints

| Catégorie | Exemples | Scoring |
|-----------|----------|---------|
| **Timing** | Arrivée à l'heure, fin dans les temps | time_delta : 100 si à l'heure, -5 par tranche de 5min de retard |
| **Photo** | Photos avant/après, photos inventaire | boolean : 100 si fait, 0 sinon |
| **Article state** | Pas de casse, état du mobilier | boolean/rating |
| **Incident** | Aucun incident signalé | boolean inversé : 100 si 0 incidents |
| **Communication** | Client informé, updates envoyées | boolean |
| **Completion** | Toutes les tâches terminées | pourcentage |
| **Safety** | EPI portés, procédures respectées | boolean |
| **Documentation** | Inventaire, signature, contrat | boolean |

### 5.4 Transformation score → récompenses

| Score final | XP attribuée | Trophées attribués |
|-------------|-------------|-------------------|
| 90-100 | 50 XP | 10 trophées |
| 80-89 | 35 XP | 7 trophées |
| 70-79 | 25 XP | 5 trophées |
| 60-69 | 15 XP | 3 trophées |
| < 60 | 10 XP | 1 trophée |

Bonus multiplicateurs :

- Job 5 étoiles client : ×1.5
- Zéro incident : ×1.2
- Complétion 100% checkpoints : ×1.3

---

## 6. Distribution des récompenses

### 6.1 Principe

Un même job produit **plusieurs récompenses parallèles**, pas une seule. Chaque entité est récompensée indépendamment.

### 6.2 Utilisateur (participant)

Récompensé selon :

| Critère | Source |
|---------|--------|
| Actions réelles | Checkpoints validés par ce user |
| Note client individuelle | `client_review_targets` pour ce user |
| Comportement | Absence d'incidents, ponctualité |
| Rôle | Driver vs offsider (multiplicateur éventuel) |

### 6.3 Entreprise exécutrice

Récompensée selon :

| Critère | Source |
|---------|--------|
| Note globale d'exécution | Moyenne des checkpoint_results de l'équipe |
| Cohérence d'équipe | Écart-type faible des scores individuels |
| Temps | Respect de la durée prévue |
| Satisfaction client | Review globale du job |

### 6.4 Entreprise créatrice

Récompensée selon :

| Critère | Source |
|---------|--------|
| Qualité du brief | Checkpoints communication creator-side |
| Précision du pricing | Écart devis/réalité |
| Matching prestataire | Score du prestataire choisi |
| Note client | Review client sur la coordination |

### 6.5 Algorithme de distribution

```javascript
async function distributeRewards(jobId, scorecard) {
  const participants = await getJobParticipants(jobId);

  for (const participant of participants) {
    // Score individuel basé sur ses checkpoints
    const individualScore = await calculateIndividualScore(jobId, participant);
    const clientRating = await getClientRatingForTarget(jobId, participant);

    // XP = base_xp × score_multiplier × role_multiplier
    const baseXP = getBaseXPForScore(scorecard.final_quality_score);
    const scoreMultiplier = individualScore / 100;
    const roleMultiplier = participant.role === 'driver' ? 1.0 : 0.8;
    const xp = Math.round(baseXP * scoreMultiplier * roleMultiplier);

    await rewardWriter.awardXP(participant.entity_type, participant.entity_id,
      'job_score', `job_${jobId}_${participant.entity_id}`, xp, { job_id: jobId });

    // Trophées
    const trophies = getTrophiesForScore(scorecard.final_quality_score);
    await rewardWriter.awardTrophies(participant.entity_type, participant.entity_id,
      'job_score', `job_${jobId}_${participant.entity_id}`, trophies, currentPeriodKey);
  }

  // Company executor
  const executorCompany = await getExecutorCompany(jobId);
  if (executorCompany) {
    const companyXP = calculateCompanyXP(scorecard);
    await rewardWriter.awardXP('company_executor', executorCompany.id,
      'job_score', `job_${jobId}`, companyXP, { job_id: jobId });
  }

  // Company creator
  const creatorCompany = await getCreatorCompany(jobId);
  if (creatorCompany && creatorCompany.id !== executorCompany?.id) {
    const creatorXP = calculateCreatorXP(scorecard);
    await rewardWriter.awardXP('company_creator', creatorCompany.id,
      'job_score', `job_${jobId}_creator`, creatorXP, { job_id: jobId });
  }
}
```

---

## 7. Système de quêtes

### 7.1 Principes

- Les quêtes sont **déclaratives** (définies en base, pas hardcodées)
- Le `questEngine` évalue les conditions automatiquement à chaque événement
- Les quêtes expirent avec leur période (daily → fin de journée, etc.)
- Le joueur doit **claim** la récompense (bouton "Réclamer")
- Les quêtes `repeatable` se réinitialisent à chaque nouvelle période

### 7.2 Cycle de vie d'une quête

```
[active]  → progression via événements
    ↓ (progress >= target)
[completed] → bouton "Claim" disponible
    ↓ (user clique claim)
[claimed] → XP + trophées attribués
    ↓ (si repeatable + nouvelle période)
[active] → nouvelle instance (period_key différent)
```

```
[active] → fin de période sans complétion
    ↓
[expired] → pas de récompense
```

### 7.3 Types de quêtes

| Type | Période | Reset | Exemples |
|------|---------|-------|----------|
| `daily` | 1 jour | Chaque jour à 00:00 timezone company | Complete 1 job, Take 5 photos |
| `weekly` | ISO week | Chaque lundi | Complete 5 jobs, Get 3 five-star reviews |
| `monthly` | Mois calendaire | Le 1er | Complete 20 jobs, 14-day streak |
| `general` | Pas de période | Jamais | One-time quests (onboarding, etc.) |
| `onboarding` | Pas de période | Jamais | Complete profile, First job |

### 7.4 Format des conditions JSON

**Simple** (un seul événement) :

```json
{ "event": "job_completed", "count": 3 }
```

**Multi-conditions** (toutes requises) :

```json
{
  "events": [
    { "event": "job_completed", "count": 2 },
    { "event": "no_incident", "count": 2 }
  ],
  "mode": "all"
}
```

**Avec filtre** :

```json
{
  "event": "job_completed",
  "count": 5,
  "filter": { "job_type": "residential_move" }
}
```

---

## 8. Système de review client

### 8.1 Chaîne complète

```
Job complété
    ↓ (délai configurable, ex: 2h après fin)
Email/SMS automatique au client
    ↓
Client clique le lien signé
    ↓
Formulaire de review (page web publique)
    ├── Note globale (1-5 étoiles obligatoire)
    ├── Notes détaillées optionnelles (ponctualité, politesse, etc.)
    ├── Note par déménageur individuel (optionnel)
    ├── Note entreprise exécutrice
    ├── Note entreprise créatrice (si différente)
    ├── Commentaire libre
    └── Opt-in redirection Google Review
    ↓
Soumission → API POST /jobs/:id/client-review
    ↓
[Event Bus] émet "client_review.submitted"
    ↓
Moteur de règles → XP + trophées + scorecard update
```

### 8.2 Sécurité du lien

- Token signé avec HMAC-SHA256 (secret serveur + job_id + timestamp)
- Expiration configurable (par défaut 7 jours)
- Usage unique (le token est consommé à la soumission)
- Pas de login requis pour le client

```javascript
const crypto = require('crypto');

function generateReviewToken(jobId) {
  const payload = `${jobId}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', process.env.REVIEW_TOKEN_SECRET);
  hmac.update(payload);
  return `${Buffer.from(payload).toString('base64url')}.${hmac.digest('base64url')}`;
}

function verifyReviewToken(token) {
  const [payloadB64, signature] = token.split('.');
  const payload = Buffer.from(payloadB64, 'base64url').toString();
  const hmac = crypto.createHmac('sha256', process.env.REVIEW_TOKEN_SECRET);
  hmac.update(payload);
  const expected = hmac.digest('base64url');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### 8.3 Séparation review interne / externe

| Review interne (Cobbr) | Review externe (Google, etc.) |
|---|---|
| Formulaire Cobbr propriétaire | Redirection après review interne |
| Notes détaillées multi-catégories | Note globale seulement |
| Impact XP, trophées, réputation | Pas d'impact gamification |
| Toujours collectée | Opt-in client explicite |
| Stockée dans `client_reviews` | Lien externe seulement |

---

## 9. API Endpoints

### 9.1 Progression

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/gamification/profile` | Profil complet (XP, level, title, league, badges affichés) |
| GET | `/v1/gamification/profile/:entityType/:entityId` | Profil d'une autre entité |
| GET | `/v1/gamification/xp/history` | Historique XP paginé |
| GET | `/v1/gamification/rewards/unlocked` | Récompenses de level débloquées |
| POST | `/v1/gamification/rewards/:rewardId/equip` | Équiper une récompense cosmétique |

### 9.2 Quêtes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/gamification/quests` | Quêtes actives (daily, weekly, monthly) |
| GET | `/v1/gamification/quests/progress` | Progression sur toutes les quêtes actives |
| POST | `/v1/gamification/quests/:questId/claim` | Réclamer la récompense d'une quête complétée |

### 9.3 Badges

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/gamification/badges` | Catalogue de tous les badges (earned + available) |
| GET | `/v1/gamification/badges/unlocked` | Badges débloqués avec date |
| POST | `/v1/gamification/badges/display` | Configurer les badges affichés sur le profil |

### 9.4 Notes / Scores

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/jobs/:jobId/scorecard` | Scorecard d'un job |
| POST | `/v1/jobs/:jobId/checkpoints/:code` | Valider un checkpoint |
| POST | `/v1/jobs/:jobId/client-review` | Soumettre un avis client (lien signé) |
| GET | `/v1/entities/:entityType/:entityId/reputation` | Score réputation agrégé |

### 9.5 Compétition / Leaderboard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/leaderboards` | Leaderboard filtré par `entity_type` et `period` |
| GET | `/v1/trophies/history` | Historique des trophées par période |
| GET | `/v1/leagues/current` | League actuelle de l'utilisateur |

### 9.6 Review client (lien public)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/review/:token` | Vérifier validité du token et charger les infos du job |
| POST | `/v1/review/:token/submit` | Soumettre le formulaire de review |

### Paramètres query communs

```
?entity_type=user|company_executor|company_creator
?period=week|month|year|all_time
?limit=20&offset=0
```

---

## 10. Frontend — Écrans et composants

### 10.1 Nouveaux écrans

| Écran | Route | Description |
|-------|-------|-------------|
| **QuestsScreen** | `/quests` | Liste quêtes actives (daily/weekly/monthly tabs), barre progression, bouton Claim |
| **GamificationProfileScreen** | `/gamification/profile` | XP à vie, level, title, league, trophées période, badges, reputation |
| **ReputationScreen** | `/reputation` | Notes app + client agrégées, historique, score qualité |
| **JobScorecardScreen** | `/jobs/:id/scorecard` | Scorecard détaillée d'un job (checkpoints, notes, XP gagnée) |
| **LeaderboardScreen** | `/leaderboard` (refonte) | Multi-entités (user/company tabs), multi-périodes (week/month/year) |
| **RewardsScreen** | `/rewards` | Récompenses débloquées + prochaines, customisation profil |

### 10.2 Composants réutilisables

| Composant | Usage |
|-----------|-------|
| `QuestCard` | Carte de quête avec barre de progression + bouton Claim |
| `BadgeGrid` | Grille de badges (earned/locked) avec tooltip |
| `BadgeDisplayConfig` | Sélecteur de badges à afficher sur le profil |
| `LeagueIndicator` | Badge visuel league actuelle (icon + couleur) |
| `LevelProgressBar` | Barre XP vers prochain level |
| `TrophyCounter` | Compteur trophées période en cours |
| `ScorecardSummary` | Mini scorecard sur la page de détails du job |
| `CheckpointList` | Liste interactive de checkpoints à valider pendant le job |
| `StarRating` | Composant étoiles (1-5) pour les reviews |
| `RewardUnlockModal` | Modal animée quand une récompense est débloquée (confettis) |
| `JobRewardsSummary` | Résumé des récompenses à la fin d'un job |

### 10.3 Modifications d'écrans existants

| Écran existant | Modification |
|----------------|-------------|
| **Home** | Section "Quêtes du jour" (résumé 2-3 quêtes daily, progression) |
| **Job Details** | Onglet/section Checkpoints (liste progressive, bouton valider) |
| **Job Details (fin)** | Modal résumé récompenses gagnées (XP, trophées, badges débloqués) |
| **Profile** | Badges affichés, level title, league, XP, réputation |
| **Company Profile** | Score service, leaderboard position, badges entreprise |

### 10.4 Services et hooks frontend

| Fichier | Rôle |
|---------|------|
| `src/services/gamificationV2.ts` | Nouveau service API (profile, quests, badges, leaderboard, reviews) |
| `src/hooks/useGamificationV2.ts` | Hook principal avec profil, level, league |
| `src/hooks/useQuests.ts` | Hook quêtes actives + progression + claim |
| `src/hooks/useLeaderboard.ts` | Hook leaderboard multi-entités/périodes |
| `src/hooks/useJobScorecard.ts` | Hook scorecard d'un job |
| `src/hooks/useCheckpoints.ts` | Hook checkpoints d'un job + validation |
| `src/hooks/useReputation.ts` | Hook réputation d'une entité |
| `src/hooks/useBadges.ts` | Hook badges catalogue + unlocked + display config |

### 10.5 Traductions nécessaires

Namespace `gamification` à enrichir dans les 7 langues :

```
gamification.quests.*          — titres, descriptions, UI quêtes
gamification.badges.*          — catégories, noms, descriptions
gamification.leagues.*         — noms des leagues
gamification.levels.*          — titres des levels
gamification.checkpoints.*     — labels des checkpoints
gamification.scorecard.*       — UI scorecard
gamification.rewards.*         — récompenses
gamification.review.*          — formulaire review client
gamification.leaderboard.*     — UI leaderboard (refonte)
gamification.reputation.*      — labels réputation
```

---

## 11. Protections anti-abus

### 11.1 Anti-abus XP

| Protection | Implémentation |
|------------|---------------|
| **Pas de double récompense** | UNIQUE KEY `uq_idempotent` sur `gamification_xp_events` (entity + source_type + source_id) |
| **Idempotence** | `INSERT IGNORE` pour toutes les écritures de récompenses |
| **Plafonds quotidiens** | Max XP/jour par source : 10 photos/jour = max 50 XP photo/jour |
| **Détection spam photo** | Rate limit : max 1 photo/minute, rejet si identique (hash) |
| **Contrôle quêtes répétables** | `period_key` unique dans `quest_progress` empêche double-claim |
| **Calcul serveur uniquement** | Aucun calcul XP/trophées côté client |

### 11.2 Anti-abus review

| Protection | Implémentation |
|------------|---------------|
| **Un avis par job** | UNIQUE KEY `uq_job_review` sur `client_reviews.job_id` |
| **Lien signé + expiration** | Token HMAC + `token_expires_at` (7 jours par défaut) |
| **Pondération job incomplet** | Si completion_rate < 50%, review poids réduit ×0.5 |
| **Contestation** | Table future `review_disputes` si abus signalé |
| **Modération** | Flag sur review + notification admin si note 1/5 avec mots-clés |

### 11.3 Anti-abus trophées

| Protection | Implémentation |
|------------|---------------|
| **Reset automatique** | `period_key` dans `trophy_ledgers` — nouvelle période = nouveau compteur |
| **Snapshots figés** | `leaderboard_snapshots` sauvegardés en fin de période, immuables |
| **Calcul serveur only** | Trophées attribués uniquement côté backend |
| **Audit trail** | `trophy_events` avec `source_type` + `source_id` pour traçabilité |

### 11.4 Rate limiting global

| Endpoint | Rate limit |
|----------|-----------|
| `POST /checkpoints/:code` | 30 req/min par user |
| `POST /client-review` | 1 par job (hard limit) |
| `POST /quests/:id/claim` | 10 req/min par user |
| `POST /badges/display` | 5 req/min par user |

---

## 12. Gestion des périodes et fuseaux

### 12.1 Définitions de périodes

| Période | Définition | Clé format | Exemple |
|---------|-----------|------------|---------|
| **Week** | ISO 8601 week (lundi → dimanche) | `YYYY-Www` | `2026-W14` |
| **Month** | Mois calendaire | `YYYY-MM` | `2026-04` |
| **Year** | Année calendaire | `YYYY` | `2026` |
| **All time** | Cumul historique | `all` | `all` |

### 12.2 Fuseau horaire

- Fuseau défini **par entreprise** (champ `timezone` dans `companies`, ex: `"Australia/Sydney"`)
- Le calcul des périodes utilise le fuseau de l'entreprise de l'utilisateur
- Fallback : `"Australia/Sydney"` (marché principal)
- Les daily quests expirent à 00:00 dans le fuseau de l'entreprise

### 12.3 Calcul des period_keys

```javascript
const { DateTime } = require('luxon');

function getPeriodKeys(timezone = 'Australia/Sydney') {
  const now = DateTime.now().setZone(timezone);
  return {
    daily: now.toISODate(),                                    // "2026-04-03"
    weekly: `${now.weekYear}-W${String(now.weekNumber).padStart(2, '0')}`,  // "2026-W14"
    monthly: now.toFormat('yyyy-MM'),                          // "2026-04"
    yearly: now.toFormat('yyyy'),                              // "2026"
    all_time: 'all',
  };
}

function getPeriodTypes(periodKey) {
  // Depuis un daily key, génère tous les period entries à mettre à jour
  const dt = DateTime.fromISO(periodKey);
  return [
    { type: 'week',     key: `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, '0')}` },
    { type: 'month',    key: dt.toFormat('yyyy-MM') },
    { type: 'year',     key: dt.toFormat('yyyy') },
    { type: 'all_time', key: 'all' },
  ];
}
```

---

## 13. Récompenses de level

### 13.1 Principes

- Récompenses **principalement cosmétiques** ou identitaires
- Aucun impact sur le pricing, les fonctionnalités métier, ou les commissions
- Éventuels avantages de **confort** (slots de badges supplémentaires, widgets dashboard)

### 13.2 Catalogue de récompenses

| Level | Récompense | Type |
|-------|-----------|------|
| 2 | Cadre profil "Starter" | `avatar_frame` |
| 4 | Titre "Mover" | `title` |
| 6 | +1 slot de badge affiché | `badge_slot` |
| 8 | Cadre profil "Expert" | `avatar_frame` |
| 10 | Titre "Elite" | `title` |
| 12 | Cadre profil "Hero" | `avatar_frame` |
| 13 | Thème "Legend" | `profile_theme` |
| 15 | Animation confettis fin de job | `confetti_animation` |

### 13.3 Types de récompenses futures

| Type | Description | Impact |
|------|-------------|--------|
| `avatar_frame` | Cadre décoratif autour de la photo de profil | Cosmétique |
| `title` | Titre affichable sous le nom | Cosmétique |
| `badge_slot` | Slot supplémentaire pour badges affichés (défaut: 3) | Confort |
| `profile_theme` | Palette de couleurs personnalisée pour le profil | Cosmétique |
| `confetti_animation` | Animation spéciale à la fin d'un job | Cosmétique |
| `mascot` | Mascotte/avatar décoratif | Cosmétique |
| `dashboard_widget` | Widget stats supplémentaire sur le dashboard | Confort |
| `custom_color` | Couleur personnalisée pour le badge de league | Cosmétique |

---

## 14. Migration depuis le système actuel

### 14.1 Fichiers à refondre

| Fichier actuel | Action |
|----------------|--------|
| `src/services/gamification.ts` | Garder, enrichir → `gamificationV2.ts` (puis migrer progressivement) |
| `src/hooks/useGamification.ts` | Garder pour rétro-compat, créer `useGamificationV2.ts` |
| `src/hooks/useGamificationFixed.ts` | Supprimer après migration |
| `src/screens/leaderboard.tsx` | Refondre (multi-entités, multi-périodes, trophées) |
| `src/screens/badges.tsx` | Enrichir (catalogue complet, rarity, display config) |
| `RANK_CONFIG` dans gamification.ts | Garder comme `LEVEL_TITLES` (progression), ajouter `LEAGUE_TIERS` (compétition) |

### 14.2 Changements structurels

| Avant | Après |
|-------|-------|
| Leaderboard basé sur XP uniquement | Leaderboard basé sur trophées par période |
| Rang = level | Level Title = progression, League = compétition |
| Profil : level + XP + badges | Profil : XP, level, title, trophées, league, badges, réputation, note app, note client |
| Pas de quêtes | Quêtes daily/weekly/monthly |
| Pas de score par job | Scorecard avec checkpoints |
| Pas de review client structurée | Review multi-catégories + par participant |

### 14.3 À conserver

- Historique XP existant (migrer vers `gamification_xp_events`)
- Badges screen (enrichir)
- Leaderboard screen (refondre)
- Hook gamification (garder + créer V2)
- Service gamification de base (garder + créer V2)

### 14.4 Migration de données

```sql
-- Migrer les XP events existants (table actuelle → nouvelle)
INSERT INTO gamification_xp_events (entity_type, entity_id, source_type, source_id, xp_amount, created_at, metadata)
SELECT 'user', user_id, 'manual', CONCAT('legacy_', id), xp_earned, created_at, 
  JSON_OBJECT('legacy', true, 'action', action)
FROM points_transactions;   -- ou nom de la table existante côté serveur

-- Migrer les profils existants
INSERT INTO gamification_profiles (entity_type, entity_id, lifetime_xp, current_level)
SELECT 'user', user_id, experience, level
FROM user_gamification;      -- ou nom de la table existante côté serveur
```

---

## 15. Roadmap d'implémentation par phases

### Phase 1 — Fondation (priorité haute)

**Objectif** : Poser le modèle de données et le moteur d'événements.

| # | Tâche | Type | Détail |
|---|-------|------|--------|
| 1.1 | Créer les tables de progression | Backend/DB | `gamification_profiles`, `gamification_xp_events`, `gamification_levels`, `gamification_badges`, `gamification_badge_unlocks` |
| 1.2 | Créer les tables de score | Backend/DB | `job_scorecards`, `job_checkpoints`, `job_checkpoint_results` |
| 1.3 | Créer les tables de review | Backend/DB | `client_reviews`, `client_review_targets` |
| 1.4 | Créer les tables de compétition | Backend/DB | `trophy_ledgers`, `trophy_events`, `league_tiers` |
| 1.5 | Créer les tables de récompenses | Backend/DB | `level_rewards`, `unlocked_rewards` |
| 1.6 | Implémenter eventBus.js | Backend | EventEmitter singleton |
| 1.7 | Implémenter ruleEngine.js | Backend | Pipeline événement → règles → récompenses |
| 1.8 | Implémenter rewardWriter.js | Backend | Écriture idempotente XP + trophées |
| 1.9 | Implémenter scoreEngine.js | Backend | Scorecard job + checkpoints + scoring |
| 1.10 | Implémenter badgeEngine.js | Backend | Vérification conditions badges |
| 1.11 | Câbler les événements | Backend | Émettre les events dans les endpoints existants (job.completed, etc.) |
| 1.12 | API endpoints de base | Backend | GET /profile, GET /xp/history, GET /badges, GET /scorecard |
| 1.13 | Review client simple | Backend | POST /client-review, lien signé, formulaire basique |
| 1.14 | Migration données existantes | Backend/DB | XP + profils existants → nouvelles tables |
| 1.15 | Frontend : gamificationV2 service | Frontend | Nouveau service API |
| 1.16 | Frontend : useGamificationV2 hook | Frontend | Hook profil enrichi |
| 1.17 | Frontend : Profil gamifié | Frontend | Écran profil avec XP, level, title, badges |
| 1.18 | Frontend : Scorecard job | Frontend | Section scorecard dans job details |
| 1.19 | Seed checkpoints universels | Backend/DB | Checkpoints '*' (timing, photo, incident, etc.) |
| 1.20 | Seed badges de base | Backend/DB | ~10 badges core |

### Phase 2 — Quêtes

**Objectif** : Engagement quotidien via quêtes.

| # | Tâche | Type | Détail |
|---|-------|------|--------|
| 2.1 | Créer les tables de quêtes | Backend/DB | `quests`, `quest_progress` |
| 2.2 | Implémenter questEngine.js | Backend | Progression + complétion automatique |
| 2.3 | API quêtes | Backend | GET /quests, GET /quests/progress, POST /quests/:id/claim |
| 2.4 | Seed quêtes daily/weekly/monthly | Backend/DB | ~10 quêtes de base |
| 2.5 | Frontend : useQuests hook | Frontend | Hook quêtes actives + claim |
| 2.6 | Frontend : QuestsScreen | Frontend | Écran quêtes avec tabs daily/weekly/monthly |
| 2.7 | Frontend : QuestCard composant | Frontend | Barre de progression + claim |
| 2.8 | Frontend : Home quests summary | Frontend | Section "Quêtes du jour" sur la home |
| 2.9 | Traductions quêtes | Frontend | 7 langues |

### Phase 3 — Compétition

**Objectif** : Classements et leagues.

| # | Tâche | Type | Détail |
|---|-------|------|--------|
| 3.1 | Trophées hebdomadaires | Backend | Distribution trophées par job + checkpoints |
| 3.2 | League calculation | Backend | Calcul league depuis trophées période |
| 3.3 | Leaderboard refonte | Backend | Multi-entités (user/company), multi-périodes (week/month/year) |
| 3.4 | Snapshots leaderboard | Backend | Cron fin de période → `leaderboard_snapshots` |
| 3.5 | API compétition | Backend | GET /leaderboards, GET /trophies/history, GET /leagues/current |
| 3.6 | Frontend : LeaderboardScreen refonte | Frontend | Tabs user/company, filtre période |
| 3.7 | Frontend : LeagueIndicator | Frontend | Badge league dans le profil |
| 3.8 | Frontend : TrophyCounter | Frontend | Compteur trophées période en cours |
| 3.9 | Traductions compétition | Frontend | 7 langues |

### Phase 4 — Réputation complète

**Objectif** : Notes multi-entités et profil public.

| # | Tâche | Type | Détail |
|---|-------|------|--------|
| 4.1 | Notes multi-entités | Backend | Agrégation notes par entity (user, company_executor, company_creator) |
| 4.2 | Score quality engine | Backend | Formule finale (60% client + 40% app) par type de job |
| 4.3 | API réputation | Backend | GET /entities/:type/:id/reputation |
| 4.4 | Email review automatique | Backend | Envoi email/SMS post-job avec lien signé |
| 4.5 | Formulaire review complet | Frontend (web) | Page publique: notes détaillées + par participant |
| 4.6 | Frontend : ReputationScreen | Frontend | Notes agrégées, historique, score qualité |
| 4.7 | Frontend : CompanyProfile reputation | Frontend | Score service + position leaderboard |
| 4.8 | Traductions réputation | Frontend | 7 langues |

### Phase 5 — Polish engagement

**Objectif** : UX de jeu, récompenses cosmétiques, rétention.

| # | Tâche | Type | Détail |
|---|-------|------|--------|
| 5.1 | Récompenses de level | Backend/Frontend | Table + API + écran rewards |
| 5.2 | Unlock rewards cosmétiques | Frontend | Modal animée (confettis) à chaque level up / badge |
| 5.3 | Badge display config | Frontend | Choix des badges affichés sur le profil |
| 5.4 | Streak UX | Frontend | Indicateur de streak + animation |
| 5.5 | Job end rewards summary | Frontend | Modal fin de job : XP + trophées + badges gagnés |
| 5.6 | Notifications intelligentes | Backend | Push notifications : quête bientôt expirée, badge presque débloqué |
| 5.7 | Checkpoints progressifs dans job | Frontend | UI checkpoints interactifs pendant le job |
| 5.8 | Traductions polish | Frontend | 7 langues |

---

## Résumé des tables à créer

| Bloc | Table | Phase |
|------|-------|-------|
| Progression | `gamification_profiles` | 1 |
| Progression | `gamification_xp_events` | 1 |
| Progression | `gamification_levels` | 1 |
| Progression | `gamification_badges` | 1 |
| Progression | `gamification_badge_unlocks` | 1 |
| Score | `job_scorecards` | 1 |
| Score | `job_checkpoints` | 1 |
| Score | `job_checkpoint_results` | 1 |
| Review | `client_reviews` | 1 |
| Review | `client_review_targets` | 1 |
| Compétition | `trophy_ledgers` | 1 |
| Compétition | `trophy_events` | 1 |
| Compétition | `league_tiers` | 1 |
| Compétition | `leaderboard_snapshots` | 3 |
| Quêtes | `quests` | 2 |
| Quêtes | `quest_progress` | 2 |
| Récompenses | `level_rewards` | 5 |
| Récompenses | `unlocked_rewards` | 5 |

**Total : 18 nouvelles tables**

---

## Résumé des API endpoints

| Bloc | Endpoints | Phase |
|------|-----------|-------|
| Progression | 5 endpoints | 1 |
| Quêtes | 3 endpoints | 2 |
| Badges | 3 endpoints | 1 |
| Notes/Scores | 4 endpoints | 1 |
| Compétition | 4 endpoints | 3 |
| Review client | 2 endpoints | 1 |

**Total : 21 nouveaux endpoints**

---

## Résumé des fichiers backend

```
server/
  services/
    gamification/
      eventBus.js
      ruleEngine.js
      questEngine.js
      badgeEngine.js
      scoreEngine.js
      rewardWriter.js
      notificationDispatcher.js
      periodHelper.js
      index.js
  endPoints/
    v1/
      gamification/
        profile.js
        xpHistory.js
        quests.js
        badges.js
        leaderboards.js
        trophies.js
        leagues.js
        rewards.js
      jobs/
        scorecard.js
        checkpoints.js
        clientReview.js
      review/
        publicReview.js        -- page publique (pas d'auth)
  migrations/
    030_gamification_v2.sql    -- toutes les tables phase 1
    031_gamification_quests.sql -- tables quêtes
    032_gamification_snapshots.sql -- leaderboard snapshots
    033_gamification_rewards.sql -- level rewards
```

## Résumé des fichiers frontend

```
src/
  services/
    gamificationV2.ts
  hooks/
    useGamificationV2.ts
    useQuests.ts
    useLeaderboard.ts
    useJobScorecard.ts
    useCheckpoints.ts
    useReputation.ts
    useBadges.ts
  screens/
    QuestsScreen.tsx
    GamificationProfileScreen.tsx
    ReputationScreen.tsx
    JobScorecardScreen.tsx
    RewardsScreen.tsx
    leaderboard.tsx              -- refonte
    badges.tsx                   -- enrichi
  components/
    gamification/
      QuestCard.tsx
      BadgeGrid.tsx
      BadgeDisplayConfig.tsx
      LeagueIndicator.tsx
      LevelProgressBar.tsx
      TrophyCounter.tsx
      ScorecardSummary.tsx
      CheckpointList.tsx
      StarRating.tsx
      RewardUnlockModal.tsx
      JobRewardsSummary.tsx
```

---

## 16. Catalogue complet des actions trackables

> **Mise à jour** : 25 avril 2026  
> Ce catalogue est la source de vérité pour toutes les actions utilisateur et entreprise pouvant générer des points (XP et/ou trophées). Chaque action est classée par catégorie, associée à sa table source en base de données, et indique si elle est **déjà trackée**, **partiellement trackée**, ou **manquante** côté backend/frontend.

---

### 16.1 Principes du tracking

Chaque action doit être enregistrée **côté serveur**, à la réception de la requête API, en mode fire-and-forget (non bloquant). Le moteur d'événements V2 (`gamificationEngine`) consomme ces events pour :

1. Incrémenter les compteurs dans `gamification_reward_ledger`
2. Distribuer XP et trophées via l'engine (idempotent)
3. Mettre à jour la progression des quêtes dans `quest_progress`
4. Vérifier les conditions de déblocage de badges

**Règle d'idempotence** : chaque distribution porte une clé composite `(entity_type, entity_id, source_type, source_code)` unique. Un même event ne peut jamais récompenser deux fois la même entité.

---

### 16.2 Catégorie A — Actions sur les Jobs

**Source principale** : table `job_actions` (via `utils/jobActionLogger.js`)

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `job_created` | Création d'un job | User créateur + Company créatrice | ✅ |
| `job_accepted` | Acceptation d'un job par entreprise exécutrice | User + Company exécutrice | ✅ |
| `job_declined` | Refus d'un job | Aucun (event métier) | ✅ |
| `job_started` | Démarrage effectif du job | User + Company exécutrice | ✅ |
| `job_paused` | Pause du job | Aucun (event métier) | ✅ |
| `job_resumed` | Reprise après pause | Aucun (event métier) | ✅ |
| `job_completed` | Complétion du job — event principal | User + Company exécutrice + Company créatrice | ✅ |
| `job_archived` | Archivage du job | Aucun | ✅ |
| `job_deleted` | Suppression du job | Aucun | ✅ |
| `crew_assigned` | Affectation d'un membre au job | Manager qui assigne | ✅ |
| `truck_assigned` | Affectation d'un camion au job | Manager qui assigne | ✅ |
| `crew_removed` | Retrait d'un membre | Aucun | ✅ |
| `truck_removed` | Retrait d'un camion | Aucun | ✅ |
| `counter_proposal_created` | Contre-proposition créée | User auteur | ✅ |
| `counter_proposal_accepted` | Contre-proposition acceptée | User auteur | ✅ |
| `counter_proposal_rejected` | Contre-proposition rejetée | Aucun | ✅ |
| `transfer_created` | Transfert de job vers autre compagnie | Company créatrice | ✅ |
| `job_completed_on_time` | Complétion dans le délai estimé | User + Company | ⚠️ À calculer à la completion |
| `job_completed_early` | Complétion avant le délai estimé | User + Company | ⚠️ À calculer à la completion |
| `job_completed_with_photos` | Complétion avec ≥ 20 photos | User + Company | ⚠️ À calculer à la completion |
| `job_completed_no_incident` | Complétion sans aucun incident | User + Company | ⚠️ À calculer à la completion |

---

### 16.3 Catégorie B — Photos

**Source principale** : table `job_images` (`image_type`, `stage`, `user_id`)  
**Endpoints** : `uploadPhotoToJob.js`, `uploadMultipleImages.js`, `uploadJobImage.js`

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `photo_added` | Toute photo ajoutée à un job | User uploadeur | ⚠️ Partiellement (dans `gamification_xp_rewards` mais pas déclenché auto) |
| `photo_before_added` | Photo type `before` | User | ❌ À ajouter |
| `photo_after_added` | Photo type `after` | User | ❌ À ajouter |
| `photo_damage_added` | Photo type `damage` | User | ❌ À ajouter |
| `first_photo_on_job` | Première photo sur ce job | User | ❌ À calculer |
| `photo_milestone_5` | 5 photos sur ce job | User | ❌ À calculer |
| `photo_milestone_10` | 10 photos sur ce job | User | ❌ À calculer |
| `photo_milestone_20` | 20 photos sur ce job | User | ❌ À calculer |
| `total_photos_50` | Cumul 50 photos toutes jobs | User | ❌ À calculer (lifetime) |
| `total_photos_100` | Cumul 100 photos | User | ❌ À calculer (lifetime) |
| `total_photos_500` | Cumul 500 photos | User | ❌ À calculer (lifetime) |

**Action requise** : dans `uploadPhotoToJob.js` et `uploadMultipleImages.js`, appeler `gamificationEngine.trigger('photo_added', { userId, jobId, imageType })` après insertion réussie.

---

### 16.4 Catégorie C — Signature

**Source principale** : table `job_signatures` (`signature_type`, `created_by`)  
**Endpoint** : `uploadSignatureToJob.js`

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `signature_collected` | N'importe quelle signature collectée | User + Company | ⚠️ Dans `gamification_xp_rewards` mais pas déclenché auto |
| `signature_client_collected` | Signature type `client` | User + Company | ❌ À ajouter |
| `signature_delivery_collected` | Signature type `delivery` | User | ❌ À ajouter |
| `signature_pickup_collected` | Signature type `pickup` | User | ❌ À ajouter |

**Action requise** : dans `uploadSignatureToJob.js`, appeler `gamificationEngine.trigger('signature_collected', { userId, jobId, signatureType })`.

---

### 16.5 Catégorie D — Notes

**Source principale** : table `job_notes` (`note_type`, `created_by`)  
**Endpoints** : `createNote.js`, `updateNoteById.js`

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `note_created` | Création d'une note sur un job | User auteur | ⚠️ Dans `gamification_xp_rewards` (`note_added`) mais pas déclenché auto |
| `note_important_created` | Note type `important` | User | ❌ À ajouter |
| `note_client_created` | Note type `client` | User | ❌ À ajouter |
| `first_note_on_job` | Première note ajoutée à ce job | User | ❌ À calculer |

**Action requise** : dans `createNote.js`, appeler `gamificationEngine.trigger('note_created', { userId, jobId, noteType })`.

---

### 16.6 Catégorie E — Timer et étapes

**Source principale** : tables `job_timer_events`, `job_step_history`  
**Endpoints** : `startJobTimer.js`, `pauseJobTimer.js`, `resumeJobTimer.js`, `advanceJobStepWithTimer.js`

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `timer_started` | Démarrage du timer sur un job | User | ✅ (dans `job_timer_events.event_type = 'start'`) |
| `timer_paused` | Pause du timer | Aucun | ✅ |
| `timer_resumed` | Reprise du timer | Aucun | ✅ |
| `timer_completed` | Complétion via timer | User + Company | ✅ |
| `job_step_advanced` | Avancement d'une étape | User | ✅ (dans `job_timer_events.event_type = 'advance_step'`) |
| `all_steps_completed` | Toutes les étapes d'un job complétées | User + Company | ❌ À calculer à la completion |
| `on_time_arrival` | Timer démarré avant ou à l'heure | User | ❌ À calculer (comparaison job.scheduled_time vs timer start) |

---

### 16.7 Catégorie F — Qualité et incidents

**Source principale** : tables `job_payment_issues`, `job_items`

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `no_incident` | Job complété sans incident signalé | User + Company | ⚠️ Dans `gamification_xp_rewards` mais pas déclenché auto |
| `incident_reported` | Incident/dommage signalé | Aucun (event métier) | ❌ À ajouter dans `paymentIssues.js` |
| `items_all_checked` | Tous les items de l'inventaire vérifiés | User | ❌ À calculer |
| `inventory_complete` | Inventaire complet rempli | User | ❌ À calculer |
| `perfect_job` | Job avec score ≥ 95/100 (notes + checkpoints) | User + Company | ❌ À calculer après review |
| `no_incident_streak_5` | 5 jobs consécutifs sans incident | User + Company | ❌ À calculer (lifetime) |
| `no_incident_streak_20` | 20 jobs consécutifs sans incident | User + Company | ❌ À calculer (lifetime) |

---

### 16.8 Catégorie G — Profil et compte

**Source** : tables `users`, `companies`, `stripe_connected_accounts`

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `profile_completed` | Profil utilisateur 100% rempli | User | ⚠️ Dans `gamification_xp_rewards` mais pas déclenché auto |
| `avatar_uploaded` | Première photo de profil ajoutée | User | ❌ À ajouter dans `uploadUserAvatar.js` |
| `verification_completed` | Vérification identité complétée | User | ⚠️ Dans `gamification_xp_rewards` |
| `stripe_onboarding_completed` | Onboarding Stripe Connect terminé | User + Company | ❌ À ajouter dans webhook Stripe `account.updated` |
| `company_logo_uploaded` | Logo entreprise uploadé | Company | ❌ À ajouter dans `uploadCompanyLogo.js` |
| `company_profile_completed` | Profil entreprise 100% rempli | Company | ❌ À calculer |
| `password_changed` | Mot de passe modifié | User | ❌ À ajouter dans `changePassword.js` |
| `onboarding_tour_completed` | Tour d'onboarding in-app terminé | User | ❌ À ajouter (event frontend → API) |

---

### 16.9 Catégorie H — Streaks

Calculés via cron quotidien, en comparant `last_active_date` dans `gamification_profiles`.

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `streak_day_worked` | Jour de travail consécutif | User | ❌ À calculer chaque fin de journée (cron) |
| `streak_7_days` | 7 jours consécutifs | User | ⚠️ Dans `gamification_xp_rewards` mais pas déclenché auto |
| `streak_14_days` | 14 jours consécutifs | User | ❌ À ajouter |
| `streak_30_days` | 30 jours consécutifs | User | ⚠️ Dans `gamification_xp_rewards` mais pas déclenché auto |
| `streak_100_days` | 100 jours consécutifs | User | ⚠️ Dans `gamification_xp_rewards` mais pas déclenché auto |
| `streak_broken` | Streak interrompue (event métier, 0 points) | Aucun | ❌ À enregistrer (utile pour analytics) |
| `first_job_of_day` | Premier job complété dans la journée | User | ⚠️ Dans `gamification_xp_rewards` mais pas déclenché auto |

---

### 16.10 Catégorie I — Business et social

| `action_type` | Description | Acteur récompensé | Déjà tracké ? |
|---|---|---|---|
| `referral_used` | Un code de parrainage a été utilisé | User parrain | ⚠️ Dans `gamification_xp_rewards` (`referral_bonus`) mais non déclenché |
| `staff_invitation_sent` | Invitation staff envoyée | User manager | ❌ À ajouter dans `staff.js` |
| `staff_invitation_accepted` | Invitation staff acceptée | User invité + Manager | ❌ À ajouter dans `acceptInvitation.js` |
| `company_relation_created` | Relation inter-entreprise créée | Company | ❌ À ajouter |
| `client_created` | Nouveau client créé dans le CRM | User créateur | ❌ À ajouter dans `createClient.js` |
| `quote_sent` | Devis envoyé à un client | User + Company | ❌ À ajouter dans `sendQuoteById.js` |
| `quote_accepted` | Devis accepté par le client | User + Company | ❌ À ajouter dans `decisionQuoteById.js` |
| `truck_added` | Nouveau camion ajouté à la flotte | Company | ❌ À ajouter dans `createTruckForCompany.js` |
| `storage_lot_created` | Lot de stockage créé | Company | ❌ À ajouter dans `storage.js` |
| `training_completed` | Formation complétée | User | ⚠️ Dans `gamification_xp_rewards` mais non déclenché |
| `contract_signed` | Contrat signé sur un job | User | ❌ À ajouter dans `jobContracts.js` |

---

### 16.11 Catégorie J — Avis client (via `job_review_tokens`)

> Voir section 17 pour la description complète de la table existante.

La table `job_review_tokens` est la source centrale des avis clients. Les events suivants en sont dérivés :

| `action_type` | Description | Acteur récompensé | Source |
|---|---|---|---|
| `review_link_created` | Token créé → lien envoyé au client | Company exécutrice | `job_review_tokens.created_at` |
| `review_submitted` | Review complète soumise | User (tous les assignés) + Companies | `submitted_at IS NOT NULL` |
| `review_5_star_overall` | Note globale = 5 | User + Company exécutrice | `rating_overall = 5` |
| `review_4_star_overall` | Note globale = 4 | User + Company exécutrice | `rating_overall = 4` |
| `review_5_star_service` | Note service = 5 | Company exécutrice | `rating_service = 5` |
| `review_5_star_team` | Note équipe = 5 | Company exécutrice | `rating_team = 5` |
| `staff_individually_rated` | Un membre du staff a reçu une note individuelle | User concerné | `staff_ratings IS NOT NULL` (JSON) |
| `staff_positive_adjectives` | Des adjectifs positifs reçus | User concerné | `staff_adjectives IS NOT NULL` (JSON) |
| `price_rated_fair` | Prix noté "juste" par le client | Company créatrice | `price_opinion = 'fair'` |
| `review_with_comment` | Review avec commentaire écrit | Company exécutrice | `final_comment IS NOT NULL AND != ''` |

**Règle de distribution par review** : les points sont distribués à l'ensemble des assignés (`job_users`) du job concerné, pondérés par le rôle, ET à la company exécutrice.

---

### 16.12 Métriques manquantes — Plan d'action

Les tables de tracking actuelles couvrent principalement les **changements de statut de job**. Les lacunes identifiées sont :

#### À ajouter côté backend (modifications d'endpoints)

| Endpoint | Action à tracker | Priorité |
|---|---|---|
| `uploadPhotoToJob.js` | `photo_added` + type + milestone | 🔴 Haute |
| `uploadMultipleImages.js` | `photo_added` × N | 🔴 Haute |
| `uploadSignatureToJob.js` | `signature_collected` + type | 🔴 Haute |
| `createNote.js` | `note_created` + type | 🟡 Moyenne |
| `completeJobById.js` | `job_completed_no_incident`, `job_completed_on_time`, `job_completed_with_photos` (calculés) | 🔴 Haute |
| `updateUserProfile.js` | `profile_completed` (si 100% rempli) | 🟡 Moyenne |
| `uploadUserAvatar.js` | `avatar_uploaded` | 🟡 Moyenne |
| `createClient.js` | `client_created` | 🟢 Faible |
| `sendQuoteById.js` | `quote_sent` | 🟢 Faible |
| `acceptInvitation.js` | `staff_invitation_accepted` | 🟡 Moyenne |
| `paymentIssues.js` | `incident_reported` | 🔴 Haute |
| Webhook Stripe `account.updated` | `stripe_onboarding_completed` | 🟡 Moyenne |

#### À implémenter côté cron

| Tâche | Fréquence | Description |
|---|---|---|
| `cron_streak_calculator` | 1× par jour à 23:59 timezone company | Pour chaque user actif aujourd'hui : incrémenter streak + récompense si milestone |
| `cron_quest_expire` | 1× par jour à 00:01 | Expirer les quêtes `daily` non complétées |
| `cron_weekly_reset` | Lundi 00:01 | Expirer quêtes `weekly`, snapshots leaderboard |
| `cron_monthly_reset` | 1er du mois 00:01 | Expirer quêtes `monthly`, snapshots leaderboard mensuel |

---

## 17. `job_review_tokens` — Intégration gamification V2

> **Contexte** : La table `job_review_tokens` est déjà en production dans la base `swiftapp`. Elle constitue la source des avis clients dans Cobbr. Cette section documente son schéma exact, son usage actuel, et comment elle doit alimenter le moteur de gamification V2.

---

### 17.1 Schéma exact en production (MariaDB 10.5)

```sql
-- État réel de la table en production (25 avril 2026)
-- Field               | Type             | Null | Key  | Default
-- id                  | int(11)          | NO   | PRI  | auto_increment
-- job_id              | int(11)          | NO   | MUL  | (none)
-- token               | varchar(64)      | NO   | UNI  | (none)
-- created_at          | datetime         | YES  |      | current_timestamp()
-- expires_at          | datetime         | YES  |      | NULL
-- submitted_at        | datetime         | YES  |      | NULL
-- rating              | tinyint(4)       | YES  |      | NULL  ← legacy
-- comment             | text             | YES  |      | NULL  ← legacy
-- reviewer_name       | varchar(100)     | YES  |      | NULL
-- rating_overall      | tinyint(4)       | YES  |      | NULL  ← note globale 1-5
-- rating_service      | tinyint(4)       | YES  |      | NULL  ← qualité du service 1-5
-- rating_team         | tinyint(4)       | YES  |      | NULL  ← équipe 1-5
-- staff_ratings       | longtext (JSON)  | YES  |      | NULL  ← notes individuelles par member
-- staff_adjectives    | longtext (JSON)  | YES  |      | NULL  ← adjectifs qualitatifs par member
-- price_opinion       | varchar(20)      | YES  |      | NULL  ← 'too_expensive' | 'fair' | 'cheap'
-- price_expected      | decimal(10,2)    | YES  |      | NULL  ← prix attendu par le client
-- final_comment       | text             | YES  |      | NULL  ← commentaire libre du client
-- current_screen      | tinyint(4)       | NO   |      | 1     ← étape courante du formulaire (1-5)
```

**Format attendu de `staff_ratings`** (JSON) :

```json
[
  { "user_id": 12, "name": "John D.", "rating": 5 },
  { "user_id": 15, "name": "Mike R.", "rating": 4 }
]
```

**Format attendu de `staff_adjectives`** (JSON) :

```json
[
  { "user_id": 12, "adjectives": ["professional", "fast", "careful"] },
  { "user_id": 15, "adjectives": ["friendly"] }
]
```

**Valeurs possibles de `price_opinion`** : `too_expensive`, `fair`, `cheap`

---

### 17.2 Cycle de vie d'un token

```
[job complété]
    ↓
[POST /v1/jobs/:id/review-token]
    → génère token UUID v4
    → expires_at = created_at + 30 jours
    → current_screen = 1
    ↓
[Email envoyé au client avec lien]
    ↓
[Client remplit le formulaire multi-étapes]
    → current_screen incrémente à chaque étape (1 → 5)
    ↓
[Client soumet la review]
    → submitted_at = NOW()
    → gamificationEngine.processReview(token_id)   ← NOUVEAU à implémenter
```

---

### 17.3 Mapping review → événements gamification

Lors de la soumission (`submitted_at` set), le moteur doit déclencher les events suivants :

#### Pour l'utilisateur (tous les `job_users` assignés au job)

| Condition | `action_type` | Notes |
|---|---|---|
| `submitted_at IS NOT NULL` | `review_submitted` | Tous les assignés |
| `rating_overall = 5` | `review_5_star_overall` | Tous les assignés |
| `rating_overall = 4` | `review_4_star_overall` | Tous les assignés |
| `staff_ratings` contient cet `user_id` avec rating ≥ 4 | `staff_individually_rated` | User concerné uniquement |
| `staff_adjectives` contient cet `user_id` avec ≥ 1 adjectif | `staff_positive_adjectives` | User concerné uniquement |
| User a atteint 10 reviews 5★ (lifetime) | débloque badge `FIVE_STAR_10` | — |
| User a atteint 50 reviews 5★ (lifetime) | débloque badge `FIVE_STAR_50` | — |

#### Pour la company exécutrice

| Condition | `action_type` |
|---|---|
| `submitted_at IS NOT NULL` | `review_submitted` |
| `rating_overall = 5` | `review_5_star_overall` |
| `rating_service = 5` | `review_5_star_service` |
| `rating_team = 5` | `review_5_star_team` |
| `final_comment IS NOT NULL AND != ''` | `review_with_comment` |

#### Pour la company créatrice

| Condition | `action_type` |
|---|---|
| `price_opinion = 'fair'` | `price_rated_fair` |

---

### 17.4 SQL — Calcul XP par user depuis les reviews

```sql
-- XP review par utilisateur
SELECT 
  u.id AS user_id,
  u.name,
  COUNT(rt.id)                                             AS total_reviews,
  ROUND(AVG(rt.rating_overall), 2)                        AS avg_rating,
  SUM(CASE WHEN rt.rating_overall = 5 THEN 1 ELSE 0 END)  AS five_star_count,
  SUM(CASE WHEN rt.rating_overall >= 4 THEN 1 ELSE 0 END) AS four_plus_count
FROM job_review_tokens rt
JOIN jobs j ON rt.job_id = j.id
JOIN job_users ju ON ju.job_id = j.id
JOIN users u ON u.id = ju.user_id
WHERE rt.submitted_at IS NOT NULL
GROUP BY u.id, u.name
ORDER BY five_star_count DESC;
```

---

### 17.5 Colonnes à ajouter à `job_review_tokens` pour V2

```sql
-- À inclure dans la migration 035
ALTER TABLE job_review_tokens
  ADD COLUMN xp_distributed      TINYINT(1)  NOT NULL DEFAULT 0
    COMMENT '1 si le moteur gamif a déjà distribué les points pour cette review'
    AFTER current_screen,
  ADD COLUMN xp_distributed_at   TIMESTAMP   NULL DEFAULT NULL
    AFTER xp_distributed,
  ADD INDEX idx_submitted       (submitted_at),
  ADD INDEX idx_xp_distributed  (xp_distributed);
```

**Rôle de `xp_distributed`** : garantit l'idempotence. Le moteur vérifie ce flag avant de distribuer. Si `xp_distributed = 1`, il saute sans erreur.

---

## 18. Table `gamification_reward_ledger`

> Cette table est la **source de vérité de toutes les récompenses distribuées**. Elle répond à la question : *"Combien de points a-t-on distribués, à qui, et pourquoi ?"*  
> Elle est conçue pour être auditée, exportée, et consultée par les admins.

---

### 18.1 Schéma

```sql
CREATE TABLE gamification_reward_ledger (
  id               INT AUTO_INCREMENT PRIMARY KEY,

  -- Qui reçoit la récompense
  entity_type      ENUM('user','company') NOT NULL,
  entity_id        INT NOT NULL,

  -- Quoi
  reward_type      ENUM('xp','trophy') NOT NULL,
  amount           INT NOT NULL COMMENT 'Nombre de points distribués (toujours positif)',

  -- Pourquoi (catégorie)
  source_type      ENUM(
    'action',    -- action interne app (photo, signature, note, etc.)
    'job',       -- complétion de job (scorecard)
    'quest',     -- quête complétée et réclamée
    'badge',     -- bonus XP au déblocage d''un badge
    'review',    -- avis client soumis (job_review_tokens)
    'streak',    -- milestone de streak
    'milestone', -- cumul lifetime (100 photos, 50 jobs, etc.)
    'admin',     -- ajustement manuel par admin
    'bonus'      -- événement spécial
  ) NOT NULL,

  -- Identifiant unique de la source (utilisé pour l'idempotence)
  source_code      VARCHAR(100) NOT NULL
    COMMENT 'Ex: action_type, quest_code, badge_code, job_id, review_token_id',

  -- L'événement exact qui a déclenché la récompense
  trigger_event    VARCHAR(100) NOT NULL
    COMMENT 'Ex: job_completed_no_incident, review_5_star_overall, streak_7_days',

  -- Contexte job (si applicable)
  job_id           INT DEFAULT NULL,

  -- Contexte review (si applicable)
  review_token_id  INT DEFAULT NULL
    COMMENT 'job_review_tokens.id',

  -- Texte lisible pour l''admin et l''utilisateur
  reason           VARCHAR(500) NOT NULL
    COMMENT 'Ex: "Job #44 complété sans incident par John D."',

  -- Données brutes du déclencheur
  metadata         JSON DEFAULT NULL,

  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Idempotence : un event ne distribue qu'une fois par entité
  UNIQUE KEY uq_idempotent (entity_type, entity_id, reward_type, source_type, source_code),

  INDEX idx_entity      (entity_type, entity_id),
  INDEX idx_job         (job_id),
  INDEX idx_review      (review_token_id),
  INDEX idx_source      (source_type, source_code),
  INDEX idx_created     (created_at),
  INDEX idx_entity_type (entity_type, reward_type, created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Ledger universel de toutes les distributions XP et trophées';
```

---

### 18.2 Exemples de lignes

| entity_type | entity_id | reward_type | amount | source_type | source_code | trigger_event | job_id | reason |
|---|---|---|---|---|---|---|---|---|
| user | 12 | xp | 50 | job | `job_44_completed_u12` | `job_completed` | 44 | "Job #44 complété par John D." |
| company | 3 | xp | 25 | job | `job_44_completed_c3` | `job_completed` | 44 | "Company Speedy Movers — job #44" |
| user | 12 | xp | 30 | review | `review_1_5star_u12` | `review_5_star_overall` | 44 | "Avis 5★ reçu sur le job #44" |
| user | 12 | xp | 15 | review | `review_1_adj_u12` | `staff_positive_adjectives` | 44 | "Adjectifs reçus: professional, fast" |
| company | 3 | trophy | 20 | review | `review_1_team5_c3` | `review_5_star_team` | 44 | "Équipe notée 5★ par le client" |
| user | 12 | xp | 5 | action | `photo_job44_img7_u12` | `photo_added` | 44 | "Photo ajoutée sur le job #44" |
| user | 12 | xp | 15 | action | `photo_m20_job44_u12` | `photo_milestone_20` | 44 | "20 photos sur le job #44" |
| user | 12 | xp | 100 | streak | `streak_7_u12_20260425` | `streak_7_days` | NULL | "7 jours consécutifs de travail" |
| user | 12 | xp | 300 | milestone | `photos_100_u12` | `total_photos_100` | NULL | "Cumul de 100 photos atteint" |
| user | 15 | xp | 75 | badge | `ONBOARDING_DONE_u15` | `badge_unlocked` | NULL | "Badge 'Ready to Roll' débloqué" |
| user | 12 | xp | 100 | quest | `WEEKLY_5_2026-W17_u12` | `quest_claimed` | NULL | "Quête 'Weekly Warrior' réclamée" |
| user | 99 | xp | 250 | admin | `admin_adj_u99_20260425` | `manual_adjustment` | NULL | "Ajustement manuel — compensation" |

---

### 18.3 Requêtes d'audit

```sql
-- Total XP par utilisateur
SELECT entity_id, SUM(amount) AS total_xp
FROM gamification_reward_ledger
WHERE entity_type = 'user' AND reward_type = 'xp'
GROUP BY entity_id
ORDER BY total_xp DESC;

-- Détail des sources XP pour user #12
SELECT source_type, trigger_event, SUM(amount) AS total, COUNT(*) AS events
FROM gamification_reward_ledger
WHERE entity_type = 'user' AND entity_id = 12 AND reward_type = 'xp'
GROUP BY source_type, trigger_event
ORDER BY total DESC;

-- XP distribué sur un job donné, toutes entités
SELECT entity_type, entity_id, reward_type, amount, trigger_event, reason
FROM gamification_reward_ledger
WHERE job_id = 44
ORDER BY entity_type, reward_type, created_at;

-- XP généré par les reviews client ce mois
SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
       COUNT(*)                         AS distributions,
       SUM(amount)                      AS total_xp
FROM gamification_reward_ledger
WHERE source_type = 'review' AND reward_type = 'xp'
GROUP BY month
ORDER BY month DESC;

-- Top utilisateurs — XP review uniquement
SELECT entity_id AS user_id, SUM(amount) AS review_xp, COUNT(*) AS review_rewards
FROM gamification_reward_ledger
WHERE entity_type = 'user' AND source_type = 'review' AND reward_type = 'xp'
GROUP BY entity_id
ORDER BY review_xp DESC
LIMIT 10;
```

---

### 18.4 Relation avec les tables existantes

```
gamification_reward_ledger
    ├── entity_type='user'    → users.id
    ├── entity_type='company' → companies.id
    ├── job_id                → jobs.id
    └── review_token_id       → job_review_tokens.id

gamification_profiles
    └── lifetime_xp ← recalculé depuis le ledger (reward_type='xp')

trophy_ledgers
    └── trophies_earned ← recalculé depuis le ledger (reward_type='trophy', period_key)
```

**Règle** : `gamification_profiles.lifetime_xp` ne doit jamais être mis à jour directement.  
Il est toujours recalculé via : `SELECT SUM(amount) FROM gamification_reward_ledger WHERE entity_type=? AND entity_id=? AND reward_type='xp'`.

---

### 18.5 Barèmes XP et trophées — À valider (prochaine session)

> **📌 En attente de validation** : les montants exacts seront définis lors d'une session dédiée, une fois ce catalogue validé. Les valeurs ci-dessous sont indicatives.

**Principe directeur** :

- Actions internes → faibles points XP, peu ou pas de trophées
- Avis client 5★ → montants XP importants + trophées significatifs  
- Milestones cumulatifs → montants élevés (rare = valorisant)
- Quêtes → intermédiaires, avec trophées (compétition)

| Catégorie | XP estimé | Trophées estimés | Fréquence attendue |
|---|---|---|---|
| `job_completed` | 40–80 | 10–20 | Pluriquotidien |
| `review_5_star_overall` (user) | 80–150 | 30–50 | Rare (dépend du client) |
| `review_submitted` | 20–40 | 5–10 | Hebdomadaire |
| `photo_added` | 3–8 | 0–1 | Plusieurs par job |
| `signature_collected` | 8–15 | 0–2 | 1–2 par job |
| `streak_7_days` | 75–150 | 0 | Mensuel |
| `total_photos_100` (milestone) | 200–400 | 0 | Unique (lifetime) |
| Quest daily | 15–30 | 3–8 | Quotidien |
| Quest weekly | 75–150 | 15–30 | Hebdomadaire |
| Quest monthly | 250–500 | 50–100 | Mensuel |

# Gamification — TODO & Plan d'action

**Mis à jour** : 26 avril 2026  
**Référence** : [GAMIFICATION_V2_SPEC.md](./GAMIFICATION_V2_SPEC.md)

> ✅ **Phase 1** : Fondations — complète  
> ✅ **Phase 2** : Quêtes par catégories — complète  
> ✅ **Phase 3** : Trophées saisonniers — complète  
> ✅ **Phase 4** : Scorecard & Reviews — complète  
> ✅ **Phase 5** : Badges — complète  
> ✅ **Phase 6** : Perfect Job + On-Time — complète

---

## Légende

- ✅ Fait
- 🔄 En cours / partiel
- 📋 À faire
- ❌ Hors scope (abandonné ou reporté)

---

## Phase 1 — Fondations (Actuellement en cours)

### 1.1 Backend — Ce qui est déjà en place (✅)

- [x] Table `gamification_reward_ledger` — ledger XP de base
- [x] Table `gamification_levels` — niveaux et seuils XP
- [x] `gamificationEngine.js` — `processJobStarted`, `processStepCompleted`, `processPhotoAdded`
- [x] `gamificationV2.js` — endpoints profil, historique, leaderboard, quêtes, daily recap
- [x] Hooks endpoints dans `startJobById`, `advanceJobStepWithTimer`, `uploadPhotoToJob`, `uploadMultipleImages`
- [x] Cron `dailyRecapCron.js` — recap journalier push + guard AsyncStorage
- [x] Route `/v2/daily-recap` dans `index.js`
- [x] Fix colonnes SQL (`source_code AS action_code`, `amount AS xp_awarded`, etc.)

### 1.2 Frontend — Ce qui est déjà en place (✅)

- [x] `GamificationV2Screen.tsx` — écran profil avec stats + historique XP
- [x] `GamificationV2StatsCard.tsx` — carte stats (XP, level, streak...)
- [x] `QuestsScreen.tsx` — liste de quêtes avec SectionList daily/weekly/monthly/general
- [x] `DailyRecapModal.tsx` — modal récap journalier
- [x] `ProfileHeader.tsx` — tap sur carte XP → GamificationV2Screen (avec chevron)
- [x] `useGamificationV2` hook — profil, historique, quêtes
- [x] `gamificationV2.ts` service — types et fetch functions

---

## Phase 2 — Quêtes par catégories (✅ COMPLÈTE)

### 2.1 Frontend ✅

- [x] **Bouton "Classement" retiré** — `GamificationV2Screen.tsx` fusionne profil + quêtes
- [x] **Types mis à jour** dans `gamificationV2.ts` :
  - `QuestType`: `'intro' | 'daily' | 'weekly' | 'monthly' | 'event'`
  - `GamificationV2Quest`: `category`, `end_date`, `event_info`, `trophy_count`
  - Interface `QuestEventInfo` (name, icon, color, xp_bonus_multiplier, end_date)
- [x] **`GamificationV2Screen.tsx` refondu** :
  - ScrollView (FlatList retiré) — fix dark mode + re-render filtres
  - Quêtes intégrées inline avec filtres par catégorie (pills)
  - `EventQuestBanner` pour les sections événementielles
  - `QuestCard` avec end_date (tous quests), badge `⚡ +X% XP`, bordure colorée event
- [x] **i18n complète** — bloc `gamification` dans types.ts, en.ts, fr.ts

### 2.2 Backend ✅

- [x] **Table `gamification_quest_events`** créée
- [x] **Table `quests`** migrée : colonnes `category`, `end_date`, `event_id`, `trophy_count`
- [x] **Seed migré** : `general`/`onboarding` → `category = 'intro'`
- [x] **`questEngine.js`** :
  - `getPeriodKey(type, eventId)` — supporte `intro` → `'general'`, `event` → `'event_<id>'`
  - `processQuestEvent` lit `category` + `event_id`
  - `claimQuestReward` applique `xp_bonus_multiplier` via JOIN `gamification_quest_events`
- [x] **`GET /v2/quests`** — retourne `category`, `end_date`, `trophy_count`, `event_info`
  - LEFT JOIN `gamification_quest_events`
  - CASE period_key étendu pour `intro` et `event`
- [x] **`POST /v2/quests/:code/claim`** — valide `event_<id>` dans period_key regex

---

## Phase 3 — Trophées saisonniers ✅

### 3.1 Backend

- [x] **Créer table `trophy_season_archives`** — `_backend_deploy/trophy_season_migration.sql`
- [x] **Créer table `trophy_events`** — idem (idempotent via UNIQUE constraint)
- [x] **Créer table `trophy_ledgers`** — idem (compteur saisonnier cumulé)
- [x] **Mettre à jour `gamificationEngine.js`** :
  - `getCurrentSeason()` — retourne saison Hiver (jan–jun) ou Été (jul–déc)
  - `awardTrophies(entityType, entityId, sourceType, sourceId, amount, jobId, conn)` — idempotent
  - `processJobCompleted` → +1 trophée user + company par job
  - `processReviewSubmitted` → +1 ou +2 trophées staff si note ≥ 4 étoiles
- [x] **Cron `trophySeasonCron.js`** (Jan 1 + Jul 1) :
  - Archive saison terminée dans `trophy_season_archives` avec RANK()
  - Envoie push "Fin de saison" avec récap trophées + rang
- [x] **Endpoint GET `/v2/trophies`** : saison courante + archives (`getV2TrophiesEndpoint`)
- [x] **Script de déploiement `deploy_trophies_phase3.py`**

### 3.2 Frontend

- [x] **Types TS** : `TrophySeason`, `TrophySeasonArchive`, `TrophiesResponse` dans `gamificationV2.ts`
- [x] **`fetchV2Trophies()`** dans `gamificationV2.ts`
- [x] **i18n** : clés `gamification.trophy.*` dans `types.ts`, `fr.ts`, `en.ts`
- [x] **`GamificationV2StatsCard`** : prop optionnelle `seasonTrophies` (affiche saison au lieu du lifetime)
- [x] **Composant `TrophySeasonCard`** inline dans `GamificationV2Screen`
  - Saison en cours : nom, icône, compte de trophées, date de fin
  - Archives des saisons passées avec rang
- [x] **Script de déploiement `deploy_trophies_phase3.py`** — déployé ✅ (26 avr 2026)
  - Tables créées en DB, route `/v2/trophies` dans `index.js`, `trophySeasonCron` enregistré, PM2 redémarré

---

## Phase 4 — Scorecard & Reviews (🎯 À déployer)

### 4.1 Backend

- [x] **SQL migration `scorecard_phase4_migration.sql`** — tables `job_checkpoints`, `job_scorecards`, `job_checkpoint_results`, `client_review_requests`, `client_reviews`
- [x] **`_backend_deploy/utils/scoreEngine.js`** — `generateScorecard(jobId)` : photos avant/après, signature client, notes, étapes, équipe, camion
- [x] **`_backend_deploy/endPoints/v1/jobScorecard.js`** — `GET /v1/jobs/:id/scorecard`
- [x] **`_backend_deploy/endPoints/v1/clientReview.js`** :
  - `POST /v1/jobs/:id/review-request` — envoi email HMAC au client
  - `GET /v1/review/:token` — page HTML publique avec formulaire étoiles
  - `POST /v1/review/:token` — soumission avis (no auth, validé par token DB)
- [x] **Hook `generateScorecard` dans `completeJobById.js`** — fire-and-forget après completion
- [x] **`inject_scorecard_route.py`** — injecte routes + hook dans index.js + completeJobById.js
- [x] **`deploy_scorecard_phase4.py`** — script de déploiement complet

### 4.2 Frontend

- [x] **`src/services/scorecard.ts`** — types `Checkpoint`, `Scorecard`, `ClientReview` + `fetchJobScorecard()`, `sendReviewRequest()`
- [x] **`src/screens/JobScorecardScreen.tsx`** — écran complet : cercle score %, checkpoints groupés par catégorie, bannière avis client, bouton envoi review
- [x] **`src/components/jobDetails/sections/ScorecardSummarySection.tsx`** — carte compacte dans l'onglet Summary (mini cercle score, bannière avis si reçu)
- [x] **i18n** : clés `gamification.scorecard.*` dans `types.ts`, `fr.ts`, `en.ts`
- [x] **Navigation** : `Stack.Screen name="JobScorecard"` dans `index.tsx`
- [x] **Intégration `summary.tsx`** : `<ScorecardSummarySection>` inséré après `<FinancialSummarySection>` pour jobs `completed`

### 4.3 Déploiement

- [x] Exécuter `python deploy_scorecard_phase4.py` — déployé ✅ (26 avr 2026)

---

## Phase 5 — Badges ✅

### 5.1 Backend

- [x] **SQL migration `badges_phase5_migration.sql`** — ajout colonne `notified_at` sur `user_badges` (guard push dedup)
- [x] **Tables déjà existantes** : `gamification_badge_definitions` (35 badges seedés) + `user_badges` (unique key user_id + badge_code)
- [x] **`_backend_deploy/utils/badgeChecker.js`** — `checkBadges(userId, conn)` : évalue toutes les conditions (driver_jobs, offsider_jobs, business_jobs, five_star_count, streak_days, level_reached), INSERT IGNORE, push + notification in-app
- [x] **Hook `checkBadges` dans `gamificationEngine.js`** — appelé à la fin de `processJobCompleted` (fire-and-forget via conn existante)
- [x] **`getV2BadgesEndpoint`** dans `gamificationV2.js` — `GET /v1/user/gamification/v2/badges` retourne `{ earned[], available[], stats }` avec `currentValue` pour la progression
- [x] **Route injectée** dans `index.js` — `GET /swift-app/v1/user/gamification/v2/badges`
- [x] **`inject_badges_phase5.py`** + **`deploy_badges_phase5.py`** — scripts de déploiement

### 5.2 Frontend

- [x] **Types** `V2Badge`, `V2BadgesData` dans `gamificationV2.ts`
- [x] **`fetchV2Badges()`** dans `gamificationV2.ts` — `GET ${API}v1/user/gamification/v2/badges`
- [x] **`BadgesScreen` refactorisé** (`src/screens/badges.tsx`) — utilise `fetchV2Badges()` au lieu de l'ancien `fetchGamification()`, `V2Badge` au lieu de `BadgeDetailed`, filtre inline par catégorie

### 5.3 Déploiement

- [x] Exécuter `python deploy_badges_phase5.py` — déployé ✅ (26 avr 2026)
  - Migration SQL OK, `badgeChecker.js` en place, route live, PM2 redémarré, syntaxe Node.js OK

---

## Décisions de design figées

| Décision | Détail |
|----------|--------|
| **Leaderboard classé hors scope** | Pas de classement dans le scope actuel, focus quêtes d'abord |
| **Trophées = jobs uniquement** | Les quêtes donnent uniquement de l'XP. trophy_count = 0 par défaut |
| **2 saisons / an** | Hiver (1 jan → 30 juin) + Été (1 jul → 31 déc) |
| **XP permanent** | L'XP ne reset jamais, détermine le level |
| **Catégories quêtes** | intro / daily / weekly / monthly / event |
| **Intro = général** | Remplace l'ancien type `general` et `onboarding` |
| **Event = hors période** | Les quêtes event sont one-time avec end_date définie |

---

## Prochaine action immédiate

> ✅ Phases 1 → 5 complètes. Aucune action pendante.

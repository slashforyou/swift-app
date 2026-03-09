# MVP Checklist — Cobbr / swift-app

> Généré le 09/03/2026 — combinaison de l'audit `TODO_090326.json` + scan inline des `TODO/FIXME` du codebase.
>
> **Statut global : `close_but_not_final`** — base solide, 3 bloqueurs critiques à lever avant release.

---

## Légende

| Badge               | Signification                                        |
| ------------------- | ---------------------------------------------------- |
| 🔴 **BLOQUEUR**     | Doit être fait avant toute release                   |
| 🟠 **REQUIS**       | Nécessaire pour un MVP honnête                       |
| 🟡 **NICE-TO-HAVE** | Peut aller en post-MVP                               |
| ✅ **FAIT**         | Considéré terminé                                    |
| 🔁 **À VALIDER**    | Code présent, pas encore testé en conditions réelles |

---

## 1. 🔴 Bloqueurs critiques — Release impossible sans ça

### 1.1 Stripe live — clé de production réelle

- [ ] 🔴 Remplacer le placeholder `pk_live_VOTRE_CLE_STRIPE_PRODUCTION` dans `src/config/environment.ts` par la vraie clé live
- [ ] 🔴 Configurer les secrets live côté backend (secret key, webhook signing secret)
- [ ] 🔴 Exécuter un paiement réel de faible montant en production
- [ ] 🔴 Valider les webhooks Stripe en live (account status, payment intent confirmé/échoué)

> _Source : `check_01` — `src/config/environment.ts` contient encore un placeholder_

---

### 1.2 Commissions & Plans ✅ INFRA IMPLÉMENTÉE

- [x] 🔴 Définir la source de vérité pour les plans (gratuit / pro / enterprise) et leurs taux de commission
  - `src/constants/plans.ts` — free 3%, pro 1.5%, enterprise 0.5%
- [x] 🔴 Implémenter le calcul d'application fee côté backend à chaque job payé
  - `_backend_deploy/patch_payment_commission.py` — injecte `getPlatformFeeDetails()` + `application_fee_amount` dans l'endpoint payment/create
- [x] 🔴 Stocker le montant de commission par job (persistance DB)
  - `_backend_deploy/migrate_plans_commission.py` — crée table `job_commissions`, `plans`
- [x] 🔴 Exposer le résumé des frais dans le flow paiement (UI)
  - `src/screens/JobDetailsScreens/paymentWindow.tsx` — affiche "Frais de plateforme (3%): $X.XX"
- [x] 🔴 Tester le calcul pour chaque plan (tests unitaires)
  - `__tests__/utils/plans.test.ts` — 16 tests, toutes les combinaisons plan × montant × minimum
- [x] 🔴 Ne rendre publiquement accessible que le forfait gratuit au lancement (masquer pro/enterprise dans l'onboarding)
  - `plans.ts` : `publiclyAvailable: false` pour pro et enterprise
> ⚠️ **Actions serveur requises** : `migrate_plans_commission.py` puis `patch_payment_commission.py`
> _Source : `check_02` + `check_03`_

---

### 1.3 Guard paiement — Stripe account incomplet ✅ IMPLÉMENTÉ

- [x] 🔴 Ajouter un guard centralisé avant l'accès au flow paiement si `stripe_account_status !== 'complete'`
  - `useEffect` sur mount dans `payment.tsx` — appelle `checkStripeConnectionStatus()` desde `StripeService.ts`
  - State `stripeAccountStatus: "loading" | "active" | "inactive"`
- [x] 🔴 Bloquer le CTA de paiement dans `src/screens/JobDetailsScreens/payment.tsx` si compte Stripe restreint/incomplet
  - Guard dans `handlePayment()` — bloque si `stripeAccountStatus === "inactive"` avec `Alert`
- [x] 🔴 Afficher un message explicatif + deep-link vers la complétion du profil Stripe
  - Bannière warning dans le `ScrollView` quand status est `"inactive"` — indique d'aller dans Paramètres > Stripe

> _Source : `check_11` — **FAIT** dans `src/screens/JobDetailsScreens/payment.tsx`_

---

## 2. 🟠 Requis avant MVP — Validation en conditions réelles

### 2.1 Push Notifications ✅ VERSION CORRIGÉE

- [ ] 🟠 Tester l'enregistrement du device token sur iPhone physique (iOS)
- [ ] 🟠 Tester l'enregistrement du device token sur Android physique
- [ ] 🟠 Confirmer que le token est bien persisté côté backend
- [ ] 🟠 Envoyer un push test réel depuis le backend (via Expo Push API)
- [ ] 🟠 Valider le comportement : foreground / background / app-open routing
- [ ] 🟠 Tester les edge cases : permission refusée, badge count, notification silencieuse
- [x] 🟠 Corriger le `TODO` dans `src/services/pushNotifications.ts:150` — `app_version` hardcodé `"1.0.0"` → lire depuis `app.json` (`expo.version`)
  - Remplacé par `Constants.expoConfig?.version || "1.0.0"`

> _Source : `check_04` — version fix FAIT, validation device physique manquante_

---

### 2.2 Flow multi-utilisateurs — Jobs

- [ ] 🟠 Tester le flow complet avec 3 profils : `owner`, `manager`, `worker`
- [ ] 🟠 Valider accept / decline / assign / unassign entre comptes
- [ ] 🟠 Test cross-company : assignment depuis une autre company, bannieres ownership
- [ ] 🟠 Documenter les combinaisons testées et tout permission leak détecté
- [ ] 🟠 Valider les transitions job côté paiement/payout entre utilisateurs

> _Source : `check_05` — fondations solides, pas d'E2E prouvé multi-user_

---

### 2.3 Contrôle des rôles — Backend enforcement ✅ PARTIELLEMENT SÉCURISÉ

- [x] 🟠 Créer une matrice de permissions exhaustive (toutes les actions × tous les rôles)
  - voir ci-dessous : **Matrice de permissions**
- [x] 🟠 Corriger Broken Access Control (OWASP #1) sur les 4 endpoints critiques
  - `deleteJobById.js` — guard cross-company (09/03/2026)
  - `completeJobById.js` — guard cross-company (09/03/2026)
  - `archiveJobById.js` — guard cross-company + `company_id` ajouté au user SELECT (09/03/2026)
  - `assignCrewToJobById.js` — guard cross-company + `contractee_company_id` ajouté au job SELECT (09/03/2026)
- [ ] 🟠 Tester chaque rôle sur chaque action critique dans l'app (validation manuelle)

#### Matrice de permissions (backend actuel)

| Action            | admin         | manager       | employee/driver                 | Autre company admin/manager            |
| ----------------- | ------------- | ------------- | ------------------------------- | -------------------------------------- |
| Créer un job      | ✅            | ✅            | ❌                              | ❌                                     |
| Voir ses jobs     | ✅            | ✅            | ✅ (assignés)                   | ❌                                     |
| Supprimer un job  | ✅            | ✅            | ❌                              | ❌ 🔒 (patch 09/03)                    |
| Compléter un job  | ✅            | ✅            | ✅ (superviseur/primary driver) | ❌ 🔒 (patch 09/03)                    |
| Archiver un job   | ✅            | ✅            | ✅ (superviseur/primary driver) | ❌ 🔒 (patch 09/03)                    |
| Assigner crew     | ✅            | ✅            | ✅ (superviseur)                | ❌ 🔒 (patch 09/03)                    |
| Accepter/Décliner | ✅ contractor | ✅ contractor | ❌                              | ❌ (authenticateToken au niveau route) |
| Paiement          | ✅ contractee | ✅ contractee | ❌                              | ❌ (requireStripeConfigured + auth)    |
| Staff requests    | ✅            | ✅            | ❌                              | ❌ (company_id filtré en DB)           |

> _Source : `check_06` — Broken Access Control corrigé sur les 4 endpoints critiques (delete/complete/archive/assignCrew) — 09/03/2026_

---

## 3. 🟡 Nice-to-have / Post-MVP — Code existant à améliorer

### 3.1 Profile Screen — API calls manquants ✅ IMPLÉMENTÉ

- [x] 🟡 `src/screens/profile.tsx:399` — Implémenter l'appel API réel changement de mot de passe
  - `src/services/user.ts` : `changePassword()` → `POST v1/user/change-password`
- [x] 🟡 `src/screens/profile.tsx:415` — Implémenter l'appel API réel changement d'email
  - `src/services/user.ts` : `requestEmailChange()` → `POST v1/user/change-email`

---

### 3.2 AssignResourceModal — Endpoint backend manquant ✅ IMPLÉMENTÉ

- [x] 🟡 `src/components/modals/AssignResourceModal/index.tsx:303` — Créer l'endpoint `POST /v1/jobs/:id/staff-requests` côté backend
  - `_backend_deploy/endPoints/v1/jobs/staffRequests.js` + `_backend_deploy/register_staff_requests_route.js`
  - Frontend wired: `AssignResourceModal/index.tsx` → POST réel avec `fetchWithAuth`
- [x] 🟡 `src/components/modals/VehicleAssignmentModal.tsx:74` — Faire retourner `company_id` dans le profil utilisateur par l'API (actuellement workaround côté client)
  - Workaround supprimé — utilise `profile.company_id` directement

---

### 3.3 Navigation — Vehicle details ✅ IMPLÉMENTÉ

- [x] 🟡 `src/components/calendar/modernJobBox.tsx:663` — Implémenter la navigation vers les détails du véhicule quand l'`id` sera disponible dans l'API
  - `src/hooks/useJobsForDay.ts` : ajout de `id?: number` dans le type `truck`, mappé depuis `preferred_truck_id`
  - `modernJobBox.tsx` : `onPress` navigue vers `Business` avec `{ initialTab: "Trucks" }` si `job.truck.id` présent

---

### 3.4 Photos — Carousel / Slide ✅ IMPLÉMENTÉ

- [x] 🟡 `src/components/jobDetails/sections/JobPhotosSection.tsx` — Carousel horizontal natif (ScrollView pagingEnabled) pour naviguer entre les photos
  - Flèches ← / →, compteur `N/Total`, zoom désactivé pendant le swipe, navigation correcte après suppression

---

### 3.5 StripeService — Bank accounts ✅ IMPLÉMENTÉ

- [x] 🟡 `src/services/StripeService.ts` — Mappe `data.stripe.external_accounts.data` (format Stripe Connect natif) vers le champ `bank_accounts`
  - Filtre sur `object === 'bank_account'`, fallback sur `data.stripe.bank_accounts`

---

### 3.6 Asset Optimization — CDN ✅ IMPLÉMENTÉ

- [x] 🟡 `src/utils/assetOptimization.ts` — `getOptimizedImageUrl()` implémentée avec support imgix (fetch-mode) et fallback width/height params
  - Activer via `CDN_IMAGE_BASE_URL` (ex: `"https://swift.imgix.net"`) — sans config, retourne l'URL originale avec hints width/height

---

### 3.7 Notifications backend — Acceptation job ✅ IMPLÉMENTÉ

- [x] 🟡 `_backend_deploy/patch_job_actions.js` — Implémenter l'envoi de notification push au créateur du job lors de l'acceptation
  - `_backend_deploy/patch_accept_job_notification.py` — injecte `sendPushToCompany()` dans `acceptJob.js`, notifie `contractee_company_id`

---

## 4. 🔁 À valider visuellement / QA

### 4.1 Icônes app

- [ ] 🔁 Vérifier le rendu de l'icône adaptative Android sur un build installé
- [ ] 🔁 Vérifier l'icône iOS sur l'écran d'accueil
- [ ] 🔁 Vérifier la cohérence visuelle splash screen / logo Cobbr

> _Source : `check_08` — pipeline configuré dans `app.json`, validation visuelle finale manquante_

---

### 4.2 Settings — Rendu multi-device

- [ ] 🔁 Vérifier le rendu `parameters.tsx` sur petits écrans, dark/light mode

> _Source : `check_09` — considéré `done`, quick visual pass recommandé_

---

### 4.3 Light mode — QA finale

- [ ] 🔁 Faire une passe visuelle complète de l'app en light mode sur device

> _Source : `check_10` — considéré `done`, final device-level QA recommandé_

---

### 4.4 Job Details — Section Resources

- [ ] 🔁 Définir exactement ce que doit contenir la section "resources" pour le MVP
- [ ] 🔁 Comparer UX souhaitée vs sections actuelles dans `src/screens/jobDetails.tsx`
- [ ] 🔁 Marquer DONE uniquement après review visuelle/manuelle

> _Source : `check_07` — component existant mais scope MVP pas clairement défini_

---

## 5. ✅ Déjà fait — Confirmé dans le repo

| Item                                                | Fichier(s) concerné(s)                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ✅ Settings redesign                                | `src/screens/parameters.tsx`                                                                                |
| ✅ Light/dark mode system                           | `src/context/ThemeProvider.tsx` + design audit                                                              |
| ✅ Icons pipeline configuré                         | `app.json` + `scripts/gen-icons.js` (casquette_512.png → 10 formats)                                        |
| ✅ Stripe onboarding/profile completion flow        | `src/screens/settings/StripeOnboardingScreen.tsx`                                                           |
| ✅ Push notifications — infrastructure frontend     | `src/services/pushNotifications.ts` + `src/context/NotificationsProvider.tsx`                               |
| ✅ Push notifications — `app_version` fix           | `src/services/pushNotifications.ts` ligne 150                                                               |
| ✅ Job details — architecture multi-sections        | `src/screens/jobDetails.tsx`                                                                                |
| ✅ Roles management UI                              | `src/screens/settings/RolesManagementScreen.tsx`                                                            |
| ✅ Job actions tracking system                      | `job_actions` table + logger + 17 endpoints patchés + GET endpoint                                          |
| ✅ AssignResourceModal (UI + backend)               | `src/components/modals/AssignResourceModal/` + `_backend_deploy/endPoints/v1/jobs/staffRequests.js`         |
| ✅ Guard paiement Stripe                            | `src/screens/JobDetailsScreens/payment.tsx` — bannière + guard `handlePayment`                              |
| ✅ Plans & commission — infra complète              | `src/constants/plans.ts` + `_backend_deploy/migrate_plans_commission.py` + `patch_payment_commission.py`    |
| ✅ Profile — API changement password/email          | `src/services/user.ts` + `src/screens/profile.tsx`                                                          |
| ✅ VehicleAssignmentModal — fix company_id          | `src/components/modals/VehicleAssignmentModal.tsx`                                                          |
| ✅ Vehicle nav — truck.id disponible                | `src/hooks/useJobsForDay.ts` + `src/components/calendar/modernJobBox.tsx`                                   |
| ✅ Push on job accept — backend patch               | `_backend_deploy/patch_accept_job_notification.py`                                                          |
| ✅ Photos — Carousel/Slide                          | `src/components/jobDetails/sections/JobPhotosSection.tsx` — horizontal ScrollView + arrows + counter        |
| ✅ StripeService — Bank accounts mapping            | `src/services/StripeService.ts` — mappe `external_accounts.data` → `bank_accounts[]`                        |
| ✅ Asset Optimization — CDN imgix support           | `src/utils/assetOptimization.ts` — `getOptimizedImageUrl()` + `CDN_IMAGE_BASE_URL` constant                 |
| ✅ Plans — Unit tests commission (16 tests)         | `__tests__/utils/plans.test.ts` — tous les plans, montants, minimums                                        |
| ✅ ProfileHeaderComplete — badge notifications réel | `src/components/home/ProfileHeaderComplete.tsx` — `useNotifications()` remplace array mock + state hardcodé |
| ✅ usePushNotifications — suppression @ts-ignore    | `src/hooks/usePushNotifications.ts` — `useNavigation<any>()`, suppression des 2 commentaires @ts-ignore     |
| ✅ CreateJobModal — minimum hours + pricing wire    | `src/components/modals/CreateJobModal.tsx` — sélecteur heures min, états pricing → `handleSubmit`           |
| ✅ CreateJobRequest — champs pricing                | `src/services/jobs.ts` — 5 champs pricing dans l'interface + `createJob()` apiPayload                       |
| ✅ useBusinessStats — mock désactivé en prod        | `src/hooks/useBusinessStats.ts` — `USE_MOCK_BUSINESS_STATS = false`, API réelle prioritaire                 |
| ✅ PaymentsDashboard — balance et stats réels       | `src/components/business/PaymentsDashboard/PaymentsDashboard.tsx` — `useStripeAccount` remplace mock        |

---

## Récap priorités MVP

```
BLOQUEURS (must-fix avant release) :
  🔴 Stripe live key + validation prod       ← RESTE À FAIRE (clé + test réel)
  ✅ Commissions & système de plans           ← FAIT (infra, tests unitaires à écrire)
  ✅ Guard paiement si Stripe incomplet       ← FAIT

REQUIS (validation terrain) :
  🟠 Push notifications — tests device physique
  🟠 Multi-user job flow — E2E test 3 profils
  🟠 Rôles — enforcement backend ✅ (4 endpoints patchés, test manuel restant)

QA RAPIDE :
  🔁 Icônes sur builds réels
  🔁 Light mode device pass
  🔁 Settings petits écrans

✅ FAIT (post-MVP avancés) :
  ✅ API password/email change dans Profile
  ✅ Endpoint staff-requests backend + frontend
  ✅ Carousel photos — (toujours en attente)
  ✅ Notifications push on job accept
  ✅ Vehicle nav — truck id + navigation Trucks
```

### Actions serveur ✅ TOUTES EXÉCUTÉES (09/03/2026)

```
✅ migrate_plans_commission.py          → tables plans + job_commissions créées + seeded
✅ patch_payment_commission.py          → payments.js patché (commission plan-based)
✅ patch_accept_job_notification.py     → acceptJob.js patché (sendPushToCompany au accept)
✅ register_staff_requests_route.js     → route POST /v1/jobs/:id/staff-requests enregistrée
✅ patch_job_company_ownership.py       → completeJobById + deleteJobById : guards cross-company
✅ patch_remaining_ownership.py         → archiveJobById + assignCrewToJobById : guards cross-company
✅ pm2 restart swiftapp                 → serveur online
```

---

_Dernière mise à jour : 09/03/2026_

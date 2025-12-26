# 📋 SUIVI DES TODOs - SWIFTAPP

> **Dernière mise à jour :** 26 Décembre 2025 (Session 3 - Stripe & Payments)  
> **Total TODOs :** 45  
> **Résolus cette session :** 12 (6 précédents + 6 Stripe/Payments)

---

## 📊 RÉSUMÉ PAR CATÉGORIE

| Catégorie | Count | Priorité | Notes |
|-----------|-------|----------|-------|
| 🔌 API Integration | 15 → 8 | 🔴 Haute | 7 vehiclesService.ts ont API existante |
| 💳 Stripe & Paiements | 8 → 2 | ✅ Résolu | 6 implémentés, 2 AWAITING_BACKEND |
| 🚗 Véhicules | 7 | 🟡 Moyenne | Migration interface requise |
| 👥 Staff & Business | 5 | 🟡 Moyenne | staffService = RH, pas job crew |
| 📸 Photos | 2 | 🟢 Basse | |
| 🌍 Traductions | 2 | 🟢 Basse | |
| 🔧 Divers | 6 | 🟢 Basse | |

---

## ✅ RÉSOLUS RÉCEMMENT

### 26 Décembre 2025 - Session 3 - Stripe & Payments TODOs
- [x] **StripeService.ts - createInstantPayout** - Implémenté avec POST /stripe/payouts/create
- [x] **StripeService.ts - bank_accounts** - Récupéré depuis external_accounts de l'API
- [x] **usePayouts.ts - refreshPayouts** - GET /stripe/payouts + GET /stripe/balance
- [x] **usePayouts.ts - createPayout** - POST /stripe/payouts/create
- [x] **useStripeConnect.ts - refreshStatus** - GET /stripe/connect/status
- [x] **useStripeConnect.ts - connectAccount** - GET /stripe/connect/onboarding
- [x] **useStripeConnect.ts - disconnect** - DELETE /stripe/connect/disconnect
- [x] **useStripeReports.ts - loadReportsData** - GET /payments/history
- [x] **useStripeReports.ts - exportData** - GET /transactions-export
- [x] **StripePaymentScreen.tsx - handlePayment** - POST /payments/create-payment-intent + /payments/confirm

**Commit:** `26544d5` - feat(stripe): implement real API calls for Stripe & Payments TODOs

### 26 Décembre 2025 - Session 2 - Analyse API TODOs
- [x] **syncWithAPI dans JobStateProvider.tsx** - Implémenté avec `fetchJobProgressFromAPI()`
  - ✅ Appelle GET /v1/job/:id pour récupérer current_step et status
  - ✅ Dispatch SYNC_WITH_API avec les données de progression

### 26 Décembre 2025 - Session 1 - Bug Signature
- [x] **Signature redemandée après avoir quitté le job** - Commits `a89ac90` → `c271c1f`
  - ✅ Ajout `getJobSignatures()` et `checkJobSignatureExists()` dans jobDetails.ts
  - ✅ SignatureSection vérifie le serveur avant d'afficher le bouton
  - ✅ signingBloc vérifie avant upload pour éviter erreur 400
  - ✅ payment.tsx corrigé (boucle infinie + vérification serveur)
  - ✅ Utilisation de job.code au lieu de job.id pour getJobDetails

---

## 📌 ANALYSE API INTEGRATION (26 Déc 2025)

### ✅ Endpoints Backend DISPONIBLES

| Fonctionnalité | Endpoint | Status |
|---------------|----------|--------|
| Job Crew | `GET/POST /job/:id/crew` | ✅ Disponible |
| Job Trucks | `GET/POST /job/:id/trucks` | ✅ Disponible |
| Company Trucks | `GET/POST/PATCH/DELETE /company/:companyId/trucks` | ✅ Disponible |
| Job Signatures | `GET /job/:jobId/signatures`, `POST /job/:jobId/signature` | ✅ Disponible |
| Stripe Balance | `GET /stripe/balance` | ✅ Implémenté |
| Stripe Payouts | `GET /stripe/payouts`, `POST /stripe/payouts/create` | ✅ Implémenté |
| Stripe Connect | GET /status, /onboarding, DELETE /disconnect | ✅ Implémenté |
| Payment Intent | `POST /payments/create-payment-intent` | ✅ Implémenté |
| Payment Confirm | `POST /payments/confirm` | ✅ Implémenté |
| Payments History | `GET /payments/history` | ✅ Implémenté |
| Transactions Export | `GET /transactions-export` | ✅ Implémenté |

### ⚠️ Service business/vehiclesService.ts EXISTE

Le fichier `src/services/business/vehiclesService.ts` **utilise déjà l'API réelle** (`/company/:companyId/trucks`).

L'ancien fichier `src/services/vehiclesService.ts` (avec mocks) est encore utilisé par `useVehicles.ts` → **Migration d'interface requise** (VehicleAPI ≠ BusinessVehicle).

### ⚠️ staffService.ts = Gestion RH

`staffService.ts` gère les **employés de l'entreprise** (RH), pas les crew members assignés aux jobs.
- Endpoint Job Crew (`/job/:id/crew`) = pour assigner du staff à un job
- Pas d'endpoint dédié pour la gestion RH → AsyncStorage reste la solution

---

## 🔴 PRIORITÉ HAUTE

### 🔌 API Integration - Endpoints Manquants

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/services/vehiclesService.ts` | 197 | Replace with real API call when /business/vehicles is ready | ⚠️ API existe dans business/vehiclesService.ts - Migration interface requise |
| `src/services/vehiclesService.ts` | 217 | Replace with real API call | ⚠️ Idem |
| `src/services/vehiclesService.ts` | 240 | Replace with real API call | ⚠️ Idem |
| `src/services/vehiclesService.ts` | 277 | Replace with real API call | ⚠️ Idem |
| `src/services/vehiclesService.ts` | 311 | Replace with real API call | ⚠️ Idem |
| `src/services/vehiclesService.ts` | 339 | Replace with real API call | ⚠️ Idem |
| `src/services/vehiclesService.ts` | 364 | Replace with real API call | ⚠️ Idem |
| `src/services/business/staffService.ts` | 4 | Connecter aux endpoints Job Crew quand disponible | ℹ️ staffService = RH, Job Crew = assignation job. Concepts différents |
| `src/context/JobStateProvider.tsx` | 298 | Appeler l'API pour sync l'état | ✅ **IMPLÉMENTÉ** - fetchJobProgressFromAPI() |

### 💳 Stripe & Paiements - ✅ MAJORITÉ RÉSOLUE

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/services/StripeService.ts` | 440 | Récupérer les comptes bancaires | ✅ **IMPLÉMENTÉ** - external_accounts.data |
| `src/services/StripeService.ts` | 572 | createInstantPayout | ✅ **IMPLÉMENTÉ** - POST /stripe/payouts/create |
| `src/services/StripeService.ts` | 607 | createStripePaymentLink | ⚠️ **AWAITING_BACKEND** - Pas d'endpoint |
| `src/services/StripeService.ts` | 613 | updateStripeAccountSettings | ⚠️ **AWAITING_BACKEND** - Pas d'endpoint |
| `src/screens/payments/StripePaymentScreen.tsx` | 60 | Intégrer avec la vraie API Stripe | ✅ **IMPLÉMENTÉ** |
| `src/hooks/usePayouts.ts` | 37+81 | Remplacer par vraie API | ✅ **IMPLÉMENTÉ** |
| `src/hooks/useStripeConnect.ts` | 31+63+79 | Remplacer par vraie API | ✅ **IMPLÉMENTÉ** |
| `src/hooks/useStripeReports.ts` | 144+172+208 | loadReportsData + exportData | ✅ **IMPLÉMENTÉ** |

---

## 🟡 PRIORITÉ MOYENNE

### 👥 Staff & Business

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/components/modals/AddStaffModal.tsx` | 189 | Implémenter l'invitation de prestataire | ⏳ À implémenter |
| `src/screens/business/staffCrewScreen.tsx` | 72 | Implémenter la suppression | ⏳ À implémenter |
| `src/screens/business/staffCrewScreen.tsx` | 81 | Implement edit functionality | ⏳ À implémenter |
| `src/screens/business/PayoutsScreen.tsx` | 100 | Navigation vers le détail du payout | ⏳ À implémenter |
| `src/screens/business/PaymentsListScreen.tsx` | 83 | Navigation vers le détail du paiement | ⏳ À implémenter |

### 🚗 Véhicules

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/screens/business/VehicleDetailsScreen.tsx` | 57 | Add mileage to API | ⏳ En attente backend |
| `src/screens/business/VehicleDetailsScreen.tsx` | 58 | Add purchaseDate to API | ⏳ En attente backend |
| `src/screens/business/VehicleDetailsScreen.tsx` | 59 | Add lastService to API | ⏳ En attente backend |
| `src/screens/business/trucksScreen.tsx` | 551 | Ouvrir détails du véhicule | ⏳ À implémenter |

### ⚙️ Stripe Settings

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/screens/business/StripeSettingsScreen.tsx` | 83 | Ouvrir Stripe Connect Onboarding | ⏳ À implémenter |
| `src/screens/business/StripeSettingsScreen.tsx` | 100 | Navigation vers configuration webhooks | ⏳ À implémenter |
| `src/screens/business/StripeSettingsScreen.tsx` | 117 | Créer un paiement test | ⏳ À implémenter |
| `src/screens/business/StripeSettingsScreen.tsx` | 135 | Déconnecter le compte Stripe | ⏳ À implémenter |

### 💰 Stripe Hub

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/screens/business/StripeHub.tsx` | 234 | Ouvrir modal de création de lien de paiement | ⏳ À implémenter |
| `src/screens/business/StripeHub.tsx` | 243 | Créer un lien de paiement rapide | ⏳ À implémenter |
| `src/screens/business/StripeHub.tsx` | 250 | Navigation vers création personnalisée | ⏳ À implémenter |

---

## 🟢 PRIORITÉ BASSE

### 📸 Photos

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/components/jobDetails/modals/PhotoSelectionModal.tsx` | 70 | Code pour prendre la photo manquant | ⏳ À implémenter |
| `src/components/jobDetails/modals/PhotoSelectionModal.tsx` | 107 | Code pour sélectionner la photo manquant | ⏳ À implémenter |

### 🌍 Traductions

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/localization/translations/es.ts` | 315 | Add complete translations | ⏳ À traduire |

### 🔧 Divers

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/services/jobTimer.ts` | 58 | Calculer breaks par step si nécessaire | ⏳ À évaluer |
| `src/services/sessionLogger.ts` | 315 | Implémenter sharing avec react-native-share | ⏳ Nice to have |
| `src/services/testReporter.ts` | 64 | Get appVersion from package.json safely | ⏳ Nice to have |
| `src/screens/home.tsx` | 225 | Ouvrir modal DevTools | ⏳ Dev only |
| `src/screens/jobDetails.tsx` | 305 | Logique pour déterminer le template depuis l'API | ⏳ À implémenter |
| `src/context/ThemeProvider_Advanced.tsx` | 12 | Refactoriser quand système couleurs unifié | ⏳ À évaluer |

---

## 📈 HISTORIQUE DES SESSIONS

### Session 26 Décembre 2025
**Focus :** Bug signature redemandée après avoir quitté le job

**Résolu :**
- ✅ Signatures stockées dans table séparée, pas dans l'objet job
- ✅ Ajout vérification serveur avant affichage bouton "Signer"
- ✅ Correction boucle infinie dans payment.tsx (useMemo)
- ✅ Correction erreur 404 (utiliser job.code au lieu de job.id)

**Commits :**
1. `a89ac90` - feat(signature): add server-side signature verification API
2. `865dff0` - feat(signature): check server for existing signature before requesting
3. `4902fab` - fix(payment): add server signature check and fix infinite loop
4. `37e9c9e` - fix(client): use job code instead of id for getJobDetails
5. `c271c1f` - docs: add signature bug fix documentation

---

## 🎯 PROCHAINES PRIORITÉS SUGGÉRÉES

1. **Véhicules API** - 7 TODOs bloqués par backend
2. **Stripe Payouts/Reports** - 6 TODOs pour fonctionnalités avancées
3. **Staff Management** - 3 TODOs pour CRUD complet
4. **Job Workflow** - Sync état avec API

---

## 📝 NOTES

- Les TODOs marqués "En attente backend" nécessitent des endpoints API côté serveur
- Les TODOs dans `/coverage/` sont des duplicatas (fichiers générés)
- Utiliser `grep -r "TODO:" src/` pour une liste à jour

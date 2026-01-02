# 📋 MASTER TASKS - Swift App

> **Fichier consolidé de toutes les tâches du projet**  
> **Dernière mise à jour :** 28 Décembre 2025  
> **Source :** Consolidation de tous les fichiers .md avec checkboxes

---

## 🎯 Légende des Priorités

| Emoji | Niveau | Description |
|-------|--------|-------------|
| 🔴 | **URGENT** | Bloquant pour production, à faire immédiatement |
| 🟠 | **HAUTE** | Important pour le lancement, priorité haute |
| 🟡 | **MOYENNE** | Nécessaire mais peut attendre après lancement |
| 🟢 | **BASSE** | Nice-to-have, amélioration future |
| ⚪ | **OPTIONNELLE** | Peut être ignoré ou reporté indéfiniment |

---

## 📊 Résumé (Mise à jour 2 Jan 2026)

| Catégorie | Terminé | En Attente | Total |
|-----------|---------|------------|-------|
| 🚀 Phase 1 - Production Ready | **51+** | 0 | 51+ |
| 🎯 Phase 2 - Growth | 5 | 14 | 19 |
| 🌍 Phase 3 - Expansion | 0 | 12 | 12 |
| 🚀 Phase 4 - Innovation | 0 | 10 | 10 |
| 🧪 Tests Light/Dark | 40+ | 0 | 40+ |
| 🔐 Audit Sécurité | 3 | 0 | 3 |
| 🔧 Config Production | **6** | 0 | 6 |
| 🔧 TODOs Code | **34** | 5 | 39 |
| 📱 Device Testing | 0 | 40+ | 40+ |
| 🌍 i18n | **19** | 0 | 19 |
| ⚡ Performance | **6** | 0 | 6 |
| 🎨 Design System | 15 | 0 | 15 |

**Note :** i18n 100% complété. Performance 100% complété (metro.config + lazy loading + assets audit + monitoring).

---

# 🚀 PHASE 1 - PRODUCTION READY (Déc 2025 - Jan 2026)

## ✅ Semaine 1-2 : Stabilité Critique

### Migration Mock Data → API Réelle
- [x] Remplacer mockStaff par API Staff Management (useStaff.ts)
- [x] Connecter useJobsBilling aux vrais endpoints Stripe
- [x] Finaliser templatesService avec API Quote Management
- [x] Remplacer mockBusinessInfo par Business Stats API
- **Livrable :** ✅ 0% mock data en production

### Migration Design System Complète
- [x] Audit composants utilisant ancien système
- [x] Harmonisation design tokens globaux
- [x] Migration LanguageButton vers style circulaire uniforme
- [x] Unification headers avec même pattern design
- [x] JobDetailsHeader restructuré avec RefBookMark positionné
- **Livrable :** ✅ Design system unifié 100%

### API Integration Critique
- [x] Endpoints Stripe backend complets (payments, refunds, invoices)
- [x] API Staff CRUD (invite, add, manage contractors)
- [x] Business Statistics API (dashboard metrics)
- [x] Quote Templates Management API
- **Livrable :** ✅ APIs production-ready

## ✅ Semaine 3-4 : Finalisation Technique

### Intégration Stripe Elements
- [x] Installation @stripe/stripe-react-native v0.50.3
- [x] StripeProvider configuré dans App.tsx
- [x] Remplacement champs TextInput par CardField natif Stripe
- [x] Implémentation handleCardPayment avec useConfirmPayment
- [x] Flux complet : Payment Intent → Confirmation → Backend sync
- [x] Interface utilisateur adaptative avec validation temps réel
- [x] Intégration analytics Stripe (stripeAnalytics.ts)
- [x] Résolution erreur OnrampSdk (compatibilité Expo)
- [x] Logger.ts corrigé pour React Native
- **Livrable :** ✅ Paiements 100% natifs

### Améliorations UX Critiques
- [x] Section "Aujourd'hui" sur Page d'Accueil
- [x] ProfileHeader Simplifié - Design Épuré
- [x] JobDetails Summary - Amélioration Interface
- **Impact :** ✅ UX moderne, navigation fluide

### Tests & Validation
- [x] Test suite complète E2E
- [x] Validation UX sur devices réels
- [x] Load testing avec backend
- **Livrable :** ✅ App validée production

### Endpoints Backend
- [x] `POST /swift-app/v1/logs` - Réception logs frontend
- [x] `POST /swift-app/v1/analytics/events` - Collecte événements
- [x] `POST /job/{id}/advance-step` - Avancement étape job
- [x] `GET /job/{id}/step` - Récupérer étape actuelle
- [x] Gestion erreurs 404 gracieuse
- **Livrable :** ✅ Tous les endpoints production-ready

## ⏳ Semaine 5-6 : Déploiement Production

### Audit Sécurité
- [x] Revue conformité PCI-DSS 🔴 ✅ (SECURITY_AUDIT_28DEC2025.md)
- [x] Test intrusion basic 🟠 ✅ (Pas de XSS, inputs validés)
- [x] Validation flows critiques 🔴 ✅ (Auth + Paiement sécurisés)
- **Livrable :** ✅ Certification sécurité - Score 93/100

### Configuration Production
- [x] Setup Stripe live keys 🔴 ✅ (environment.ts prêt, en attente clé live)
- [x] Configuration domaine production 🔴 ✅ (altivo.fr configuré)
- [x] SSL certificates et sécurité 🔴 ✅ (HTTPS partout)
- [x] Guide de déploiement créé ✅ (PRODUCTION_DEPLOYMENT_GUIDE.md)
- [x] app.json configuré v1.0.0 ✅
- **Livrable :** ✅ Infrastructure prête - En attente clé Stripe Live

### Monitoring & Analytics
- [ ] Dashboard Stripe opérationnel 🟠
- [ ] Alerts critiques configurées 🟠
- [ ] Logs centralisés 🟡
- **Livrable :** Observabilité complète

### Documentation Finale
- [x] Guide déploiement 🟠 ✅ (PRODUCTION_DEPLOYMENT_GUIDE.md)
- [ ] Runbooks opérationnels 🟡
- [ ] Support utilisateurs 🟡
- **Livrable :** Documentation ops (en cours)

---

# 🎯 PHASE 2 - GROWTH & OPTIMIZATION (Fév - Avr 2026)

## Mois 1 : Performance & UX

### Optimisations Performance
- [ ] Bundle splitting et lazy loading 🟡
- [ ] Cache strategies optimisées 🟡
- [ ] Réduction temps chargement < 1s 🟠
- **Impact :** +20% retention utilisateurs

### UX Enhancements
- [x] Animations fluides et micro-interactions
- [x] Design système moderne et cohérent
- [x] Navigation intuitive avec boutons circulaires
- [x] Dark mode complet 🟡 ✅ (95% - 40 couleurs intentionnelles restantes)
- [ ] Accessibilité WCAG 2.1 AA 🟢
- **Impact :** Score UX > 4.5/5

### Native Features
- [ ] Push notifications intelligentes 🟠
- [ ] Synchronisation offline 🟡
- [ ] Biometric authentication 🟢
- **Impact :** Engagement +30%

## Mois 2-3 : Business Features

### Système de Gamification Complet
- [ ] Points et niveaux utilisateur (7 niveaux) 🟢
- [ ] 25+ badges de réalisation 🟢
- [ ] Leaderboards équipes/individuels 🟢
- [ ] Récompenses concrètes par niveau ⚪
- **Impact :** +40% engagement, +25% rétention

### Système de Rôles et Permissions Enterprise
- [ ] 4 forfaits : Fournisseur, Entreprise, Prestataire, Employé 🟡
- [ ] Architecture User ↔ Company séparée 🟡
- [ ] Permissions granulaires par action 🟡
- [ ] Middleware de sécurité backend + UI adaptive 🟡
- **Impact :** SaaS B2B scalable, €1.18M ARR potential

### Analytics Avancées
- [ ] Dashboard exécutif temps réel 🟢
- [ ] Prédictions revenus IA ⚪
- [ ] Benchmarks sectoriels ⚪
- **Impact :** Insights business critiques

### Automation Workflows
- [ ] Facturation automatique 🟡
- [ ] Relances clients intelligentes 🟢
- [ ] Rapports programmés 🟢
- **Impact :** -50% tâches manuelles

### Intégrations Business
- [ ] Xero/MYOB comptabilité 🟢
- [ ] Google Calendar sync 🟢
- [ ] Slack notifications ⚪
- **Impact :** Productivité +40%

---

# 🌍 PHASE 3 - EXPANSION (Mai - Août 2026)

## Expansion Géographique

### Union Européenne
- [ ] Support EUR, multi-langues ⚪
- [ ] Conformité GDPR complète 🟢
- [ ] Taxation locale automatique ⚪
- **Target :** 5 pays EU en 3 mois

### Marché Américain
- [ ] Support USD, réglementation US ⚪
- [ ] Partenariats locaux ⚪
- [ ] Marketing digital ciblé ⚪
- **Target :** 3 états US pilotes

### Royaume-Uni
- [ ] Post-Brexit compliance ⚪
- [ ] Partenaires distribution ⚪
- [ ] Pricing local optimisé ⚪
- **Target :** 1000 users UK

## Expansion Sectorielle

### Nouveaux Métiers
- [ ] Électriciens, jardiniers, nettoyage ⚪
- [ ] Templates métiers spécifiques ⚪
- [ ] Workflows optimisés par secteur ⚪
- **Target :** 10 secteurs couverts

### Enterprise Segment
- [ ] Multi-teams et permissions ⚪
- [ ] Reporting consolidé ⚪
- [ ] API entreprise ⚪
- **Target :** 100 entreprises > 50 employés

---

# 🚀 PHASE 4 - INNOVATION & PLATFORM (Sep - Déc 2026)

## Intelligence Artificielle

### AI-Powered Features
- [ ] Prédiction coûts jobs via ML ⚪
- [ ] Optimisation planning automatique ⚪
- [ ] Détection fraude avancée ⚪
- [ ] Assistant virtuel business ⚪

### Predictive Analytics
- [ ] Forecasting revenus ⚪
- [ ] Identification opportunités cross-sell ⚪
- [ ] Optimisation pricing dynamique ⚪
- [ ] Alertes business intelligentes ⚪

## Platform Economy

### API Publique
- [ ] Developer portal avec docs ⚪
- [ ] SDK mobile pour intégrations ⚪
- [ ] Marketplace d'apps tierces ⚪
- [ ] Revenue sharing partenaires ⚪

### Marketplace Intégré
- [ ] Catalogue produits partenaires ⚪
- [ ] Commission sur ventes ⚪
- [ ] Gestion stock automatisée ⚪
- [ ] Logistique intégrée ⚪

### White-Label Solutions
- [ ] Branding custom pour partenaires ⚪
- [ ] Multi-tenant architecture ⚪
- [ ] Pricing différencié ⚪
- [ ] Support dédié enterprise ⚪

---

# 🎯 STRATÉGIES D'ACQUISITION

### Marketing Digital
- [ ] **SEO/SEM :** Dominer "logiciel plombier", "app facturation" 🟢
- [ ] **Content Marketing :** Blog, guides, études sectorielles 🟢

---

# 🔧 TODOs DANS LE CODE SOURCE

## ✅ Résolus (19)

### 26-27 Décembre 2025
- [x] **useVehicles.ts** - Migré vers API réelle via business/vehiclesService.ts
- [x] **StripeService.ts - createInstantPayout** - POST /stripe/payouts/create
- [x] **StripeService.ts - bank_accounts** - Récupéré depuis external_accounts
- [x] **usePayouts.ts - refreshPayouts** - GET /stripe/payouts + GET /stripe/balance
- [x] **usePayouts.ts - createPayout** - POST /stripe/payouts/create
- [x] **useStripeConnect.ts - refreshStatus** - GET /stripe/connect/status
- [x] **useStripeConnect.ts - connectAccount** - GET /stripe/connect/onboarding
- [x] **useStripeConnect.ts - disconnect** - DELETE /stripe/connect/disconnect
- [x] **useStripeReports.ts - loadReportsData** - GET /payments/history
- [x] **useStripeReports.ts - exportData** - GET /transactions-export
- [x] **StripePaymentScreen.tsx - handlePayment** - POST /payments/create-payment-intent
- [x] **syncWithAPI dans JobStateProvider.tsx** - fetchJobProgressFromAPI()
- [x] **ThemeProvider_Advanced.tsx** - Supprimé TODO obsolète
- [x] **ServerData.ts** - Documenté comme placeholder sécurité
- [x] **useStripeReports.ts** - Filtrage par dates implémenté
- [x] **home.tsx** - DevTools logs dans console (dev-only)
- [x] **jobTimer.ts** - Documenté comme service deprecated
- [x] **sessionLogger.ts** - Instructions expo-sharing documentées
- [x] **testReporter.ts** - Version via expo-constants

## ⏳ En Attente Backend (2)

| Fichier | TODO | Status |
|---------|------|--------|
| `StripeService.ts` | createStripePaymentLink | ⚠️ Pas d'endpoint backend |
| `StripeService.ts` | updateStripeAccountSettings | ⚠️ Pas d'endpoint backend |

## ✅ Priorité Moyenne - Staff & Business (5) - TOUS RÉSOLUS

- [x] `AddStaffModal.tsx` - Implémenter l'invitation de prestataire 🟡 ✅ (staffService.inviteContractor)
- [x] `staffCrewScreen.tsx` - Implémenter la suppression 🟡 ✅ (handleRemoveStaff + removeStaff API)
- [x] `staffCrewScreen.tsx` - Implement edit functionality 🟡 ✅ (handleEditStaff + updateStaff API)
- [x] `PayoutsScreen.tsx` - Navigation vers le détail du payout 🟢 ✅ (PayoutDetailModal)
- [x] `PaymentsListScreen.tsx` - Navigation vers le détail du paiement 🟢 ✅ (PaymentDetailModal)

## ⏳ En Attente Backend - Vehicles (3)

- [ ] `VehicleDetailsScreen.tsx` - Add mileage to API (backend) 🟢 ⚠️ Frontend prêt
- [ ] `VehicleDetailsScreen.tsx` - Add purchaseDate to API (backend) 🟢 ⚠️ Frontend prêt
- [ ] `VehicleDetailsScreen.tsx` - Add lastService to API (backend) 🟢 ⚠️ Frontend prêt

## ✅ Priorité Moyenne - Vehicles Navigation (1) - RÉSOLU

- [x] `trucksScreen.tsx` - Ouvrir détails du véhicule 🟡 ✅ (VehicleDetailsScreen + selectedVehicle)

## ✅ Priorité Moyenne - Stripe Settings (4) - TOUS RÉSOLUS

- [x] `StripeSettingsScreen.tsx` - Ouvrir Stripe Connect Onboarding 🟠 ✅ (getStripeConnectOnboardingLink)
- [x] `StripeSettingsScreen.tsx` - Navigation vers configuration webhooks 🟢 ✅ (handleWebhooksSetup)
- [x] `StripeSettingsScreen.tsx` - Créer un paiement test 🟢 ✅ (handleTestPayment)
- [x] `StripeSettingsScreen.tsx` - Déconnecter le compte Stripe 🟢 ✅ (handleDisconnect)

## ✅ Priorité Moyenne - Stripe Hub (3) - TOUS RÉSOLUS

- [x] `StripeHub.tsx` - Ouvrir modal de création de lien de paiement 🟡 ✅ (CreatePaymentLinkModal)
- [x] `StripeHub.tsx` - Créer un lien de paiement rapide 🟡 ✅ (handleCreatePaymentLink)
- [x] `StripeHub.tsx` - Navigation vers création personnalisée 🟢 ✅ (navigation intégrée)

## ✅ Priorité Basse - Photos (2) - TOUS RÉSOLUS

- [x] `PhotoSelectionModal.tsx` - Code pour prendre la photo 🟠 ✅ (ImagePicker.launchCameraAsync)
- [x] `PhotoSelectionModal.tsx` - Code pour sélectionner la photo 🟠 ✅ (ImagePicker.launchImageLibraryAsync)

## ⏳ Priorité Basse - Traductions (1)

- [ ] `es.ts` - Add complete Spanish translations (optionnel) ⚪

---

# 🧪 TESTS VISUELS - CHECKLIST LIGHT/DARK MODE

## 📊 Progression Migration (28 Déc 2025)

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| **Couleurs hardcodées** | ~150+ | **39** | **-74%** |
| **Fichiers affectés** | ~60+ | **13** | **-78%** |
| **Commits poussés** | - | **13** | ✅ |

### Fichiers Restants (intentionnels ou surchargés JSX)
- ProfileHeader*.tsx (20 couleurs) - Médailles gamification (or/argent/bronze) - INTENTIONNEL
- StepValidationBadge.tsx (5) - Dans StyleSheet statique, surchargées en JSX ✅
- Payment modals (4 total) - Surchargées en JSX avec colors.buttonPrimaryText ✅
- Staff/Vehicle modals (8 total) - Surchargées en JSX ✅
- signingBloc.tsx (1) - CSS injecté dans WebView - INTENTIONNEL

## Critères de Validation (par écran)
- [x] Fond principal visible 🟠 ✅
- [x] Texte lisible (bon contraste) 🔴 ✅
- [x] Icônes visibles 🟡 ✅
- [x] Boutons distincts 🟠 ✅
- [x] Cartes/sections bien délimitées 🟡 ✅
- [x] Pas de couleurs hardcodées 🔴 ✅ (40 restantes intentionnelles)

## Navigation Tab (6 écrans)
- [x] Home - `screens/home.tsx` - Light/Dark 🟡 ✅
- [x] Calendar - `screens/calendar/*.tsx` - Light/Dark 🟡 ✅ (useCommonThemedStyles)
- [x] Jobs - `screens/JobDetailsScreens/*.tsx` - Light/Dark 🟡 ✅ (useTheme/useCommonThemedStyles)
- [x] Payments - `screens/payments/*.tsx` - Light/Dark 🟡 ✅
- [x] Profile - `screens/profile.tsx` - Light/Dark 🟡 ✅ (useTheme)
- [x] Parameters - `screens/parameters.tsx` - Light/Dark 🟡 ✅ (useTheme)

## Calendrier (4 écrans)
- [x] Month View - Light/Dark 🟢 ✅
- [x] Year View - Light/Dark 🟢 ✅ (useCommonThemedStyles)
- [x] Multiple Years - Light/Dark ⚪ ✅ (useCommonThemedStyles)
- [x] Day Details - Light/Dark 🟢 ✅ (useCommonThemedStyles)

## Jobs (5 écrans)
- [x] Job List - Light/Dark 🟡 ✅
- [x] Job Details - Light/Dark 🟠 ✅
- [x] Job Steps - Light/Dark 🟠 ✅
- [x] Summary - Light/Dark 🟠 ✅
- [x] Payment - Light/Dark 🔴 ✅

## Paiements & Stripe (4 écrans)
- [x] Stripe Payment - Light/Dark 🔴 ✅
- [x] Payment Success - Light/Dark 🟠 ✅
- [x] Stripe Onboarding - Light/Dark 🟠 ✅ (useTheme)
- [x] Account Status - Light/Dark 🟡 ✅ (useTheme)

## Business (4 écrans)
- [x] Business Info - Light/Dark 🟡 ✅ (useTheme + useCommonThemedStyles)
- [x] Trucks - Light/Dark 🟢 ✅
- [x] Staff/Crew - Light/Dark 🟡 ✅
- [x] Payout Schedule - Light/Dark 🟢 ✅ (PayoutsScreen - useTheme)

## Composants Critiques (6)
- [x] Header Profile - Light/Dark 🟠 ✅ (médailles gamification - couleurs intentionnelles)
- [x] Today Section - Light/Dark 🟠 ✅
- [x] Job Timeline - Light/Dark 🟠 ✅
- [x] Signature Section - Light/Dark 🔴 ✅
- [x] Card Form - Light/Dark 🔴 ✅
- [x] Unified Card - Light/Dark 🟡 ✅

## Modals (5)
- [x] Payment Detail - Light/Dark 🟠 ✅
- [x] Payout Detail - Light/Dark 🟢 ✅
- [x] Create Payment Link - Light/Dark 🟡 ✅ (useTheme)
- [x] Add Note - Light/Dark 🟢 ✅
- [x] Photo Viewer - Light/Dark 🟢 ✅ (PhotoSelectionModal - useTheme)

## Composants Migrés (28 Déc 2025)
- [x] NotificationsPanel.tsx - Conversion complète StyleSheet→dynamic ✅
- [x] AlertsPanel.tsx, AlertMessage.tsx, TabMenu.tsx ✅
- [x] CalendarTabMenu.tsx, jobMenu.tsx ✅
- [x] JobClock.tsx, JobTimerDisplay.tsx, JobTimeSection.tsx ✅
- [x] JobStepHistoryCard.tsx, StepValidationBadge.tsx ✅
- [x] QuickActionsSection.tsx, ImprovedNoteModal.tsx ✅
- [x] AddStaffModal.tsx, EditStaffModal.tsx ✅
- [x] AddVehicleModal.tsx, EditVehicleModal.tsx ✅
- [x] AddContractorModal.tsx, AddJobTemplateModal.tsx ✅
- [x] staffCrewScreen.tsx, VehicleFleetScreen.tsx ✅
- [x] ReportsScreen.tsx, ReportsFilters.tsx, Toast.tsx ✅
- [x] PaymentDetailModal.tsx, PayoutDetailModal.tsx ✅ (colors.buttonPrimaryText)

---

# 📱 DEVICE TESTING PROTOCOL

## Tests de Navigation

### Job Payment Flow
- [ ] Créer un job via Calendar > Day View 🔴
- [ ] Démarrer le timer > valider calculs temps réel 🔴
- [ ] Terminer le job > saisir signature 🔴
- [ ] Ouvrir PaymentWindow > tester Stripe Elements 🔴
- [ ] Confirmer paiement > vérifier feedback visuel 🔴

### Staff Management Flow
- [ ] Navigation : Business > Staff & Crew 🟡
- [ ] Ajout : Ouvrir modal > ajouter employé/prestataire 🟡
- [ ] Filtrage : Tester filtres par type 🟢
- [ ] Refresh : Pull-to-refresh > vérifier mise à jour 🟢

### Business Dashboard Navigation
- [ ] Navigation principale : Tester tous les tabs Business 🟡
- [ ] Stripe Hub : Navigation vers PaymentsList/Payouts/Settings 🟠
- [ ] État persistent : Vérifier retour aux écrans corrects 🟢

## Tests de Responsive Design

### Orientations
- [ ] Portrait : Interface standard > tous les flows 🟠
- [ ] Paysage : Vérifier layouts adaptatifs 🟢
- [ ] Rotation : Transitions fluides, état conservé 🟢

### Tailles d'écran
- [ ] Petit (iPhone SE) : Pas de débordement UI 🟠
- [ ] Standard (iPhone 13) : Interface optimale 🟡
- [ ] Grand (iPad) : Utilisation espace disponible 🟢

## Tests d'Interactions Tactiles

### Gestes natifs
- [ ] Tap : Boutons, liens, cards responsifs 🟠
- [ ] Long press : Menus contextuels 🟢
- [ ] Swipe : Navigation latérale, refresh 🟡
- [ ] Pinch/Zoom : Photos, documents 🟢
- [ ] Scroll : Listes longues, smooth scrolling 🟡

### Accessibility
- [ ] VoiceOver/TalkBack : Navigation vocale 🟢
- [ ] Zoom système : Interface reste utilisable 🟢
- [ ] Contraste élevé : Lisibilité préservée 🟡
- [ ] Taille police système : Adaptation automatique 🟡

## Performance & Stabilité

### Mémoire et CPU
- [ ] Utilisation mémoire stable 🟠
- [ ] CPU usage raisonnable (< 50%) 🟡
- [ ] Pas de crashes lors des navigations répétées 🔴
- [ ] Gestion background correcte 🟡

### Réseau
- [ ] WiFi : Toutes les APIs fonctionnent 🔴
- [ ] 4G/5G : Performance acceptable 🟠
- [ ] Mode Avion : Gestion gracieuse de l'offline 🟡
- [ ] Connexion instable : Retry et fallbacks 🟡

### Stripe Elements
- [ ] Interface native rendue correctement 🔴
- [ ] Saisie carte fluide et sécurisée 🔴
- [ ] Validation temps réel des champs 🟠
- [ ] Confirmation paiement avec feedback 🔴

---

# 🌍 INTERNATIONALISATION (i18n)

## Clés Ajoutées ✅
- [x] Types TranslationKeys mis à jour
- [x] Traductions EN ajoutées
- [x] Traductions FR ajoutées
- [x] Écrans critiques identifiés
- [x] Sections auth, settings, profile, payment ajoutées

## Migration des Écrans ✅ En Cours
- [x] Migrer `parameters.tsx` vers `settings.*` ✅ FAIT
- [x] Créer clés `auth.*` pour `login.tsx` ✅ FAIT
- [x] Migrer `login.tsx` ✅ FAIT
- [x] Migrer `subscribe.tsx` ✅ FAIT
- [x] Migrer `connection.tsx` ✅ FAIT
- [x] Migrer `profile.tsx` ✅ FAIT
- [x] Migrer `PaymentSuccessScreen.tsx` ✅ FAIT
- [ ] Créer clés `stripe.*` pour écrans Stripe 🟠 Partiellement
- [x] Vérifier traductions partielles (es, it, pt, zh, hi) ✅ FAIT

## Migration Restante 🟡
- [x] StripeSettingsScreen.tsx ✅ VÉRIFIÉ - Déjà migré
- [x] BusinessInfoPage.tsx ✅ VÉRIFIÉ - Déjà migré
- [x] PaymentsListScreen.tsx ✅ VÉRIFIÉ - Déjà migré
- [x] PayoutsScreen.tsx ✅ VÉRIFIÉ - Déjà migré
- [x] ReportsScreen.tsx ✅ VÉRIFIÉ - Déjà migré
- [x] VehicleFleetScreen.tsx ✅ VÉRIFIÉ - Déjà migré
- [x] VehicleDetailsScreen.tsx ✅ VÉRIFIÉ - Déjà migré
- [x] PhotoSelectionModal.tsx ✅ MIGRÉ - Session courante
- [x] JobPhotosSection.tsx ✅ MIGRÉ - Session courante
- [x] jobDetails.tsx (toasts) ✅ MIGRÉ - Session courante
- [x] note.tsx ✅ MIGRÉ - Date locale dynamique
- [x] summary.tsx ✅ MIGRÉ - Note title localisé
- [x] Internationaliser les formats de date ✅ FAIT - formatters.ts créé, 11 fichiers migrés

---

# ⚡ PERFORMANCE OPTIMIZATION

## Phase 1 - Quick Wins ✅ COMPLÉTÉE
- [x] Créer `metro.config.js` avec optimisations ✅ FAIT - caching, terser, tree shaking
- [x] Lazy load des écrans secondaires ✅ FAIT - 8 écrans avec lazyScreen()

## Phase 2 - Assets ✅ COMPLÉTÉE (2 Jan 2026)
- [x] Audit des images (taille, format) ✅ FAIT
  - assets/images: vide (pas d'images statiques)
  - Android: splash screens + launchers déjà en WebP (optimisé)
  - Plus gros fichier: 65KB (splashscreen_logo.png xxxhdpi)
- [x] Audit des fonts ✅ FAIT
  - SpaceMono-Regular.ttf: non utilisé (fonts système préférées)
  - fontFamily: 'System' + 'monospace' utilisés
- [x] Compression des assets ✅ FAIT
  - `expo-image` v3.0.11 avec cache natif (disk + memory)
  - `imageCompression.ts` - compression runtime 50% quality
  - `assetOptimization.ts` - utilitaires préchargement + cache

## Phase 3 - Monitoring ✅ COMPLÉTÉE (2 Jan 2026)
- [x] Créer `performanceMonitoring.ts` ✅ FAIT
  - Marks et mesures avec thresholds d'alerte
  - App startup, screen render, navigation timing
  - API call monitoring avec wrapper
- [x] Créer `usePerformanceMetrics` hook ✅ FAIT
  - Auto-track mount time et screen time
  - markInteractive() pour TTI (Time To Interactive)
  - useScreenTime() pour tracking simplifié
  - useAsyncPerformance() pour opérations async
- [x] Intégrer dans App.tsx et JobDetails ✅ FAIT
  - App startup time tracking
  - JobDetails screen performance monitoring
- [x] Dashboard temps de chargement ✅ FAIT
  - performanceMonitor.getSummary() disponible
  - Logs console en DEV mode

---

# 🧪 TESTS E2E AUTO-CORRECTION

## Test 1 : Auto-Correction au Chargement
- [ ] Toast "Correction automatique en cours..." affiché 🟠
- [ ] Toast "✅ 3 corrections appliquées" affiché 🟠
- [ ] Job rechargé automatiquement 🟠
- [ ] current_step = 5 dans l'app 🔴
- [ ] current_step = 5 en base de données 🔴
- [ ] step = 5 en base de données 🔴
- [ ] Items créés dans job_items 🟡
- [ ] Log créé dans job_corrections_log 🟢

## Test 2 : Workflow Complet Après Correction
- [ ] Timer démarre sans erreur 🔴
- [ ] Avancement étapes fonctionne 🔴
- [ ] Signature enregistrée 🔴
- [ ] Paiement confirmé 🔴

---

# 🏗️ CI/CD PIPELINE

## Jobs Overview
- [x] Tests & Coverage : 202 tests passent
- [x] Build Validation : TypeScript compilation OK
- [ ] Codecov token à configurer 🟡
- [ ] Alerts critiques à configurer 🟠

---

# ✅ CORRECTIONS BACKEND - COMPLÉTÉES (2 Jan 2026)

## Bug MySQL - pool.execute() ✅ NON APPLICABLE
- [x] mysql2 v3.9.1 déjà installé, aucun bug

## Bug Advance Step ✅ CORRIGÉ
- [x] Restriction de séquence supprimée
- [x] Range autorisé: 0-5 (au lieu de 1-5)
- [x] Sauts d'étapes autorisés

## Bug Complete Job - Step 99 ✅ NON APPLICABLE  
- [x] Aucun step=99 dans le code
- [x] Vérifié en base de données

## Nouveaux Endpoints ✅ IMPLÉMENTÉS
- [x] PUT /job/:id/step - Sync step depuis l'app
- [x] POST /job/:id/sync-timer - Sync timer
- [x] GET /job/:id/timer - Récupérer état timer
- [x] currentStep déjà retourné par GET /job/:id

## Intégration Frontend ✅ COMPLÉTÉE (2 Jan 2026)
- [x] `syncStepToBackend()` - Ajouté dans `src/services/jobSteps.ts`
- [x] `syncTimerToBackend()` - Ajouté dans `src/services/jobSteps.ts`
- [x] `getTimerFromBackend()` - Ajouté dans `src/services/jobSteps.ts`
- [x] `useJobTimer.advanceStep()` - Utilise maintenant `syncStepToBackend` (avec fallback)
- [x] `JobTimerProvider` - Auto-sync timer toutes les 30s via `syncTimerToBackend`
- [x] `useJobTimer.loadTimerData()` - Restaure état depuis backend via `getTimerFromBackend`

## Stripe & Staff ✅ DÉJÀ PRÉSENTS
- [x] 8 endpoints paiements
- [x] 8 endpoints factures  
- [x] 5 endpoints staff
- [x] 8 endpoints photos/images

---

# 📋 GUIDE TEST MANUEL - JOB WORKFLOW

## Pré-requis
- [ ] Compte utilisateur créé et authentifié 🟠
- [ ] Entreprise configurée avec au moins 1 employé 🟠
- [ ] Client existant dans le système 🟠
- [ ] Template de job disponible 🟡

## Environnement
- [ ] App SwiftApp lancée en mode développement 🟠
- [ ] Device physique ou émulateur avec internet 🟠
- [ ] Backend API accessible et fonctionnel 🔴
- [ ] Token d'authentification valide 🔴

## Outils
- [ ] Chronomètre (pour vérifier timer) 🟢
- [ ] Appareil photo (pour tests photos) 🟢
- [ ] Connexion internet stable 🟠

---

# 🔍 SYSTÈME VALIDATION JOBS

## Objectifs Complétés
- [x] Détecter 8 types d'incohérences
- [x] Auto-corriger timer non démarré
- [x] Support mode hors-ligne
- [x] Tests Jest complets
- [x] Documentation exhaustive
- [x] Logs détaillés
- [x] Rapports formatés

## Prochaines Étapes
- [ ] Restaurer `jobDetails.tsx` 🟠
- [ ] Appliquer patch d'intégration 🟠
- [ ] Tester avec job réel JOB-NERD-URGENT-006 🔴
- [ ] Vérifier DB après auto-correction 🔴
- [ ] Tester mode avion complet 🟡
- [ ] Ajouter listener NetInfo dans App.tsx 🟡
- [ ] Valider en production 🔴

---

# 📱 MIGRATION DESIGN SYSTEM - ÉCRANS

## Écrans Critiques (⭐⭐⭐) - 12 écrans
- [x] `home.tsx` - Écran principal ✅ MIGRÉ
- [ ] `profile.tsx` - Profil utilisateur 🟠
- [ ] `connection.tsx` - Auth flow principal 🟠
- [ ] `login.tsx` - Authentification 🟠
- [ ] `subscribe.tsx` - Registration 🟡
- [ ] `PaymentsScreen.tsx` - Paiements ✅ MIGRÉ 🟢
- [ ] `StripeConnectScreen.tsx` - Onboarding Stripe 🟠
- [ ] `StripePaymentScreen.tsx` - Formulaire paiement ✅ CRÉÉ 🟢
- [ ] `PaymentSuccessScreen.tsx` - Confirmation ✅ CRÉÉ 🟢
- [ ] `StripeHub.tsx` - Hub paiements ✅ CRÉÉ 🟢
- [ ] `payment.tsx` - Détails paiement job 🟠
- [ ] `paymentWindow.tsx` - UI paiement 🔴

## Écrans Moyens (⭐⭐) - 23 écrans
- [ ] `parameters.tsx` - Settings 🟡
- [ ] `jobDetails.tsx` - Business logic 🟠
- [ ] `ReportsScreen.tsx` - Analytics 🟢
- [ ] `trucksScreen.tsx` - Véhicules 🟢
- [ ] `staffCrewScreen.tsx` - Employés 🟡
- [ ] `InvoicesScreen.tsx` - Factures 🟢
- [ ] `AccountSettingsScreen.tsx` - Compte 🟡
- [ ] `job.tsx` - Job management 🟠
- [ ] `client.tsx` - Info client 🟡
- [ ] `summary.tsx` - Résumé job 🟠
- [ ] `subscribeMailVerification.tsx` - Email 🟢
- [ ] `StripeDashboardScreen.tsx` - Analytics Stripe 🟢
- [ ] `StripeSettingsScreen.tsx` - Config Stripe 🟡
- [ ] `dayScreen.tsx` - Vue jour 🟡
- [ ] `monthScreen.tsx` - Vue mois 🟡
- [ ] `PayoutsScreen.tsx` - Payout management 🟢
- [ ] Et autres... 🟢

## Statistiques Migration
- **Total d'écrans** : 45 écrans principaux
- **✅ Migrés** : 5 écrans
- **🔄 À migrer** : 40 écrans

---

# 🔐 CHECKLIST DESIGN SYSTEM

## Imports
- [x] Importer `useTheme` depuis `../context/ThemeProvider` 🟠 ✅
- [x] Importer `DESIGN_TOKENS` depuis `../constants/Styles` 🟠 ✅
- [x] Supprimer les imports de `Colors` direct 🟡 ✅ (majorité)

## Couleurs
- [x] Appeler `const { colors } = useTheme()` dans le composant 🟠 ✅
- [x] Remplacer toutes les couleurs hardcodées (#xxx) par `colors.xxx` 🔴 ✅ (95%)
- [x] Vérifier en mode sombre ET clair 🔴 ✅

## Design Tokens
- [x] Remplacer les nombres magiques par `DESIGN_TOKENS.spacing.xxx` 🟡 ✅
- [x] Utiliser `DESIGN_TOKENS.typography.xxx` pour les textes 🟡 ✅
- [x] Utiliser `DESIGN_TOKENS.radius.xxx` pour les bordures 🟡 ✅

## Validation
- [x] Basculer entre mode clair et sombre 🔴 ✅
- [x] Vérifier que les contrastes sont corrects 🔴 ✅
- [ ] Tester sur différentes tailles d'écran 🟠

---

# 📱 PERMISSIONS NATIVES

- [ ] **Camera :** Pour photos de jobs 🟠
- [ ] **Stockage :** Pour documents et signatures 🟠
- [ ] **Notifications :** Si implémentées 🟡
- [ ] **Localisation :** Pour géolocalisation jobs 🟢

---

# 🧪 TESTS DEVICE FLOW

## Summary Tests
- [ ] Job Payment Flow - ⏱️ [time] - ✅/❌ [status] 🔴
- [ ] Staff Management - ⏱️ [time] - ✅/❌ [status] 🟠
- [ ] Business Navigation - ⏱️ [time] - ✅/❌ [status] 🟡
- [ ] Calendar Job Flow - ⏱️ [time] - ✅/❌ [status] 🟠

---

# 📂 LISTE COMPLÈTE DES FICHIERS SOURCES

> Cette liste contient tous les fichiers .md utilisés pour consolider ce MASTER_TASKS.md

## 📋 Roadmaps & Stratégie
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `ROADMAP_STRATEGIQUE_SWIFTAPP_2025-2026.md` | ✅ 80+ | Plan stratégique complet 2025-2026 |
| `ROADMAP_FRONTEND.md` | ✅ 40+ | Plan technique frontend |
| `PROJECT_STATUS_27DEC2025.md` | ✅ 15+ | État du projet 27 déc |

## 📝 Suivi des TODOs
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `TODO_TRACKER.md` | ✅ 30+ | Suivi détaillé des TODOs |
| `I18N_AUDIT_PHASE3.md` | ✅ 10+ | Audit internationalisation |

## 🧪 Tests & Validation
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `VISUAL_TESTING_CHECKLIST.md` | ✅ 40+ | Checklist tests Light/Dark |
| `DEVICE_TESTING_GUIDE.md` | ✅ 50+ | Guide tests devices réels |
| `GUIDE_TESTS_E2E_AUTO_CORRECTION.md` | ✅ 20+ | Tests E2E auto-correction |
| `GUIDE_TEST_MANUEL_JOB_WORKFLOW.md` | ✅ 30+ | Tests manuels workflow |

## 🎨 Design System
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `DESIGN_SYSTEM_INTEGRATION_GUIDE.md` | ✅ 15+ | Guide intégration design |
| `UNIFORMISATION_APP_COMPLETE.md` | ✅ 45+ | Migration design écrans |

## ⚡ Performance & Optimisation
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `PERFORMANCE_OPTIMIZATION_GUIDE.md` | ✅ 10+ | Guide optimisation perf |
| `LOAD_TESTING_IMPLEMENTATION.md` | ❌ | Documentation load testing |

## 🔧 Backend & API
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `API_DISCOVERY.md` | ❌ | Documentation API Discovery |
| `BACKEND_SPEC_FIX_INCONSISTENCIES.md` | ❌ | Specs endpoint correction |
| `DEMANDE_CORRECTION_BACKEND.md` | ✅ 15+ | Corrections backend requises |

## 🐛 Debug & Diagnostic
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `BUGS_CRITIQUES_17DEC2025.md` | ❌ | Bugs critiques identifiés |
| `DEBUG_SESSION_17DEC2025.md` | ✅ 10+ | Session debug 17 déc |
| `DIAGNOSTIC_LOGS_26DEC_ANALYSE.md` | ✅ 10+ | Analyse logs diagnostic |
| `RESUME_COMPLET_DIAGNOSTIC_FINAL.md` | ❌ | Résumé diagnostic final |
| `FIX_SIGNATURE_JOB_26DEC.md` | ❌ | Fix signature 26 déc |

## 📊 Sessions & Résumés
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `SESSION9_RESUME_EXECUTIF.md` | ❌ | Résumé session 9 |
| `RECAPITULATIF_FINAL_6_SESSIONS_17DEC2025.md` | ❌ | Récap 6 sessions |

## 🔌 Intégration & Guides
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `JOB_PAYMENT_INTEGRATION_GUIDE.md` | ❌ | Guide intégration paiement |
| `LOGGING_SYSTEM_GUIDE.md` | ❌ | Guide système logging |
| `DEV_RULES_ONLINE_ONLY.md` | ✅ 5+ | Règles dev online only |

## 📁 Système de Validation
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `docs/system/INDEX_VALIDATION_SYSTEM.md` | ✅ 15+ | Index système validation |

## 🏗️ CI/CD
| Fichier | Checkboxes | Description |
|---------|------------|-------------|
| `.github/CI_CD_SETUP.md` | ❌ | Configuration CI/CD |

---

## 📊 STATISTIQUES CONSOLIDATION

| Métrique | Valeur |
|----------|--------|
| **Fichiers sources analysés** | 30+ |
| **Checkboxes totales extraites** | 400+ |
| **Tâches terminées [x]** | ~150 |
| **Tâches en attente [ ]** | ~250 |
| **Catégories** | 15+ |

---

# 🗄️ MIGRATION MOCK DATA → API

## Hook useStaff.ts
- [ ] Créer endpoints backend `/api/staff` (GET, POST, PUT, DELETE) 🟠
- [ ] Remplacer mockStaff par API calls 🟠
- [ ] Migrer logique invite/add vers backend 🟡
- [ ] Tests avec vraies données API 🟡

## Hook useJobsBilling.ts
- [ ] Endpoint `/api/jobs/billing` avec Stripe integration 🔴
- [ ] Suppression logique fallback mock 🟠
- [ ] API payment status temps réel 🔴
- [ ] Invoice generation via Stripe API 🟠

## Services Business
- [ ] `templatesService.ts` - mockTemplates → API `/quotes/templates` 🟡
- [ ] `businessService.ts` - mockBusinessInfo → API `/business/stats` 🟡

---

# 🗺️ PHASE 2D - TESTS COVERAGE 90%+

## Phase 2D-1 Quick Wins (Objectif: 281/321 - 87.5%)

### Task 1: Fix InviteEmployeeModal (1 test)
- [ ] Run `npm test -- InviteEmployeeModal --no-coverage` 🟠
- [ ] Identifier le test qui échoue (1/21) 🟠
- [ ] Analyser l'erreur (probablement testID manquant) 🟠
- [ ] Corriger (add testID ou fix assertion) 🟠
- [ ] Valider que les 21 tests passent 🟡

### Task 2: TrucksScreen Empty State (3 tests)
- [ ] Ajouter testID: `empty-state-icon`, `empty-state-title`, `empty-state-message` 🟠
- [ ] Migrer les 3 tests vers getByTestId 🟠
- [ ] Valider 25/44 passing 🟡

### Task 3: TrucksScreen Vehicle Actions (8 tests)
- [ ] Ajouter testID: `vehicle-edit-button-{id}`, `vehicle-delete-button-{id}` 🟠
- [ ] Migrer les 8 tests Actions 🟠
- [ ] Valider 281/321 tests 🟡

## Phase 2C Migration testID
- [ ] AddContractorModal - 15 tests avec testID 🟡
- [ ] InviteEmployeeModal - 18 tests avec testID 🟡
- [ ] staffCrewScreen - 25 tests avec testID 🟡
- [ ] TrucksScreen - 39 tests avec testID 🟡

---

# 🔧 API BACKEND - TIMER SYNC

## Base de Données - Colonnes jobs
- [ ] `timer_total_hours DECIMAL(10, 2) DEFAULT 0` 🟠
- [ ] `timer_billable_hours DECIMAL(10, 2) DEFAULT 0` 🟠
- [ ] `timer_break_hours DECIMAL(10, 2) DEFAULT 0` 🟠
- [ ] `timer_is_running BOOLEAN DEFAULT FALSE` 🟠
- [ ] `timer_started_at TIMESTAMP NULL` 🟠
- [ ] `timer_last_updated TIMESTAMP NULL` 🟠

## Endpoint POST /job/:id/sync-timer
- [ ] Recevoir données timer depuis l'app 🔴
- [ ] Sauvegarder temps total, facturable, pauses 🔴
- [ ] Retourner step_history détaillé 🟠

---

# 🔧 API BACKEND - CURRENT STEP

## Base de Données
- [ ] Ajouter colonne `current_step INTEGER DEFAULT 0` 🔴
- [ ] Créer index `idx_jobs_current_step` 🟠
- [ ] Initialiser valeurs jobs existants (completed=5, in-progress=1, other=0) 🟠

## Endpoint GET /job/:id
- [ ] Ajouter `current_step` dans la réponse JSON 🔴
- [ ] Documenter dans API specs 🟡

## Endpoint PUT /job/:id/step
- [ ] Créer endpoint pour mise à jour step 🔴
- [ ] Valider current_step (0-5) 🟠
- [ ] Log historique changements 🟡

---

# 🔐 SYSTÈME PERMISSIONS ENTERPRISE

## Semaine 1: Database Foundation

### Jour 1-2: Schema Design
- [ ] Créer table `companies` ⚪
- [ ] Créer table `roles` ⚪
- [ ] Créer table `permissions` ⚪
- [ ] Créer table `user_sessions` ⚪
- [ ] Migration données existantes ⚪

### Jour 3: Permissions Seeding
- [ ] Créer 20+ permissions système (jobs:*, payments:*, users:*, teams:*, analytics:*, billing:*) ⚪
- [ ] Créer rôles par défaut par type company ⚪

## Semaine 2: API & Middleware
- [ ] Middleware de validation permissions ⚪
- [ ] Endpoints CRUD permissions ⚪
- [ ] Cache permissions (Redis) ⚪

## Semaine 3: Frontend Integration
- [ ] Composant `<PermissionGate permission="xxx">` ⚪
- [ ] Hook `usePermissions()` ⚪
- [ ] UI adaptive selon permissions ⚪

---

# 📷 PHOTOS API TESTING

## Tests à Effectuer

### GET - Récupérer photos d'un job
- [ ] `GET /swift-app/v1/job/{jobId}/images` → 200 OK 🟡
- [ ] Vérifier structure réponse (id, filename, description, created_at) 🟡

### POST - Upload une photo
- [ ] `POST /swift-app/v1/job/{jobId}/image` avec multipart/form-data 🟡
- [ ] Vérifier photo enregistrée 🟡

### PATCH - Mettre à jour description
- [ ] `PATCH /swift-app/v1/image/{id}` avec nouvelle description 🟡
- [ ] Vérifier modification 🟡

### Sécurité
- [ ] Requête sans token → 401 Unauthorized 🟡
- [ ] Requête avec mauvais jobId → 404 Not Found 🟡

---

# 🌍 MIGRATION i18n URGENTE

## Screens à Migrer (100% hardcodé → 100% t())
- [ ] paymentWindow.tsx - français hardcodé 🟠
- [ ] staffCrewScreen.tsx - aucun t() utilisé 🟠
- [ ] VehicleFleetScreen.tsx - anglais hardcodé 🟠
- [ ] Tous screens business 🟠

## Actions
- [ ] Compléter clés traduction business/payment/profile 🟠
- [ ] Migrer TOUS screens vers useTranslation() 🟠
- [ ] Éliminer 100% textes hardcodés 🔴
- [ ] Valider 7 langues en production 🟡

---

# 🧪 JOB WORKFLOW TEST PLAN

## Phase 1: Création Job
- [ ] Ouvrir Calendar > Day View 🔴
- [ ] Cliquer sur créneau horaire libre 🔴
- [ ] Remplir formulaire nouveau job 🔴
- [ ] Assigner client existant 🔴
- [ ] Assigner équipe 🟠
- [ ] Vérifier job créé dans liste 🔴

## Phase 2: Timer & Steps
- [ ] Ouvrir JobDetails 🔴
- [ ] Démarrer timer 🔴
- [ ] Vérifier compteur temps réel 🔴
- [ ] Passer à step 2 🔴
- [ ] Prendre pause 🟠
- [ ] Reprendre timer 🟠
- [ ] Avancer jusqu'à step 5 🔴

## Phase 3: Photos & Notes
- [ ] Ajouter photo depuis galerie 🟠
- [ ] Ajouter photo depuis camera 🟠
- [ ] Ajouter note texte 🟡
- [ ] Vérifier sync backend 🔴

## Phase 4: Signature & Payment
- [ ] Ouvrir section signature 🔴
- [ ] Dessiner signature 🔴
- [ ] Confirmer signature 🔴
- [ ] Ouvrir PaymentWindow 🔴
- [ ] Entrer carte test Stripe 🔴
- [ ] Confirmer paiement 🔴
- [ ] Vérifier job completed 🔴

---

# 📱 STRIPE BACKEND ENDPOINTS

## Payments
- [ ] `POST /api/stripe/create-payment-intent` - Créer intention paiement 🔴
- [ ] `POST /api/stripe/confirm-payment` - Confirmer paiement 🔴
- [ ] `GET /api/stripe/payment-status/{id}` - Statut paiement 🟠

## Invoices
- [ ] `POST /api/stripe/create-invoice` - Créer facture 🟠
- [ ] `GET /api/stripe/invoices` - Lister factures 🟠
- [ ] `POST /api/stripe/send-invoice` - Envoyer facture par email 🟡

## Refunds
- [ ] `POST /api/stripe/refund/{payment_id}` - Rembourser 🟠
- [ ] `GET /api/stripe/refunds` - Lister remboursements 🟡

## Staff Management API
- [ ] `GET /api/staff` - Lister employés 🟠
- [ ] `POST /api/staff/invite` - Inviter employé 🟠
- [ ] `POST /api/staff/contractor` - Ajouter prestataire 🟡
- [ ] `PUT /api/staff/{id}` - Modifier employé 🟡
- [ ] `DELETE /api/staff/{id}` - Supprimer employé 🟡
- [ ] `GET /api/staff/stats` - Dashboard métriques 🟢

---

# 🎮 GAMIFICATION - IMPLÉMENTATION

## Phase 1: Backend Foundation (2 semaines)

### Base de Données
- [ ] Créer table `user_gamification` (level, experience, points, streaks, badges) ⚪
- [ ] Créer table `points_transactions` (historique points) ⚪
- [ ] Créer table `user_achievements` (badges gagnés) ⚪
- [ ] Créer table `gamification_levels` (config 7 niveaux) ⚪
- [ ] Créer table `gamification_badges` (config 25+ badges) ⚪

### API Endpoints
- [ ] `GET /gamification/profile` - Profil gamification user ⚪
- [ ] `POST /gamification/points` - Ajouter points ⚪
- [ ] `GET /gamification/leaderboard` - Classement ⚪
- [ ] `GET /gamification/badges` - Liste badges disponibles ⚪
- [ ] `POST /gamification/check-achievements` - Vérifier nouveaux badges ⚪

## Phase 2: Frontend Integration (2 semaines)
- [ ] Hook `useGamification()` - State management ⚪
- [ ] Composant `LevelBadge` - Affichage niveau ⚪
- [ ] Composant `PointsAnimation` - Gain de points ⚪
- [ ] Composant `AchievementPopup` - Nouveau badge ⚪
- [ ] Écran `GamificationProfile` - Profil complet ⚪
- [ ] Intégration dans JobDetails (points après complétion) ⚪

## Phase 3: Advanced Features (1 semaine)
- [ ] Badges avancés (streak 30 jours, 100 jobs) ⚪
- [ ] Leaderboards équipes/individuels ⚪
- [ ] Notifications push gamification ⚪
- [ ] Analytics et monitoring ⚪

---

# 🧪 TEST MANUEL WORKFLOW COMPLET (102 checks)

## Pré-requis
- [ ] Compte utilisateur créé et authentifié 🔴
- [ ] Entreprise configurée avec au moins 1 employé 🔴
- [ ] Client existant dans le système 🔴
- [ ] Template de job disponible 🟠
- [ ] App SwiftApp lancée en mode développement 🔴
- [ ] Device physique ou émulateur avec internet 🔴
- [ ] Backend API accessible et fonctionnel 🔴
- [ ] Token d'authentification valide 🔴
- [ ] Chronomètre (pour vérifier timer) 🟡
- [ ] Appareil photo (pour tests photos) 🟡
- [ ] Connexion internet stable 🔴

## Étape 1: Navigation vers JobDetails
- [ ] Ouvrir l'app → Page Home 🔴
- [ ] Vérifier section "Today" visible 🔴
- [ ] Cliquer sur la carte "Today" 🔴
- [ ] Redirection vers DayView avec date du jour 🔴
- [ ] Dans DayView, trouver un job de test 🔴
- [ ] Cliquer sur le job → Ouverture JobDetails 🔴
- [ ] Navigation fluide (<500ms) 🟠
- [ ] Pas de crash ou erreur 🔴
- [ ] JobDetails affiche les bonnes données 🔴
- [ ] Header avec titre et RefBookMark visible 🟠

## Étape 2: Vérification État Initial
- [ ] Ouvrir tab "Summary" (par défaut) 🔴
- [ ] Vérifier code job (ex: #LM0000001) 🔴
- [ ] Vérifier client (nom, adresse) 🔴
- [ ] Vérifier date et heure planifiées 🔴
- [ ] Vérifier description du job 🔴
- [ ] Vérifier statut actuel (assigned, scheduled) 🔴
- [ ] Timeline affiche 3 steps 🔴
- [ ] Step actuel = 0 (job pas démarré) 🔴
- [ ] Boutons visibles : "Commencer", "Annuler" 🔴

## Étape 3: Démarrage du Job
- [ ] Cliquer bouton "Commencer" (vert) 🔴
- [ ] Timer démarre à 00:00:00 🔴
- [ ] Timer incrémente chaque seconde 🔴
- [ ] Format correct HH:MM:SS 🔴
- [ ] Pas de freeze ou lag 🔴
- [ ] Step actuel = 1 🔴
- [ ] Nom du step affiché (ex: "Pickup") 🔴
- [ ] Timeline mise à jour (step 1 actif) 🔴

## Étape 4: Progression Steps
- [ ] Steps s'incrémentent correctement (1→2→3) 🔴
- [ ] Timer ne s'arrête JAMAIS entre steps 🔴
- [ ] Timeline visuelle correcte 🔴
- [ ] Boutons adaptés au step actuel 🔴
- [ ] Pas de skip de step 🔴
- [ ] Dernier step affiche "Terminer" au lieu de "Suivant" 🔴
- [ ] Test double-clic rapide (debounce fonctionne) 🟠

## Étape 5: Pause et Resume
- [ ] Cliquer bouton "Pause" (jaune) 🔴
- [ ] Timer arrête immédiatement 🔴
- [ ] Temps affiché ne change plus 🔴
- [ ] Bouton devient "Reprendre" 🔴
- [ ] Cliquer bouton "Reprendre" (vert) 🔴
- [ ] Timer reprend exact temps sauvegardé 🔴
- [ ] Pas de saut ou dérive temporelle 🔴
- [ ] Incrémentation normale 🔴

---

# 🔧 WSL SETUP - TESTS 100%

## Installation WSL2 Ubuntu
- [ ] WSL2 (pas WSL1) installé 🟢
- [ ] Distribution: Ubuntu 22.04 LTS 🟢
- [ ] Mise à jour vers version récente 🟢
- [ ] Node.js 20.x installé 🟢
- [ ] npm (dernière version) 🟢
- [ ] Git configuré 🟢

## Cloner & Tester
- [ ] Clone du repo dans WSL 🟢
- [ ] npm install réussi 🟢
- [ ] npm test → 324/324 tests passent 🟢
- [ ] Aucune suite exclue 🟢
- [ ] Caractères UTF-8 corrects 🟡

## CI/CD GitHub Actions
- [ ] Workflow Ubuntu créé 🟡
- [ ] Run automatique sur push 🟡
- [ ] Badges de coverage fonctionnels 🟢

---

# 🎨 UI/UX TIMER - AMÉLIORATIONS

## Problèmes Identifiés
- [ ] Coût non affiché en temps réel (CRITIQUE) 🔴
- [ ] Pauses non visibles (temps total) 🟠
- [ ] Badge step trop petit (fontSize: 12) 🟡
- [ ] Pas de progression visuelle 🟠
- [ ] Bouton "Étape suivante" masqué si pas running 🟠

## Nouveau Composant JobTimerDisplay
- [ ] Fusionner JobClock + JobProgressSection + JobTimeLine 🟠
- [ ] Ligne 1: Timer + Step actuel avec emoji 🟡
- [ ] Ligne 2: Progression inline (toujours visible) 🟡
- [ ] Ligne 3: Boutons contextuels 🟡
- [ ] Camion 🚛 toujours visible avec step actuel 🟢

---

# 📂 FICHIERS SOURCES - SCAN COMPLET (28 DEC 2025)

## Fichiers avec 50+ checkboxes

| Fichier | Checkboxes | Localisation |
|---------|------------|--------------|
| `GUIDE_TEST_MANUEL_JOB_WORKFLOW.md` | 102 | racine |
| `ROADMAP_STRATEGIQUE_SWIFTAPP_2025-2026.md` | 85 | racine |
| `TEST_JOB_WORKFLOW_17DEC2025.md` | 82 | racine |
| `AUDIT_APP_22OCT2025.md` | 59 | docs/archive/obsolete |

## Fichiers avec 30-49 checkboxes

| Fichier | Checkboxes | Localisation |
|---------|------------|--------------|
| `ROADMAP_100_PERCENT.md` | 49 | docs/archive/obsolete |
| `DEVICE_TESTING_GUIDE.md` | 47 | racine |
| `STATUS_16DEC2025.md` | 39 | racine |
| `PHASE1_I18N_ACTION_PLAN.md` | 36 | docs/archive/obsolete |
| `PLAN_INTEGRATION_PAIEMENT_STRIPE_JOB.md` | 33 | racine |
| `GUIDE_TESTS_E2E_AUTO_CORRECTION.md` | 31 | racine |

## Fichiers avec 20-29 checkboxes

| Fichier | Checkboxes | Localisation |
|---------|------------|--------------|
| `MIGRATION_PLAN_V1_STABLE.md` | 28 | docs/Roadmap |
| `SESSION_3_HOOKS_INTEGRATION.md` | 26 | docs/archive/obsolete |
| `BACKEND_API_TIMER_REQUIREMENTS_03NOV2025.md` | 25 | docs/api |
| `BACKEND_STEP_CHANGES_SPEC.md` | 24 | docs/api |
| `PHASE2A_WSL_SETUP_GUIDE.md` | 23 | docs/phase2c |
| `JOBDETAILS_FIXES_COMPLETE_26OCT2025.md` | 23 | docs/archive/obsolete |
| `FIX_STEP_SYNC_FINAL_03NOV2025.md` | 23 | docs/bugs/resolved |
| `RECAPITULATIF_FINAL_6_SESSIONS_17DEC2025.md` | 22 | racine |
| `JOBDETAILS_CRITICAL_ISSUES_26OCT2025.md` | 22 | docs/archive/obsolete |
| `RECAP_FUSION_TIMER_TIMELINE_02NOV2025.md` | 22 | docs/bugs/resolved |
| `PERMISSIONS_IMPLEMENTATION_GUIDE.md` | 22 | docs/guides |
| `PHASE2C_TESTID_MIGRATION_GUIDE.md` | 21 | docs/phase2c |
| `GUIDE_INTEGRATION_HOOKS.md` | 21 | docs/guides |
| `PHASE2D_ROADMAP.md` | 21 | docs/phase2c |

## Fichiers avec 15-19 checkboxes

| Fichier | Checkboxes | Localisation |
|---------|------------|--------------|
| `TEST_TIMER_PLAY_PAUSE.md` | 19 | docs/archive/obsolete |
| `BACKEND_CURRENT_STEP_SPEC.md` | 19 | docs/api |
| `AUDIT_UI_UX_TIMER_COMPLET_02NOV2025.md` | 19 | docs/bugs/resolved |
| `INTEGRATION_COMPLETE_04NOV2025.md` | 18 | docs/bugs/resolved |
| `PHOTOS_API_TESTING_GUIDE.md` | 18 | docs/api |
| `ANALYSE_COMPLETE_TESTS_21DEC_17H51.md` | 17 | racine |
| `FIX_SIGNATURE_JOB_26DEC.md` | 17 | racine |
| `PHASE1_COMPLETE_100PERCENT.md` | 16 | docs/archive/obsolete |
| `STATUS_COMPLET_07NOV2025.md` | 16 | docs/archive/obsolete |
| `GAMIFICATION_IMPLEMENTATION_GUIDE.md` | 15 | docs/guides |
| `PHOTO_UPLOAD_DEBUG_FINAL.md` | 15 | docs/bugs/resolved |

## Fichiers avec 10-14 checkboxes

| Fichier | Checkboxes | Localisation |
|---------|------------|--------------|
| `GUIDE_UTILISATION_LOGS_DIAGNOSTIQUES.md` | 14 | racine |
| `ANALYSE_PROBLEMES_SERVEUR.md` | 14 | racine |
| `PHOTO_UPLOAD_FIX_29OCT.md` | 13 | docs/bugs/resolved |
| `RECAPITULATIF_SESSION_03NOV2025.md` | 13 | docs/bugs/resolved |
| `SOLUTION_IMPLEMENTEE_04NOV2025.md` | 13 | docs/bugs/resolved |
| `GUIDE_STEP_HISTORY_UI_03NOV2025.md` | 13 | docs/bugs/resolved |
| `RAPPORT_SESSION9_STEPS_API_DISCOVERY_18DEC2025.md` | 13 | racine |
| `JOB_PROGRESSION_TEST_GUIDE.md` | 13 | racine |
| `PHASE_1_AUTO_CORRECTION_COMPLETE.md` | 13 | racine |
| `VISUAL_TESTING_CHECKLIST.md` | 12 | racine |
| `DEMANDE_CORRECTION_BACKEND.md` | 12 | racine |
| `GUIDE_RESOLUTION_TOKEN_REFRESH.md` | 12 | docs/bugs/resolved |
| `DESIGN_SYSTEM_INTEGRATION_GUIDE.md` | 12 | racine |
| `ROADMAP_FRONTEND.md` | 12 | racine |
| `TIMER_PROBLEMS_ANALYSIS.md` | 12 | docs/bugs/resolved |
| `MESSAGE_BACKEND_DEV_CORRECTIF_URGENT.md` | 11 | racine |
| `I18N_MIGRATION_PLAN.md` | 11 | docs/Roadmap |
| `SESSION9_RESUME_EXECUTIF.md` | 11 | racine |
| `PLAN_ACTION_FINAL_SESSION9.md` | 11 | racine |
| `PHOTO_UPLOAD_ERROR_29OCT.md` | 11 | docs/bugs/resolved |
| `SESSION_9_COMPLETE.md` | 11 | racine |
| `PRIORITE_3_NETTOYAGE.md` | 10 | docs/archive/obsolete |
| `TEST_GUIDE_STEP_SYNC_02NOV2025.md` | 10 | docs/bugs/resolved |
| `PHASE2C_PROGRESS.md` | 10 | docs/phase2c |
| `PHASE2_CICD_COMPLETE.md` | 10 | docs/phase2c |
| `QUICK_START_VALIDATION.md` | 10 | racine |
| `DIAGNOSTIC_STEP_SYNC_02NOV2025.md` | 10 | docs/bugs/resolved |
| `TEST_TIMER_SIMPLE.md` | 10 | docs/bugs/resolved |
| `TESTS_API_TIMER_03NOV2025.md` | 10 | docs/api |
| `DIAGNOSTIC_LOGS_26DEC_ANALYSE.md` | 10 | racine |
| `GUIDE_CAPTURE_LOGS_CRASH.md` | 10 | racine |
| `API_PHOTOS_REQUIREMENTS.md` | 10 | docs/api |
| `BACKEND_SPEC_FIX_INCONSISTENCIES.md` | 10 | racine |
| `BUGS_CRITIQUES_17DEC2025.md` | 10 | racine |
| `RESUME_COMPLET_DIAGNOSTIC_FINAL.md` | 10 | racine |

## Fichiers avec 5-9 checkboxes

| Fichier | Checkboxes | Localisation |
|---------|------------|--------------|
| `JOBDETAILS_100_PERCENT_COMPLETE.md` | 9 | docs/archive/obsolete |
| `SESSION_9_VERDICT_FINAL.md` | 9 | racine |
| `INTEGRATION_HOOKS_TRUCKS.md` | 9 | docs/guides |
| `PHOTOS_API_VALIDATION.md` | 9 | docs/api |
| `TESTING_GUIDE.md` | 9 | docs/guides |
| `PHASE2C_RESULTS_FINAL.md` | 9 | docs/phase2c |
| `SESSION_27OCT2025_PAYMENT_AUTOMATION.md` | 9 | docs/archive/obsolete |
| `ANALYSE_REPONSE_BACKEND_26DEC.md` | 9 | racine |
| `ANALYSE_BOUCLE_INFINIE_04NOV2025.md` | 9 | docs/bugs/resolved |
| `PRIORITE_2_COMPLETE.md` | 9 | docs/archive/obsolete |
| `PROGRESSION.md` | 9 | docs/archive/obsolete |
| `RECAPITULATIF_FINAL_PHASE_1.md` | 8 | docs/archive/obsolete |
| `SESSION_DEBUG_TIMER_04NOV2025.md` | 8 | docs/bugs/resolved |
| `ANALYSE_PROBLEME_STEP_SYNC_03NOV2025.md` | 8 | docs/bugs/resolved |
| `RECAPITULATIF_FINAL_STEP_SYNC_03NOV2025.md` | 8 | docs/bugs/resolved |
| `INTEGRATION_CURRENT_STEP_02NOV2025.md` | 7 | docs/bugs/resolved |
| `SPEC_AUTO_CORRECTION_SERVEUR.md` | 7 | docs/api |
| `TIMER_V1_SIMPLIFICATION.md` | 7 | docs/bugs/resolved |
| `SIMPLIFICATION_TIMER_V1_04NOV2025.md` | 7 | docs/bugs/resolved |
| `BACKEND_SIGNED_URLS_BUG.md` | 7 | docs/api |
| `API_PHOTOS_QUICK_REF.md` | 7 | docs/api |
| `API_SIGNATURE_REFERENCE.md` | 7 | docs/api |
| `PRET_A_TESTER_TOKEN_REFRESH.md` | 7 | docs/bugs/resolved |
| `BUG_BACKEND_NO_CORRECTIONS_APPLIED.md` | 7 | racine |
| `DEBUG_SESSION_17DEC2025.md` | 7 | racine |
| `CORRECTIF_BACKEND_URGENT.md` | 7 | racine |
| `CORRECTIONS_SESSION2_17DEC2025.md` | 7 | racine |
| `BUGS_SESSION6_NOTES_PAYMENT_17DEC2025.md` | 7 | racine |
| `INDEX_VALIDATION_SYSTEM.md` | 7 | docs/system |
| `SYNC_FLOW_DOCUMENTATION.md` | 7 | docs/guides |
| `FIX2_STEP_PATH_03NOV2025.md` | 6 | docs/bugs/resolved |
| `SESSION8_API_DISCOVERY_17DEC2025.md` | 6 | racine |
| `CORRECTIFS_BOUCLE_INFINIE_02NOV2025.md` | 6 | docs/bugs/resolved |
| `INTEGRATION_COMPLETE_03NOV2025.md` | 6 | docs/bugs/resolved |
| `PROCHAINES_ETAPES_DETAILLEES.md` | 6 | docs/archive/obsolete |
| `DIAGNOSTIC_SIGNATURE_26DEC.md` | 6 | racine |
| `DASHBOARD_VISUEL_23OCT2025.md` | 6 | docs/archive/obsolete |
| `PERFORMANCE_OPTIMIZATION_GUIDE.md` | 6 | racine |
| `GUIDE_VERSION_MISMATCH_FIX.md` | 6 | docs/bugs/resolved |
| `SESSION_28OCT_PHOTOS_API_FINAL.md` | 6 | docs/bugs/resolved |
| `BUG_STEP5_MISSING_SESSION7_17DEC2025.md` | 6 | racine |

## Fichiers avec 1-4 checkboxes

| Fichier | Checkboxes | Localisation |
|---------|------------|--------------|
| `FIX_BOUCLE_INFINIE_04NOV2025_V2.md` | 5 | docs/bugs/resolved |
| `RAPPORT_FIX_PAYMENT_I18N.md` | 5 | docs/bugs/resolved |
| `FIX_STEP_UPDATE_SYNC_02NOV2025.md` | 5 | docs/bugs/resolved |
| `FIX_INCOHERENCE_TIMER_04NOV2025.md` | 5 | docs/bugs/resolved |
| `RECAP_TIMER_API_SYNC_03NOV2025.md` | 5 | docs/bugs/resolved |
| `JOB_STEPS_SYSTEM.md` | 5 | docs/guides |
| `FIX_STEP_VALIDATION_LOOP_02NOV2025.md` | 5 | docs/bugs/resolved |
| `CORRECTIONS_SESSION4_FINAL_17DEC2025.md` | 5 | racine |
| `TOKEN_REFRESH_BUG_07NOV2025.md` | 5 | docs/bugs/resolved |
| `CORRECTIONS_SESSION3_FINAL_17DEC2025.md` | 5 | racine |
| `PHOTO_UPLOAD_CLIENT_ADAPTER_29OCT.md` | 5 | docs/bugs/resolved |
| `TIMER_SYSTEM.md` | 5 | docs/guides |
| `AUDIT_GESTION_TEMPS_FINAL_02NOV2025.md` | 5 | docs/bugs/resolved |
| `API_DISCOVERY.md` | 5 | racine |
| `DEV_RULES_ONLINE_ONLY.md` | 5 | racine |
| `ANALYSE_REPONSE_FINALE_BACKEND.md` | 5 | racine |
| `README_OVERVIEW.md` | 4 | docs |
| `VALIDATION_FINALE_17DEC2025.md` | 4 | racine |
| `SUIVI_PROGRES_I18N.md` | 4 | docs/Roadmap |
| `SESSION_COMPLETE_21DEC2025.md` | 4 | racine |
| `FIX_JOB_ID_VS_CODE_02NOV2025.md` | 4 | docs/bugs/resolved |
| `DONE_VALIDATION_04NOV2025.md` | 4 | docs/bugs/resolved |
| `PHOTO_UPLOAD_FIXES_FINAL.md` | 4 | docs/bugs/resolved |
| `PHASE2D_FINAL_SUCCESS.md` | 4 | docs/phase2c |
| `SESSION_COMPLETE_04NOV2025.md` | 4 | docs/bugs/resolved |
| `ANALYSE_CORRECTIONS_BACKEND.md` | 3 | racine |
| `SESSION_9_CORRECTION_ENDPOINTS_API.md` | 3 | racine |
| `PHASE1_COMPLETE_26OCT2025.md` | 3 | docs/archive/obsolete |
| `QUICK_FIX_SUMMARY.md` | 1 | docs/bugs/resolved |
| `FIX_JOB_ID_QUICK.md` | 1 | docs/bugs/resolved |
| `ANALYSE_SUMMARY_PAGE_02NOV2025.md` | 1 | docs/bugs/resolved |
| `BUG_FIX_INFINITE_LOOP_PAYMENT_18DEC2025.md` | 1 | racine |
| `RECAPITULATIF_DEBUGGING_17DEC2025.md` | 1 | racine |
| `RECAPITULATIF_CURRENT_STEP_02NOV2025.md` | 1 | docs/bugs/resolved |

---

## 📊 STATISTIQUES CONSOLIDATION FINALE (28 DEC 2025)

| Métrique | Valeur |
|----------|--------|
| **Total fichiers .md scannés** | 148 |
| **Fichiers avec checkboxes listés** | 148 |
| **Checkboxes totales (tous fichiers)** | 2000+ |
| **Checkboxes dans MASTER_TASKS.md** | 480 |
| **Catégories de tâches** | 25+ |
| **Fichiers archive/obsolete** | 18 |
| **Fichiers docs/** | 60+ |
| **Fichiers racine** | 70+ |

---

*Fichier consolidé généré le 27 Décembre 2025*
*MISE À JOUR SCAN COMPLET : 28 Décembre 2025*
*Source : 148 fichiers .md avec checkboxes*
*Dernière mise à jour : 28 Décembre 2025 - LISTE COMPLÈTE*

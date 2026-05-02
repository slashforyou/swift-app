# COBBR — Roadmap Consolidée

> **Dernière mise à jour :** 30 avril 2026
> **Version actuelle :** 1.2.0 (MVP live sur iOS + Android)
> **Statut :** MVP fonctionnel — Monétisation + Features avancées (mai 2026)

---

## 📊 Progression globale

| Scope | Fait | Reste | Progression |
|-------|------|-------|-------------|
| 🔴 **P0** — Bloquant production | 5 | 0 | 100% |
| 🟠 **P1** — Monétisation (juin 2026) | 42 | 2 | **95%** |
| 🟡 **P2** — Améliorations UX | 37 | 5 | **88%** |
| 🟢 **P3** — Nice-to-have | 8 | 7 | 53% |
| ⚪ **P4** — Long terme / IA | 0 | 17 | 0% |
| 🎮 **Gamification v2** | spec | 5 phases | spec prête |
| **TOTAL** | **95** | **28** | **77%** |
| **Chemin critique (P0+P1)** | **47** | **2** | **96%** |

> **Accomplissements récents (8-16 avril) :** Inscription simplifiée 8→1 écran, Business Hub redesign 8→4 onglets, Stripe dual-mode (test/live), Factures hebdo/bimensuelles avec wizard 4 étapes + sélection client, i18n complète 7 langues, Rebranding emails SwiftApp→Cobbr, SMTP fix, **Module Stockage complet** (6 tables, 22+ endpoints, 6 écrans, billing cron), **Stripe onboarding live FR** (person tokens client-side, document upload 2-phase), **Web dashboard fixes** (API routes, Stripe status gate), CI/CD fixes (TypeScript + lint + E2E), **Employee Dashboard** (#29/30/31: stats+heures+historique), **Carousel photos** (#32: PhotoViewModal déjà en place), **Notes internes job** (#33: JobNotesSection + backend + i18n)
>
> **Accomplissements récents (30 avril) :** **Fixes critiques** : `payment.tsx` crash (commentaire JSX corrompu U+FFFD), HTTP 400 `additional_items` (colonne DB + allowedFields), **Billing features** : PDF branding (`GET /v1/billing/monthly-invoices/:id/pdf` via pdfkit — header coloré, logo, tableau lignes, totaux), **Cron impayés** (`overduePaymentsCron` à 09:00 — détection auto overdue sur `monthly_invoices` + `job_transfers`, push notifications), **Admin support** (`POST /v1/support/conversations/:id/reply` — réponse admin + email HTML Cobbr au user)
>
> **Accomplissements récents (21-28 avril) :** **Audit sécurité Élise** (JWT-only company_id, crypto.randomInt, NODE_ENV guard — commit b81fab0), **Push notifications fix CRITIQUE** (pushTokens.js POST/DELETE, migration 035, NotificationsPanel redesign — commit 0a9d26e), **Wave features majeures** : 13 migrations DB (036-048), 14 endpoints backend (attachments, links, difficulty, availability, skills, quotas, mileage, maintenance, reviews, ratings, quotes, revenue dashboard, CSV export, referral), 9 services frontend + 13 écrans (JobAttachments, LinkedJobs, Difficulty, EmployeeAvailability, EmployeeSkills, WeeklyHours, VehicleMileage, VehicleMaintenance, Quotes, QuoteEditor, RevenueDashboard, EmployeeRatings, JobReview), tutoriel onboarding (OnboardingTutorial + useTutorial), navigation mise à jour

### Essentiels validés (21 avril 2026)

- Notifications push extra personnalisées: priorité produit maintenue (segmentations + préférences fines + validation device réelle).
- Accès par formule + paywall non intrusif: clarifier ce qui est inclus selon le plan, avec un stop simple et un CTA upgrade propre.

---

## Légende

| Priorité | Description |
|----------|-------------|
| 🔴 **P0** | Sécurité, stabilité, bloquant production |
| 🟠 **P1** | Nécessaire avant monétisation (juin 2026) |
| 🟡 **P2** | Améliorations significatives de l'expérience |
| 🟢 **P3** | Nice-to-have, améliorations futures |
| ⚪ **P4** | Idées / features long terme |
| 👤 | Tâche manuelle Romain (pas de code) |
| **[S]** | Nécessite du travail Server (backend) |
| **[C]** | Nécessite du travail Client (React Native) |

---

## ✅ Tout ce qui a été fait

### Infrastructure & Sécurité

- [x] Externalisation clés Stripe/API via variables d'environnement EAS
- [x] Guard `__DEV__` sur testData / stripeTestData
- [x] Handler global ErrorUtils + unhandledrejection
- [x] Audit catch blocks vides (23 commentés dans 12 fichiers)
- [x] Nettoyage console.log + TEMP_DISABLED (2289 lignes supprimées)
- [x] Suppression secret admin hardcodé dans test_plans.py
- [x] Suppression connection.jsx dupliqué
- [x] Politique de mot de passe renforcée (server + 4 écrans client)
- [x] Utilitaire centralisé passwordValidator.ts
- [x] Fix fuite mémoire setTimeout dans SupportConversation.tsx
- [x] Élimination des `any` types (4 écrans)
- [x] Navigation typée NativeStackNavigationProp (Support + Subscription)
- [x] Labels d'accessibilité (3 écrans Support)

### Inscription simplifiée (complet)

- [x] **Suppression wizard 8 étapes** — Supprimé `src/screens/registration/` (8 écrans), `ProgressStepper.tsx`, `registration.ts`
- [x] **Inscription 1 écran unique** — subscribe.tsx : email, password, companyName (conditionnel business_owner), accountType
- [x] **Barre de force mot de passe** — 5 critères visuels (longueur, majuscule, minuscule, chiffre, spécial)
- [x] **Bannière concordance mots de passe** — Feedback temps réel vert/rouge
- [x] **Animation pluie d'émojis** — AnimatedBackground avec 18 émojis déco
- [x] **Alerte email dupliqué** — Détection serveur + redirection login
- [x] **SMTP IONOS fix** — Correction credentials `contact@cobbr-app.com`

### Business Hub Redesign (complet)

- [x] **Réduction 8→4 onglets** — Hub / Ressources / Config / Finances
- [x] **BusinessHubOverview** — Dashboard command center (stats, raccourcis, cartes d'action)
- [x] **BusinessSubTabMenu** — Sous-onglets par section avec TAB_MAPPING rétrocompatible
- [x] **Stripe dual-mode** — AsyncLocalStorage + Proxy, `stripe_mode` en DB, header `X-Stripe-Mode`
- [x] **Factures hebdo/bimensuelles** — Migration 029 (period_type), wizard 4 étapes
- [x] **Sélection client dans wizard** — Migration 030 (client_id), endpoint GET /clients
- [x] **i18n complète 7 langues** — en, fr, es, it, pt, hi, zh pour tous les écrans Business Hub
- [x] **Rebranding emails** — SwiftApp→Cobbr dans mailSender.js, templates HTML brandés

### Onboarding v2 (complet)

- [x] **Auto-login après vérification email** — verifyMail.js retourne session tokens, subscribeMailVerification.tsx stocke et navigue vers Home
- [x] **Inscription allégée (5 champs)** — subscribe.js crée company + subscribe.tsx avec champ companyName
- [x] **CompleteProfileScreen** — 5 sections accordion (Business Details, Contact, Address, Banking, Insurance) + PATCH /v1/company/:id (27 champs)
- [x] **Checklist onboarding Home** — OnboardingChecklist component + useOnboardingChecklist hook + endpoint backend
- [x] **Plan selection tardif** — Alert après 1er job créé (flag AsyncStorage)
- [x] **Stripe soft gate** — Banner ambre/warning non bloquante sur Home
- [x] **Stripe hard gate** — useStripeGate hook, guard dans useInvoice + payment.tsx
- [x] **Préremplissage Stripe** — connect.js prefill depuis company data (name, email, phone, address, ABN)

### Modèles de job modulaires (complet)

- [x] Types de segments (location, travel, storage, loading) + types de lieux
- [x] 8 templates par défaut + CRUD complet (modularTemplates.js + jobSegments.js)
- [x] Modes de facturation (lieu-à-lieu, dépôt-à-dépôt, forfait, packing only, unpacking only)
- [x] Assignation employés par segment (SegmentEmployeeAssignment)
- [x] Timer par segment (JobTimerProvider wired to API)
- [x] Écran récapitulatif post-job (JobTimeBreakdownScreen)
- [x] Temps de retour configurable (updateReturnTripApi)
- [x] Tables backend: job_segments, job_templates, segment_employee_assignments (migrations 013+014)

### Contrats modulaires (complet)

- [x] CRUD clauses dans Business tab (ContractsScreen)
- [x] Conditions configurables: always, segment_type, postcode, city, state
- [x] Génération contrat par job (contractsService.ts → backend)
- [x] Wizard signature avec scroll-to-read obligatoire (signingBloc.tsx)
- [x] Section signature dans Client tab (SignatureSection.tsx)
- [x] Backend: contractClauses.js + jobContracts.js + migration 025

### Stripe & Paiements

- [x] Bug détection activation Stripe (fallback + anti-flickering + condition erreur)
- [x] Stripe Subscriptions via PaymentSheet natif
- [x] 4 plans backend (free/pro/expert/unlimited) + limites par plan
- [x] Commission sync automatique plan → stripe_platform_fee_percentage
- [x] Bouton signaler problème de paiement (ReportPaymentIssueModal + push notification)

### UI/UX & Jobs

- [x] Système de messages support (3 écrans + 4 endpoints REST + FAB home)
- [x] Flow mot de passe oublié (client + server)
- [x] Company relations fix (UNION collation utf8mb4 + auto-détection via job_transfers)
- [x] AssignResourceModal — search bar + groupement par company + staff partenaires
- [x] Calendar vehicle display fix (job_assignments au lieu de job_trucks)
- [x] Job summary section reordering (Timer → Quick Actions → Addresses → Client → Time → Company)
- [x] PrepareJobSection — masqué quand véhicule/worker assigné ou job délégué
- [x] Counter-proposal fixes
- [x] Copier référence job en 1 clic
- [x] Wizard message recalibré clavier
- [x] Bouton jour suivant/précédent
- [x] Accept / refuse job + contre-proposition B2B
- [x] Pause auto-resume après X minutes
- [x] 8 avatars de personnages
- [x] Upload logo personnalisé
- [x] Logo sur factures (Pro)
- [x] Système XP / niveaux / badges (v1)
- [x] Note contexte sur le déménagement
- [x] Signature client avant le job
- [x] Bouton statut par étape du job
- [x] Section matériel nécessaire (templates)
- [x] Affichage réponse job en attente
- [x] i18n dates localisées SupportConversation
- [x] Plans tarifaires définis en DB 👤
- [x] Clés Stripe live configurées sur le serveur (sk_live_, pk_live_, whsec_) 👤
- [x] **Thème/couleurs par entreprise** — primary_color en DB, ThemeProvider dynamique, color picker (12 couleurs) dans CompleteProfileScreen, sync au login via /companies/me
- [x] **Suivi facturation inter-prestataires** — billing_status + invoiced_at + paid_at + payment_due_date sur job_transfers, endpoints GET/PATCH /v1/billing/inter-contractor, onglet Facturation dans Business avec stats, filtres, cards par transfert

---

## ❌ Ce qu'il reste à faire

### 🔴 P0 — Bloquant production

| # | Tâche | Scope | Notes |
|---|-------|-------|-------|
| ~~1~~ | ~~Créer Products/Prices dans Stripe Dashboard live et renseigner `stripe_price_id` en DB~~ | 👤 | ✅ Vérifié en prod: seuls les plans payants nécessitent Stripe (`pro`, `expert`) et ils sont configurés. `free`/`unlimited` restent volontairement sans `stripe_price_id` (non facturés). |
| ~~2~~ | ~~Effectuer un paiement réel de test en production~~ | 👤 | ✅ Flow paiement réel validé en production |

### 🟠 P1 — Nécessaire avant monétisation (juin 2026)

| # | Tâche | Scope | Notes |
|---|-------|-------|-------|
| ~~3~~ | ~~Stocker planType + commissionRate au choix du plan~~ | ~~[S]~~ | ✅ POST /v1/company/select-plan — met à jour plan_type + stripe_platform_fee_percentage |
| ~~4~~ | ~~Décider modèle paiement plan (Stripe activé OU free trial)~~ | 👤 | ✅ **Décidé (2 mai 2026) : Free trial 7-14j puis paiement automatique à l'expiration.** |
| ~~5~~ | ~~Persistence draft profile backend~~ | ~~[S]~~ | ✅ Auto-save debounced (2s) dans CompleteProfileScreen via PATCH existant, icône cloud-done dans le header |
| ~~6~~ | ~~Personnaliser thème/couleurs par entreprise~~ | ~~[C][S]~~ | ✅ primary_color en DB + ThemeProvider override + color picker dans CompleteProfileScreen (12 couleurs) + sync au login |
| ~~7~~ | ~~Branding sur factures et liens de paiement~~ | ~~[C][S]~~ | ✅ Logo + primary_color sur MonthlyInvoicesScreen (detail view) + email HTML brandé avec logo GCS signé |
| ~~8~~ | ~~Suivi facturation inter-prestataires~~ | ~~[C][S]~~ | ✅ billing_status/invoiced_at/paid_at/payment_due_date sur job_transfers + endpoint GET/PATCH /v1/billing/inter-contractor + InterContractorBillingScreen (onglet Facturation dans Business) |
| ~~9~~ | ~~Facture mensuelle auto pour le contractor~~ | ~~[S]~~ | ✅ monthly_invoices + monthly_invoice_items tables, CRUD endpoints (generate/list/detail/update/send), cron job (1er du mois 02:00), email HTML brandé, MonthlyInvoicesScreen dans Finances > Factures |
| ~~10~~ | ~~Revoir les mails de facturation~~ | ~~[S]~~ | ✅ Rebranding SwiftApp→Cobbr dans mailSender.js, centralisation emails (forgotPassword, monthlyInvoices, cron), ajout invoiceNotificationMail brandé (logo+couleurs) + invoiceDetailMail avec tableau détaillé, plain text fallback, redirection test emails |
| ~~11~~ | ~~Valider commission (application_fee_amount) en production~~ | 👤 | ✅ Vérifié en prod (stripe_transactions): paiement `succeeded` avec `application_fee_amount > 0` et `net_amount` cohérent |
| ~~12~~ | ~~Tester Apple Pay / Google Pay via PaymentSheet~~ | 👤 | ~~Devices réels iOS + Android~~ — **Hors scope (2 mai 2026)** |
| 13 | Valider flow complet PaymentSheet sur iOS et Android | 👤 | End-to-end test |
| ~~14~~ | ~~Auto-complétion ABN via API gouvernement australien~~ | ~~[C][S]~~ | ✅ ABN Lookup API (abr.business.gov.au) → remplissage auto dans CompleteProfileScreen (nom, adresse, type, GST). Déclenchement à 11 chiffres, debounce 500ms. |

### 🟡 P2 — Améliorations UX

#### Notifications [S]

| # | Tâche | Notes |
|---|-------|-------|
| 15 | ~~Notification quand job assigné à un employé~~ | ✅ pushHelper.js + DB persist |
| 16 | ~~Notification quand job accepté/refusé par partenaire~~ | ✅ acceptJob + declineJob patched |
| 17 | ~~Notification pour contre-propositions B2B~~ | ✅ accept/reject/counterProposal patched |
| 18 | ~~Récapitulatif quotidien des jobs du jour~~ | ✅ dailyRecapCron.js (07h00) |
| ~~19~~ | ~~Améliorer wizard demande de notifications~~ | ✅ Home: modal clair au premier lancement (Activer / Plus tard), demande permission native, mémorisation du choix local pour éviter la répétition. |
| 20 | ~~Popup/notification avant chaque étape du job~~ | ✅ start/pause/resume notifyJobStatusChange |
| 21 | Tester device token iOS physique | 👤 |
| 22 | Tester device token Android physique | 👤 |
| 23 | Valider routing notifications (foreground/background/fermée) | 👤 |

#### Calendrier [C] ✅ DONE

| # | Tâche | Notes |
|---|-------|-------|
| ~~24~~ | ~~Vue semaine (en plus de jour/mois/année)~~ | ✅ weekScreen.tsx + useJobsForWeek hook + nav + tab |
| ~~25~~ | ~~Drag & drop pour réassigner un job à une autre date~~ | ✅ DraggableJobCard + handleJobDrop + API updateJob |
| ~~26~~ | ~~Filtres par statut, par équipe, par véhicule~~ | ✅ CalendarFilters component (status/vehicle/staff pills) |
| ~~27~~ | ~~Code couleur par type de job ou par équipe~~ | ✅ calendarColors.ts (4 modes: status/priority/vehicle/team) |

#### Profil & Compte [C][S]

| # | Tâche | Notes |
|---|-------|-------|
| ~~28~~ | ~~Avatar de profil (avatars prédéfinis uniquement)~~ | ✅ Simplification produit: suppression caméra/galerie/photo custom. Sélection d'avatar mascotte uniquement pour réduire la complexité UX et les erreurs upload. |
| ~~29~~ | ~~Historique jobs réalisés par employé~~ | ✅ EmployeeDashboardScreen + endpoint GET /v1/employee/dashboard |
| ~~30~~ | ~~Statistiques personnelles (jobs, heures, XP)~~ | ✅ Stats cards (totalJobs/completedJobs/totalHours/totalXp) dans EmployeeDashboardScreen |
| ~~31~~ | ~~Écran employé — dashboard heures/semaine + plage de dates~~ | ✅ Sélecteur 7/14/30j + barre horizontale par jour + accessible depuis profil (CTA "Mon tableau de bord") |

#### Job Details [C][S]

| # | Tâche | Notes |
|---|-------|-------|
| ~~32~~ | ~~Carousel photos plein écran (swipe)~~ | ✅ PhotoViewModal dans JobPhotosSection (ScrollView horizontal + double-tap zoom + nav prev/next + counter) |
| ~~33~~ | ~~Notes/commentaires internes sur un job~~ | ✅ JobNotesSection (collapsible) + useJobNotes hook + jobNotes backend + i18n |
| ~~34~~ | ~~Historique modifications job (audit trail)~~ | ✅ `getJobActionsById.js` + écran logs |
| ~~35~~ | ~~Pièces jointes (documents, devis, contrats)~~ | ✅ `jobAttachments.js` + `JobAttachmentsScreen` + migration 037 |
| ~~36~~ | ~~Classifier jobs par niveau de difficulté~~ | ✅ `jobDifficulty.js` + `JobDifficultyScreen` + migration 036 |
| ~~37~~ | ~~Lier 2 jobs entre eux (interstate)~~ | ✅ `jobLinks.js` + `LinkedJobsScreen` + migration 038 |
| ~~38~~ | ~~Support multi-camions par job~~ | ✅ `trucks_count` activé, PATCH endpoint + UI |
| ~~39~~ | ~~Page "Logs" historique d'actions sur un job~~ | ✅ `getJobActionsById.js` existant, entrée dans JobDetails |

#### Gestion du personnel [C][S]

| # | Tâche | Notes |
|---|-------|-------|
| ~~40~~ | ~~Vue planning par employé (timeline)~~ | ✅ `EmployeeScheduleScreen` + `staffSchedule.js` |
| ~~41~~ | ~~Gestion disponibilités/indisponibilités~~ | ✅ `employeeAvailability.js` + `EmployeeAvailabilityScreen` + migration 039 |
| ~~42~~ | ~~Système de compétences/qualifications~~ | ✅ `employeeSkills.js` + `EmployeeSkillsScreen` + migration 040 |
| 43 | Affectation auto suggérée (dispo + proximité) | Algorithme suggestion — à faire |
| ~~44~~ | ~~Quota d'heures max/semaine par travailleur~~ | ✅ `employeeHourQuotas.js` + `WeeklyHoursScreen` + migration 041 |
| ~~45~~ | ~~Page clients — liste des clients (patron only)~~ | ✅ ClientsScreen (sub-tab Resources) + backend CRUD + i18n |
| ~~46~~ | ~~Parrainage récompensé (code invite / lien)~~ | ✅ `ReferralScreen` + `referral.js` + `referral_rewards` migration 044 |

#### Véhicules [C][S]

| # | Tâche | Notes |
|---|-------|-------|
| ~~47~~ | ~~Suivi kilométrique par véhicule~~ | ✅ `vehicleMileage.js` + `VehicleMileageScreen` + migration 042 |
| ~~48~~ | ~~Alertes maintenance (vidange, contrôle technique)~~ | ✅ `vehicleMaintenance.js` + `VehicleMaintenanceScreen` + migration 043 |
| 49 | Disponibilité véhicule sur calendrier | Planning véhicules — à faire |

#### Autres [C][S]

| # | Tâche | Notes |
|---|-------|-------|
| 50 | Chat interne (support messaging fait, chat interne reste) | Messagerie équipe — à faire |
| 51 | Appel d'urgence pour contractors/contractee | Bouton rapide — à faire |
| 52 | MapView pour contractee (trajet + temps estimé) | React Native Maps — à faire |
| ~~53~~ | ~~Mini tutoriel 1ère utilisation (tooltips/coach marks)~~ | ✅ `OnboardingTutorial.tsx` + `useTutorial.ts` + migration 048 |
| ~~54~~ | ~~Audit i18n complet (toutes langues, tous éléments)~~ | ✅ 7 langues (en/fr/es/it/pt/hi/zh) — Business Hub, modernJobBox, assignments, MonthlyInvoices, templates |
| ~~55~~ | ~~Demande d'avis automatique (happy customer → review)~~ | ✅ `jobReviews.js` + `JobReviewScreen` + migration 045 |
| ~~56~~ | ~~Réponse par mail messages support~~ | ✅ `POST /v1/support/conversations/:id/reply` — admin reply + email HTML notification via mailSender |

### 🟢 P3 — Nice-to-have

| # | Tâche | Scope | Notes |
|---|-------|-------|-------|
| ~~57~~ | ~~Générateur de devis (prestations + calcul auto)~~ | ~~[C][S]~~ | ✅ `quotes.js` + `QuotesScreen` + `QuoteEditorScreen` + migration 047 |
| ~~58~~ | ~~Conversion devis → job en 1 clic~~ | ~~[C][S]~~ | ✅ `POST /v1/quotes/:id/convert-to-job` + bouton dans QuoteEditorScreen |
| ~~59~~ | ~~Factures PDF avec branding~~ | ~~[S]~~ | ✅ `pdfInvoice.js` — `GET /v1/billing/monthly-invoices/:id/pdf` (pdfkit 0.18, header coloré, logo GCS, tableau lignes, totaux) |
| 60 | Chat interne équipe (temps réel) | [C][S] | À faire |
| 61 | Chat avec client final (lié au job) | [C][S] | À faire |
| 62 | Partage position temps réel (ETA) | [C][S] | À faire |
| ~~63~~ | ~~Notation job par client (étoiles + commentaire)~~ | ~~[C][S]~~ | ✅ `jobReviews.js` (token email) + `job_reviews` migration 045 |
| ~~64~~ | ~~Notation interne employé par patron~~ | ~~[C][S]~~ | ✅ `employeeRatings.js` + `EmployeeRatingsScreen` + migration 046 |
| 65 | Calcul itinéraire optimisé entre jobs | [C] | À faire |
| 66 | Tracking GPS flotte temps réel (opt-in) | [C][S] | À faire |
| 67 | Numérotation cartons (packing) | [C][S] | À faire |
| ~~68~~ | ~~Page stockage (inventaire, logs entrée/sortie)~~ | ~~[C][S]~~ | ✅ Module complet: 6 tables SQL, 22+ endpoints, 6 écrans, billing cron quotidien, intégration Job↔Storage bidirectionnelle |
| ~~69~~ | ~~Suivi paiements + relance auto impayés~~ | ~~[S]~~ | ✅ `overduePaymentsCron.js` (09:00 daily) — détecte `monthly_invoices` + `job_transfers` overdue, push notifications |
| ~~70~~ | ~~Dashboard revenus (jour/semaine/mois)~~ | ~~[C][S]~~ | ✅ `revenueDashboard.js` + `RevenueDashboardScreen` (KPIs + bar chart + top clients) |
| ~~71~~ | ~~Export CSV/PDF rapports~~ | ~~[S]~~ | ✅ `exportData.js` → GET /v1/export/jobs + /v1/export/revenue |

### ⚪ P4 — Long terme / IA

| # | Tâche | Notes |
|---|-------|-------|
| 72 | Annuaire entreprises partenaires par zone géographique | Marketplace |
| 73 | Système d'appels d'offres entre entreprises | B2B bidding |
| 74 | Synchronisation calendrier Google/iCal | CalDAV |
| 75 | Matching auto contractee/contractor (distance + dispo) | IA |
| 76 | Prédiction durée job basée sur historique | IA / ML |
| 77 | Optimisation auto du planning | IA |
| 78 | Détection d'anomalies (job trop long, facturation anormale) | IA |
| 79 | Assistant IA pour création de devis | LLM |
| 80 | IA conversationnelle messages entrants | LLM |
| 81 | Intégration comptabilité (QuickBooks, Sage) | API |
| 82 | API publique pour intégrations tierces | REST / GraphQL |
| 83 | Webhook événements (job créé/complété/payé) | Event system |
| 84 | Réglementations locales facturation (TVA, n° facture) | Compliance |
| 85 | Support devises multiples | i18n monétaire |
| 86 | Conformité RGPD complète (export/suppression données) | Legal |
| 87 | Recommandation au client (guide/tips déménagement) | Content |
| 88 | Domaine personnalisé pour liens de paiement | DNS + Stripe |

### 🎮 Gamification v2 — Spec prête, implémentation en attente

> **Spec complète :** `docs/GAMIFICATION_V2_SPEC.md` (~1500 lignes)

Le système gamification v2 est spécifié mais pas encore implémenté. Il comprend :

| Phase | Contenu | Effort estimé |
|-------|---------|---------------|
| **Phase 1** | Fondation — Séparation XP/trophées/badges, 18 tables SQL, event system | Gros |
| **Phase 2** | Moteur de score — Job scoring, distribution XP, calcul performance | Moyen |
| **Phase 3** | Quêtes — Journalières, hebdomadaires, mensuelles, générales | Moyen |
| **Phase 4** | Reviews client — Notation post-job, score visible, agrégation | Moyen |
| **Phase 5** | Frontend — Écrans profil enrichi, leaderboard, historique, animations | Gros |

---

## 🔧 Dette technique

| Élément | Fichier(s) | Statut |
|---------|-----------|--------|
| DelegateJobWizard trop gros (~1800 lignes) | `DelegateJobWizard/index.tsx` → split en `types.ts` + `components.tsx` (1540 lignes) | ✅ |
| ContractorJobWizardModal trop gros (~2000 lignes) | `ContractorJobWizardModal/index.tsx` → split en `types.ts` + `styles.ts` (1767 lignes) | ✅ |
| Timer sync désactivé côté backend | `jobValidation.ts` — dead code supprimé, TODO ajouté | ✅ |
| Mock data fallback dans useBusinessStats | `useBusinessStats.ts` — mocks supprimés (~200 lignes) | ✅ |
| Manque de React.memo sur composants de liste | `JobBox`, `AssignmentCard`, `DetailCard` — memo ajouté | ✅ |
| Textes français hardcodés dans modernJobBox.tsx | `modernJobBox.tsx` + `assignments/index.tsx` — 8 strings i18n | ✅ |

---

## 🧪 Tests

> **Plan de tests manuels :** `docs/MANUAL_TEST_PLAN.md` (116 tests couvrant onboarding, Stripe, contrats, templates, i18n, sécurité, edge cases)

---

## 📅 Planning prévisionnel

| Version | Période | Focus |
|---------|---------|-------|
| **v1.1.x** | Avril 2026 | P0 — Stabilisation, clés Stripe live, test production |
| **v1.2** | Mai 2026 | P1 — Finaliser monétisation (plans, factures, branding) |
| **v1.3** | Juin 2026 | P1 — Personnalisation + gamification v2 phase 1 |
| **v1.4** | Été 2026 | P2 — Notifications, calendrier, profil, jobs |
| **v2.0** | Automne 2026 | P3 — Devis/facturation, rapports, chat |
| **v3.0** | 2027 | P4 — Marketplace, IA, intégrations |

---

## 🎯 Prochaines étapes recommandées

**Par quoi commencer (dans l'ordre) :**

1. **🟠 P1 — Décider le modèle plan (paiement après Stripe activé vs free trial)** → Décision produit pour verrouiller le funnel monétisation.

2. **🟠 P1 — Tester Apple Pay / Google Pay + flow PaymentSheet complet (iOS/Android)** → Validation device réelle finale avant scale.

3. **🟡 P2 — Valider les notifications sur devices physiques (token + routing fg/bg/fermée)** → Clore la partie fiabilité notifications.

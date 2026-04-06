# COBBR — Roadmap Consolidée

> **Dernière mise à jour :** 6 avril 2026
> **Version actuelle :** 1.1.0 (MVP live sur iOS + Android)
> **Statut :** MVP fonctionnel — En route vers monétisation (juin 2026)

---

## 📊 Progression globale

| Scope | Fait | Reste | Progression |
|-------|------|-------|-------------|
| 🔴 **P0** — Bloquant production | 3 | 2 | 60% |
| 🟠 **P1** — Monétisation (juin 2026) | 32 | 11 | **74%** |
| 🟡 **P2** — Améliorations UX | 0 | 42 | 0% |
| 🟢 **P3** — Nice-to-have | 0 | 15 | 0% |
| ⚪ **P4** — Long terme / IA | 0 | 17 | 0% |
| 🎮 **Gamification v2** | spec | 5 phases | spec prête |
| **TOTAL** | **35** | **86** | **29%** |
| **Chemin critique (P0+P1)** | **35** | **12** | **74%** |

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

---

## ❌ Ce qu'il reste à faire

### 🔴 P0 — Bloquant production

| # | Tâche | Scope | Notes |
|---|-------|-------|-------|
| 1 | Créer Products/Prices dans Stripe Dashboard live et renseigner `stripe_price_id` en DB | 👤 | Actuellement NULL pour tous les plans. SQL: `UPDATE plans SET stripe_price_id='price_xxx' WHERE id='pro'` etc. |
| 2 | Effectuer un paiement réel de test en production | 👤 | Valider le flow complet avant go-live |

### 🟠 P1 — Nécessaire avant monétisation (juin 2026)

| # | Tâche | Scope | Notes |
|---|-------|-------|-------|
| 3 | Stocker planType + commissionRate au choix du plan | [S] | Endpoint plan_selection_tardif |
| 4 | Décider modèle paiement plan (Stripe activé OU free trial) | 👤 | Option A: paiement quand Stripe activé. Option B: free trial 7-14j |
| 5 | Persistence draft profile backend | [S] | PUT /v1/company/draft-profile — actuellement local only, risque perte |
| 6 | Personnaliser thème/couleurs par entreprise | [C][S] | Couleur primaire customisable |
| 7 | Branding sur factures et liens de paiement | [C][S] | Logo + couleurs sur les factures/invoices |
| 8 | Suivi facturation inter-prestataires | [C][S] | Statut: envoyée, payée, en retard |
| 9 | Facture mensuelle auto pour le contractor | [S] | Récapitulatif des jobs réalisés |
| 10 | Revoir les mails de facturation | [S] | Contenu, format, envoi |
| 11 | Valider commission (application_fee_amount) en production | 👤 | Test réel nécessaire |
| 12 | Tester Apple Pay / Google Pay via PaymentSheet | 👤 | Devices réels iOS + Android |
| 13 | Valider flow complet PaymentSheet sur iOS et Android | 👤 | End-to-end test |

### 🟡 P2 — Améliorations UX

#### Notifications [S]
| # | Tâche | Notes |
|---|-------|-------|
| 14 | Notification quand job assigné à un employé | Push notification |
| 15 | Notification quand job accepté/refusé par partenaire | Push notification |
| 16 | Notification pour contre-propositions B2B | Push notification |
| 17 | Récapitulatif quotidien des jobs du jour | Notification matinale optionnelle |
| 18 | Améliorer wizard demande de notifications | Meilleur design |
| 19 | Popup/notification avant chaque étape du job | Rappel proactif au staff |
| 20 | Tester device token iOS physique | 👤 |
| 21 | Tester device token Android physique | 👤 |
| 22 | Valider routing notifications (foreground/background/fermée) | 👤 |

#### Calendrier [C]
| # | Tâche | Notes |
|---|-------|-------|
| 23 | Vue semaine (en plus de jour/mois/année) | Nouvelle vue calendrier |
| 24 | Drag & drop pour réassigner un job à une autre date | UX avancée |
| 25 | Filtres par statut, par équipe, par véhicule | Sidebar filtres |
| 26 | Code couleur par type de job ou par équipe | Personnalisation visuelle |

#### Profil & Compte [C][S]
| # | Tâche | Notes |
|---|-------|-------|
| 27 | Changement photo de profil (galerie + caméra) | ImagePicker |
| 28 | Historique jobs réalisés par employé | Dashboard employé |
| 29 | Statistiques personnelles (jobs, heures, XP) | Dashboard stats |
| 30 | Écran employé — dashboard heures/semaine + plage de dates | Accessible depuis profil |

#### Job Details [C][S]
| # | Tâche | Notes |
|---|-------|-------|
| 31 | Carousel photos plein écran (swipe) | React Native Carousel |
| 32 | Notes/commentaires internes sur un job | Communication équipe |
| 33 | Historique modifications job (audit trail) | Log des changements |
| 34 | Pièces jointes (documents, devis, contrats) | Upload fichiers |
| 35 | Classifier jobs par niveau de difficulté | Tags/badges |
| 36 | Lier 2 jobs entre eux (interstate) | Relations jobs |
| 37 | Support multi-camions par job | Code trucksCount existe mais désactivé |
| 38 | Page "Logs" historique d'actions sur un job | Pour contractors |

#### Gestion du personnel [C][S]
| # | Tâche | Notes |
|---|-------|-------|
| 39 | Vue planning par employé (timeline) | Calendrier individuel |
| 40 | Gestion disponibilités/indisponibilités | Plages horaires |
| 41 | Système de compétences/qualifications | Tags/badges par employé |
| 42 | Affectation auto suggérée (dispo + proximité) | Algorithme suggestion |
| 43 | Quota d'heures max/semaine par travailleur | Tracking cumulé |
| 44 | Page clients — liste des clients (patron only) | CRM basique |
| 45 | Parrainage récompensé (code invite / lien) | Invite → reward |

#### Véhicules [C][S]
| # | Tâche | Notes |
|---|-------|-------|
| 46 | Suivi kilométrique par véhicule | Odometer tracking |
| 47 | Alertes maintenance (vidange, contrôle technique) | Rappels automatiques |
| 48 | Disponibilité véhicule sur calendrier | Planning véhicules |

#### Autres [C][S]
| # | Tâche | Notes |
|---|-------|-------|
| 49 | Chat interne (support messaging fait, chat interne reste) | Messagerie équipe |
| 50 | Appel d'urgence pour contractors/contractee | Bouton rapide |
| 51 | MapView pour contractee (trajet + temps estimé) | React Native Maps |
| 52 | Mini tutoriel 1ère utilisation (tooltips/coach marks) | Onboarding in-app |
| 53 | Audit i18n complet (toutes langues, tous éléments) | Incluant modernJobBox.tsx hardcodé FR |
| 54 | Demande d'avis automatique (happy customer → review) | Post-job |
| 55 | Réponse par mail messages support | Backend email |

### 🟢 P3 — Nice-to-have

| # | Tâche | Scope | Notes |
|---|-------|-------|-------|
| 56 | Générateur de devis (prestations + calcul auto) | [C][S] | |
| 57 | Conversion devis → job en 1 clic | [C][S] | |
| 58 | Factures PDF avec branding | [S] | |
| 59 | Chat interne équipe (temps réel) | [C][S] | |
| 60 | Chat avec client final (lié au job) | [C][S] | |
| 61 | Partage position temps réel (ETA) | [C][S] | |
| 62 | Notation job par client (étoiles + commentaire) | [C][S] | |
| 63 | Notation interne employé par patron | [C][S] | |
| 64 | Calcul itinéraire optimisé entre jobs | [C] | |
| 65 | Tracking GPS flotte temps réel (opt-in) | [C][S] | |
| 66 | Numérotation cartons (packing) | [C][S] | |
| 67 | Page stockage (inventaire, logs entrée/sortie) | [C][S] | |
| 68 | Suivi paiements + relance auto impayés | [S] | |
| 69 | Dashboard revenus (jour/semaine/mois) | [C][S] | |
| 70 | Export CSV/PDF rapports | [S] | |

### ⚪ P4 — Long terme / IA

| # | Tâche | Notes |
|---|-------|-------|
| 71 | Annuaire entreprises partenaires par zone géographique | Marketplace |
| 72 | Système d'appels d'offres entre entreprises | B2B bidding |
| 73 | Synchronisation calendrier Google/iCal | CalDAV |
| 74 | Matching auto contractee/contractor (distance + dispo) | IA |
| 75 | Prédiction durée job basée sur historique | IA / ML |
| 76 | Optimisation auto du planning | IA |
| 77 | Détection d'anomalies (job trop long, facturation anormale) | IA |
| 78 | Assistant IA pour création de devis | LLM |
| 79 | IA conversationnelle messages entrants | LLM |
| 80 | Intégration comptabilité (QuickBooks, Sage) | API |
| 81 | API publique pour intégrations tierces | REST / GraphQL |
| 82 | Webhook événements (job créé/complété/payé) | Event system |
| 83 | Réglementations locales facturation (TVA, n° facture) | Compliance |
| 84 | Support devises multiples | i18n monétaire |
| 85 | Conformité RGPD complète (export/suppression données) | Legal |
| 86 | Recommandation au client (guide/tips déménagement) | Content |
| 87 | Domaine personnalisé pour liens de paiement | DNS + Stripe |

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

| Élément | Fichier(s) | Priorité |
|---------|-----------|----------|
| DelegateJobWizard trop gros (~1800 lignes) | `DelegateJobWizard/index.tsx` | 🟡 |
| ContractorJobWizardModal trop gros (~2000 lignes) | `ContractorJobWizardModal.tsx` | 🟡 |
| Timer sync désactivé côté backend | `jobValidation.ts` | 🟠 |
| Mock data fallback dans useBusinessStats | `useBusinessStats.ts` | 🟡 |
| Manque de React.memo sur composants de liste | Multiples | 🟢 |
| Textes français hardcodés dans modernJobBox.tsx | `modernJobBox.tsx` | 🟡 |

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

1. **🔴 P0 — Clés Stripe live + test paiement réel** → Romain doit configurer les clés live dans le dashboard Stripe et tester un paiement réel. C'est le seul bloqueur pour la production.

2. **🟠 P1 — Plan selection backend** → Endpoint pour stocker planType + commissionRate quand l'utilisateur choisit son plan. Petit effort, gros impact (monétisation).

3. **🟠 P1 — Personnalisation thème/couleurs** → Couleur primaire par entreprise. Donne un sentiment "pro" important pour les clients B2B payants.

4. **🟠 P1 — Branding factures** → Logo + couleurs sur les invoices/liens de paiement. Différenciateur Pro vs Free.

5. **🟠 P1 — Facture mensuelle contractor** → Récapitulatif auto des jobs réalisés. Nécessaire pour la relation B2B.

6. **🟡 P2 — Notifications push** → Assignation job, acceptation/refus, rappels. Impact immédiat sur l'expérience terrain.

7. **🎮 Gamification v2 Phase 1** → Fondation du nouveau système (tables, events). Prépare le terrain pour les phases suivantes.

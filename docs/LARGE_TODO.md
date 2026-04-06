# LARGE TODO — Cobbr Roadmap Post-MVP

> **Dernière mise à jour :** 2 avril 2026
> **Version actuelle :** 1.1.0 (MVP live sur iOS + Android)
> **Statut :** MVP fonctionnel — Planification des prochaines versions

---

## Légende

| Priorité  | Description                                  |
| --------- | -------------------------------------------- |
| 🔴 **P0** | Sécurité, stabilité, bloquant                |
| 🟠 **P1** | Nécessaire avant monétisation (juin 2026)    |
| 🟡 **P2** | Améliorations significatives de l'expérience |
| 🟢 **P3** | Nice-to-have, améliorations futures          |
| ⚪ **P4** | Idées / features longue terme                |

> **[+ Server]** ou **[+ Client]** = nécessite aussi du travail de l'autre côté

---

## ✅ Déjà réalisé

- [x] Copier la référence du job en 1 clic
- [x] Wizard d'envoi de message — recalibré quand le clavier s'ouvre
- [x] Calendrier ne descend plus trop bas sur l'écran
- [x] Traitement des jobs passés (restés inactifs) — revu
- [x] Logo entreprise sur les factures (forfait Pro)
- [x] Personnalisation minime des factures (forfait Pro)
- [x] Bouton de statut pour chaque étape du job (step system)
- [x] Note "contexte" sur le déménagement (système de notes avec types)
- [x] Signature client avant le job
- [x] Bouton pour passer au jour suivant/précédent rapidement
- [x] Section matériel nécessaire (dans les templates de job)
- [x] Accept / refuse un job (+ contre-proposition B2B)
- [x] Pause qui reprend après X minutes (auto-resume)
- [x] Différents personnages pour le profil (8 avatars)
- [x] Système de récompenses (XP, niveaux, badges)
- [x] Affichage de la réponse au job en attente
- [x] Upload de logo personnalisé visible dans l'app
- [x] Nettoyage console.log + TEMP_DISABLED (2289 lignes supprimées)
- [x] Guard `__DEV__` sur testData / stripeTestData
- [x] Handler global ErrorUtils + unhandledrejection
- [x] Audit des catch blocks vides (23 commentés dans 12 fichiers)
- [x] Bug upload logo corrigé (GCS → stockage local)
- [x] Flow "mot de passe oublié" (client + server)
- [x] Politique de mot de passe renforcée (8 chars min + majuscule + minuscule + chiffre + spécial) — server + 4 écrans client
- [x] Suppression du secret admin hardcodé dans `test_plans.py` (lecture via `os.environ`)
- [x] Externalisation des clés Stripe/API via variables d'environnement EAS (`environment.ts`)
- [x] Suppression de `connection.jsx` dupliqué (`connection.tsx` existait déjà)
- [x] Fix fuite mémoire `setTimeout` sans cleanup dans `SupportConversation.tsx`
- [x] Correction bug `create()` dans `SupportNewConversation.tsx` (3 args → objet)
- [x] Correction import `ServerData` dans `forgotPassword.tsx` (mauvais chemin)
- [x] Correction syntaxe `fr.ts` — section `home:` manquante après ajout `common.today/yesterday`
- [x] Élimination des `any` types : 4 écrans (Support ×3 + SubscriptionScreen)
- [x] Navigation typée (`NativeStackNavigationProp`) sur les écrans Support + Subscription
- [x] i18n dates localisées dans SupportConversation (today/yesterday)
- [x] Labels d'accessibilité ajoutés sur les 3 écrans Support
- [x] Utilitaire centralisé `passwordValidator.ts` (miroir des règles serveur)

---

## 📱 Client (App React Native)

### 🔴 P0

- [x] **Système de messages (aide, soutiens)** — implémenter l'écran de messagerie/support **[+ Server]** ✅ 3 écrans (Inbox, Conversation, NewConversation) + 4 endpoints REST + FAB home
- [x] **Bug détection activation Stripe** — la bannière "Configurer Stripe" apparaît sur la Home et la page de paiement même quand le compte Stripe est déjà activé. Vérifier le flag `stripeAccountStatus` / `charges_enabled` et ne pas afficher la section si le compte est actif **[+ Server]** ✅ Fallback fetchStripeAccount + anti-flickering hasSucceeded + condition stripeError sur Home

### 🟠 P1

#### 🚀 Onboarding v2 — Réduction friction & activation **[+ Server]**

> **Règle produit :** "Stripe onboarding must happen before the first payment, but must never be discovered at the moment of payment."

##### 1. Auth flow simplifié

- [x] **Auto-login après vérification email** — supprimer le retour manuel vers login après verify email. Flow : Register → Verify Email → AUTO LOGIN → Home ✅ verifyMail.js retourne session tokens + subscribeMailVerification.tsx stocke et navigue vers Home
- [x] Supprimer l'étape de re-saisie des identifiants post-vérification ✅

##### 2. Inscription Business Owner allégée (5 champs max)

- [x] **Phase 1 (obligatoire, rapide)** — First name, Last name, Email, Password, Company name → accès app immédiat ✅ subscribe.js crée company + subscribe.tsx avec champ companyName
- [x] **Phase 2 (progressive, dans l'app)** — compléter plus tard via UI : Business details (ABN, phone…), Address, Banking, Insurance (optionnel), Legal ✅ CompleteProfileScreen avec 5 sections accordion (Business Details, Contact, Address, Banking, Insurance) + PATCH /v1/company/:id (27 champs)
- [x] Modifier les écrans d'inscription pour ne garder que les 5 champs Phase 1 ✅
- [x] Créer un écran "Complete your profile" accessible depuis la checklist Home ✅ CompleteProfileScreen.tsx + route CompleteProfile + navigation depuis OnboardingChecklist

##### 3. Home = Activation Hub (checklist dynamique)

- [x] **Checklist onboarding sur la Home** — remplacer la Home vide par une checklist guidée ✅ OnboardingChecklist component + useOnboardingChecklist hook (vérifie profil, jobs, équipe, Stripe, paiements) :
  - ✅ Complete business profile
  - ✅ Create your first job
  - ✅ Invite your team
  - ✅ Setup payments (Stripe)
  - ✅ Get your first payment
- [x] Endpoint backend checklist status (GET `/v1/onboarding/checklist`) retournant l'état de chaque item ✅ onboardingChecklist.js — 5 booleans via COUNT SQL
- [x] Masquer la checklist quand tous les items sont complétés ✅ allComplete → composant masqué

##### 4. Plan selection repositionné (plus tard = plus de conversion)

- [x] **Déplacer le choix du plan** — ne plus le proposer pendant l'onboarding mais APRÈS la création du 1er job OU avant activation des paiements ✅ Alert dans dayScreen après 1er job créé (flag AsyncStorage plan_suggestion_shown)
- [ ] Stocker `planType` + `commissionRate` côté backend à la sélection
- [ ] Option A (recommandée) : plan sélectionné, paiement seulement quand Stripe activé ou première transaction
- [ ] Option B (alternative) : free trial 7-14 jours puis paiement obligatoire

##### 5. Stripe onboarding — Soft gate + Hard gate

- [x] **Soft gate (non bloquant)** — banner persistante sur la Home : "⚠️ Payments not set up — get paid after your jobs" avec CTA "Setup payments" ✅ Banner ambre/warning restylée
- [x] **Hard gate (bloquant)** — bloquer UNIQUEMENT sur : "Charge client", "Send invoice", "Mark as paid". Message : "You're 1 step away from getting paid" + CTA "Setup payments (2 min)" ✅ useStripeGate hook + guard dans useInvoice + payment.tsx
- [x] Stripe doit être complété AVANT le premier paiement, MAIS JAMAIS pendant un job en cours ✅
- [ ] Triggers idéaux : création 1er job avec prix, ouverture écran invoice, fin du 1er job

##### 6. Préremplissage Stripe

- [x] **Préremplir les données Stripe** depuis le profil business déjà saisi **[+ Server]** : name, email, phone, business info, address, banking (si possible) ✅ connect.js prefill depuis company data
- [x] Supprimer la double saisie (données perso + adresse + banque) ✅

##### 7. Persistence data (critique)

- [ ] **Sauvegarder les données business côté backend** — draft profile + business info. Actuellement stocké en local uniquement → risque de perte si uninstall/device change **[+ Server]**
- [ ] Endpoint draft profile (PUT `/v1/company/draft-profile`) pour sauvegarder progressivement

#### Modèles de job modulaires & calcul d'heures **[+ Server]**

> Pouvoir créer des modèles de job composés de **segments de temps typés**, afin de calculer précisément les heures payées/non payées par employé et par job.

- [x] **Création de types de segments de temps** — chaque job est composé de segments ordonnés :
  - 📍 **Lieu N°X** — présence et travail sur site (maison, appartement, garage, stockage privé…)
  - 🚚 **Trajet** — déplacement d'un lieu à un autre
  - 📦 **Stockage** — stockage de meubles/objets au dépôt
  - 🏗️ **Chargement** — chargement/déchargement au dépôt
- [x] **Modèles de job (templates)** — créer des templates réutilisables composés de segments (ex : "Déménagement classique" = Lieu 1 → Trajet → Lieu 2, "Dépôt-à-dépôt" = Dépôt → Trajet → Lieu 1 → Trajet → Lieu 2 → Trajet → Dépôt) ✅ 8 templates par défaut + CRUD complet
- [x] **Modes de facturation configurables par template** :
  - *Lieu à lieu* — le temps payé commence à l'arrivée au Lieu N°1 et finit au départ du dernier Lieu
  - *Dépôt à dépôt* — le temps payé commence au départ du dépôt et finit au retour au dépôt (temps de retour configurable lors du paiement)
- [x] **Assignation d'employés par segment** — un employé peut ne travailler que sur certaines plages horaires d'un job (ex : un packer ne travaille que pendant le segment "Chargement" ou "Lieu N°X") ✅ SegmentEmployeeAssignment component
- [x] **Écran récapitulatif post-job** — vue détaillée de chaque segment avec durée, employés présents, et calcul du tarif payé par segment et par employé ✅ JobTimeBreakdownScreen
- [x] **Temps de retour configurable** — pour les jobs dépôt-à-dépôt, durée du trajet retour modifiable par le patron lors du paiement final ✅ updateReturnTripApi
- [x] **Timer par segment** — démarrage/arrêt du chrono par segment pendant l'exécution du job (intégration avec le système de timer existant) ✅ JobTimerProvider wired to API

- [x] Écran de gestion d'abonnement (vue du plan actuel, comparaison des plans) **[+ Server]** ✅ SubscriptionScreen (**DEV** only pour l'instant)
- [x] Connecter le paiement des abonnements via Stripe (billing portal ou web) **[+ Server]** ✅ SubscriptionScreen avec PaymentSheet natif + backend stripe_subscriptions.js (create/cancel/resume/change-plan)
- [ ] Personnaliser le thème/couleurs de l'app par entreprise
- [ ] Branding sur les factures et liens de paiement **[+ Server]**
- [x] Migrer du fallback card entry manuel vers Stripe PaymentSheet natif ✅ PaymentSheet intégré dans SubscriptionScreen + paymentWindow
- [x] Écran et flow "mot de passe oublié" (labels i18n déjà prêts) **[+ Server]**
- [x] Bouton "signaler un problème de paiement" au bureau (visible par le staff terrain) ✅ ReportPaymentIssueModal + endpoint + push notification au patron
- [x] **Section contrats modulaires** — contrats dynamiques basés sur les modules/segments du job **[+ Server]** ✅ CRUD clauses, conditions (always/segment_type/postcode/city/state), génération contrat par job, signature, onglet Business + section Job Client :
  - Chaque module de job (storage, trajet, lieu, chargement) peut déclencher l'ajout automatique d'une clause au contrat client
  - Section "Contrats" dans Business : programmer et modifier chaque section des contrats
  - Créer des modules de clauses personnalisés avec conditions d'ajout configurables :
    - Par type de segment (quand il y a stockage, chargement, etc.)
    - Toujours ajouter
    - Par code postal / par ville / par zone géographique
  - Contrat signé consultable dans la section "Client" du job
  - Intégrer la décharge de responsabilité (damage waiver) comme clause modulaire
- [ ] Suivi de la facturation inter-prestataires (statut : envoyée, payée, en retard) **[+ Server]**

### 🟡 P2

#### Notifications

- [ ] Améliorer le wizard de demande de notifications (plus agréable à lire, meilleur design)
- [ ] Popup/notification avant chaque étape du job (rappel proactif au staff)

#### Calendrier

- [ ] Vue semaine en plus de la vue jour/mois/année
- [ ] Drag & drop pour réassigner un job à une autre date
- [ ] Filtres par statut, par équipe, par véhicule
- [ ] Code couleur par type de job ou par équipe

#### Profil & compte

- [ ] Permettre le changement de photo de profil depuis la galerie et la caméra
- [ ] Historique des jobs réalisés par un employé **[+ Server]**
- [ ] Statistiques personnelles (nombre de jobs, heures travaillées, XP gagné) **[+ Server]**
- [ ] **Écran employé** — dashboard dédié avec heures travaillées dans la semaine (plage de dates modifiable), heures par jour, stats de travail. Accessible depuis le profil **[+ Server]**

#### Job Details

- [ ] Carousel/slide pour les photos en mode plein écran (swipe gauche/droite)
- [ ] Système de notes/commentaires sur un job (communication interne) **[+ Server]**
- [ ] Historique des modifications d'un job (audit trail) **[+ Server]**
- [ ] Pièces jointes (documents, devis, contrats) **[+ Server]**
- [ ] Signature client digitale améliorée (capture plus fluide)
- [ ] Classifier les jobs par niveau de difficulté **[+ Server]**
- [ ] Lier 2 jobs entre eux (interstate) **[+ Server]**
- [ ] Support multi-camions par job (code `trucksCount` existant mais désactivé) **[+ Server]**
- [ ] Page "Logs" : historique des actions sur un job (pour les contractors) **[+ Server]**

#### Gestion du personnel

- [ ] Vue planning par employé (tous ses jobs sur une timeline) **[+ Server]**
- [ ] Gestion des disponibilités/indisponibilités **[+ Server]**
- [ ] Système de compétences/qualifications par employé **[+ Server]**
- [ ] Affectation automatique suggérée (disponibilité + proximité) **[+ Server]**
- [ ] Quota d'heures par travailleur (max heures/semaine, tracking cumulé) **[+ Server]**
- [ ] **Page clients** — liste des clients de la société, accès patron uniquement **[+ Server]**
- [ ] **Parrainage récompensé** — ajout prestataire via code invite / lien de parrainage **[+ Server]**

#### Véhicules

- [ ] Suivi kilométrique par véhicule **[+ Server]**
- [ ] Alertes de maintenance (vidange, contrôle technique) **[+ Server]**
- [ ] Disponibilité du véhicule sur le calendrier **[+ Server]**

#### Messagerie

- [ ] Implémenter un vrai système de messagerie interne **[+ Server]** (✅ support messaging fait, chat interne reste à faire)
- [ ] Appel d'urgence pour contractors et contractee (bouton rapide)

#### Carte

- [ ] MapView intégrée pour le contractee (trajet + temps estimé)

#### Qualité & onboarding

- [ ] **Mini tutoriel** première utilisation — tooltips/coach marks par page au 1er lancement
- [ ] **Audit i18n** — vérifier que tous les éléments sont traduits dans toutes les langues

#### Satisfaction

- [ ] Générer une demande d'avis automatique (happy customer → review) **[+ Server]**
- [ ] Bouton avis Google (en suspens — pas de page Google Business)

### 🟢 P3

- [ ] Générateur de devis (sélection de prestations, calcul auto) **[+ Server]**
- [ ] Conversion devis → job en un clic **[+ Server]**
- [ ] Factures PDF avec branding **[+ Server]**
- [ ] Chat interne entre membres de l'équipe **[+ Server]**
- [ ] Chat avec le client final (lié au job) **[+ Server]**
- [ ] Partage de position en temps réel ("le déménageur arrive dans X min") **[+ Server]**
- [ ] Notation du job par le client final (étoiles + commentaire) **[+ Server]**
- [ ] Notation interne de l'employé par le patron **[+ Server]**
- [ ] Calcul d'itinéraire optimisé entre les jobs de la journée
- [ ] Tracking GPS de la flotte en temps réel (opt-in) **[+ Server]**
- [ ] Système de numérotation des cartons (packing) **[+ Server]**
- [ ] Page de stockage (inventaire items, logs entrée/sortie) **[+ Server]**
- [ ] Développer le système de récompenses (plus de badges, challenges, classements) **[+ Server]**
- [ ] Système de points par job (succès, missions accomplies) **[+ Server]**
- [ ] Développer les niveaux (levels) et badges/succès déblocables **[+ Server]**

### ⚪ P4

- [ ] Annuaire entreprises partenaires par zone géographique **[+ Server]**
- [ ] Système d'appels d'offres entre entreprises **[+ Server]**
- [ ] Synchronisation calendrier Google/iCal
- [ ] Recommandation au client (guide/tips déménagement)

---

## 🖥️ Server (Backend Node.js)

### 🔴 P0

- [ ] Vérifier que la clé Stripe live est bien configurée (secret key + webhook signing secret) — **Actuellement en mode TEST** (`sk_test_`, `pk_test_`). Romain doit récupérer les clés live depuis le dashboard Stripe.

### 🟠 P1

- [x] Implémenter la gestion des plans côté backend (endpoint upgrade/downgrade) ✅ Table `plans` créée avec 4 plans (free/pro/expert/unlimited), endpoints GET /v1/plans, GET /v1/company/plan, POST /v1/admin/company/plan
- [x] Implémenter les limites par plan (nombre de jobs, staff, véhicules) ✅ Limites stockées en DB, endpoint company/plan retourne l'usage

#### Onboarding v2 — Backend

- [x] **Auto-login après verify email** — modifier l'endpoint verify pour retourner un token de session directement (plus de re-login) ✅ verifyMail.js crée session (sessionToken + refreshToken) quand payload `device` fourni
- [x] **Inscription allégée** — modifier l'endpoint register pour n'exiger que 5 champs (first_name, last_name, email, password, company_name), rendre le reste optionnel ✅ subscribe.js accepte companyName, crée company avec company_code aléatoire + lie user comme boss
- [x] **Draft profile** — endpoint PATCH `/v1/company/:id` pour sauvegarder progressivement les infos business (27 champs : ABN, phone, address, insurance, banking, legal…) ✅ updateCompanyById.js allowedFields étendu de 10 → 27
- [ ] **Checklist onboarding** — endpoint GET `/v1/onboarding/checklist` retournant l'état de chaque item (profile_complete, first_job_created, team_invited, stripe_setup, first_payment)
- [ ] **Préremplissage Stripe** — passer les données company (name, email, phone, address, ABN) à l'API Stripe Connect Account lors de la création
- [ ] **Plan selection tardif** — endpoint pour stocker `planType` + `commissionRate` au moment du choix (après 1er job, pas pendant onboarding)

#### Modèles de job modulaires & calcul d'heures

- [x] **Modèle de données segments** — table `job_segments` (type, ordre, lieu, heure_début, heure_fin, job_id) + table `job_templates` (nom, segments par défaut, mode de facturation) ✅ Migration 013 + 014
- [x] **Types de lieux** — table/enum `location_types` (maison, appartement, garage, stockage privé, dépôt, bureau…) ✅ segment_type ENUM
- [x] **Assignation employé ↔ segment** — table `segment_assignments` (employee_id, segment_id, heures travaillées) ✅ segment_employee_assignments
- [x] **Modes de facturation** — logique de calcul selon le mode du template (lieu-à-lieu vs dépôt-à-dépôt) avec gestion du temps de retour configurable ✅ jobTimeBreakdown.js
- [x] **Endpoint récapitulatif heures** — GET `/v1/jobs/:id/time-breakdown` retournant chaque segment, durée, employés, et coût calculé ✅
- [x] **CRUD templates de job** — endpoints pour créer/modifier/supprimer des modèles de job modulaires ✅ modularTemplates.js + jobSegments.js

- [ ] Domaine personnalisé pour les liens de paiement
- [ ] Dashboard admin pour visualiser les commissions collectées
- [x] Ajuster les taux de commission selon le plan de l'entreprise ✅ Sync automatique plan → stripe_platform_fee_percentage
- [x] Endpoint "mot de passe oublié" (envoi email + reset token)
- [ ] Facture mensuelle automatique pour le contractor (récapitulatif des jobs réalisés)
- [ ] Revoir les mails de facturation (contenu, format, envoi)
- [ ] Facturation et calcul d'heures entre prestataires (contractor ↔ contractee)
- [ ] Section contrats : gestion des clauses (contractee, contractor, client)
- [ ] Module de documentation / formation pour les employés (feature payante)

### 🟡 P2

- [ ] Notification à l'employé quand un job lui est assigné
- [ ] Notification au patron quand un job est accepté/refusé
- [ ] Notification pour les contre-propositions B2B
- [ ] Récapitulatif quotidien des jobs du jour (notification matinale optionnelle)
- [ ] Proposer une réponse par mail aux messages d'aide/soutiens

### 🟢 P3

- [ ] Suivi des paiements (payé / en attente / en retard) + relance auto des impayés
- [ ] Dashboard revenus (journalier, hebdomadaire, mensuel)
- [ ] Rapport de productivité par employé
- [ ] Rapport d'utilisation des véhicules
- [ ] Export CSV/PDF des rapports
- [ ] KPI : taux de complétion, temps moyen par job, revenu par job
- [ ] Envoi de SMS/email automatique au client (confirmation RDV, rappel)
- [ ] Agrégation des notes sur le profil public de l'entreprise
- [ ] Estimation du temps de trajet

### ⚪ P4

- [ ] Matching automatique contractee/contractor par distance et disponibilité
- [ ] Évaluation et notation des partenaires B2B
- [ ] Prédiction de la durée d'un job basée sur l'historique (IA)
- [ ] Optimisation automatique du planning (IA)
- [ ] Détection d'anomalies (job anormalement long, facturation inhabituelle)
- [ ] Assistant IA pour la création de devis
- [ ] IA conversationnelle pour les messages entrants (Holloway-style)
- [ ] Intégration comptabilité (QuickBooks, Sage, etc.)
- [ ] API publique pour intégrations tierces
- [ ] Webhook pour événements (job créé, complété, payé)
- [ ] Adapter la facturation aux réglementations locales (TVA, numéros de facture)
- [ ] Support de devises multiples
- [ ] Conformité RGPD complète (export/suppression des données utilisateur)

---

## 👤 Tâches manuelles (Romain)

### 🔴 P0

- [ ] Effectuer un paiement réel de test en production pour valider le flow complet

### 🟠 P1

- [x] Définir les plans tarifaires finaux (Free / Pro / Expert / Unlimited) avec leurs limites ✅ 4 plans définis en DB
- [ ] Valider le système de commission (application_fee_amount) en production
- [ ] Tester Apple Pay / Google Pay via PaymentSheet
- [ ] Valider le flow complet PaymentSheet sur iOS et Android

### 🟡 P2

- [ ] Tester l'enregistrement du device token sur iOS physique
- [ ] Tester l'enregistrement du device token sur Android physique
- [ ] Valider le routing des notifications (foreground / background / app fermée)

---

## 🔧 Dette technique

| Élément                                           | Fichier(s)                     | Priorité |
| ------------------------------------------------- | ------------------------------ | -------- |
| DelegateJobWizard trop gros (~1800 lignes)        | `DelegateJobWizard/index.tsx`  | 🟡       |
| ContractorJobWizardModal trop gros (~2000 lignes) | `ContractorJobWizardModal.tsx` | 🟡       |
| Timer sync désactivé côté backend                 | `jobValidation.ts`             | 🟠       |
| Mock data fallback dans useBusinessStats          | `useBusinessStats.ts`          | 🟡       |
| Manque de React.memo sur les composants de liste  | Multiples                      | 🟢       |
| ~~connection.jsx encore en .jsx (pas .tsx)~~      | ~~`connection.jsx`~~ ✅ supprimé | ~~🟢~~  |

---

## 📅 Planning prévisionnel

| Version    | Période      | Focus                                                      |
| ---------- | ------------ | ---------------------------------------------------------- |
| **v1.1.x** | Avril 2026   | P0 — Sécurité, stabilisation, bug Stripe                   |
| **v1.2**   | Mai 2026     | P1 — Onboarding v2, PaymentSheet, Stripe subscriptions      |
| **v1.3**   | Juin 2026    | P1 — Contrats modulaires, personnalisation app, plans payants |
| **v1.4**   | Été 2026     | P2 — UX améliorations (calendrier, profil, jobs)           |
| **v2.0**   | Automne 2026 | P3 — Devis/facturation, rapports, communication            |
| **v3.0**   | 2027         | P4 — Marketplace, IA, intégrations                         |

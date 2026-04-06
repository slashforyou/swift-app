# Parcours d'Onboarding Utilisateur — Cobbr App

> **Dernière mise à jour :** 2 avril 2026
> **Source :** Analyse du code source (react-native / expo)

---

## Vue d'ensemble

L'app propose **deux parcours d'inscription** distincts. Depuis l'Onboarding v2, le flow est simplifié : auto-login après vérification email, checklist d'activation sur la Home, et Stripe Connect différé (soft gate → hard gate).

```
┌─────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│  Écran de   │────▶│  Choix du type de    │──┬─▶│  Inscription      │
│  connexion  │     │  compte              │  │  │  Employé (simple) │
└─────────────┘     └──────────────────────┘  │  │  (6 champs)       │
                                               │  └───────────────────┘
                                               │
                                               └─▶┌───────────────────────┐
                                                   │  Inscription Business │
                                                   │  Owner (8 étapes)     │
                                                   └───────────────────────┘
                                                              │
                                                              ▼
                                              ┌───────────────────────────┐
                                              │  Vérification email       │
                                              └───────────────────────────┘
                                                              │
                                                              ▼  ✅ AUTO-LOGIN
                                              ┌───────────────────────────┐
                                              │  Home (Activation Hub)    │
                                              │  • Checklist onboarding   │
                                              │  • Soft gate Stripe ⚠️    │
                                              └───────────────────────────┘
                                                     │            │
                                                     ▼            ▼
                                              ┌────────────┐ ┌──────────────────┐
                                              │ Complete   │ │ Stripe Connect   │
                                              │ Profile    │ │ (quand prêt)     │
                                              └────────────┘ └──────────────────┘
```

> **Changements Onboarding v2 :**
>
> - ❌ Plus de redirect vers Login après vérification email → ✅ auto-login direct
> - ❌ Plus de Stripe Connect obligatoire immédiat → ✅ soft gate (banner) + hard gate (bloque uniquement au paiement)
> - ✅ Inscription allégée : 6 champs (+ company name), le serveur crée la company automatiquement
> - ✅ Checklist d'activation sur la Home (profil, 1er job, équipe, Stripe, paiement)
> - ✅ Écran "Complete Profile" avec 5 sections accordion (accessible depuis la checklist)

---

## ÉCRAN 1 — Connexion (point d'entrée)

**Fichier :** `src/screens/connection.tsx`

L'utilisateur arrive ici au lancement de l'app. Un `ensureSession()` vérifie s'il est déjà authentifié → si oui, redirection directe vers Home.

**Ce que l'utilisateur voit :**

- Logo Cobbr
- Bouton **"Login"** → navigue vers l'écran de Login
- Bouton **"Register"** → navigue vers le choix du type de compte
- Sélecteur de langue (🌐)

**Aucun champ de saisie** — c'est un écran de choix.

---

## ÉCRAN 2 — Choix du type de compte

**Fichier :** `src/screens/connectionScreens/registerTypeSelection.tsx`

**Ce que l'utilisateur voit :**
Deux cartes cliquables :

| Carte | Icône | Description | Badge |
|-------|-------|-------------|-------|
| **Business Owner** | 🏢 | Créer et gérer une entreprise | ⭐ Recommandé |
| **Employee** | 👤 | Rejoindre une équipe existante | — |

**Features affichées pour Business Owner :**

1. Configuration de l'entreprise
2. Compte bancaire
3. Stripe Connect + choix d'abonnement

**Features affichées pour Employee :**

1. Profil basique
2. Vérification email
3. Onboarding rapide

**Navigation :**

- Clic sur Business Owner → `BusinessOwnerRegistration` (wizard 8 étapes)
- Clic sur Employee → `Subscribe` (formulaire simple)
- Bouton retour → `Connection`

---

## PARCOURS A — Inscription Employé (rapide)

### A.1 — Formulaire d'inscription

**Fichier :** `src/screens/connectionScreens/subscribe.tsx`

**Un seul écran, 6 champs :**

| Champ | Type | Obligatoire | Validation |
|-------|------|:-----------:|------------|
| Prénom | Texte | ✓ | Non vide |
| Nom | Texte | ✓ | Non vide |
| Email | Email | ✓ | Format email valide |
| Nom de l'entreprise | Texte | ✓ | Non vide, min 2 caractères |
| Mot de passe | Password | ✓ | 8+ chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial |
| Confirmer mot de passe | Password | ✓ | Doit correspondre au mot de passe |

**Bouton :** "S'inscrire"

**Appel API :**

```
POST {serverUrl}/subscribe
Body: { mail, password, firstName, lastName, companyName }
```

**Ce que le serveur fait :**

1. Crée le compte utilisateur
2. Crée automatiquement une company avec `company_code` aléatoire (6 hex)
3. Lie l'utilisateur à la company en tant que `boss`
4. Met `owner_user_id` sur la company

**Réponse succès :** `{ success: true, user: { id } }`

**Navigation :** → Écran de vérification email (avec `id`, `mail`, `firstName`, `lastName`)

---

### A.2 — Vérification email

**Fichier :** `src/screens/connectionScreens/subscribeMailVerification.tsx`

| Champ | Type | Obligatoire | Validation |
|-------|------|:-----------:|------------|
| Code de vérification | Texte (6 chiffres) | ✓ | Exactement 6 chiffres (`^\d{6}$`) |

**Mode test :** Les emails finissant en `.test`, `@swiftapp.test`, `@mailinator.com` acceptent le code `123456`.

**Appel API :**

```
POST {serverUrl}/verifyMail
Body: { mail, code, device: { deviceId, deviceName, platform, appVersion } }
```

**Après vérification (Onboarding v2 — auto-login) :**

1. Le serveur valide le code ET crée une session automatiquement (grâce au payload `device`)
2. Le serveur retourne `{ success: true, autoLogin: true, sessionToken, refreshToken, user: {...} }`
3. Le client stocke les tokens dans SecureStore (`session_token`, `refresh_token`, `session_expiry`, `user_data`)
4. Navigation directe vers **Home** via `navigation.reset()` (pas de passage par Login)

> ⚠️ **Ancien flow (obsolète) :** Vérification → Login manuel → Home. Maintenant supprimé.

---

## PARCOURS B — Inscription Business Owner (8 étapes)

**Fichier principal :** `src/screens/registration/BusinessOwnerRegistration.tsx`

**Persistance :** Le brouillon est sauvegardé automatiquement dans AsyncStorage (`@registration_business_owner_draft`) → l'inscription peut être reprise après interruption.

**Barre de progression :** Un stepper visuel (`ProgressStepperModern`) montre l'avancement 1→8.

---

### B.1 — Informations personnelles 👤

**Fichier :** `src/screens/registration/steps/PersonalInfoStepImproved.tsx`

| Champ | Type | Obligatoire | Validation | Notes |
|-------|------|:-----------:|------------|-------|
| Prénom | Texte | ✓ | Non vide | Auto-focus, tab vers suivant |
| Nom | Texte | ✓ | Non vide | — |
| Email | Email | ✓ | Format email | — |
| Téléphone | Téléphone | ✓ | 9-10 chiffres, format AU | Auto-formaté |
| Date de naissance | Date picker | ✓ | Âge ≥ 18 ans | Format DD-MM-YYYY |
| Mot de passe | Password | ✓ | 8+ chars, mixte | Indicateur de force coloré |
| Confirmer mot de passe | Password | ✓ | Doit correspondre | — |

**Fonctionnalités :**

- Indicateur de force du mot de passe (code couleur)
- Vérification de caractères invalides (unicode)
- Auto-remplissage de données test en mode DEV

---

### B.2 — Détails de l'entreprise 🏢

**Fichier :** `src/screens/registration/steps/BusinessDetailsStepImproved.tsx`

| Champ | Type | Obligatoire | Validation | Notes |
|-------|------|:-----------:|------------|-------|
| Nom de la société | Texte | ✓ | Non vide | — |
| Nom commercial | Texte | ✗ | — | Optionnel |
| ABN | Texte | ✓ | 11 chiffres + checksum valide | Auto-formaté |
| ACN | Texte | ✗ | 9 chiffres + checksum si rempli | Optionnel |
| Type d'entreprise | Dropdown | ✓ | `sole_trader`, `partnership`, `company`, `trust` | Défaut: sole_trader |
| Type d'industrie | Dropdown | verrouillé | "removals" | Hardcodé pour la v1 |
| Email de l'entreprise | Email | ✗ | Format email si rempli | Optionnel |
| Téléphone entreprise | Téléphone | ✓ | 9-10 chiffres, format AU | Auto-formaté |

**Validation ABN :** Algorithme de checksum Australian Business Number.

---

### B.3 — Adresse de l'entreprise 📍

**Fichier :** `src/screens/registration/steps/BusinessAddressStepImproved.tsx`

| Champ | Type | Obligatoire | Validation | Notes |
|-------|------|:-----------:|------------|-------|
| Adresse | Texte | ✓ | Non vide | Ligne 1 uniquement |
| Ville/Suburb | Texte | ✓ | Non vide | — |
| État | Picker | ✓ | NSW, VIC, QLD, SA, WA, TAS, NT, ACT | Défaut: NSW |
| Code postal | Texte | ✓ | Code postal AU valide | Validation par plage selon l'état |
| Pays | Texte | auto | "Australia" | Hardcodé |

---

### B.4 — Informations bancaires 🏦

**Fichier :** `src/screens/registration/steps/BankingInfoStepImproved.tsx`

| Champ | Type | Obligatoire | Validation | Notes |
|-------|------|:-----------:|------------|-------|
| BSB | Texte | ✓ | 6 chiffres, code bancaire valide | Auto-formaté `XXX-XXX` |
| Numéro de compte | Texte | ✓ | 6-10 chiffres | — |
| Nom du titulaire | Texte | ✓ | Non vide | Auto-capitalisé |

---

### B.5 — Assurance 🛡️ (optionnel)

**Fichier :** `src/screens/registration/steps/InsuranceStepImproved.tsx`

| Champ | Type | Obligatoire | Validation | Notes |
|-------|------|:-----------:|------------|-------|
| Avez-vous une assurance ? | Toggle Switch | ✓ | On/Off | Défaut: Off |
| Fournisseur d'assurance | Texte | si toggle ON | Non vide | Conditionnel |
| N° de police | Texte | si toggle ON | Non vide | Conditionnel |
| Date d'expiration | Texte | si toggle ON | Non vide | Conditionnel |

**Logique :** Si toggle OFF → chaînes vides sauvegardées. Si toggle ON → tous les sous-champs deviennent obligatoires.

---

### B.6 — Choix d'abonnement 💳

**Fichier :** `src/screens/registration/steps/SubscriptionPlanStepImproved.tsx`

| Champ | Type | Obligatoire | Validation | Notes |
|-------|------|:-----------:|------------|-------|
| Plan | Cartes/Radio | ✓ | Doit choisir un plan | 3 options |
| Fréquence de facturation | Toggle | ✓ | Mensuel / Annuel | — |

**Plans disponibles :**

| Plan | Mensuel | Annuel | Jobs/mois | Users | Support |
|------|---------|--------|-----------|-------|---------|
| **Starter** | $49 | $490 | 20 | 1 | Basic |
| **Professional** | $99 | $990 | 100 | 5 | Prioritaire + Analytics |
| **Enterprise** | $199 | $1990 | Illimité | Illimité | 24/7 + Advanced |

> ⚠️ **Note :** Ces plans sont affichés côté client mais le paiement n'est pas encore connecté (pas de flow Stripe Billing intégré à ce stade).

---

### B.7 — Accords légaux 📋

**Fichier :** `src/screens/registration/steps/LegalAgreementsStepImproved.tsx`

| Checkbox | Obligatoire | Action |
|----------|:-----------:|--------|
| Conditions Générales d'Utilisation | ✓ | Lien cliquable vers le document |
| Politique de Confidentialité | ✓ | Lien cliquable vers le document |
| Conditions Stripe Connect | ✓ | Lien cliquable vers les CGU Stripe |

**Les 3 doivent être cochées pour continuer.**

---

### B.8 — Récapitulatif & Soumission ✓

**Fichier :** `src/screens/registration/steps/ReviewStepImproved.tsx`

**Ce que l'utilisateur voit :**

- Cartes récapitulatives pour chaque étape (1-7)
- Chaque carte a un bouton **"Modifier"** → retour à l'étape correspondante
- Bouton **"Soumettre"**

**Sections affichées :**

1. Informations personnelles
2. Détails de l'entreprise
3. Adresse
4. Informations bancaires
5. Assurance (si renseignée)
6. Plan d'abonnement
7. Accords légaux

**Ce qui se passe au clic "Soumettre" :**

1. **Appel API** — Création du compte utilisateur :

   ```
   POST {serverUrl}/subscribe
   Body: { mail, firstName, lastName, password, companyName }
   ```

   > Le serveur crée également la company automatiquement (comme pour le parcours A).

2. **Sauvegarde locale** — Les données des étapes 2-7 sont stockées dans AsyncStorage sous `@pending_business_owner_profile` :

   ```json
   {
     "businessDetails": { "companyName", "tradingName", "abn", "acn", ... },
     "businessAddress": { "streetAddress", "suburb", "state", "postcode" },
     "bankingInfo": { "bsb", "accountNumber", "accountName" },
     "insurance": { "hasInsurance", "insuranceProvider", ... },
     "subscription": { "planType", "billingFrequency" },
     "legalAgreements": { "termsAccepted", "privacyAccepted", "stripeAccepted", "acceptedAt" }
   }
   ```

3. **Nettoyage** — Le brouillon `@registration_business_owner_draft` est supprimé

4. **Navigation** → Écran de vérification email (même que parcours A.2)

---

## ÉCRAN COMMUN — Login

**Fichier :** `src/screens/connectionScreens/login.tsx`

> **Note Onboarding v2 :** Cet écran n'est plus atteint après la vérification email (auto-login). Il reste utilisé pour les reconnexions ultérieures et le flow "mot de passe oublié".

| Champ | Type | Obligatoire | Validation |
|-------|------|:-----------:|------------|
| Email | Email | ✓ | Format valide |
| Mot de passe | Password | ✓ | Non vide |

**Actions :**

- **"Se connecter"** → `POST /auth/login` avec payload device
- **"Mot de passe oublié ?"** → écran ForgotPassword
- Stockage SecureStore : `session_token`, `refresh_token`, `session_expiry`, `user_data`

**Après login (Business Owner) :**

- `hasPendingProfile()` détecte les données dans `@pending_business_owner_profile`
- Appel `POST /business-owner/complete-profile` avec toutes les données métier
- Nettoyage de `@pending_business_owner_profile`
- Déclenchement potentiel du flux Stripe Connect

---

## HOME — Activation Hub (Onboarding v2)

**Fichiers :**

- `src/screens/home.tsx`
- `src/components/home/OnboardingChecklist.tsx`
- `src/hooks/useOnboardingChecklist.ts`

Après l'auto-login, l'utilisateur arrive sur la Home qui affiche une **checklist d'activation** guideée :

| Item | Condition de complétion | Navigation |
|------|------------------------|------------|
| ✅ Complete business profile | `profile_completed === 1` en DB | → CompleteProfile |
| ✅ Create your first job | Au moins 1 job créé | → CreateJob |
| ✅ Invite your team | Au moins 1 membre d'équipe | → AddEmployee |
| ✅ Setup payments (Stripe) | Stripe Connect activé (`charges_enabled`) | → StripeHub |
| ✅ Get your first payment | Au moins 1 paiement reçu | → Jobs |

**Comportement :**

- Barre de progression animée (ex: 2/5 = 40%)
- Checkmark animé quand un item est complété
- Masquée quand tous les items sont complétés (`allComplete`)

### Soft gate Stripe ⚠️

Banner ambre persistante sur la Home tant que Stripe n'est pas activé :

- Icône `warning-outline` + texte "Payments not set up"
- CTA "Setup payments" → StripeHub
- Non bloquant, l'utilisateur peut utiliser l'app

### Hard gate Stripe 🚫

Bloque UNIQUEMENT lors d'actions de paiement :

- "Charge client", "Send invoice", "Mark as paid"
- Hook `useStripeGate.ts` avec `guardStripeAction()`
- Alert : "You're 1 step away from getting paid" + CTA "Setup payments (2 min)"
- Navigation auto vers StripeHub

---

## ÉCRAN — Complete Profile

**Fichier :** `src/screens/CompleteProfileScreen.tsx`

Accessible depuis la checklist Home. Permet de compléter progressivement le profil business.

**5 sections accordion :**

| Section | Champs | Obligatoire |
|---------|--------|:-----------:|
| **Business Details** | Company name, Trading name, ABN, ACN, Business type, Industry type, Phone | Partiellement |
| **Contact** | Business email, Business phone | ✗ |
| **Address** | Street, Suburb, State (chips NSW…ACT), Postcode | ✓ |
| **Banking** | BSB, Account number, Account name | ✗ |
| **Insurance** | Toggle On/Off + Provider, Policy number, Expiry | ✗ |

**Appel API :**

```
PATCH {serverUrl}/v1/company/{companyId}
Body: { ...fields, profile_completed: 1 }
```

> Le backend `updateCompanyById.js` accepte 27 champs (extended pour l'onboarding v2).

---

## PARCOURS STRIPE CONNECT (Business Owner uniquement)

**Fichier de navigation :** `src/navigation/StripeOnboardingStack.tsx`

Ce flux se déclenche après la complétion du profil business, si le compte Stripe nécessite configuration. Il comprend **10 sous-écrans** :

### S.1 — Bienvenue

**Fichier :** `src/screens/Stripe/OnboardingFlow/WelcomeScreen.tsx`

Introduction aux avantages de Stripe Connect. Bouton "Démarrer l'onboarding" → appelle `startOnboarding("company")`.

### S.2 — Informations personnelles

**Fichier :** `src/screens/Stripe/OnboardingFlow/PersonalInfoScreen.tsx`

| Champ | Type | Obligatoire | Validation |
|-------|------|:-----------:|------------|
| Prénom | Texte | ✓ | Non vide |
| Nom | Texte | ✓ | Non vide |
| Date de naissance | Date picker | ✓ | Âge ≥ 18 |
| Email | Email | ✓ | Format valide |
| Téléphone | Téléphone | ✓ | 9-10 chiffres AU |

**API :** `POST /v1/stripe/onboarding/personal-info`

### S.3 — Profil d'entreprise

**Fichier :** `src/screens/Stripe/OnboardingFlow/BusinessProfileScreen.tsx`

Sélection du type d'entreprise côté Stripe.

### S.4 — Adresse

**Fichier :** `src/screens/Stripe/OnboardingFlow/AddressScreen.tsx`

Adresse de l'entreprise (lignes, ville, état, code postal).

### S.5 — Détails de la société

**Fichier :** `src/screens/Stripe/OnboardingFlow/CompanyDetailsScreen.tsx`

Nom légal, numéro d'enregistrement, tax ID, téléphone.

### S.6 — Représentant légal (sociétés uniquement)

**Fichier :** `src/screens/Stripe/OnboardingFlow/RepresentativeScreen.tsx`

Directeurs/représentants requis pour le type "company".

### S.7 — Compte bancaire

**Fichier :** `src/screens/Stripe/OnboardingFlow/BankAccountScreen.tsx`

| Champ | Type | Obligatoire | Validation |
|-------|------|:-----------:|------------|
| Nom du titulaire | Texte | ✓ | Non vide |
| BSB | Texte (masqué) | ✓ | 6 chiffres |
| Numéro de compte | Texte (masqué) | ✓ | 6-10 chiffres |

### S.8 — Documents

**Fichier :** `src/screens/Stripe/OnboardingFlow/DocumentsScreen.tsx`

Upload de pièce d'identité / documents de vérification.

### S.9 — Vérification

**Fichier :** `src/screens/Stripe/OnboardingFlow/ReviewScreen.tsx`

Récapitulatif + checkbox finale d'acceptation des CGU Stripe.

**Actions :**

1. `verifyOnboarding(tosAccepted)`
2. `completeOnboarding(true)`
3. → Écran de complétion

### S.10 — Complétion

**Fichier :** `src/screens/Stripe/OnboardingFlow/CompletionScreen.tsx`

Affiche le statut (charges activées / payouts activés). Bouton → **Home**.

---

## Récapitulatif des endpoints API

| Endpoint | Méthode | Moment | Rôle |
|----------|---------|--------|------|
| `/subscribe` | POST | Inscription (A.1 ou B.8) | Créer le compte utilisateur + company |
| `/verifyMail` | POST | Vérification email | Valider le code 6 chiffres + auto-login (retourne tokens) |
| `/auth/login` | POST | Reconnexion | Authentifier + tokens |
| `/business-owner/complete-profile` | POST | Après 1er login (BO legacy) | Envoyer les données métier (étapes 2-7) |
| `PATCH /v1/company/:id` | PATCH | Complete Profile | Sauvegarder les infos business (27 champs) |
| `/v1/stripe/connect/status` | GET | Vérification Stripe | Statut du compte Connect |
| `/v1/stripe/onboarding/start` | POST | Début onboarding Stripe | Initialiser le compte Connect |
| `/v1/stripe/onboarding/personal-info` | POST | Étape S.2 | Infos personnelles Stripe |
| `/v1/stripe/onboarding/business-profile` | POST | Étape S.3 | Profil entreprise |
| `/v1/stripe/onboarding/address` | POST | Étape S.4 | Adresse |
| `/v1/stripe/onboarding/bank-account` | POST | Étape S.7 | Coordonnées bancaires |
| `/v1/stripe/onboarding/document` | POST | Étape S.8 | Documents d'identité |
| `/v1/stripe/onboarding/verify` | POST | Étape S.9 | Vérification finale |
| `/v1/stripe/onboarding/complete` | POST | Étape S.9 | Complétion |
| `/v1/user/profile` | GET | Après login | Récupérer le profil complet |

---

## Persistance des données

| Clé (AsyncStorage) | Contenu | Cycle de vie |
|---------------------|---------|--------------|
| `@registration_business_owner_draft` | Brouillon complet (8 étapes) | Créé pendant l'inscription → supprimé à la soumission |
| `@pending_business_owner_profile` | Données métier (étapes 2-7) | Créé à la soumission → supprimé après `complete-profile` |

| Clé (SecureStore) | Contenu | Cycle de vie |
|--------------------|---------|--------------|
| `session_token` | JWT bearer | Créé au login → renouvelé automatiquement |
| `refresh_token` | Token de refresh | Créé au login → utilisé pour renouveler session |
| `session_expiry` | ISO timestamp | Créé au login |
| `user_data` | Profil utilisateur (JSON) | Créé au login → mis à jour périodiquement |

---

## Règles de validation globales

| Règle | Détail |
|-------|--------|
| **Mot de passe** | Min 8 chars + 1 majuscule + 1 minuscule + 1 chiffre + 1 spécial (`!@#$%^&*`) |
| **Téléphone (AU)** | 9-10 chiffres, auto-formaté |
| **ABN** | 11 chiffres + algorithme de checksum australien |
| **ACN** | 9 chiffres (optionnel) |
| **BSB** | 6 chiffres, code bancaire australien |
| **Compte bancaire** | 6-10 chiffres |
| **Code postal** | Plages valides par état australien |
| **Âge minimum** | 18 ans (date de naissance) |
| **Email** | Regex format standard |

---

## Points d'attention / faiblesses identifiées

1. ~~**Pas de paiement réel à l'inscription**~~ — Le choix de plan a été déplacé après la création du 1er job (Onboarding v2). Le paiement Stripe Billing via PaymentSheet natif est implémenté dans `SubscriptionScreen.tsx`. **En attente : création des Products/Prices dans Stripe Dashboard.**

2. ~~**Données métier en local**~~ — ✅ Résolu : `/subscribe` crée la company en DB immédiatement. `CompleteProfileScreen` sauvegarde via `PATCH /v1/company/:id` (27 champs). Endpoint `GET /v1/onboarding/checklist` implémenté (B4).

3. ~~**Double saisie**~~ — ✅ Résolu (B5) : Le Business Owner saisit ses infos dans le Complete Profile, et Stripe Connect est prérempli automatiquement depuis les données company (name, phone, ABN, address).

4. **Industrie verrouillée** — Le type d'industrie est hardcodé à "removals". À adapter si l'app s'ouvre à d'autres secteurs.

5. **Géographie AU uniquement** — Validations ABN, BSB, code postal, téléphone sont toutes australiennes. Expansion internationale nécessitera adaptation.

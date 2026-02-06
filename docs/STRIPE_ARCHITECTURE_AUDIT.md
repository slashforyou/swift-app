# 🔍 Audit Complet - Architecture Stripe Actuelle

**Date:** 4 février 2026  
**Statut:** ARCHITECTURE À REFONDRE COMPLÈTEMENT  
**Problème:** WebView Stripe utilisée ❌ → Il faut des formulaires natifs ✅

---

## ❌ PROBLÈME IDENTIFIÉ

### Architecture Actuelle (INCORRECTE)

L'implémentation utilise des **Stripe Account Links** et des **WebViews** pour diriger l'utilisateur vers des pages Stripe hébergées:

1. **Backend génère des URLs Stripe**:
   - `POST /v1/stripe/connect/create` → Retourne `onboarding_url` (lien Stripe)
   - `GET /v1/stripe/connect/onboarding` → Retourne `onboarding_url` (lien Stripe)
   - `POST /v1/stripe/connect/refresh-link` → Retourne `url` (lien Stripe)

2. **Frontend ouvre ces URLs dans WebView**:
   - `StripeConnectWebView.tsx` (251 lignes)
   - `StripeOnboardingWebView.tsx` (130 lignes)
   - Redirige vers pages Stripe externes

3. **Flux actuel**:
   ```
   User → Clique "Activer Stripe"
        → API crée compte + génère URL
        → WebView s'ouvre avec page Stripe
        → User remplit formulaire STRIPE
        → Redirects: cobbr://stripe/success
   ```

### Ce Que Veut l'Utilisateur (CORRECT)

**"IL N'Y A JAMAIS AU GRAND JAMAIS DE REDIRECTION VERS UNE PAGE STRIPE - ON RESTE TOUT LE TEMPS DANS DES CHAMPS DE L'APPLI"**

Flux attendu:

```
User → Formulaire natif React Native (Écran 1: Identité)
     → Formulaire natif (Écran 2: Adresse)
     → Formulaire natif (Écran 3: Banque)
     → Upload photo/PDF natif (Écran 4: Documents)
     → API backend envoie tout à Stripe
     → Validation Stripe + retour status
```

---

## 📂 Fichiers à Supprimer/Refondre

### À SUPPRIMER COMPLÈTEMENT ❌

1. **`src/components/stripe/StripeConnectWebView.tsx`** (251 lignes)
   - Composant WebView pour ouvrir pages Stripe
   - Plus nécessaire avec formulaires natifs

2. **`src/screens/Stripe/StripeOnboardingWebView.tsx`** (130 lignes)
   - Autre WebView pour onboarding
   - Doublon avec le précédent

3. **Endpoints backend à modifier**:
   - `POST /v1/stripe/connect/create` → Ne doit plus retourner `onboarding_url`
   - `GET /v1/stripe/connect/onboarding` → À supprimer
   - `POST /v1/stripe/connect/refresh-link` → À supprimer

### À REFONDRE COMPLÈTEMENT 🔄

1. **`src/services/StripeService.ts`** (2520 lignes)
   - **Fonctions à supprimer**:
     - `getStripeConnectOnboardingLink()` (lignes 215-266)
     - `createStripeConnectAccountAndLink()` (lignes 674-728)
     - `refreshStripeAccountLink()` (lignes 2453-2527)
   - **Fonctions à créer**:
     - `submitStripeOnboardingData(data: OnboardingData)` → Envoie données au backend
     - `uploadStripeDocument(file: File, type: string)` → Upload document (ID, justificatif)
     - `validateStripeAccount()` → Vérifie si compte complet

2. **`src/screens/business/StripeHub.tsx`** (995 lignes)
   - **Code à supprimer**:
     - Lines 110-112: `const [showStripeWebView, setShowStripeWebView] = useState(false)`
     - Lines 148-166: `handleCompleteProfile()` → Ouvre WebView
     - Lines 178-213: `handleStripeConnect()` → Crée account link
     - Lines 216-240: WebView handlers (close, success, error)
     - Lines 960-995: `<StripeConnectWebView>` components (2 instances)
   - **Nouvelle logique à implémenter**:
     - Détection état compte: `none` / `incomplete` / `complete`
     - Redirection vers formulaires natifs selon état
     - Affichage champs manquants si `incomplete`

3. **Nouveaux écrans à créer**:
   - `src/screens/Stripe/OnboardingFlow/PersonalInfoScreen.tsx`
   - `src/screens/Stripe/OnboardingFlow/AddressScreen.tsx`
   - `src/screens/Stripe/OnboardingFlow/BankAccountScreen.tsx`
   - `src/screens/Stripe/OnboardingFlow/DocumentsScreen.tsx`
   - `src/screens/Stripe/OnboardingFlow/ReviewScreen.tsx`

---

## 🏗️ Architecture Actuelle (Détails)

### Backend Endpoints Existants

#### ✅ Endpoints à GARDER

1. **`GET /v1/stripe/connect/status?company_id=X`**
   - Retourne: `isConnected`, `status`, `account`
   - Utilisé par: `checkStripeConnectionStatus()`
   - Status: OK, ne change pas

2. **`GET /v1/stripe/company/{id}/account`**
   - Retourne: Détails complets du compte Stripe
   - Inclut: `requirements.currently_due`, `charges_enabled`, `payouts_enabled`
   - Utilisé par: `fetchStripeAccount()`
   - Status: OK, à enrichir avec plus de détails

3. **`GET /v1/stripe/company/{id}/payments`**
   - Retourne: Liste des paiements
   - Status: OK, ne change pas

4. **`GET /v1/stripe/payment-links/list?company_id=X`**
   - Retourne: Liste des liens de paiement
   - Status: OK, ne change pas

5. **`GET /v1/stripe/balance`**
   - Retourne: Balance du compte
   - Status: OK, ne change pas

#### ❌ Endpoints à SUPPRIMER

1. **`POST /v1/stripe/connect/create`**
   - Problème: Retourne `onboarding_url` (lien Stripe externe)
   - Nouveau comportement: Créer compte silencieusement, retourner `stripe_account_id` seulement

2. **`GET /v1/stripe/connect/onboarding`**
   - Problème: Génère un Account Link Stripe
   - À supprimer: Remplacé par formulaires natifs

3. **`POST /v1/stripe/connect/refresh-link`**
   - Problème: Génère un Account Link pour compléter profil
   - À supprimer: Formulaires natifs gèrent la complétion

#### 🆕 Endpoints à CRÉER

1. **`POST /v1/stripe/onboarding/personal-info`**

   ```json
   {
     "first_name": "John",
     "last_name": "Doe",
     "dob": "1990-01-15",
     "email": "john@example.com",
     "phone": "+61400000000",
     "id_number": "123456789" // Tax ID ou SSN
   }
   ```

   → Backend appelle Stripe: `stripe.accounts.update(account_id, { individual: {...} })`

2. **`POST /v1/stripe/onboarding/address`**

   ```json
   {
     "line1": "123 Main St",
     "line2": "Apt 4",
     "city": "Sydney",
     "state": "NSW",
     "postal_code": "2000",
     "country": "AU"
   }
   ```

   → Backend: `stripe.accounts.update(account_id, { individual: { address: {...} } })`

3. **`POST /v1/stripe/onboarding/bank-account`**

   ```json
   {
     "account_holder_name": "John Doe",
     "account_number": "000123456",
     "routing_number": "110000", // BSB pour AU
     "country": "AU",
     "currency": "aud"
   }
   ```

   → Backend: `stripe.accounts.createExternalAccount(account_id, { ... })`

4. **`POST /v1/stripe/onboarding/document`**

   ```
   Content-Type: multipart/form-data
   - file: <binary>
   - document_type: "identity_document" | "address_document"
   - side: "front" | "back"
   ```

   → Backend: Upload à Stripe Files API → Attach to account

5. **`POST /v1/stripe/onboarding/complete`**
   ```json
   {
     "terms_accepted": true
   }
   ```
   → Backend: Marque le compte comme `details_submitted`
   → Retourne: Statut final du compte

---

## 📊 État Actuel du Frontend

### Composants Existants

1. **`StripeHub.tsx`** (995 lignes)
   - **État actuel**: Hub principal avec stats, boutons, WebView
   - **Hooks utilisés**:
     - `useStripeConnection()` → Statut connexion
     - `useStripeAccount()` → Détails compte
     - `useStripePayments()` → Liste paiements
     - `useStripePayouts()` → Liste payouts
   - **Logique d'affichage**:
     - Lines 551-617: `getAccountStatusBadge()` → 4 états (Complete, Restricted, Pending, Incomplete)
     - Lines 685-820: Affichage requirements manquants avec bouton "Compléter mon profil"
   - **Actions**:
     - `handleStripeConnect()` → Appelle `createStripeConnectAccountAndLink()` ❌
     - `handleCompleteProfile()` → Appelle `refreshStripeAccountLink()` ❌

2. **`StripeConnectWebView.tsx`** (251 lignes)
   - Modal fullscreen avec WebView
   - Props: `visible`, `onClose`, `onSuccess`, `accountLinkUrl`
   - Détecte redirects: `/stripe/success`, `/stripe/refresh`
   - **À SUPPRIMER**

3. **`StripeOnboardingWebView.tsx`** (130 lignes)
   - Similaire au précédent, doublon
   - **À SUPPRIMER**

### Hooks Stripe

1. **`useStripeConnection()`** (localisation inconnue)
   - Retourne: `{ isConnected, status, loading, error, refresh() }`
   - Appelle: `checkStripeConnectionStatus()`
   - **À GARDER**

2. **`useStripeAccount()`** (localisation inconnue)
   - Retourne: `{ account, balance, loading, error, refresh() }`
   - Appelle: `fetchStripeAccount()`, `fetchStripeBalance()`
   - **À GARDER**

3. **`useStripePayments()`** (localisation inconnue)
   - Retourne: `{ payments, loading, error, refresh() }`
   - **À GARDER**

4. **`useStripePayouts()`** (localisation inconnue)
   - Retourne: `{ payouts, loading, error, refresh() }`
   - **À GARDER**

---

## 🎯 Plan de Refonte

### Phase 1: Nettoyage (1-2 heures)

- [ ] Supprimer `StripeConnectWebView.tsx`
- [ ] Supprimer `StripeOnboardingWebView.tsx`
- [ ] Supprimer imports WebView dans `StripeHub.tsx`
- [ ] Supprimer fonctions Account Links dans `StripeService.ts`:
  - `getStripeConnectOnboardingLink()`
  - `createStripeConnectAccountAndLink()`
  - `refreshStripeAccountLink()`

### Phase 2: Créer Structure Onboarding (2-3 heures)

- [ ] Créer dossier: `src/screens/Stripe/OnboardingFlow/`
- [ ] Créer stack navigation pour onboarding
- [ ] Créer écrans de base (5 écrans):
  - `WelcomeScreen.tsx` → Intro + explications
  - `PersonalInfoScreen.tsx` → Nom, prénom, date naissance, email
  - `AddressScreen.tsx` → Adresse complète
  - `BankAccountScreen.tsx` → IBAN/BSB + numéro compte
  - `DocumentsScreen.tsx` → Upload photo ID + justificatif

### Phase 3: Backend Endpoints (5-8 heures - dev backend)

- [ ] Créer `POST /v1/stripe/onboarding/personal-info`
- [ ] Créer `POST /v1/stripe/onboarding/address`
- [ ] Créer `POST /v1/stripe/onboarding/bank-account`
- [ ] Créer `POST /v1/stripe/onboarding/document`
- [ ] Créer `POST /v1/stripe/onboarding/complete`
- [ ] Modifier `POST /v1/stripe/connect/create` pour retourner seulement `account_id`
- [ ] Tester avec Stripe Test Mode

### Phase 4: Intégration Frontend (8-12 heures)

- [ ] Implémenter formulaires natifs (React Native TextInput, Picker)
- [ ] Ajouter validation des champs (email, phone, date, IBAN)
- [ ] Implémenter upload de documents (expo-image-picker + expo-document-picker)
- [ ] Ajouter progress bar (Étape 1/5, 2/5, etc.)
- [ ] Créer fonctions StripeService pour nouveaux endpoints:
  - `submitPersonalInfo(data)`
  - `submitAddress(data)`
  - `submitBankAccount(data)`
  - `uploadDocument(file, type)`
  - `completeOnboarding()`

### Phase 5: Logique StripeHub (3-4 heures)

- [ ] Refondre `handleStripeConnect()`:
  - Si pas de compte → Créer + redirect vers onboarding
  - Si compte existe → Check requirements
- [ ] Refondre `handleCompleteProfile()`:
  - Analyser `requirements.currently_due`
  - Redirect vers écran spécifique (ex: si "individual.id_number" manque → PersonalInfoScreen)
- [ ] Implémenter logique de blocage:
  - Si `incomplete` → Désactiver "Créer lien de paiement", "Effectuer payout"
  - Afficher alerte: "Veuillez compléter votre profil Stripe"

### Phase 6: Testing (2-3 heures)

- [ ] Test Scénario 1: Nouveau compte (onboarding complet)
- [ ] Test Scénario 2: Compte incomplet (complétion ciblée)
- [ ] Test Scénario 3: Upload documents (formats, tailles)
- [ ] Test Scénario 4: Validation Stripe (requirements vides après)

---

## 📝 Questions Techniques pour le Client

### 1. Onboarding Flow

**Q:** Combien d'étapes pour l'onboarding complet?

- **Option A**: 5 écrans (Welcome → Personal → Address → Bank → Documents)
- **Option B**: 3 écrans (Personal+Address → Bank → Documents)
- **Option C**: Formulaire unique long avec scroll

**Recommandation**: Option A (5 écrans) - Meilleure UX, moins intimidant

---

### 2. Upload Documents

**Q:** Quels types de documents accepter?

- **Pièce d'identité**: Photo (JPEG/PNG) ou PDF?
- **Justificatif domicile**: Photo ou PDF uniquement?
- **Taille max**: 5 MB? 10 MB?
- **Formats**: JPEG, PNG, PDF seulement?

**Recommandation**:

- Pièce d'identité: Photo (JPEG/PNG) via caméra, max 5 MB
- Justificatif: PDF ou Photo, max 10 MB
- Stripe accepte: JPEG, PNG, PDF

---

### 3. Validation Backend

**Q:** Qui valide les documents?

- **Option A**: Stripe automatiquement (délai 24-48h)
- **Option B**: Validation manuelle par admin backend
- **Option C**: Hybride (Stripe + admin pour cas douteux)

**Recommandation**: Option A (Stripe auto) - Plus rapide, moins de maintenance

---

### 4. Champs Stripe Requis

**Q:** Quels champs sont ABSOLUMENT requis pour créer un compte AU?

**Champs minimum Stripe Australia (Express Account)**:

- ✅ `individual.first_name`
- ✅ `individual.last_name`
- ✅ `individual.dob` (date de naissance)
- ✅ `individual.email`
- ✅ `individual.phone`
- ✅ `individual.address` (complet: line1, city, state, postal_code, country)
- ✅ `external_account` (compte bancaire: BSB + account number)
- ✅ `tos_acceptance` (acceptation termes Stripe)
- ⚠️ `business_profile.url` (optionnel mais recommandé)
- ⚠️ `individual.id_number` (Tax File Number - optionnel au début)

**Documents requis** (après création):

- ✅ `individual.verification.document` (ID front + back)
- ⚠️ `individual.verification.additional_document` (si Stripe demande)

---

### 5. État Compte Incomplet

**Q:** Que faire si user abandonne l'onboarding à 50%?

**Options**:

- **A**: Sauvegarder en brouillon, permettre reprise
- **B**: Forcer complétion avant de sauvegarder
- **C**: Permettre sortie, mais compte reste "incomplete"

**Recommandation**: Option C - Enregistrer progrès dans Stripe, user peut reprendre plus tard

---

### 6. Pays Supportés

**Q:** Seulement Australie ou multi-pays?

**Stripe Connect Countries**: 46 pays supportés

- Australie (AU) ✅
- France (FR) ✅
- USA (US) ✅
- UK (GB) ✅
- Canada (CA) ✅

**Recommandation**: Commencer avec AU seulement, préparer pour multi-pays (dropdown pays dans formulaire)

---

## 🚀 Délais Estimés

### Développement Frontend

- Phase 1 (Nettoyage): **1-2 heures**
- Phase 2 (Structure): **2-3 heures**
- Phase 4 (Formulaires): **8-12 heures**
- Phase 5 (Logique Hub): **3-4 heures**
- Phase 6 (Testing): **2-3 heures**
- **Total Frontend**: **16-24 heures** (~2-3 jours)

### Développement Backend

- Phase 3 (Endpoints): **5-8 heures**
- Testing + debug: **2-3 heures**
- **Total Backend**: **7-11 heures** (~1-1.5 jours)

### **TOTAL PROJET**: **23-35 heures** (~3-5 jours avec 1 dev frontend + 1 dev backend)

---

## 📞 Prochaine Étape

**Attente décision client:**

1. Confirmer approche (formulaires natifs ✅ au lieu de WebView ❌)
2. Répondre aux 6 questions techniques ci-dessus
3. Valider le nombre d'écrans pour onboarding (3, 5, ou autre?)

**Après validation client:**
→ Créer document **STRIPE_ONBOARDING_NATIVE_SPEC.md** avec:

- Maquettes des 5 écrans
- Spécifications backend détaillées (nouveaux endpoints)
- Spécifications frontend (formulaires, validation, upload)
- Séquence flow complète

---

**Document prêt pour discussion** ✅  
**Version:** 1.0 - Audit Complet  
**Dernière mise à jour:** 4 février 2026

# 🎯 Stripe Onboarding Natif - Spécifications Complètes

**Date:** 4 février 2026  
**Version:** 2.0 - Onboarding Natif (sans WebView)  
**Status:** 📋 SPÉCIFICATIONS APPROUVÉES

---

## ✅ Décisions Validées

### Réponses aux Questions Techniques

1. **Nombre d'étapes**: **5 écrans ludiques** ✅
2. **Upload documents**: **Caméra uniquement** (pas de PDF) ✅
3. **Validation**: **Stripe automatique** (24-48h) ✅
4. **Champs**: **Minimum Stripe seulement** (autres dans Paramètres plus tard) ✅
5. **Abandon onboarding**: **Sauvegarder progrès + bloquer facturation/paiements** ✅
6. **Pays**: **Australie (AU) uniquement** ✅

---

## 🎨 Architecture du Flux Onboarding

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        StripeHub.tsx                             │
│  État: isConnected = false → Bouton "Activer Stripe"            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Tap
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   WelcomeScreen.tsx                              │
│  • Icône Stripe                                                  │
│  • Titre: "Activez vos paiements en 5 étapes"                   │
│  • Liste des bénéfices                                           │
│  • Bouton "Commencer" → Navigation.push('PersonalInfo')         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              PersonalInfoScreen.tsx (Étape 1/5)                  │
│  • Progress bar: 20%                                             │
│  • Champs: Prénom, Nom, Date naissance, Email, Téléphone        │
│  • Bouton "Suivant" → Sauvegarde + Navigation.push('Address')   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│               AddressScreen.tsx (Étape 2/5)                      │
│  • Progress bar: 40%                                             │
│  • Champs: Adresse, Ville, État, Code postal                    │
│  • Bouton "Suivant" → Sauvegarde + Navigation.push('BankAccount')│
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│             BankAccountScreen.tsx (Étape 3/5)                    │
│  • Progress bar: 60%                                             │
│  • Champs: BSB (6 chiffres), Numéro compte, Nom titulaire       │
│  • Bouton "Suivant" → Sauvegarde + Navigation.push('Documents') │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│              DocumentsScreen.tsx (Étape 4/5)                     │
│  • Progress bar: 80%                                             │
│  • Upload ID recto (caméra)                                      │
│  • Upload ID verso (caméra)                                      │
│  • Aperçu images + bouton retake                                 │
│  • Bouton "Suivant" → Upload + Navigation.push('Review')        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                ReviewScreen.tsx (Étape 5/5)                      │
│  • Progress bar: 100%                                            │
│  • Récapitulatif de toutes les infos                             │
│  • Checkbox "J'accepte les CGU Stripe"                           │
│  • Bouton "Activer mon compte" → POST complete                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
                    ✅ Compte créé
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    StripeHub.tsx                                 │
│  État: isConnected = true, status = "pending" (en validation)   │
│  • Badge: 🟡 "En attente de validation Stripe"                  │
│  • Message: "Stripe valide vos documents (24-48h)"              │
│  • Fonctions BLOQUÉES: Créer lien paiement, Effectuer payout    │
│  • Fonctions ACTIVES: Voir historique (vide), Paramètres        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Maquettes des 5 Écrans

### Écran 0: WelcomeScreen.tsx

```
┌─────────────────────────────────────────────────────┐
│  [< Retour]                                         │
│                                                     │
│              ┌─────────────┐                        │
│              │   [Stripe]   │                        │
│              │    Logo      │                        │
│              └─────────────┘                        │
│                                                     │
│      Activez vos paiements Stripe                   │
│      ═══════════════════════════                   │
│                                                     │
│  Complétez votre compte en 5 étapes simples        │
│  et commencez à recevoir des paiements.            │
│                                                     │
│  ✅ Recevez des paiements de vos clients           │
│  ✅ Créez des liens de paiement en 2 clics         │
│  ✅ Suivez vos revenus en temps réel               │
│  ✅ Retraits instantanés vers votre compte         │
│                                                     │
│  📋 Ce dont vous aurez besoin:                      │
│     • Votre pièce d'identité (permis ou passport)  │
│     • Vos coordonnées bancaires (BSB + compte)     │
│     • 5 minutes de votre temps                     │
│                                                     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │         🚀 Commencer                       │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│           [Retour au tableau de bord]              │
└─────────────────────────────────────────────────────┘

```

### Écran 1: PersonalInfoScreen.tsx

```
┌─────────────────────────────────────────────────────┐
│  [< Retour]          Étape 1/5                      │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 20%             │
│                                                     │
│  👤 Informations personnelles                       │
│  ═══════════════════════════════                   │
│                                                     │
│  Ces informations seront utilisées pour            │
│  vérifier votre identité avec Stripe.              │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Prénom *                                   │     │
│  │ [                                    ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Nom de famille *                           │     │
│  │ [                                    ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Date de naissance *                        │     │
│  │ [JJ] [MM] [AAAA]  📅                      │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Email *                                    │     │
│  │ [                                    ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Téléphone *                                │     │
│  │ +61 [                               ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  * Champs obligatoires                             │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │              Suivant →                     │     │
│  └───────────────────────────────────────────┘     │

└─────────────────────────────────────────────────────┘
```

### Écran 2: AddressScreen.tsx

```
┌─────────────────────────────────────────────────────┐
│  [< Retour]          Étape 2/5                      │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░ 40%             │
│                                                     │
│  🏠 Adresse de résidence                            │
│  ═══════════════════════════                       │
│                                                     │
│  Cette adresse sera utilisée pour la               │
│  vérification de votre compte.                     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Numéro et rue *                            │     │
│  │ [                                    ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Complément d'adresse (optionnel)           │     │
│  │ [                                    ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Ville *                                    │     │
│  │ [                                    ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌─────────────────────┬─────────────────────┐     │
│  │ État/Territoire *   │ Code postal *       │     │
│  │ [NSW ▼]            │ [    ]              │     │
│  └─────────────────────┴─────────────────────┘     │
│                                                     │
│  États disponibles:                                │
│  NSW, VIC, QLD, SA, WA, TAS, NT, ACT              │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │              Suivant →                     │     │

│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Écran 3: BankAccountScreen.tsx

```
┌─────────────────────────────────────────────────────┐
│  [< Retour]          Étape 3/5                      │
│  ████████████░░░░░░░░░░░░░░░░░░░ 60%             │
│                                                     │
│  💳 Compte bancaire                                 │
│  ═══════════════════                               │
│                                                     │
│  Pour recevoir vos paiements, nous avons           │
│  besoin de vos coordonnées bancaires.             │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Nom du titulaire du compte *               │     │
│  │ [                                    ]     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ BSB *                                      │     │
│  │ [   -   ]  (6 chiffres)                   │     │
│  └───────────────────────────────────────────┘     │
│     Ex: 062-000                                     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Numéro de compte *                         │     │
│  │ [                    ]  (5-9 chiffres)    │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  🔒 Vos informations bancaires sont chiffrées     │
│     et sécurisées par Stripe.                     │
│                                                     │
│  ℹ️  C'est le compte sur lequel vous recevrez     │
│     vos paiements. Vous pourrez le modifier       │
│     plus tard dans les paramètres.                │
│                                                     │
│  ┌───────────────────────────────────────────┐     │

│  │              Suivant →                     │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Écran 4: DocumentsScreen.tsx

```
┌─────────────────────────────────────────────────────┐
│  [< Retour]          Étape 4/5                      │
│  ████████████████░░░░░░░░░░░░░░░ 80%             │
│                                                     │
│  📸 Pièce d'identité                                │
│  ═══════════════════                               │
│                                                     │
│  Pour vérifier votre identité, prenez une          │
│  photo de votre permis de conduire ou passport.   │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │         Recto de votre pièce d'identité    │     │
│  │                                            │     │
│  │   ┌─────────────────────────────────┐     │     │
│  │   │                                 │     │     │
│  │   │   [Image Preview si uploadée]   │     │     │
│  │   │                                 │     │     │
│  │   │         ou                      │     │     │
│  │   │                                 │     │     │
│  │   │     📷 Prendre une photo        │     │     │
│  │   │                                 │     │     │
│  │   └─────────────────────────────────┘     │     │
│  │                                            │     │
│  │   [Reprendre la photo]                    │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │         Verso de votre pièce d'identité    │     │
│  │                                            │     │
│  │   ┌─────────────────────────────────┐     │     │
│  │   │                                 │     │     │
│  │   │   [Image Preview si uploadée]   │     │     │
│  │   │                                 │     │     │
│  │   │         ou                      │     │     │
│  │   │                                 │     │     │
│  │   │     📷 Prendre une photo        │     │     │
│  │   │                                 │     │     │
│  │   └─────────────────────────────────┘     │     │
│  │                                            │     │
│  │   [Reprendre la photo]                    │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ✅ Assurez-vous que les photos sont nettes       │
│  ✅ Toutes les informations doivent être lisibles │
│                                                     │

│  ┌───────────────────────────────────────────┐     │
│  │              Suivant →                     │     │
│  └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Écran 5: ReviewScreen.tsx

```
┌─────────────────────────────────────────────────────┐
│  [< Retour]          Étape 5/5                      │
│  ████████████████████████████████ 100%            │
│                                                     │
│  ✅ Vérification finale                             │
│  ═══════════════════════                           │
│                                                     │
│  Vérifiez vos informations avant de valider.       │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ 👤 Informations personnelles       [Modifier] │
│  │                                            │     │
│  │ John Doe                                   │     │
│  │ 15/01/1990                                 │     │
│  │ john.doe@example.com                       │     │
│  │ +61 400 000 000                            │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ 🏠 Adresse                         [Modifier] │
│  │                                            │     │
│  │ 123 Main Street                            │     │
│  │ Sydney, NSW 2000                           │     │
│  │ Australia                                  │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ 💳 Compte bancaire                 [Modifier] │
│  │                                            │     │
│  │ John Doe                                   │     │
│  │ BSB: 062-000                               │     │
│  │ Compte: ******456                          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ 📸 Pièce d'identité                [Modifier] │
│  │                                            │     │
│  │ ✅ Recto uploadé                           │     │
│  │ ✅ Verso uploadé                           │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ☑️  J'accepte les Conditions Générales de        │
│      Stripe Connect et autorise Stripe à          │
│      traiter mes informations personnelles.       │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │       🚀 Activer mon compte Stripe         │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  En activant votre compte, Stripe validera vos     │
│  documents sous 24-48h. Vous serez notifié par     │
│  email dès que votre compte sera opérationnel.     │

└─────────────────────────────────────────────────────┘
```

---

## 🔌 Backend API - Nouveaux Endpoints

### 1. POST /v1/stripe/onboarding/start

**Description**: Crée un nouveau compte Stripe Connect (silencieusement, sans Account Link)

**Request**:

```bash
POST /v1/stripe/onboarding/start
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**: Aucun (company_id extrait du JWT)

**Response Success (200)**:

```json
{
  "success": true,
  "stripe_account_id": "acct_1234567890",
  "status": "incomplete",
  "message": "Stripe account created. Please complete onboarding."
}
```

**Response Error (400)** - Compte déjà existant:

```json
{
  "success": false,
  "error": "Stripe account already exists for this company",
  "stripe_account_id": "acct_existing123"
}
```

**Backend Implementation**:

```javascript
router.post(
  "/v1/stripe/onboarding/start",
  authenticateJWT,
  async (req, res) => {
    try {
      const { company_id } = req.user;

      // Vérifier si compte existe déjà
      const existing = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      if (existing[0]?.stripe_account_id) {
        return res.status(400).json({
          success: false,
          error: "Stripe account already exists",
          stripe_account_id: existing[0].stripe_account_id,
        });
      }

      // Créer le compte Stripe (type: express, country: AU)
      const account = await stripe.accounts.create({
        type: "express",
        country: "AU",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Sauvegarder en DB
      await db.query(
        "UPDATE companies SET stripe_account_id = ?, stripe_onboarding_started_at = NOW() WHERE id = ?",
        [account.id, company_id],
      );

      return res.json({
        success: true,

        stripe_account_id: account.id,
        status: "incomplete",
      });
    } catch (error) {
      console.error("[Stripe Onboarding] Error:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);
```

---

### 2. POST /v1/stripe/onboarding/personal-info

**Description**: Soumet les informations personnelles à Stripe

**Request**:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-01-15",
  "email": "john.doe@example.com",
  "phone": "+61400000000"
}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Personal information saved",
  "progress": 20
}
```

**Backend Implementation**:

```javascript
router.post(
  "/v1/stripe/onboarding/personal-info",
  authenticateJWT,
  async (req, res) => {
    try {
      const { company_id } = req.user;
      const { first_name, last_name, dob, email, phone } = req.body;

      // Récupérer stripe_account_id
      const company = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      if (!company[0]?.stripe_account_id) {
        return res
          .status(404)
          .json({ success: false, error: "No Stripe account found" });
      }

      // Parser date (format: YYYY-MM-DD)
      const [year, month, day] = dob.split("-");

      // Mettre à jour le compte Stripe
      await stripe.accounts.update(company[0].stripe_account_id, {
        individual: {
          first_name,
          last_name,

          dob: {
            day: parseInt(day),
            month: parseInt(month),

            year: parseInt(year),
          },
          email,
          phone,
        },
      });

      // Sauvegarder en DB (optionnel, pour cache)
      await db.query(
        `UPDATE companies SET 
        stripe_onboarding_personal_info = ?,

        stripe_onboarding_progress = 20,
        updated_at = NOW()
       WHERE id = ?`,
        [JSON.stringify(req.body), company_id],
      );

      return res.json({ success: true, progress: 20 });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);
```

---

### 3. POST /v1/stripe/onboarding/address

**Description**: Soumet l'adresse à Stripe

**Request**:

```json
{
  "line1": "123 Main Street",
  "line2": "Apt 4",
  "city": "Sydney",
  "state": "NSW",
  "postal_code": "2000"
}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Address saved",
  "progress": 40
}
```

**Backend Implementation**:

```javascript
router.post(
  "/v1/stripe/onboarding/address",
  authenticateJWT,

  async (req, res) => {
    try {
      const { company_id } = req.user;

      const { line1, line2, city, state, postal_code } = req.body;

      const company = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      await stripe.accounts.update(company[0].stripe_account_id, {
        individual: {
          address: {
            line1,
            line2: line2 || undefined,
            city,
            state,
            postal_code,
            country: "AU",
          },
        },
      });

      await db.query(
        "UPDATE companies SET stripe_onboarding_progress = 40 WHERE id = ?",
        [company_id],
      );

      return res.json({ success: true, progress: 40 });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);
```

---

### 4. POST /v1/stripe/onboarding/bank-account

**Description**: Soumet les coordonnées bancaires à Stripe

**Request**:

```json
{
  "account_holder_name": "John Doe",
  "bsb": "062000",
  "account_number": "123456789"
}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Bank account saved",
  "progress": 60
}
```

**Backend Implementation**:

```javascript
router.post(
  "/v1/stripe/onboarding/bank-account",
  authenticateJWT,
  async (req, res) => {
    try {
      const { company_id } = req.user;
      const { account_holder_name, bsb, account_number } = req.body;

      const company = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      // Créer l'external account (compte bancaire)
      await stripe.accounts.createExternalAccount(
        company[0].stripe_account_id,
        {
          external_account: {
            object: "bank_account",

            country: "AU",
            currency: "aud",
            account_holder_name,
            routing_number: bsb, // BSB pour l'Australie
            account_number,
          },
        },
      );

      await db.query(
        "UPDATE companies SET stripe_onboarding_progress = 60 WHERE id = ?",
        [company_id],
      );

      return res.json({ success: true, progress: 60 });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);
```

---

### 5. POST /v1/stripe/onboarding/document

**Description**: Upload un document (ID recto ou verso)

**Request**:

```
Content-Type: multipart/form-data

file: <binary image data>
purpose: "identity_document"
side: "front" | "back"
```

**Response Success (200)**:

```json
{
  "success": true,
  "file_id": "file_1234567890",
  "message": "Document uploaded",
  "progress": 80
}
```

**Backend Implementation**:

```javascript
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/v1/stripe/onboarding/document",
  authenticateJWT,
  upload.single("file"),
  async (req, res) => {
    try {
      const { company_id } = req.user;
      const { purpose, side } = req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });
      }

      const company = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      // 1. Upload le fichier à Stripe
      const file = await stripe.files.create({
        purpose: "identity_document",
        file: {
          data: req.file.buffer,
          name: req.file.originalname,

          type: req.file.mimetype,
        },
      });

      // 2. Attacher le fichier au compte selon le side
      const updateData = {};
      if (side === "front") {
        updateData["individual.verification.document.front"] = file.id;
      } else if (side === "back") {
        updateData["individual.verification.document.back"] = file.id;
      }

      await stripe.accounts.update(company[0].stripe_account_id, updateData);

      await db.query(
        "UPDATE companies SET stripe_onboarding_progress = 80 WHERE id = ?",
        [company_id],
      );

      return res.json({
        success: true,
        file_id: file.id,
        progress: 80,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);
```

---

### 6. POST /v1/stripe/onboarding/verify

**Description**: Finalise l'onboarding et active le compte

**Request**:

```json
{
  "tos_accepted": true
}
```

**Response Success (200)**:

```json
{
  "success": true,
  "message": "Onboarding complete",
  "status": "pending_verification",
  "progress": 100
}
```

**Backend Implementation**:

```javascript
router.post(
  "/v1/stripe/onboarding/verify",
  authenticateJWT,
  async (req, res) => {
    try {
      const { company_id } = req.user;
      const { tos_accepted } = req.body;

      if (!tos_accepted) {
        return res.status(400).json({
          success: false,
          error: "Terms of service must be accepted",
        });
      }

      const company = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      // Marquer comme onboarding terminé
      await stripe.accounts.update(company[0].stripe_account_id, {
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: req.ip,
        },
      });

      // Récupérer le compte mis à jour pour vérifier le statut
      const account = await stripe.accounts.retrieve(
        company[0].stripe_account_id,
      );

      // Mettre à jour la DB
      await db.query(
        `UPDATE companies SET 
        stripe_onboarding_progress = 100,
        stripe_onboarding_completed_at = NOW(),
        details_submitted = ?,
        charges_enabled = ?,
        payouts_enabled = ?,
        requirements_currently_due = ?,
        updated_at = NOW()
       WHERE id = ?`,
        [
          account.details_submitted ? 1 : 0,
          account.charges_enabled ? 1 : 0,
          account.payouts_enabled ? 1 : 0,
          JSON.stringify(account.requirements?.currently_due || []),
          company_id,
        ],
      );

      return res.json({
        success: true,
        status: account.charges_enabled ? "active" : "pending_verification",
        progress: 100,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);
```

---

### 7. GET /v1/stripe/onboarding/status

**Description**: Récupère le statut de l'onboarding en cours

**Response Success (200)**:

```json
{
  "success": true,
  "progress": 60,
  "completed_steps": ["personal_info", "address", "bank_account"],
  "pending_steps": ["documents", "review"],
  "stripe_account_id": "acct_123",
  "status": "incomplete"
}
```

**Backend Implementation**:

```javascript
router.get(
  "/v1/stripe/onboarding/status",
  authenticateJWT,
  async (req, res) => {
    try {
      const { company_id } = req.user;

      const company = await db.query(
        `SELECT stripe_account_id, stripe_onboarding_progress, 
              details_submitted, charges_enabled 
       FROM companies WHERE id = ?`,
        [company_id],
      );

      if (!company[0]?.stripe_account_id) {
        return res.json({
          success: true,
          progress: 0,
          status: "not_started",
        });
      }

      const progress = company[0].stripe_onboarding_progress || 0;
      const completed_steps = [];
      const pending_steps = [];

      if (progress >= 20) completed_steps.push("personal_info");
      else pending_steps.push("personal_info");

      if (progress >= 40) completed_steps.push("address");
      else if (progress >= 20) pending_steps.push("address");

      if (progress >= 60) completed_steps.push("bank_account");
      else if (progress >= 40) pending_steps.push("bank_account");

      if (progress >= 80) completed_steps.push("documents");
      else if (progress >= 60) pending_steps.push("documents");

      if (progress >= 100) completed_steps.push("review");
      else if (progress >= 80) pending_steps.push("review");

      return res.json({
        success: true,
        progress,
        completed_steps,
        pending_steps,
        stripe_account_id: company[0].stripe_account_id,
        status: progress === 100 ? "complete" : "incomplete",
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
);
```

---

## 💻 Frontend - Services & Screens

### Services: StripeService.ts (Nouvelles Fonctions)

```typescript
/**
 * Démarre l'onboarding Stripe (crée compte silencieusement)
 */
export const startStripeOnboarding = async (): Promise<{
  stripeAccountId: string;
  status: string;
}> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/start`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start onboarding");
  }

  const data = await response.json();
  return {
    stripeAccountId: data.stripe_account_id,
    status: data.status,
  };
};

/**
 * Soumet les informations personnelles
 */
export const submitPersonalInfo = async (info: {
  first_name: string;
  last_name: string;
  dob: string; // Format: YYYY-MM-DD
  email: string;
  phone: string;
}): Promise<void> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/personal-info`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to submit personal info");
  }
};

/**
 * Soumet l'adresse
 */
export const submitAddress = async (address: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
}): Promise<void> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/address`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(address),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to submit address");
  }
};

/**
 * Soumet les coordonnées bancaires
 */
export const submitBankAccount = async (bank: {
  account_holder_name: string;
  bsb: string;
  account_number: string;
}): Promise<void> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/bank-account`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bank),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to submit bank account");
  }
};

/**
 * Upload un document (ID recto ou verso)
 */
export const uploadDocument = async (
  imageUri: string,
  side: "front" | "back",
): Promise<void> => {
  const formData = new FormData();

  // Créer le blob depuis l'URI
  const response = await fetch(imageUri);
  const blob = await response.blob();

  formData.append("file", blob, "identity.jpg");
  formData.append("purpose", "identity_document");
  formData.append("side", side);

  const uploadResponse = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/document`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload document");
  }
};

/**
 * Finalise l'onboarding
 */
export const completeOnboarding = async (): Promise<{
  status: string;
}> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tos_accepted: true }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to complete onboarding");
  }

  const data = await response.json();
  return { status: data.status };
};

/**
 * Récupère le statut de l'onboarding
 */
export const getOnboardingStatus = async (): Promise<{
  progress: number;
  completedSteps: string[];
  pendingSteps: string[];
}> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/status`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error("Failed to get onboarding status");
  }

  const data = await response.json();
  return {
    progress: data.progress,
    completedSteps: data.completed_steps,
    pendingSteps: data.pending_steps,
  };
};
```

---

## 🚦 Logique de Blocage des Fonctions

### Dans StripeHub.tsx

```typescript
// État du compte
const accountStatus = React.useMemo(() => {
  if (!stripeAccount.account) {
    return 'not_connected'; // Pas de compte
  }

  const { charges_enabled, payouts_enabled, details_submitted } = stripeAccount.account;

  // Compte complet et actif
  if (charges_enabled && payouts_enabled && details_submitted) {
    return 'active';
  }

  // Onboarding terminé mais en validation Stripe
  if (details_submitted && !charges_enabled) {

    return 'pending_verification';
  }

  // Onboarding incomplet
  if (!details_submitted) {
    return 'incomplete';
  }

  return 'restricted';
}, [stripeAccount.account]);

// Fonctions à bloquer selon le statut
const canCreatePaymentLink = accountStatus === 'active';
const canRequestPayout = accountStatus === 'active' && stripeAccount.balance?.available > 0;
const canViewPayments = accountStatus !== 'not_connected'; // Peut voir même si pending
const canViewSettings = accountStatus !== 'not_connected';

// UI conditionnelle
const renderActionButtons = () => {
  if (accountStatus === 'not_connected') {
    return (
      <TouchableOpacity onPress={handleStartOnboarding}>
        <Text>🚀 Activer Stripe</Text>
      </TouchableOpacity>
    );
  }

  if (accountStatus === 'incomplete') {
    return (
      <>
        <Alert severity="warning">
          Votre compte Stripe est incomplet. Complétez votre profil pour
          activer les paiements.
        </Alert>
        <TouchableOpacity onPress={handleResumeOnboarding}>
          <Text>📝 Compléter mon profil</Text>

        </TouchableOpacity>
      </>
    );
  }

  if (accountStatus === 'pending_verification') {
    return (
      <Alert severity="info">
        🕐 Stripe valide vos documents (24-48h). Vous serez notifié par email.
      </Alert>
    );
  }

  // accountStatus === 'active'

  return (
    <>
      <TouchableOpacity onPress={handleCreatePaymentLink}>
        <Text>💳 Créer un lien de paiement</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleRequestPayout}
        disabled={!canRequestPayout}
      >
        <Text>💰 Demander un virement</Text>

      </TouchableOpacity>
    </>
  );
};
```

---

## 📊 Structure de Navigation

### Stack Navigator

```typescript
// src/navigation/StripeOnboardingStack.tsx
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/Stripe/OnboardingFlow/WelcomeScreen';
import PersonalInfoScreen from '../screens/Stripe/OnboardingFlow/PersonalInfoScreen';
import AddressScreen from '../screens/Stripe/OnboardingFlow/AddressScreen';
import BankAccountScreen from '../screens/Stripe/OnboardingFlow/BankAccountScreen';
import DocumentsScreen from '../screens/Stripe/OnboardingFlow/DocumentsScreen';
import ReviewScreen from '../screens/Stripe/OnboardingFlow/ReviewScreen';

const Stack = createStackNavigator();

export default function StripeOnboardingStack() {

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card'
      }}
    >

      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="BankAccount" component={BankAccountScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
    </Stack.Navigator>
  );
}
```

---

## 📝 Checklist de Développement

### Phase 1: Backend (Dev Backend)

- [ ] Créer `POST /v1/stripe/onboarding/start`

- [ ] Créer `POST /v1/stripe/onboarding/personal-info`
- [ ] Créer `POST /v1/stripe/onboarding/address`
- [ ] Créer `POST /v1/stripe/onboarding/bank-account`
- [ ] Créer `POST /v1/stripe/onboarding/document` (avec multer)
- [ ] Créer `POST /v1/stripe/onboarding/verify`
- [ ] Créer `GET /v1/stripe/onboarding/status`
- [ ] Ajouter colonne `stripe_onboarding_progress` en DB (INT 0-100)
- [ ] Ajouter colonne `stripe_onboarding_started_at` (TIMESTAMP)
- [ ] Ajouter colonne `stripe_onboarding_completed_at` (TIMESTAMP)
- [ ] Tester chaque endpoint avec Postman
- [ ] Tester upload de fichier (JPEG 5MB)

### Phase 2: Frontend Services (Dev Frontend)

- [ ] Ajouter fonctions dans `StripeService.ts`:
  - [ ] `startStripeOnboarding()`
  - [ ] `submitPersonalInfo()`
  - [ ] `submitAddress()`
  - [ ] `submitBankAccount()`
  - [ ] `uploadDocument()`
  - [ ] `completeOnboarding()`
  - [ ] `getOnboardingStatus()`

### Phase 3: Screens Onboarding (Dev Frontend)

- [ ] Créer `src/screens/Stripe/OnboardingFlow/WelcomeScreen.tsx`

- [ ] Créer `src/screens/Stripe/OnboardingFlow/PersonalInfoScreen.tsx`
  - [ ] Formulaire avec validation (prénom, nom, email, tel, date)
  - [ ] DatePicker pour date de naissance
  - [ ] Phone input avec +61 préfixe
- [ ] Créer `src/screens/Stripe/OnboardingFlow/AddressScreen.tsx`
  - [ ] Dropdown États australiens (NSW, VIC, QLD, etc.)

  - [ ] Validation code postal (4 chiffres)

- [ ] Créer `src/screens/Stripe/OnboardingFlow/BankAccountScreen.tsx`
  - [ ] Input BSB avec format XXX-XXX
  - [ ] Validation BSB (6 chiffres)
  - [ ] Validation compte (5-9 chiffres)
- [ ] Créer `src/screens/Stripe/OnboardingFlow/DocumentsScreen.tsx`
  - [ ] Intégration `expo-image-picker`
  - [ ] Bouton "Prendre photo" recto
  - [ ] Bouton "Prendre photo" verso
  - [ ] Preview images avec bouton "Reprendre"
  - [ ] Upload automatique après capture
- [ ] Créer `src/screens/Stripe/OnboardingFlow/ReviewScreen.tsx`
  - [ ] Récapitulatif toutes données
  - [ ] Boutons "Modifier" pour chaque section
  - [ ] Checkbox CGU Stripe
  - [ ] Bouton "Activer mon compte"

### Phase 4: Navigation (Dev Frontend)

- [ ] Créer `StripeOnboardingStack.tsx`
- [ ] Ajouter au RootNavigator principal
- [ ] Tester navigation Retour (bouton < )
- [ ] Tester navigation Suivant entre écrans
- [ ] Tester deep linking si abandon (reprendre étape)

### Phase 5: StripeHub Refonte (Dev Frontend)

- [ ] Supprimer imports WebView
- [ ] Supprimer fonctions `handleStripeConnect()` (ancien)
- [ ] Supprimer fonctions `handleCompleteProfile()` (ancien)
- [ ] Supprimer composant `<StripeConnectWebView>`
- [ ] Ajouter nouveau `handleStartOnboarding()`:
  - Appelle `startStripeOnboarding()`
  - Navigate vers `StripeOnboarding/Welcome`
- [ ] Ajouter logique de blocage:
  - `canCreatePaymentLink` basé sur `accountStatus`
  - `canRequestPayout` basé sur `accountStatus`
  - Afficher alertes si `incomplete` ou `pending_verification`
- [ ] Ajouter badge status avec 4 états:
  - 🔴 "Non activé" (not_connected)
  - 🟠 "Incomplet" (incomplete)
  - 🟡 "En validation" (pending_verification)
  - 🟢 "Actif" (active)

### Phase 6: Traductions (Dev Frontend)

- [ ] Ajouter clés FR dans `fr.ts`:
  - `stripe.onboarding.welcome.*`
  - `stripe.onboarding.personalInfo.*`
  - `stripe.onboarding.address.*`
  - `stripe.onboarding.bankAccount.*`
  - `stripe.onboarding.documents.*`
  - `stripe.onboarding.review.*`
- [ ] Ajouter clés EN dans `en.ts`
- [ ] Ajouter types dans `types.ts`

### Phase 7: Tests (Dev Frontend + Backend)

- [ ] Test onboarding complet (5 écrans)
- [ ] Test abandon à l'étape 2 → reprise
- [ ] Test validation email invalide
- [ ] Test validation BSB invalide
- [ ] Test upload photo floue (Stripe refusera)
- [ ] Test upload photo trop grande (>5MB)
- [ ] Test blocage fonctions si `incomplete`
- [ ] Test déblocage après validation Stripe
- [ ] Test webhook `account.updated` (simulation)

---

## ⏱️ Délais Estimés

### Backend (Dev Backend)

- Endpoints CRUD (7 endpoints): **5-6 heures**
- Upload fichier + Stripe Files API: **2-3 heures**
- Tests Postman: **1 heure**
- **Total Backend**: **8-10 heures**

### Frontend (Dev Frontend)

- Services (7 fonctions): **2 heures**
- 5 écrans onboarding: **10-12 heures**
  - WelcomeScreen: 1h
  - PersonalInfoScreen: 2-3h (validation, date picker)
  - AddressScreen: 2h (dropdown états)
  - BankAccountScreen: 2h (validation BSB)
  - DocumentsScreen: 3-4h (caméra, upload, preview)
  - ReviewScreen: 2h (récap + édition)
- Navigation Stack: **1 heure**
- Refonte StripeHub: **3-4 heures**
- Traductions: **1 heure**
- Tests: **2-3 heures**
- **Total Frontend**: **19-23 heures**

### **TOTAL PROJET**: **27-33 heures** (~4-5 jours avec 1 dev backend + 1 dev frontend)

---

## 🚀 Prochaines Étapes

1. **Backend**: Commencer par les 7 endpoints (priorité haute)
2. **Frontend**: Créer les services pendant que backend développe
3. **Intégration**: Tester endpoint par endpoint
4. **Écrans**: Développer WelcomeScreen → PersonalInfo → Address → Bank → Documents → Review
5. **Testing**: Test complet du flow
6. **Déploiement**: Version beta pour 5 utilisateurs test

---

**Document prêt pour implémentation** ✅  
**Version:** 2.0 - Onboarding Natif  
**Dernière mise à jour:** 4 février 2026

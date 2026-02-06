# 🔧 API Backend Requirements - Business Owner Registration

**Date:** 29 janvier 2026  
**Version:** 1.0  
**Priorité:** HIGH  
**Impact:** Bloque la complétion du profil Business Owner

---

## 📋 Résumé Exécutif

L'application mobile collecte **8 étapes de données** pour l'inscription Business Owner, mais l'API actuelle (`/swift-app/subscribe`) ne prend que **4 champs** (email, firstName, lastName, password).

**Problème:** Les 7 autres étapes de données (business details, address, banking, insurance, subscription, legal) n'ont aucun endpoint pour être sauvegardées côté serveur.

**Solution proposée:** Créer un endpoint unifié `POST /swift-app/business-owner/complete-profile` pour finaliser le profil après la vérification email.

---

## 🎯 Workflow Actuel vs Souhaité

### ✅ Workflow Actuel (Fonctionnel)

```
1. User fills Step 1 (Personal Info)
   ↓
2. POST /swift-app/subscribe
   Body: { mail, firstName, lastName, password }
   ↓
3. POST /swift-app/verifyMail
   Body: { mail, code }
   ↓
4. POST /swift-app/auth/login
   Body: { mail, password, device }
   ↓
5. ✅ User logged in
```

### 🚀 Workflow Souhaité (Complet)

```
1. User fills ALL 8 steps
   ↓
2. POST /swift-app/subscribe (Step 1 only)
   Body: { mail, firstName, lastName, password }
   ↓
3. POST /swift-app/verifyMail
   Body: { mail, code }
   ↓
4. POST /swift-app/auth/login
   Body: { mail, password, device }
   Response: { sessionToken, user }
   ↓
5. POST /swift-app/business-owner/complete-profile ⚠️ NOUVEAU
   Headers: { Authorization: Bearer <sessionToken> }
   Body: { Steps 2-7 data }
   ↓
6. ✅ Business Owner profile complete
```

---

## 📡 Endpoint Requis: Complete Business Owner Profile

### Endpoint

```
POST /swift-app/business-owner/complete-profile
```

### Headers

```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

### Request Body

```typescript
{
  // ─────────────────────────────────────────────────────
  // STEP 2: Business Details
  // ─────────────────────────────────────────────────────
  "businessDetails": {
    // Company Information
    "companyName": "Cobbr Clean Services Pty Ltd",
    "tradingName": "Cobbr Clean",

    // Business Registration
    "abn": "51824753556",              // 11 digits, validated with checksum
    "acn": "123456780",                // 9 digits, validated with checksum
    "businessType": "company",         // Enum: soleTrader | partnership | company | trust
    "industryType": "moving",          // Enum: moving | cleaning | ...

    // Business Contact
    "companyEmail": "info@cobbrclean.test",
    "companyPhone": "+61298765432"     // Format: +61XXXXXXXXX
  },

  // ─────────────────────────────────────────────────────
  // STEP 3: Business Address
  // ─────────────────────────────────────────────────────
  "businessAddress": {
    "streetAddress": "123 George Street",
    "suburb": "Sydney",
    "state": "NSW",                    // Enum: NSW | VIC | QLD | SA | WA | TAS | NT | ACT
    "postcode": "2000"                 // 4 digits
  },

  // ─────────────────────────────────────────────────────
  // STEP 4: Banking Information
  // ─────────────────────────────────────────────────────
  "bankingInfo": {
    "bsb": "062000",                   // 6 digits (format sans tiret)
    "accountNumber": "12345678",
    "accountName": "Cobbr Clean Services Pty Ltd"
  },

  // ─────────────────────────────────────────────────────
  // STEP 5: Insurance (Optional)
  // ─────────────────────────────────────────────────────
  "insurance": {
    "hasInsurance": true,
    "insuranceProvider": "CGU Insurance",  // Optional if hasInsurance = false
    "policyNumber": "POL-SC-2025-001",     // Optional if hasInsurance = false
    "expiryDate": "2026-12-31"             // Optional, format: YYYY-MM-DD
  },

  // ─────────────────────────────────────────────────────
  // STEP 6: Subscription Plan
  // ─────────────────────────────────────────────────────
  "subscription": {
    "planType": "professional",        // Enum: starter | professional | enterprise
    "billingFrequency": "monthly"      // Enum: monthly | yearly
  },

  // ─────────────────────────────────────────────────────
  // STEP 7: Legal Agreements
  // ─────────────────────────────────────────────────────
  "legalAgreements": {
    "termsAccepted": true,             // Doit être true
    "privacyAccepted": true,           // Doit être true
    "stripeAccepted": true,            // Doit être true
    "acceptedAt": "2026-01-29T10:15:00.000Z"  // ISO 8601 timestamp
  }
}
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Business owner profile completed successfully",
  "data": {
    "businessOwnerId": 123,
    "userId": 29,
    "companyName": "Cobbr Clean Services Pty Ltd",
    "profileComplete": true,
    "stripeAccountId": "acct_1234567890", // Si Stripe Connect créé
    "subscriptionStatus": "active",
    "subscriptionId": "sub_1234567890"
  }
}
```

### Response Errors

| Code | Message                                   | Cause                                                       |
| ---- | ----------------------------------------- | ----------------------------------------------------------- |
| 400  | `Missing required field: {fieldName}`     | Champ obligatoire manquant                                  |
| 400  | `Invalid ABN checksum`                    | ABN invalide (checksum failed)                              |
| 400  | `Invalid ACN checksum`                    | ACN invalide (checksum failed)                              |
| 400  | `Invalid BSB format`                      | BSB doit être 6 chiffres                                    |
| 400  | `Invalid Australian phone number`         | Phone doit être +61XXXXXXXXX                                |
| 400  | `Legal agreements must be accepted`       | termsAccepted/privacyAccepted/stripeAccepted doit être true |
| 401  | `Invalid or expired session token`        | Token invalide ou expiré                                    |
| 409  | `Business profile already completed`      | Profil déjà complet (peut retry)                            |
| 500  | `Failed to create Stripe Connect account` | Erreur création compte Stripe                               |
| 500  | `Internal Server Error`                   | Erreur serveur générique                                    |

---

## 🔍 Validation Rules

### ABN (Australian Business Number)

- **Format:** 11 chiffres (ex: 51824753556)
- **Validation:** Checksum algorithm

  ```javascript
  function validateABN(abn) {
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const abnArray = abn.split("").map(Number);
    abnArray[0] -= 1; // Subtract 1 from first digit

    const sum = abnArray.reduce(
      (acc, digit, index) => acc + digit * weights[index],
      0,
    );

    return sum % 89 === 0;
  }
  ```

### ACN (Australian Company Number)

- **Format:** 9 chiffres (ex: 123456780)
- **Validation:** Checksum algorithm

  ```javascript
  function validateACN(acn) {
    const weights = [8, 7, 6, 5, 4, 3, 2, 1];
    const acnArray = acn.split("").map(Number);
    const checkDigit = acnArray[8];

    const sum = acnArray
      .slice(0, 8)
      .reduce((acc, digit, index) => acc + digit * weights[index], 0);

    const remainder = sum % 10;
    const calculatedCheck = (10 - remainder) % 10;

    return checkDigit === calculatedCheck;
  }
  ```

### BSB (Bank State Branch)

- **Format:** 6 chiffres (ex: 062000)
- **Validation:** Doit exister dans la liste officielle des BSB australiens
- **Note:** Format d'affichage 062-000, mais stockage sans tiret

### Phone Number

- **Format:** +61XXXXXXXXX (10 chiffres après +61)
- **Exemples valides:**
  - +61412345678 (mobile)
  - +61298765432 (landline Sydney)
- **Validation:** Regex `/^\+61[2-4]\d{8}$/`

### Postcode

- **Format:** 4 chiffres (ex: 2000)
- **Range:** 0200-9999
- **Validation:** Vérifier que le postcode correspond au state

### Date Format

- **Format:** YYYY-MM-DD (ex: 2026-12-31)
- **Insurance Expiry:** Doit être dans le futur
- **DOB:** Utilisateur doit avoir 18+ ans

---

## 🗄️ Schema Base de Données Suggéré

### Table: `business_owners`

```sql
CREATE TABLE business_owners (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Business Details
  company_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),
  abn VARCHAR(11) NOT NULL UNIQUE,
  acn VARCHAR(9),
  business_type VARCHAR(50) NOT NULL,
  industry_type VARCHAR(50) NOT NULL,
  company_email VARCHAR(255) NOT NULL,
  company_phone VARCHAR(20) NOT NULL,

  -- Address
  street_address VARCHAR(255) NOT NULL,
  suburb VARCHAR(100) NOT NULL,
  state VARCHAR(10) NOT NULL,
  postcode VARCHAR(4) NOT NULL,

  -- Banking
  bsb VARCHAR(6) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_name VARCHAR(255) NOT NULL,

  -- Insurance
  has_insurance BOOLEAN DEFAULT false,
  insurance_provider VARCHAR(255),
  policy_number VARCHAR(100),
  insurance_expiry_date DATE,

  -- Subscription
  plan_type VARCHAR(50) NOT NULL,
  billing_frequency VARCHAR(20) NOT NULL,
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'pending',

  -- Legal
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  stripe_accepted BOOLEAN NOT NULL DEFAULT false,
  legal_accepted_at TIMESTAMP,

  -- Stripe Connect
  stripe_account_id VARCHAR(255),
  stripe_account_status VARCHAR(50) DEFAULT 'pending',

  -- Metadata
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CHECK (LENGTH(abn) = 11),
  CHECK (LENGTH(acn) = 9 OR acn IS NULL),
  CHECK (LENGTH(bsb) = 6),
  CHECK (LENGTH(postcode) = 4),
  CHECK (terms_accepted = true AND privacy_accepted = true AND stripe_accepted = true)
);

-- Index pour performance
CREATE INDEX idx_business_owners_user_id ON business_owners(user_id);
CREATE INDEX idx_business_owners_abn ON business_owners(abn);
CREATE INDEX idx_business_owners_stripe_account_id ON business_owners(stripe_account_id);
```

---

## 🔐 Sécurité

### Authentication

- ✅ Endpoint doit être **protégé** avec Bearer token
- ✅ Vérifier que l'utilisateur n'a pas déjà complété son profil
- ✅ Vérifier que l'utilisateur a bien vérifié son email avant de permettre la complétion

### Validation

- ✅ Valider **tous** les champs avec les règles ci-dessus
- ✅ Sanitize toutes les entrées (SQL injection, XSS)
- ✅ Vérifier que l'ABN n'existe pas déjà dans la base
- ✅ Logger les tentatives de complétion pour audit

### Stripe Connect

- ✅ Créer le compte Stripe Connect de manière **asynchrone** si possible
- ✅ Retourner un status "pending" si la création Stripe est en cours
- ✅ Permettre de retenter la création si elle échoue

---

## 🧪 Tests Data

### Request Example - Complete Profile

```bash
curl -X POST https://altivo.fr/swift-app/business-owner/complete-profile \
  -H "Authorization: Bearer abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "businessDetails": {
      "companyName": "Cobbr Clean Services Pty Ltd",
      "tradingName": "Cobbr Clean",
      "abn": "51824753556",
      "acn": "123456780",
      "businessType": "company",
      "industryType": "moving",
      "companyEmail": "info@cobbrclean.test",
      "companyPhone": "+61298765432"
    },
    "businessAddress": {
      "streetAddress": "123 George Street",
      "suburb": "Sydney",
      "state": "NSW",
      "postcode": "2000"
    },
    "bankingInfo": {
      "bsb": "062000",
      "accountNumber": "12345678",
      "accountName": "Cobbr Clean Services Pty Ltd"
    },
    "insurance": {
      "hasInsurance": true,
      "insuranceProvider": "CGU Insurance",
      "policyNumber": "POL-SC-2025-001",
      "expiryDate": "2026-12-31"
    },
    "subscription": {
      "planType": "professional",
      "billingFrequency": "monthly"
    },
    "legalAgreements": {
      "termsAccepted": true,
      "privacyAccepted": true,
      "stripeAccepted": true,
      "acceptedAt": "2026-01-29T10:15:00.000Z"
    }
  }'
```

### Test Cases à Couvrir

1. ✅ **Success Case:** Tous les champs valides
2. ❌ **Invalid ABN:** Checksum incorrect
3. ❌ **Invalid ACN:** Checksum incorrect
4. ❌ **Duplicate ABN:** ABN déjà utilisé
5. ❌ **Invalid BSB:** BSB n'existe pas
6. ❌ **Invalid Phone:** Format incorrect
7. ❌ **Missing Legal Agreement:** termsAccepted = false
8. ❌ **Expired Token:** sessionToken invalide ou expiré
9. ❌ **Already Complete:** Profil déjà complété
10. ✅ **Without Insurance:** hasInsurance = false, autres champs vides

---

## 📊 Flow Diagram Complet

```
┌──────────────────────────────────────────────────────────────────┐
│                   INSCRIPTION BUSINESS OWNER                      │
└──────────────────────────────────────────────────────────────────┘

📱 MOBILE APP                                       🖥️ BACKEND
     │                                                   │
     │  Step 1-7: User fills all forms                   │
     │  ────────────────────────────────                 │
     │                                                    │
     │  1. POST /swift-app/subscribe                     │
     │  ─────────────────────────────────────────────▶   │
     │  { mail, firstName, lastName, password }          │
     │                                                    │
     │  ◀─────────────────────────────────────────────   │
     │  { success: true, user: { id, mail, ... } }       │
     │                                                    │
     │  💾 Save Steps 2-7 data to AsyncStorage           │
     │                                                    │
     │                            📧 Email Code: 123456   │
     │                                                    │
     │  2. POST /swift-app/verifyMail                    │
     │  ─────────────────────────────────────────────▶   │
     │  { mail, code: "123456" }                         │
     │                                                    │
     │  ◀─────────────────────────────────────────────   │
     │  { success: true }                                │
     │                                                    │
     │  3. POST /swift-app/auth/login                    │
     │  ─────────────────────────────────────────────▶   │
     │  { mail, password, device }                       │
     │                                                    │
     │  ◀─────────────────────────────────────────────   │
     │  { sessionToken, refreshToken, user }             │
     │                                                    │
     │  💾 Store tokens securely                         │
     │                                                    │
     │  4. POST /swift-app/business-owner/complete       │
     │  ─────────────────────────────────────────────▶   │
     │  Authorization: Bearer <sessionToken>             │
     │  { Steps 2-7 data from AsyncStorage }             │
     │                                                    │
     │  ◀─────────────────────────────────────────────   │
     │  { success: true, businessOwnerId, stripe... }    │
     │                                                    │
     │  🗑️ Clear AsyncStorage draft                      │
     │                                                    │
     ▼                                                    ▼
   ✅ BUSINESS OWNER READY TO USE APP
```

---

## 🚨 Priorités d'Implémentation

### Phase 1: Critique (Bloquer)

1. ✅ **Endpoint `/business-owner/complete-profile`**
   - Accepter toutes les données des steps 2-7
   - Valider ABN, ACN, BSB avec checksums
   - Sauvegarder dans la base de données

2. ✅ **Création compte Stripe Connect**
   - Créer automatiquement le compte Stripe
   - Stocker `stripe_account_id`
   - Gérer les erreurs de création

### Phase 2: Important (Haute priorité)

3. ✅ **Endpoint GET `/business-owner/profile`**
   - Récupérer le profil complet
   - Headers: Authorization: Bearer token
   - Response: Toutes les données du profil

4. ✅ **Endpoint PUT `/business-owner/profile`**
   - Mettre à jour le profil
   - Autoriser modification des champs non-critiques
   - Loguer les modifications pour audit

### Phase 3: Nice-to-have

5. ✅ **Endpoint GET `/business-owner/subscription`**
   - Status de l'abonnement
   - Prochaine date de facturation
   - Historique des paiements

6. ✅ **Webhook Stripe**
   - Écouter les events Stripe
   - Mettre à jour subscription_status
   - Gérer les paiements échoués

---

## 📞 Questions / Clarifications

### Q1: Que faire si l'utilisateur ferme l'app après Step 1 ?

**R:** Les données Steps 2-7 sont sauvegardées dans AsyncStorage côté mobile. Lors de la prochaine connexion, on lui proposera de compléter son profil.

### Q2: Peut-on modifier le profil après complétion ?

**R:** Oui, via un futur endpoint `PUT /business-owner/profile`. Certains champs critiques (ABN, ACN) devront peut-être être verrouillés.

### Q3: Que faire si la création Stripe échoue ?

**R:** Retourner `success: true` mais avec `stripeAccountStatus: 'failed'`. Permettre de retenter via un endpoint dédié.

### Q4: Faut-il vérifier que le BSB existe vraiment ?

**R:** Idéalement oui, via une API externe (ex: BSB Lookup API) ou une table locale de BSB valides. En phase 1, validation du format suffit.

---

## ✅ Checklist Backend

- [ ] Créer endpoint `POST /business-owner/complete-profile`
- [ ] Implémenter validation ABN checksum
- [ ] Implémenter validation ACN checksum
- [ ] Créer table `business_owners` en base de données
- [ ] Intégrer Stripe Connect pour création de compte
- [ ] Créer endpoint `GET /business-owner/profile`
- [ ] Créer endpoint `PUT /business-owner/profile`
- [ ] Ajouter tests unitaires pour validations
- [ ] Ajouter tests d'intégration pour l'endpoint complet
- [ ] Documenter l'endpoint dans Swagger/OpenAPI
- [ ] Déployer en staging pour tests mobile

---

**Contact Mobile Team:**  
Pour toute question sur les données collectées ou le format attendu, contacter l'équipe mobile.

**Documentation Mobile:**

- `docs/REGISTRATION_DATA_REQUIREMENTS.md` - Spécifications complètes
- `TEST_DATA.md` - Données de test avec ABN/ACN/BSB valides

---

_Dernière mise à jour: 29 janvier 2026_

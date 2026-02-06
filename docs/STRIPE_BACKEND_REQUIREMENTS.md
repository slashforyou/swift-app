# Stripe Backend - Besoins et Corrections Nécessaires

**Date:** 5 Février 2026  
**Context:** Phase 4 - Intégration Stripe Connect avec Native Onboarding

---

## 🚨 Problème Urgent: Permissions Stripe

### Erreur Actuelle

```
This application does not have the required permissions for the parameter 'individual'
on account 'acct_1Sbc2yIJgkyzp7Ff'.
```

### Cause

Le compte Express Stripe a été créé sans les permissions nécessaires pour modifier les données de l'individu (propriétaire du compte).

### Solutions

#### Option 1: Vérifier les Scopes OAuth (RECOMMANDÉ)

1. Aller dans **Stripe Dashboard > Settings > Connect > OAuth settings**
2. Vérifier que l'application a les scopes suivants :
   - `read_write` pour les comptes Express
   - `account:read_write` ou équivalent

#### Option 2: Utiliser la Clé API Correcte

- Pour les comptes de **test**, utiliser la **clé secrète principale** (non restricted)
- Pour la **production**, créer une restricted key avec ces permissions :
  - **Account**: Write
  - **Accounts**: Write
  - **Files**: Write
  - **Identity**: Write

#### Option 3: Recréer le Compte Proprement

Si les permissions ne peuvent pas être ajoutées rétroactivement :

1. Implémenter l'endpoint DELETE (voir ci-dessous)
2. Supprimer le compte test `acct_1Sbc2yIJgkyzp7Ff`
3. Créer un nouveau compte avec les bonnes capabilities dès le départ

---

## 📡 Endpoints Backend à Implémenter/Corriger

### 1. ✅ GET `/v1/stripe/company/:company_id/account`

**Status:** Fonctionne  
**Format de réponse actuel:**

```json
{
  "success": true,
  "stripeAccountId": "acct_1Sbc2yIJgkyzp7Ff",
  "companyName": "Test Frontend",
  "status": "onboarding_incomplete"
}
```

**⚠️ PROBLÈME:** Les propriétés sont en camelCase mais le frontend attend maintenant **snake_case** :

**Format attendu par le frontend:**

```json
{
  "success": true,
  "stripe_account_id": "acct_1Sbc2yIJgkyzp7Ff",
  "business_name": "Test Frontend",
  "status": "onboarding_incomplete",
  "charges_enabled": false,
  "payouts_enabled": false,
  "country": "AU",
  "currency": "aud",
  "onboarding_completed": false,
  "details_submitted": false,
  "requirements": {
    "currently_due": [],
    "eventually_due": [],
    "past_due": [],
    "disabled_reason": "pending_verification"
  },
  "capabilities": {
    "card_payments": "pending",
    "transfers": "pending"
  }
}
```

**Action requise:** Modifier l'endpoint pour retourner les propriétés en snake_case.

---

### 2. ❌ POST `/v1/stripe/onboarding/personal-info`

**Status:** Erreur de permissions  
**Format attendu par le backend:**

```json
{
  "first_name": "Romain",
  "last_name": "Giovanni",
  "dob": "1995-12-21",
  "email": "romaingiovanni@gmail.com",
  "phone": "+610459823975"
}
```

**⚠️ IMPORTANT:**

- `dob` doit être une **string** au format `YYYY-MM-DD`
- Le backend fait actuellement `dob.split()` donc attend une string, pas un objet

**Actions requises:**

1. Vérifier que l'API key a les bonnes permissions (voir section Permissions)
2. S'assurer que le compte Express est créé avec les capabilities :

   ```javascript
   capabilities: {
     card_payments: { requested: true },
     transfers: { requested: true }
   }
   ```

3. Vérifier que l'endpoint utilise la bonne clé API

**Code backend suggéré (Node.js/Stripe):**

```javascript
// Lors de la création du compte (startOnboarding)
const account = await stripe.accounts.create({
  type: "express",
  country: "AU", // ou selon le pays de l'entreprise
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: "individual", // ou 'company'
  metadata: {
    company_id: companyId,
  },
});

// Lors de la mise à jour des infos personnelles
const [year, month, day] = dob.split("-").map(Number);

await stripe.accounts.update(accountId, {
  individual: {
    first_name: first_name,
    last_name: last_name,
    email: email,
    phone: phone,
    dob: {
      day: day,
      month: month,
      year: year,
    },
  },
});
```

---

### 3. ❌ DELETE `/v1/stripe/account`

**Status:** À implémenter  
**Méthode:** DELETE  
**Headers:** Authorization (JWT)  
**Body:** Aucun (utilise le company_id du token)

**Réponse attendue:**

```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Réponse en cas d'erreur:**

```json
{
  "success": false,
  "error": "Error message"
}
```

**Code backend suggéré:**

```javascript
app.delete("/v1/stripe/account", authenticateToken, async (req, res) => {
  try {
    const { company_id } = req.user;

    // Récupérer le stripe_account_id depuis la DB
    const company = await db.query(
      "SELECT stripe_account_id FROM companies WHERE id = ?",
      [company_id],
    );

    if (!company.stripe_account_id) {
      return res.status(404).json({
        success: false,
        error: "No Stripe account found",
      });
    }

    // Supprimer le compte Stripe
    await stripe.accounts.del(company.stripe_account_id);

    // Mettre à jour la DB
    await db.query(
      "UPDATE companies SET stripe_account_id = NULL, stripe_onboarding_progress = 0 WHERE id = ?",
      [company_id],
    );

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

---

### 4. ⏳ POST `/v1/stripe/onboarding/address`

**Status:** À tester après correction de personal-info  
**Format attendu:**

```json
{
  "line1": "123 Main Street",
  "line2": "Apt 4B",
  "city": "Sydney",
  "state": "NSW",
  "postal_code": "2000"
}
```

---

### 5. ⏳ POST `/v1/stripe/onboarding/bank-account`

**Status:** À tester  
**Format attendu:**

```json
{
  "account_holder_name": "Romain Giovanni",
  "routing_number": "110000",
  "account_number": "000123456789"
}
```

**⚠️ NOTE:** Pour l'Australie (AU), utiliser BSB au lieu de routing_number :

```json
{
  "account_holder_name": "Romain Giovanni",
  "bsb": "110000",
  "account_number": "000123456789"
}
```

---

### 6. ⏳ POST `/v1/stripe/onboarding/documents`

**Status:** À tester  
**Format attendu:**

```json
{
  "document_front": "file_xxxxx",
  "document_back": "file_xxxxx"
}
```

**Notes:**

- Les fichiers doivent d'abord être uploadés via Stripe File Upload API
- Le frontend enverra les file IDs, pas les fichiers bruts

---

### 7. ⏳ POST `/v1/stripe/onboarding/review`

**Status:** À tester  
**Finalise l'onboarding et soumet le compte pour vérification**

**Format attendu:**

```json
{
  "tos_acceptance": {
    "date": 1738714800,
    "ip": "192.168.1.1"
  }
}
```

---

## 🔐 Vérification des Permissions Stripe

### Checklist de Sécurité

- [ ] **Test Mode**: Utiliser la clé secrète de test (non restricted) : `sk_test_...`
- [ ] **Production Mode**: Créer une restricted key avec :
  - Account: Write
  - Accounts: Write
  - Files: Write
  - Identity: Write
- [ ] **OAuth Scopes** (si utilisé) :
  - `read_write`
  - `account`
- [ ] **Webhook Endpoint** configuré pour :
  - `account.updated`
  - `capability.updated`
  - `payout.paid`
  - `charge.succeeded`

---

## 📊 Base de Données - Schéma Requis

### Table: `companies`

```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_onboarding_progress INT DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;
```

### Table: `stripe_onboarding_data` (recommandé)

```sql
CREATE TABLE IF NOT EXISTS stripe_onboarding_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  stripe_account_id VARCHAR(255),
  progress INT DEFAULT 0,
  personal_info_completed BOOLEAN DEFAULT FALSE,
  address_completed BOOLEAN DEFAULT FALSE,
  bank_account_completed BOOLEAN DEFAULT FALSE,
  documents_completed BOOLEAN DEFAULT FALSE,
  review_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

---

## 🧪 Tests à Effectuer

### Test 1: Suppression de Compte

```bash
curl -X DELETE https://altivo.fr/swift-app/v1/stripe/account \
  -H "Authorization: Bearer <token>"
```

**Résultat attendu:**

- Status 200
- Compte supprimé dans Stripe
- `stripe_account_id` = NULL dans la DB

### Test 2: Création + Onboarding Complet

1. Cliquer "Activer Stripe" → Crée le compte
2. Remplir Personal Info → Progress 20%
3. Remplir Address → Progress 40%
4. Remplir Bank Account → Progress 60%
5. Upload Documents → Progress 80%
6. Review & Submit → Progress 100%

**Résultat attendu:**

- Chaque étape sauvegarde les données
- Progress s'incrémente correctement
- Compte Stripe contient toutes les infos
- `charges_enabled: true` après vérification

---

## 🎯 Priorités

### Urgence Haute (Bloquant)

1. ✅ **Corriger les permissions Stripe** (startStripeOnboarding + updateAccount)
2. ✅ **Implémenter DELETE /v1/stripe/account**
3. ✅ **Corriger le format de réponse** (snake_case au lieu de camelCase)

### Urgence Moyenne

1. ⏳ Tester tous les endpoints d'onboarding (address, bank, documents, review)
2. ⏳ Ajouter validation côté serveur pour chaque étape
3. ⏳ Implémenter webhook handlers pour account.updated

### Urgence Basse

1. 📊 Créer table `stripe_onboarding_data` pour tracking détaillé
2. 📊 Ajouter logs backend pour debug
3. 📊 Implémenter rate limiting sur les endpoints sensibles

---

## 📞 Contact & Support

**Frontend Dev:** Romain Giovanni  
**Backend Dev:** [À compléter]  
**Documentation Stripe:** <https://stripe.com/docs/connect/express-accounts>

**Compte de test actuel:**

- ID: `acct_1Sbc2yIJgkyzp7Ff`
- Status: Incomplet (permissions manquantes)
- Action: À supprimer et recréer

---

## ✅ Checklist de Déploiement

Avant de passer en production :

- [ ] Toutes les permissions Stripe configurées
- [ ] Endpoint DELETE implémenté et testé
- [ ] Format de réponse corrigé (snake_case)
- [ ] Tous les endpoints d'onboarding testés
- [ ] Webhooks configurés et testés
- [ ] Rate limiting activé
- [ ] Logs backend en place
- [ ] Tests end-to-end passés
- [ ] Documentation à jour

---

**Dernière mise à jour:** 5 Février 2026, 22:45

# 🔴 URGENT: Backend ne retourne pas `account_status`

**Date**: 5 février 2026 21:55  
**Erreur**: `Cannot read property 'charges_enabled' of undefined`  
**Cause**: Backend renvoie Status 200 mais **sans** l'objet `account_status`

---

## 🔍 Diagnostic

### Logs Frontend

```
📡 [ONBOARDING] Response status: 200
✅ [ONBOARDING] Completed successfully, progress: 100
📊 [ONBOARDING] Account status: undefined  ← LE PROBLÈME
❌ [Review] Error: Cannot read property 'charges_enabled' of undefined
```

### Ce Qui Se Passe

1. ✅ Backend retourne Status **200** (succès)
2. ✅ Backend retourne `progress: 100`
3. ❌ Backend **NE retourne PAS** l'objet `account_status`
4. ❌ Frontend essaie d'accéder à `account_status.charges_enabled` → **CRASH**

---

## ✅ Solution Backend (URGENT)

### Code Backend Actuel (Incorrect)

Le backend retourne probablement ceci:

```javascript
res.json({
  success: true,
  progress: 100,
  // ❌ Manque account_status!
});
```

### Code Backend Correct (À Appliquer)

```javascript
// POST /v1/stripe/onboarding/complete
app.post("/v1/stripe/onboarding/complete", async (req, res) => {
  try {
    const { tos_acceptance } = req.body;

    // 1. Validation
    if (!tos_acceptance) {
      return res.status(400).json({
        success: false,
        error: "Terms of service must be accepted",
      });
    }

    // 2. Récupérer le compte Stripe
    const stripeAccount = await db.query(
      "SELECT * FROM stripe_accounts WHERE company_id = $1",
      [req.user.company_id],
    );

    if (!stripeAccount.rows || stripeAccount.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No Stripe account found",
      });
    }

    const stripeAccountId = stripeAccount.rows[0].stripe_account_id;

    // 3. Sauvegarder en BDD (logs internes)
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";

    await db.query(
      `UPDATE stripe_accounts 
       SET tos_accepted = true, 
           tos_accepted_date = NOW(), 
           tos_accepted_ip = $1,
           details_submitted = true,
           onboarding_completed = true
       WHERE stripe_account_id = $2`,
      [clientIp, stripeAccountId],
    );

    console.log("✅ [Complete] Updated database with ToS acceptance");

    // 4. Récupérer le statut depuis Stripe (PAS d'update!)
    const finalAccount = await stripe.accounts.retrieve(stripeAccountId);

    console.log("✅ [Complete] Retrieved account:", {
      id: finalAccount.id,
      details_submitted: finalAccount.details_submitted,
      charges_enabled: finalAccount.charges_enabled,
      payouts_enabled: finalAccount.payouts_enabled,
    });

    // 5. 🚨 IMPORTANT: Retourner account_status (CE NOM EXACT!)
    res.json({
      success: true,
      progress: 100,
      account_status: {
        // ← snake_case requis par le frontend
        charges_enabled: finalAccount.charges_enabled || false,
        payouts_enabled: finalAccount.payouts_enabled || false,
        details_submitted: finalAccount.details_submitted || false,
      },
    });
  } catch (error) {
    console.error("❌ [Complete] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

---

## 🎯 Points Critiques

### 1. Nom de la Clé: `account_status` (snake_case)

**OBLIGATOIRE**: Le frontend attend `account_status` en **snake_case**, pas `accountStatus` en camelCase.

```javascript
// ✅ CORRECT
{
  account_status: {
    charges_enabled: false;
  }
}

// ❌ INCORRECT
{
  accountStatus: {
    chargesEnabled: false;
  }
}
```

### 2. Structure Complète Requise

Le frontend attend **exactement** ces 3 champs:

```javascript
account_status: {
  charges_enabled: boolean,
  payouts_enabled: boolean,
  details_submitted: boolean
}
```

### 3. Valeurs Par Défaut

Utiliser `|| false` pour éviter `undefined`:

```javascript
charges_enabled: finalAccount.charges_enabled || false;
```

---

## 🧪 Test de Validation

### 1. Vérifier la Réponse Backend

Tester avec curl:

```bash
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tos_acceptance": true}'
```

**Réponse attendue**:

```json
{
  "success": true,
  "progress": 100,
  "account_status": {
    "charges_enabled": false,
    "payouts_enabled": false,
    "details_submitted": true
  }
}
```

### 2. Tester depuis le Frontend

1. Aller sur ReviewScreen
2. Cocher "J'accepte les CGU"
3. Cliquer "Activer mon compte"

**Logs attendus (Frontend)**:

```
📡 [ONBOARDING] Response status: 200
✅ [ONBOARDING] Completed successfully, progress: 100
📊 [ONBOARDING] Account status: {"charges_enabled":false,"payouts_enabled":false,"details_submitted":true}
✅ [Review] Onboarding completed!
📊 Account Status: {"charges_enabled":false,"payouts_enabled":false,"details_submitted":true}
```

---

## 🔧 Fix Frontend Temporaire

**J'ai ajouté une protection** dans ReviewScreen.tsx pour éviter le crash si `account_status` est manquant:

```typescript
// Protection si account_status est manquant
if (!response.accountStatus) {
  console.warn("⚠️ [Review] Backend did not return account_status");
  Alert.alert(
    "Validation en cours",
    "Votre compte Stripe est en cours de validation (24-48h).",
    [{ text: "OK", onPress: () => navigation.navigate("StripeHub") }],
  );
  return;
}
```

**Mais le backend DOIT être corrigé** pour retourner `account_status`.

---

## 📋 Checklist Backend

### Avant Fix

- [ ] Endpoint `/v1/stripe/onboarding/complete` existe
- [ ] Endpoint accepte `{ tos_acceptance: true }`
- [ ] Endpoint retourne Status 200
- [ ] ❌ Endpoint retourne `account_status` (MANQUANT)

### Après Fix

- [ ] Code modifié pour retourner `account_status`
- [ ] Structure exacte: `{ charges_enabled, payouts_enabled, details_submitted }`
- [ ] Nom exact: `account_status` (snake_case)
- [ ] Serveur redémarré
- [ ] Test curl effectué
- [ ] Test frontend effectué

---

## 💡 Exemple Complet Backend

Voici le code complet de l'endpoint avec **tous les fixes**:

```javascript
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const db = require("./database");
const { authenticateJWT } = require("./middleware/auth");

const router = express.Router();

// POST /v1/stripe/onboarding/complete
router.post("/onboarding/complete", authenticateJWT, async (req, res) => {
  try {
    console.log("📝 [Complete] Starting completion process...", {
      user_id: req.user.id,
      company_id: req.user.company_id,
      tos_acceptance: req.body.tos_acceptance,
    });

    const { tos_acceptance } = req.body;

    // Validation
    if (!tos_acceptance) {
      console.log("❌ [Complete] ToS not accepted");
      return res.status(400).json({
        success: false,
        error: "Terms of service must be accepted",
      });
    }

    // Récupérer le compte Stripe de la company
    const stripeAccountQuery = await db.query(
      "SELECT * FROM stripe_accounts WHERE company_id = $1",
      [req.user.company_id],
    );

    if (!stripeAccountQuery.rows || stripeAccountQuery.rows.length === 0) {
      console.log("❌ [Complete] No Stripe account found");
      return res.status(404).json({
        success: false,
        error: "No Stripe account found",
      });
    }

    const stripeAccount = stripeAccountQuery.rows[0];
    const stripeAccountId = stripeAccount.stripe_account_id;

    console.log("✅ [Complete] Found Stripe account:", stripeAccountId);

    // Sauvegarder dans notre BDD (pour logs internes)
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";

    await db.query(
      `UPDATE stripe_accounts 
       SET tos_accepted = true, 
           tos_accepted_date = NOW(), 
           tos_accepted_ip = $1,
           details_submitted = true,
           onboarding_completed = true,
           updated_at = NOW()
       WHERE stripe_account_id = $2`,
      [clientIp, stripeAccountId],
    );

    console.log("✅ [Complete] Updated database");

    // Récupérer le statut depuis Stripe (PAS d'update de tos_acceptance!)
    const finalAccount = await stripe.accounts.retrieve(stripeAccountId);

    console.log("✅ [Complete] Retrieved account from Stripe:", {
      id: finalAccount.id,
      details_submitted: finalAccount.details_submitted,
      charges_enabled: finalAccount.charges_enabled,
      payouts_enabled: finalAccount.payouts_enabled,
    });

    // Retourner le statut (AVEC account_status!)
    const response = {
      success: true,
      progress: 100,
      account_status: {
        charges_enabled: finalAccount.charges_enabled || false,
        payouts_enabled: finalAccount.payouts_enabled || false,
        details_submitted: finalAccount.details_submitted || false,
      },
    };

    console.log("✅ [Complete] Sending response:", response);

    res.json(response);
  } catch (error) {
    console.error("❌ [Complete] Error:", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

module.exports = router;
```

---

## 🚀 Actions Immédiates

**1. Backend**: Appliquer le code ci-dessus à l'endpoint `/v1/stripe/onboarding/complete`

**2. Redémarrer**:

```bash
pm2 restart swiftapp
pm2 logs swiftapp --lines 50
```

**3. Tester avec curl**:

```bash
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tos_acceptance": true}' | jq
```

**4. Vérifier la présence de `account_status` dans la réponse JSON**

**5. Tester depuis l'app**:

- ReviewScreen → Cocher CGU → Activer
- Copier les logs frontend + backend

---

**Document créé**: 5 février 2026 21:55  
**Priorité**: 🔴 URGENT - Bloquant pour finaliser onboarding  
**Action requise**: Backend doit retourner l'objet `account_status` dans la réponse

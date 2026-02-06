# 🔧 Guide de Réparation du Compte Stripe

**Date:** 5 Février 2026  
**Problème:** Compte `acct_1Sbc2yIJgkyzp7Ff` avec erreur de permissions sur `individual`  
**Objectif:** Tenter de réparer le compte sans suppression

---

## 🎯 Stratégie de Réparation Automatique

Au lieu de forcer la suppression immédiate, le backend va tenter de **diagnostiquer et réparer** le compte automatiquement lors de la première soumission de données.

---

## 📋 Scénarios Possibles

### Scénario A : `business_type = null` ✅ RÉPARABLE

Le compte existe mais n'a pas de `business_type` défini.

**Symptômes:**

- Compte créé mais incomplet
- Aucune clé `individual` ou `company` définie
- Erreur sur tentative d'update de `individual`

**Réparation:**

```javascript
// 1. Définir le business_type
await stripe.accounts.update(accountId, {
  business_type: "individual",
});

// 2. Puis ajouter les données
await stripe.accounts.update(accountId, {
  individual: {
    first_name: "Romain",
    last_name: "Giovanni",
    // ...
  },
});
```

---

### Scénario B : `business_type = 'company'` ⚠️ ADAPTABLE

Le compte a été créé comme une entreprise au lieu d'un individu.

**Symptômes:**

- `business_type: 'company'`
- La clé `company` est définie
- Erreur sur tentative d'update de `individual`

**Solutions:**

#### Option B1 : Changer de stratégie (si possible)

```javascript
// Stripe ne permet PAS de changer business_type une fois défini
// On doit adapter les données pour 'company'

await stripe.accounts.update(accountId, {
  company: {
    name: `${first_name} ${last_name}`, // Nom de l'entreprise
    tax_id: "...", // Requis pour company
  },
  business_profile: {
    support_email: email,
    support_phone: phone,
    // Pas de dob pour company
  },
});
```

**⚠️ Limitation:** Les companies n'ont pas de `dob`, il faudrait modifier le flow frontend.

#### Option B2 : Supprimer et recréer (RECOMMANDÉ)

```javascript
// business_type ne peut pas être changé
// Retourner un flag pour indiquer qu'il faut recréer
return {
  success: false,
  error: "Account has wrong business_type",
  needs_recreation: true,
  current_business_type: "company",
};
```

---

### Scénario C : `business_type = 'individual'` ❓ MYSTÈRE

Le compte a le bon `business_type` mais l'erreur persiste.

**Causes possibles:**

1. **Clé API incorrecte** (restricted key sans bonnes permissions)
2. **Capabilities manquantes** (`transfers` non demandé)
3. **Compte en état invalide** (rare)

**Diagnostic:**

```javascript
const account = await stripe.accounts.retrieve(accountId);

console.log("Business type:", account.business_type); // 'individual'
console.log("Capabilities:", account.capabilities); // Vérifier card_payments et transfers
console.log("Individual:", account.individual); // null ou objet partiel ?
```

**Réparation:**

```javascript
// Si capabilities manquantes
if (!account.capabilities.transfers) {
  await stripe.accounts.update(accountId, {
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    }
  });
}

// Retenter l'update
await stripe.accounts.update(accountId, {
  individual: { ... }
});
```

---

## 🛠️ Implémentation Backend

### 1. Endpoint de Diagnostic (Optionnel mais utile)

```javascript
/**
 * GET /v1/stripe/account/inspect
 * Inspecte l'état détaillé du compte Stripe
 */
app.get("/v1/stripe/account/inspect", authenticateToken, async (req, res) => {
  try {
    const { company_id } = req.user;

    // Récupérer le stripe_account_id
    const [rows] = await db.query(
      "SELECT stripe_account_id FROM companies WHERE id = ?",
      [company_id],
    );

    if (!rows[0]?.stripe_account_id) {
      return res.status(404).json({
        success: false,
        error: "No Stripe account found",
      });
    }

    const accountId = rows[0].stripe_account_id;

    // Récupérer les détails complets du compte
    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      success: true,
      account_id: account.id,
      type: account.type,
      business_type: account.business_type,
      country: account.country,
      has_individual: !!account.individual,
      has_company: !!account.company,
      individual_fields: account.individual
        ? Object.keys(account.individual)
        : [],
      capabilities: {
        card_payments: account.capabilities.card_payments,
        transfers: account.capabilities.transfers,
      },
      requirements: {
        currently_due: account.requirements.currently_due,
        eventually_due: account.requirements.eventually_due,
        disabled_reason: account.requirements.disabled_reason,
      },
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (error) {
    console.error("Error inspecting account:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

---

### 2. Endpoint Personal Info avec Réparation Auto (PRINCIPAL)

```javascript
/**
 * POST /v1/stripe/onboarding/personal-info
 * Soumet les infos personnelles avec tentative de réparation auto
 */
app.post(
  "/v1/stripe/onboarding/personal-info",
  authenticateToken,
  async (req, res) => {
    try {
      const { company_id } = req.user;
      const { first_name, last_name, dob, email, phone } = req.body;

      // Validation des données
      if (!first_name || !last_name || !dob || !email || !phone) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
          required: ["first_name", "last_name", "dob", "email", "phone"],
        });
      }

      // Récupérer le stripe_account_id
      const [rows] = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      if (!rows[0]?.stripe_account_id) {
        return res.status(404).json({
          success: false,
          error: "No Stripe account found",
        });
      }

      const accountId = rows[0].stripe_account_id;

      // ⭐ ÉTAPE 1: Diagnostic du compte
      console.log("🔍 [REPAIR] Inspecting account:", accountId);
      const account = await stripe.accounts.retrieve(accountId);

      console.log(`📊 [REPAIR] Business type: ${account.business_type}`);
      console.log(`📊 [REPAIR] Has individual: ${!!account.individual}`);
      console.log(`📊 [REPAIR] Has company: ${!!account.company}`);

      // ⭐ ÉTAPE 2: Tentative de réparation si nécessaire

      // CAS A: business_type manquant
      if (!account.business_type) {
        console.log("⚠️ [REPAIR] Missing business_type, fixing...");
        try {
          await stripe.accounts.update(accountId, {
            business_type: "individual",
          });
          console.log("✅ [REPAIR] business_type set to individual");
        } catch (repairError) {
          console.error(
            "❌ [REPAIR] Failed to set business_type:",
            repairError.message,
          );
          return res.status(500).json({
            success: false,
            error: "Cannot repair account: " + repairError.message,
            needs_recreation: true,
          });
        }
      }

      // CAS B: business_type = 'company' (irréparable)
      if (account.business_type === "company") {
        console.error(
          "❌ [REPAIR] Account is company type, cannot use individual data",
        );
        return res.status(400).json({
          success: false,
          error: "Account is configured as company, not individual",
          needs_recreation: true,
          current_business_type: "company",
        });
      }

      // CAS C: Vérifier les capabilities
      if (!account.capabilities.transfers) {
        console.log("⚠️ [REPAIR] Missing transfers capability, adding...");
        try {
          await stripe.accounts.update(accountId, {
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
          });
          console.log("✅ [REPAIR] Capabilities updated");
        } catch (capError) {
          console.warn(
            "⚠️ [REPAIR] Could not update capabilities:",
            capError.message,
          );
          // Continue anyway, might work
        }
      }

      // ⭐ ÉTAPE 3: Tentative de mise à jour des données
      const [year, month, day] = dob.split("-").map(Number);

      console.log("📝 [PERSONAL-INFO] Updating individual data...");

      try {
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

        console.log("✅ [PERSONAL-INFO] Individual data updated successfully");

        // Mettre à jour la progression dans la DB
        await db.query(
          "UPDATE companies SET stripe_onboarding_progress = 20 WHERE id = ?",
          [company_id],
        );

        res.json({
          success: true,
          message: "Personal information saved",
          progress: 20,
          next_step: "address",
        });
      } catch (updateError) {
        console.error("❌ [PERSONAL-INFO] Update failed:", updateError.message);

        // Si l'erreur persiste même après réparation
        if (
          updateError.message.includes("permissions") ||
          updateError.message.includes("individual")
        ) {
          return res.status(500).json({
            success: false,
            error: updateError.message,
            needs_recreation: true,
            repair_attempted: true,
            suggestion: "Delete and recreate account with proper settings",
          });
        }

        // Autre type d'erreur
        throw updateError;
      }
    } catch (error) {
      console.error("❌ [PERSONAL-INFO] Unexpected error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);
```

---

### 3. Frontend: Gestion du Flag `needs_recreation`

Le frontend doit détecter ce flag et proposer la suppression/recréation.

```typescript
// Dans PersonalInfoScreen.tsx, après l'appel API

try {
  const result = await submitPersonalInfo(payload);
  // Succès, naviguer vers l'étape suivante
  navigation.navigate("Address");
} catch (error: any) {
  // Vérifier si le compte doit être recréé
  if (error.needs_recreation) {
    Alert.alert(
      "Compte non réparable",
      "Le compte Stripe existant ne peut pas être modifié. Voulez-vous le supprimer et en créer un nouveau ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Recréer",
          style: "destructive",
          onPress: async () => {
            // Appeler DELETE puis START
            await deleteStripeAccount();
            await startStripeOnboarding();
            // Réessayer
            navigation.replace("PersonalInfo");
          },
        },
      ],
    );
  } else {
    // Erreur normale
    Alert.alert("Erreur", error.message);
  }
}
```

---

## 🧪 Plan de Test

### Test 1: Diagnostic Initial

```bash
# Appeler l'endpoint d'inspection
curl -X GET https://altivo.fr/swift-app/v1/stripe/account/inspect \
  -H "Authorization: Bearer <token>"
```

**Analyser le résultat:**

- `business_type: null` → Scénario A (réparable)
- `business_type: 'company'` → Scénario B (recréation nécessaire)
- `business_type: 'individual'` → Scénario C (vérifier capabilities)

---

### Test 2: Tentative de Réparation

```bash
# Soumettre les données personnelles
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/personal-info \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Romain",
    "last_name": "Giovanni",
    "dob": "1995-12-21",
    "email": "romaingiovanni@gmail.com",
    "phone": "+610459823975"
  }'
```

**Résultats possibles:**

✅ **Succès (Status 200):**

```json
{
  "success": true,
  "message": "Personal information saved",
  "progress": 20,
  "next_step": "address"
}
```

→ Le compte a été réparé avec succès !

❌ **Erreur réparable (Status 500):**

```json
{
  "success": false,
  "error": "...",
  "needs_recreation": true,
  "repair_attempted": true
}
```

→ La réparation a échoué, il faut supprimer et recréer

⚠️ **Type incompatible (Status 400):**

```json
{
  "success": false,
  "error": "Account is configured as company, not individual",
  "needs_recreation": true,
  "current_business_type": "company"
}
```

→ Le compte est de type company, impossible de le convertir

---

### Test 3: Suppression + Recréation (si nécessaire)

```bash
# 1. Supprimer l'ancien compte
curl -X DELETE https://altivo.fr/swift-app/v1/stripe/account \
  -H "Authorization: Bearer <token>"

# 2. Créer un nouveau compte
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/start \
  -H "Authorization: Bearer <token>"

# 3. Réessayer les infos personnelles
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/personal-info \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## 📊 Logs Backend Attendus

### Scénario A (Réparation réussie):

```
🔍 [REPAIR] Inspecting account: acct_1Sbc2yIJgkyzp7Ff
📊 [REPAIR] Business type: null
📊 [REPAIR] Has individual: false
📊 [REPAIR] Has company: false
⚠️ [REPAIR] Missing business_type, fixing...
✅ [REPAIR] business_type set to individual
📝 [PERSONAL-INFO] Updating individual data...
✅ [PERSONAL-INFO] Individual data updated successfully
```

### Scénario B (Recréation nécessaire):

```
🔍 [REPAIR] Inspecting account: acct_1Sbc2yIJgkyzp7Ff
📊 [REPAIR] Business type: company
📊 [REPAIR] Has individual: false
📊 [REPAIR] Has company: true
❌ [REPAIR] Account is company type, cannot use individual data
```

### Scénario C (Mystère - échec après tentatives):

```
🔍 [REPAIR] Inspecting account: acct_1Sbc2yIJgkyzp7Ff
📊 [REPAIR] Business type: individual
📊 [REPAIR] Has individual: true
📊 [REPAIR] Has company: false
⚠️ [REPAIR] Missing transfers capability, adding...
✅ [REPAIR] Capabilities updated
📝 [PERSONAL-INFO] Updating individual data...
❌ [PERSONAL-INFO] Update failed: This application does not have the required permissions...
```

→ Dans ce cas, c'est probablement un problème de clé API

---

## 🔐 Vérification des Clés API

Si la réparation échoue même avec `business_type: 'individual'`, vérifier :

### Dans le code backend:

```javascript
// Quelle clé utilisez-vous ?
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Afficher la clé (masquée) pour debug
console.log(
  "Using Stripe key:",
  process.env.STRIPE_SECRET_KEY?.substring(0, 20) + "...",
);
```

### Clés attendues:

**✅ Mode Test (correct):**

```
sk_test_example_no_secret
```

→ Clé secrète complète (non restricted)

**❌ Mode Test (incorrect):**

```
rk_test_example_no_secret
```

→ Restricted key - vérifier les permissions dans le Dashboard

**✅ Mode Live (correct):**

```
sk_live_example_no_secret
```

→ Clé secrète complète avec toutes les permissions

---

## ✅ Checklist d'Implémentation

- [ ] Implémenter `GET /v1/stripe/account/inspect` (optionnel)
- [ ] Modifier `POST /v1/stripe/onboarding/personal-info` avec logique de réparation
- [ ] Ajouter logs détaillés pour chaque étape de réparation
- [ ] Retourner le flag `needs_recreation` si échec
- [ ] Frontend: gérer le flag `needs_recreation` avec Alert
- [ ] Tester avec le compte actuel `acct_1Sbc2yIJgkyzp7Ff`
- [ ] Vérifier la clé API utilisée (sk*test* vs rk*test*)
- [ ] Documenter les résultats des tests

---

## 🎯 Résultat Attendu

**Cas idéal:** Le compte est réparé automatiquement, aucune suppression nécessaire.

**Cas réaliste:** La réparation échoue, mais on a un diagnostic clair et un processus de suppression/recréation fluide.

**Avantage:** L'utilisateur n'a rien à faire manuellement dans le Dashboard Stripe ou la DB.

---

**Document créé le:** 5 Février 2026, 17:45  
**Prochaine étape:** Implémenter et tester la logique de réparation

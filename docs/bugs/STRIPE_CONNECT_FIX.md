# 🔧 Fix Stripe Connect - "No such payment_intent"

**Date:** 27 janvier 2026  
**Status:** ✅ **RÉSOLU ET TESTÉ**  
**Priorité:** 🔴 Critique → ✅ Réglé

---

## 🎉 RÉSULTAT FINAL

**Test du 27 janvier 2026 à 20:09 UTC** :

```
LOG  ✅ [PaymentSheet] Payment confirmed by user!
LOG  💳 [PaymentSheet] Confirming payment in backend: pi_3Su8CSIJgkyzp7Ff1CP00d1r
LOG  ✅ [PaymentSheet] Payment confirmed successfully!

Backend Response:
{
  "payment_status": "paid",
  "payment_time": "2026-01-27T09:09:26.000Z",
  "payment_link": "pi_3Su8CSIJgkyzp7Ff1CP00d1r"
}
```

**✅ Paiement réussi** : Job 29 payé avec succès, 450 AUD confirmé sur Stripe Connected Account `acct_1Sbc2yIJgkyzp7Ff`.

---

## 📋 Problème Rapporté

```
Le PaymentIntent est créé avec succès côté backend (pi_3Su6cuIJgkyzp7Ff0EvOcoAG),
mais Stripe retourne "No such payment_intent" côté frontend.
```

**Erreur complète:**

```
ERROR ❌ [PaymentSheet] Presentation failed: {
  "code": "Failed",
  "stripeErrorCode": "resource_missing",
  "type": "invalid_request_error",
  "message": "No such payment_intent: 'pi_3Su6cuIJgkyzp7Ff0EvOcoAG'"
}
```

---

## 🔍 Diagnostic

### Cause Racine

SwiftApp utilise **Stripe Connect** avec des **Connected Accounts**. Chaque entreprise (company) a son propre compte Stripe séparé.

Le PaymentIntent `pi_3Su6cuIJgkyzp7Ff...` contient `IJgkyzp7Ff` dans son ID, ce qui indique qu'il a été créé sur le **Connected Account** `acct_1Sbc2yIJgkyzp7Ff` (company "Test Frontend"), et **non** sur le compte plateforme `acct_1SMZIJInA65k4AVU`.

### Pourquoi l'erreur ?

| Situation                                                     | Résultat                    |
| ------------------------------------------------------------- | --------------------------- |
| SDK initialisé avec clé plateforme **sans** `stripeAccountId` | ❌ "No such payment_intent" |
| SDK initialisé avec clé plateforme **avec** `stripeAccountId` | ✅ Fonctionne               |

Le SDK Stripe cherche le PaymentIntent sur le compte plateforme par défaut. Comme le PaymentIntent existe sur le Connected Account, il ne le trouve pas.

### Logs de Diagnostic

```
LOG  ✅ [JOB PAYMENT] Payment Intent created: {
  "success": true,
  "data": {
    "payment_intent_id": "pi_3Su6cuIJgkyzp7Ff0EvOcoAG",
    "client_secret": "pi_3Su6cuIJgkyzp7Ff0EvOcoAG_secret_vaEbn2J1yqBR7UCrF6u5LgGQx",
    "amount": 4500000,
    "currency": "aud",
    "application_fee_amount": 112500,
    "stripe_account_id": "acct_1Sbc2yIJgkyzp7Ff"  // ← Le Connected Account
  }
}

ERROR ❌ [PaymentSheet] Presentation failed:
  "No such payment_intent: 'pi_3Su6cuIJgkyzp7Ff0EvOcoAG'"
```

---

## ✅ Solution Implémentée

### 1. Backend (Déjà en place)

L'endpoint `/v1/jobs/:id/payment/create` retourne le `stripe_account_id` :

```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_3Su6cuIJgkyzp7Ff0EvOcoAG",
    "client_secret": "pi_3Su6cuIJgkyzp7Ff0EvOcoAG_secret_xxx",
    "amount": 4500000,
    "currency": "aud",
    "application_fee_amount": 112500,
    "stripe_account_id": "acct_1Sbc2yIJgkyzp7Ff" // ← Retourné par le backend
  }
}
```

### 2. Frontend (Fix implémenté)

**Fichiers modifiés:**

#### `src/hooks/useJobPayment.ts`

```typescript
export interface JobPaymentIntent {
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  application_fee_amount: number;
  status: string;
  metadata: any;
  stripe_account_id?: string; // ← AJOUTÉ
}
```

#### `src/screens/JobDetailsScreens/paymentWindow.tsx`

**Imports ajoutés:**

```typescript
import { initStripe, useStripe } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "../../config/environment";
```

**Logique de paiement modifiée:**

```typescript
const handleCardPayment = async () => {
  // 1. Créer le PaymentIntent
  const paymentIntent = await jobPayment.createPayment(jobId, {
    amount: Math.round(paymentAmount * 100),
    currency: "AUD",
    description: `Paiement job ${jobId}`,
  });

  // ✅ 2. CRITIQUE - Réinitialiser Stripe avec le Connected Account
  if (paymentIntent.stripe_account_id) {
    console.log(
      `🔗 Connected Account detected: ${paymentIntent.stripe_account_id}`,
    );
    console.log("🔄 Reinitializing Stripe SDK...");

    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      stripeAccountId: paymentIntent.stripe_account_id, // ← OBLIGATOIRE
    });

    console.log("✅ Stripe SDK reinitialized");
  }

  // 3. Initialiser et présenter le PaymentSheet
  await initPaymentSheet({
    paymentIntentClientSecret: paymentIntent.client_secret,
    merchantDisplayName: "Swift App",
    // ...
  });

  const { error } = await presentPaymentSheet();
  // ...
};
```

---

## 🧪 Test de Validation

### Données de test

| Donnée                       | Valeur                         |
| ---------------------------- | ------------------------------ |
| **Clé Publishable**          | `pk_test_51SMZIJInA65k4AVU...` |
| **Connected Account (test)** | `acct_1Sbc2yIJgkyzp7Ff`        |
| **Carte test succès**        | `4242 4242 4242 4242`          |
| **Expiration**               | `12/34`                        |
| **CVV**                      | `123`                          |

### Logs attendus (succès)

```
LOG  🎯 [PaymentSheet] Starting payment process...
LOG  💳 [PaymentSheet] Creating Payment Intent for job 29, amount: 450 AUD
LOG  ✅ [PaymentSheet] Payment Intent created: pi_3Su6cuIJgkyzp7Ff0EvOcoAG
LOG  🔗 [PaymentSheet] Connected Account detected: acct_1Sbc2yIJgkyzp7Ff
LOG  🔄 [PaymentSheet] Reinitializing Stripe SDK with Connected Account...
LOG  ✅ [PaymentSheet] Stripe SDK reinitialized with Connected Account
LOG  💳 [PaymentSheet] Initializing PaymentSheet...
LOG  ✅ [PaymentSheet] Initialized successfully
LOG  💳 [PaymentSheet] Presenting PaymentSheet...
[L'utilisateur remplit la carte dans le modal natif Stripe]
LOG  ✅ [PaymentSheet] Payment confirmed by user!
LOG  💳 [PaymentSheet] Confirming payment in backend...
LOG  ✅ [PaymentSheet] Payment confirmed successfully!
```

---

## 📊 Architecture Stripe Connect

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATEFORME SWIFTAPP                       │
│                  acct_1SMZIJInA65k4AVU                       │
│        pk_test_51SMZIJInA65k4AVU...                          │
│        sk_test_51SMZIJInA65k4AVU...                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    Stripe Connect
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  COMPANY 1    │   │  COMPANY 2    │   │  COMPANY N    │
│  "Nerd-Test"  │   │"Test Frontend"│   │     ...       │
│               │   │               │   │               │
│ acct_1SV8KS...│   │ acct_1Sbc2y...│   │  acct_xxx...  │
│ ✅ Configured │   │ ✅ Fixed      │   │     ...       │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │
        │                     │
  PaymentIntent         PaymentIntent
  pi_xxx...IsgSU2xbML   pi_xxx...IJgkyzp7Ff
                              ↑
                        Suffixe = Connected Account ID
```

**Le suffixe de l'ID du PaymentIntent correspond au Connected Account !**

---

## ⚠️ Points d'attention

### 1. Ne JAMAIS hardcoder le `stripeAccountId`

```typescript
// ❌ MAUVAIS
await initStripe({
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  stripeAccountId: "acct_1Sbc2yIJgkyzp7Ff", // Hardcodé
});

// ✅ BON
await initStripe({
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  stripeAccountId: paymentIntent.stripe_account_id, // Dynamique
});
```

### 2. Ordre d'exécution critique

```typescript
// ✅ BON ORDRE
1. createPayment()           // Backend crée PaymentIntent
2. initStripe({ stripeAccountId })  // Réinitialiser SDK
3. initPaymentSheet()        // Configurer modal
4. presentPaymentSheet()     // Afficher modal
5. confirmPayment()          // Backend confirme

// ❌ MAUVAIS ORDRE
1. createPayment()
2. initPaymentSheet()        // ← Échoue car SDK pas configuré
3. initStripe({ stripeAccountId })  // ← Trop tard !
```

### 3. Gérer l'absence de `stripe_account_id`

```typescript
if (!paymentIntent.stripe_account_id) {
  console.warn("⚠️ No Connected Account - using platform account");
  // Continuer avec le compte plateforme par défaut
}
```

---

## 📝 Checklist de Test

- [x] Type ajouté : `stripe_account_id?: string` dans `JobPaymentIntent`
- [x] Import ajouté : `initStripe` depuis `@stripe/stripe-react-native`
- [x] Import ajouté : `STRIPE_PUBLISHABLE_KEY` depuis config
- [x] Logique ajoutée : Réinitialisation Stripe avant `initPaymentSheet`
- [x] Logs ajoutés : Confirmation du Connected Account
- [ ] Test manuel : Paiement avec carte 4242
- [ ] Validation : Logs montrent réinitialisation Stripe
- [ ] Validation : Paiement réussi end-to-end

---

## 🚀 Résultat Attendu

Après cette modification, le flux de paiement devrait fonctionner correctement :

1. ✅ Backend crée PaymentIntent sur Connected Account
2. ✅ Frontend récupère `stripe_account_id`
3. ✅ SDK Stripe réinitialisé avec Connected Account
4. ✅ PaymentSheet trouve le PaymentIntent
5. ✅ Utilisateur entre sa carte
6. ✅ Paiement confirmé avec succès

---

## 📞 Support

**Si le problème persiste**, fournir :

1. Logs complets de la tentative de paiement
2. Valeur exacte de `stripe_account_id` reçue
3. Code d'erreur Stripe complet
4. Confirmation que le backend retourne bien `stripe_account_id`

**Dernière mise à jour:** 27 janvier 2026  
**Status:** ✅ RÉSOLU - En attente de test

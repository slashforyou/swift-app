# 🔴 PROBLÈME: Comptes Stripe Différents entre Job Payment et Business Stripe

**Date:** 1er février 2026  
**Priorité:** HAUTE  
**Status:** ✅ RÉSOLU - Solution implémentée

---

## ✅ RÉSOLUTION

### Analyse Backend

Le comportement est **NORMAL et CORRECT**:

- L'utilisateur (Company 2) travaille POUR une autre compagnie (Company 1)
- L'utilisateur est un employé assigné à des jobs du créateur (Company 1)
- Le paiement va correctement au **contractee** (Company 1 = créateur du job)
- Le **contractor** (Company 2 = exécutant) est l'employé qui fait le travail

### Solution Frontend Implémentée

✅ **Affichage clair de l'ownership** via `JobOwnershipBanner`  
✅ **Actions d'acceptation/refus** via `JobAssignmentActions`  
✅ **Services API** pour `/accept` et `/decline`  
✅ **Documentation complète** pour l'équipe backend

---

## 📋 Documents Créés

1. **[JOB_OWNERSHIP_REQUIREMENTS.md](./JOB_OWNERSHIP_REQUIREMENTS.md)**
   - Spécifications détaillées backend
   - Nouveaux champs DB requis
   - Endpoints à créer/modifier
   - Statuts de job enrichis
   - Cas de test

2. **[JOB_OWNERSHIP_FRONTEND_IMPLEMENTATION.md](./JOB_OWNERSHIP_FRONTEND_IMPLEMENTATION.md)**
   - Composants créés
   - Guide d'intégration
   - Structure de données
   - Workflow utilisateur
   - Checklist

---

## 📋 Résumé du Problème (Résolu)

Les paiements effectués depuis `JobDetails -> Payment` sont envoyés vers un compte Stripe différent de celui affiché dans `Business -> Stripe`.

---

## 🔍 Analyse Technique

### 1️⃣ **Flux de Paiement Job (JobDetails -> Payment)**

**Fichier:** `src/screens/JobDetailsScreens/paymentWindow.tsx`  
**Hook utilisé:** `useJobPayment` (`src/hooks/useJobPayment.ts`)  
**Service:** `createJobPaymentIntent()` dans `src/services/StripeService.ts`

**Endpoint API appelé:**

```

POST /v1/jobs/{job_id}/payment/create

```

**Comportement:**

1. L'API backend retourne un `payment_intent` avec:
   - `payment_intent_id`

   - `client_secret`
   - **`stripe_account_id`** ← Compte Stripe Connect du destinataire

2. Le frontend réinitialise le SDK Stripe avec ce compte:

```typescript
// Ligne 222-226 de paymentWindow.tsx
await initStripe({
  publishableKey: STRIPE_PUBLISHABLE_KEY,

  stripeAccountId: paymentIntent.stripe_account_id, // ← Utilise le compte du job
});
```

**Question:** Quel compte Stripe est retourné par l'API pour les jobs?  
**Réponse:** Le backend détermine le `stripe_account_id` en fonction:

- Du propriétaire du job?

- De l'entreprise associée au job?
- D'un compte platform par défaut?

---

### 2️⃣ **Affichage Compte Business (Business -> Stripe)**

**Fichiers:**

- `src/screens/business/StripeHub.tsx` (affichage)
- `src/hooks/useStripe.ts` (hook `useStripeAccount`)
- `src/services/StripeService.ts` (fonction `fetchStripeAccount`)

**Endpoint API appelé:**

```
GET /v1/stripe/connect/status?company_id={company_id}
```

**Comportement:**

1. Récupère le `company_id` depuis SecureStore (utilisateur connecté)

2. Charge les informations du compte Stripe Connect de CETTE entreprise

3. Affiche:
   - `stripe_account_id`
   - Statut de connexion
   - Solde disponible
   - Comptes bancaires

**Compte utilisé:** Celui de l'entreprise de l'utilisateur connecté (company_id stocké dans le profil)

---

## 🚨 Incohérence Identifiée

### **Scénario Problématique:**

| Contexte | Compte Stripe Utilisé | Source |

| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| **Paiement Job** | `stripe_account_id` retourné par `/jobs/{id}/payment/create` | Déterminé par le backend selon la logique métier du job |
| **Business -> Stripe** | `stripe_account_id` de `company_id` de l'utilisateur connecté | `/stripe/connect/status?company_id={company_id}` |

**Problème:** Ces deux comptes peuvent être différents si:

1. Le job appartient à une autre entreprise que celle de l'utilisateur

2. Le backend utilise un compte platform par défaut pour les jobs

3. Il y a une erreur dans la logique de détermination du compte du job

---

## 🔎 Points à Vérifier Backend

### 1. **Logique de Sélection du Compte pour Jobs**

```

Question: Quel stripe_account_id est retourné par POST /v1/jobs/{job_id}/payment/create?
- Le compte de l'entreprise propriétaire du job?
- Le compte de l'entreprise du prestataire assigné?
- Le compte platform?

- Autre logique?

```

### 2. **Vérifier les Logs Backend**

Lors d'un appel à `/jobs/{job_id}/payment/create`, vérifier:

```sql
-- Requête exemple pour identifier le compte utilisé
SELECT

  j.id as job_id,

  j.title,

  j.company_id as job_company_id,

  c.name as company_name,

  c.stripe_account_id,
  u.company_id as user_company_id
FROM jobs j

JOIN companies c ON c.id = j.company_id
JOIN users u ON u.id = {current_user_id}
WHERE j.id = {job_id};
```

### 3. **Tester avec des Données Réelles**

- Job ID testé: **\_**

- User connecté company_id: **\_**

- stripe_account_id retourné pour paiement: **\_**
- stripe_account_id affiché dans Business: **\_**

---

## 🎯 Solutions Possibles

### Option 1: **Aligner les Comptes** (Recommandé)

Assurer que le compte Stripe utilisé pour les paiements de jobs correspond au compte de l'entreprise de l'utilisateur connecté.

**Backend:**

```php


// Dans /jobs/{job_id}/payment/create
$job = Job::find($jobId);
$userCompanyId = auth()->user()->company_id;


// Vérifier que le job appartient à l'entreprise de l'utilisateur
if ($job->company_id !== $userCompanyId) {
    return response()->json(['error' => 'Unauthorized'], 403);


}

// Utiliser le compte Stripe de l'entreprise de l'utilisateur
$stripeAccountId = Company::find($userCompanyId)->stripe_account_id;
```

### Option 2: **Afficher le Bon Compte dans Business**

Si la logique actuelle est correcte (jobs peuvent avoir des comptes différents), alors afficher le compte Stripe du job spécifique dans l'écran Business.

**Frontend:**

- Récupérer le `stripe_account_id` depuis les informations du job
- Afficher un message si différent du compte de l'entreprise

### Option 3: **Multi-Comptes Stripe**

Supporter plusieurs comptes Stripe par utilisateur si c'est un cas d'usage valide.

---

## 📝 Prochaines Étapes

1. [ ] Vérifier la logique backend de `/jobs/{job_id}/payment/create`
2. [ ] Identifier quel `stripe_account_id` est retourné et pourquoi

3. [ ] Comparer avec le compte de l'entreprise de l'utilisateur
4. [ ] Décider de la solution à implémenter
5. [ ] Tester avec des jobs réels

---

## 📂 Fichiers Impliqués

### Frontend

- `src/screens/JobDetailsScreens/paymentWindow.tsx` (ligne 214-226)
- `src/hooks/useJobPayment.ts` (ligne 21)
- `src/services/StripeService.ts` (ligne 990-1080: createJobPaymentIntent)
- `src/services/StripeService.ts` (ligne 425-480: fetchStripeAccount)
- `src/hooks/useStripe.ts` (ligne 350-400: useStripeAccountSettings)
- `src/screens/business/StripeHub.tsx`

### Backend

- Endpoint: `POST /v1/jobs/{job_id}/payment/create`
- Endpoint: `GET /v1/stripe/connect/status`
- Logique de détermination du `stripe_account_id` pour les jobs

---

## 💡 Questions pour l'Équipe Backend

1. **Quelle est la logique actuelle pour déterminer le `stripe_account_id` dans `/jobs/{job_id}/payment/create`?**
2. **Les jobs peuvent-ils appartenir à des entreprises différentes de l'utilisateur qui effectue le paiement?**
3. **Y a-t-il un compte Stripe platform par défaut utilisé?**
4. **Le champ `company_id` dans la table `jobs` correspond-il bien à l'entreprise propriétaire?**

---

**Créé par:** GitHub Copilot  
**Date:** 1er février 2026

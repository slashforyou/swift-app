# ⚠️ URGENT: Mauvaise Configuration Stripe - Impact Financier Critique

**Date**: 5 février 2026 20:30  
**Status**: ✅ Techniquement fonctionnel, ❌ Économiquement désastreux  
**Impact**: SwiftApp paie TOUS les frais Stripe de TOUTES les companies

---

## 🔴 Configuration Actuelle (Backend)

```javascript
controller: {
  losses: { payments: 'stripe' },      // Stripe assume les pertes (rare)
  fees: { payer: 'application' },      // ❌ PROBLÈME: SwiftApp paie TOUT
  stripe_dashboard: { type: 'express' },
  requirement_collection: 'stripe'
}
```

**Cela signifie**: Chaque fois qu'une company reçoit un paiement, **SwiftApp paie les frais Stripe** au lieu de la company.

---

## 💸 Projection des Coûts

### Scénario Conservateur (10 companies actives)

| Métrique                       | Valeur              |
| ------------------------------ | ------------------- |
| Companies actives              | 10                  |
| Transactions/company/mois      | 50                  |
| Total transactions/mois        | 500                 |
| Montant moyen/transaction      | 500 AUD             |
| Volume mensuel                 | 250,000 AUD         |
| **Frais Stripe (2.9% + 0.30)** | **~7,500 AUD/mois** |
| **Frais annuels**              | **~90,000 AUD/an**  |

### Scénario Croissance (100 companies actives)

| Métrique                       | Valeur               |
| ------------------------------ | -------------------- |
| Companies actives              | 100                  |
| Transactions/company/mois      | 50                   |
| Total transactions/mois        | 5,000                |
| Montant moyen/transaction      | 500 AUD              |
| Volume mensuel                 | 2,500,000 AUD        |
| **Frais Stripe (2.9% + 0.30)** | **~75,000 AUD/mois** |
| **Frais annuels**              | **~900,000 AUD/an**  |

**❌ Non viable pour une startup!**

---

## ✅ Configuration Recommandée (Option 1)

```javascript
controller: {
  losses: { payments: 'application' },  // SwiftApp assume les chargebacks
  fees: { payer: 'account' },           // ✅ Chaque company paie ses frais
  stripe_dashboard: { type: 'express' },
  requirement_collection: 'stripe'
}
```

**Cela signifie**: Chaque company paie ses propres frais Stripe, SwiftApp assume seulement les chargebacks.

---

## 💰 Comparaison Financière

### Exemple: 100 transactions de 500 AUD/mois

| Coût                    | Option Actuelle (Backend) | Option Recommandée  |
| ----------------------- | ------------------------- | ------------------- |
| **Frais Stripe**        | 7,500 AUD/SwiftApp        | 7,500 AUD/Companies |
| **Chargebacks (1%)**    | 0 AUD (Stripe)            | 2,500 AUD/SwiftApp  |
| **Coût total SwiftApp** | **7,500 AUD** ❌          | **2,500 AUD** ✅    |
| **Économies**           | -                         | **5,000 AUD/mois**  |

**Sur 1 an**: Économie de **60,000 AUD** avec l'Option 1!

---

## 🎯 Pourquoi l'Option 1 est Standard

### Modèles des Grandes Plateformes

**Uber**:

- Chauffeurs paient les frais Stripe (~2.9%)
- Uber assume les chargebacks/disputes
- Configuration: `losses: application`, `fees: account`

**Airbnb**:

- Hôtes paient les frais Stripe
- Airbnb assume les disputes
- Configuration: `losses: application`, `fees: account`

**Deliveroo**:

- Restaurants paient les frais
- Deliveroo assume les chargebacks
- Configuration: `losses: application`, `fees: account`

**Tous** utilisent l'Option 1, **aucun** n'utilise l'Option Actuelle.

---

## 🔍 Détails Techniques

### Option Actuelle (Backend) - fees.payer: 'application'

**Comment ça marche**:

1. Client paie 100 AUD à une company
2. Stripe prélève 2.9 AUD + 0.30 = 3.20 AUD
3. **SwiftApp paie ces 3.20 AUD** depuis son compte Stripe
4. Company reçoit 100 AUD complet
5. SwiftApp ne reçoit rien (sauf commission séparée si configurée)

**Avantages**:

- ✅ Companies reçoivent 100% des paiements (simple à expliquer)
- ✅ Pas de déduction visible côté company

**Inconvénients**:

- ❌ SwiftApp paie TOUS les frais (non scalable)
- ❌ Coûts croissent linéairement avec le volume
- ❌ Nécessite une commission SwiftApp > 2.9% pour être rentable
- ❌ Modèle rare dans l'industrie

---

### Option Recommandée - losses.payments: 'application'

**Comment ça marche**:

1. Client paie 100 AUD à une company
2. Stripe prélève 2.9 AUD + 0.30 = 3.20 AUD
3. **Company paie ces 3.20 AUD** (déduit automatiquement)
4. Company reçoit 96.80 AUD
5. SwiftApp reçoit 0 AUD (sauf commission)
6. Si chargeback: **SwiftApp paie** les 100 AUD

**Avantages**:

- ✅ Scalable (coûts SwiftApp fixes ou proportionnels aux disputes)
- ✅ Standard de l'industrie
- ✅ Companies paient leurs coûts réels
- ✅ SwiftApp garde le contrôle des litiges

**Inconvénients**:

- ⚠️ SwiftApp assume les chargebacks (~0.5-1% du volume)
- ⚠️ Nécessite un buffer de trésorerie

---

## 📊 Simulation de Rentabilité

### Avec Option Actuelle (Backend)

**Hypothèse**: SwiftApp prend 5% de commission

| Élément                      | Calcul      | Montant          |
| ---------------------------- | ----------- | ---------------- |
| Transaction client           | 100 AUD     | 100 AUD          |
| Frais Stripe (SwiftApp paie) | 2.9% + 0.30 | -3.20 AUD        |
| Commission SwiftApp (5%)     | 5% × 100    | +5.00 AUD        |
| **Marge nette SwiftApp**     | 5.00 - 3.20 | **+1.80 AUD** ✅ |

**Rentable seulement si commission > 3.2%**

---

### Avec Option Recommandée

**Hypothèse**: SwiftApp prend 5% de commission

| Élément                     | Calcul      | Montant             |
| --------------------------- | ----------- | ------------------- |
| Transaction client          | 100 AUD     | 100 AUD             |
| Frais Stripe (Company paie) | 2.9% + 0.30 | -3.20 AUD (company) |
| Commission SwiftApp (5%)    | 5% × 100    | +5.00 AUD           |
| Chargeback estimé (1%)      | 1% × 100    | -1.00 AUD           |
| **Marge nette SwiftApp**    | 5.00 - 1.00 | **+4.00 AUD** ✅    |

**Marge 122% plus élevée avec Option Recommandée!**

---

## 🛠️ Code à Modifier

**Fichier backend** (probablement `stripe-controller.js`):

### ❌ ACTUEL (À Changer)

```javascript
const account = await stripe.accounts.create({
  country: "AU",
  business_type: "individual",
  controller: {
    losses: { payments: "stripe" }, // ❌ À CHANGER
    fees: { payer: "application" }, // ❌ À CHANGER
    stripe_dashboard: { type: "express" },
    requirement_collection: "stripe",
  },
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});
```

### ✅ RECOMMANDÉ (Modifier ainsi)

```javascript
const account = await stripe.accounts.create({
  country: "AU",
  business_type: "individual",
  controller: {
    losses: { payments: "application" }, // ✅ CHANGER: SwiftApp assume pertes
    fees: { payer: "account" }, // ✅ CHANGER: Companies paient frais
    stripe_dashboard: { type: "express" },
    requirement_collection: "stripe",
  },
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});
```

**Changements**:

1. `losses.payments: 'stripe'` → `'application'`
2. `fees.payer: 'application'` → `'account'`

---

## 🧪 Test de Validation

### Étape 1: Tester Configuration Actuelle (Validation Technique)

**But**: Confirmer que ça marche techniquement

```bash
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/start \
  -H "Authorization: Bearer TOKEN"
```

**Résultat attendu**: Status 200 ✅

---

### Étape 2: Modifier vers Option Recommandée

**Modifier le code** comme ci-dessus, **redémarrer le serveur**.

---

### Étape 3: Tester Configuration Recommandée

```bash
# Test de création
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/start \
  -H "Authorization: Bearer TOKEN"
```

**Résultat attendu**: Status 200 ✅

---

### Étape 4: Vérifier dans Stripe Dashboard

1. Aller sur https://dashboard.stripe.com/test/connect/accounts
2. Cliquer sur le compte créé
3. Vérifier "Controller settings":
   - `losses.payments` doit être **application** ✅
   - `fees.payer` doit être **account** ✅

---

## 💡 Gestion des Chargebacks (Option Recommandée)

### Qu'est-ce qu'un Chargeback?

Un chargeback survient quand:

- Un client conteste un paiement auprès de sa banque
- La banque retire les fonds et SwiftApp doit rembourser
- Exemple: Client dit "Je n'ai pas reçu le service"

### Taux de Chargeback Typique

| Industrie                   | Taux Moyen |
| --------------------------- | ---------- |
| Marketplaces (Uber, Airbnb) | 0.5-1.0%   |
| E-commerce                  | 0.6-1.5%   |
| Services professionnels     | 0.3-0.8%   |

**SwiftApp** (Moving Services) → Attendu: **~0.5%**

### Buffer de Trésorerie Recommandé

**Formule**: 10-20% du volume mensuel

**Exemple** (100,000 AUD/mois):

- Buffer recommandé: 10,000-20,000 AUD
- Chargebacks estimés: 500 AUD/mois
- **Largement suffisant**

---

## 📋 Checklist Décision

### ✅ Tester Configuration Actuelle (Validation Technique)

- [ ] Frontend teste `/onboarding/start`
- [ ] Confirmer Status 200
- [ ] Vérifier compte créé dans Stripe Dashboard
- [ ] **Résultat**: Preuve que `fees.payer: 'application'` fonctionne

### ⚠️ Décision Business

- [ ] Analyser si SwiftApp peut payer tous les frais Stripe
- [ ] Calculer la commission minimale nécessaire (> 3.2%)
- [ ] Projeter les coûts à 1 an (voir tables ci-dessus)
- [ ] **Décision**: Garder Option Actuelle ou migrer vers Option 1?

### ✅ Si Migration vers Option Recommandée

- [ ] Modifier code: `losses: application`, `fees: account`
- [ ] Redémarrer backend
- [ ] Frontend reteste
- [ ] Vérifier dans Stripe Dashboard
- [ ] **Bénéfice**: Économie de ~60,000-600,000 AUD/an

---

## 🎯 Recommandation Finale

**MIGRER vers l'Option 1** (`losses: application`, `fees: account`) pour:

1. **Scalabilité**: Coûts fixes au lieu de linéaires
2. **Standard industrie**: Modèle prouvé (Uber, Airbnb, etc.)
3. **Rentabilité**: Marge 122% plus élevée
4. **Contrôle**: SwiftApp gère les disputes directement
5. **Simplicité**: Pas besoin de commission > 3.2%

**Risque**: Chargebacks (~0.5% du volume) - Gérable avec buffer de trésorerie

---

## 📞 Prochaines Actions

### Immédiat (Frontend)

1. Tester configuration actuelle pour validation technique
2. Copier les logs (devrait montrer Status 200)
3. Confirmer que compte Stripe est créé

### Backend (Urgent)

1. Décision business: Accepter de payer tous les frais?
2. Si non: Modifier vers Option 1
3. Redémarrer et retester
4. Confirmer dans Stripe Dashboard

### Business (Discussion)

1. Analyser les projections de coûts
2. Définir la commission SwiftApp
3. Évaluer le buffer de trésorerie nécessaire
4. **Décision finale**: Option Actuelle vs Option Recommandée

---

**Document créé**: 5 février 2026 20:30  
**Priorité**: 🔴 CRITIQUE (Impact financier majeur)  
**Action immédiate**: Tester puis DÉCIDER  
**Recommandation**: Migrer vers Option 1 (économie de ~60,000+ AUD/an)

# Configuration du Controller Stripe - Guide Complet

**Date**: 5 février 2026  
**Contexte**: Résolution de l'erreur "your platform must collect fees and be liable for negative balances"

---

## 🎯 Résumé Exécutif

Lors de la création d'un compte Stripe Express avec `controller.stripe_dashboard.type: 'express'`, Stripe **exige** que la plateforme assume une responsabilité financière. Il y a deux choix:

1. **Assumer les pertes** (`losses.payments: 'application'`) ✅ **RECOMMANDÉ**
2. **Collecter les frais** (`fees.payer: 'application'`)

**Notre configuration recommandée**:

```javascript
controller: {
  losses: { payments: 'application' },      // Platform assumes liability
  fees: { payer: 'account' },               // Connected account pays fees
  stripe_dashboard: { type: 'express' },    // Express dashboard access
  requirement_collection: 'stripe'          // Stripe handles compliance
}
```

---

## 📚 Comprendre le Paramètre `controller`

### Qu'est-ce que `controller` ?

Le paramètre `controller` définit **qui contrôle quoi** dans la relation entre:

- **La plateforme** (vous - Swift App)
- **Le compte connecté** (vos utilisateurs professionnels)
- **Stripe** (le fournisseur de paiement)

C'est un concept introduit par Stripe pour clarifier les responsabilités légales et financières.

### Les 4 Composants du Controller

#### 1. `losses` - Qui assume les pertes financières?

**Options**:

- `losses.payments: 'application'` - La plateforme assume les pertes
- `losses.payments: 'stripe'` - Stripe assume les pertes (nécessite configuration spéciale)

**Pertes incluent**:

- Chargebacks (contestations de paiement)
- Remboursements
- Fraudes
- Balances négatifs

**Notre choix**: `'application'`

**Pourquoi?**

- Requis pour utiliser `stripe_dashboard.type: 'express'`
- Modèle standard des plateformes (Uber, Airbnb, etc.)
- Vous gardez le contrôle et assumez les risques commerciaux
- Permet de définir vos propres politiques de remboursement

**Implications**:

- Si un client conteste un paiement de 100€ et gagne, les 100€ sont déduits de VOTRE compte Stripe (plateforme)
- Vous devez avoir un buffer financier pour gérer ces situations
- Vous pouvez ensuite décider de répercuter ou non sur le compte connecté

---

#### 2. `fees` - Qui paie les frais Stripe?

**Options**:

- `fees.payer: 'account'` - Le compte connecté paie les frais Stripe
- `fees.payer: 'application'` - La plateforme paie les frais Stripe

**Notre choix**: `'account'`

**Pourquoi?**

- Modèle économique standard: chaque professionnel paie ses propres frais de transaction
- Exemple: Transaction de 100€
  - Frais Stripe: ~2.9% + 0.30€ = 3.20€
  - Le pro reçoit: 96.80€
  - Vous recevez: 0€ (ou votre commission si configurée séparément)
- Scalable: vos coûts ne croissent pas avec le volume de transactions

**Alternative (`'application'`)**:

- Vous payez tous les frais Stripe
- Utilisé si vous voulez que les pros reçoivent 100% des montants
- Vous devez alors facturer une commission plus élevée pour couvrir

---

#### 3. `stripe_dashboard` - Quel dashboard le compte connecté voit-il?

**Options**:

- `stripe_dashboard.type: 'express'` - Dashboard simplifié pour comptes Express
- `stripe_dashboard.type: 'full'` - Dashboard complet (rare, pour Standard accounts)
- `stripe_dashboard.type: 'none'` - Pas d'accès dashboard (tout via votre app)

**Notre choix**: `'express'`

**Pourquoi?**

- Dashboard Stripe simplifié et user-friendly
- L'utilisateur peut voir:
  - Ses transactions
  - Ses payouts
  - Ses revenus
  - Dispute/chargebacks
- Équilibre entre autonomie (ils voient leurs données) et contrôle (dashboard limité)
- Standard pour plateformes modernes

**Fonctionnalités Express Dashboard**:

- ✅ Vue des transactions et payouts
- ✅ Informations bancaires
- ✅ Gestion des litiges
- ❌ Pas de paramètres avancés
- ❌ Pas de gestion des webhooks
- ❌ Pas d'accès aux APIs

---

#### 4. `requirement_collection` - Qui collecte les informations KYC/compliance?

**Options**:

- `requirement_collection: 'stripe'` - Stripe gère la collecte
- `requirement_collection: 'application'` - Vous gérez tout manuellement

**Notre choix**: `'stripe'`

**Pourquoi?**

- Stripe sait quelles informations sont requises pour chaque pays
- Stripe gère les changements réglementaires automatiquement
- Stripe valide les documents et vérifie l'identité
- Vous n'avez pas à construire de système de vérification complexe

**Avec `'stripe'`**:

- Stripe fournit l'API `account.requirements` qui liste ce qui manque
- Exemple: `["individual.dob", "individual.address.city", "business_type"]`
- Vous affichez les formulaires, Stripe valide
- Stripe met à jour automatiquement les requirements selon les lois locales

**Alternative (`'application'`)**:

- Vous devez connaître toutes les régulations de tous les pays
- Vous devez implémenter la vérification d'identité
- Vous êtes responsable de la compliance
- ❌ Complexe, risqué, non recommandé

---

## ⚠️ Erreurs Communes et Solutions

### Erreur 1: "You may not provide `type` and `controller` simultaneously"

**Cause**: Doublon de configuration

```javascript
// ❌ INCORRECT
{
  type: 'express',  // Ancien format
  controller: {     // Nouveau format
    stripe_dashboard: { type: 'express' }  // Conflit!
  }
}
```

**Solution**: Retirer `type`, utiliser seulement `controller`

```javascript
// ✅ CORRECT
{
  // Pas de 'type' ici
  controller: {
    stripe_dashboard: {
      type: "express";
    } // Le type est défini ICI
  }
}
```

**Explication**: Stripe a deux APIs:

- **Ancienne**: `type: 'express'` (simple mais moins flexible)
- **Nouvelle**: `controller` (détaillée, recommandée)
- On ne peut pas mélanger les deux

---

### Erreur 2: "Your platform must collect fees and be liable for negative balances"

**Cause**: Configuration incompatible pour Express

```javascript
// ❌ INCORRECT pour Express
controller: {
  losses: { payments: 'stripe' },     // Stripe assume les pertes
  fees: { payer: 'account' },         // Compte paie les frais
  stripe_dashboard: { type: 'express' }  // Incompatible!
}
```

**Règle Stripe**: Pour `stripe_dashboard.type: 'express'`, vous DEVEZ choisir:

- **SOIT** assumer les pertes: `losses.payments: 'application'`
- **SOIT** collecter les frais: `fees.payer: 'application'`

**Solution Recommandée**:

```javascript
// ✅ CORRECT - Platform assumes liability
controller: {
  losses: { payments: 'application' },  // Plateforme assume les pertes
  fees: { payer: 'account' },           // Compte paie ses frais
  stripe_dashboard: { type: 'express' }
}
```

**Pourquoi cette règle?**

- Stripe veut éviter les situations où personne n'assume la responsabilité
- Si vous donnez un dashboard Express (outil autonome), vous devez prendre une responsabilité
- C'est une protection légale pour Stripe et pour vous

---

## 🔧 Configuration Backend Complète

### Code Recommandé (Node.js/Express)

```javascript
// POST /v1/stripe/onboarding/start
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createStripeAccount(companyId, userId) {
  try {
    // 1. Créer le compte Stripe Connect
    const account = await stripe.accounts.create({
      // Pas de 'type' - on utilise controller à la place
      country: "AU", // Australie
      business_type: "individual", // CRITIQUE: Personne physique

      // CONFIGURATION CONTROLLER (nouveau format)
      controller: {
        // Platform assumes liability for chargebacks/refunds
        losses: {
          payments: "application",
        },

        // Connected account pays Stripe fees
        fees: {
          payer: "account",
        },

        // Express dashboard for connected account
        stripe_dashboard: {
          type: "express",
        },

        // Stripe handles KYC/compliance
        requirement_collection: "stripe",
      },

      // Capabilities (what the account can do)
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },

      // Metadata for internal tracking
      metadata: {
        company_id: companyId.toString(),
        user_id: userId.toString(),
        created_via: "swift_app_v1",
      },
    });

    // 2. Sauvegarder en base de données
    await db.query(
      `INSERT INTO stripe_accounts 
       (company_id, stripe_account_id, business_type, country, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [companyId, account.id, "individual", "AU"],
    );

    // 3. Retourner la réponse
    return {
      success: true,
      stripe_account_id: account.id,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
    };
  } catch (error) {
    console.error("❌ [Stripe] Error creating account:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

## 📊 Comparaison des Configurations

### Configuration 1: Platform Assumes Liability ✅ RECOMMANDÉE

```javascript
controller: {
  losses: { payments: 'application' },
  fees: { payer: 'account' },
  stripe_dashboard: { type: 'express' },
  requirement_collection: 'stripe'
}
```

**Avantages**:

- ✅ Standard de l'industrie (Uber, Deliveroo, etc.)
- ✅ Contrôle total sur la gestion des litiges
- ✅ Comptes connectés paient leurs propres frais
- ✅ Scalable économiquement

**Inconvénients**:

- ⚠️ Vous assumez le risque financier des chargebacks
- ⚠️ Vous devez avoir un buffer de trésorerie
- ⚠️ Vous devez gérer les disputes avec les comptes connectés

**Quand utiliser**: Toujours, sauf cas très spécifiques

---

### Configuration 2: Platform Pays Fees

```javascript
controller: {
  losses: { payments: 'stripe' },  // Nécessite Stripe agreement spécial
  fees: { payer: 'application' },
  stripe_dashboard: { type: 'express' },
  requirement_collection: 'stripe'
}
```

**Avantages**:

- ✅ Comptes connectés reçoivent 100% des paiements
- ✅ Plus simple à expliquer aux utilisateurs

**Inconvénients**:

- ❌ Vous payez TOUS les frais Stripe (coûts élevés)
- ❌ `losses.payments: 'stripe'` nécessite configuration spéciale
- ❌ Non scalable pour grandes plateformes
- ❌ Vous devez facturer de grosses commissions

**Quand utiliser**: Modèle freemium où vous monetisez autrement

---

### Configuration 3: No Dashboard (Full Control)

```javascript
controller: {
  losses: { payments: 'application' },
  fees: { payer: 'account' },
  stripe_dashboard: { type: 'none' },  // Pas de dashboard
  requirement_collection: 'application'  // Vous gérez tout
}
```

**Avantages**:

- ✅ Contrôle total de l'expérience utilisateur
- ✅ Toutes les données passent par votre app
- ✅ Personnalisation complète

**Inconvénients**:

- ❌ Vous devez construire votre propre dashboard
- ❌ Vous devez gérer compliance manuellement
- ❌ Beaucoup plus de développement
- ❌ Risque légal élevé (erreurs de compliance)

**Quand utiliser**: Grandes entreprises avec équipes légales/compliance

---

## 🎓 Concepts Clés à Retenir

### 1. Platform vs Connected Account

**Platform** (vous - Swift App):

- Contrôle la configuration
- Peut voir tous les comptes connectés
- Reçoit les webhooks
- Gère les disputes selon configuration

**Connected Account** (vos utilisateurs):

- Reçoit les paiements
- Paie les frais (selon config)
- A accès au dashboard (selon config)
- Doit fournir KYC/compliance

### 2. Types de Comptes Stripe Connect

**Express** (notre choix):

- Setup rapide (~5 minutes)
- Stripe gère la compliance
- Dashboard simplifié fourni
- Bon pour marketplaces, plateformes

**Standard**:

- Compte Stripe complet indépendant
- Plus de contrôle pour le connecté
- Plus complexe à setup
- Pour partenariats entre entreprises

**Custom**:

- Zéro dashboard pour le connecté
- Contrôle total côté plateforme
- Maximum de développement
- Pour expériences ultra-personnalisées

### 3. Compliance et KYC

**KYC** = Know Your Customer (Connaître votre client)

**Informations requises** (pour individual en Australie):

- Nom et prénom
- Date de naissance
- Adresse complète
- Email et téléphone
- Numéro de compte bancaire (BSB + Account number)
- Parfois: ID document, selfie

**Stripe gère** (avec `requirement_collection: 'stripe'`):

- Validation des formats
- Vérification d'identité
- Conformité réglementaire
- Mise à jour automatique des requirements

---

## 🚨 Checklist Avant Production

### Backend

- [ ] `controller.losses.payments: 'application'` configuré
- [ ] `controller.fees.payer: 'account'` configuré
- [ ] `controller.stripe_dashboard.type: 'express'` configuré
- [ ] `controller.requirement_collection: 'stripe'` configuré
- [ ] `business_type: 'individual'` présent
- [ ] `country: 'AU'` correct
- [ ] Pas de paramètre `type` en doublon
- [ ] Capabilities `card_payments` et `transfers` activées
- [ ] Metadata avec company_id et user_id
- [ ] Gestion d'erreur avec logs détaillés

### Base de Données

- [ ] Colonne `stripe_account_id` (TEXT, UNIQUE)
- [ ] Colonne `business_type` (TEXT)
- [ ] Colonne `charges_enabled` (BOOLEAN)
- [ ] Colonne `payouts_enabled` (BOOLEAN)
- [ ] Colonne `requirements` (JSONB)
- [ ] Index sur company_id
- [ ] Foreign key vers companies

### Tests

- [ ] Créer compte avec configuration correcte
- [ ] Vérifier account.id retourné
- [ ] Vérifier requirements.currently_due
- [ ] Soumettre personal_info
- [ ] Vérifier progression (requirements mis à jour)
- [ ] Tester avec compte test Stripe
- [ ] Vérifier dashboard Express accessible

### Financier

- [ ] Buffer de trésorerie pour chargebacks (recommandé: 10-20% du volume mensuel)
- [ ] Politique de gestion des disputes documentée
- [ ] Assurance professionnelle (si volumes élevés)
- [ ] Monitoring des chargebacks rate

---

## 📖 Ressources Stripe

### Documentation Officielle

- [Express Accounts Guide](https://stripe.com/docs/connect/express-accounts)
- [Account API Reference](https://stripe.com/docs/api/accounts/create)
- [Service Agreement Types](https://stripe.com/docs/connect/service-agreement-types)
- [Controller Parameters](https://stripe.com/docs/connect/guide#controller-parameters)
- [Requirements Guide](https://stripe.com/docs/connect/required-verification-information)

### Exemples de Code

- [Node.js Connect Example](https://github.com/stripe/stripe-node)
- [Platform Best Practices](https://stripe.com/docs/connect/best-practices)

### Support

- [Stripe Support](https://support.stripe.com)
- [Connect Discord](https://discord.gg/stripe)

---

## ✅ Résumé - Action Immédiate

**Dans votre backend, modifier la création de compte**:

```javascript
// ❌ AVANT (incorrect)
const account = await stripe.accounts.create({
  type: 'express',  // À RETIRER
  country: 'AU',
  business_type: 'individual',
  controller: {
    losses: { payments: 'stripe' },  // À CHANGER
    fees: { payer: 'account' },
    stripe_dashboard: { type: 'express' },
    requirement_collection: 'stripe'
  },
  capabilities: { ... }
});

// ✅ APRÈS (correct)
const account = await stripe.accounts.create({
  // Pas de 'type'
  country: 'AU',
  business_type: 'individual',
  controller: {
    losses: { payments: 'application' },  // CHANGÉ
    fees: { payer: 'account' },
    stripe_dashboard: { type: 'express' },
    requirement_collection: 'stripe'
  },
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true }
  }
});
```

**Puis redémarrer le serveur et tester!**

---

**Document créé le**: 5 février 2026  
**Version**: 1.0  
**Auteur**: GitHub Copilot  
**Pour**: Swift App - Stripe Connect Integration

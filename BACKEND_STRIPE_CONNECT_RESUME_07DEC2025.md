# RÉSUMÉ BACKEND - Stripe Connect Express Integration
**Date:** 7 décembre 2025  
**Contexte:** Intégration Stripe Connect Express pour permettre aux utilisateurs de la plateforme de créer leurs sous-comptes Stripe  
**Utilisateur test:** Romain Giovanni (company_id: 15)

## 🎯 OBJECTIF PRINCIPAL
Remplacer les données mock/dummy par une vraie intégration Stripe Connect Express permettant aux utilisateurs de créer et gérer leurs sous-comptes Stripe sur notre plateforme.

## 📊 ÉTAT ACTUEL

### ✅ CE QUI FONCTIONNE
- **Authentification utilisateur:** ✅ Token valide (longueur: 128), utilisateur ID 15 authentifié
- **Endpoint de statut:** ✅ `GET /v1/stripe/connect/status?company_id=15` 
  - Retourne: `{"success":true,"data":{"status":"not_connected","message":"No active Stripe account found"}}`
- **Base URL:** ✅ `https://altivo.fr/swift-app/v1/` configurée correctement
- **Frontend:** ✅ Interface conditionnelle complète (écran onboarding vs écran connecté)
- **WebView:** ✅ Intégration WebView pour onboarding in-app

### ❌ PROBLÈME PRINCIPAL
**Endpoint de création de compte:** `GET /v1/stripe/connect/create-account?company_id=15`
- **Statut:** 404 Not Found
- **Impact:** Impossible de créer un compte Stripe Connect Express
- **Conséquence:** L'utilisateur reste bloqué sur l'écran d'onboarding

## 🔍 DÉTAILS TECHNIQUES

### Endpoints requis par le frontend:

#### 1. ✅ Vérification du statut (FONCTIONNE)
```http
GET /v1/stripe/connect/status?company_id={user_company_id}
```
**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "status": "not_connected" | "incomplete" | "active" | "restricted" | "pending",
    "message": "Description du statut",
    "stripe_account_id": "acct_...", // optionnel si connecté
    "details_submitted": boolean,    // optionnel
    "charges_enabled": boolean,      // optionnel
    "payouts_enabled": boolean       // optionnel
  }
}
```

#### 2. ❌ Création de compte (404 ERROR)
```http
GET /v1/stripe/connect/create-account?company_id={user_company_id}
```
**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "stripe_account_id": "acct_1234567890",
    "onboarding_url": "https://connect.stripe.com/express/setup/...",
    "expires_at": "2025-12-08T10:00:00Z"
  }
}
```

#### 3. ❓ Lien d'onboarding (NON TESTÉ)
```http
GET /v1/stripe/connect/onboarding?company_id={user_company_id}
```
**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "onboarding_url": "https://connect.stripe.com/express/setup/...",
    "expires_at": "2025-12-08T10:00:00Z"
  }
}
```

### Logique d'appel Frontend:
1. **Au chargement:** `checkStripeConnectionStatus()` → appelle `/stripe/connect/status`
2. **Si not_connected:** Affiche bouton "Connecter Stripe"
3. **Au clic:** `createStripeConnectAccount()` → appelle `/stripe/connect/create-account`
4. **Succès:** Ouvre WebView avec l'URL d'onboarding retournée

## 🚨 PROBLÈMES IDENTIFIÉS

### 1. Endpoint 404 - Création de compte
```
❌ GET /v1/stripe/connect/create-account?company_id=15 → 404 Not Found
```

**Causes possibles:**
- Endpoint pas déployé en production
- URL incorrecte côté backend (typo dans routing)
- Méthode HTTP incorrecte (GET vs POST)
- Paramètre company_id non géré
- Middleware d'authentification bloquant

### 2. Logs de debug ajoutés
```typescript
console.log('🌐 Full URL being called:', url);
// → https://altivo.fr/swift-app/v1/stripe/connect/create-account?company_id=15

console.log('🔧 ServerData.serverUrl:', ServerData.serverUrl);
// → https://altivo.fr/swift-app/v1/

console.log('🏢 Creating Stripe Connect Express account for company:', companyId);
// → 15
```

## 💡 ACTIONS REQUISES BACKEND

### 1. URGENT - Vérifier le endpoint de création
```bash
# Vérifier si l'endpoint existe en production
GET https://altivo.fr/swift-app/v1/stripe/connect/create-account?company_id=15
```

### 2. Confirmer les routes
Vérifier que ces routes sont bien configurées:
```
GET /v1/stripe/connect/create-account
GET /v1/stripe/connect/onboarding  
GET /v1/stripe/connect/status (✅ fonctionne)
```

### 3. Vérifier l'authentification
L'endpoint doit accepter les requêtes avec headers:
```
Authorization: Bearer {token_128_chars}
Content-Type: application/json
```

### 4. Paramètres requis
- `company_id` (integer) - ID de l'utilisateur/entreprise
- Méthode GET (pas POST)
- Query parameter (?company_id=X)

## 🔧 IMPLÉMENTATION STRIPE CONNECT EXPRESS

### Structure recommandée backend:

#### Création de compte:
```javascript
// POST ou GET /v1/stripe/connect/create-account
async function createStripeExpressAccount(company_id) {
  // 1. Vérifier si le compte existe déjà
  const existingAccount = await getStripeAccountByCompanyId(company_id);
  if (existingAccount) {
    return { error: "Account already exists", status: 400 };
  }
  
  // 2. Créer le compte Stripe Express
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'FR', // ou US selon le cas
    email: userEmail, // email de l'utilisateur
  });
  
  // 3. Sauvegarder en DB
  await saveStripeAccount(company_id, account.id);
  
  // 4. Générer le lien d'onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'https://votre-app.com/stripe/refresh',
    return_url: 'https://votre-app.com/stripe/success',
    type: 'account_onboarding',
  });
  
  return {
    success: true,
    data: {
      stripe_account_id: account.id,
      onboarding_url: accountLink.url,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  };
}
```

#### Statut de connexion:
```javascript
// GET /v1/stripe/connect/status
async function getStripeConnectionStatus(company_id) {
  const account = await getStripeAccountByCompanyId(company_id);
  
  if (!account || !account.stripe_account_id) {
    return {
      success: true,
      data: {
        status: "not_connected",
        message: "No active Stripe account found"
      }
    };
  }
  
  // Récupérer les détails depuis Stripe
  const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);
  
  return {
    success: true,
    data: {
      status: determineAccountStatus(stripeAccount),
      stripe_account_id: stripeAccount.id,
      details_submitted: stripeAccount.details_submitted,
      charges_enabled: stripeAccount.charges_enabled,
      payouts_enabled: stripeAccount.payouts_enabled,
      requirements: stripeAccount.requirements
    }
  };
}
```

## 🧪 TESTS REQUIS

### 1. Test endpoint création
```bash
curl -X GET "https://altivo.fr/swift-app/v1/stripe/connect/create-account?company_id=15" \
  -H "Authorization: Bearer {token_valide}" \
  -H "Content-Type: application/json"
```

### 2. Test avec company_id différent
```bash
curl -X GET "https://altivo.fr/swift-app/v1/stripe/connect/create-account?company_id=1" \
  -H "Authorization: Bearer {token_valide}"
```

### 3. Test sans authentification
```bash
curl -X GET "https://altivo.fr/swift-app/v1/stripe/connect/create-account?company_id=15"
# Doit retourner 401 Unauthorized
```

## 📱 CONTEXTE FRONTEND

### Frontend est prêt pour:
- ✅ Gestion des erreurs (404, 400, 500)
- ✅ Fallback vers mock data en cas d'échec
- ✅ WebView intégré pour onboarding
- ✅ Détection de succès/échec onboarding
- ✅ Refresh automatique du statut après onboarding

### Frontend utilise:
- `fetchWithAuth()` - Gère auth + refresh token automatique
- TypeScript strict - Types définis pour toutes les réponses
- React Native + Expo - WebView natif pour onboarding
- Error boundaries - Pas de crash en cas d'erreur API

## 🎯 PRIORITÉ 1 - ACTION IMMÉDIATE

**Vérifier pourquoi `GET /v1/stripe/connect/create-account?company_id=15` retourne 404**

Causes probables par ordre de priorité:
1. **Route manquante** - Endpoint pas défini
2. **Déploiement** - Code pas poussé en production  
3. **Typo URL** - Erreur dans la définition de route
4. **Middleware** - Authentification/CORS bloquant

Une fois ce endpoint fixé, l'intégration complète devrait fonctionner immédiatement car tout le reste est déjà en place côté frontend.

---

**Contact:** Romain Giovanni  
**Environment:** Production - https://altivo.fr/swift-app/v1/  
**User ID:** 15 (Romain)  
**Token:** Valide (128 chars)  
**Status:** Endpoint creation compte en 404 ❌
# 🔧 Stripe Onboarding - Spécifications Backend

**Date:** 2026-02-03  
**Status:** ✅ IMPLÉMENTÉ ET OPÉRATIONNEL  
**Destinataire:** Développeur Backend  
**Objectif:** Permettre la complétion du compte Stripe depuis l'app mobile

---

## ✅ STATUS: IMPLÉMENTATION TERMINÉE

**Date de Complétion:** 3 février 2026

### Endpoints Créés

- ✅ `POST /v1/stripe/connect/refresh-link` - Génère lien pour compléter profil
- ✅ `GET /v1/stripe/company/{id}/payments` - Liste des paiements d'une company
- ✅ `GET /v1/stripe/payment-links/list?company_id=X` - Corrigé pour accepter company_id

### Fonctionnalités Implémentées

- ✅ Type `account_update` pour afficher seulement champs manquants
- ✅ URLs de redirection vers l'app: `swiftapp://stripe/onboarding/success`
- ✅ JWT authentication avec company_id extraction
- ✅ Gestion erreurs 400/404/500
- ✅ Webhook `account.updated` déjà configuré

**🚀 Frontend Ready for Testing**

---

## 🎯 Contexte

Actuellement, quand un utilisateur connecte son compte Stripe, certaines informations peuvent être manquantes (numéro d'identité, date de naissance, pièce d'identité, etc.). Ces informations sont listées dans le champ `requirements.currently_due` retourné par l'API Stripe.

**Problème actuel:**

- L'app mobile détecte les paramètres manquants
- Mais ne peut pas générer de lien pour les compléter
- L'utilisateur est bloqué

**Solution:**
Créer un endpoint qui génère un **Stripe Account Link** de type `account_update`, permettant à l'utilisateur de compléter son profil via une WebView.

---

## 📋 Tâches à Réaliser

### ✅ Tâche 1: Créer Endpoint Refresh Link (CRITIQUE)

**Endpoint:**

```
POST /v1/stripe/connect/refresh-link
```

**Headers requis:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Body (optionnel):**

```json
{
  "type": "account_update"
}
```

**Réponse Success (200):**

```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/c/acct_xxx/yyy",
  "expires_at": 1738595700
}
```

**Réponse Error (404):**

```json
{
  "success": false,
  "error": "No Stripe account found for this company"
}
```

**Réponse Error (500):**

```json
{
  "success": false,
  "error": "Failed to create Stripe account link: <stripe_error_message>"
}
```

---

## 💻 Code d'Implémentation (Node.js + Stripe SDK)

### Option 1: Sans Body (Recommandé)

```javascript
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

/**
 * POST /v1/stripe/connect/refresh-link
 * Génère un nouveau lien pour compléter le profil Stripe
 * Auth: JWT token requis
 */
router.post(
  "/v1/stripe/connect/refresh-link",
  authenticateJWT,
  async (req, res) => {
    try {
      // 1. Récupérer company_id depuis le JWT token
      const { company_id } = req.user;

      if (!company_id) {
        return res.status(400).json({
          success: false,
          error: "Company ID not found in token",
        });
      }

      // 2. Récupérer le stripe_account_id depuis la DB
      const company = await db.query(
        "SELECT stripe_account_id FROM companies WHERE id = ?",
        [company_id],
      );

      if (!company || !company[0]?.stripe_account_id) {
        return res.status(404).json({
          success: false,
          error: "No Stripe account found for this company",
        });
      }

      const stripeAccountId = company[0].stripe_account_id;

      // 3. Créer un Account Link Stripe
      console.log(`[Stripe] Creating account link for ${stripeAccountId}...`);

      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: "swiftapp://stripe/onboarding/refresh", // Si user ferme/erreur
        return_url: "swiftapp://stripe/onboarding/success", // Après complétion
        type: "account_update", // ⭐ Type CRITIQUE pour complétion
      });

      console.log(`[Stripe] Account link created: ${accountLink.url}`);

      // 4. Retourner l'URL
      return res.json({
        success: true,
        url: accountLink.url,
        expires_at: accountLink.expires_at, // Timestamp Unix (expire après ~5 min)
      });
    } catch (error) {
      console.error("[Stripe] Error creating account link:", error);

      return res.status(500).json({
        success: false,
        error: `Failed to create Stripe account link: ${error.message}`,
      });
    }
  },
);

module.exports = router;
```

### Option 2: Avec Support Multiple Types

```javascript
router.post(
  "/v1/stripe/connect/refresh-link",
  authenticateJWT,
  async (req, res) => {
    try {
      const { company_id } = req.user;
      const { type = "account_update" } = req.body; // Default: account_update

      // Valider le type
      const validTypes = ["account_onboarding", "account_update"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      // ... reste du code identique

      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: "swiftapp://stripe/onboarding/refresh",
        return_url: "swiftapp://stripe/onboarding/success",
        type: type, // Utilise le type fourni
      });

      // ... suite identique
    } catch (error) {
      // ... gestion erreur
    }
  },
);
```

---

## 🔐 Sécurité & Validation

### Points Critiques

1. **Authentification JWT**
   - ✅ Vérifier que le token JWT est valide
   - ✅ Extraire `company_id` du token (pas du body!)
   - ✅ Ne jamais accepter `company_id` depuis le client

2. **Validation Company**
   - ✅ Vérifier que la company existe en DB
   - ✅ Vérifier que `stripe_account_id` n'est pas NULL
   - ✅ Vérifier que l'user a les droits sur cette company

3. **Rate Limiting**
   - ⚠️ Limiter à 5 requêtes/minute par company
   - ⚠️ Account Links expirent après 5 minutes
   - ⚠️ Éviter le spam de création de liens

4. **Logging**
   - ✅ Logger toutes les créations de liens
   - ✅ Logger les erreurs Stripe
   - ❌ NE PAS logger les URLs complètes (sensibles)

### Code de Sécurité Suggéré

```javascript
// Middleware rate limiting (exemple avec express-rate-limit)
const rateLimit = require("express-rate-limit");

const stripeLinkLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Max 5 requêtes par minute
  message: {
    success: false,
    error: "Too many requests. Please wait before trying again.",
  },
  keyGenerator: (req) => {
    // Rate limit par company_id
    return `stripe_link_${req.user.company_id}`;
  },
});

// Appliquer au endpoint
router.post(
  "/v1/stripe/connect/refresh-link",
  authenticateJWT,
  stripeLinkLimiter, // ⭐ Rate limiting
  async (req, res) => {
    // ... code du endpoint
  },
);
```

---

## 🔔 Tâche 2: Configurer Webhook (IMPORTANT)

### Pourquoi?

Quand l'utilisateur complète son profil via le lien, Stripe envoie un webhook `account.updated`. Il faut synchroniser les données en DB pour que le frontend affiche le bon statut.

### Endpoint Webhook

**URL à configurer dans Stripe Dashboard:**

```
https://altivo.fr/swift-app/v1/webhooks/stripe
```

**Events à écouter:**

- `account.updated` (CRITIQUE)
- `account.application.deauthorized` (optionnel)

### Code du Webhook Handler

```javascript
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

/**
 * POST /v1/webhooks/stripe
 * Reçoit les webhooks de Stripe
 * ⚠️ Body doit être brut (raw), pas parsé en JSON
 */
router.post(
  "/v1/webhooks/stripe",
  express.raw({ type: "application/json" }), // ⭐ Body brut pour vérif signature
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // À configurer

    let event;

    try {
      // 1. Vérifier la signature Stripe (sécurité)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error(`[Webhook] Signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 2. Traiter l'événement
    console.log(`[Webhook] Received event: ${event.type}`);

    if (event.type === "account.updated") {
      const account = event.data.object; // Stripe Account object

      try {
        // 3. Mettre à jour en DB
        await db.query(
          `UPDATE companies 
           SET charges_enabled = ?,
               payouts_enabled = ?,
               details_submitted = ?,
               requirements_currently_due = ?,
               requirements_past_due = ?,
               requirements_eventually_due = ?,
               updated_at = NOW()
           WHERE stripe_account_id = ?`,
          [
            account.charges_enabled ? 1 : 0,
            account.payouts_enabled ? 1 : 0,
            account.details_submitted ? 1 : 0,
            JSON.stringify(account.requirements.currently_due || []),
            JSON.stringify(account.requirements.past_due || []),
            JSON.stringify(account.requirements.eventually_due || []),
            account.id,
          ],
        );

        console.log(`✅ [Webhook] Account ${account.id} updated in DB`);

        // 4. (Optionnel) Notifier le frontend via push notification
        // await sendPushNotification(account.id, 'Stripe account updated');
      } catch (dbError) {
        console.error(`[Webhook] DB update failed:`, dbError);
        // NE PAS retourner 500 pour éviter retry infini
      }
    }

    // 5. Toujours retourner 200 pour dire "j'ai reçu"
    res.json({ received: true });
  },
);

module.exports = router;
```

### Configuration Stripe Dashboard

1. Aller sur: https://dashboard.stripe.com/webhooks
2. Cliquer "Add endpoint"
3. URL: `https://altivo.fr/swift-app/v1/webhooks/stripe`
4. Events: Sélectionner `account.updated`
5. Copier le "Signing secret" (whsec_xxx)
6. Ajouter à `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

---

## 🧪 Tests à Effectuer

### Test 1: Endpoint Refresh Link

**Requête:**

```bash
curl -X POST https://altivo.fr/swift-app/v1/stripe/connect/refresh-link \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

**Vérifications:**

- ✅ Retourne 200 avec `{ success: true, url: "...", expires_at: ... }`
- ✅ URL commence par `https://connect.stripe.com/setup/`
- ✅ `expires_at` est un timestamp Unix dans le futur (~5 min)
- ✅ Logs backend montrent la création du lien
- ❌ Échoue avec 401 si pas de token
- ❌ Échoue avec 404 si company n'a pas de stripe_account_id

### Test 2: Ouvrir le Lien

**Étapes:**

1. Copier l'URL retournée
2. Ouvrir dans un navigateur
3. Vérifier que la page Stripe s'affiche
4. Vérifier que SEULEMENT les champs manquants sont demandés

**Attendu:**

- ✅ Page Stripe s'ouvre
- ✅ Affiche "Complete your account" ou similaire
- ✅ Liste les champs à compléter
- ✅ Formulaire fonctionnel

### Test 3: Complétion & Redirection

**Étapes:**

1. Remplir le formulaire Stripe
2. Cliquer "Submit"
3. Vérifier la redirection

**Attendu:**

- ✅ Redirige vers `swiftapp://stripe/onboarding/success`
- ✅ Webhook `account.updated` reçu
- ✅ DB mise à jour avec nouveaux statuts
- ✅ `requirements.currently_due` réduit ou vide

### Test 4: Webhook

**Test manuel:**

```bash
# Depuis Stripe Dashboard > Webhooks > "Send test webhook"
# Sélectionner event: account.updated
```

**Vérifications:**

- ✅ Webhook reçu (status 200)
- ✅ Signature vérifiée
- ✅ DB mise à jour
- ✅ Logs montrent l'événement

---

## 📊 Structure DB Suggérée

### Table: companies

**Colonnes existantes à vérifier:**

```sql
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requirements_currently_due JSON DEFAULT '[]',
ADD COLUMN IF NOT EXISTS requirements_past_due JSON DEFAULT '[]',
ADD COLUMN IF NOT EXISTS requirements_eventually_due JSON DEFAULT '[]';
```

**Ou format texte si JSON pas supporté:**

```sql
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS requirements_currently_due TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS requirements_past_due TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS requirements_eventually_due TEXT DEFAULT '[]';
```

---

## 🔄 Endpoint Existant à Vérifier

### GET /v1/stripe/company/{id}/account

**S'assurer que la réponse inclut:**

```json
{
  "success": true,
  "companyName": "Test Company",
  "stripeAccountId": "acct_xxx",
  "status": "active",
  "account": {
    "charges_enabled": true,
    "payouts_enabled": false,
    "details_submitted": true,
    "requirements": {
      "currently_due": ["individual.id_number"],
      "past_due": [],
      "eventually_due": ["business_profile.url"],
      "disabled_reason": null
    }
  }
}
```

**Si requirements manquent:**

- Ajouter un appel Stripe pour récupérer l'account complet
- Ou stocker requirements en DB via webhook

**Code suggéré:**

```javascript
// Dans le endpoint GET account
const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);

return res.json({
  success: true,
  account: {
    charges_enabled: stripeAccount.charges_enabled,
    payouts_enabled: stripeAccount.payouts_enabled,
    details_submitted: stripeAccount.details_submitted,
    requirements: stripeAccount.requirements, // ⭐ Ajouter ça
    // ... autres champs
  },
});
```

---

## 📝 Checklist de Livraison

### Endpoint Refresh Link

- [ ] Route POST /v1/stripe/connect/refresh-link créée
- [ ] Authentification JWT vérifié
- [ ] Récupération company_id depuis token
- [ ] Validation stripe_account_id depuis DB
- [ ] Création Account Link avec type: account_update
- [ ] Retour { success, url, expires_at }
- [ ] Gestion erreurs 400/404/500
- [ ] Rate limiting configuré (5 req/min)
- [ ] Logs backend ajoutés
- [ ] Testé avec Postman/curl

### Webhook

- [ ] Route POST /v1/webhooks/stripe créée
- [ ] Body brut (raw) configuré
- [ ] Vérification signature Stripe
- [ ] Event account.updated traité
- [ ] Update DB avec nouveaux statuts
- [ ] Logs webhook ajoutés
- [ ] Endpoint configuré dans Stripe Dashboard
- [ ] STRIPE_WEBHOOK_SECRET en env
- [ ] Testé avec "Send test webhook"

### Endpoint Account (Vérification)

- [ ] GET /v1/stripe/company/{id}/account vérifié
- [ ] Champ requirements.currently_due présent
- [ ] Champ requirements.past_due présent
- [ ] Champ requirements.eventually_due présent
- [ ] Format JSON valide
- [ ] Testé avec un compte incomplet

### Base de Données

- [ ] Colonnes requirements\_\* ajoutées (ou vérifiées)
- [ ] Format JSON/TEXT validé
- [ ] Migration script fourni si nécessaire

---

## 🚀 Délai Estimé

- **Endpoint refresh-link:** 1-2 heures
- **Webhook handler:** 1-2 heures
- **Tests + debug:** 1 heure
- **Total:** 3-5 heures

---

## 📞 Contact

**Questions?**

- Frontend: Vérifier avec le dev frontend pour les URLs de redirection
- Stripe: Consulter https://stripe.com/docs/connect/enable-payment-acceptance-guide
- Bugs: Tester d'abord avec compte Stripe test mode

**Documentation Stripe:**

- Account Links: https://stripe.com/docs/api/account_links
- Webhooks: https://stripe.com/docs/webhooks
- Connect Onboarding: https://stripe.com/docs/connect/onboarding

---

**Document prêt pour implémentation** ✅  
**Version:** 1.0  
**Dernière mise à jour:** 2026-02-03

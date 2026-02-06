# 🔧 Backend Fix: Endpoint `/v1/stripe/onboarding/complete`

**Date**: 5 février 2026  
**Priorité**: 🔴 URGENT  
**Endpoint concerné**: `POST /v1/stripe/onboarding/complete`

---

## 📋 Résumé

L'endpoint `/v1/stripe/onboarding/complete` retourne actuellement **Status 200** mais **sans l'objet `account_status`**, ce qui cause un crash frontend.

**Erreur frontend observée**:



```
📡 [ONBOARDING] Response status: 200
📊 [ONBOARDING] Account status: undefined  ← PROBLÈME
❌ Error: Cannot read property 'charges_enabled' of undefined
```

---

## ✅ Ce Qui Doit Être Fait

### 1. NE PAS Envoyer `tos_acceptance` à Stripe

Avec la configuration `controller.requirement_collection: 'stripe'`, Stripe gère automatiquement l'acceptation des ToS. Envoyer `tos_acceptance` manuellement génère cette erreur:

```
You cannot accept the Terms of Service on behalf of account where
controller[requirement_collection]=stripe
```

**Solution**: Sauvegarder `tos_acceptance` uniquement en base de données (pour logs internes), puis récupérer le statut Stripe avec `stripe.accounts.retrieve()` (PAS `update()`).

### 2. Retourner l'Objet `account_status` au Frontend

Le frontend attend **obligatoirement** cet objet dans la réponse:

```javascript
{
  "success": true,
  "progress": 100,
  "account_status": {  // ← CE NOM EXACT (snake_case)
    "charges_enabled": false,
    "payouts_enabled": false,
    "details_submitted": true
  }
}
```

---

## 💻 Code à Appliquer

### Code Complet de l'Endpoint

```javascript
// POST /v1/stripe/onboarding/complete
router.post("/onboarding/complete", authenticateJWT, async (req, res) => {
  try {
    console.log("📝 [Complete] Starting completion process...", {
      user_id: req.user?.id,
      company_id: req.user?.company_id,
      tos_acceptance: req.body.tos_acceptance,
    });

    const { tos_acceptance } = req.body;

    // 1. VALIDATION: ToS doit être accepté
    if (!tos_acceptance) {
      console.log("❌ [Complete] ToS not accepted");
      return res.status(400).json({
        success: false,
        error: "Terms of service must be accepted",
      });
    }

    if (!req.user || !req.user.company_id) {
      console.log("❌ [Complete] No user or company_id");
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // 2. RÉCUPÉRER le compte Stripe de la company
    const stripeAccountQuery = await db.query(
      "SELECT * FROM stripe_accounts WHERE company_id = $1",
      [req.user.company_id],
    );

    if (!stripeAccountQuery.rows || stripeAccountQuery.rows.length === 0) {
      console.log(
        "❌ [Complete] No Stripe account found for company",
        req.user.company_id,
      );
      return res.status(404).json({
        success: false,
        error: "No Stripe account found",
      });
    }

    const stripeAccount = stripeAccountQuery.rows[0];
    const stripeAccountId = stripeAccount.stripe_account_id;

    console.log("✅ [Complete] Found Stripe account:", stripeAccountId);

    if (!stripeAccountId) {
      console.log("❌ [Complete] stripe_account_id is null/undefined");
      return res.status(400).json({
        success: false,
        error: "Stripe account ID is missing",
      });
    }

    // 3. SAUVEGARDER en BDD (pour logs internes)
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

    console.log("✅ [Complete] Updated database with ToS acceptance");

    // 4. RÉCUPÉRER le statut depuis Stripe (PAS d'update de tos_acceptance!)
    let finalAccount;
    try {
      finalAccount = await stripe.accounts.retrieve(stripeAccountId);
      console.log("✅ [Complete] Retrieved account from Stripe:", {
        id: finalAccount.id,
        details_submitted: finalAccount.details_submitted,
        charges_enabled: finalAccount.charges_enabled,
        payouts_enabled: finalAccount.payouts_enabled,
      });
    } catch (stripeError) {
      console.error("❌ [Complete] Stripe retrieve error:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        account_id: stripeAccountId,
      });

      return res.status(500).json({
        success: false,
        error: "Failed to retrieve account status from Stripe",
        details: stripeError.message,
      });
    }

    // 5. VÉRIFIER que finalAccount existe
    if (!finalAccount) {
      console.error("❌ [Complete] finalAccount is undefined after retrieve");
      return res.status(500).json({
        success: false,
        error: "Stripe account retrieve returned undefined",
      });
    }

    // 6. RETOURNER la réponse avec account_status
    const response = {
      success: true,
      progress: 100,
      account_status: {
        // ← NOM EXACT REQUIS (snake_case)
        charges_enabled: finalAccount.charges_enabled || false,
        payouts_enabled: finalAccount.payouts_enabled || false,
        details_submitted: finalAccount.details_submitted || false,
      },
    };

    console.log("✅ [Complete] Sending response:", response);

    res.json(response);
  } catch (error) {
    console.error("❌ [Complete] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});
```

---


## 🎯 Points Critiques


### 1. NE PAS Appeler `stripe.accounts.update()` avec `tos_acceptance`

❌ **À ÉVITER**:


```javascript
await stripe.accounts.update(stripeAccountId, {

  tos_acceptance: { date: ..., ip: ... }  // ← REFUSÉ par Stripe
});
```

✅ **À FAIRE**:


```javascript
await stripe.accounts.retrieve(stripeAccountId); // Juste récupérer
```



### 2. Nom de la Clé: `account_status` (snake_case)

Le frontend attend **exactement** `account_status` en snake_case:


✅ **CORRECT**:


```javascript
{
  account_status: {
    charges_enabled: false;
  }

}
```

❌ **INCORRECT**:


```javascript
{
  accountStatus: {
    chargesEnabled: false;
  }
} // camelCase refusé


```

### 3. Structure Complète Requise

Les 3 champs sont **obligatoires**:

```javascript

account_status: {
  charges_enabled: boolean,    // Requis
  payouts_enabled: boolean,    // Requis
  details_submitted: boolean   // Requis
}
```

### 4. Colonnes BDD Requises

Vérifier que ces colonnes existent dans `stripe_accounts`:

- `tos_accepted` (BOOLEAN)
- `tos_accepted_date` (TIMESTAMP)
- `tos_accepted_ip` (VARCHAR)
- `details_submitted` (BOOLEAN)
- `onboarding_completed` (BOOLEAN)


Si elles n'existent pas, les créer:

```sql
ALTER TABLE stripe_accounts
ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tos_accepted_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS tos_accepted_ip VARCHAR(45),

ADD COLUMN IF NOT EXISTS details_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
```

---

## 🧪 Tests de Validation

### 1. Test Manuel avec curl

```bash
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/complete \

  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tos_acceptance": true}' \
  | jq
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


### 2. Logs Backend Attendus

Après redémarrage du serveur et test:

```bash
pm2 logs swiftapp --lines 100 | grep "\[Complete\]"
```


**Logs attendus**:


```
📝 [Complete] Starting completion process... { user_id: 15, company_id: 2, tos_acceptance: true }
✅ [Complete] Found Stripe account: acct_1SxQAVIgxf8fuh6g
✅ [Complete] Updated database with ToS acceptance
✅ [Complete] Retrieved account from Stripe: {
  id: 'acct_1SxQAVIgxf8fuh6g',
  details_submitted: true,
  charges_enabled: fase,

  payouts_enabled: false
}
✅ [Complete] Sending response: { success: true, progress: 100, account_status: {...} }
```

### 3. Test Depuis le Frontend

1. Ouvrir l'app React Native
2. Aller sur ReviewScreen (dernière étape onboarding)
3. Cocher "J'accepte les CGU"
4. Cliquer "Activer mon compte Stripe"

**Logs frontend attendus**:

```
📡 [ONBOARDING] Response status: 200
✅ [ONBOARDING] Completed successfully, progress: 100
📊 [ONBOARDING] Account status: {"charges_enabled":false,"payouts_enabled":false,"details_submitted":true}
✅ [Review] Onboarding completed!
```

**Résultat attendu**:

- ✅ Message "Validation en cours (24-48h)"
- ✅ Navigation automatique vers StripeHub
- ✅ Aucun crash

---

## 📊 Statut du Compte Après Completion

En **mode test**, les valeurs normales sont:

```javascript
{
  details_submitted: true,      // ✅ Onboarding terminé
  charges_enabled: false,       // ⏳ En attente vérification Stripe
  payouts_enabled: false        // ⏳ En attente vérification Stripe
}
```

**C'est normal!** Stripe simule une période de validation en mode test. En production, après 24-48h de vérification, `charges_enabled` et `payouts_enabled` passeront à `true`.

---

## 🚀 Déploiement

### 1. Appliquer le Code

Remplacer le code de l'endpoint `/v1/stripe/onboarding/complete` par le code fourni ci-dessus.

### 2. Vérifier les Colonnes BDD

```sql
-- Vérifier l'existence des colonnes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stripe_accounts';

-- Si manquantes, les créer
ALTER TABLE stripe_accounts
ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tos_accepted_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS tos_accepted_ip VARCHAR(45);
```

### 3. Redémarrer le Serveur

```bash
pm2 restart siftapp

pm2 logs swiftapp --lines 50
```

### 4. Tester

Exécuter les 3 tests décrits dans la section "Tests de Validation".

---

## ✅ Checklist de Déploiement

Avant de valier le fix:


- [ ] Code de l'endpoint modifié avec le code fourni
- [ ] `stripe.accounts.update()` avec `tos_acceptance` retiré
- [ ] `stripe.accounts.retrieve()` utilisé à la place
- [ ] Objet `account_status` retourné dans la réponse
- [ ] Nom exat `account_status` (snake_case) vérifié

- [ ] Colonnes BDD `tos_accepted`, `tos_accepted_date`, `tos_accepted_ip` créées
- [ ] Serveur redémarré (`pm2 restart swiftapp`)
- [ ] Test curl effectué avec succès
- [ ] Logs backend `[Complete]` visibles et corrects
- [ ] Test frontend effectué avec succès
- [ ] Aucun crash frontend
- [ ] Navigation vers StripeHub fonctionne

---

## 🆘 En Cas de Problème

### Erreur: "o such account: acct\_..."



**Cause**: Le `stripe_account_id` en base ne correspond pas à un compte Stripe existant.

**Solution**:

```sql
-- Vérifier le compte en BDD
SELECT stripe_account_id FROM stripe_accounts WHERE company_id = 2;

-- Si invalide, supprimer et recréer
DELETE FROM stripe_accounts WHERE company_id = 2;
```

### Erreur: Column "tos_accepted" does not exist


**Cause**: Colonnes manquantes dans la table `stripe_accounts`.

**Solution**: Exécuter le script SQL fourni dans la section "Déploiement".

### Frontend reçoit toujours `account_status: undefined`

**Cause**: Le code backend n'a pas été appliqué correctement ou le serveur n'a pas redémarré.

**Solution**:

```bash
# Vérifier que le code est bien déployé
cat /path/to/stripe.routes.js | grep "account_status"

# Forcer le redémarrage
pm2 delete swiftapp
pm2 start ecosystem.config.js
```

---

## 📞 Contact

Si besoin d'aide ou de clarification sur ce fix:

- Document créé le: 5 février 2026
- Contexte: Finalisation du flow onboarding Stripe natif
- Backend: Express.js + Stripe SDK + PostgreSQL
- Frontend: React Native + Expo

---

**Ce fix complète le flow d'onboarding à 100% ! 🎉**

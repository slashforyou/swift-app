# 🔴 Debugging: "Cannot read property 'charges_enabled' of undefined"

**Date**: 5 février 2026  
**Erreur**: `Cannot read property 'charges_enabled' of undefined`  
**Étape**: POST `/v1/stripe/onboarding/complete` après correction

---

## 🔍 Cause Probable

L'erreur signifie que `finalAccount` est `undefined` quand on essaie d'accéder à `finalAccount.charges_enabled`.

**Causes possibles**:

1. ❌ `stripe.accounts.retrieve()` a levé une exception
2. ❌ `stripeAccount.stripe_account_id` est `undefined` ou `null`
3. ❌ L'objet retourné par Stripe n'a pas la structure attendue
4. ❌ Une erreur dans le try/catch non loggée

---

## ✅ Solution: Code Backend Robuste

### Code Complet Avec Gestion d'Erreurs

```javascript
// POST /v1/stripe/onboarding/complete
app.post("/v1/stripe/onboarding/complete", async (req, res) => {
  try {
    const { tos_acceptance } = req.body;

    console.log("📝 [Complete] Starting completion process...", {
      user_id: req.user?.id,
      company_id: req.user?.company_id,
      tos_acceptance,
    });

    // 1. Validation
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

    // 2. Récupérer le compte Stripe de la company
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

    // 3. Sauvegarder dans notre BDD (pour logs internes)
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

    // 4. Récupérer le statut depuis Stripe (PAS d'update!)
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

    // 5. Vérifier que finalAccount existe
    if (!finalAccount) {
      console.error("❌ [Complete] finalAccount is undefined after retrieve");
      return res.status(500).json({
        success: false,
        error: "Stripe account retrieve returned undefined",
      });
    }

    // 6. Retourner le statut
    const responseData = {
      success: true,
      progress: 100,
      account_status: {
        charges_enabled: finalAccount.charges_enabled || false,
        payouts_enabled: finalAccount.payouts_enabled || false,
        details_submitted: finalAccount.details_submitted || false,
      },
    };

    console.log("✅ [Complete] Completion successful:", responseData);

    res.json(responseData);
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

## 🔍 Points de Debug Ajoutés

### 1. Logs Détaillés à Chaque Étape

```javascript
console.log('📝 [Complete] Starting...');
console.log('✅ [Complete] Found Stripe account:', stripeAccountId);
console.log('✅ [Complete] Retrieved account from Stripe:', {...});
console.log('✅ [Complete] Completion successful:', responseData);
```

### 2. Validation de stripe_account_id

```javascript
if (!stripeAccountId) {
  console.log("❌ [Complete] stripe_account_id is null/undefined");
  return res.status(400).json({ error: "Stripe account ID is missing" });
}
```

### 3. Try/Catch Autour de stripe.accounts.retrieve()

```javascript
try {
  finalAccount = await stripe.accounts.retrieve(stripeAccountId);
} catch (stripeError) {
  console.error("❌ [Complete] Stripe retrieve error:", stripeError);
  return res.status(500).json({ error: "Failed to retrieve account" });
}
```

### 4. Vérification de finalAccount

```javascript
if (!finalAccount) {
  return res.status(500).json({ error: "Account retrieve returned undefined" });
}
```

### 5. Valeurs Par Défaut

```javascript
charges_enabled: finalAccount.charges_enabled || false,
payouts_enabled: finalAccount.payouts_enabled || false,
details_submitted: finalAccount.details_submitted || false
```

---

## 🧪 Test de Validation

### 1. Remplacer le Code Backend

Copier le code complet ci-dessus dans l'endpoint `/v1/stripe/onboarding/complete`.

### 2. Redémarrer le Serveur

```bash
pm2 restart swiftapp
pm2 logs swiftapp --lines 50
```

### 3. Tester depuis le Frontend

1. Retourner sur ReviewScreen
2. Cocher "J'accepte les CGU"
3. Cliquer "Activer mon compte"

### 4. Copier TOUS les Logs Backend

Chercher les lignes avec `[Complete]`:

```bash
pm2 logs swiftapp | grep "\[Complete\]"
```

**Logs attendus (SUCCÈS)**:

```
📝 [Complete] Starting completion process... { user_id: 1, company_id: 2, tos_acceptance: true }
✅ [Complete] Found Stripe account: acct_1SxP2gIycZQ9dbe6
✅ [Complete] Updated database with ToS acceptance
✅ [Complete] Retrieved account from Stripe: {
  id: 'acct_1SxP2gIycZQ9dbe6',
  details_submitted: true,
  charges_enabled: false,
  payouts_enabled: false
}
✅ [Complete] Completion successful: { success: true, progress: 100, account_status: {...} }
```

**Logs attendus (ERREUR)**:

```
❌ [Complete] stripe_account_id is null/undefined
// OU
❌ [Complete] Stripe retrieve error: { message: '...', type: '...', code: '...' }
// OU
❌ [Complete] finalAccount is undefined after retrieve
```

---

## 🔍 Diagnostic Selon les Logs

### Cas 1: "stripe_account_id is null/undefined"

**Problème**: La base de données ne contient pas de `stripe_account_id`.

**Solution**: Vérifier la BDD

```sql
SELECT * FROM stripe_accounts WHERE company_id = 2;
```

Si `stripe_account_id` est `NULL`:

- Le compte n'a pas été créé correctement au départ
- Supprimer et recréer:
  ```sql
  DELETE FROM stripe_accounts WHERE company_id = 2;
  ```
- Recommencer depuis l'étape "Activer Stripe"

### Cas 2: "Stripe retrieve error"

**Problème**: L'account ID existe mais Stripe ne le trouve pas.

**Logs à chercher**:

```
❌ [Complete] Stripe retrieve error: {
  message: 'No such account: acct_...',
  type: 'StripeInvalidRequestError',
  code: 'resource_missing'
}
```

**Solutions possibles**:

1. L'account a été supprimé dans Stripe Dashboard
2. L'account ID est corrompu dans la BDD
3. Mauvaise clé API Stripe (test vs prod)

**Actions**:

```bash
# Vérifier la clé API utilisée
echo $STRIPE_SECRET_KEY

# Tester manuellement avec curl
curl https://api.stripe.com/v1/accounts/acct_1SxP2gIycZQ9dbe6 \
  -u sk_test_...:
```

### Cas 3: "finalAccount is undefined after retrieve"

**Problème**: `stripe.accounts.retrieve()` n'a pas levé d'erreur mais a retourné `undefined`.

**C'est très rare** - normalement Stripe lève une exception si ça échoue.

**Action**: Ajouter un log avant le retrieve:

```javascript
console.log("🔍 [Complete] About to retrieve account:", stripeAccountId);
console.log("🔍 [Complete] Stripe client configured:", !!stripe);
```

### Cas 4: Aucun Log "[Complete]"

**Problème**: L'endpoint n'est pas appelé du tout.

**Solutions**:

1. Vérifier que le serveur a bien redémarré
2. Vérifier l'URL dans le frontend (ServerData.serverUrl)
3. Vérifier l'authentification (JWT token)

---

## 📋 Checklist de Résolution

### Backend

- [ ] Code complet copié dans l'endpoint
- [ ] Serveur redémarré (pm2 restart)
- [ ] Clé Stripe API configurée (STRIPE_SECRET_KEY)
- [ ] Logs visibles (pm2 logs swiftapp)

### Base de Données

- [ ] Table `stripe_accounts` existe
- [ ] Colonne `stripe_account_id` existe et n'est pas NULL
- [ ] Requête SQL fonctionne:
  ```sql
  SELECT stripe_account_id FROM stripe_accounts WHERE company_id = 2;
  ```

### Frontend (Aucun Changement)

- [x] ReviewScreen appelle completeOnboarding(true)
- [x] StripeService envoie tos_acceptance: true
- [ ] Doit recevoir Status 200 après fix backend

---

## 🚀 Prochaine Action

**IMMÉDIAT**:

1. **Appliquer le code backend complet** (ci-dessus avec tous les try/catch)
2. **Redémarrer le serveur**: `pm2 restart swiftapp`
3. **Tester depuis ReviewScreen** (cocher CGU + cliquer Activer)
4. **Copier TOUS les logs backend** qui contiennent `[Complete]`
5. **Me les envoyer** pour diagnostic précis

---

**Document créé**: 5 février 2026 21:30  
**Priorité**: 🔴 CRITIQUE - Dernière étape bloquée  
**Action requise**: Copier logs backend complets après test

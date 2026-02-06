# 🔴 Erreur: Terms of Service Not Accepted - Fix Backend

**Date**: 5 février 2026 20:50  
**Erreur**: "Terms of service must be accepted"  
**Étape**: POST `/v1/stripe/onboarding/complete`

---

## 🔍 Analyse du Problème

### Ce Que le Frontend Envoie (Correct)

```json
{
  "tos_acceptance": true
}
```

Le frontend envoie bien `true` pour indiquer que l'utilisateur a coché la case.

---

### Ce Que Stripe Exige (Format Spécifique)

Stripe ne veut pas juste `true`, il veut un **objet** avec:

1. **date**: Timestamp Unix (secondes, pas millisecondes)
2. **ip**: Adresse IP de l'utilisateur

**Format requis par Stripe**:

```javascript
tos_acceptance: {
  date: 1738788000,  // Timestamp Unix en secondes
  ip: "192.168.1.1"   // IP du client
}
```

---

## ✅ Solution Backend

### Code à Modifier

**Fichier**: Probablement `stripe-controller.js` ou `onboarding-routes.js`

**Endpoint**: `POST /v1/stripe/onboarding/complete`

### ❌ Code Actuel (Incorrect)

```javascript
// POST /v1/stripe/onboarding/complete
app.post("/v1/stripe/onboarding/complete", async (req, res) => {
  const { tos_acceptance } = req.body;

  // ❌ ERREUR: On envoie directement le boolean à Stripe
  const account = await stripe.accounts.update(stripeAccountId, {
    tos_acceptance: tos_acceptance, // ❌ Stripe refuse ce format
  });

  res.json({ success: true });
});
```

### ✅ Code Corrigé

```javascript
// POST /v1/stripe/onboarding/complete
app.post("/v1/stripe/onboarding/complete", async (req, res) => {
  const { tos_acceptance } = req.body;

  // Validation
  if (!tos_acceptance) {
    return res.status(400).json({
      success: false,
      error: "Terms of service must be accepted",
    });
  }

  // ✅ CORRECT: Créer l'objet tos_acceptance pour Stripe
  const tosAcceptanceData = {
    date: Math.floor(Date.now() / 1000), // Timestamp Unix en secondes
    ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1", // IP du client
  };

  try {
    // Récupérer le stripe_account_id de la company
    const stripeAccount = await getStripeAccountForCompany(req.user.company_id);

    if (!stripeAccount) {
      return res.status(404).json({
        success: false,
        error: "No Stripe account found",
      });
    }

    // Mettre à jour le compte avec ToS acceptance
    const updatedAccount = await stripe.accounts.update(
      stripeAccount.stripe_account_id,
      {
        tos_acceptance: tosAcceptanceData, // ✅ Format correct
      },
    );

    // Mettre à jour la BDD
    await db.query(
      `UPDATE stripe_accounts 
       SET tos_accepted = true, 
           tos_accepted_date = NOW(), 
           tos_accepted_ip = $1,
           details_submitted = true,
           onboarding_completed = true
       WHERE stripe_account_id = $2`,
      [tosAcceptanceData.ip, stripeAccount.stripe_account_id],
    );

    // Récupérer le statut final
    const finalAccount = await stripe.accounts.retrieve(
      stripeAccount.stripe_account_id,
    );

    res.json({
      success: true,
      progress: 100,
      account_status: {
        charges_enabled: finalAccount.charges_enabled,
        payouts_enabled: finalAccount.payouts_enabled,
        details_submitted: finalAccount.details_submitted,
      },
    });
  } catch (error) {
    console.error("❌ [Complete] Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

---

## 📋 Points Importants

### 1. Timestamp Unix

**Correct**:

```javascript
const timestamp = Math.floor(Date.now() / 1000); // Secondes
```

**Incorrect**:

```javascript
const timestamp = Date.now(); // ❌ Millisecondes (Stripe refuse)
```

### 2. Adresse IP

**Ordre de priorité**:

```javascript
const ip =
  req.ip || // IP directe
  req.headers["x-forwarded-for"] || // IP derrière proxy
  req.connection.remoteAddress || // IP connexion
  "127.0.0.1"; // Fallback
```

**Format attendu**: `"192.168.1.1"` (string, pas d'objet)

### 3. Validation Stripe

Après l'update, Stripe peut retourner:

```javascript
{
  charges_enabled: false,   // Pas encore activé
  payouts_enabled: false,   // Pas encore activé
  details_submitted: true   // ✅ Complet, en attente de vérification
}
```

C'est **normal** en mode test. Le compte sera en "pending_verification" pendant ~1-2 jours en production.

---

## 🧪 Test de Validation

### 1. Modifier le Code Backend

Appliquer la correction ci-dessus.

### 2. Redémarrer le Serveur

```bash
pm2 restart swiftapp
# Ou
systemctl restart swiftapp
```

### 3. Tester depuis le Frontend

L'utilisateur doit:

1. Retourner sur ReviewScreen
2. Cocher "J'accepte les CGU"
3. Cliquer "Activer mon compte"

**Logs attendus**:

```
🎉 [Review] Completing onboarding...
🎉 [ONBOARDING] Completing onboarding...
📡 [ONBOARDING] Response status: 200
✅ [ONBOARDING] Completed successfully, progress: 100
📊 Account Status: { charges_enabled: false, payouts_enabled: false, details_submitted: true }
```

**Résultat attendu**:

- ✅ Status 200
- ✅ Message "Validation en cours (24-48h)"
- ✅ Navigation vers StripeHub
- ✅ Compte visible dans StripeHub avec status "En attente de vérification"

---

## 📊 Détails de l'Objet tos_acceptance

### Format Complet (Stripe API)

```javascript
tos_acceptance: {
  date: 1738788000,           // REQUIS: Timestamp Unix (secondes)
  ip: "192.168.1.1",          // REQUIS: IP du client
  user_agent: "Mozilla/5.0"   // OPTIONNEL: User agent du navigateur
}
```

**Champs requis**: `date` et `ip`  
**Champ optionnel**: `user_agent`

### Exemple Complet avec User Agent

```javascript
const tosAcceptanceData = {
  date: Math.floor(Date.now() / 1000),
  ip: req.ip || "127.0.0.1",
  user_agent: req.headers["user-agent"] || "Unknown",
};
```

---

## 🔧 Ajouts BDD Recommandés

### Table stripe_accounts

Si ce n'est pas déjà fait, ajouter ces colonnes:

```sql
ALTER TABLE stripe_accounts
ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tos_accepted_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS tos_accepted_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
```

### Index Recommandés

```sql
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_onboarding_status
ON stripe_accounts(company_id, onboarding_completed);
```

---

## 📖 Documentation Stripe

**Référence officielle**:

- https://stripe.com/docs/api/accounts/update#update_account-tos_acceptance
- https://stripe.com/docs/connect/service-agreement-types

**Extrait de la doc**:

> The tos_acceptance object must include the following fields:
>
> - `date` (integer): The Unix timestamp marking when the account representative accepted the service agreement.
> - `ip` (string): The IP address from which the account representative accepted the service agreement.

---

## ✅ Checklist Validation

### Backend

- [ ] Code modifié pour créer l'objet `tos_acceptance`
- [ ] Timestamp en secondes (pas millisecondes)
- [ ] IP récupérée depuis `req.ip` ou headers
- [ ] Serveur redémarré
- [ ] Logs backend affichent l'objet envoyé à Stripe

### Base de Données

- [ ] Colonnes `tos_accepted`, `tos_accepted_date`, `tos_accepted_ip` créées
- [ ] Update SQL dans le endpoint `/complete`

### Frontend (Ne Rien Changer)

- [x] Envoie `tos_acceptance: true` ✅ (déjà correct)
- [ ] Doit recevoir Status 200 après le fix backend

---

## 🚨 Erreurs Courantes

### Erreur 1: "Invalid timestamp"

**Cause**: Date en millisecondes au lieu de secondes  
**Solution**: Utiliser `Math.floor(Date.now() / 1000)`

### Erreur 2: "IP address required"

**Cause**: IP = undefined ou null  
**Solution**: Toujours avoir un fallback `|| '127.0.0.1'`

### Erreur 3: "Account already onboarded"

**Cause**: ToS déjà acceptés pour ce compte  
**Solution**: Normal si on re-teste. Supprimer le compte et recréer.

---

## 💬 Message pour le Frontend

Une fois le backend corrigé:

> **Le backend a corrigé le format de `tos_acceptance`.**  
> Retournez sur ReviewScreen, cochez "J'accepte les CGU", et cliquez "Activer".  
> Vous devriez voir Status 200 et le message "Validation en cours".

---

**Document créé**: 5 février 2026 20:50  
**Priorité**: 🔴 BLOQUANT  
**Impact**: Flow onboarding à 90% (bloqué à la dernière étape)  
**Action requise**: Backend doit formater `tos_acceptance` selon spec Stripe

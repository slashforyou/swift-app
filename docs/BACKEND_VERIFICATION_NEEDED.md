# 🚨 Backend Verification Required - URGENT

**Date**: 5 février 2026 20:20  
**Status**: ❌ Configuration NON appliquée  
**Evidence**: Logs frontend montrent erreur identique

---

## 🔴 Problème Confirmé

### Erreur Actuelle (8:20 PM)

```
❌ Error: "When `stripe_dashboard[type]=express`, your platform must
collect fees and be liable for negative balances or refunds and chargebacks."
```

**Cette erreur signifie**: Le paramètre `losses.payments` est toujours à `'stripe'` au lieu de `'application'`.

---

## ✅ Ce Qui Devrait Être Appliqué

**Fichier backend** (probablement `stripe-controller.js` ou similaire):

```javascript
// POST /v1/stripe/onboarding/start
const account = await stripe.accounts.create({
  country: "AU",
  business_type: "individual",

  controller: {
    losses: {
      payments: "application", // ← CETTE LIGNE CRITIQUE
    },
    fees: {
      payer: "account",
    },
    stripe_dashboard: {
      type: "express",
    },
    requirement_collection: "stripe",
  },

  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});
```

---

## 🔍 Checklist de Vérification Backend

### 1. Vérifier le Code Source

```bash
# Trouver le fichier de création de compte Stripe
grep -r "stripe.accounts.create" /srv/www/htdocs/swiftapp/

# Vérifier la configuration controller
grep -A 15 "controller:" /path/to/fichier/stripe.js

# Le résultat DOIT montrer:
# losses: {
#   payments: 'application'  ← PAS 'stripe'
# }
```

**Attendu**:

```javascript
controller: {
  losses: { payments: 'application' },  // ✅
  fees: { payer: 'account' },
  stripe_dashboard: { type: 'express' },
  requirement_collection: 'stripe'
}
```

**Si vous voyez**:

```javascript
controller: {
  losses: { payments: 'stripe' },  // ❌ PROBLÈME ICI
  fees: { payer: 'account' },
  ...
}
```

➜ **Le code n'a pas été modifié correctement**

---

### 2. Vérifier les Processus en Cours

```bash
# Option 1: PM2
pm2 list
pm2 logs swiftapp --lines 20

# Option 2: Systemd
systemctl status swiftapp
journalctl -u swi ftapp -n 50

# Option 3: Processus manuel
ps aux | grep node | grep swift
```

**Questions**:

- Le processus a-t-il été redémarré après la modification?
- Quelle est l'heure de démarrage du processus?
- Y a-t-il plusieurs instances qui tournent?

---

### 3. Forcer un Redémarrage Complet

```bash
# PM2
pm2 restart swiftapp
pm2 logs swiftapp

# Systemd
sudo systemctl restart swiftapp
sudo systemctl status swiftapp

# Manuel (si lancé avec node)
pkill -f "node.*swiftapp"
cd /srv/www/htdocs/swiftapp/server
node index.js &
```

**Après redémarrage**, vérifier les logs:

```bash
tail -f /var/log/swiftapp.log | grep -i stripe
# Ou
pm2 logs swiftapp --lines 50
```

---

### 4. Tester Directement avec cURL

```bash
# Test de création de compte (devrait réussir maintenant)
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/start \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json"
```

**Résultat attendu si FIX appliqué**:

```json
{
  "success": true,
  "stripe_account_id": "acct_1Sxxxxxxxx",
  "status": "incomplete",
  "progress": 0
}
```

**Résultat si TOUJOURS pas fixé**:

```json
{
  "success": false,
  "error": "When `stripe_dashboard[type]=express`, your platform must..."
}
```

---

## 🎯 Actions Immédiates Requises

### Action 1: Localiser le Fichier

```bash
# Chercher où est la création de compte
find /srv/www/htdocs/swiftapp -name "*.js" -type f -exec grep -l "stripe.accounts.create" {} \;
```

**Fichiers possibles**:

- `/srv/www/htdocs/swiftapp/server/controllers/stripe.js`
- `/srv/www/htdocs/swiftapp/server/routes/stripe.js`
- `/srv/www/htdocs/swiftapp/server/services/stripe-service.js`

### Action 2: Éditer et Vérifier

```bash
# Ouvrir le fichier trouvé
nano /path/to/fichier.js

# Chercher "controller:"
# Modifier "losses: { payments: 'stripe' }"
# En "losses: { payments: 'application' }"

# Sauvegarder avec Ctrl+O, quitter avec Ctrl+X
```

### Action 3: Redémarrer OBLIGATOIRE

```bash
# Avec PM2
pm2 restart swiftapp
pm2 save

# Avec Systemd
sudo systemctl restart swiftapp

# Vérifier que c'est bien redémarré
pm2 status
# Ou
systemctl status swiftapp
```

### Action 4: Confirmer le Fix

```bash
# Test immédiat avec curl
curl -X POST https://altivo.fr/swift-app/v1/stripe/onboarding/start \
  -H "Authorization: Bearer TOKEN_VALIDE" \
  -v
```

---

## 📊 Comparaison Avant/Après

### ❌ AVANT (Actuel - 20:20)

```javascript
// Code backend
controller: {
  losses: { payments: 'stripe' },  // ❌
  ...
}

// Résultat frontend
❌ Error: "platform must collect fees and be liable..."
Status: 500
```

### ✅ APRÈS (Attendu)

```javascript
// Code backend
controller: {
  losses: { payments: 'application' },  // ✅
  ...
}

// Résultat frontend
✅ Response status: 200
stripe_account_id: "acct_1Sxxxxxxxx"
Navigation vers WelcomeScreen
```

---

## 🔧 Si le Problème Persiste

### Vérification Stripe Dashboard

1. Aller sur https://dashboard.stripe.com/test/connect/accounts
2. Cliquer sur le dernier compte créé
3. Vérifier dans "Account settings" → "Controller":
   - `losses.payments` devrait être `application`
   - Si c'est `stripe`, le code backend n'est pas appliqué

### Logs Backend Détaillés

Ajouter des logs avant la création:

```javascript
console.log("🔍 [STRIPE CREATE] Configuration:", {
  losses_payments: "application",
  fees_payer: "account",
  stripe_dashboard_type: "express",
});

const account = await stripe.accounts.create({
  // ... config
});

console.log("✅ [STRIPE CREATE] Account created:", account.id);
```

---

## 📞 Message pour le Backend

**Subject**: URGENT - Configuration Stripe NON appliquée

**Body**:

```
Les logs frontend de 20:20 montrent que l'erreur persiste:

❌ "When `stripe_dashboard[type]=express`, your platform must
collect fees and be liable for negative balances..."

Cela signifie que `losses.payments` est toujours à 'stripe'
et non 'application'.

Actions nécessaires:
1. Vérifier que le code source a bien été modifié
2. Localiser le fichier avec stripe.accounts.create
3. Confirmer que losses.payments = 'application'
4. Redémarrer le serveur (PM2/systemd)
5. Tester avec curl

Le document que vous avez envoyé dit que c'est corrigé,
mais les appels API prouvent que non.

Urgent car le frontend attend et tous les tests sont bloqués.
```

---

## ⏱️ Timeline

| Heure | Événement                                |
| ----- | ---------------------------------------- |
| 19:53 | Backend envoie doc "Production Ready ✅" |
| 19:55 | Frontend recharge l'app                  |
| 20:20 | **Test échoue - même erreur**            |
| 20:20 | **Preuve: config PAS appliquée**         |

**Temps perdu**: 27 minutes  
**Blocage**: Total - impossible de tester le flow

---

## ✅ Confirmation du Fix

Une fois le fix appliqué, vous verrez dans les logs frontend:

```
✅ [ONBOARDING] Response status: 200
✅ [ONBOARDING] Started successfully: acct_1Sxxxxxxxx
🎉 [NAVIGATION] Going to WelcomeScreen
```

**Pas avant.**

---

**Document créé**: 5 février 2026 20:20  
**Priorité**: 🚨 URGENT  
**Blocage**: Total  
**Action requise**: Vérification + Restart backend immédiat

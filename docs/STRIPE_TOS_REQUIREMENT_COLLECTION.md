# 🔴 Erreur: Cannot Accept ToS with requirement_collection=stripe

**Date**: 5 février 2026 21:00  
**Erreur**: "You cannot accept the Terms of Service on behalf of account where `controller[requirement_collection]=stripe`"  
**Étape**: POST `/v1/stripe/onboarding/verify`

> Note (12/02/2026): ce document décrit un incident historique. Le contrat frontend actuel est Custom-only et utilise `POST /v1/stripe/onboarding/verify` comme étape finale.

---

## 🔍 Analyse du Problème

### Erreur Complète

```
You cannot accept the Terms of Service on behalf of account where
`controller[requirement_collection]=stripe`, which includes Standard
and Express accounts.
```

### Traduction

**Stripe dit**: "Tu ne peux PAS accepter les ToS au nom du compte car tu as configuré `controller.requirement_collection: 'stripe'`, ce qui veut dire que **c'est moi (Stripe) qui gère ça**."

---

## 💡 Explication

### Notre Configuration (Rappel)

```javascript
controller: {
  losses: { payments: 'application' },
  fees: { payer: 'application' },
  stripe_dashboard: { type: 'express' },
  requirement_collection: 'stripe'  // ← LE PROBLÈME EST ICI
}
```

### Ce Que Signifie `requirement_collection: 'stripe'`

Quand on met `'stripe'`, on dit à Stripe:

- ✅ **TU** (Stripe) collectes les informations KYC
- ✅ **TU** (Stripe) valides les documents
- ✅ **TU** (Stripe) gères l'acceptation des Terms of Service
- ✅ **TU** (Stripe) détermines quand le compte est complet

**Conséquence**: On ne peut PAS envoyer `tos_acceptance` manuellement, car Stripe le gère automatiquement!

---

## ✅ Solution: NE PAS Envoyer tos_acceptance à Stripe

### ❌ Code Précédent (Incorrect)

```javascript
// POST /v1/stripe/onboarding/verify
app.post("/v1/stripe/onboarding/verify", async (req, res) => {
  const { tos_acceptance } = req.body;

  // ❌ ERREUR: On essaie d'envoyer tos_acceptance à Stripe
  const tosAcceptanceData = {
    date: Math.floor(Date.now() / 1000),
    ip: req.ip || "127.0.0.1",
  };

  const updatedAccount = await stripe.accounts.update(stripeAccountId, {
    tos_acceptance: tosAcceptanceData, // ❌ Stripe REFUSE car requirement_collection=stripe
  });
});
```

### ✅ Code Correct

```javascript
// POST /v1/stripe/onboarding/verify
app.post("/v1/stripe/onboarding/verify", async (req, res) => {
  const { tos_acceptance } = req.body;

  // Validation côté frontend (pour l'UX)
  if (!tos_acceptance) {
    return res.status(400).json({
      success: false,
      error: "Terms of service must be accepted",
    });
  }

  try {
    // Récupérer le stripe_account_id de la company
    const stripeAccount = await getStripeAccountForCompany(req.user.company_id);

    if (!stripeAccount) {
      return res.status(404).json({
        success: false,
        error: "No Stripe account found",
      });
    }

    // ✅ SEULEMENT sauvegarder en BDD (pour logs internes)
    await db.query(
      `UPDATE stripe_accounts 
       SET tos_accepted = true, 
           tos_accepted_date = NOW(), 
           tos_accepted_ip = $1,
           details_submitted = true,
           onboarding_completed = true
       WHERE stripe_account_id = $2`,
      [req.ip || "127.0.0.1", stripeAccount.stripe_account_id],
    );

    // ✅ RÉCUPÉRER le statut Stripe (PAS d'update de tos_acceptance!)
    const finalAccount = await stripe.accounts.retrieve(
      stripeAccount.stripe_account_id,
    );

    console.log("✅ [Complete] Account status:", {
      details_submitted: finalAccount.details_submitted,
      charges_enabled: finalAccount.charges_enabled,
      payouts_enabled: finalAccount.payouts_enabled,
    });

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

## 📋 Points Clés

### 1. Stripe Gère Automatiquement les ToS

Quand `requirement_collection: 'stripe'`:

- Stripe **accepte automatiquement** les ToS quand toutes les informations sont soumises
- Le champ `details_submitted` passe à `true` automatiquement
- **Aucune action manuelle nécessaire** pour `tos_acceptance`

### 2. La Checkbox Frontend Reste Utile

Elle sert pour:

- ✅ **UX**: L'utilisateur doit consciemment accepter
- ✅ **Légal**: Preuve côté app que l'utilisateur a consenti
- ✅ **Logs**: Sauvegarder date/IP dans notre BDD

**Mais elle n'est PAS envoyée à Stripe!**

### 3. Flux Complet

```
1. Frontend: Utilisateur coche "J'accepte les CGU"
2. Frontend: Envoie tos_acceptance=true au backend
3. Backend: Valide que tos_acceptance=true (sinon erreur 400)
4. Backend: Sauvegarde en BDD (tos_accepted=true, date, IP)
5. Backend: Récupère le statut Stripe (retrieve, pas update!)
6. Backend: Retourne le statut au frontend
7. Stripe: Gère automatiquement la validation finale
```

---

## 🔄 Alternative: requirement_collection='application'

Si on voulait gérer nous-mêmes les ToS (déconseillé):

```javascript
// Configuration alternative (NON RECOMMANDÉE)
controller: {
  losses: { payments: 'application' },
  fees: { payer: 'application' },
  stripe_dashboard: { type: 'express' },
  requirement_collection: 'application'  // ← On gère tout nous-mêmes
}
```

**Avec `'application'`**:

- ✅ On peut envoyer `tos_acceptance` manuellement
- ❌ On doit gérer TOUTE la compliance (KYC, vérifications, etc.)
- ❌ On doit suivre les lois de chaque pays
- ❌ Beaucoup plus compliqué
- ❌ Risque légal élevé

**Recommandation**: Garder `requirement_collection: 'stripe'` ✅

---

## 🧪 Test de Validation

### 1. Modifier le Code Backend

Appliquer la correction ci-dessus (ne PAS envoyer tos_acceptance à Stripe).

### 2. Redémarrer le Serveur

```bash
pm2 restart swiftapp
# Ou
systemctl restart swiftapp
```

### 3. Tester depuis le Frontend

1. Retourner sur ReviewScreen
2. Cocher "J'accepte les CGU"
3. Cliquer "Activer mon compte"

**Logs attendus**:

```
✅ [Complete] Account status: {
  details_submitted: true,
  charges_enabled: false,
  payouts_enabled: false
}
📡 [ONBOARDING] Response status: 200
✅ [ONBOARDING] Completed successfully, progress: 100
```

**Résultat attendu**:

- ✅ Status 200
- ✅ `details_submitted: true`
- ✅ Message "Validation en cours (24-48h)"
- ✅ Navigation vers StripeHub
- ✅ Compte visible avec status "pending_verification"

---

## 📊 États du Compte Après Completion

### En Mode Test

```javascript
{
  details_submitted: true,      // ✅ Formulaire complet
  charges_enabled: false,       // ⏳ En attente vérification
  payouts_enabled: false,       // ⏳ En attente vérification
  requirements: {
    currently_due: [],          // ✅ Rien de manquant
    eventually_due: [],
    past_due: [],
    disabled_reason: 'pending_verification'
  }
}
```

**C'est normal!** En mode test, Stripe simule la période de vérification.

### En Production

Après 24-48h, Stripe met à jour:

```javascript
{
  details_submitted: true,
  charges_enabled: true,   // ✅ Activé
  payouts_enabled: true,   // ✅ Activé
  requirements: {
    disabled_reason: null  // ✅ Aucune restriction
  }
}
```

---

## 📖 Documentation Stripe

**Référence officielle**:

- https://stripe.com/docs/connect/required-verification-information
- https://stripe.com/docs/api/accounts/object#account_object-requirements

**Extrait**:

> When `controller.requirement_collection` is set to `stripe`, Stripe automatically
> manages the collection of required information and acceptance of the
> Stripe Services Agreement. You should not manually update `tos_acceptance`.

---

## ✅ Checklist Validation

### Backend

- [ ] Code modifié pour NE PAS envoyer `tos_acceptance` à Stripe
- [ ] Validation que `tos_acceptance=true` dans le body (400 si false)
- [ ] Sauvegarde en BDD (tos_accepted, date, IP)
- [ ] `stripe.accounts.retrieve()` utilisé (PAS update!)
- [ ] Serveur redémarré

### Base de Données

- [ ] Colonnes `tos_accepted`, `tos_accepted_date`, `tos_accepted_ip` existent
- [ ] UPDATE SQL fonctionne

### Frontend (Aucun Changement)

- [x] Checkbox ToS visible ✅
- [x] Envoie `tos_acceptance: true` ✅
- [ ] Doit recevoir Status 200 après fix backend

---

## 🚨 Erreurs Résolues

### ❌ Erreur 1: "Cannot accept ToS with requirement_collection=stripe"

**Cause**: On envoyait `tos_acceptance` à Stripe  
**Solution**: Ne PAS envoyer, Stripe gère automatiquement ✅

### ❌ Erreur 2: "Terms of service must be accepted"

**Cause**: Frontend n'envoyait pas `tos_acceptance`  
**Solution**: Frontend envoie maintenant `true` ✅

---

## 💡 Résumé Final

### Ce Qu'on Fait

1. ✅ Backend valide que `tos_acceptance=true` (côté app)
2. ✅ Backend sauvegarde en BDD (logs internes)
3. ✅ Backend récupère le statut Stripe (retrieve)
4. ✅ Backend retourne le statut au frontend
5. ✅ Stripe gère automatiquement la validation finale

### Ce Qu'on Ne Fait PAS

1. ❌ Envoyer `tos_acceptance` à Stripe (refusé)
2. ❌ Appeler `stripe.accounts.update()` avec ToS

---

## 💬 Message pour le Frontend

Une fois le backend corrigé:

> **Le backend a retiré l'envoi de `tos_acceptance` à Stripe.**  
> Stripe gère ça automatiquement car `requirement_collection: 'stripe'`.
>
> Retournez sur ReviewScreen, cochez "J'accepte les CGU", et cliquez "Activer".  
> Vous devriez voir Status 200 et le message "Validation en cours".

---

**Document créé**: 5 février 2026 21:00  
**Priorité**: 🟢 SOLUTION TROUVÉE  
**Impact**: Flow onboarding prêt à être finalisé  
**Action requise**: Backend doit retirer l'envoi de tos_acceptance à Stripe

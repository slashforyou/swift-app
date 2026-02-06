# 🧪 Guide de Test - Stripe Onboarding Frontend

**Date:** 2026-02-03  
**Version:** 1.0  
**Status:** Prêt pour tests

---

## 🎯 Objectif

Tester la nouvelle fonctionnalité d'affichage et de complétion des paramètres Stripe manquants depuis l'app mobile.

---

## ✅ Prérequis

### Frontend

- [x] Code implémenté et sans erreurs TypeScript
- [x] App compilée et déployée sur device/simulator
- [x] User connecté avec compte Stripe

### Backend

- [ ] **BLOQUANT:** Endpoint `POST /v1/stripe/connect/refresh-link` créé
- [ ] **OPTIONNEL:** Webhook `account.updated` configuré
- [ ] Compte Stripe test mode avec requirements

---

## 📝 Scénarios de Test

### Test 1: Affichage Badge de Statut

**Objectif:** Vérifier que le badge de statut s'affiche correctement selon l'état du compte

**Étapes:**

1. Ouvrir l'app
2. Naviguer vers Business > Stripe Hub
3. Observer le badge en haut à droite

**Résultats Attendus:**

| État du Compte                                                                    | Badge Attendu       |
| --------------------------------------------------------------------------------- | ------------------- |
| `charges_enabled=true`, `payouts_enabled=true`, `currently_due=[]`, `past_due=[]` | 🟢 "Compte vérifié" |
| `details_submitted=true`, `currently_due=[...]`                                   | 🟡 "En attente"     |
| `past_due=[...]`                                                                  | 🔴 "Action requise" |
| `details_submitted=false`                                                         | ⚪ "Incomplet"      |

**✅ Test Réussi Si:**

- Badge affiche la bonne couleur
- Texte est traduit (FR/EN selon langue)
- Icône correspond à l'état

---

### Test 2: Affichage Requirements (Compte Incomplet)

**Objectif:** Vérifier que les paramètres manquants s'affichent avec labels en français

**Prérequis:**

- Compte Stripe avec `requirements.currently_due` non vide

**Étapes:**

1. Ouvrir StripeHub
2. Scroll vers "Account Information"
3. Observer l'encadré d'alerte (orange ou rouge)

**Résultats Attendus:**

```
⚠️ Informations manquantes    (ou "Action urgente requise" si past_due)

🔴 Numéro d'identité          (si past_due)
🔴 Compte bancaire

🟡 Date de naissance           (si currently_due)
🟡 Site web de l'entreprise

+2 autres paramètres           (si > 3 requirements)

[Bouton: Compléter mon profil]
```

**✅ Test Réussi Si:**

- Encadré s'affiche seulement si requirements > 0
- Labels sont en français (pas codes Stripe bruts)
- Icônes correspondent aux champs
- Past due (rouge) affiché avant currently due (orange)
- Compteur "+X autres paramètres" correct
- Bouton "Compléter mon profil" visible

---

### Test 3: Pas de Requirements (Compte Complet)

**Objectif:** Vérifier qu'aucun encadré d'alerte ne s'affiche pour un compte complet

**Prérequis:**

- Compte Stripe avec `currently_due=[]` et `past_due=[]`

**Étapes:**

1. Ouvrir StripeHub
2. Observer "Account Information"

**Résultats Attendus:**

- Badge: 🟢 "Compte vérifié"
- **Aucun encadré d'alerte**
- Seulement Account ID et Business Name
- Actions rapides (Settings, Payouts, Payment Link)

**✅ Test Réussi Si:**

- Aucun warning/alert visible
- UI propre et sans encombrement

---

### Test 4: Traductions (FR → EN)

**Objectif:** Vérifier que les traductions fonctionnent

**Étapes:**

1. Ouvrir Settings
2. Changer langue FR → EN
3. Revenir à StripeHub
4. Observer badge et requirements

**Résultats Attendus:**

| Français                  | Anglais                  |
| ------------------------- | ------------------------ |
| "Compte vérifié"          | "Account verified"       |
| "Action requise"          | "Action required"        |
| "En attente"              | "Pending"                |
| "Incomplet"               | "Incomplete"             |
| "Informations manquantes" | "Missing information"    |
| "Action urgente requise"  | "Urgent action required" |
| "Compléter mon profil"    | "Complete my profile"    |
| "autres paramètres"       | "more parameters"        |
| "Numéro d'identité"       | "ID Number"              |
| "Date de naissance"       | "Date of birth"          |
| "Compte bancaire"         | "Bank account"           |

**✅ Test Réussi Si:**

- Toutes les chaînes sont traduites
- Pas de texte en français en mode EN
- Pas de clés de traduction visibles (ex: "stripe.hub.missingInfo")

---

### Test 5: Bouton "Compléter mon profil" (Sans Backend)

**Objectif:** Vérifier que le bouton gère l'erreur 404 proprement

**⚠️ IMPORTANT:** Ce test est valide AVANT que le backend crée l'endpoint

**Étapes:**

1. Ouvrir StripeHub avec requirements
2. Cliquer sur "Compléter mon profil"
3. Observer le comportement

**Résultats Attendus:**

1. Loading spinner apparaît sur le bouton
2. Après ~2-3 secondes, Alert s'affiche:
   - Titre: "Erreur"
   - Message: "Impossible de charger le formulaire. Vérifiez votre connexion."
3. Bouton redevient normal (pas de loading)

**✅ Test Réussi Si:**

- Pas de crash
- Alert avec message clair
- Logs console montrent:
  ```
  🔄 [STRIPE LINK] Refreshing account link...
  🌐 [STRIPE LINK] Calling endpoint: https://altivo.fr/swift-app/v1/stripe/connect/refresh-link
  📡 [STRIPE LINK] Response status: 404
  ❌ [STRIPE LINK] Error response: { error: "Not Found" }
  ❌ [STRIPE LINK] Error refreshing account link: Error: ...
  ```

---

### Test 6: Bouton "Compléter mon profil" (Avec Backend) ⏳

**Objectif:** Vérifier le flow complet avec WebView

**⚠️ IMPORTANT:** Ce test nécessite que le backend ait créé l'endpoint

**Prérequis:**

- Endpoint `POST /v1/stripe/connect/refresh-link` opérationnel
- Backend retourne URL Stripe valide

**Étapes:**

1. Ouvrir StripeHub avec requirements
2. Cliquer sur "Compléter mon profil"
3. Observer WebView Stripe
4. Compléter le formulaire
5. Observer la redirection

**Résultats Attendus:**

1. Loading spinner (1-2 sec)
2. WebView s'ouvre plein écran
3. Page Stripe s'affiche avec formulaire
4. Seulement les champs manquants sont demandés
5. Après soumission:
   - Redirection vers `swiftapp://stripe/onboarding/success`
   - WebView se ferme
   - StripeHub refresh automatique
   - Badge passe de 🟡 à 🟢 (si tout complété)
   - Encadré d'alerte disparaît

**✅ Test Réussi Si:**

- WebView s'ouvre sans erreur
- Formulaire Stripe fonctionnel
- Redirection vers l'app fonctionne
- Statut se met à jour automatiquement
- Logs console montrent:
  ```
  🔄 [STRIPE LINK] Refreshing account link...
  🌐 [STRIPE LINK] Calling endpoint: ...
  📡 [STRIPE LINK] Response status: 200
  ✅ [STRIPE LINK] Account link created successfully
  ⏰ [STRIPE LINK] URL expires in 5 minutes
  ```

---

### Test 7: Expiration du Lien (Avec Backend) ⏳

**Objectif:** Vérifier que les liens expirés sont gérés

**Étapes:**

1. Cliquer "Compléter mon profil"
2. Ne PAS remplir le formulaire
3. Attendre 5 minutes
4. Essayer de soumettre

**Résultats Attendus:**

- Stripe affiche: "This link has expired"
- Option pour générer un nouveau lien

**✅ Test Réussi Si:**

- Pas de crash
- Message d'erreur Stripe clair
- User peut fermer WebView et réessayer

---

### Test 8: Annulation WebView (Avec Backend) ⏳

**Objectif:** Vérifier que l'annulation est gérée

**Étapes:**

1. Cliquer "Compléter mon profil"
2. WebView s'ouvre
3. Cliquer "< Back" ou "Fermer"

**Résultats Attendus:**

- WebView se ferme
- Retour à StripeHub
- Statut inchangé
- Pas de crash

**✅ Test Réussi Si:**

- Fermeture propre de WebView
- App reste fonctionnelle
- Requirements toujours affichés

---

### Test 9: Refresh Manuel

**Objectif:** Vérifier que le pull-to-refresh met à jour les requirements

**Étapes:**

1. Ouvrir StripeHub
2. Noter les requirements affichés
3. Pull-to-refresh (swipe down)
4. Observer si requirements changent

**Résultats Attendus:**

- Loading spinner pendant refresh
- Appel API pour récupérer compte
- Requirements mis à jour
- Badge mis à jour si nécessaire

**✅ Test Réussi Si:**

- Refresh fonctionne
- Données à jour
- Pas de crash

---

### Test 10: Multiples Requirements

**Objectif:** Tester avec plus de 3 requirements

**Prérequis:**

- Compte avec 5+ requirements

**Étapes:**

1. Ouvrir StripeHub
2. Observer l'encadré

**Résultats Attendus:**

```
⚠️ Informations manquantes

🟡 Numéro d'identité
🟡 Date de naissance
🟡 Compte bancaire

+3 autres paramètres

[Bouton: Compléter mon profil]
```

**✅ Test Réussi Si:**

- Maximum 3 requirements affichés
- Compteur "+X autres paramètres" correct
- UI pas surchargée

---

## 🐛 Bugs Connus à Vérifier

### Bug Potentiel 1: Requirements Non Définis

**Symptôme:** Crash si `requirements` est `undefined`

**Test:**

1. Compte sans champ `requirements`
2. Ouvrir StripeHub

**Fix Appliqué:**

```typescript
{stripeAccount.account?.requirements && (
  stripeAccount.account.requirements.currently_due.length > 0 ||
  stripeAccount.account.requirements.past_due.length > 0
) && (
  // Display alert
)}
```

**✅ Vérifié Si:** Pas de crash, encadré ne s'affiche pas

---

### Bug Potentiel 2: Labels Manquants

**Symptôme:** Code Stripe brut affiché (ex: "individual.id_number")

**Test:**

1. Requirement non dans STRIPE_REQUIREMENT_LABELS
2. Observer le label

**Fix Appliqué:**

```typescript
// Fallback: format field name if not in mapping
return field
  .replace(/^(individual|company|business_profile)\./, "")
  .replace(/\./g, " ")
  .replace(/_/g, " ")
  .replace(/\b\w/g, (char) => char.toUpperCase());
```

**✅ Vérifié Si:** Label formaté lisible (ex: "Address Line1" au lieu de "individual.address.line1")

---

## 📊 Checklist de Test

### Tests Sans Backend (Actuellement)

- [ ] Test 1: Badge de statut (4 états)
- [ ] Test 2: Affichage requirements
- [ ] Test 3: Pas de requirements
- [ ] Test 4: Traductions FR/EN
- [ ] Test 5: Bouton erreur 404
- [ ] Test 9: Refresh manuel
- [ ] Test 10: Multiples requirements

### Tests Avec Backend (Après Implémentation)

- [ ] Test 6: WebView flow complet
- [ ] Test 7: Lien expiré
- [ ] Test 8: Annulation WebView

### Tests de Bugs

- [ ] Bug 1: Requirements undefined
- [ ] Bug 2: Labels manquants

---

## 📸 Screenshots Attendus

### 1. Badge "Compte vérifié"

```
┌─────────────────────────────┐
│ Stripe Hub      🟢 Compte   │
│                   vérifié   │
└─────────────────────────────┘
```

### 2. Badge "Action requise"

```
┌─────────────────────────────┐
│ Stripe Hub      🔴 Action   │
│                   requise   │
└─────────────────────────────┘
```

### 3. Encadré Requirements

```
┌──────────────────────────────────┐
│ ⚠️ Informations manquantes       │
│                                  │
│ 📄 Numéro d'identité             │
│ 📅 Date de naissance             │
│ 💳 Compte bancaire               │
│                                  │
│ +2 autres paramètres             │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ✏️ Compléter mon profil      │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## 🔍 Logs à Surveiller

### Logs de Success

```
✅ [StripeHub] Compte Stripe chargé: {...}
🔄 [STRIPE LINK] Refreshing account link...
🌐 [STRIPE LINK] Calling endpoint: https://altivo.fr/...
📡 [STRIPE LINK] Response status: 200
✅ [STRIPE LINK] Account link created successfully
⏰ [STRIPE LINK] URL expires in 5 minutes
```

### Logs d'Erreur (Expected pour l'instant)

```
🔄 [STRIPE LINK] Refreshing account link...
🌐 [STRIPE LINK] Calling endpoint: https://altivo.fr/...
📡 [STRIPE LINK] Response status: 404
❌ [STRIPE LINK] Error response: { error: "Not Found" }
❌ [STRIPE LINK] Error refreshing account link: Error: ...
```

---

## 🚀 Prochaines Étapes

1. **Tester sans backend** (Tests 1-5, 9-10) ✅
2. **Envoyer STRIPE_ONBOARDING_BACKEND.md au dev backend** 📤
3. **Attendre création endpoint** ⏳
4. **Tester avec backend** (Tests 6-8) ⏳
5. **Valider avec compte réel** (production) ⏳

---

**Guide de test prêt** ✅  
**En attente du backend pour tests complets** ⏳

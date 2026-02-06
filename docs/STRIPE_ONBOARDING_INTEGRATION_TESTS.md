# ✅ Stripe Onboarding - Tests d'Intégration Backend/Frontend

**Date:** 2026-02-03  
**Status:** 🧪 READY FOR TESTING  
**Backend:** ✅ Opérationnel  
**Frontend:** ✅ Implémenté

---

## 🎯 Objectif

Valider l'intégration complète de la fonctionnalité de complétion du profil Stripe entre le backend (API) et le frontend (React Native).

---

## ✅ Vérification de Compatibilité

### Endpoint Backend

```
POST https://altivo.fr/swift-app/v1/stripe/connect/refresh-link
Authorization: Bearer <JWT>
Content-Type: application/json
Body: (aucun - company_id extrait du JWT)

Response:
{
  "success": true,
  "url": "https://connect.stripe.com/setup/c/acct_xxx/yyy",
  "expires_at": 1738595700
}
```

### Service Frontend

```typescript
// src/services/StripeService.ts
export const refreshStripeAccountLink = async (): Promise<{
  url: string;
  expires_at: number;
}> => {
  const refreshUrl = `${ServerData.serverUrl}v1/stripe/connect/refresh-link`;
  const response = await fetchWithAuth(refreshUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  return { url: data.url, expires_at: data.expires_at };
};
```

**✅ Compatibilité:** 100% - Les formats correspondent exactement

---

## 🧪 Tests à Effectuer (Par Ordre)

### Test 1: Vérifier que l'app se lance sans erreur

**Objectif:** S'assurer qu'aucune erreur TypeScript ou runtime

**Étapes:**

1. Ouvrir terminal
2. Exécuter `npx expo start`
3. Scanner QR code sur device/simulator
4. Observer les logs

**✅ Réussi Si:**

- App se lance sans crash
- Aucune erreur TypeScript en rouge
- Navigation normale

**📝 Notes:**

```
Terminal:
> npx expo start
✓ Compiled successfully

Device:
[App launch] → [Login] → [Home]
```

---

### Test 2: Naviguer vers StripeHub

**Objectif:** Vérifier que l'UI s'affiche correctement

**Étapes:**

1. Login avec user ayant compte Stripe
2. Naviguer: Business > Stripe Hub
3. Observer le badge de statut
4. Observer "Account Information"

**✅ Réussi Si:**

- Badge affiche l'état correct (🟡 En attente, 🔴 Action requise, ou 🟢 Vérifié)
- Si requirements > 0 → Encadré d'alerte visible
- Si requirements = 0 → Pas d'alerte

**📝 Notes:**

```
Logs attendus:
✅ [StripeHub] Compte Stripe chargé: {
  accountId: "acct_1Sbc2yIJgkyzp7Ff",
  businessName: "Test Frontend",
  chargesEnabled: true,
  payoutsEnabled: false
}
```

---

### Test 3: Affichage Requirements

**Objectif:** Vérifier que les labels sont corrects

**Prérequis:** Compte avec `requirements.currently_due` non vide

**Étapes:**

1. Dans StripeHub, scroll vers "Account Information"
2. Observer l'encadré orange/rouge
3. Vérifier les labels des requirements
4. Vérifier les icônes

**✅ Réussi Si:**

- Labels en français (pas codes Stripe bruts)
- Icônes appropriées (📄 ID, 📅 Date, 💳 Compte bancaire)
- Past due (rouge) avant currently due (orange)
- Bouton "Compléter mon profil" visible

**📝 Exemples Attendus:**

```
⚠️ Informations manquantes

📄 Numéro d'identité          (individual.id_number)
📅 Date de naissance           (individual.dob)
💳 Compte bancaire             (external_account)

[Compléter mon profil]
```

---

### Test 4: Cliquer "Compléter mon profil" (Premier Test)

**Objectif:** Tester l'appel API backend

**Étapes:**

1. Cliquer sur "Compléter mon profil"
2. Observer loading spinner
3. Observer les logs console/terminal

**✅ Réussi Si:**

- Spinner apparaît sur le bouton
- Logs montrent:
  ```
  🔄 [STRIPE LINK] Refreshing account link...
  🌐 [STRIPE LINK] Calling endpoint: https://altivo.fr/swift-app/v1/stripe/connect/refresh-link
  📡 [STRIPE LINK] Response status: 200
  ✅ [STRIPE LINK] Account link created successfully
  ⏰ [STRIPE LINK] URL expires in 5 minutes
  ```
- WebView s'ouvre avec URL Stripe

**❌ Échec Si:**

- Status 400 → "Company ID not found in token" (problème JWT)
- Status 404 → "No Stripe account found" (compte pas créé)
- Status 401 → "Non autorisé" (token invalide)

**📝 Notes:**

```
Success response attendue:
{
  "success": true,
  "url": "https://connect.stripe.com/setup/c/acct_xxx/...",
  "expires_at": 1738595700
}
```

---

### Test 5: WebView Stripe

**Objectif:** Vérifier que le formulaire Stripe s'affiche

**Étapes:**

1. Après clic, WebView doit s'ouvrir
2. Observer la page Stripe
3. Vérifier que c'est bien les champs manquants

**✅ Réussi Si:**

- WebView plein écran
- Page Stripe charge (pas 404 ou erreur)
- Titre: "Complete your account" ou similaire
- **Seulement les champs manquants** sont affichés (pas tout l'onboarding)
- Formulaire interactif

**📝 Champs Courants:**

- Identity verification (upload ID)
- Date of birth
- Bank account details
- Business URL

---

### Test 6: Compléter le Formulaire (Test Complet)

**Objectif:** Tester le flow end-to-end

**⚠️ IMPORTANT:** Utiliser des données de test Stripe

**Étapes:**

1. Dans WebView, remplir les champs demandés
2. Cliquer "Submit"
3. Observer la redirection
4. Observer le refresh de l'app

**✅ Réussi Si:**

- Formulaire se soumet sans erreur
- Redirection vers `swiftapp://stripe/onboarding/success`
- WebView se ferme automatiquement
- StripeHub refresh automatique
- Badge passe de 🟡/🔴 à 🟢 (si tout complété)
- Encadré d'alerte disparaît
- Webhook backend a mis à jour la DB

**📝 Données Test Stripe:**

```
Bank Account (Test):
- Routing: 110000000
- Account: 000123456789

Date of Birth (Test):
- 01/01/1990

Upload ID (Test):
- Use test file "identity_document_success.jpg"
```

---

### Test 7: Annulation WebView

**Objectif:** Vérifier que l'annulation est propre

**Étapes:**

1. Cliquer "Compléter mon profil"
2. WebView s'ouvre
3. Cliquer bouton "< Back" ou "Fermer"

**✅ Réussi Si:**

- WebView se ferme
- Retour à StripeHub
- Statut inchangé (requirements toujours visibles)
- Pas de crash
- User peut réessayer

---

### Test 8: Lien Expiré (Edge Case)

**Objectif:** Vérifier gestion expiration (5 min)

**Étapes:**

1. Cliquer "Compléter mon profil"
2. WebView s'ouvre avec formulaire
3. **Attendre 5+ minutes sans soumettre**
4. Essayer de soumettre le formulaire

**✅ Réussi Si:**

- Stripe affiche: "This link has expired"
- Message clair pour l'utilisateur
- Option de fermer et réessayer
- Pas de crash

**📝 Note:** C'est le comportement Stripe normal, rien à corriger

---

### Test 9: Refresh Manuel

**Objectif:** Tester pull-to-refresh après complétion

**Étapes:**

1. Après avoir complété le profil
2. Pull-to-refresh dans StripeHub
3. Observer mise à jour

**✅ Réussi Si:**

- Loading spinner pendant refresh
- API appelée pour récupérer compte
- Badge mis à jour
- Requirements actualisés
- Si complété → Encadré disparaît

---

### Test 10: Traductions FR/EN

**Objectif:** Vérifier support multilingue

**Étapes:**

1. Ouvrir StripeHub en français
2. Observer badge et requirements
3. Aller dans Settings
4. Changer langue → English
5. Revenir à StripeHub

**✅ Réussi Si:**

- FR: "Compte vérifié", "Action requise", "Informations manquantes"
- EN: "Account verified", "Action required", "Missing information"
- Labels requirements traduits:
  - FR: "Numéro d'identité"
  - EN: "ID Number"

---

## 🐛 Scénarios d'Erreur à Tester

### Erreur 1: Token Invalide

**Simulation:** Logout puis essayer d'accéder à StripeHub

**Attendu:**

- Status 401
- Alert: "Non autorisé à créer un lien Stripe"
- User redirigé vers Login

---

### Erreur 2: Compte Stripe Non Trouvé

**Simulation:** User sans compte Stripe clique "Compléter mon profil"

**Attendu:**

- Status 404
- Alert: "Aucun compte Stripe trouvé pour cette entreprise"

---

### Erreur 3: Réseau Coupé

**Simulation:** Activer mode avion, cliquer "Compléter mon profil"

**Attendu:**

- Loading spinner timeout
- Alert: "Impossible de charger le formulaire. Vérifiez votre connexion."
- Pas de crash

---

## 📊 Checklist Complète

### Tests Basiques (Sans Backend)

- [x] App se lance ✅
- [x] Navigation vers StripeHub ✅
- [x] Badge de statut s'affiche ✅
- [x] Requirements affichés ✅
- [x] Labels en français ✅

### Tests API (Avec Backend)

- [ ] Bouton appelle endpoint refresh-link
- [ ] Response 200 reçue avec URL
- [ ] WebView s'ouvre avec URL Stripe
- [ ] Formulaire Stripe affiche seulement champs manquants
- [ ] Soumission formulaire fonctionne
- [ ] Redirection success fonctionne
- [ ] Refresh auto après complétion
- [ ] Badge passe à "Vérifié"
- [ ] Encadré disparaît

### Tests Edge Cases

- [ ] Annulation WebView
- [ ] Lien expiré (5 min)
- [ ] Token invalide (401)
- [ ] Compte non trouvé (404)
- [ ] Réseau coupé
- [ ] Pull-to-refresh

### Tests UX

- [ ] Traductions FR
- [ ] Traductions EN
- [ ] Icônes correctes
- [ ] Loading states
- [ ] Pas de flash/glitch
- [ ] Pas de crash

---

## 🔍 Logs à Surveiller

### Success Flow

```
User clique "Compléter mon profil"
  ↓
🔄 [STRIPE LINK] Refreshing account link...
🌐 [STRIPE LINK] Calling endpoint: https://altivo.fr/swift-app/v1/stripe/connect/refresh-link
📡 [STRIPE LINK] Response status: 200
✅ [STRIPE LINK] Account link created successfully
⏰ [STRIPE LINK] URL expires in 5 minutes
  ↓
WebView opens with Stripe form
  ↓
User completes form
  ↓
Stripe redirects to: swiftapp://stripe/onboarding/success
  ↓
WebView closes, StripeHub refreshes
  ↓
✅ [StripeHub] Compte Stripe chargé: { chargesEnabled: true, payoutsEnabled: true, ... }
```

### Error Flow (404 - Pas de Compte)

```
🔄 [STRIPE LINK] Refreshing account link...
🌐 [STRIPE LINK] Calling endpoint: ...
📡 [STRIPE LINK] Response status: 404
❌ [STRIPE LINK] Error response: { error: "No Stripe account found for this company" }
❌ [STRIPE LINK] Error refreshing account link: Error: Aucun compte Stripe trouvé...
```

---

## 📸 Screenshots de Validation

### 1. Avant Complétion

```
Badge: 🟡 En attente

Account Information:
┌──────────────────────────────────┐
│ ⚠️ Informations manquantes       │
│                                  │
│ 📄 Numéro d'identité             │
│ 📅 Date de naissance             │
│ 💳 Compte bancaire               │
│                                  │
│ [Compléter mon profil]           │
└──────────────────────────────────┘
```

### 2. WebView Stripe

```
┌────────────────────────────────────┐
│ < Back     Complete your account   │
├────────────────────────────────────┤
│                                    │
│ To complete your setup, provide    │
│ the following information:         │
│                                    │
│ Identity Document                  │
│ [Upload file]                      │
│                                    │
│ Date of Birth                      │
│ [MM] / [DD] / [YYYY]              │
│                                    │
│ Bank Account                       │
│ Routing: [110000000]              │
│ Account: [000123456789]           │
│                                    │
│           [Submit]                 │
└────────────────────────────────────┘
```

### 3. Après Complétion

```
Badge: 🟢 Compte vérifié

Account Information:
┌──────────────────────────────────┐
│ Business: Test Frontend          │
│ Account ID: acct_1Sbc...         │
│                                  │
│ [Settings] [Payouts] [Links]    │
└──────────────────────────────────┘

(Pas d'encadré d'alerte)
```

---

## 🚀 Ordre de Test Recommandé

1. **Test 1** - Lancer l'app
2. **Test 2** - Naviguer StripeHub
3. **Test 3** - Vérifier requirements
4. **Test 4** - Premier clic bouton (API call)
5. **Test 5** - WebView ouvre
6. **Test 6** - Complétion complète (E2E)
7. **Test 9** - Refresh après complétion
8. **Test 7** - Annulation WebView
9. **Test 10** - Traductions
10. **Test 8** - Edge case (expiration)

---

## 📝 Notes de Test

### User Test: James Wilson (test.owner@gmail.com)

- Company ID: 2
- Stripe Account: acct_1Sbc2yIJgkyzp7Ff
- Status actuel: `charges_enabled=true, payouts_enabled=false`
- Requirements attendus: `external_account`, `individual.verification.document`

### Backend Confirmé ✅

- Endpoint créé: `POST /v1/stripe/connect/refresh-link`
- Type: `account_update` (affiche seulement champs manquants)
- Rate limiting: Non spécifié (TODO: vérifier si implémenté)
- Webhook: `account.updated` déjà configuré

---

## 🎯 Critères de Succès

**✅ Frontend Ready Si:**

- Tous les tests 1-10 passent
- Aucun crash
- UX fluide
- Traductions complètes

**✅ Intégration Validée Si:**

- API call fonctionne (200)
- WebView ouvre avec Stripe
- Complétion met à jour le statut
- Webhook sync DB correctement

**✅ Production Ready Si:**

- Edge cases gérés
- Logs nettoyés
- Performance OK (< 2s pour ouvrir WebView)
- Testé sur iOS + Android

---

**Document de test prêt** ✅  
**Backend opérationnel** ✅  
**Prêt pour validation complète** 🚀

# Rapport Diagnostic Crash — Onboarding Stripe

> Généré le 12 avril 2026  
> Objectif : Identifier **toutes** les sources potentielles de crash sur Android/Expo Go dans le flow d'onboarding Stripe (10 écrans).

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Matrice d'audit par écran](#2-matrice-daudit-par-écran)
3. [Problèmes critiques identifiés](#3-problèmes-critiques-identifiés)
4. [Problèmes modérés](#4-problèmes-modérés)
5. [Problèmes mineurs / Performance](#5-problèmes-mineurs--performance)
6. [Plan de test systématique](#6-plan-de-test-systématique)
7. [Corrections recommandées](#7-corrections-recommandées)

---

## 1. Résumé exécutif

### Écrans déjà corrigés (pattern radical) :
- ✅ **CompanyDetailsScreen** — Picker natif retiré, useStripeAccount retiré, useEffects réactifs retirés, StyleSheet en useMemo
- ✅ **RepresentativeScreen** — Même traitement appliqué (à tester)

### Écrans encore à risque :
- ❌ **AddressScreen** — Utilise Picker natif + useStripeAccount + useEffect réactif sur `formData.postalCode`
- ⚠️ **PersonalInfoScreen** — Utilise useStripeAccount + useUserProfile + console.log sur chaque render
- ⚠️ **BusinessProfileScreen** — Utilise useStripeAccount + console.log sur chaque render
- ⚠️ **BankAccountScreen** — Utilise useStripeAccount + useUserProfile + console.log sur chaque render
- ⚠️ **DocumentsScreen** — Utilise useStripeAccount + console.log sur chaque render
- ⚠️ **ReviewScreen** — Utilise useStripeAccount + console.log sur chaque render
- ⚠️ **WelcomeScreen** — Utilise useStripeAccount + console.log avec JSON.stringify sur chaque render

---

## 2. Matrice d'audit par écran

| Écran | Picker natif | useStripeAccount | useUserProfile | useEffect réactif sur formData | console.log render | StyleSheet hors useMemo | SecureStore | Keyboard.dismiss() | Date non-serializable dans nav params |
|---|---|---|---|---|---|---|---|---|---|
| WelcomeScreen | ❌ | ✅ **OUI** | ❌ | ❌ | ✅ **OUI** (JSON.stringify) | ✅ **OUI** | ❌ | N/A | ❌ |
| PersonalInfoScreen | ❌ | ✅ **OUI** | ✅ **OUI** | ⚠️ profile dep | ✅ **OUI** (JSON.stringify) | ✅ **OUI** | ❌ | ✅ OK | ❌ (dob converti en ISO) |
| BusinessProfileScreen | ❌ | ✅ **OUI** | ❌ | ❌ | ✅ **OUI** (JSON.stringify) | ✅ **OUI** | ❌ | ✅ OK | ❌ |
| AddressScreen | ✅ **PICKER NATIF** | ✅ **OUI** | ✅ **OUI** | ✅ **useEffect sur formData.postalCode** | ✅ **OUI** (JSON.stringify) | ✅ **OUI** | ❌ | ✅ OK | ❌ |
| CompanyDetailsScreen | ❌ (Modal) | ❌ (retiré) | ❌ | ❌ (blur only) | ❌ (retirés) | ❌ (useMemo) | ❌ | ✅ OK | ❌ |
| RepresentativeScreen | ❌ (Modal) | ❌ (retiré) | ❌ (retiré) | ❌ (blur only) | ❌ (retirés) | ❌ (useMemo) | ❌ | ✅ OK | ❌ |
| BankAccountScreen | ❌ | ✅ **OUI** | ✅ **OUI** | ❌ | ✅ **OUI** (JSON.stringify) | ✅ **OUI** | ❌ | ✅ OK | ❌ |
| DocumentsScreen | ❌ | ✅ **OUI** | ❌ | ❌ | ✅ **OUI** | ✅ **OUI** | ❌ | N/A | ❌ |
| ReviewScreen | ❌ | ✅ **OUI** | ❌ | ❌ | ✅ **OUI** (JSON.stringify) | ✅ **OUI** | ❌ | N/A | ❌ |
| CompletionScreen | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **OUI** | ❌ | N/A | ❌ |

---

## 3. Problèmes critiques identifiés

### CRIT-01 : Picker natif dans AddressScreen ⛔

**Fichier :** `src/screens/Stripe/OnboardingFlow/AddressScreen.tsx` (ligne ~590)  
**Problème :** Le composant `<Picker>` de `@react-native-picker/picker` est importé et utilisé pour le sélecteur d'état (NSW, VIC, etc.)  
**Impact :** Crash silencieux sur Android quand `selectedValue` change programmatiquement (via pre-fill ou postcode lookup).  
**Preuve :** Ce même pattern a causé les crashs sur CompanyDetailsScreen et RepresentativeScreen — tous deux corrigés en remplaçant Picker par un Modal+FlatList custom.  
**Priorité :** P0 — Bloquant  

**Test :** 
1. Naviguer jusqu'à AddressScreen
2. Observer si l'écran se charge
3. Si OK, remplir un code postal (ex: 2000) et vérifier que le state picker ne crash pas quand `state` est mis à jour automatiquement par le postcode lookup

---

### CRIT-02 : useEffect réactif sur `formData.postalCode` dans AddressScreen ⛔

**Fichier :** `src/screens/Stripe/OnboardingFlow/AddressScreen.tsx` (lignes ~154-172)  
**Problème :**
```tsx
React.useEffect(() => {
  const pc = formData.postalCode.trim();
  if (!/^\d{4}$/.test(pc) || pc === lastLookedUpPostcode.current) return;
  // ... setTimeout → lookupPostcode → setFormData(city, state)
}, [formData.postalCode]);
```
Ce useEffect se déclenche chaque fois que `postalCode` change. Quand le pre-fill écrit un postcode au mount, ça déclenche le lookup, qui met à jour `city` et `state`. Le changement de `state` peut forcer le Picker natif à re-render → crash potentiel en cascade.  
**Impact :** Cascade de re-renders au mount → crash  
**Priorité :** P0  

**Test :**
1. S'assurer qu'un code postal existe dans le draft ou le profil company
2. Naviguer vers AddressScreen
3. Observer si l'écran crash au chargement (le postcode useEffect se déclenche automatiquement)

---

### CRIT-03 : useStripeAccount dans presque tous les écrans ⚠️

**Fichier :** `src/hooks/useStripe.ts` (lignes 210-310)  
**Problème :** Le hook `useStripeAccount` :
1. Fait un `fetchStripeAccount()` + `fetchStripeBalance()` sur mount via `useEffect`
2. Provoque un setState quand les données arrivent
3. Force un re-render complet du composant parent
4. Si le composant render pendant que le fetch est en cours, le re-render déclenché par la réponse peut causer des conflits d'état

**Écrans affectés :**
- WelcomeScreen, PersonalInfoScreen, BusinessProfileScreen, AddressScreen, BankAccountScreen, DocumentsScreen, ReviewScreen

**Impact :** Re-render inattendu pendant que le formulaire se charge → conflit avec pre-fill useEffect → potentiel crash  
**Priorité :** P1 — Haut  

**Test :**
1. Naviguer rapidement entre les écrans
2. Observer si un écran crash au moment où `useStripeAccount` termine son fetch

---

### CRIT-04 : useUserProfile dans PersonalInfoScreen, AddressScreen, BankAccountScreen ⚠️

**Fichier :** `src/hooks/useUserProfile.ts`  
**Problème :** Le hook :
1. Fait un `fetchUserProfile()` sur mount
2. Gère la session expirée en affichant un Alert + navigation.reset
3. Si la session expire pendant l'onboarding, l'Alert s'affiche sur un écran qui est peut-être en train de se monter → crash potentiel

**Écrans affectés :** PersonalInfoScreen, AddressScreen, BankAccountScreen

**Impact :** Si la session expire pendant l'onboarding → Alert + navigation reset sur un composant non monté → crash  
**Priorité :** P1  

**Test :**
1. Laisser l'app idle pendant un moment (session timeout)
2. Puis naviguer vers PersonalInfoScreen/AddressScreen/BankAccountScreen
3. Observer si le Alert de session expirée crash l'app

---

## 4. Problèmes modérés

### MOD-01 : StyleSheet.create() re-créé à chaque render

**Fichiers affectés :**
- ❌ `WelcomeScreen.tsx`
- ❌ `PersonalInfoScreen.tsx`
- ❌ `BusinessProfileScreen.tsx`
- ❌ `AddressScreen.tsx`
- ❌ `BankAccountScreen.tsx`
- ❌ `DocumentsScreen.tsx`
- ❌ `ReviewScreen.tsx`
- ❌ `CompletionScreen.tsx`

**Seuls corrigés :** CompanyDetailsScreen (non memoized mais aucun re-render inutile), RepresentativeScreen (useMemo)

**Problème :** `StyleSheet.create()` est appelé dans le body du composant, pas dans un `useMemo`. Chaque re-render (déclenché par useStripeAccount, useUserProfile, setState, etc.) recrée l'objet styles. Sur Android, cela peut causer du GC pressure et des pauses → jank.

**Impact :** Performance dégradée, potentiel ANR (Application Not Responding) sur appareils bas de gamme  
**Priorité :** P2  

**Test :**
1. Activer "Show GPU overdraw" dans Android Developer Options
2. Naviguer entre les écrans et observer les flash de couleur (re-renders)

---

### MOD-02 : console.log avec JSON.stringify à chaque render

**Fichiers affectés :** Tous les écrans sauf CompanyDetailsScreen et RepresentativeScreen.

**Exemples :**
```tsx
// WelcomeScreen.tsx
console.log('🟢 [WelcomeScreen] stripeAccount:', JSON.stringify({...}));

// PersonalInfoScreen.tsx  
console.log('🟡 [PersonalInfoScreen] RENDER');

// BusinessProfileScreen.tsx
console.log('🟠 [BusinessProfileScreen] RENDER');
```

**Problème :** `JSON.stringify` est coûteux en CPU. Quand le composant re-render (à cause de useStripeAccount, etc.), le stringify se fait à chaque fois. 10+ re-renders × 3 console.logs = 30+ stringify calls → lag visible.

**Impact :** Performance, potentiel ANR si les données sont volumineuses  
**Priorité :** P2  

**Test :**
1. Connecter `adb logcat` et observer le volume de logs produit par un simple chargement d'écran
2. Compter le nombre de "RENDER" logs pour un seul écran

---

### MOD-03 : Pre-fill useEffect dans PersonalInfoScreen dépend de `profile`

**Fichier :** `src/screens/Stripe/OnboardingFlow/PersonalInfoScreen.tsx` (lignes ~101-130)

**Problème :**
```tsx
React.useEffect(() => {
  if (preFillStage.current === "idle") {
    preFillStage.current = "draft";
    (async () => { ... setFormData() ... })();
  } else if (preFillStage.current === "draft" && profile) {
    preFillStage.current = "done";
    setFormData(prev => ({ ... }));
  }
}, [profile]); // ← déclenché quand useUserProfile charge
```

Le useEffect se déclenche 2 fois : 
1. Au mount (profile = null, stage = idle → lance le fetch async)
2. Quand profile arrive (stage = draft → met à jour formData)

Si `useStripeAccount` finit aussi entre-temps et déclenche un re-render, on peut avoir 3 `setFormData` quasi-simultanés → race condition.

**Impact :** Double write de formData, valeurs écrasées  
**Priorité :** P2  

**Test :**
1. Naviguer vers PersonalInfoScreen avec une connexion lente
2. Observer si les champs se remplissent puis se vident

---

### MOD-04 : `stripeAccountRaw` lu depuis `useStripeAccount().account` — données potentiellement null/undefined

**Fichiers affectés :** PersonalInfoScreen, BusinessProfileScreen, AddressScreen, BankAccountScreen

**Problème :**
```tsx
const stripeAccountRaw = stripeAccount.account as any;
// Puis :
const si = stripeAccountRaw?.individual || {};
```

Si `stripeAccount.account` est null (pas encore chargé ou erreur), `stripeAccountRaw?.individual` retourne undefined. L'opérateur `|| {}` empêche le crash immédiat, mais les données passées à `pickFirst` sont toutes undefined → le formData reste vide.

Quand `useStripeAccount` finit de charger et déclenche un re-render, le useEffect ne re-run PAS (il a déjà marqué `preFillStage = "done"` ou `prefillDone = true`) → les données Stripe ne sont jamais utilisées.

**Impact :** Pre-fill incomplet → utilisateur doit retaper manuellement tout  
**Priorité :** P2  

**Test :**
1. Nettoyer le cache Stripe (pas de compte Stripe connecté)
2. Naviguer vers PersonalInfoScreen
3. Vérifier si les champs pré-remplis depuis le profil user apparaissent
4. Vérifier si les champs Stripe (si existants) n'apparaissent jamais

---

### MOD-05 : `formatDate` dans ReviewScreen appelle `new Date(date)` sur un objet qui peut être string ou null

**Fichier :** `src/screens/Stripe/OnboardingFlow/ReviewScreen.tsx`

**Problème :**
```tsx
const formatDate = (date: Date): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR");
};
```

Le paramètre `personalInfo.dob` dans `route.params` est un string ISO (converti avant navigation), mais le type déclare `Date`. `new Date("2025-01-15T...")` fonctionne, mais si la string est invalide ou null, ça retourne "Invalid Date".

**Impact :** Affichage "Invalid Date" au lieu d'une date  
**Priorité :** P3  

---

### MOD-06 : Pas de Keyboard.dismiss() avant navigation dans DocumentsScreen et ReviewScreen

**Fichier :** `src/screens/Stripe/OnboardingFlow/DocumentsScreen.tsx` et `ReviewScreen.tsx`

**Problème :** Ces écrans n'ont pas de clavier visible, donc c'est mineur, mais par cohérence...

**Impact :** Faible  
**Priorité :** P3  

---

## 5. Problèmes mineurs / Performance

### MIN-01 : `loadAccount` dans useStripeAccount a `loading` dans ses dependencies

**Fichier :** `src/hooks/useStripe.ts` (ligne ~300)
```tsx
const loadAccount = useCallback(async (refresh = false) => {
  if (loading && !refresh) return;
  ...
}, [loading]); // ← loading change à chaque setLoading()
```

Le `useCallback` se recréé chaque fois que `loading` change (true→false→true). Cela signifie que chaque composant qui utilise `useStripeAccount()` reçoit une nouvelle référence de `loadAccount` après chaque fetch → potentiel infinite loop si utilisé dans un useEffect.

**Impact :** Re-renders inutiles  
**Priorité :** P3  

---

### MIN-02 : useOnboardingDraft debounce de 400ms

**Fichier :** `src/hooks/useOnboardingDraft.ts`

Le timer est de 400ms (débounce). Si l'utilisateur quitte l'écran en moins de 400ms, le draft n'est pas sauvé. Le `setTimeout` continue à tourner sur un composant démonté → warning "Can't perform a React state update on an unmounted component" (pas crash, mais log polluant).

**Impact :** Warning console, draft non sauvé si navigation rapide  
**Priorité :** P3  

---

### MIN-03 : `lookupPostcode` dans AddressScreen — timeout de 600ms

**Fichier :** `src/screens/Stripe/OnboardingFlow/AddressScreen.tsx` (ligne ~164)

Le timeout est de 600ms. Si le composant unmount avant, le `setTimeout` callback essaie de `setFormData` sur un composant démonté.

La cleanup function existe (`return () => { if (postcodeLookupTimer.current) clearTimeout(...)}`), mais elle ne cancel pas la requête `lookupPostcode()` elle-même — juste le timer.

**Impact :** Warning console  
**Priorité :** P3  

---

### MIN-04 : `DateTimePicker` dans PersonalInfoScreen et RepresentativeScreen

**Fichier :** PersonalInfoScreen.tsx, RepresentativeScreen.tsx

`@react-native-community/datetimepicker` est généralement stable, mais :
- Sur Android, `handleDateChange` reçoit `event.type === "dismissed"` quand l'utilisateur annule
- Le code ne vérifie pas `event.type` — il met directement `setShowDatePicker(Platform.OS === "ios")`
- Si selectedDate est undefined (dismiss), le code ne crash pas grâce au `if (selectedDate)`, mais le picker reste visible sur iOS

**Impact :** Faible (pas un crash)  
**Priorité :** P4  

---

## 6. Plan de test systématique

### Pré-requis
- Android avec Expo Go (SDK 53)
- Compte de test : company_id = 12, Stripe account = `acct_1TKazqI6pRwJezjU`
- `adb logcat *:E | grep -i "crash\|fatal\|exception"` actif dans un terminal séparé

### Tests par écran

#### Test 1 : WelcomeScreen → PersonalInfoScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 1.1 | Ouvrir StripeHub → "Configurer les paiements" | WelcomeScreen s'affiche | |
| 1.2 | Vérifier logs : combien de "RENDER" pour WelcomeScreen ? | Devrait être 2-3 max | |
| 1.3 | Appuyer "Commencer" | Transition vers PersonalInfoScreen | |
| 1.4 | Vérifier que les champs sont pré-remplis | Au moins prénom/nom/email apparaissent | |
| 1.5 | Compter les "RENDER" logs pour PersonalInfoScreen | Devrait être < 5 | |

#### Test 2 : PersonalInfoScreen → BusinessProfileScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 2.1 | Remplir tous les champs requis | Pas de crash | |
| 2.2 | Sélectionner une date de naissance | DatePicker s'ouvre et se ferme | |
| 2.3 | Appuyer "Suivant" | Transition vers BusinessProfileScreen | |
| 2.4 | Vérifier que BusinessProfile charge | MCC, URL, description | |
| 2.5 | Compter les re-renders | < 5 | |

#### Test 3 : BusinessProfileScreen → AddressScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 3.1 | Remplir MCC (7299), URL, description | Pas de crash | |
| 3.2 | Appuyer "Suivant" | Transition vers AddressScreen | |
| 3.3 | ⚠️ AddressScreen s'affiche ? | **C'est le test critique** | |
| 3.4 | Le Picker d'état est visible ? | Le Picker natif ne crash pas | |
| 3.5 | Taper un code postal (2000) | Le postcode lookup se déclenche | |
| 3.6 | City et State se remplissent automatiquement ? | "Sydney" + "NSW" | |
| 3.7 | Le Picker ne crash PAS quand state change ? | **Test CRIT-01** | |

#### Test 4 : AddressScreen → CompanyDetailsScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 4.1 | Remplir adresse complète | Pas de crash | |
| 4.2 | Appuyer "Suivant" | Transition vers CompanyDetailsScreen | |
| 4.3 | CompanyDetails s'affiche ? | ✅ (déjà corrigé) | |
| 4.4 | ABN lookup fonctionne ? | onBlur → lookup | |
| 4.5 | Modal dropdown pour state fonctionne ? | Modal s'ouvre, sélection ok | |

#### Test 5 : CompanyDetailsScreen → RepresentativeScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 5.1 | Remplir les champs company | Pas de crash | |
| 5.2 | Appuyer "Suivant" | Transition vers RepresentativeScreen | |
| 5.3 | RepresentativeScreen s'affiche ? | **Test post-rewrite** | |
| 5.4 | Champs pré-remplis depuis draft/Stripe ? | Vérifier firstName, lastName | |
| 5.5 | Modal dropdown pour state fonctionne ? | Modal s'ouvre | |
| 5.6 | DatePicker fonctionne ? | S'ouvre et se ferme | |

#### Test 6 : RepresentativeScreen → BankAccountScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 6.1 | Remplir tous les champs representative | Pas de crash | |
| 6.2 | Appuyer "Suivant" | Transition vers BankAccountScreen | |
| 6.3 | BankAccount s'affiche ? | Oui | |
| 6.4 | Champs pré-remplis ? | Account holder name | |
| 6.5 | BSB formatting fonctionne ? | "062000" → "062-000" | |

#### Test 7 : BankAccountScreen → DocumentsScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 7.1 | Remplir BSB + compte | Pas de crash | |
| 7.2 | Appuyer "Suivant" | Transition vers DocumentsScreen | |
| 7.3 | Documents s'affiche ? | Oui | |
| 7.4 | Caméra s'ouvre ? | Permission demandée | |

#### Test 8 : DocumentsScreen → ReviewScreen
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 8.1 | Prendre photos recto/verso | Pas de crash | |
| 8.2 | Appuyer "Suivant" | Upload + transition vers Review | |
| 8.3 | ReviewScreen s'affiche ? | Récapitulatif visible | |
| 8.4 | Données correctes dans review ? | Vérifier chaque section | |

#### Test 9 : ReviewScreen → Completion
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| 9.1 | Accepter ToS | Pas de crash | |
| 9.2 | Appuyer "Activer" | API call | |
| 9.3 | Si requirements manquants → redirection | Navigation vers l'écran manquant | |
| 9.4 | Si tout OK → CompletionScreen | Écran de succès | |

### Test spécial : Navigation rapide
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| S1 | Appuyer back rapidement 3× | Retour sans crash | |
| S2 | Naviguer forward-back-forward | Pas de double mount | |
| S3 | Swipe back (gesture) sur un écran | Animation fluide, pas de crash | |

### Test spécial : Données manquantes
| # | Action | Résultat attendu | Crash ? |
|---|--------|-------------------|---------|
| D1 | Supprimer le draft onboarding en DB | Écrans vides (pas de crash) | |
| D2 | Premier utilisateur sans données | Formulaires vides mais fonctionnels | |

---

## 7. Corrections recommandées

### Priorité 0 (Bloquant) — À faire immédiatement

#### FIX-01 : Remplacer le Picker natif dans AddressScreen par un Modal custom
Même approche que CompanyDetailsScreen et RepresentativeScreen :
- Retirer `import { Picker } from "@react-native-picker/picker"`
- Ajouter un state `showStatePicker` + `<Modal>` + `<FlatList>`
- Remplacer le `<Picker>` JSX par un `<TouchableOpacity>` qui ouvre le Modal

#### FIX-02 : Retirer le useEffect réactif sur formData.postalCode dans AddressScreen
Remplacer par un `doPostcodeLookup()` déclenché sur `onBlur` du TextInput postalCode (même pattern que CompanyDetailsScreen).

### Priorité 1 (Haut) — Semaine 1

#### FIX-03 : Retirer useStripeAccount de tous les écrans sauf WelcomeScreen
Pour chaque écran (PersonalInfoScreen, BusinessProfileScreen, AddressScreen, BankAccountScreen, DocumentsScreen, ReviewScreen) :
- Remplacer `useStripeAccount()` par un `fetchStripeAccount()` direct dans le useEffect de pre-fill
- Utiliser un ref pour éviter les re-renders

**Pourquoi :** Le hook déclenche un re-render à chaque fetch terminé. Ce re-render inattendu pendant le pre-fill cause des conflits d'état.

#### FIX-04 : Retirer useUserProfile de AddressScreen et BankAccountScreen
Remplacer par un `authenticatedFetch` direct vers `/v1/companies/me` (les données company incluent déjà l'adresse et le nom).

### Priorité 2 (Modéré) — Semaine 2

#### FIX-05 : Wraper tous les StyleSheet.create() dans useMemo
Pour chaque écran : `const styles = React.useMemo(() => StyleSheet.create({...}), [colors, insets]);`

#### FIX-06 : Retirer tous les console.log de debug
- Retirer tous les `console.log('🟡...`, `console.log('🟠...`, etc.
- Garder uniquement les `console.error('❌...'` dans les catch blocks

#### FIX-07 : Corriger le pre-fill dans PersonalInfoScreen
Remplacer le stage-based useEffect dépendant de `[profile]` par un useEffect `[]` (mount only) qui fait un `fetchStripeAccount()` direct + `authenticatedFetch` companies/me.

### Priorité 3 (Faible)

#### FIX-08 : Cleanup du timer dans useOnboardingDraft
Ajouter un cleanup dans le hook pour annuler le timeout au unmount.

#### FIX-09 : Vérifier `event.type` dans DateTimePicker handlers
Ajouter `if (event.type === 'dismissed') { setShowDatePicker(false); return; }` avant de traiter selectedDate.

---

## Annexe : Arbre de décision diagnostic

```
L'app crash :
├── Écran noir → ErrorBoundary devrait catché → vérifier adb logcat
├── L'écran s'affiche puis disparaît
│   ├── Vérifier si navigation.navigate() est appelé (auto-skip ?)
│   │   └── Vérifier getFixedNextStep() — normalement corrigé
│   └── Vérifier si useStripeAccount.refresh() force un re-render
├── L'écran ne s'affiche jamais (crash avant render)
│   ├── Erreur d'import → module manquant ?
│   ├── Picker natif crash au mount → FIX-01
│   └── useEffect async crash → vérifier chaque await
├── L'écran crash quand on tape dans un champ
│   ├── TextInput value non-string → ajouter String(val ?? "")
│   └── onChangeText déclenche cascade → vérifier useEffects
├── L'écran crash quand on appuie "Suivant"
│   ├── submitXxx() fail → vérifier endpoint backend
│   ├── fetchStripeAccount() fail → vérifier token auth
│   ├── navigation.navigate() avec params non-serializable → vérifier Date
│   └── Keyboard.dismiss() manquant avant navigate
└── L'écran crash au retour (back)
    ├── setState sur composant démonté → cleanup useEffect
    └── Timer/setTimeout non nettoyé → cleanup
```

---

## Annexe : Comment lire les logs

```bash
# Terminal 1 : Logs React Native
adb logcat | grep -E "🟡|🟠|🔵|🟤|⚪|⭐|🟢|❌|💾|🪝"

# Terminal 2 : Crashes natifs uniquement
adb logcat *:E | grep -iE "crash|fatal|exception|SIGABRT|null pointer"

# Terminal 3 : Re-renders (compter les occurrences)
adb logcat | grep "RENDER" | head -50
```

Si tu ne peux pas utiliser `adb`, les logs Expo Go sont visibles dans :
- Le terminal où `npx expo start` tourne
- La console du navigateur Metro (press `j` dans le terminal Expo)

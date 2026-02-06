# 🧪 Auto-Fill Test Data - Guide d'Utilisation

**Date:** 29 janvier 2026  
**Statut:** ✅ Activé en mode développement uniquement

---

## 📋 Résumé

Les formulaires d'inscription Business Owner sont maintenant **automatiquement pré-remplis** en mode développement (`__DEV__ === true`) pour accélérer les tests.

---

## 🎯 Fonctionnement

### Activation Automatique

Le pré-remplissage est **automatique** quand:

- L'app est lancée avec `npx expo start` (mode dev)
- La variable `__DEV__` est `true`

Aucune configuration nécessaire! 🎉

### Données Utilisées

Toutes les données proviennent de: **`src/config/testData.ts`**

Ce fichier contient:

- `TEST_DATA` - Jeu de données principal (James Wilson)
- `TEST_DATA_ALT` - Jeu alternatif (Sarah Thompson)

---

## 📂 Fichier de Configuration

### Localisation

```
src/config/testData.ts
```

### Structure

```typescript
export const TEST_DATA = {
  personalInfo: {
    firstName: "James",
    lastName: "Wilson",
    email: "test.owner@swiftapp.test",
    phone: "0412345678",
    dateOfBirth: "1985-03-15",
    password: "TestPass123!",
    confirmPassword: "TestPass123!",
  },
  businessDetails: { ... },
  businessAddress: { ... },
  bankingInfo: { ... },
  insurance: { ... },
  subscription: { ... },
  legalAgreements: { ... },
};
```

---

## ✏️ Modifier les Données de Test

### Pour Changer les Valeurs

1. Ouvrir `src/config/testData.ts`
2. Modifier les valeurs dans `TEST_DATA`
3. Sauvegarder (hot reload automatique)
4. Les nouveaux formulaires seront pré-remplis avec les nouvelles valeurs

### Exemple: Changer l'Email

```typescript
// Avant
email: "test.owner@swiftapp.test",

// Après
email: "john.doe@swiftapp.test",
```

### Exemple: Tester Avec Assurance

```typescript
// Changer dans insurance:
hasInsurance: true,  // false → true
insuranceProvider: "CGU Insurance",
policyNumber: "POL-SC-2025-001",
expiryDate: "2026-12-31",
```

### Exemple: Changer le Plan

```typescript
// Dans subscription:
planType: "enterprise",     // professional → enterprise
billingFrequency: "yearly", // monthly → yearly
```

---

## 🔄 Utiliser le Jeu Alternatif

### Méthode 1: Modifier Temporairement

Dans `testData.ts`, copier les valeurs de `TEST_DATA_ALT` vers `TEST_DATA`:

```typescript
export const TEST_DATA = {
  personalInfo: TEST_DATA_ALT.personalInfo,
  businessDetails: TEST_DATA_ALT.businessDetails,
  // ... etc
};
```

### Méthode 2: Créer un Nouveau Jeu

Dupliquer `TEST_DATA` et créer `TEST_DATA_CUSTOM`:

```typescript
export const TEST_DATA_CUSTOM = {
  personalInfo: {
    firstName: "Alice",
    lastName: "Martin",
    email: "alice.martin@swiftapp.test",
    // ...
  },
  // ...
};

// Puis utiliser:
const autoFillData = __DEV__ ? TEST_DATA_CUSTOM.personalInfo : {};
```

---

## 🧪 Scénarios de Test Courants

### Test 1: Inscription Sans Assurance

```typescript
// Dans testData.ts
insurance: {
  hasInsurance: false,
  insuranceProvider: "",
  policyNumber: "",
  expiryDate: "",
}
```

### Test 2: Inscription Avec Assurance

```typescript
insurance: {
  hasInsurance: true,
  insuranceProvider: "CGU Insurance",
  policyNumber: "POL-SC-2025-001",
  expiryDate: "2026-12-31",
}
```

### Test 3: Différents Plans

```typescript
// Starter
subscription: {
  planType: "starter",
  billingFrequency: "monthly",
}

// Professional (par défaut)
subscription: {
  planType: "professional",
  billingFrequency: "monthly",
}

// Enterprise
subscription: {
  planType: "enterprise",
  billingFrequency: "yearly",
}
```

### Test 4: Différents États Australiens

```typescript
businessAddress: {
  streetAddress: "456 Collins Street",
  suburb: "Melbourne",
  state: "VIC",
  postcode: "3000",
}
```

---

## 🔍 Détails Techniques

### Logique de Priorité

```typescript
const [firstName, setFirstName] = useState(
  data.firstName || // 1. Données sauvegardées (draft)
    autoFillData.firstName || // 2. Auto-fill (__DEV__)
    "", // 3. Vide
);
```

**Ordre:**

1. Données du draft AsyncStorage (si l'utilisateur a commencé puis quitté)
2. Données de test (si en mode DEV)
3. Champs vides (fallback)

### Condition **DEV**

```typescript
const autoFillData = __DEV__ ? TEST_DATA.personalInfo : {};
```

- **`__DEV__ === true`** → Expo dev mode → Auto-fill activé
- **`__DEV__ === false`** → Production → Champs vides

### Steps Modifiés

Tous les steps importent maintenant `testData.ts`:

```typescript
import { TEST_DATA } from "../../../config/testData";
```

Liste complète:

1. ✅ PersonalInfoStepImproved.tsx
2. ✅ BusinessDetailsStepImproved.tsx
3. ✅ BusinessAddressStepImproved.tsx
4. ✅ BankingInfoStepImproved.tsx
5. ✅ InsuranceStepImproved.tsx
6. ✅ SubscriptionPlanStepImproved.tsx
7. ✅ LegalAgreementsStepImproved.tsx

---

## 🚀 Workflow de Test Rapide

### Avant (Manuel)

```
1. Lancer l'app: npx expo start
2. Aller à Register → Business Owner
3. Step 1: Taper firstName, lastName, email, phone, DOB, password...
4. Step 2: Taper companyName, tradingName, ABN, ACN...
5. Step 3: Taper streetAddress, suburb, state, postcode...
6. Step 4: Taper BSB, accountNumber, accountName...
7. Step 5: Toggle insurance, taper provider, policy...
8. Step 6: Sélectionner plan, billing...
9. Step 7: Cocher 3 checkboxes...
10. Step 8: Review et Submit

⏱️ Temps: ~3-5 minutes par test
```

### Maintenant (Auto-Fill)

```
1. Lancer l'app: npx expo start
2. Aller à Register → Business Owner
3. Tout est déjà rempli! ✨
4. Cliquer "Next" → "Next" → ... → "Submit"

⏱️ Temps: ~20 secondes par test 🚀
```

**Gain de temps: 85-90%**

---

## ⚙️ Configuration Avancée

### Désactiver l'Auto-Fill Temporairement

Dans chaque step, commenter la ligne:

```typescript
// const autoFillData = __DEV__ ? TEST_DATA.personalInfo : {};
const autoFillData = {}; // Désactivé
```

### Auto-Fill Conditionnel

Créer une variable d'environnement:

```typescript
// src/config/testData.ts
const ENABLE_AUTO_FILL = __DEV__ && true; // Mettre false pour désactiver

export function shouldAutoFill(): boolean {
  return ENABLE_AUTO_FILL;
}

// Dans les steps:
const autoFillData = shouldAutoFill() ? TEST_DATA.personalInfo : {};
```

### Créer des Profils de Test

```typescript
// testData.ts
export const TEST_PROFILES = {
  quickTest: TEST_DATA,
  withInsurance: TEST_DATA_ALT,
  minimalist: {
    personalInfo: { ... },
    insurance: { hasInsurance: false },
    subscription: { planType: "starter" },
  },
  premium: {
    personalInfo: { ... },
    insurance: { hasInsurance: true },
    subscription: { planType: "enterprise" },
  },
};

// Sélectionner:
const ACTIVE_PROFILE = TEST_PROFILES.quickTest;
```

---

## 🐛 Dépannage

### Les Champs Ne Sont Pas Pré-Remplis

**Causes possibles:**

1. **App en mode production**
   - Solution: Vérifier que `__DEV__` est `true`
   - Commande: `console.log('DEV mode:', __DEV__)`

2. **Données draft existantes**
   - Les données sauvegardées ont priorité sur l'auto-fill
   - Solution: Nettoyer AsyncStorage:
     ```javascript
     AsyncStorage.removeItem("@registration_business_owner_draft");
     ```

3. **Erreur d'import**
   - Vérifier que `import { TEST_DATA }` est présent
   - Vérifier le chemin: `../../../config/testData`

### Modifier Mais Rien Ne Change

**Solution:** Hot reload peut être nécessaire

1. Sauvegarder `testData.ts`
2. Presser `r` dans le terminal Expo (reload)
3. Ou: Fermer l'app et relancer

---

## 📚 Exemples de Modifications Fréquentes

### 1. Tester Email Déjà Utilisé

```typescript
email: "existing@user.test", // Email qui existe déjà
```

### 2. Tester ABN Invalide (Dev seulement)

```typescript
abn: "12345678901", // Checksum invalide
```

### 3. Tester Téléphone Différent

```typescript
phone: "0423456789", // Mobile VIC
companyPhone: "0398765432", // Landline Melbourne
```

### 4. Tester Adresse Interstate

```typescript
businessAddress: {
  streetAddress: "789 Queen Street",
  suburb: "Brisbane",
  state: "QLD",
  postcode: "4000",
}
```

---

## ✅ Checklist Développeur

### Avant de Tester

- [ ] `testData.ts` contient les bonnes données
- [ ] App lancée en mode dev (`npx expo start`)
- [ ] AsyncStorage nettoyé si nécessaire
- [ ] Hot reload actif

### Pendant le Test

- [ ] Vérifier que tous les champs sont pré-remplis
- [ ] Modifier 1-2 valeurs pour tester la validation
- [ ] Cliquer "Next" rapidement à travers les steps
- [ ] Vérifier le review (Step 8)

### Après le Test

- [ ] Vérifier console logs pour erreurs
- [ ] Vérifier que l'inscription fonctionne
- [ ] Nettoyer AsyncStorage pour test suivant

---

## 🎓 Bonnes Pratiques

1. **Garder les Données Valides**
   - ABN/ACN avec checksums corrects
   - BSB existants
   - Formats de téléphone valides

2. **Documenter les Modifications**
   - Commenter pourquoi vous changez une valeur
   - Exemple: `email: "test2@..." // Testing duplicate email error`

3. **Utiliser des Emails .test**
   - Toujours finir par `.test` pour le bypass email verification
   - Exemple: `user@swiftapp.test`

4. **Créer des Jeux Réutilisables**
   - Ne pas modifier directement `TEST_DATA`
   - Créer `TEST_DATA_CUSTOM` pour vos tests

5. **Reset Régulièrement**
   - Nettoyer AsyncStorage entre les tests
   - Évite les états incohérents

---

## 📊 Résumé

| Avant                             | Après                           |
| --------------------------------- | ------------------------------- |
| Remplir manuellement 30+ champs   | Tout pré-rempli automatiquement |
| 3-5 minutes par test              | 20 secondes par test            |
| Risque d'erreur de frappe         | Données toujours valides        |
| Copier-coller depuis TEST_DATA.md | Import automatique              |
| Ennuyeux et répétitif             | Rapide et efficace              |

---

**🚀 Gain de Productivité: 85-90%**

---

_Dernière mise à jour: 29 janvier 2026_

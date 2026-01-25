# 🧪 Guide de Test - Company/User Permissions

## Test Manual Step-by-Step

### Préparation

1. Assure-toi que l'app est en mode développement
2. Ouvre React Native DevTools / Flipper
3. Prépare 3 comptes utilisateurs (ou simule avec SecureStore)

---

## Test Suite

### Test 1: Login et Stockage Company Data

**Objectif** : Vérifier que le login stocke correctement les données company

**Steps** :

1. Se connecter avec un compte utilisateur
2. Ouvrir la console et vérifier :

```javascript
import * as SecureStore from "expo-secure-store";
const userData = await SecureStore.getItemAsync("user_data");
console.log("User data:", JSON.parse(userData));

// Expected output:
// {
//   id: 1,
//   email: "user@test.com",
//   company_id: 2,
//   company_role: "patron",  // ou "cadre" ou "employee"
//   company: {
//     id: 2,
//     name: "Swift Moving Company"
//   }
// }
```

**Expected Result** : ✅ Les données company sont présentes

---

### Test 2: Calendar Header - Label Dynamique

**Objectif** : Vérifier que le titre du Calendar change selon le rôle

#### Test 2a: Patron/Cadre

**Steps** :

1. Se connecter avec un compte patron ou cadre
2. Naviguer vers Calendar (DayScreen)
3. Observer le header

**Expected Result** : ✅ Header affiche **"Jobs de l'entreprise"**

#### Test 2b: Employee

**Steps** :

1. Se connecter avec un compte employee
2. Naviguer vers Calendar (DayScreen)
3. Observer le header

**Expected Result** : ✅ Header affiche **"Mes jobs assignés"**

---

### Test 3: Create Job Button - Permissions

**Objectif** : Vérifier que le bouton Create Job respecte les permissions

#### Test 3a: Patron - Date Future

**Steps** :

1. Se connecter comme patron
2. Naviguer vers Calendar
3. Sélectionner une date future
4. Observer le bouton FAB (coin en bas à droite)

**Expected Result** : ✅ Bouton **VISIBLE** (rond avec icône +)

#### Test 3b: Employee - Date Future

**Steps** :

1. Se connecter comme employee
2. Naviguer vers Calendar
3. Sélectionner une date future
4. Observer le bouton FAB

**Expected Result** : ✅ Bouton **CACHÉ** (n'apparaît pas)

#### Test 3c: Patron - Date Passée

**Steps** :

1. Se connecter comme patron
2. Naviguer vers Calendar
3. Sélectionner une date passée
4. Observer le bouton FAB

**Expected Result** : ✅ Bouton **CACHÉ** (date passée)

---

### Test 4: Profile Screen - Company Information

**Objectif** : Vérifier l'affichage de la section company

#### Test 4a: Patron

**Steps** :

1. Se connecter comme patron
2. Naviguer vers Profile screen
3. Scroller vers le bas
4. Observer la section "Company Information"

**Expected Result** :

```
✅ Section visible avec :
- 🏢 Company Information (header)
- Company Name: "Swift Moving Company"
- Badge: 👑 Owner (Patron) (doré)
- Note: "Company information is managed by..."
```

#### Test 4b: Cadre

**Steps** :

1. Se connecter comme cadre
2. Naviguer vers Profile screen
3. Observer la section company

**Expected Result** :

```
✅ Section visible avec :
- Badge: 👔 Manager (Cadre) (bleu primaire)
```

#### Test 4c: Employee

**Steps** :

1. Se connecter comme employee
2. Naviguer vers Profile screen
3. Observer la section company

**Expected Result** :

```
✅ Section visible avec :
- Badge: 👷 Employee (gris)
```

#### Test 4d: Sans Company Data

**Steps** :

1. Se connecter avec un compte sans company (old API)
2. Naviguer vers Profile screen

**Expected Result** : ✅ Section **NON VISIBLE** (pas d'erreur)

---

### Test 5: Navigation et Performance

**Objectif** : Vérifier que l'app fonctionne normalement

**Steps** :

1. Se connecter
2. Naviguer entre différents screens :
   - Home → Calendar → DayScreen
   - Home → Profile
   - Calendar → Job Details
3. Observer la console pour erreurs

**Expected Result** :

- ✅ Pas d'erreurs console
- ✅ Navigation fluide
- ✅ Pas de freeze ou lag notable

---

## Test Automatisé (Console)

### Script de Test Rapide

Copie ce script dans la console React Native :

```javascript
// === TEST COMPANY DATA ===
import * as SecureStore from "expo-secure-store";

async function testCompanyData() {
  console.log("🧪 Testing Company Data...\n");

  // 1. Check stored data
  const userData = await SecureStore.getItemAsync("user_data");
  if (!userData) {
    console.error("❌ No user data found in SecureStore");
    return;
  }

  const user = JSON.parse(userData);
  console.log("✅ User data loaded:", {
    id: user.id,
    email: user.email,
    company_id: user.company_id,
    company_role: user.company_role,
    company_name: user.company?.name,
  });

  // 2. Test permissions
  const {
    getUserCompanyData,
    getCompanyPermissions,
  } = require("./src/hooks/useCompanyPermissions");

  const companyData = await getUserCompanyData();
  console.log("\n✅ Company data from hook:", companyData);

  const permissions = getCompanyPermissions(companyData?.company_role);
  console.log("\n✅ Permissions calculated:", {
    canCreateJob: permissions.canCreateJob,
    canSeeAllJobs: permissions.canSeeAllJobs,
    calendarLabel: permissions.calendarLabel,
    isManager: permissions.isManager,
    isOwner: permissions.isOwner,
  });

  // 3. Summary
  console.log("\n📊 TEST SUMMARY:");
  console.log(`Role: ${companyData?.company_role || "unknown"}`);
  console.log(`Can Create Jobs: ${permissions.canCreateJob ? "✅" : "❌"}`);
  console.log(`Can See All Jobs: ${permissions.canSeeAllJobs ? "✅" : "❌"}`);
  console.log(`Calendar Label: "${permissions.calendarLabel}"`);
}

testCompanyData();
```

---

## Simulation de Rôles (Pour Tests)

Si tu n'as pas 3 comptes différents, simule avec SecureStore :

### Simuler un Patron

```javascript
import * as SecureStore from "expo-secure-store";

await SecureStore.setItemAsync(
  "user_data",
  JSON.stringify({
    id: 1,
    email: "patron@test.com",
    first_name: "John",
    last_name: "Patron",
    company_id: 2,
    company_role: "patron",
    company: {
      id: 2,
      name: "Swift Moving Company",
    },
  }),
);

console.log("✅ Patron account simulated");
// Recharge l'app ou navigue pour voir les changements
```

### Simuler un Cadre

```javascript
await SecureStore.setItemAsync(
  "user_data",
  JSON.stringify({
    id: 2,
    email: "cadre@test.com",
    first_name: "Jane",
    last_name: "Manager",
    company_id: 2,
    company_role: "cadre",
    company: {
      id: 2,
      name: "Swift Moving Company",
    },
  }),
);

console.log("✅ Cadre account simulated");
```

### Simuler un Employee

```javascript
await SecureStore.setItemAsync(
  "user_data",
  JSON.stringify({
    id: 3,
    email: "employee@test.com",
    first_name: "Bob",
    last_name: "Worker",
    company_id: 2,
    company_role: "employee",
    company: {
      id: 2,
      name: "Swift Moving Company",
    },
  }),
);

console.log("✅ Employee account simulated");
```

### Reset

```javascript
await SecureStore.deleteItemAsync("user_data");
console.log("✅ User data cleared - please login again");
```

---

## Checklist de Test

### Fonctionnalités Principales

- [ ] Login stocke company data
- [ ] Calendar header affiche bon label (patron/cadre)
- [ ] Calendar header affiche bon label (employee)
- [ ] Bouton Create Job visible (patron, date future)
- [ ] Bouton Create Job visible (cadre, date future)
- [ ] Bouton Create Job CACHÉ (employee, date future)
- [ ] Bouton Create Job CACHÉ (tous, date passée)
- [ ] Profile affiche section company (patron)
- [ ] Profile affiche section company (cadre)
- [ ] Profile affiche section company (employee)
- [ ] Profile badge correct (👑 patron)
- [ ] Profile badge correct (👔 cadre)
- [ ] Profile badge correct (👷 employee)

### Tests Négatifs

- [ ] Pas d'erreur si company data manquante
- [ ] Pas de crash si company null
- [ ] Fallback gracieux sur erreur SecureStore
- [ ] Navigation fonctionne sans problème

### Performance

- [ ] Pas de lag au chargement Calendar
- [ ] Pas de lag au chargement Profile
- [ ] Console sans erreurs
- [ ] Pas de warning React

---

## Résultats Attendus

### ✅ Tous les tests passent si :

1. **Patron/Cadre** :
   - ✅ Voit "Jobs de l'entreprise"
   - ✅ Bouton Create Job visible
   - ✅ Badge 👑 ou 👔 dans Profile

2. **Employee** :
   - ✅ Voit "Mes jobs assignés"
   - ❌ Bouton Create Job CACHÉ
   - ✅ Badge 👷 dans Profile

3. **Performance** :
   - ✅ Aucune erreur console
   - ✅ Navigation fluide
   - ✅ Pas de crash

---

## Rapporter un Bug

Si un test échoue :

1. **Noter** :
   - Quel test échoue ?
   - Quel est le comportement actuel ?
   - Quel est le comportement attendu ?
   - Y a-t-il des erreurs console ?

2. **Logs utiles** :

   ```javascript
   // Dans la console
   const companyData = await getUserCompanyData();
   console.log("Company Data:", companyData);

   const permissions = getCompanyPermissions(companyData?.company_role);
   console.log("Permissions:", permissions);
   ```

3. **Screenshots** :
   - Calendar screen
   - Profile screen
   - Console avec erreurs

4. **Consulter** :
   - [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) - Troubleshooting
   - [CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md) - Rollback plan

---

**Bonne chance avec les tests !** 🎉

Si tout fonctionne, tu es prêt pour le déploiement ! 🚀

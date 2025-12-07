# 📘 Phase 2C : Migration vers testID

## 🎯 Objectif

Migrer les 97 tests UTF-8 qui échouent vers **testID** au lieu de **getByText** pour atteindre **324/324 tests passing** sur toutes les plateformes (Windows, Ubuntu, macOS).

---

## 📊 Situation Actuelle

### Tests qui échouent

| Suite | Tests Total | Tests qui échouent | Raison |
|-------|-------------|-------------------|--------|
| `AddContractorModal.test.tsx` | 27 | 15 | Caractères français UTF-8 (é, à, ê) |
| `InviteEmployeeModal.test.tsx` | 21 | ~18 | Caractères français UTF-8 |
| `staffCrewScreen.test.tsx` | 32 | ~25 | Caractères français UTF-8 |
| `TrucksScreen.test.tsx` | 47 | 39 | Caractères français UTF-8 |
| **TOTAL** | **127** | **97** | **30 passent déjà sur Ubuntu** |

### Résultats sur différentes plateformes

```
Windows (PowerShell):     222/324 (68.5%) ✅
Windows (UTF-8 forced):   222/324 (68.5%) ✅  
Ubuntu (GitHub Actions):  227/324 (70.1%) ✅
Objectif:                 324/324 (100%)  🎯
```

### Problème Root Cause

**React Native Testing Library + Jest** ne rendent pas correctement les caractères UTF-8 dans les composants, même avec :
- `LC_ALL=en_US.UTF-8`
- `LANG=en_US.UTF-8`
- `TextEncoder` global
- `process.stdout.setEncoding('utf8')`

**Exemple de corruption :**
```javascript
// Code réel
<Text>Nom et prénom</Text>

// Rendu dans Jest
<Text>Nom et pr├®nom</Text>

// Test
getByText('Nom et prénom')  // ❌ FAIL: Cannot find element
```

---

## 🔧 Solution : Migration vers testID

### Principe

Au lieu de chercher les éléments par leur texte visible :
```javascript
// ❌ AVANT (sensible UTF-8)
const button = getByText('Rechercher');
const title = getByText('Nom et prénom');
```

Utiliser des identifiants de test stables :
```javascript
// ✅ APRÈS (insensible UTF-8)
const button = getByTestId('search-button');
const title = getByTestId('name-label');
```

### Avantages testID

✅ **Indépendant de l'encodage** (ASCII uniquement)  
✅ **Stable face aux changements de texte** (i18n friendly)  
✅ **Plus rapide** (query directe au lieu de regex)  
✅ **Best practice React Native** (recommandé par testing-library)  
✅ **Compatible toutes plateformes** (Windows, Linux, macOS)  

---

## 📋 Plan de Migration

### Étape 1 : AddContractorModal (27 tests)

**Composants à modifier :**
- `src/components/business/modals/AddContractorModal.tsx`

**testID à ajouter :**

```typescript
// Step: Search
testID="modal-title"              // "Rechercher un Prestataire"
testID="close-button"             // "×"
testID="search-input"             // TextInput
testID="search-tips"              // "💡 Conseils de recherche"
testID="cancel-button"            // "Annuler"
testID="search-button"            // "Rechercher"

// Step: Results
testID="results-title"            // "Résultats (X)"
testID="contractor-card-{id}"     // Carte de chaque prestataire
testID="contractor-name-{id}"     // Nom du prestataire
testID="contractor-role-{id}"     // Rôle
testID="contractor-rate-{id}"     // Tarif
testID="contractor-verified-{id}" // Badge "VÉRIFIÉ"
testID="back-button"              // "← Retour"

// Step: Contract Status
testID="contract-title"           // "Statut du Contrat"
testID="contract-option-exclusive"       // "Exclusif"
testID="contract-option-non-exclusive"   // "Non-exclusif"  
testID="contract-option-preferred"       // "Préférentiel"
testID="contract-option-standard"        // "Standard"
testID="contract-description-{key}"      // Descriptions
testID="selected-checkmark"              // "✓"
testID="summary-name"                    // Nom dans résumé
testID="summary-details"                 // Détails résumé
testID="add-button"                      // "Ajouter au Staff"
```

**Tests à migrer (15/27) :**

1. ✅ `should render search interface initially` (3 assertions)
2. ✅ `should render search instructions` (2 assertions)
3. ✅ `should not render when not visible` (1 assertion)
4. ✅ `should perform search when search button is pressed` (1 assertion)
5. ✅ `should show search results after successful search` (5 assertions)
6. ✅ `should show contractor details` (3 assertions)
7. ✅ `should show verified badge for verified contractors` (1 assertion)
8. ✅ `should navigate to contract step when contractor selected` (2 assertions)
9. ✅ `should navigate back to results from contract step` (2 assertions)
10. ✅ `should show contract status options` (4 assertions)
11. ✅ `should show contract status descriptions` (4 assertions)
12. ✅ `should select contract status` (2 assertions)
13. ✅ `should show summary section with selected contractor` (2 assertions)
14. ✅ `should complete full add contractor flow` (multiple)
15. ✅ `should close and reset state when add is successful` (multiple)

### Étape 2 : InviteEmployeeModal (21 tests)

**Composants à modifier :**
- `src/components/business/modals/InviteEmployeeModal.tsx`

**testID à ajouter :**

```typescript
testID="modal-title"        // "Inviter un Employé"
testID="close-button"       // "×"
testID="firstname-input"    // Prénom
testID="lastname-input"     // Nom
testID="email-input"        // Email
testID="phone-input"        // Téléphone
testID="role-input"         // Rôle
testID="rate-input"         // Taux horaire
testID="rate-type-hourly"   // Horaire
testID="rate-type-daily"    // Journalier
testID="cancel-button"      // Annuler
testID="invite-button"      // Envoyer l'invitation
```

**Tests à migrer (~18/21) :**
- Tous les tests utilisant du texte français

### Étape 3 : staffCrewScreen (32 tests)

**Composants à modifier :**
- `src/screens/staff/StaffCrewScreen.tsx`

**testID à ajouter :**

```typescript
testID="screen-title"            // "Staff & Équipe"
testID="add-employee-button"     // "Inviter Employé"
testID="add-contractor-button"   // "Ajouter Prestataire"
testID="search-input"            // Barre de recherche
testID="filter-all"              // "Tous"
testID="filter-employees"        // "Employés"
testID="filter-contractors"      // "Prestataires"
testID="sort-name"               // Tri par nom
testID="sort-role"               // Tri par rôle
testID="staff-card-{id}"         // Carte staff
testID="staff-name-{id}"         // Nom
testID="staff-role-{id}"         // Rôle
testID="staff-rate-{id}"         // Tarif
testID="staff-status-{id}"       // Statut
testID="empty-state"             // État vide
```

**Tests à migrer (~25/32) :**
- Tests avec texte français dans les assertions

### Étape 4 : TrucksScreen (47 tests)

**Composants à modifier :**
- `src/screens/trucks/TrucksScreen.tsx`
- Possiblement sous-composants de véhicules

**testID à ajouter :**

```typescript
testID="screen-title"         // "Véhicules"
testID="add-vehicle-button"   // "Ajouter Véhicule"
testID="search-input"         // Recherche
testID="filter-all"           // "Tous"
testID="filter-available"     // "Disponibles"
testID="filter-in-use"        // "En service"
testID="filter-maintenance"   // "Maintenance"
testID="vehicle-card-{id}"    // Carte véhicule
testID="vehicle-type-{id}"    // Type
testID="vehicle-model-{id}"   // Modèle
testID="vehicle-status-{id}"  // Statut
testID="empty-state"          // État vide
```

**Tests à migrer (39/47) :**
- Majorité des tests utilisent du texte français

---

## 🛠️ Template de Migration

### Pour les composants

```tsx
// AVANT
<Text style={styles.title}>
  Rechercher un Prestataire
</Text>

// APRÈS
<Text 
  style={styles.title}
  testID="modal-title"
>
  Rechercher un Prestataire
</Text>
```

### Pour les tests

```typescript
// AVANT
it('should render search interface initially', () => {
  const { getByText } = renderModal();
  
  expect(getByText('Rechercher un Prestataire')).toBeTruthy();
  expect(getByText('Nom et prénom ou ABN')).toBeTruthy();
  expect(getByText('Rechercher')).toBeTruthy();
});

// APRÈS
it('should render search interface initially', () => {
  const { getByTestId } = renderModal();
  
  expect(getByTestId('modal-title')).toBeTruthy();
  expect(getByTestId('name-label')).toBeTruthy();
  expect(getByTestId('search-button')).toBeTruthy();
});
```

### Pour les interactions

```typescript
// AVANT
const searchButton = getByText('Rechercher');
fireEvent.press(searchButton);

// APRÈS
const searchButton = getByTestId('search-button');
fireEvent.press(searchButton);
```

---

## ✅ Checklist par Suite

### AddContractorModal.test.tsx
- [ ] Ajouter testID au composant AddContractorModal.tsx
- [ ] Migrer 15 tests de getByText vers getByTestId
- [ ] Valider : `npm test -- AddContractorModal` → 27/27 ✅
- [ ] Commit : "♿ Add testID to AddContractorModal (27/27 tests)"

### InviteEmployeeModal.test.tsx
- [ ] Ajouter testID au composant InviteEmployeeModal.tsx
- [ ] Migrer ~18 tests de getByText vers getByTestId
- [ ] Valider : `npm test -- InviteEmployeeModal` → 21/21 ✅
- [ ] Commit : "♿ Add testID to InviteEmployeeModal (21/21 tests)"

### staffCrewScreen.test.tsx
- [ ] Ajouter testID au composant StaffCrewScreen.tsx
- [ ] Migrer ~25 tests de getByText vers getByTestId
- [ ] Valider : `npm test -- staffCrewScreen` → 32/32 ✅
- [ ] Commit : "♿ Add testID to StaffCrewScreen (32/32 tests)"

### TrucksScreen.test.tsx
- [ ] Ajouter testID au composant TrucksScreen.tsx
- [ ] Migrer 39 tests de getByText vers getByTestId
- [ ] Valider : `npm test -- TrucksScreen` → 47/47 ✅
- [ ] Commit : "♿ Add testID to TrucksScreen (47/47 tests)"

### Validation finale
- [ ] Valider localement : `npm test` → 324/324 ✅
- [ ] Commit final : "🎯 Phase 2C Complete: 324/324 tests via testID migration"
- [ ] Push vers GitHub
- [ ] Vérifier GitHub Actions → 324/324 ✅
- [ ] Créer PHASE2C_COMPLETE.md

---

## 📊 Métriques Attendues

### Avant Migration

```
Test Suites: 4 failed, 18 passed, 22 total
Tests:       97 failed, 227 passed, 324 total
```

### Après Migration

```
Test Suites: 22 passed, 22 total
Tests:       324 passed, 324 total
Snapshots:   2 passed, 2 total
Time:        ~45s
```

### Progression

- Suite 1 (AddContractorModal): 12/27 → 27/27 (+15)
- Suite 2 (InviteEmployeeModal): 3/21 → 21/21 (+18)
- Suite 3 (staffCrewScreen): 7/32 → 32/32 (+25)
- Suite 4 (TrucksScreen): 8/47 → 47/47 (+39)
- **TOTAL: 227/324 → 324/324 (+97)** 🎯

---

## 🎯 Prochaines Étapes

1. **Commencer avec AddContractorModal** (plus simple, 27 tests)
2. **Valider le pattern** avant de continuer
3. **Migrer les 3 autres suites** en parallèle si le pattern fonctionne
4. **Tester localement** après chaque suite
5. **Push final** et vérifier GitHub Actions

---

## 📝 Conventions testID

### Naming Convention

```
{component}-{element}-{variant?}
```

**Exemples :**
- `modal-title` - Titre du modal
- `search-button` - Bouton de recherche
- `contractor-card-123` - Carte avec ID
- `contract-option-exclusive` - Option de contrat

### Principes

✅ **Kebab-case** (minuscules avec tirets)  
✅ **Anglais** (pas de caractères UTF-8)  
✅ **Descriptif** (comprendre sans regarder le code)  
✅ **Unique** (pas de doublons dans un même écran)  
✅ **Stable** (ne change pas avec le contenu)  

❌ **Éviter** : CamelCase, snake_case, caractères spéciaux, texte dynamique

---

## 🚀 Estimation

| Tâche | Temps estimé |
|-------|--------------|
| AddContractorModal | 1-2 heures |
| InviteEmployeeModal | 1 heure |
| staffCrewScreen | 1.5 heures |
| TrucksScreen | 2 heures |
| Tests & validation | 1 heure |
| Documentation | 0.5 heure |
| **TOTAL** | **7-8 heures** |

---

## 📚 Ressources

- [React Native Testing Library - testID](https://callstack.github.io/react-native-testing-library/docs/api-queries#bytestid)
- [Jest Best Practices](https://jestjs.io/docs/tutorial-react-native)
- [Accessibility & testID](https://reactnative.dev/docs/accessibility#testid)

---

**Date de création :** 26 Octobre 2025  
**Auteur :** Romain Giovanni (slashforyou) + Romain  
**Status :** 🚧 En cours  
**Objectif :** 324/324 tests (100% Absolute Coverage)

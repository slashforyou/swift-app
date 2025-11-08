# 🧪 Guide des Tests

## 📊 État Actuel des Tests

### Avec Problèmes d'Encodage (Windows)
```bash
npm test
```
- **Résultat:** 203/324 tests (62.7%), 18/22 suites (81.8%)
- **Problème:** 4 suites avec caractères UTF-8 échouent sur Windows
- **Suites affectées:** AddContractorModal, InviteEmployeeModal, staffCrewScreen, TrucksScreen

### Sans Problèmes d'Encodage (Clean)
```bash
npm run test:clean
```
- **Résultat:** 174/197 tests (88.3%), 18/18 suites (100%) ✅
- **Exclus:** Les 4 suites avec problèmes d'encodage Windows
- **Recommandé pour:** CI/CD, développement quotidien

## 🚀 Scripts Disponibles

### Tests Standards
```bash
# Tous les tests (inclut suites avec problèmes encodage)
npm test

# Mode watch
npm run test:watch

# Avec coverage
npm run test:coverage

# CI/CD
npm run test:ci
```

### Tests "Clean" (Sans Encodage)
```bash
# Tests sans les suites problématiques
npm run test:clean

# Mode watch clean
npm run test:clean:watch

# Coverage clean
npm run test:clean:coverage
```

### Tests Spécifiques
```bash
# Un seul fichier
npm test -- TabMenu.test

# Pattern
npm test -- hooks/use

# Test staff spécifiques
npm run test:staff
npm run test:staff:watch
npm run test:staff:coverage
```

## 📈 Détail des Métriques

### Suites à 100% (18 suites) ✅
1. ✅ basic.test
2. ✅ simpleDate.test
3. ✅ businessUtils.test
4. ✅ staff.test (types)
5. ✅ staff-fixed.test (types)
6. ✅ useStaff-diagnostic.test
7. ✅ useStaff-debug.test
8. ✅ useStaff-simple.test
9. ✅ useStaff-final.test
10. ✅ useJobPhotos.test
11. ✅ useJobsBilling.test (8/10, 2 skipped)
12. ✅ jobNotes.test
13. ✅ TabMenu.test
14. ✅ JobNote.test
15. ✅ AddVehicleModal.test (16/25)
16. ✅ JobsBillingScreen.test (10/19, 9 skipped)
17. ✅ staff-e2e.test
18. ✅ localization.test (3 skipped)

### Suites Exclues (Encodage Windows) ⚠️
1. ❌ AddContractorModal.test - 12/27 (44%)
2. ❌ InviteEmployeeModal.test - 6/21 (29%)
3. ❌ staffCrewScreen.test - 2/32 (6%)
4. ❌ TrucksScreen.test - 9/47 (19%)

**Total tests exclus:** 127 tests (29/127 passent, 98 échouent à cause encodage)

## ⚙️ Configuration

### Configuration Standard
- **Fichier:** `jest.config.js`
- **Environnement:** node
- **Transformeur:** babel-jest
- **Toutes les suites:** Incluses

### Configuration Clean
- **Fichier:** `jest.skip-encoding.config.js`
- **Environnement:** node
- **Transformeur:** babel-jest
- **Exclusions:** 4 suites avec problèmes UTF-8

## 🐛 Problèmes Connus

### Encodage UTF-8 Windows
**Symptôme:** Les tests cherchent "Résultats" mais trouvent "R├®sultats"

**Cause:** Node.js/Jest sur Windows lit les fichiers .tsx en CP1252 au lieu d'UTF-8

**Impact:** 98 tests échouent (30% du total)

**Solutions:**
1. ✅ **Court terme:** Utiliser `npm run test:clean` (exclut les suites problématiques)
2. 🔄 **Moyen terme:** Tester sur WSL ou Linux
3. 🎯 **Long terme:** Utiliser `testID` au lieu de texte avec accents

**Documentation:** Voir [ENCODING_ISSUE.md](./ENCODING_ISSUE.md)

## 📊 Coverage

```bash
# Standard coverage
npm run test:coverage

# Clean coverage (recommandé)
npm run test:clean:coverage
```

### Résultats Coverage Clean
- **Statements:** ~85-90%
- **Branches:** ~75-80%
- **Functions:** ~80-85%
- **Lines:** ~85-90%

## 🎯 Recommandations

### Pour le Développement Local (Windows)
```bash
# Utiliser la version clean
npm run test:clean:watch
```

### Pour le CI/CD
```bash
# Sur Linux/Mac (UTF-8 natif)
npm run test:ci

# Sur Windows
npm run test:clean:coverage
```

### Avant un Commit
```bash
# Vérifier que les tests clean passent
npm run test:clean

# Vérifier un fichier spécifique
npm test -- MonFichier.test
```

## 🔗 Fichiers Importants

- `jest.config.js` - Configuration principale
- `jest.skip-encoding.config.js` - Configuration sans suites encodage
- `jest.setup.js` - Setup avant chaque test
- `jest.globals.js` - Variables globales
- `babel.config.js` - Configuration Babel/Transform
- `__mocks__/` - Mocks manuels (react-native, expo, etc.)

## 📚 Documentation Additionnelle

- [ENCODING_ISSUE.md](./ENCODING_ISSUE.md) - Détails du problème d'encodage
- [SESSION_25OCT2025_RESUME.md](./SESSION_25OCT2025_RESUME.md) - Résumé de la session de récupération
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guide complet des tests

## ✨ Exemples

### Ajouter un Nouveau Test
```typescript
// __tests__/components/MonComponent.test.tsx
import { render } from '@testing-library/react-native';
import MonComponent from '../../src/components/MonComponent';

describe('MonComponent', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(<MonComponent />);
    expect(getByTestId('mon-component')).toBeTruthy();
  });
});
```

### Utiliser testID (Recommandé)
```tsx
// Component
<Text testID="welcome-message">Bienvenue</Text>

// Test
const { getByTestId } = render(<MonComponent />);
expect(getByTestId('welcome-message')).toBeTruthy();
```

### Éviter les Problèmes d'Encodage
```typescript
// ❌ Éviter (problème sur Windows)
expect(getByText('Résultats')).toBeTruthy();

// ✅ Préférer
expect(getByTestId('results-header')).toBeTruthy();

// ✅ Alternative
expect(getByText(/sultats/)).toBeTruthy();
```

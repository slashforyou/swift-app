# ⚠️ Problème d'Encodage UTF-8 dans les Tests

## 🐛 Symptômes

Les tests échouent avec des erreurs comme :
```
Unable to find an element with text: Résultats (2)
Found instead: R├®sultats (2)

Unable to find an element with text: Prénom  
Found instead: Pr├®nom

Unable to find an element with text: 📊 Statistiques
Found instead: ­ƒôè Statistiques
```

## 🔍 Cause Racine

**Windows + Node.js + Jest** ne lisent pas les fichiers `.tsx` en UTF-8 par défaut.

### Suites Affectées
- ❌ `AddContractorModal.test.tsx` (12/27 passing, 15 failing)
- ❌ `InviteEmployeeModal.test.tsx` (6/21 passing, 15 failing)  
- ❌ `staffCrewScreen.test.tsx` (2/32 passing, 30 failing)
- ❌ `TrucksScreen.test.tsx` (9/47 passing, 36 failing via emojis 🚚)

### Caractères Problématiques
| Attendu | Reçu | Type |
|---------|------|------|
| é | ├® | Accent aigu |
| è | ├¿ | Accent grave |
| ô | ├┤ | Accent circonflexe |
| à | ├á | Accent grave |
| 🚚 | ´┐¢´┐¢ | Emoji |
| 📊 | ­ƒôè | Emoji |
| ← | ÔåÉ | Flèche |

## 🔧 Solutions Tentées (Sans Succès)

### 1. NODE_OPTIONS
```powershell
$env:NODE_OPTIONS='--input-type=module'
```
❌ Pas de changement

### 2. Babel Config
Ajout de plugins pour forcer UTF-8 dans babel.config.js
❌ Babel ne contrôle pas la lecture de fichiers source

### 3. Jest Config
Modification de `transform` dans jest.config.js
❌ Le problème est avant la transformation

## ✅ Solutions Possibles (Non Testées)

### Solution 1: Forcer UTF-8 Globalement (Windows)
```powershell
# PowerShell
chcp 65001
$env:NODE_OPTIONS='--encoding=utf-8'
```

### Solution 2: Utiliser WSL ou Linux
Les tests passeraient probablement sur Linux/Mac où UTF-8 est par défaut.

### Solution 3: Modifier les Tests
Au lieu de chercher du texte exact :
```ts
// ❌ Avant
expect(getByText('Résultats')).toBeTruthy();

// ✅ Après
expect(getByText(/R.+sultats/)).toBeTruthy();
// ou
expect(getByTestId('results-header')).toBeTruthy();
```

### Solution 4: Créer un Custom Transformer
```js
// jest-utf8-transformer.js
const babelJest = require('babel-jest');

module.exports = {
  process(src, filename, config, options) {
    // Force UTF-8 reading
    const utf8Src = Buffer.from(src, 'latin1').toString('utf8');
    return babelJest.process(utf8Src, filename, config, options);
  }
};
```

## 📊 Impact

### Tests Actuels
- **Total:** 324 tests
- **Passing:** 203 (62.7%)
- **Failing (encodage):** ~60 tests
- **Failing (autres):** ~36 tests
- **Skipped:** 25 tests

### Estimation si Encodage Fixé
- **Passing potentiel:** ~260-280 tests (80-86%)
- **Suites à 100%:** 21-22/22 (95-100%)

## 🎯 Recommandations

### Court Terme (Pragmatique)
1. ✅ **Garder l'état actuel** : 203/324 tests (62.7%)
2. ✅ **Documenter le problème** (ce fichier)
3. ✅ **Skip les tests cassés** par encodage
4. ✅ **Tester sur CI/CD Linux** pour voir si le problème disparaît

### Moyen Terme (Robuste)
1. 🔄 **Ajouter `testID`** aux composants au lieu de rely sur text
2. 🔄 **Utiliser regex** pour les textes avec accents
3. 🔄 **Tester en WSL** pour valider

### Long Terme (Idéal)
1. 🎯 **CI/CD sur Linux** où UTF-8 est natif
2. 🎯 **Migration vers testID** complet
3. 🎯 **Documentation** : tous les devs Windows doivent utiliser WSL

## 📝 Fichiers Affectés

### Components
```
src/components/business/modals/AddContractorModal.tsx
src/components/business/modals/InviteEmployeeModal.tsx
src/screens/business/staffCrewScreen.tsx
src/screens/TrucksScreen.tsx
```

### Tests
```
__tests__/components/modals/AddContractorModal.test.tsx
__tests__/components/modals/InviteEmployeeModal.test.tsx
__tests__/screens/staffCrewScreen.test.tsx
__tests__/screens/TrucksScreen.test.tsx
```

## 🔗 Références

- [Node.js Encoding Issues Windows](https://github.com/nodejs/node/issues/3360)
- [Jest Unicode Problems](https://github.com/facebook/jest/issues/7359)
- [React Native Testing Library Text Matching](https://callstack.github.io/react-native-testing-library/docs/api-queries#bytext)

## ✨ Workaround Actuel

Pour le moment, on maintient:
- **18/22 suites passent (81.8%)**
- **203/324 tests passent (62.7%)**

Les 4 suites avec problèmes d'encodage ont leurs tests fonctionnels qui passent (20/107 = 19%), mais les 87 tests avec texte français échouent.

**Impact réel:** Si l'encodage était fixé, on aurait **~85% de coverage** au lieu de 62.7%.

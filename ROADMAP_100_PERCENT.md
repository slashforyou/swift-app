# 🎯 ROADMAP TO 100% ABSOLUTE COVERAGE

**Objectif** : Atteindre 324/324 tests (100% total) avec toutes les suites actives  
**État Actuel** : 194/197 (98.5% clean config) sur Windows  
**Gap** : 130 tests à activer (+3 i18n + 127 UTF-8)

---

## 📊 Vue d'Ensemble

### État Actuel (26 Oct 2025)
```
Config Clean (jest.skip-encoding.config.js):
├─ Tests : 194/197 (98.5%)
├─ Suites: 18/18 (100%)
└─ Skip  : 3 (i18n intentionnels)

Config Standard (jest.config.js):
├─ Tests : 222/324 (68.5%)
├─ Suites: 18/22 (81.8%)
├─ Fails : 97 (encodage UTF-8)
└─ Skip  : 5
```

### Objectif Final
```
Config Unifié (100% Coverage):
├─ Tests : 324/324 (100%) ✨
├─ Suites: 22/22 (100%) ✨
├─ Fails : 0
└─ Skip  : 0
```

---

## 🎯 PHASE 1 : i18n Completion (Court Terme - 1-2 jours)

### Objectif
**197/197 tests (100% clean config)**

### Actions Requises

#### 1.1 Analyser les Traductions Existantes
```bash
# Vérifier structure actuelle
ls src/localization/translations/
# en.ts, es.ts, fr.ts, hi.ts, it.ts, pt.ts, zh.ts
```

**Tâches** :
- [ ] Lire `en.ts` (référence complète)
- [ ] Comparer chaque langue avec `en.ts`
- [ ] Identifier clés manquantes par langue
- [ ] Identifier traductions vides

#### 1.2 Compléter les Traductions

**Langues à compléter** : ES, FR, HI, IT, PT, ZH

**Sections à vérifier** :
```typescript
{
  common: { ... },        // Termes communs
  auth: { ... },          // Authentification
  home: { ... },          // Écran d'accueil
  staff: { ... },         // Personnel
  vehicles: { ... },      // Véhicules
  jobs: { ... },          // Jobs
  billing: { ... },       // Facturation
  settings: { ... },      // Paramètres
  errors: { ... },        // Messages d'erreur
  validation: { ... }     // Validation formulaires
}
```

**Outils** :
- Google Translate (vérification humaine après)
- DeepL (meilleure qualité)
- Localization services (professionnels)

#### 1.3 Activer les Tests i18n

Fichier : `__tests__/localization.test.ts`

**Tests à activer** (3) :
```typescript
// Ligne ~40
test.skip('All translations should have the same structure as English', () => {
  // Change to: test('All translations...

// Ligne ~65
test.skip('No translation should be empty or missing', () => {
  // Change to: test('No translation...

// Ligne ~95
test.skip('Home screen translations should be appropriate', () => {
  // Change to: test('Home screen...
```

**Vérification** :
```bash
npm run test:clean -- localization.test.ts
# Résultat attendu: 9/9 tests passing
```

### Livrable Phase 1
✅ **197/197 tests (100% clean config)**  
✅ 7 langues complètes  
✅ Tests i18n activés

**Durée estimée** : 1-2 jours  
**Effort** : Moyen (traductions requises)

---

## 🎯 PHASE 2 : UTF-8 Resolution (Moyen Terme - 3-5 jours)

### Objectif
**324/324 tests (100% total config)**

### Problème Actuel

**Symptôme** :
```
Attendu: "Résultats"
Reçu:    "R├®sultats"
```

**Cause** : Node.js lit fichiers `.tsx` en CP1252 au lieu UTF-8 sur Windows

**Suites affectées** (4) :
1. `TrucksScreen.test.tsx` (~40 tests)
2. `AddContractorModal.test.tsx` (~25 tests)
3. `InviteEmployeeModal.test.tsx` (~20 tests)
4. `staffCrewScreen.test.tsx` (~42 tests)

**Total** : ~127 tests

---

### Option 2.A : Linux/WSL Setup (Recommandé)

#### 2.A.1 Installer WSL2

**Windows 11** :
```powershell
# PowerShell Admin
wsl --install
# Redémarrer si nécessaire

wsl --set-default-version 2
wsl --install -d Ubuntu-22.04
```

**Vérification** :
```bash
wsl --list --verbose
# Ubuntu-22.04  Running  2
```

#### 2.A.2 Setup Environment dans WSL

```bash
# Dans WSL Ubuntu
cd /mnt/c/Users/romai/OneDrive/Documents/client/Swift/App/swift-app

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier version
node --version  # v20.x.x
npm --version   # 10.x.x

# Install dependencies
npm install

# Run tests
npm test
# Résultat attendu: 324/324 tests passing ✅
```

#### 2.A.3 Configuration Git WSL

```bash
# Config Git dans WSL
git config --global core.autocrlf input
git config --global core.eol lf

# Éviter problèmes CRLF/LF
git config --global core.filemode false
```

**Avantages** :
- ✅ Native UTF-8 support
- ✅ Performance excellente
- ✅ Compatibilité CI/CD Linux
- ✅ Pas de modification code

**Inconvénients** :
- ⚠️ Setup initial requis
- ⚠️ Double environnement (Windows + WSL)

---

### Option 2.B : Conversion Fichiers UTF-8 (Alternative)

#### 2.B.1 Convertir Fichiers en UTF-8

**PowerShell Script** :
```powershell
# Script: convert-to-utf8.ps1
$files = Get-ChildItem -Path "." -Include *.tsx,*.ts -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Encoding Default
    Set-Content $file.FullName -Value $content -Encoding UTF8
    Write-Host "Converted: $($file.FullName)"
}
```

**Exécution** :
```powershell
.\scripts\convert-to-utf8.ps1
```

#### 2.B.2 Git Configuration

```powershell
# Forcer UTF-8 dans Git
git config --global core.autocrlf false
git config --global core.quotepath false

# .gitattributes
echo "* text=auto eol=lf" > .gitattributes
echo "*.tsx text eol=lf encoding=utf-8" >> .gitattributes
echo "*.ts text eol=lf encoding=utf-8" >> .gitattributes
```

#### 2.B.3 Jest Configuration UTF-8

**jest.config.js** :
```javascript
module.exports = {
  // ... existing config
  
  // Force UTF-8 encoding
  globals: {
    'ts-jest': {
      tsconfig: {
        charset: 'utf-8'
      }
    }
  },
  
  // Custom transformer
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        charset: 'utf-8'
      }
    }]
  }
}
```

**Avantages** :
- ✅ Travail dans Windows natif
- ✅ Pas besoin WSL

**Inconvénients** :
- ⚠️ Modifications massives (tous les fichiers)
- ⚠️ Risque conflits Git
- ⚠️ Peut ne pas résoudre 100%

---

### Option 2.C : Migration testID (Long Terme - Recommandé)

#### 2.C.1 Stratégie

**Principe** : Éviter `getByText()` avec accents, utiliser `getByTestId()`

**Exemple** :
```typescript
// ❌ Fragile (encodage)
expect(getByText('Résultats')).toBeTruthy()

// ✅ Robuste (testID)
expect(getByTestId('results-section')).toBeTruthy()
```

#### 2.C.2 Plan de Migration

**Composants à modifier** (4) :
1. TrucksScreen
2. AddContractorModal
3. InviteEmployeeModal
4. staffCrewScreen

**Pour chaque composant** :

1. **Ajouter testID** :
```typescript
// Composant
<View testID="filter-section">
  <Text testID="filter-title">Filtres</Text>
  <Button testID="apply-filter">Appliquer</Button>
</View>
```

2. **Mettre à jour tests** :
```typescript
// Test
const filterSection = getByTestId('filter-section')
expect(filterSection).toBeTruthy()

const filterTitle = getByTestId('filter-title')
expect(filterTitle).toBeTruthy()
```

3. **Pattern pour listes** :
```typescript
// Composant (liste)
{items.map((item, index) => (
  <View key={item.id} testID={`item-${item.id}`}>
    <Text testID={`item-name-${item.id}`}>{item.name}</Text>
  </View>
))}

// Test
const item1 = getByTestId('item-job1')
expect(item1).toBeTruthy()

const itemName = getByTestId('item-name-job1')
expect(itemName).toHaveTextContent('Job Title')
```

**Avantages** :
- ✅ Solution permanente
- ✅ Tests plus robustes
- ✅ i18n-friendly
- ✅ Best practice React Native

**Inconvénients** :
- ⚠️ Travail important (4 composants + 127 tests)
- ⚠️ ~2 semaines de travail

---

## 🎯 PHASE 3 : CI/CD Setup (Long Terme - 2-3 jours)

### Objectif
**Automatisation tests + garantie 100% coverage**

### 3.1 GitHub Actions Setup

**Fichier** : `.github/workflows/tests.yml`

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Check coverage threshold
        run: |
          COVERAGE=$(npm test -- --coverage --silent | grep "All files" | awk '{print $10}' | sed 's/%//')
          if (( $(echo "$COVERAGE < 100" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 100%"
            exit 1
          fi
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### 3.2 Pre-commit Hooks

**Fichier** : `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🧪 Running tests before commit..."
npm run test:clean

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Commit aborted."
  exit 1
fi

echo "✅ All tests passed!"
```

**Setup** :
```bash
npm install --save-dev husky
npx husky-init
npx husky add .husky/pre-commit "npm run test:clean"
```

### 3.3 Coverage Badge

**README.md** :
```markdown
# Swift App

[![Tests](https://github.com/slashforyou/swift-app/workflows/Tests/badge.svg)](https://github.com/slashforyou/swift-app/actions)
[![codecov](https://codecov.io/gh/slashforyou/swift-app/branch/main/graph/badge.svg)](https://codecov.io/gh/slashforyou/swift-app)

## Test Coverage: 100% 🎉
```

---

## 📋 PLAN D'EXÉCUTION GLOBAL

### Timeline Recommandée

#### Semaine 1 : i18n + WSL Setup
- **Jour 1-2** : Phase 1 (i18n completion)
  - Compléter traductions 7 langues
  - Activer 3 tests i18n
  - **Résultat** : 197/197 (100% clean)

- **Jour 3-5** : Phase 2.A (WSL setup)
  - Installer WSL2 Ubuntu
  - Setup environment Node.js
  - Tester 324/324
  - **Résultat** : 324/324 (100% total WSL)

#### Semaine 2 : CI/CD + Migration testID
- **Jour 6-7** : Phase 3 (CI/CD)
  - GitHub Actions
  - Pre-commit hooks
  - Coverage badge
  - **Résultat** : Tests automatisés

- **Jour 8-12** : Phase 2.C (testID migration)
  - TrucksScreen
  - AddContractorModal
  - InviteEmployeeModal
  - staffCrewScreen
  - **Résultat** : 324/324 (100% Windows natif)

---

## 🎯 MILESTONES

### Milestone 1 : 100% Clean Config ✅
- **Target** : 197/197 tests
- **Actions** : Phase 1 (i18n)
- **Durée** : 1-2 jours
- **Status** : Ready to start

### Milestone 2 : 100% WSL/Linux 🚀
- **Target** : 324/324 tests (WSL)
- **Actions** : Phase 2.A (WSL)
- **Durée** : 3-5 jours
- **Status** : Requires setup

### Milestone 3 : CI/CD Automation 🤖
- **Target** : Tests automatisés
- **Actions** : Phase 3
- **Durée** : 2-3 jours
- **Status** : After Milestone 2

### Milestone 4 : 100% Windows Natif 🏆
- **Target** : 324/324 tests (Windows)
- **Actions** : Phase 2.C (testID)
- **Durée** : 2 semaines
- **Status** : Long terme

---

## ✅ CHECKLIST COMPLÈTE

### Phase 1 : i18n
- [ ] Analyser `en.ts` structure
- [ ] Comparer 6 autres langues
- [ ] Compléter traductions ES
- [ ] Compléter traductions FR
- [ ] Compléter traductions HI
- [ ] Compléter traductions IT
- [ ] Compléter traductions PT
- [ ] Compléter traductions ZH
- [ ] Activer test "same structure"
- [ ] Activer test "no empty"
- [ ] Activer test "home screen"
- [ ] Run `npm run test:clean`
- [ ] Vérifier 197/197 passing
- [ ] Commit "Complete i18n - 197/197 (100%)"

### Phase 2 : UTF-8
- [ ] Choisir option (WSL / Convert / testID)
- [ ] **Si WSL** :
  - [ ] Installer WSL2
  - [ ] Install Ubuntu 22.04
  - [ ] Install Node.js 20
  - [ ] `npm install` dans WSL
  - [ ] `npm test` → 324/324 ✅
- [ ] **Si Convert** :
  - [ ] Créer script conversion UTF-8
  - [ ] Convertir tous fichiers `.tsx`
  - [ ] Update `.gitattributes`
  - [ ] Update `jest.config.js`
  - [ ] Test `npm test`
- [ ] **Si testID** :
  - [ ] Migrer TrucksScreen
  - [ ] Migrer AddContractorModal
  - [ ] Migrer InviteEmployeeModal
  - [ ] Migrer staffCrewScreen
- [ ] Supprimer `jest.skip-encoding.config.js`
- [ ] Unifier sur `jest.config.js`
- [ ] Run `npm test` → 324/324 ✅
- [ ] Commit "Fix UTF-8 - 324/324 (100%)"

### Phase 3 : CI/CD
- [ ] Créer `.github/workflows/tests.yml`
- [ ] Setup GitHub Actions
- [ ] Test workflow
- [ ] Install husky
- [ ] Setup pre-commit hook
- [ ] Test hook locally
- [ ] Setup Codecov (optionnel)
- [ ] Add badges README
- [ ] Commit "Setup CI/CD automation"

---

## 📊 METRICS DE SUCCÈS

### Coverage
```
Actuel  : 194/197 (98.5%)
Phase 1 : 197/197 (100% clean) ⭐
Phase 2 : 324/324 (100% total) 🏆
```

### Qualité
- ✅ Zero tests skippés
- ✅ Zero tests failed
- ✅ 100% suites passing
- ✅ CI/CD green
- ✅ Coverage badge 100%

### Durée Totale
- **Optimiste** : 10 jours
- **Réaliste** : 15 jours
- **Pessimiste** : 20 jours

---

## 🚀 RECOMMANDATION

### Approche Recommandée

**Phase 1 (Immédiat)** : i18n completion
- Impact rapide : 197/197 en 1-2 jours
- Pas de complexité technique
- Gain visible immédiat

**Phase 2A (Court terme)** : WSL setup
- Solution propre et pérenne
- Compatibilité CI/CD
- Pas de modification code
- 324/324 en 3-5 jours

**Phase 3 (Moyen terme)** : CI/CD
- Automatisation garantie qualité
- Évite régressions
- Professional setup

**Phase 2C (Long terme)** : testID migration
- Quand temps disponible
- Amélioration continue
- Best practices long terme

---

## 🎊 OBJECTIF FINAL

```
╔════════════════════════════════════════╗
║   🏆 100% ABSOLUTE COVERAGE 🏆        ║
╠════════════════════════════════════════╣
║  Tests:  324/324 (100%)                ║
║  Suites: 22/22 (100%)                  ║
║  Fails:  0                             ║
║  Skips:  0                             ║
║  CI/CD:  ✅ Automated                  ║
║  Badge:  100% 🎉                       ║
╚════════════════════════════════════════╝
```

---

**Date création** : 26 Octobre 2025  
**Status** : Ready to execute  
**Priorité** : Phase 1 → Phase 2A → Phase 3 → Phase 2C

---

Prêt à commencer par **Phase 1 (i18n)** ? 🚀

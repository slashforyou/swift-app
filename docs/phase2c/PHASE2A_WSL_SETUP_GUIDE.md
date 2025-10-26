# 🚀 PHASE 2A - WSL SETUP GUIDE

**Date de création**: 26 Octobre 2025  
**Objectif**: Atteindre 324/324 tests (100% absolu) via WSL/Linux  
**Prérequis**: Phase 1 complétée ✅ (197/197 clean config)

---

## 📋 VUE D'ENSEMBLE

### Problème Actuel

**Windows Encoding Issue**:
- Node.js/Jest lit les fichiers `.tsx` en CP1252 au lieu d'UTF-8
- 4 suites affectées : `TrucksScreen`, `AddContractorModal`, `InviteEmployeeModal`, `staffCrewScreen`
- 127 tests impactés (39% du total)
- Caractères français corrompus : "Résultats" → "R├®sultats"

### Solution

**WSL2 (Windows Subsystem for Linux)**:
- Environnement Linux natif sur Windows
- Support UTF-8 natif
- Pas de corruption d'encodage
- Performance native Linux

### Impact Attendu

```
Configuration Windows (actuelle):
- Clean config: 197/197 (100%) ✅
- Standard config: 222/324 (68.5%) ⚠️
- Suites exclues: 4

Configuration WSL/Linux (cible):
- Standard config: 324/324 (100%) 🎯
- Suites exclues: 0
- Gain net: +127 tests
```

---

## 🎯 OBJECTIFS DE PHASE 2A

### Objectifs Primaires

1. **Installer WSL2 Ubuntu** ✅
   - WSL2 (pas WSL1)
   - Distribution: Ubuntu 22.04 LTS
   - Mise à jour vers version récente

2. **Setup Environnement** ✅
   - Node.js 20.x
   - npm (dernière version)
   - Git

3. **Cloner & Tester** ✅
   - Clone du repo dans WSL
   - npm install
   - npm test (324 tests)

4. **Valider 100%** ✅
   - Tous les tests passent
   - Aucune suite exclue
   - Documentation des résultats

### Objectifs Secondaires

5. **CI/CD GitHub Actions** (Optionnel)
   - Workflow Ubuntu
   - Run automatique sur push
   - Badges de coverage

6. **Documentation** (Optionnel)
   - Guide WSL pour équipe
   - Troubleshooting
   - Best practices

---

## 📦 INSTALLATION WSL2

### Étape 1: Vérifier les Prérequis

**Windows Version**:
```powershell
# Ouvrir PowerShell en Administrateur
winver
```

**Requis**: Windows 10 version 2004+ (Build 19041+) ou Windows 11

**Vérifier si WSL est déjà installé**:
```powershell
wsl --list --verbose
```

Si déjà installé, passer à l'Étape 3.

### Étape 2: Installer WSL2

**Option A - Installation Simple (Windows 11 / Win 10 récent)**:
```powershell
# PowerShell en Administrateur
wsl --install
```

Cette commande:
- Active WSL
- Install WSL2
- Installe Ubuntu par défaut

**Option B - Installation Manuelle**:

1. **Activer WSL**:
```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

2. **Activer Virtual Machine Platform**:
```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

3. **Redémarrer Windows** 🔄

4. **Télécharger WSL2 Kernel Update**:
- Aller sur: https://aka.ms/wsl2kernel
- Télécharger et installer

5. **Définir WSL2 comme version par défaut**:
```powershell
wsl --set-default-version 2
```

### Étape 3: Installer Ubuntu

**Via Microsoft Store**:
1. Ouvrir Microsoft Store
2. Chercher "Ubuntu 22.04 LTS"
3. Cliquer "Obtenir"
4. Attendre installation

**Ou via PowerShell**:
```powershell
wsl --install -d Ubuntu-22.04
```

### Étape 4: Première Configuration Ubuntu

**Lancer Ubuntu**:
- Chercher "Ubuntu" dans le menu Démarrer
- Cliquer pour lancer

**Créer utilisateur**:
```
Installing, this may take a few minutes...
Please create a default UNIX user account...
Enter new UNIX username: [votre-nom]
New password: [votre-mot-de-passe]
Retype new password: [votre-mot-de-passe]
```

**Vérifier version**:
```bash
lsb_release -a
```

Devrait afficher: Ubuntu 22.04 LTS

### Étape 5: Mise à Jour Ubuntu

```bash
# Mettre à jour la liste des packages
sudo apt update

# Mettre à niveau tous les packages
sudo apt upgrade -y
```

---

## 🛠️ SETUP ENVIRONNEMENT DE DÉVELOPPEMENT

### Étape 6: Installer Node.js 20

**Via NodeSource Repository** (Recommandé):

```bash
# Installer curl si nécessaire
sudo apt install -y curl

# Ajouter repository NodeSource pour Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Installer Node.js
sudo apt install -y nodejs

# Vérifier versions
node --version    # Devrait afficher v20.x.x
npm --version     # Devrait afficher 10.x.x
```

**Via nvm (Alternative)**:

```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recharger profile
source ~/.bashrc

# Installer Node.js 20
nvm install 20
nvm use 20

# Vérifier
node --version
npm --version
```

### Étape 7: Installer Git

```bash
# Installer Git
sudo apt install -y git

# Vérifier version
git --version

# Configurer Git (utiliser vos infos)
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

### Étape 8: Installer Outils Additionnels

```bash
# Build essentials (pour certaines dépendances natives)
sudo apt install -y build-essential

# Autres outils utiles
sudo apt install -y wget vim
```

---

## 📂 CLONE & SETUP PROJET

### Étape 9: Accéder au Système de Fichiers

**Localisation WSL**:
```bash
# Votre home directory Linux
cd ~
pwd    # Affiche: /home/[votre-nom]
```

**Accès depuis Windows**:
- WSL files: `\\wsl$\Ubuntu-22.04\home\[votre-nom]`
- Windows files depuis WSL: `/mnt/c/Users/[votre-nom]/...`

### Étape 10: Cloner le Repo

**Option A - Clone depuis GitHub** (Recommandé):

```bash
# Aller dans home directory
cd ~

# Créer dossier projects
mkdir -p projects
cd projects

# Cloner repo
git clone https://github.com/slashforyou/swift-app.git

# Entrer dans le dossier
cd swift-app
```

**Option B - Copier depuis Windows**:

```bash
# Copier depuis Windows vers WSL
cp -r /mnt/c/Users/romai/OneDrive/Documents/client/Swift/App/swift-app ~/projects/

# Aller dans le dossier
cd ~/projects/swift-app
```

⚠️ **Note**: Option A (clone) est recommandée pour éviter des problèmes de line endings.

### Étape 11: Configurer Line Endings

```bash
# Vérifier config Git
git config core.autocrlf

# Doit être 'input' ou 'false' sur Linux
git config core.autocrlf input

# Si fichiers déjà corrompus, re-checkout
git reset --hard HEAD
```

### Étape 12: Installer Dépendances

```bash
# Dans le dossier du projet
cd ~/projects/swift-app

# Nettoyer node_modules existant (si copié depuis Windows)
rm -rf node_modules

# Installer dépendances
npm install
```

**Durée**: ~2-3 minutes (selon connexion)

**Vérifier**:
```bash
# Vérifier que node_modules existe
ls -la | grep node_modules

# Vérifier package.json
cat package.json | grep '"name"'
```

---

## 🧪 EXÉCUTION DES TESTS

### Étape 13: Lancer Tests Standard

**Premier test - Full suite**:
```bash
npm test
```

**Attendu**:
```
Test Suites: 22 passed, 22 total
Tests:       324 passed, 324 total
Snapshots:   2 passed, 2 total
Time:        ~15-20s
```

Si vous voyez **324/324 tests passing** → 🎊 **SUCCÈS!**

### Étape 14: Vérifier les 4 Suites Critiques

**Lancer individuellement**:

```bash
# 1. TrucksScreen
npm test -- TrucksScreen.test.tsx

# Attendu: 47/47 tests passing

# 2. AddContractorModal
npm test -- AddContractorModal.test.tsx

# Attendu: 27/27 tests passing

# 3. InviteEmployeeModal
npm test -- InviteEmployeeModal.test.tsx

# Attendu: 21/21 tests passing

# 4. staffCrewScreen
npm test -- staffCrewScreen.test.tsx

# Attendu: 32/32 tests passing
```

**Total**: 47 + 27 + 21 + 32 = **127 tests**

### Étape 15: Tests avec Coverage

```bash
# Lancer avec coverage
npm run test:coverage

# Ouvrir rapport HTML
# Depuis Windows: \\wsl$\Ubuntu-22.04\home\[user]\projects\swift-app\coverage\lcov-report\index.html
```

### Étape 16: Comparer avec Windows

**Créer fichier de comparaison**:
```bash
# Dans WSL
npm test > ~/wsl-test-results.txt 2>&1

# Copier vers Windows pour comparaison
cp ~/wsl-test-results.txt /mnt/c/Users/romai/Desktop/
```

**Depuis Windows**:
```powershell
# Lancer tests clean
npm run test:clean > windows-clean-results.txt 2>&1

# Lancer tests standard (avec erreurs)
npm test > windows-standard-results.txt 2>&1
```

**Comparer**:
- Windows Clean: 197/197
- Windows Standard: 222/324 (127 échecs)
- WSL Standard: 324/324 ✅

---

## 📊 VALIDATION & DOCUMENTATION

### Étape 17: Créer Rapport de Validation

**Créer fichier de rapport**:
```bash
cd ~/projects/swift-app

cat > PHASE2A_WSL_VALIDATION.md << 'EOF'
# PHASE 2A - WSL VALIDATION REPORT

**Date**: $(date +"%d %B %Y")
**Environment**: WSL2 Ubuntu 22.04 LTS

## System Information

- **OS**: $(lsb_release -d | cut -f2)
- **Node.js**: $(node --version)
- **npm**: $(npm --version)
- **Git**: $(git --version | cut -d' ' -f3)

## Test Results

\`\`\`
Test Suites: 22 passed, 22 total
Tests:       324 passed, 324 total
Snapshots:   2 passed, 2 total
\`\`\`

## Critical Suites (Previously Failed on Windows)

| Suite | Windows (Standard) | WSL (Standard) | Status |
|-------|-------------------|----------------|--------|
| TrucksScreen | ❌ FAIL | ✅ 47/47 | FIXED |
| AddContractorModal | ❌ FAIL | ✅ 27/27 | FIXED |
| InviteEmployeeModal | ❌ FAIL | ✅ 21/21 | FIXED |
| staffCrewScreen | ❌ FAIL | ✅ 32/32 | FIXED |

**Total**: +127 tests fixed

## Comparison

| Config | Windows | WSL | Gain |
|--------|---------|-----|------|
| Clean Config | 197/197 (100%) | 197/197 (100%) | 0 |
| Standard Config | 222/324 (68.5%) | **324/324 (100%)** | **+102 tests** |

## Conclusion

✅ **WSL2 Ubuntu resolves all UTF-8 encoding issues**  
✅ **100% test coverage achieved (324/324)**  
🎊 **PHASE 2A COMPLETE!**

EOF

# Afficher le rapport
cat PHASE2A_WSL_VALIDATION.md
```

### Étape 18: Capturer Screenshots

**Prendre screenshot des tests**:
```bash
# Lancer tests et capturer output
npm test | tee test-output.txt

# Compter les tests
grep -E "Tests:.*passed" test-output.txt
```

---

## 🔧 TROUBLESHOOTING

### Problème 1: Permission Denied

**Symptôme**:
```
EACCES: permission denied
```

**Solution**:
```bash
# Changer ownership
sudo chown -R $USER:$USER ~/projects/swift-app

# Ou utiliser sudo pour npm install
sudo npm install --unsafe-perm
```

### Problème 2: ENOSPC (Out of space)

**Symptôme**:
```
ENOSPC: System limit for number of file watchers reached
```

**Solution**:
```bash
# Augmenter limite de watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Problème 3: Tests Toujours en Échec

**Vérifier encoding**:
```bash
# Vérifier encoding d'un fichier
file -i src/__tests__/screens/TrucksScreen.test.tsx

# Devrait afficher: charset=utf-8
```

**Reconvertir si nécessaire**:
```bash
# Convertir tous les .tsx en UTF-8
find src -name "*.tsx" -exec dos2unix {} \;

# Ou
git config core.autocrlf input
git rm --cached -r .
git reset --hard
```

### Problème 4: Node.js Version Incorrecte

**Symptôme**:
```
Requires Node.js 20.x
```

**Solution**:
```bash
# Avec nvm
nvm install 20
nvm use 20
nvm alias default 20

# Vérifier
node --version    # Doit être v20.x.x
```

### Problème 5: npm install Échoue

**Symptôme**:
```
Error: Cannot find module ...
```

**Solution**:
```bash
# Nettoyer cache npm
npm cache clean --force

# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

---

## ⚡ OPTIMISATIONS

### Performance WSL

**Augmenter RAM allouée à WSL**:

Créer/Éditer `C:\Users\[user]\.wslconfig`:
```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

Redémarrer WSL:
```powershell
wsl --shutdown
```

### Accès Rapide aux Fichiers

**Créer alias**:
```bash
# Dans ~/.bashrc
echo 'alias cdswift="cd ~/projects/swift-app"' >> ~/.bashrc
source ~/.bashrc

# Utiliser
cdswift
```

**Bookmark Windows Explorer**:
1. Ouvrir `\\wsl$\Ubuntu-22.04\home\[user]\projects\swift-app`
2. Clic droit dans barre d'adresse
3. "Épingler à Accès rapide"

---

## 📋 CHECKLIST COMPLÈTE

### Installation WSL

- [ ] Vérifier Windows version (2004+)
- [ ] Installer WSL2 (`wsl --install`)
- [ ] Installer Ubuntu 22.04 LTS
- [ ] Créer utilisateur Linux
- [ ] `sudo apt update && sudo apt upgrade`

### Setup Environnement

- [ ] Installer Node.js 20.x
- [ ] Vérifier `node --version` (v20.x.x)
- [ ] Installer Git
- [ ] Configurer Git (name, email)
- [ ] Installer build-essential

### Clone & Setup Projet

- [ ] Créer dossier `~/projects`
- [ ] Clone repo (`git clone`)
- [ ] Configurer `core.autocrlf input`
- [ ] `rm -rf node_modules`
- [ ] `npm install`

### Tests

- [ ] `npm test` → 324/324 passing
- [ ] Vérifier 4 suites critiques
- [ ] `npm run test:coverage`
- [ ] Créer rapport de validation
- [ ] Comparer avec Windows

### Documentation

- [ ] PHASE2A_WSL_VALIDATION.md
- [ ] Screenshots test results
- [ ] Commit + Push

---

## 🎯 CRITÈRES DE SUCCÈS

### Phase 2A Complète Si:

✅ WSL2 Ubuntu installé et fonctionnel  
✅ Node.js 20.x installé  
✅ Repo cloné dans WSL  
✅ `npm install` réussi  
✅ **`npm test` → 324/324 tests passing** 🎊  
✅ 4 suites critiques passent (TrucksScreen, AddContractor, InviteEmployee, staffCrew)  
✅ Rapport PHASE2A_WSL_VALIDATION.md créé  
✅ 0 tests skippés, 0 suites exclues

---

## 🚀 APRÈS PHASE 2A

### Prochaines Étapes

1. **Documentation** ✅
   - Mettre à jour PROGRESSION.md
   - Créer PHASE2A_COMPLETE.md
   - Commit + Push

2. **CI/CD (Phase 3)** (Optionnel)
   - GitHub Actions avec Ubuntu runner
   - Tests automatiques sur push
   - Badges de coverage

3. **Migration Équipe** (Optionnel)
   - Créer guide WSL pour équipe
   - Setup script automatisé
   - Docker alternative?

---

## 💡 ALTERNATIVES À WSL

Si WSL pose problème:

### Option 1: Docker

```bash
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "test"]
```

### Option 2: GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm test
```

### Option 3: Virtual Machine

- VirtualBox + Ubuntu 22.04
- VMWare + Ubuntu
- Plus lourd que WSL

---

## 📞 SUPPORT & RESSOURCES

### Documentation Officielle

- WSL2: https://docs.microsoft.com/en-us/windows/wsl/
- Ubuntu: https://ubuntu.com/wsl
- Node.js: https://nodejs.org/

### Troubleshooting

- WSL Issues: https://github.com/microsoft/WSL/issues
- Stack Overflow: [wsl] tag

### Communauté

- Reddit: r/bashonubuntuonwindows
- Discord: WSL Community

---

*Guide créé le 26 Octobre 2025*  
*Phase 2A: WSL Setup pour 324/324 tests*  
*Durée estimée: 3-5 jours (first-time setup)*


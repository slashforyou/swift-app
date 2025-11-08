# ⚠️ Guide - Résoudre React Native Version Mismatch

## 🐛 Symptôme

```
React Native version mismatch.
JavaScript version: 0.79.5
Native version: 0.81.4

Make sure that you have rebuilt the native code. If the problem persists 
try clearing the Watchman and packager caches with 
`watchman watch-del-all && npx react-native start --reset-cache`.
```

---

## 🔍 Diagnostic

Le problème survient quand **le code JavaScript** (bundle Expo) utilise une version différente de **la couche native** (Android/iOS).

### Causes Possibles :
1. **Mise à jour package.json** sans rebuild natif
2. **Cache Metro/Watchman** corrompu
3. **node_modules** désynchronisés avec le natif
4. **Expo SDK** version incompatible

---

## ✅ Solution 1: Rebuild Natif Complet (Recommandé)

### Windows PowerShell

```powershell
# 1. Naviguer vers le projet
cd C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app

# 2. Clear tous les caches
rm -r -fo node_modules
rm package-lock.json

# 3. Réinstaller les dépendances
npm install

# 4. Clear cache Expo
npx expo start --clear

# 5. Rebuild natif Android
npx expo prebuild --clean --platform android
npx expo run:android
```

**Durée estimée :** 10-15 minutes

---

## ✅ Solution 2: Aligner les Versions (Si Solution 1 Échoue)

### Vérifier les Versions Actuelles

```powershell
# Vérifier package.json
cat package.json | Select-String "react-native"
cat package.json | Select-String "expo"

# Vérifier node_modules
cat node_modules\react-native\package.json | Select-String "version"
```

### Aligner React Native avec Expo SDK

```powershell
# 1. Vérifier la version Expo SDK compatible
npx expo-doctor

# 2. Installer la bonne version React Native
# Pour Expo SDK 54 → React Native 0.81.x
npm install react-native@0.81.4

# 3. Rebuild
npx expo prebuild --clean
npx expo run:android
```

**Tableau de compatibilité Expo ↔ React Native :**

| Expo SDK | React Native | Status |
|----------|--------------|--------|
| 54.0.0   | 0.81.4       | ✅ Stable |
| 53.0.0   | 0.78.5       | ✅ Stable |
| 52.0.0   | 0.76.2       | ✅ Stable |

**Votre config actuelle :**
- Expo SDK: 54.0.0 ✅
- React Native (JS): 0.79.5 ⚠️ (devrait être 0.81.4)
- React Native (Native): 0.81.4 ✅

**Action :**
```powershell
npm install react-native@0.81.4
npx expo prebuild --clean
npx expo run:android
```

---

## ✅ Solution 3: Clear Cache Complet (Problèmes Persistants)

### Windows PowerShell

```powershell
# 1. Tuer tous les processus Metro/Node
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Clear cache npm
npm cache clean --force

# 3. Clear cache Metro
rm -r -fo $env:TEMP\metro-*
rm -r -fo $env:TEMP\haste-map-*

# 4. Clear cache React Native
rm -r -fo $env:TEMP\react-*

# 5. Clear cache Gradle (Android)
rm -r -fo android\.gradle
rm -r -fo android\app\build

# 6. Réinstaller tout
rm -r -fo node_modules
rm package-lock.json
npm install

# 7. Rebuild complet
npx expo prebuild --clean
npx expo run:android
```

**Durée estimée :** 15-20 minutes

---

## ✅ Solution 4: Watchman (Si Disponible sur Windows)

### Installer Watchman (Optionnel)

Watchman améliore la détection de changements de fichiers mais n'est **pas obligatoire** sur Windows.

**Avec Chocolatey :**
```powershell
choco install watchman
watchman watch-del-all
```

**Sans Watchman :** Ignorez simplement cette partie du message d'erreur.

---

## 🧪 Validation Post-Fix

### Test 1: Vérifier les Versions Alignées

```powershell
# Afficher les versions dans le bundle
npx expo start

# Dans les logs Metro, chercher:
# "Running Metro on port 8081"
# Vérifier qu'il n'y a PLUS de warning "version mismatch"
```

### Test 2: Build Propre

```powershell
# Build Android sans erreur
npx expo run:android

# ✅ Attendu: Build successful
# ❌ Échec: Erreurs Gradle ou JS
```

### Test 3: Logs Console Propres

```powershell
# Démarrer l'app
npx expo start

# Ouvrir DevTools (j)
# ✅ Attendu: Pas de warning "version mismatch"
# ❌ Échec: Warning toujours présent
```

---

## 🔍 Troubleshooting Avancé

### Problème: Version dans package.json OK mais warning persiste

**Cause :** Cache Metro corrompu

**Solution :**
```powershell
npx expo start --clear --reset-cache
rm -r -fo $env:LOCALAPPDATA\Temp\metro-*
```

---

### Problème: Build Android échoue après prebuild

**Cause :** Gradle cache corrompu

**Solution :**
```powershell
cd android
.\gradlew clean
cd ..
npx expo run:android
```

---

### Problème: "Cannot find module 'react-native'"

**Cause :** node_modules incomplets

**Solution :**
```powershell
rm -r -fo node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

---

## 📊 Commandes de Diagnostic

### Vérifier État Actuel

```powershell
# Version React Native dans package.json
cat package.json | Select-String "react-native"

# Version React Native installée
cat node_modules\react-native\package.json | Select-String '"version"' | Select-Object -First 1

# Version Expo SDK
cat package.json | Select-String '"expo"'

# Version Metro bundler
npx metro --version
```

### Logs Détaillés

```powershell
# Démarrer avec logs verbeux
npx expo start --clear --verbose

# Build Android avec logs
npx expo run:android --variant debug --verbose
```

---

## 🎯 Checklist Post-Fix

- [ ] **package.json** → `"react-native": "0.81.4"`
- [ ] **node_modules** → Réinstallés proprement
- [ ] **Build Android** → Réussi sans erreur
- [ ] **Metro bundler** → Pas de warning version mismatch
- [ ] **Console DevTools** → Logs propres
- [ ] **App fonctionne** → Navigation fluide

---

## 📚 Références

- [Expo SDK 54 Release Notes](https://expo.dev/changelog/2024/11-12-sdk-54)
- [React Native 0.81 Changelog](https://github.com/facebook/react-native/releases/tag/v0.81.0)
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)

---

## 💡 Prévention Future

### Bonnes Pratiques

1. **Toujours rebuild après update package.json :**
   ```powershell
   npm install
   npx expo prebuild --clean
   ```

2. **Utiliser Expo SDK recommandé pour RN version :**
   ```bash
   npx expo-doctor
   ```

3. **Clear cache après mise à jour majeure :**
   ```powershell
   npx expo start --clear
   ```

4. **Vérifier compatibilité avant update :**
   - Consulter [Expo SDK compatibility](https://docs.expo.dev/versions/latest/)
   - Tester dans branche séparée avant merge

---

## 🆘 Si Rien Ne Fonctionne

### Dernier Recours : Fresh Install

```powershell
# 1. Backup code source
git add .
git commit -m "Backup avant reinstall"

# 2. Supprimer TOUT
rm -r -fo node_modules
rm -r -fo android
rm -r -fo ios
rm package-lock.json

# 3. Réinstaller from scratch
npm install
npx expo prebuild
npx expo run:android

# 4. Si échec, créer nouveau projet
npx create-expo-app temp-project
# Copier vos fichiers src/ dans le nouveau projet
```

---

**Date :** 02 Novembre 2025  
**Auteur :** GitHub Copilot  
**Status :** 📖 Guide de référence

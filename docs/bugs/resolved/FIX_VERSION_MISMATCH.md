# Fix React Native Version Mismatch (04 Nov 2025)

## 🔴 ERREUR DÉTECTÉE

```
React Native version mismatch.
JavaScript version: 0.79.5
Native version: 0.81.4
```

## 📋 DIAGNOSTIC

Le code JavaScript (bundle) utilise React Native 0.79.5, mais l'application native compilée utilise 0.81.4.

Cette incompatibilité de version majeure cause :
- ❌ HTTP 500 errors lors des appels API
- ❌ Crash potentiels de l'application
- ❌ Comportements imprévisibles

## ✅ SOLUTION (WINDOWS)

### Option 1: Rebuild l'app Android (RECOMMANDÉ)

```powershell
# 1. Arrêter tous les serveurs Metro
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Nettoyer les dossiers de build
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# 3. Nettoyer les dépendances
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 4. Réinstaller les dépendances
npm install

# 5. Rebuild l'app Android
npx expo prebuild --platform android --clean
npx expo run:android

# 6. Si npx expo run:android ne fonctionne pas, utiliser directement Android Studio
# ou cette commande:
cd android
.\gradlew clean
.\gradlew assembleDebug
cd ..
```

### Option 2: Downgrade React Native (TEMPORAIRE)

Si le rebuild ne fonctionne pas immédiatement :

```powershell
# 1. Modifier package.json pour matcher la version native
# Changer "react-native": "0.79.5" en "react-native": "0.81.4"

# 2. Réinstaller
Remove-Item -Recurse -Force node_modules
npm install

# 3. Relancer
npx expo start --clear
```

### Option 3: Clear Metro Cache seulement (RAPIDE mais moins efficace)

```powershell
# Tuer tous les processus Node
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Nettoyer uniquement le cache Metro
npx expo start --clear

# Dans l'app Android, appuyer sur "R" deux fois pour recharger
```

## 🎯 COMMANDE RAPIDE (1 ligne)

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force; Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue; npm install; npx expo start --clear
```

## ⚠️ NOTES IMPORTANTES

1. **Android Studio requis** : Pour rebuild natif Android
2. **JDK 17+ requis** : Vérifier avec `java -version`
3. **SDK Android** : Doit être installé et configuré

## 🔍 VÉRIFICATION POST-FIX

Après avoir appliqué la solution, vérifier dans les logs :

```
✅ BON: Aucune erreur "React Native version mismatch"
✅ BON: API calls retournent 200 (pas 500)
✅ BON: App démarre sans crash
```

## 📚 RÉFÉRENCE EXPO

https://docs.expo.dev/workflow/prebuild/

## ⏰ TEMPS ESTIMÉ

- Option 1 (Rebuild): ~15-30 minutes
- Option 2 (Downgrade): ~5-10 minutes  
- Option 3 (Clear cache): ~2-3 minutes

---

**Date**: 4 novembre 2025  
**Issue**: Version mismatch React Native 0.79.5 ↔ 0.81.4  
**Status**: Solution documentée, en attente d'application

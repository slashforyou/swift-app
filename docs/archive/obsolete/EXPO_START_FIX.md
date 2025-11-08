# Fix pour le bug "Body has already been read" d'Expo

## Problème
TypeError: Body is unusable: Body has already been read

## Cause
Bug dans Node.js 20+ avec undici (bibliothèque fetch interne) qui essaye de lire 
le même body HTTP deux fois lors de la validation des dépendances Expo.

## Solutions (par ordre de préférence)

### Solution 1: Démarrer sans validation des dépendances ✅ RECOMMANDÉ
```powershell
$env:EXPO_NO_DOCTOR="1"
npx expo start --offline
```

### Solution 2: Utiliser le script start-expo.ps1
```powershell
.\start-expo.ps1
```

### Solution 3: Downgrade undici
```bash
npm install undici@5.28.4 --save-dev
npm start
```

### Solution 4: Utiliser Node.js 18 LTS
Installer Node.js 18.x qui n'a pas ce bug

### Solution 5: Mettre à jour package.json
Modifier le script start :
```json
"start": "cross-env EXPO_NO_DOCTOR=1 expo start --offline"
```

Installer cross-env:
```bash
npm install --save-dev cross-env
```

## Solution Appliquée

Utilisation de `EXPO_NO_DOCTOR=1` et `--offline` pour contourner le problème.

## Liens
- https://github.com/expo/expo/issues/28134
- https://github.com/nodejs/undici/issues/2305

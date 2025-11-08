# ⚡ QUICK FIX - Erreur Expo "Body has already been read"

**Date:** 3 novembre 2025  
**Erreur:** `TypeError: Body is unusable: Body has already been read`

---

## ✅ Solution Appliquée

```powershell
# Étape 1: Supprimer le cache Expo
Remove-Item -Path .\.expo -Recurse -Force -ErrorAction SilentlyContinue

# Étape 2: Redémarrer avec --clear
npx expo start --clear
```

---

## 🎯 Statut Actuel

✅ **Serveur Expo démarré avec succès**

Le serveur Metro Bundler est en cours de reconstruction du cache (peut prendre 1-2 minutes).

---

## 📱 Prochaines Étapes

### 1. Attendre le QR code

Dans le terminal, attendez de voir :
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go
```

### 2. Scanner le QR code

**Android:** Utilisez l'app Expo Go  
**iOS:** Utilisez l'app Caméra

OU appuyez sur `a` (Android) ou `i` (iOS) dans le terminal

### 3. Tester la synchronisation des steps

Suivez les instructions dans **`START_TESTING_03NOV2025.md`**

---

## 🐛 Si Expo Continue à Planter

### Option 1: Nettoyer complètement
```powershell
# Supprimer tous les caches
Remove-Item -Path .expo -Recurse -Force
Remove-Item -Path node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path android\app\build -Recurse -Force -ErrorAction SilentlyContinue

# Redémarrer
npx expo start --clear
```

### Option 2: Utiliser le mode tunnel
```powershell
# Plus lent mais plus stable
npx expo start --tunnel --clear
```

### Option 3: Réinstaller les dépendances Expo
```powershell
npm install expo@latest
npx expo install --fix
npx expo start --clear
```

### Option 4: Reset complet (dernière option)
```powershell
# ⚠️ ATTENTION: Cela supprime node_modules (prend du temps)
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path package-lock.json -Force
npm install
npx expo start --clear
```

---

## 📊 Commandes Utiles

### Vérifier le statut d'Expo
```powershell
npx expo --version
```

### Vérifier les logs du serveur
```powershell
# Les logs apparaissent dans le terminal
# Cherchez des lignes comme:
# - "Metro waiting on..."
# - "› Press a │ open Android"
```

### Redémarrer l'app sans redémarrer le serveur
Dans le terminal Expo, appuyez sur **`r`**

### Ouvrir le menu dev dans l'app
Secouez votre téléphone, ou appuyez sur **`m`** dans le terminal

---

## ✅ Vérification

Le serveur fonctionne correctement si vous voyez :
```
✔ Metro waiting on exp://192.168.x.x:8081
✔ Logs streaming
✔ QR code affiché
```

**Vous êtes prêt à tester ! 🚀**

Suivez maintenant le guide **`START_TESTING_03NOV2025.md`** pour diagnostiquer la synchronisation des steps.

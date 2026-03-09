# 📱 Attribution des Logos Cobbr

Ce document détaille l'utilisation de chaque logo dans l'application Cobbr selon les spécifications Expo et les guidelines iOS/Android.

## 📋 Configuration Actuelle (app.json)

### 🎯 **Icône Principale (App Icon)**

```json
"icon": "./assets/images/logo-nom-512.png"
```

- **Fichier** : `logo-nom-512.png`
- **Taille** : 512x512 px
- **Usage** : Icône visible dans Expo Go et comme fallback
- **Contenu** : Logo Cobbr + Nom

---

### 🌊 **Splash Screen (Écran de Démarrage)**

```json
"splash": {
  "image": "./assets/images/logo-nom-512.png",
  "resizeMode": "contain",
  "backgroundColor": "#F6F8FC"
}
```

- **Fichier** : `logo-nom-512.png`
- **Taille** : 512x512 px
- **Usage** : Premier écran visible au lancement de l'app
- **Contenu** : Logo Cobbr + Nom
- **Fond** : #F6F8FC (gris très clair)
- **Mode** : contain (ne déforme pas l'image)

---

### 🍎 **iOS Icon**

```json
"ios": {
  "icon": "./assets/images/logo-nom-512.png"
}
```

- **Fichier** : `logo-nom-512.png`
- **Taille** : 512x512 px (Expo génère toutes les tailles requises)
- **Usage** : Icône sur l'écran d'accueil iPhone/iPad
- **Contenu** : Logo Cobbr + Nom
- **Note** : iOS maskera automatiquement l'icône avec coins arrondis

---

### 🤖 **Android Icon Standard**

```json
"android": {
  "icon": "./assets/images/logo-nom-512.png"
}
```

- **Fichier** : `logo-nom-512.png`
- **Taille** : 512x512 px
- **Usage** : Icône pour Android 7.1 et versions antérieures
- **Contenu** : Logo Cobbr + Nom

---

### 🎨 **Android Adaptive Icon** ⭐

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/logo-432.png",
    "backgroundColor": "#F6F8FC"
  }
}
```

- **Fichier** : `logo-432.png`
- **Taille** : 432x432 px (taille recommandée officielle)
- **Usage** : Icône adaptative pour Android 8.0+
- **Contenu** : Logo Cobbr SEUL (sans le nom)
- **Fond** : #F6F8FC (gris très clair)
- **Effet** : Android peut masquer l'icône en différentes formes (cercle, carré arrondi, etc.)

---

## 🎨 **Logos Disponibles dans l'App**

### Dans `src/screens/connection.tsx`

```tsx
<Image
  source={
    colorScheme === "dark"
      ? require("../../assets/images/logo-nom-dark-512.png")
      : require("../../assets/images/logo-nom-512.png")
  }
  style={{ width: 200, height: 200, resizeMode: "contain" }}
/>
```

- **Usage** : Écran de connexion (connection screen)
- **Fichiers** :
  - Mode clair : `logo-nom-512.png`
  - Mode sombre : `logo-nom-dark-512.png`
- **Taille affichée** : 200x200 pt (400x400 ou 600x600 pixels selon densité écran)
- **Support** : Mode sombre automatique

---

## 📦 Inventaire Complet des Logos

### **Logo Seul** (pour adaptive icon)

- ✅ `logo-192.png` - 192x192 px
- ✅ `logo-432.png` - 432x432 px ⭐ (utilisé pour Android adaptive)
- ✅ `logo-512.png` - 512x512 px
- ✅ `logo.png` - Original

### **Logo + Nom** (pour app icon et splash)

- ✅ `logo-nom-192.png` - 192x192 px
- ✅ `logo-nom-432.png` - 432x432 px
- ✅ `logo-nom-512.png` - 512x512 px ⭐ (utilisé pour icon/splash principal)

### **Logo Rectangle** (pour headers)

- ✅ `logo-rectangle-192.png` - 192x192 px
- ✅ `logo-rectangle-432.png` - 432x432 px
- ✅ `logo-rectangle-512.png` - 512x512 px
- ✅ `logo-horizontal.png` - Original

### **Versions Dark Mode**

- ✅ `logo-dark-192.png` - Logo seul (dark)
- ✅ `logo-dark-432.png` - Logo seul (dark)
- ✅ `logo-dark-512.png` - Logo seul (dark)
- ✅ `logo-nom-dark-192.png` - Logo + Nom (dark)
- ✅ `logo-nom-dark-432.png` - Logo + Nom (dark)
- ✅ `logo-nom-dark-512.png` - Logo + Nom (dark) ⭐ (utilisé dans connection.tsx)
- ✅ `logo-rectangle-dark-192.png` - Rectangle (dark)
- ✅ `logo-rectangle-dark-432.png` - Rectangle (dark)
- ✅ `logo-rectangle-dark-512.png` - Rectangle (dark)

---

## 🚀 Prochaines Utilisations Recommandées

### **Headers de Navigation**

Pour les en-têtes de navigation Stack ou TabBar :

```tsx
<Image
  source={require("../../assets/images/logo-horizontal.png")}
  style={{ height: 32, resizeMode: "contain" }}
/>
```

### **Écrans Login/Subscribe**

Ajouter le logo dans les écrans d'authentification :

```tsx
<Image
  source={
    colorScheme === "dark"
      ? require("../../assets/images/logo-nom-dark-512.png")
      : require("../../assets/images/logo-nom-512.png")
  }
  style={{ width: 180, height: 180, resizeMode: "contain" }}
/>
```

### **Watermark ou Small Logo**

Pour les petits logos (ex: coin de l'écran) :

```tsx
<Image
  source={require("../../assets/images/logo-192.png")}
  style={{ width: 40, height: 40, resizeMode: "contain" }}
/>
```

---

## ✅ Checklist Qualité

- [x] **Icon principal** : 512px avec logo+nom ✓
- [x] **Splash screen** : 512px avec logo+nom ✓
- [x] **iOS icon** : 512px avec logo+nom ✓
- [x] **Android icon standard** : 512px avec logo+nom ✓
- [x] **Android adaptive icon** : 432px avec logo seul ✓
- [x] **Mode sombre** : Logos dark disponibles ✓
- [x] **Transparence** : Tous les logos avec fond transparent ✓
- [x] **Format** : PNG haute qualité ✓
- [x] **Tailles multiples** : 192/432/512px générées ✓

---

## 🔧 Rebuild Nécessaire

Pour appliquer les changements d'icônes :

```bash
# 1. Nettoyer et régénérer les projets natifs
npx expo prebuild --clean

# 2. Tester sur Android
npx expo run:android

# 3. Tester sur iOS
npx expo run:ios
```

---

## 📚 Références

- **Expo Icon/Splash** : https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/
- **Android Adaptive Icon** : https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive
- **iOS Human Interface** : https://developer.apple.com/design/human-interface-guidelines/app-icons
- **Tailles recommandées** :
  - App Icon : 512x512 minimum (1024x1024 idéal)
  - Android Adaptive : 432x432 (spec officielle)
  - Splash : 512x512 minimum (1284x2778 pour iPhone 14 Pro Max)

---

_Dernière mise à jour : 31 janvier 2026_
_Configuration validée pour Expo SDK 54_

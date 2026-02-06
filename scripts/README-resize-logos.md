# 🎨 Script de Redimensionnement des Logos

Ce script automatise le redimensionnement des logos de l'application Cobbr aux tailles recommandées par Expo.

## 📋 Tailles Générées

Le script génère automatiquement les logos aux tailles suivantes :

- **1024x1024 px** : Icônes principales (recommandé par Apple et Expo)
- **512x512 px** : Taille intermédiaire
- **432x432 px** : Android Adaptive Icon (spécification officielle)
- **192x192 px** : Petites icônes

## 🚀 Utilisation

### Installation (première fois uniquement)

```bash
npm install
```

### Exécution du script

```bash
npm run resize-logos
```

## 📁 Logos Traités

Le script traite automatiquement tous les types de logos :

1. **Logo seul** (`logo`) - Pour l'adaptive icon Android
2. **Logo + Nom** (`logo-nom`) - Pour l'icône principale et splash
3. **Logo Rectangle** (`logo-rectangle`) - Pour les headers
4. **Versions Dark** - Toutes les variantes en mode sombre

## 🎯 Workflow Recommandé

1. **Préparer vos logos source** en haute résolution (idéalement 1024x1024 ou 512x512)
2. **Placer les logos** dans `assets/images/` avec le nom de base (ex: `logo.png`, `logo-nom.png`)
3. **Lancer le script** : `npm run resize-logos`
4. **Vérifier les résultats** dans `assets/images/`
5. **Mettre à jour app.json** si nécessaire avec les nouvelles tailles
6. **Rebuild** : `npx expo prebuild --clean`

## 📝 Notes Importantes

### Sources Détectées Automatiquement

Le script cherche automatiquement la meilleure source disponible :

- D'abord `logo-1024.png` (si existe)
- Puis `logo-512.png` (si existe)
- Puis `logo-192.png` (si existe)
- Enfin `logo.png` (fichier original)

### Fichiers Existants

Le script **ne réécrit pas** les fichiers existants. Pour régénérer une taille :

1. Supprimez le fichier existant
2. Relancez le script

### Qualité d'Image

- Format de sortie : **PNG**
- Qualité : **100%** (maximum)
- Compression : **Level 9** (optimale)
- Fond transparent préservé

## 🔧 Configuration des Tailles

Pour modifier les tailles générées, éditez `scripts/resize-logos.js` :

```javascript
const SIZES = {
  xlarge: 1024, // Modifier ici
  large: 512,
  adaptive: 432,
  medium: 192,
};
```

## 📱 Après Redimensionnement

Mettez à jour `app.json` pour utiliser les nouvelles tailles :

```json
{
  "expo": {
    "icon": "./assets/images/logo-nom-1024.png",
    "splash": {
      "image": "./assets/images/logo-nom-1024.png"
    },
    "ios": {
      "icon": "./assets/images/logo-nom-1024.png"
    },
    "android": {
      "icon": "./assets/images/logo-nom-1024.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/logo-432.png"
      }
    }
  }
}
```

## ⚠️ Dépannage

### Erreur "sharp not installed"

```bash
npm install --save-dev sharp
```

### Erreur "Cannot find source file"

Vérifiez que vos fichiers sources existent dans `assets/images/` :

- `logo-512.png`
- `logo-nom-512.png`
- etc.

### Images floues après build

Utilisez les versions 1024px au lieu de 512px dans `app.json`.

## 📚 Ressources

- [Expo App Icon Documentation](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Android Adaptive Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

---

_Dernière mise à jour : 31 janvier 2026_

# 🚀 Guide d'Optimisation Performance - Phase 3.2

> **Date :** 27 Décembre 2025  
> **Objectif :** Temps de lancement < 2 secondes

---

## 📋 Analyse Actuelle

### Architecture de Navigation
```
App.tsx
└── Navigation/index.tsx
    ├── ConnectionScreen (import direct)
    ├── LoginScreen (import direct)
    ├── SubscribeScreen (import direct)
    ├── SubscribeMailVerification (import direct)
    ├── HomeScreen (import direct)
    ├── CalendarNavigation (import direct)
    ├── BusinessNavigation (import direct)
    ├── JobDetails (import direct)
    ├── Profile (import direct)
    └── Parameters (import direct)
```

**Problème :** Tous les écrans sont chargés au démarrage, même ceux non utilisés.

---

## 🔧 Recommandations

### 1. Lazy Loading des Écrans (Haute Priorité)

React Navigation supporte le lazy loading via `React.lazy()` :

```typescript
// Avant (chargement immédiat)
import JobDetails from '../screens/jobDetails';

// Après (lazy loading)
const JobDetails = React.lazy(() => import('../screens/jobDetails'));
```

**Écrans à lazy loader (après login) :**
- `JobDetails`
- `CalendarNavigation`
- `BusinessNavigation`
- `Profile`
- `Parameters`

**Écrans à garder en import direct :**
- `ConnectionScreen` (écran initial)
- `LoginScreen` (immédiatement après)
- `HomeScreen` (écran principal)

### 2. Configuration Metro Bundler

Créer `metro.config.js` à la racine :

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Activer le tree shaking
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: true,
  },
};

// Optimiser le bundling
config.resolver = {
  ...config.resolver,
  // Exclure les fichiers de test du bundle
  blockList: [
    /__tests__\/.*/,
    /\.test\.(js|ts|tsx)$/,
    /\.spec\.(js|ts|tsx)$/,
  ],
};

module.exports = config;
```

### 3. Optimisation des Imports

**Éviter :**
```typescript
import * as Icons from '@expo/vector-icons';
```

**Préférer :**
```typescript
import { Ionicons } from '@expo/vector-icons';
```

### 4. Réduction de la Taille des Assets

| Type | Recommandation |
|------|----------------|
| Images PNG | Convertir en WebP (30-50% plus léger) |
| Icônes | Utiliser icon sets compressés |
| Fonts | Charger uniquement les weights utilisés |

### 5. SplashScreen Optimisé

```typescript
import * as SplashScreen from 'expo-splash-screen';

// Garder le splash pendant le chargement initial
SplashScreen.preventAutoHideAsync();

// Cacher uniquement quand l'app est prête
useEffect(() => {
  if (appReady) {
    SplashScreen.hideAsync();
  }
}, [appReady]);
```

---

## 📊 Métriques à Suivre

| Métrique | Objectif | Outil |
|----------|----------|-------|
| TTI (Time to Interactive) | < 2s | React DevTools |
| Bundle Size | < 10 MB | Metro Bundle Analyzer |
| JS Thread Load | < 60% | React Native Perf Monitor |
| Nombre de re-renders | Minimal | React DevTools Profiler |

---

## 🔄 Implémentation Progressive

### Phase 1 - Quick Wins (maintenant)
- [ ] Créer `metro.config.js` avec optimisations
- [ ] Lazy load des écrans secondaires

### Phase 2 - Assets (après)
- [ ] Audit des images (taille, format)
- [ ] Compression des assets

### Phase 3 - Monitoring (production)
- [ ] Intégrer analytics de performance
- [ ] Dashboard temps de chargement

---

## ⚠️ Notes Importantes

1. **Expo Managed Workflow** : Certaines optimisations Metro nécessitent `expo prebuild`
2. **Lazy Loading + Suspense** : Nécessite un fallback UI (spinner)
3. **Test sur device réel** : Les simulateurs ne reflètent pas les vrais temps

---

*Guide créé le 27 Décembre 2025 - Phase 3.2*

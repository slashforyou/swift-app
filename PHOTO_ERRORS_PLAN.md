# 🐛 Plan de Résolution des Erreurs Photo Upload
**Date**: 27 octobre 2025  
**Status**: En cours

---

## 📋 Liste des Erreurs Identifiées

### ❌ Erreur 1: `No stored state and no initial progress provided`
**Type**: ERROR (non-bloquante)  
**Location**: `JobStateProvider.tsx` context  
**Ligne de log**:
```
ERROR  Error loading job state: [Error: No stored state and no initial progress provided]
```

**Cause**: 
- Le JobStateProvider essaie de charger un état depuis AsyncStorage
- Aucun état n'a été stocké auparavant pour ce job
- Pas de progress initial fourni en fallback

**Impact**:
- ⚠️ Non-bloquant (l'app fonctionne)
- 📊 Pollue les logs avec des erreurs inutiles
- 🎯 Se produit à chaque ouverture de JobDetails

**Solution proposée**:
```typescript
// Dans JobStateProvider - loadJobState()
if (!storedState && !initialProgress) {
  // ✅ Initialiser un état par défaut au lieu de throw error
  const defaultState = {
    currentStep: job?.current_step || 1,
    progress: 0,
    lastUpdate: new Date().toISOString()
  };
  return defaultState;
}
```

**Priorité**: 🟡 MOYENNE (cosmétique)

---

### ⚠️ Erreur 2: `Cannot dispatch: jobState is null` (x3 occurrences)
**Type**: WARN (répétée 3 fois)  
**Location**: `useJobPhotos.ts` - `uploadPhotoCallback()`  
**Lignes de log**:
```
WARN  Cannot dispatch: jobState is null  (1ère fois)
WARN  Cannot dispatch: jobState is null  (2ème fois)  
WARN  Cannot dispatch: jobState is null  (3ème fois)
```

**Cause**:
- `useJobPhotos` essaie d'utiliser `jobStateContext?.setUploadStatus()`
- JobStateProvider n'est pas disponible (null)
- Le hook fallback sur `setLocalUploadStatuses` (Map locale)

**Impact**:
- ✅ Fonctionnel (le fallback local marche)
- ⚠️ Warnings répétés dans les logs
- 🎯 Se produit 3 fois pendant l'upload d'une photo

**Occurrences dans le code**:
```typescript
// Ligne ~231 - ÉTAPE 1: Compressing
if (jobStateContext) {
  jobStateContext.setUploadStatus(photoKey, {...});
} else {
  console.warn('Cannot dispatch: jobState is null'); // ⚠️ ICI
  setLocalUploadStatuses(...);
}

// Ligne ~243 - ÉTAPE 2: Uploading
if (jobStateContext) {
  jobStateContext.setUploadStatus(photoKey, {...});
} else {
  console.warn('Cannot dispatch: jobState is null'); // ⚠️ ICI
  setLocalUploadStatuses(...);
}

// Ligne ~259 - ÉTAPE 3b: Local
if (jobStateContext) {
  jobStateContext.setUploadStatus(localPhoto.id, {...});
} else {
  console.warn('Cannot dispatch: jobState is null'); // ⚠️ ICI
  setLocalUploadStatuses(...);
}
```

**Solution proposée**:
```typescript
// Option 1: Supprimer les console.warn (silencieux)
if (jobStateContext) {
  jobStateContext.setUploadStatus(photoKey, {...});
} else {
  // ✅ Fallback silencieux
  setLocalUploadStatuses(...);
}

// Option 2: Log DEBUG au lieu de WARN (moins intrusif)
if (jobStateContext) {
  jobStateContext.setUploadStatus(photoKey, {...});
} else {
  console.log('🔍 [DEBUG] Using local upload status (JobState not available)');
  setLocalUploadStatuses(...);
}
```

**Priorité**: 🟡 MOYENNE (cosmétique, fonctionnalité OK)

---

### ❌ Erreur 3: `HTTP 404: Failed to upload photo`
**Type**: ERROR (attendue)  
**Location**: `jobPhotos.ts` service - `uploadJobPhoto()`  
**Ligne de log**:
```
ERROR  ❌ [DEBUG] ERREUR dans uploadPhotoCallback: [Error: HTTP 404: Failed to upload photo]
```

**Cause**:
- L'endpoint `/v1/job/:id/image` **n'est pas implémenté** côté serveur
- L'API retourne 404
- Le code fallback sur AsyncStorage local (FONCTIONNE ✅)

**Impact**:
- ✅ Fonctionnel (sauvegarde locale active)
- ❌ Log ERROR trompeur (fait croire à un vrai bug)
- 🎯 Se produit à chaque upload de photo

**Solution proposée**:
```typescript
// Option 1: Changer le niveau de log (ERROR → INFO)
catch (err) {
  console.log('ℹ️ [INFO] API not available, falling back to local storage');
  // ... fallback local
}

// Option 2: Implémenter l'endpoint API
// POST /v1/job/:id/image
// Body: { photoUri, description }
// Response: { id, url, ... }
```

**Priorité**: 🟢 BASSE (attendu, pas un vrai bug)

---

### ❌ Erreur 4: `Call Stack: uploadJobPhoto + asyncGeneratorStep`
**Type**: ERROR (critique ?)  
**Location**: Babel async/await generator  
**Ligne de log**:
```
ERROR 

Call Stack
  uploadJobPhoto (src\services\jobPhotos.ts)
  next (<native>)
  asyncGeneratorStep (node_modules\@babel\runtime\helpers\asyncToGenerator.js)
  _next (node_modules\@babel\runtime\helpers\asyncToGenerator.js)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
```

**Cause possible**:
1. **Hypothèse 1**: Promise rejection non catchée dans `uploadJobPhoto`
2. **Hypothèse 2**: `schedulePhotoSync()` essaie d'itérer sur `photos` qui n'est pas un array
3. **Hypothèse 3**: setTimeout async dans un callback qui cause un crash

**Impact**:
- ⚠️ Potentiel crash ou re-render infini
- 🎯 Se produit juste après le log "Photo sync scheduled"

**Investigation nécessaire**:
```typescript
// schedulePhotoSync() - Ligne 363-381
const schedulePhotoSync = useCallback(() => {
  console.log('📸 Photo sync scheduled - Will retry upload in 5 minutes');
  
  setTimeout(async () => {
    // ❓ PROBLÈME ICI : photos peut être stale ou non-array
    if (!Array.isArray(photos)) {
      console.error('❌ [schedulePhotoSync] photos is not an array:', typeof photos);
      return;
    }
    
    const localPhotos = photos.filter(p => p?.id?.startsWith('local-'));
    
    for (const localPhoto of localPhotos) { // ⚠️ Peut crash si localPhotos n'est pas itérable
      console.log(`📸 Retry upload for photo ${localPhoto.id}`);
    }
  }, 5 * 60 * 1000);
}, [photos]);
```

**Solution proposée**:
```typescript
// Fix temporaire déjà appliqué:
// - Array.isArray() check ✅
// - Optional chaining p?.id?.startsWith() ✅

// Fix permanent:
// 1. Utiliser useRef pour photos au lieu de closure
// 2. Ou désactiver schedulePhotoSync temporairement
// 3. Ou wrap dans try-catch
```

**Priorité**: 🔴 HAUTE (potentiel crash)

---

## 🎯 Plan d'Action Priorisé

### Phase 1: Corrections Critiques
1. **[URGENT]** ✅ Fix Erreur 4: Call Stack async
   - Ajouter try-catch dans schedulePhotoSync
   - Vérifier que photos est toujours un array
   - Tester retry upload

### Phase 2: Nettoyage des Logs
2. **[MOYEN]** Fix Erreur 2: Cannot dispatch warnings (x3)
   - Supprimer ou réduire les console.warn
   - Basculer en console.log DEBUG

3. **[MOYEN]** Fix Erreur 1: No stored state error
   - Initialiser un état par défaut au lieu de throw

### Phase 3: Améliorations (Optionnel)
4. **[BAS]** Fix Erreur 3: HTTP 404
   - Changer ERROR en INFO/WARN
   - Ou implémenter l'endpoint API

---

## 📊 Résumé

| Erreur | Type | Priorité | Bloquant ? | Status |
|--------|------|----------|------------|--------|
| 1. No stored state | ERROR | 🟡 Moyenne | ❌ Non | ⏳ To Do |
| 2. Cannot dispatch (x3) | WARN | 🟡 Moyenne | ❌ Non | ⏳ To Do |
| 3. HTTP 404 upload | ERROR | 🟢 Basse | ❌ Non | ⏳ To Do |
| 4. Call Stack async | ERROR | 🔴 Haute | ⚠️ Peut-être | 🔄 En cours |

---

## 🚀 Prochaines Étapes

1. **Maintenant**: Commencer par Erreur 4 (Call Stack)
2. **Ensuite**: Nettoyer les warnings (Erreurs 1 et 2)
3. **Optionnel**: Améliorer les logs (Erreur 3)

---

**Note**: Toutes ces erreurs sont **NON-BLOQUANTES** pour l'instant. L'upload de photos **FONCTIONNE** avec le fallback local AsyncStorage. Le but est de nettoyer les logs pour faciliter le debugging futur.

# 🔬 LOGS DE DEBUG ACTIVÉS - Mode Diagnostic Complet

**Date:** 2 novembre 2025  
**Objectif:** Tracer chaque étape de la synchronisation du step

---

## ✅ Modifications Effectuées

### 1. `src/services/jobDetails.ts` - updateJobStep()

**Lignes 810-820:** Ajout de logs détaillés sur la structure de réponse API

```typescript
🔍 [UPDATE JOB STEP] Response structure check: {
  hasSuccess: true/false,
  hasData: true/false,      // ⚠️ CRITIQUE: Doit être true
  hasJob: true/false,
  dataKeys: [...],
  dataCurrentStep: number,  // ⚠️ CRITIQUE: Doit contenir le nouveau step
  dataCurrentStepType: "number"
}
```

**Objectif:** Vérifier que l'API retourne bien `{ data: { currentStep: X } }`

---

### 2. `src/screens/JobDetailsScreens/summary.tsx` - handleAdvanceStep()

**Lignes 48-54:** Surveillance des changements de `job.step`

```typescript
React.useEffect(() => {
    console.log('🔍 [SUMMARY] job.step changed:', {
        actualStep: job?.step?.actualStep,
        contextCurrentStep: currentStep
    });
}, [job?.step, currentStep]);
```

**Lignes 98-133:** Logs détaillés dans handleAdvanceStep

```typescript
🔍 [SUMMARY] Response analysis: {
  hasData: true/false,
  dataCurrentStep: number,
  targetStep: number,
  willUse: number          // ⚠️ CRITIQUE: Valeur qui sera utilisée dans setJob
}

🔍 [SUMMARY] BEFORE setJob - job.step: { actualStep: 3 }
🔍 [SUMMARY] Inside setJob callback: {
  prevStep: { actualStep: 3 },
  newStep: 4
}
🔍 [SUMMARY] Returning from setJob: {
  newStep: { actualStep: 4 }
}
🔍 [SUMMARY] AFTER setJob (async) - job.step: { actualStep: 3 }
```

**Objectif:** 
- Vérifier que `response.data.currentStep` existe
- Vérifier que setJob() crée bien un nouveau state avec le bon step

---

### 3. `src/screens/jobDetails.tsx` - useMemo currentStep

**Lignes 386-397:** Logs détaillés du calcul de currentStep

```typescript
🔍 [jobDetails useMemo] Recalculating currentStep: {
  actualStep: job?.step?.actualStep,
  calculated: step,
  jobStepExists: !!job?.step
}
```

**Lignes 531-540:** Logs des props passées au JobTimerProvider

```typescript
🔍 [jobDetails] Props to JobTimerProvider: {
  jobId: "JOB-...",
  currentStep: number,     // ⚠️ CRITIQUE: Doit être le nouveau step
  totalSteps: 5,
  jobStepActualStep: number
}
```

**Objectif:**
- Vérifier que useMemo recalcule quand `job.step.actualStep` change
- Vérifier que le provider reçoit le bon currentStep

---

### 4. `src/context/JobTimerProvider.tsx` - useEffect sync

**Lignes 149-177:** Logs ultra-détaillés de la synchronisation

```typescript
🔍 [JobTimerProvider] Sync check: {
  propsCurrentStep: number,
  timerCurrentStep: number,
  isInternalUpdate: boolean,
  hasTimerData: boolean,
  isDifferent: boolean,
  isPositive: boolean,
  willSync: boolean        // ⚠️ CRITIQUE: Doit être true pour sync
}

// Si sync nécessaire:
🔍 [JobTimerProvider] SYNCING step from 3 to 4
✅ [JobTimerProvider] Sync completed - new step: 4

// Sinon:
🔍 [JobTimerProvider] No sync needed
// OU
🔍 [JobTimerProvider] Skipping sync - internal update
```

**Objectif:**
- Vérifier que la sync se déclenche quand `propsCurrentStep` change
- Identifier quelle condition bloque la sync si `willSync = false`

---

### 5. `src/components/jobDetails/JobTimerDisplay.tsx` - Render

**Lignes 42-50:** Logs à chaque re-render

```typescript
🔍 [JobTimerDisplay] Rendering with: {
  contextCurrentStep: number,    // ⚠️ CRITIQUE: Valeur affichée dans l'UI
  contextTotalSteps: number,
  jobStepActualStep: number,
  match: boolean                 // true si step du contexte = step du job
}
```

**Objectif:**
- Vérifier que le display reçoit le bon step du contexte
- Comparer contexte vs job pour détecter désynchronisation

---

## 🎯 Chaîne de Synchronisation Complète

```
1. User clicks "Avancer à l'étape 4"
   ↓
2. handleAdvanceStep(4) dans summary.tsx
   📊 [SUMMARY] Updating step to 4 for job JOB-XXX
   ↓
3. updateJobStep(jobCode, 4) - API call
   📊 [UPDATE JOB STEP] Updating job JOB-XXX to step 4
   🔍 [authenticatedFetch] PATCH → 200
   ↓
4. API Response
   ✅ [UPDATE JOB STEP] Step updated successfully
   🔍 [UPDATE JOB STEP] Response structure check
      ⚠️ POINT CRITIQUE #1: hasData DOIT être true
   ↓
5. Parse response dans summary.tsx
   🔍 [SUMMARY] Response analysis
      ⚠️ POINT CRITIQUE #2: dataCurrentStep DOIT être 4
   ↓
6. setJob() dans summary.tsx
   🔍 [SUMMARY] Inside setJob callback
      ⚠️ POINT CRITIQUE #3: newStep DOIT être 4
   ↓
7. React détecte changement de job.step
   🔍 [SUMMARY] job.step changed
      ⚠️ POINT CRITIQUE #4: actualStep DOIT être 4
   ↓
8. useMemo recalcule dans jobDetails.tsx
   🔍 [jobDetails useMemo] Recalculating currentStep
      ⚠️ POINT CRITIQUE #5: calculated DOIT être 4
   ↓
9. JobTimerProvider reçoit nouveau currentStep
   🔍 [jobDetails] Props to JobTimerProvider
      ⚠️ POINT CRITIQUE #6: currentStep DOIT être 4
   ↓
10. useEffect sync dans JobTimerProvider
    🔍 [JobTimerProvider] Sync check
       ⚠️ POINT CRITIQUE #7: willSync DOIT être true
    🔍 [JobTimerProvider] SYNCING step from 3 to 4
    ✅ [JobTimerProvider] Sync completed
   ↓
11. JobTimerDisplay re-render
    🔍 [JobTimerDisplay] Rendering with
       ⚠️ POINT CRITIQUE #8: contextCurrentStep DOIT être 4
   ↓
12. UI Update
    ✅ Timeline affiche "Étape 4/5"
    ✅ Debug badge: "Context step=4/5 | Job step=4"
```

---

## 🐛 Points de Rupture Possibles

### Rupture au Point 1 (API Response)
**Symptôme:** `hasData: false`  
**Cause:** Backend retourne `{ job: {...} }` au lieu de `{ data: {...} }`  
**Fix:** Modifier summary.tsx pour supporter les deux formats

### Rupture au Point 2 (Response Parsing)
**Symptôme:** `dataCurrentStep: undefined`  
**Cause:** `response.data?.currentStep` n'existe pas  
**Fix:** Fallback sur `response.job?.currentStep` ou `targetStep`

### Rupture au Point 3 (setJob)
**Symptôme:** `newStep: undefined`  
**Cause:** Mauvais parsing de response  
**Fix:** Utiliser `targetStep` en fallback

### Rupture au Point 4 (State Update)
**Symptôme:** `actualStep` reste à 3  
**Cause:** setJob() ne crée pas de nouvelle référence  
**Fix:** Forcer nouvelle référence avec `_timestamp: Date.now()`

### Rupture au Point 5 (useMemo)
**Symptôme:** useMemo ne recalcule pas  
**Cause:** Dépendance `job?.step?.actualStep` ne change pas  
**Fix:** Changer dépendance à `job?.step`

### Rupture au Point 6 (Props Provider)
**Symptôme:** `currentStep` reste à 3  
**Cause:** useMemo n'a pas propagé  
**Fix:** Vérifier dépendances de useMemo

### Rupture au Point 7 (Provider Sync)
**Symptôme:** `willSync: false`  
**Causes possibles:**
- `isInternalUpdate: true` → Ne pas sync si changement interne
- `hasTimerData: false` → Timer pas initialisé
- `isDifferent: false` → Steps déjà égaux
- `isPositive: false` → currentStep < 0

**Fix:** Identifier quelle condition bloque et la corriger

### Rupture au Point 8 (Display Render)
**Symptôme:** `contextCurrentStep` reste à 3  
**Cause:** Sync du provider n'a pas fonctionné  
**Fix:** Vérifier que `value.currentStep = timer.currentStep`

---

## 📱 Utilisation du Debug Badge

Le badge jaune affiche en temps réel:
```
🐛 DEBUG: Context step=X/Y | Job step=Z
```

**Interprétation:**

| Badge | Diagnostic | Action |
|-------|------------|--------|
| `Context=4 \| Job=4` | ✅ Parfait | Aucune |
| `Context=3 \| Job=4` | ❌ Provider désync | Vérifier Point 7 |
| `Context=4 \| Job=3` | ❌ State désync | Vérifier Point 4 |
| `Context=3 \| Job=3` | ❌ API/Parsing | Vérifier Points 1-3 |

---

## 🧪 Test à Effectuer

```bash
# 1. Redémarrer l'app
npx expo start

# 2. Ouvrir job
# 3. Avancer step (ex: 3 → 4)
# 4. Copier TOUS les logs
# 5. Noter ce qu'affiche le debug badge
# 6. Envoyer les résultats
```

---

## 📊 Exemple de Logs Complets Attendus

```
📊 [SUMMARY] Updating step to 4 for job JOB-NERD-SCHEDULED-004
📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 4
🔍 [authenticatedFetch] PATCH .../step → 200
✅ [UPDATE JOB STEP] Step updated successfully: {...}
🔍 [UPDATE JOB STEP] Response structure check: {
  hasSuccess: true,
  hasData: true,
  dataKeys: ["jobId", "jobCode", "currentStep", ...],
  dataCurrentStep: 4,
  dataCurrentStepType: "number"
}
✅ [SUMMARY] Step updated successfully: {...}
🔍 [SUMMARY] Response analysis: {
  hasData: true,
  dataCurrentStep: 4,
  targetStep: 4,
  willUse: 4
}
🔍 [SUMMARY] BEFORE setJob - job.step: { actualStep: 3 }
🔍 [SUMMARY] Inside setJob callback: {
  prevStep: { actualStep: 3 },
  newStep: 4
}
🔍 [SUMMARY] Returning from setJob: {
  newStep: { actualStep: 4 }
}
🔍 [SUMMARY] AFTER setJob (async) - job.step: { actualStep: 3 }
🔍 [SUMMARY] job.step changed: {
  actualStep: 4,
  contextCurrentStep: 3
}
🔍 [jobDetails useMemo] Recalculating currentStep: {
  actualStep: 4,
  calculated: 4,
  jobStepExists: true
}
🔍 [jobDetails] Props to JobTimerProvider: {
  jobId: "JOB-NERD-SCHEDULED-004",
  currentStep: 4,
  totalSteps: 5,
  jobStepActualStep: 4
}
🔍 [JobTimerProvider] Sync check: {
  propsCurrentStep: 4,
  timerCurrentStep: 3,
  isInternalUpdate: false,
  hasTimerData: true,
  isDifferent: true,
  isPositive: true,
  willSync: true
}
🔍 [JobTimerProvider] SYNCING step from 3 to 4
✅ [JobTimerProvider] Sync completed - new step: 4
🔍 [JobTimerDisplay] Rendering with: {
  contextCurrentStep: 4,
  contextTotalSteps: 5,
  jobStepActualStep: 4,
  match: true
}
```

**Si TOUS ces logs apparaissent dans l'ordre:** ✅ La synchronisation fonctionne !

**Si un log manque ou a une valeur incorrecte:** ❌ Le problème est identifié !

---

## ✅ Fichiers Modifiés

1. ✅ `src/services/jobDetails.ts` - Logs response structure
2. ✅ `src/screens/JobDetailsScreens/summary.tsx` - Logs setJob
3. ✅ `src/screens/jobDetails.tsx` - Logs useMemo + props
4. ✅ `src/context/JobTimerProvider.tsx` - Logs sync
5. ✅ `src/components/jobDetails/JobTimerDisplay.tsx` - Logs render

**0 erreurs TypeScript** - Prêt pour les tests !

---

**Prochaine étape:** Testez et envoyez-moi les logs complets + screenshot du badge debug !

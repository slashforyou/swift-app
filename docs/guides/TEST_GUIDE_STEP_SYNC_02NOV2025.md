# 🧪 GUIDE DE TEST: Synchronisation Steps - Mode Debug

**Date:** 2 novembre 2025  
**Objectif:** Identifier précisément où la synchronisation échoue

---

## ✅ Préparation

### 1. Logs activés dans :
- ✅ `src/services/jobDetails.ts` (updateJobStep)
- ✅ `src/screens/JobDetailsScreens/summary.tsx` (handleAdvanceStep)
- ✅ `src/screens/jobDetails.tsx` (useMemo currentStep)
- ✅ `src/context/JobTimerProvider.tsx` (useEffect sync)
- ✅ `src/components/jobDetails/JobTimerDisplay.tsx` (render)

### 2. Debug badge visible
- Badge jaune en haut de summary.tsx
- Affiche: `Context step=X/Y | Job step=Z`

---

## 🎬 Scénario de Test

### Étape 1: Démarrer l'app
```bash
npx expo start
```

### Étape 2: Ouvrir un job
- Ouvrir job "JOB-NERD-SCHEDULED-004"
- Laisser charger complètement
- **Noter les logs initiaux**

### Étape 3: Avancer le step
1. Cliquer sur "Actions rapides"
2. Cliquer sur "Avancer étape"
3. Sélectionner une étape (ex: Étape 4)
4. Cliquer "Avancer"

### Étape 4: Analyser les logs

---

## 📊 Logs Attendus (Ordre Chronologique)

### A. Déclenchement de l'action
```
📊 [SUMMARY] Updating step to 4 for job JOB-NERD-SCHEDULED-004
```

### B. Appel API
```
📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 4
🔍 [authenticatedFetch] PATCH .../v1/job/JOB-NERD-SCHEDULED-004/step → 200
```

### C. Réponse API ⚠️ POINT CRITIQUE #1
```
✅ [UPDATE JOB STEP] Step updated successfully: { success: true, data: {...} }
🔍 [UPDATE JOB STEP] Response structure check: {
  hasSuccess: true,
  hasData: true,       ← ⚠️ DOIT ÊTRE TRUE
  hasJob: false,
  dataKeys: ["jobId", "jobCode", "currentStep", "status", ...],
  dataCurrentStep: 4,  ← ⚠️ DOIT ÊTRE 4
  dataCurrentStepType: "number"
}
```

**❌ Si `hasData: false`** → L'API retourne `{ success: true, job: {...} }` au lieu de `{ success: true, data: {...} }`

### D. Traitement dans summary.tsx ⚠️ POINT CRITIQUE #2
```
✅ [SUMMARY] Step updated successfully: { success: true, data: {...} }
🔍 [SUMMARY] Response analysis: {
  hasData: true,
  dataCurrentStep: 4,
  targetStep: 4,
  willUse: 4          ← ⚠️ DOIT ÊTRE 4
}
```

**❌ Si `dataCurrentStep: undefined`** → `response.data?.currentStep` est undefined

### E. setJob() ⚠️ POINT CRITIQUE #3
```
🔍 [SUMMARY] BEFORE setJob - job.step: { actualStep: 3 }
🔍 [SUMMARY] Inside setJob callback: {
  prevStep: { actualStep: 3 },
  newStep: 4
}
🔍 [SUMMARY] Returning from setJob: {
  newStep: { actualStep: 4 }
}
🔍 [SUMMARY] AFTER setJob (async) - job.step: { actualStep: 3 }  ← Normal (state async)
```

### F. Détection du changement ⚠️ POINT CRITIQUE #4
```
🔍 [SUMMARY] job.step changed: {
  actualStep: 4,           ← ⚠️ DOIT ÊTRE 4
  contextCurrentStep: 3
}
```

**❌ Si actualStep reste à 3** → setJob() n'a pas fonctionné

### G. useMemo recalcule ⚠️ POINT CRITIQUE #5
```
🔍 [jobDetails useMemo] Recalculating currentStep: {
  actualStep: 4,
  calculated: 4,           ← ⚠️ DOIT ÊTRE 4
  jobStepExists: true
}
```

**❌ Si calculated = 3** → useMemo n'a pas détecté le changement

### H. Props au Provider ⚠️ POINT CRITIQUE #6
```
🔍 [jobDetails] Props to JobTimerProvider: {
  jobId: "JOB-NERD-SCHEDULED-004",
  currentStep: 4,          ← ⚠️ DOIT ÊTRE 4
  totalSteps: 5,
  jobStepActualStep: 4
}
```

**❌ Si currentStep = 3** → useMemo n'a pas propagé

### I. JobTimerProvider sync ⚠️ POINT CRITIQUE #7
```
🔍 [JobTimerProvider] Sync check: {
  propsCurrentStep: 4,
  timerCurrentStep: 3,
  isInternalUpdate: false,
  hasTimerData: true,
  isDifferent: true,       ← ⚠️ DOIT ÊTRE TRUE
  isPositive: true,
  willSync: true           ← ⚠️ DOIT ÊTRE TRUE
}
🔍 [JobTimerProvider] SYNCING step from 3 to 4
✅ [JobTimerProvider] Sync completed - new step: 4
```

**❌ Si `willSync: false`** → Une des conditions de sync n'est pas remplie

### J. JobTimerDisplay re-render ⚠️ POINT CRITIQUE #8
```
🔍 [JobTimerDisplay] Rendering with: {
  contextCurrentStep: 4,   ← ⚠️ DOIT ÊTRE 4
  contextTotalSteps: 5,
  jobStepActualStep: 4,
  match: true
}
```

**❌ Si contextCurrentStep = 3** → La sync du provider n'a pas fonctionné

### K. UI Update
```
Debug badge affiche: "Context step=4/5 | Job step=4"  ← ✅ LES DEUX À 4
Timeline affiche: "Étape 4/5"
Toast: "Étape mise à jour: 4"
```

---

## 🔍 Diagnostic par Point de Rupture

### Si échec au Point C (Response structure)
**Symptôme:** `hasData: false` ou `dataCurrentStep: undefined`

**Cause:** L'API backend retourne une structure différente

**Solution:**
```typescript
// Dans summary.tsx, modifier:
actualStep: response.data?.currentStep || response.job?.currentStep || targetStep
```

### Si échec au Point E (setJob callback)
**Symptôme:** `newStep` est undefined ou incorrect

**Cause:** `response.data?.currentStep` est undefined

**Solution:** Même que Point C

### Si échec au Point F (Détection changement)
**Symptôme:** Le useEffect de surveillance ne se déclenche pas

**Cause:** `job.step` n'est pas un nouvel objet (même référence)

**Solution:**
```typescript
// Forcer nouvelle référence
setJob((prevJob: any) => {
    return {
        ...prevJob,
        step: {
            actualStep: response.data?.currentStep || targetStep
        },
        _timestamp: Date.now() // Force nouvelle référence
    };
});
```

### Si échec au Point G (useMemo)
**Symptôme:** useMemo ne recalcule pas malgré changement de `job.step.actualStep`

**Cause:** La dépendance ne détecte pas le changement

**Solution:**
```typescript
// Changer la dépendance
}, [job?.step]); // Au lieu de [job?.step?.actualStep]
```

### Si échec au Point I (Provider sync)
**Symptôme:** `willSync: false` alors que `propsCurrentStep` a changé

**Causes possibles:**
- `isInternalUpdateRef.current = true`
- `timer.timerData` est null
- `currentStep === timer.currentStep`

**Solution:**
```typescript
// Forcer sync sans conditions
if (currentStep !== timer.currentStep && currentStep > 0) {
    timer.advanceStep(currentStep);
}
```

### Si échec au Point J (Display render)
**Symptôme:** `contextCurrentStep` ne change pas

**Cause:** Le contexte n'expose pas le nouveau step

**Solution:** Vérifier que `value.currentStep = timer.currentStep` dans JobTimerProvider

---

## 📋 Checklist de Test

Après avoir avancé le step, vérifier dans les logs :

- [ ] **Point C** - `dataCurrentStep: 4` ✅
- [ ] **Point D** - `willUse: 4` ✅
- [ ] **Point E** - `newStep: 4` dans setJob callback ✅
- [ ] **Point F** - `actualStep: 4` dans job.step changed ✅
- [ ] **Point G** - `calculated: 4` dans useMemo ✅
- [ ] **Point H** - `currentStep: 4` dans Props to Provider ✅
- [ ] **Point I** - `willSync: true` et SYNCING de 3 à 4 ✅
- [ ] **Point J** - `contextCurrentStep: 4` dans Display render ✅
- [ ] **Debug badge** - "Context step=4/5 | Job step=4" ✅
- [ ] **Timeline UI** - Affiche "Étape 4/5" ✅

---

## 🎯 Action Immédiate

1. **Redémarrer l'app** avec les nouveaux logs
2. **Avancer un step** (ex: 3 → 4)
3. **Copier TOUS les logs** du moment où vous cliquez jusqu'à la fin
4. **Envoyer les logs** pour analyse
5. **Vérifier le debug badge** - noter ce qu'il affiche

---

## 📸 Captures à Fournir

1. Screenshot du **debug badge** après avoir avancé le step
2. Screenshot de la **timeline** (affiche-t-elle le bon step?)
3. **Logs complets** de la console

---

**Note:** Les logs sont maintenant TRÈS verbeux. Chaque étape de la synchronisation est tracée. Cela permettra d'identifier EXACTEMENT où ça casse.

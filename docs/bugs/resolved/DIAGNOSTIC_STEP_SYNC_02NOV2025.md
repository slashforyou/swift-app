# 🔬 DIAGNOSTIC: Synchronisation des Steps - Tests Systématiques

**Date:** 2 novembre 2025  
**Problème:** "La correction de step ne fonctionne toujours pas"

---

## 🎯 Plan de Tests

### Test 1: Vérifier l'API Response Structure ✅

**Objectif:** S'assurer que l'API retourne bien `data.currentStep`

**Commande:**
```bash
# Dans le terminal
curl -X PATCH https://altivo.fr/swift-app/v1/job/JOB-NERD-SCHEDULED-004/step \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"step": 4}'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Job step updated successfully",
  "data": {
    "jobId": 4,
    "jobCode": "JOB-NERD-SCHEDULED-004",
    "currentStep": 4,
    "status": "in-progress",
    "totalSteps": 5,
    "progress": "4/5",
    "updatedAt": "2025-11-02T...",
    "changes": {
      "previousStep": 3,
      "newStep": 4,
      "stepChanged": true,
      ...
    }
  }
}
```

**✅ Test à effectuer:** Vérifier dans les logs que `response.data` existe

---

### Test 2: Vérifier que updateJobStep() retourne les bonnes données ✅

**Fichier:** `src/services/jobDetails.ts`  
**Fonction:** `updateJobStep(jobId: string, step: number)`

**Test:**
```typescript
// Ajouter des logs dans la fonction
console.log('🔍 [updateJobStep] Request:', { jobId, step });
console.log('🔍 [updateJobStep] Response:', JSON.stringify(response, null, 2));
console.log('🔍 [updateJobStep] response.data exists?', !!response.data);
console.log('🔍 [updateJobStep] response.data.currentStep:', response.data?.currentStep);
```

**Résultat attendu:**
```
🔍 [updateJobStep] Request: { jobId: "JOB-NERD-SCHEDULED-004", step: 4 }
🔍 [updateJobStep] Response: { "success": true, "data": { ... } }
🔍 [updateJobStep] response.data exists? true
🔍 [updateJobStep] response.data.currentStep: 4
```

---

### Test 3: Vérifier setJob() dans summary.tsx ✅

**Fichier:** `src/screens/JobDetailsScreens/summary.tsx`  
**Ligne:** 101-110

**Test:**
```typescript
// Dans handleAdvanceStep(), ajouter des logs
console.log('🔍 [SUMMARY] BEFORE setJob - job.step:', job?.step);

setJob((prevJob: any) => {
    console.log('🔍 [SUMMARY] prevJob.step:', prevJob?.step);
    console.log('🔍 [SUMMARY] response.data:', response.data);
    
    const newJob = {
        ...prevJob,
        step: {
            ...prevJob.step,
            actualStep: response.data?.currentStep || targetStep
        },
        status: response.data?.status || prevJob.status
    };
    
    console.log('🔍 [SUMMARY] newJob.step:', newJob.step);
    return newJob;
});

console.log('🔍 [SUMMARY] AFTER setJob - job.step:', job?.step);
```

**Résultat attendu:**
```
🔍 [SUMMARY] BEFORE setJob - job.step: { actualStep: 3 }
🔍 [SUMMARY] prevJob.step: { actualStep: 3 }
🔍 [SUMMARY] response.data: { currentStep: 4, status: "in-progress", ... }
🔍 [SUMMARY] newJob.step: { actualStep: 4 }
🔍 [SUMMARY] AFTER setJob - job.step: { actualStep: 3 }  ← Normal (state async)
```

---

### Test 4: Vérifier que useMemo recalcule currentStep ✅

**Fichier:** `src/screens/jobDetails.tsx`  
**Ligne:** 385-395

**Test:**
```typescript
const currentStep = React.useMemo(() => {
    try {
        const step = job?.step?.actualStep || 0;
        console.log('🔍 [useMemo] Recalculating currentStep:', step);
        console.log('🔍 [useMemo] job.step:', job?.step);
        jobDetailsLogger.debug('[JobDetails] Current step calculated:', step);
        return step;
    } catch (error) {
        jobDetailsLogger.error('calculating currentStep', error);
        return 0;
    }
}, [job?.step?.actualStep]);
```

**Résultat attendu après setJob():**
```
🔍 [useMemo] Recalculating currentStep: 4
🔍 [useMemo] job.step: { actualStep: 4 }
```

---

### Test 5: Vérifier JobTimerProvider reçoit le nouveau currentStep ✅

**Fichier:** `src/screens/jobDetails.tsx`  
**Ligne:** 528

**Test:**
```typescript
// Avant le return, ajouter log
console.log('🔍 [jobDetails] Passing to JobTimerProvider:', {
    jobId: actualJobId,
    currentStep,
    totalSteps,
    jobStepActualStep: job?.step?.actualStep
});

return (
    <JobTimerProvider
        jobId={actualJobId}
        currentStep={currentStep}
        totalSteps={totalSteps}
        ...
```

**Résultat attendu:**
```
🔍 [jobDetails] Passing to JobTimerProvider: {
  jobId: "JOB-NERD-SCHEDULED-004",
  currentStep: 4,
  totalSteps: 5,
  jobStepActualStep: 4
}
```

---

### Test 6: Vérifier JobTimerProvider sync ✅

**Fichier:** `src/context/JobTimerProvider.tsx`  
**Ligne:** 147-161

**Test:**
```typescript
// Dans le useEffect de sync
useEffect(() => {
    console.log('🔍 [JobTimerProvider] Sync check:', {
        propsCurrentStep: currentStep,
        timerCurrentStep: timer.currentStep,
        different: currentStep !== timer.currentStep,
        hasTimerData: !!timer.timerData
    });
    
    if (isInternalUpdateRef.current) {
        timerLogger.sync('fromContext', currentStep);
        return;
    }
    
    if (timer.timerData && currentStep !== timer.currentStep && currentStep >= 0) {
        console.log('🔍 [JobTimerProvider] SYNCING from', timer.currentStep, 'to', currentStep);
        timerLogger.sync('toContext', currentStep);
        timer.advanceStep(currentStep);
    }
}, [currentStep, timer.currentStep, timer.timerData]);
```

**Résultat attendu:**
```
🔍 [JobTimerProvider] Sync check: {
  propsCurrentStep: 4,
  timerCurrentStep: 3,
  different: true,
  hasTimerData: true
}
🔍 [JobTimerProvider] SYNCING from 3 to 4
```

---

### Test 7: Vérifier JobTimerDisplay affiche le bon step ✅

**Fichier:** `src/components/jobDetails/JobTimerDisplay.tsx`

**Test:**
```typescript
const JobTimerDisplay: React.FC<JobTimerDisplayProps> = ({ job, onOpenSignatureModal }) => {
    const { colors } = useTheme();
    
    const { 
        totalElapsed,
        billableTime,
        formatTime,
        isRunning,
        isOnBreak,
        isCompleted,
        currentStep,
        totalSteps,
        ...
    } = useJobTimerContext();

    console.log('🔍 [JobTimerDisplay] Rendering with:', {
        currentStep,
        totalSteps,
        jobStepActualStep: job?.step?.actualStep
    });
    
    // ... reste du code
```

**Résultat attendu:**
```
🔍 [JobTimerDisplay] Rendering with: {
  currentStep: 4,
  totalSteps: 5,
  jobStepActualStep: 4
}
```

---

## 🔍 Points de Vérification Critiques

### Point A: Type de response.data ❌ SUSPECT

**Problème potentiel:** `response.data?.currentStep` pourrait être undefined

**Vérification:**
```typescript
// Dans summary.tsx, ligne 106
actualStep: response.data?.currentStep || targetStep
```

**Test:**
```typescript
console.log('🔍 Type check:', {
    hasData: !!response.data,
    dataType: typeof response.data,
    hasCurrentStep: 'currentStep' in (response.data || {}),
    currentStepValue: response.data?.currentStep,
    currentStepType: typeof response.data?.currentStep
});
```

### Point B: setJob() ne déclenche pas re-render ❌ SUSPECT

**Problème potentiel:** Le state ne se met pas à jour

**Vérification:**
```typescript
// Ajouter useEffect pour surveiller job.step
useEffect(() => {
    console.log('🔍 [SUMMARY] job.step changed:', job?.step);
}, [job?.step]);
```

### Point C: useMemo ne recalcule pas ❌ SUSPECT

**Problème potentiel:** La dépendance `job?.step?.actualStep` ne déclenche pas

**Vérification:**
```typescript
// Vérifier si job.step est un nouvel objet ou une référence
useEffect(() => {
    console.log('🔍 [jobDetails] job.step reference changed');
}, [job?.step]);
```

---

## 🧪 Scénario de Test Complet

### Scénario: Avancer du step 3 → 4

**1. État initial:**
```
job.step.actualStep = 3
currentStep (useMemo) = 3
JobTimerProvider currentStep = 3
JobTimerDisplay affiche "3/5"
```

**2. Action utilisateur:**
```
Click "Avancer à l'étape 4"
```

**3. Logs attendus (ordre chronologique):**
```
📊 [SUMMARY] Updating step to 4 for job JOB-NERD-SCHEDULED-004
📡 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 4
🔍 [updateJobStep] Request: { jobId: "JOB-...", step: 4 }
🔍 [authenticatedFetch] PATCH .../step → 200
🔍 [updateJobStep] Response: { success: true, data: { currentStep: 4, ... } }
✅ [UPDATE JOB STEP] Step updated successfully
✅ [SUMMARY] Step updated successfully
🔍 [SUMMARY] BEFORE setJob - job.step: { actualStep: 3 }
🔍 [SUMMARY] prevJob.step: { actualStep: 3 }
🔍 [SUMMARY] response.data: { currentStep: 4, ... }
🔍 [SUMMARY] newJob.step: { actualStep: 4 }
🔍 [SUMMARY] job.step changed: { actualStep: 4 }
🔍 [useMemo] Recalculating currentStep: 4
🔍 [jobDetails] Passing to JobTimerProvider: { currentStep: 4, ... }
🔍 [JobTimerProvider] Sync check: { propsCurrentStep: 4, timerCurrentStep: 3, ... }
🔍 [JobTimerProvider] SYNCING from 3 to 4
🔍 [JobTimerDisplay] Rendering with: { currentStep: 4, totalSteps: 5 }
```

**4. État final:**
```
job.step.actualStep = 4
currentStep (useMemo) = 4
JobTimerProvider currentStep = 4
JobTimerDisplay affiche "4/5"
Debug badge: "Context step=4/5 | Job step=4"
```

---

## 🐛 Tests à Effectuer Immédiatement

### Test Rapide 1: Vérifier response.data dans les logs actuels

**Action:**
1. Ouvrir l'app
2. Avancer le step
3. Chercher dans les logs: `✅ [SUMMARY] Step updated successfully:`

**Analyse:**
- Si l'objet affiché contient `data.currentStep` → ✅ API OK
- Si l'objet affiché est `{ success: true, job: {...} }` → ❌ Type incorrect
- Si l'objet est `undefined` → ❌ API erreur

### Test Rapide 2: Vérifier le debug badge

**Action:**
1. Avancer le step de 3 → 4
2. Regarder le badge jaune

**Analyse:**
```
Si badge = "Context step=3/5 | Job step=4"
  → Le problème est dans JobTimerProvider sync
  
Si badge = "Context step=4/5 | Job step=3"
  → Le problème est dans setJob() de summary.tsx
  
Si badge = "Context step=3/5 | Job step=3"
  → Le problème est dans l'API ou le parsing de response
```

### Test Rapide 3: Forcer un re-render

**Action:**
```typescript
// Dans summary.tsx, après setJob()
setTimeout(() => {
    console.log('🔍 [DELAYED CHECK] job.step after 500ms:', job?.step);
}, 500);
```

**Analyse:**
- Si après 500ms `job.step.actualStep = 4` → State OK, problème de timing
- Si après 500ms `job.step.actualStep = 3` → setJob() ne fonctionne pas

---

## 🎯 Hypothèses Principales

### Hypothèse 1: response.data est undefined (TRÈS PROBABLE)

**Preuve à chercher:**
```
✅ [SUMMARY] Step updated successfully: { success: true, job: {...} }
                                         ^^^^^^^^^^^^^^^ Pas de 'data'
```

**Solution si confirmé:**
```typescript
// Dans summary.tsx
actualStep: response.data?.currentStep || response.job?.currentStep || targetStep
```

### Hypothèse 2: setJob() ne propage pas (PROBABLE)

**Preuve à chercher:**
```
🔍 [SUMMARY] newJob.step: { actualStep: 4 }
... (pas de log de useMemo)
```

**Solution si confirmé:**
```typescript
// Forcer re-render avec un nouveau state
setJob((prevJob: any) => {
    const updated = {
        ...prevJob,
        step: {
            actualStep: response.data?.currentStep || targetStep
        },
        _forceUpdate: Date.now() // Forcer nouvelle référence
    };
    return updated;
});
```

### Hypothèse 3: JobTimerProvider ne sync pas (POSSIBLE)

**Preuve à chercher:**
```
🔍 [JobTimerProvider] Sync check: { propsCurrentStep: 4, timerCurrentStep: 3, different: true }
... (pas de log "SYNCING")
```

**Solution si confirmé:**
```typescript
// Forcer sync immédiate
if (currentStep !== timer.currentStep && currentStep > 0) {
    timer.advanceStep(currentStep);
}
```

---

## 📝 Checklist Diagnostic

- [ ] Ajouter logs dans `updateJobStep()` (jobDetails.ts)
- [ ] Ajouter logs dans `handleAdvanceStep()` (summary.tsx)
- [ ] Ajouter logs dans `useMemo currentStep` (jobDetails.tsx)
- [ ] Ajouter logs dans `JobTimerProvider sync` (JobTimerProvider.tsx)
- [ ] Ajouter logs dans `JobTimerDisplay` (JobTimerDisplay.tsx)
- [ ] Tester: Avancer step 3 → 4
- [ ] Capturer tous les logs
- [ ] Vérifier debug badge
- [ ] Identifier le point de rupture dans la chaîne
- [ ] Appliquer le fix ciblé

---

**Prochaine action:** Ajouter des logs de debug à chaque étape de la chaîne pour identifier précisément où la synchronisation échoue.

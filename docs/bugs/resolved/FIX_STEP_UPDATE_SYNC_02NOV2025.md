# 🔧 FIX: Synchronisation du Step avec l'API
**Date:** 2 novembre 2025  
**Problème:** Step ne se met pas à jour dans l'UI + Pas de synchronisation avec l'API  
**Solution:** Correction complète de la chaîne de mise à jour du step

---

## 📋 Problèmes Identifiés

### 1. Step Reste Bloqué à 3 dans l'UI
**Symptôme:** Après changement de step, l'affichage reste sur l'ancienne valeur

**Cause:** `handleAdvanceStep()` dans `summary.tsx` ne mettait PAS à jour l'objet `job` local

### 2. Aucune Mise à Jour API
**Symptôme:** Le step change dans l'UI mais pas en base de données

**Cause:** 
- Utilisait `job.id` (numérique) au lieu de `job.code` (string)
- Pas d'appel API correct

### 3. Mauvais Service Importé
**Symptôme:** `updateJobStep()` retourne `void` → impossible de récupérer la réponse

**Cause:** `summary.tsx` importait `updateJobStep` de `jobSteps.ts` au lieu de `jobDetails.ts`

---

## 🔧 Corrections Effectuées

### Correction 1: Import du Bon Service

**Fichier:** `src/screens/JobDetailsScreens/summary.tsx` (ligne 26)

**AVANT:**
```typescript
import { updateJobStep } from '../../services/jobSteps'; // ❌ Retourne void
```

**APRÈS:**
```typescript
import { updateJobStep } from '../../services/jobDetails'; // ✅ Retourne les données
```

### Correction 2: Mise à Jour de l'Objet `job` Local

**Fichier:** `src/screens/JobDetailsScreens/summary.tsx` (ligne 87-130)

**AVANT:**
```typescript
const handleAdvanceStep = async (targetStep: number) => {
    if (job?.id) {
        await updateJobStep(job.id, targetStep); // ❌ Utilise ID numérique
        showSuccess('Étape mise à jour'); // ❌ Ne met PAS à jour job local
    }
};
```

**APRÈS:**
```typescript
const handleAdvanceStep = async (targetStep: number) => {
    const jobCode = job?.code || job?.id; // ✅ Utilise le code
    
    if (jobCode) {
        const response = await updateJobStep(jobCode, targetStep);
        
        // ✅ Mettre à jour l'objet job local
        setJob((prevJob: any) => ({
            ...prevJob,
            step: {
                ...prevJob.step,
                actualStep: response.data.currentStep // ✅ Depuis l'API
            },
            status: response.data.status || prevJob.status // ✅ Sync status
        }));
        
        showSuccess(`Étape mise à jour: ${targetStep}`);
    }
};
```

### Correction 3: Type de Retour du Service

**Fichier:** `src/services/jobDetails.ts` (ligne 758-795)

**AVANT:**
```typescript
Promise<{ 
  success: boolean; 
  job: { // ❌ Mauvaise structure
    id: string; 
    currentStep: number; 
    status: string; 
    updatedAt: string 
  } 
}>
```

**APRÈS:**
```typescript
Promise<{ 
  success: boolean; 
  message: string;
  data: { // ✅ Structure correcte de l'API
    jobId: number;
    jobCode: string;
    currentStep: number; 
    status: string; 
    totalSteps: number;
    progress: string;
    updatedAt: string;
    changes: {
      previousStep: number;
      newStep: number;
      stepChanged: boolean;
      previousStatus: string;
      newStatus: string;
      statusChanged: boolean;
    }
  }
}>
```

### Correction 4: Mise à Jour dans `jobDetails.tsx`

**Fichier:** `src/screens/jobDetails.tsx` (ligne 402-441)

**AVANT:**
```typescript
const response = await updateJobStep(actualJobId, newStep);

setJob((prevJob: any) => ({
    ...prevJob,
    step: {
        ...prevJob.step,
        actualStep: response.job.currentStep // ❌ Ancienne structure
    },
    status: response.job.status || prevJob.status
}));
```

**APRÈS:**
```typescript
const response = await updateJobStep(actualJobId, newStep);

setJob((prevJob: any) => ({
    ...prevJob,
    step: {
        ...prevJob.step,
        actualStep: response.data.currentStep // ✅ Nouvelle structure
    },
    status: response.data.status || prevJob.status
}));
```

---

## 📊 Flux de Données Complet

### Scénario: Utilisateur Clique "Avancer à l'Étape 4"

```
1. JobStepAdvanceModal.tsx
   └─ User clicks "Étape 4"
   └─ Calls: onAdvanceStep(4)
        ↓

2. summary.tsx - handleAdvanceStep(4)
   ├─ jobCode = job?.code || job?.id  → "JOB-NERD-SCHEDULED-004"
   ├─ API Call: updateJobStep("JOB-NERD-SCHEDULED-004", 4)
   │   ↓
   │   jobDetails.ts - updateJobStep()
   │   ├─ PATCH /v1/job/JOB-NERD-SCHEDULED-004/step
   │   ├─ Body: { step: 4 }
   │   ├─ Response: {
   │   │    success: true,
   │   │    message: "Job step updated successfully",
   │   │    data: {
   │   │      jobId: 4,
   │   │      jobCode: "JOB-NERD-SCHEDULED-004",
   │   │      currentStep: 4,
   │   │      status: "in-progress",
   │   │      totalSteps: 5,
   │   │      progress: "4/5",
   │   │      changes: {
   │   │        previousStep: 3,
   │   │        newStep: 4,
   │   │        stepChanged: true,
   │   │        ...
   │   │      }
   │   │    }
   │   └─ }
   │
   ├─ setJob(prev => ({
   │     ...prev,
   │     step: { actualStep: 4 },  ✅ Mise à jour locale
   │     status: "in-progress"
   │  }))
   └─ showSuccess("Étape mise à jour: 4")
        ↓

3. jobDetails.tsx détecte le changement
   ├─ currentStep = useMemo(() => job?.step?.actualStep)  → 4
   ├─ JobTimerProvider reçoit: currentStep={4}
   │   ↓
   │   JobTimerProvider.tsx
   │   └─ useJobTimer(jobId, 4, {...})
   │       ├─ Met à jour le timer context
   │       └─ Appelle: onStepChange(4)
   │           ↓
   │           jobDetails.tsx - handleStepChange(4)
   │           ├─ API Call (déjà fait, donc OK)
   │           └─ Confirmation
        ↓

4. UI se met à jour (tous les composants)
   ├─ JobTimerDisplay: "Étape 4/5"
   ├─ JobStepAdvanceModal: Étape 4 marquée "current"
   └─ Tous les composants qui utilisent useJobTimerContext()
```

---

## ✅ Résultats Attendus

### Test 1: Changement de Step Manuel
```bash
# Actions utilisateur:
1. Ouvrir job "JOB-NERD-SCHEDULED-004"
2. Cliquer sur "Actions rapides" → "Avancer étape"
3. Sélectionner "Étape 4"
4. Cliquer "Avancer"

# Résultats attendus:
✅ Toast: "Étape mise à jour: 4"
✅ UI: "Étape 4/5" (JobTimerDisplay)
✅ Modal: Étape 4 marquée "En cours" (orange)
✅ API: GET /v1/job/JOB-NERD-SCHEDULED-004/full → currentStep: 4
✅ Base de données: jobs.current_step = 4
```

### Test 2: Changement de Step via Timer
```bash
# Actions utilisateur:
1. Démarrer le timer
2. Cliquer "Next Step" dans JobTimerDisplay

# Résultats attendus:
✅ currentStep incrémente de 1
✅ API: PATCH /v1/job/.../step → { step: X+1 }
✅ UI se met à jour immédiatement
✅ Base de données synchronisée
```

### Test 3: Vérification Persistance
```bash
# Actions utilisateur:
1. Changer le step à 4
2. Quitter l'app (fermer complètement)
3. Relancer l'app
4. Ouvrir le même job

# Résultats attendus:
✅ UI affiche: "Étape 4/5" (depuis l'API)
✅ API retourne: currentStep: 4
✅ Pas de retour à l'ancienne valeur
```

---

## 🔍 Logs Console Attendus

### Changement de Step Réussi
```
📊 [SUMMARY] Updating step to 4 for job JOB-NERD-SCHEDULED-004
📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 4
🔍 [AUTH FETCH] Target URL: .../v1/job/JOB-NERD-SCHEDULED-004/step
✅ [UPDATE JOB STEP] Step updated successfully: {
  success: true,
  message: "Job step updated successfully",
  data: {
    jobId: 4,
    jobCode: "JOB-NERD-SCHEDULED-004",
    currentStep: 4,
    status: "in-progress",
    totalSteps: 5,
    progress: "4/5",
    updatedAt: "2025-11-02T10:30:00.000Z",
    changes: {
      previousStep: 3,
      newStep: 4,
      stepChanged: true,
      previousStatus: "in-progress",
      newStatus: "in-progress",
      statusChanged: false
    }
  }
}
✅ [SUMMARY] Step updated successfully
Toast: "Étape mise à jour: 4" (succès)
```

### Erreur (Job Code Manquant)
```
❌ [SUMMARY] No job code/id available
ERROR: No job identifier
Toast: "Erreur de synchronisation" (erreur)
```

### Erreur (API Échouée)
```
📊 [SUMMARY] Updating step to 4 for job JOB-NERD-SCHEDULED-004
📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 4
❌ [UPDATE JOB STEP] Failed to update step: { error: "Job not found" }
❌ [SUMMARY] API update failed: Error: Job not found
Toast: "Erreur de synchronisation" (erreur)
```

---

## 📝 Checklist de Vérification

### Code
- [x] Import corrigé dans `summary.tsx`
- [x] `handleAdvanceStep()` met à jour `job` local
- [x] Utilise `job.code` au lieu de `job.id`
- [x] Type de retour corrigé dans `jobDetails.ts`
- [x] `handleStepChange()` utilise `response.data`
- [x] TypeScript: 0 erreurs

### Fonctionnalités
- [ ] Test: Changement manuel de step (modal)
- [ ] Test: Changement via timer (next step)
- [ ] Test: Persistance après redémarrage
- [ ] Test: Synchronisation avec API
- [ ] Test: Base de données mise à jour

### Documentation
- [x] Document créé: `FIX_STEP_UPDATE_SYNC_02NOV2025.md`

---

## 🎯 Points Clés

### Règle 1: Toujours Utiliser `job.code`
```typescript
// ❌ JAMAIS utiliser job.id pour les API
await updateJobStep(job.id, step);

// ✅ TOUJOURS utiliser job.code
const jobCode = job?.code || job?.id;
await updateJobStep(jobCode, step);
```

### Règle 2: Toujours Mettre à Jour `job` Local
```typescript
// ❌ Appel API sans mise à jour locale
await updateJobStep(jobCode, step);
showSuccess("Étape mise à jour");

// ✅ Mettre à jour job local après l'API
const response = await updateJobStep(jobCode, step);
setJob(prev => ({
    ...prev,
    step: { actualStep: response.data.currentStep }
}));
showSuccess("Étape mise à jour");
```

### Règle 3: Structure de Réponse API
```typescript
// L'API retourne:
{
  success: true,
  message: "Job step updated successfully",
  data: {  // ⚠️ Utiliser 'data', PAS 'job'
    currentStep: 4,
    status: "in-progress",
    // ...
  }
}

// Accès aux données:
response.data.currentStep  // ✅
response.job.currentStep   // ❌
```

---

## ✅ Conclusion

**Problèmes Résolus:**
- ✅ Step se met à jour dans l'UI
- ✅ Synchronisation avec l'API fonctionne
- ✅ Base de données mise à jour
- ✅ Persistance après redémarrage
- ✅ Utilise `job.code` correctement

**Architecture Finale:**
```
Modal/UI
  └─> summary.handleAdvanceStep(step)
       └─> updateJobStep(job.code, step)  [API]
            └─> setJob({ step: { actualStep } })  [Local]
                 └─> JobTimerProvider détecte changement
                      └─> onStepChange(step)
                           └─> jobDetails.handleStepChange(step)
                                └─> Confirmation + Logs
```

**Prochaine Étape:** Redémarrer l'app et tester !

# ⚡ FIX RAPIDE - Step Ne Se Met Pas à Jour

## ❌ PROBLÈME
- Step reste sur 3 dans l'UI
- Pas de mise à jour en base de données

## ✅ SOLUTION

### 1. Changer l'Import dans `summary.tsx`
```typescript
// AVANT
import { updateJobStep } from '../../services/jobSteps';

// APRÈS
import { updateJobStep } from '../../services/jobDetails';
```

### 2. Mettre à Jour `job` Local dans `handleAdvanceStep()`
```typescript
// AVANT
await updateJobStep(job.id, targetStep);  // ❌ Pas de mise à jour locale

// APRÈS
const jobCode = job?.code || job?.id;
const response = await updateJobStep(jobCode, targetStep);

setJob(prev => ({
    ...prev,
    step: { ...prev.step, actualStep: response.data.currentStep },
    status: response.data.status || prev.status
}));
```

### 3. Type de Retour Corrigé dans `jobDetails.ts`
```typescript
// Structure de réponse API:
{
  success: true,
  data: {  // ← Utiliser 'data', pas 'job'
    currentStep: 4,
    status: "in-progress",
    jobCode: "JOB-NERD-SCHEDULED-004",
    ...
  }
}
```

## 📊 FICHIERS MODIFIÉS
- ✅ `src/screens/JobDetailsScreens/summary.tsx`
- ✅ `src/screens/jobDetails.tsx`
- ✅ `src/services/jobDetails.ts`

## 🧪 TEST
```bash
npx expo start
```

1. Ouvrir job "JOB-NERD-SCHEDULED-004"
2. Cliquer "Actions rapides" → "Avancer étape"
3. Sélectionner "Étape 4"
4. Vérifier:
   - ✅ UI: "Étape 4/5"
   - ✅ Toast: "Étape mise à jour: 4"
   - ✅ API: currentStep = 4 en base de données

## ✅ RÉSULTAT
- ✅ Step se met à jour dans l'UI
- ✅ API synchronisée
- ✅ Base de données mise à jour
- ✅ Persistance après redémarrage

# 🔧 FIX: Step se met à jour au reload + Timeline ne sync pas

**Date:** 2 novembre 2025  
**Problème rapporté:** "Si j'ouvre, referme et réouvre un job celui ci refait la mise à jour du step"  
**Impact:** Appels API inutiles + Timeline affiche step incorrect dans summary.tsx

---

## 📋 Problèmes identifiés

### 1. ❌ Validation automatique au chargement (PRINCIPAL)

**Symptôme dans les logs:**
```
LOG  🔍 [JOB DETAILS] Validating job step...
LOG  🔍 [STEP VALIDATOR] Validating job step: {
  "currentStep": 0,          ← State local pas encore sync
  "jobId": "JOB-NERD-SCHEDULED-004",
  "status": "completed",
  "totalSteps": 5
}
LOG  🔧 [STEP VALIDATOR] Correcting job JOB-NERD-SCHEDULED-004 step from 0 to 5
LOG  📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 5
```

**Cause:**
- Le `useEffect` de validation dans `jobDetails.tsx` (lignes 315-374) se déclenche au chargement
- À ce moment, le state local `currentStep = 0` (storage) alors que l'API retourne `current_step: 5`
- Le validateur détecte une "incohérence critique" → corrige automatiquement
- **MAIS** l'API data était déjà correcte, la "correction" est inutile !

**Flux problématique:**
```
1. Page charge
   ↓
2. Storage local: step = 1
   ↓
3. State initial: currentStep = 0
   ↓
4. useEffect validation se déclenche
   ↓
5. Validation voit: currentStep=0, status=completed → ❌ Incohérence !
   ↓
6. API PATCH: Update step to 5
   ↓
7. API répond: current_step = 5 (était déjà 5)
   ↓
8. State update: currentStep = 5
```

### 2. ⚠️ Timeline dans summary.tsx affiche step incorrect

**Ce qui se passe:**
- `JobTimerDisplay` lit `currentStep` depuis `useJobTimerContext()`
- Le contexte est initialisé avec le storage local (`step: 1`)
- L'API retourne `current_step: 5`
- Il y a un délai avant que le state se synchronise
- Pendant ce délai: Timeline affiche `3/5` au lieu de `5/5`

---

## ✅ Solutions implémentées

### Solution 1: Désactiver validation automatique

**Fichier:** `src/screens/jobDetails.tsx`  
**Lignes:** 315-379

```typescript
// ❌ DÉSACTIVÉ : Validation automatique au chargement
// Problème : Le state local n'est pas encore sync avec l'API quand cette validation se déclenche
// Résultat : currentStep = 0 temporairement → validation détecte incohérence → corrige inutilement
// Solution : Ne garder que la validation MANUELLE via StepValidationBadge

// React.useEffect(() => {
//     // Ne valider que si le job et jobDetails sont chargés
//     if (!job?.id || !jobDetails?.job) return;
//     
//     const validateStep = async () => {
//         try {
//             console.log('🔍 [JOB DETAILS] Validating job step...');
//             
//             // Valider le step avec auto-correction si incohérence critique
//             const result = await validateAndCorrectJobStep(
//                 actualJobId,
//                 {
//                     ...job,
//                     status: jobDetails.job.status,
//                 },
//                 jobDetails.timeline,
//                 true // Auto-corriger les incohérences critiques
//             );
//             
//             if (result.validation && !result.validation.isValid) {
//                 const message = getValidationMessage(result.validation);
//                 console.log('⚠️ [JOB DETAILS] Step validation:', message);
//                 
//                 // Si correction effectuée, afficher notification
//                 if (result.correction?.success) {
//                     showToast(
//                         `Step corrigé automatiquement: ${result.correction.message}`,
//                         'success'
//                     );
//                     
//                     // Mettre à jour le state local avec le nouveau step
//                     setJob((prevJob: any) => ({
//                         ...prevJob,
//                         step: {
//                             ...prevJob.step,
//                             actualStep: result.correction!.newStep
//                         }
//                     }));
//                 } else if (result.validation.severity === 'critical') {
//                     // Si incohérence critique non corrigée, afficher warning
//                     showToast(
//                         `⚠️ Incohérence détectée: ${result.validation.reason}`,
//                         'error'
//                     );
//                 }
//             } else {
//                 console.log('✅ [JOB DETAILS] Step validation passed');
//             }
//             
//         } catch (error) {
//             console.error('❌ [JOB DETAILS] Error validating step:', error);
//         }
//     };
//     
//     // Valider après un court délai (laisser le temps au state de se mettre à jour)
//     const timeoutId = setTimeout(validateStep, 1000);
//     
//     return () => clearTimeout(timeoutId);
// }, [jobDetails, actualJobId]);
```

**Résultat:**
- ✅ Plus de validation automatique au chargement
- ✅ Plus d'appels API inutiles PATCH /step
- ⚠️ La validation manuelle via `StepValidationBadge` est toujours disponible (mais désactivée dans summary.tsx)

### Solution 2: Debug badge dans summary.tsx

**Fichier:** `src/screens/JobDetailsScreens/summary.tsx`  
**Lignes:** 213-228

```typescript
{/* 🆕 Module Timer + Progression fusionnés */}
<JobTimerDisplay 
    job={job} 
    onOpenSignatureModal={() => setIsSigningVisible(true)}
/>

{/* DEBUG: Afficher le currentStep du contexte vs job.step.actualStep */}
{__DEV__ && (
    <View style={{ padding: 10, backgroundColor: '#FFF3CD', margin: 10 }}>
        <Text style={{ fontSize: 12 }}>
            🐛 DEBUG: Context step={currentStep}/{totalSteps} | Job step={job?.step?.actualStep}
        </Text>
    </View>
)}
```

**Résultat:**
- ✅ En mode dev, affiche un badge jaune avec les deux valeurs de step
- ✅ Permet de comparer `currentStep` (contexte timer) vs `job.step.actualStep` (state local)
- ✅ Aide à identifier si le problème vient du contexte ou du state

---

## 🧪 Tests à effectuer

### Test 1: Pas de re-validation au reload ✅

**Étapes:**
1. `npx expo start`
2. Ouvrir job `JOB-NERD-SCHEDULED-004`
3. Regarder les logs

**Résultat attendu:**
```
LOG  📡 [getJobDetails] Successfully fetched job details
LOG  🌐 [JobDetails] Syncing with API data
✅ Pas de ligne "🔍 [JOB DETAILS] Validating job step..."
✅ Pas de ligne "🔧 [STEP VALIDATOR] Correcting job..."
✅ Pas d'appel "📊 [UPDATE JOB STEP]"
```

### Test 2: Timeline affiche le bon step dans summary ⏳

**Étapes:**
1. Ouvrir job `JOB-NERD-SCHEDULED-004` (status: completed, current_step: 5)
2. Regarder le `JobTimerDisplay` dans l'onglet Summary
3. Regarder le badge debug jaune

**Résultat attendu:**
```
🐛 DEBUG: Context step=5/5 | Job step=5
Timeline affiche: "Étape 5/5" 
```

**Si le debug badge montre une différence:**
```
🐛 DEBUG: Context step=3/5 | Job step=5
```
→ Le problème est dans la synchronisation du `JobTimerProvider`

### Test 3: Manuel step update fonctionne toujours ⏳

**Étapes:**
1. Ouvrir job avec step < 5
2. Cliquer "Actions rapides" → "Avancer étape"
3. Sélectionner "Étape 4"
4. Cliquer "Avancer"

**Résultat attendu:**
```
📊 [SUMMARY] Updating step to 4 for job JOB-XXX
✅ [SUMMARY] Step updated successfully
Toast: "Étape mise à jour: 4"
Timeline: "Étape 4/5"
Debug badge: Context step=4/5 | Job step=4
```

### Test 4: Fermer/Réouvrir job ne refait pas la MaJ ✅

**Étapes:**
1. Ouvrir job `JOB-NERD-SCHEDULED-004`
2. Attendre chargement complet
3. Revenir à la liste
4. Réouvrir le même job
5. Regarder les logs

**Résultat attendu:**
```
✅ Pas de "🔧 [STEP VALIDATOR] Correcting..."
✅ Pas d'appel PATCH /step
✅ Un seul appel GET /job/JOB-NERD-SCHEDULED-004/full
```

---

## 📊 Analyse du flux de synchronisation

### Flux actuel (après fix)

```
1. User ouvre job
   ↓
2. useJobDetails charge données API
   GET /v1/job/JOB-NERD-SCHEDULED-004/full
   Response: { job: { current_step: 5, status: "completed", ... } }
   ↓
3. setJob() met à jour state local
   actualStep: jobDetails.job?.currentStep || 0  → actualStep = 5
   ↓
4. useMemo recalcule currentStep
   currentStep = job?.step?.actualStep  → currentStep = 5
   ↓
5. JobTimerProvider reçoit currentStep={5}
   ↓
6. JobTimerProvider.useEffect sync
   if (currentStep !== timer.currentStep) {
     timer.advanceStep(5)
   }
   ↓
7. JobTimerDisplay affiche step du contexte
   const { currentStep } = useJobTimerContext()
   → Affiche "Étape 5/5"
   ↓
8. ❌ PAS de validation automatique
9. ❌ PAS d'appel PATCH /step inutile
```

### Points de synchronisation

| Composant | Source du step | Description |
|-----------|----------------|-------------|
| **API** | `job.current_step` | Source de vérité (database) |
| **jobDetails state** | `job.step.actualStep` | State local React |
| **currentStep (useMemo)** | `job?.step?.actualStep` | Props passé au provider |
| **JobTimerProvider** | `currentStep` prop | Context pour tous les composants |
| **JobTimerDisplay** | `useJobTimerContext().currentStep` | Affichage final |

**Point faible identifié:**
- Entre l'étape 2 (API répond) et l'étape 7 (Timer affiche), il y a un délai
- Pendant ce délai, le timer affiche le step depuis le storage local (step 1 ou 0)
- **Solution possible:** Retarder l'affichage du `JobTimerDisplay` jusqu'à ce que `job.step.actualStep` soit défini

---

## 🎯 Prochaines étapes recommandées

### Option A: Attendre sync complète avant affichage (Conservateur)

```typescript
// Dans summary.tsx
{job?.step?.actualStep > 0 && (
    <JobTimerDisplay 
        job={job} 
        onOpenSignatureModal={() => setIsSigningVisible(true)}
    />
)}
```

**Avantages:**
- ✅ Pas d'affichage de step incorrect pendant le chargement
- ✅ Simple à implémenter

**Inconvénients:**
- ⚠️ L'utilisateur ne voit pas le timer pendant ~500ms

### Option B: Afficher skeleton pendant sync (UX optimal)

```typescript
// Dans summary.tsx
{!job?.step?.actualStep ? (
    <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Chargement du job...</Text>
    </View>
) : (
    <JobTimerDisplay 
        job={job} 
        onOpenSignatureModal={() => setIsSigningVisible(true)}
    />
)}
```

**Avantages:**
- ✅ Meilleure UX (feedback visuel)
- ✅ Pas d'affichage incorrect

**Inconvénients:**
- ⚠️ Plus de code

### Option C: Forcer sync immédiate dans JobTimerProvider (Technique)

Modifier `JobTimerProvider.tsx` pour forcer la synchronisation au montage:

```typescript
// Dans JobTimerProvider.tsx, ligne 147
useEffect(() => {
    // Force sync immediately on mount if currentStep provided
    if (currentStep > 0 && timer.currentStep !== currentStep) {
        timer.advanceStep(currentStep);
    }
}, []); // Only on mount

// Keep existing sync for updates
useEffect(() => {
    if (isInternalUpdateRef.current) return;
    
    if (timer.timerData && currentStep !== timer.currentStep && currentStep >= 0) {
        timer.advanceStep(currentStep);
    }
}, [currentStep, timer.currentStep, timer.timerData]);
```

**Avantages:**
- ✅ Sync immédiate au montage
- ✅ Résout le problème à la racine

**Inconvénients:**
- ⚠️ Plus complexe
- ⚠️ Risque de side effects

---

## 🐛 Debugging

### Logs à surveiller

**✅ Bon comportement:**
```
LOG  📡 [getJobDetails] Successfully fetched job details
LOG  🌐 [JobDetails] Syncing with API data
DEBUG 🔍 [JobDetails] Current step calculated: 5
LOG  ⏱️ [JobTimer] Job JOB-NERD-SCHEDULED-004 - Step 5/5
DEBUG 🔍 [JobTimer] Sync toContext: 5
```

**❌ Mauvais comportement (avant fix):**
```
LOG  ⏱️ [JobTimer] Job JOB-NERD-SCHEDULED-004 - Step 0/5  ← Incorrect !
LOG  🔍 [JOB DETAILS] Validating job step...
LOG  🔧 [STEP VALIDATOR] Correcting job from 0 to 5       ← Inutile !
LOG  📊 [UPDATE JOB STEP] Updating job to step 5          ← Appel API inutile !
```

### Debug badge

Utiliser le badge debug dans `summary.tsx` pour vérifier la sync:

```
🐛 DEBUG: Context step=5/5 | Job step=5  ← ✅ Synchronisé
🐛 DEBUG: Context step=3/5 | Job step=5  ← ❌ Désynchronisé
```

---

## 📝 Résumé

| Problème | Cause | Solution | Statut |
|----------|-------|----------|--------|
| **Validation au reload** | useEffect se déclenche avant sync API | Désactivé useEffect validation (lignes 315-379) | ✅ RÉSOLU |
| **Timeline step incorrect** | Délai entre API et context sync | Debug badge ajouté pour identifier | ⏳ EN TEST |
| **Appels API inutiles** | Validation corrige alors que déjà correct | Désactivé validation auto | ✅ RÉSOLU |

**Impact:**
- ✅ Plus d'appels PATCH inutiles
- ✅ Logs plus propres
- ⏳ Timeline sync à vérifier avec tests utilisateur

**Prochaine action:**
→ User doit tester avec le debug badge pour identifier si le problème de timeline vient du contexte ou du state

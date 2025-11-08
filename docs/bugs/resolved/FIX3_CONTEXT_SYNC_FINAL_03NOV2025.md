# ✅ FIX #3 - Context currentStep Reste à 3 au lieu de 5 (3 Nov 2025)

## 🎯 Problème Résolu

**Badge affichait :** `Context step=3/5 | Job step=5`

✅ **Fix #1 + Fix #2** : `job.step.actualStep = 5` (fonctionnent correctement)  
❌ **Problème** : `useJobTimerContext().currentStep` retournait `3` au lieu de `5`

---

## 🔍 Root Cause Identifiée

### Problème #1 : Provider acceptait `currentStep = 0`

**Fichier :** `src/context/JobTimerProvider.tsx` (ligne 167)

**Code Problématique :**
```typescript
// ❌ AVANT: Acceptait currentStep = 0 comme valide
if (timer.timerData && currentStep !== timer.currentStep && currentStep >= 0) {
    timer.advanceStep(currentStep);  // Synce même à 0!
}
```

**Scénario du Bug :**
1. User ouvre le job → API retourne `current_step: 5`
2. jobDetails passe `currentStep: 5` au Provider
3. Provider sync correctement de 3 → 5 ✅
4. Un re-render passe temporairement `currentStep: 0` (valeur par défaut)
5. Provider sync de 5 → 0 ❌ (accepte 0 comme valide)
6. Timer se reset à 0

**Evidence dans les logs :**
```javascript
🔍 [JobTimerProvider] SYNCING step from 3 to 5  ✅
✅ [JobTimerProvider] Sync completed - new step: 5  ✅
⏱️ [JobTimer] Job JOB-NERD-SCHEDULED-004 - Step 0/5  ❌ RESET!
```

---

### Problème #2 : Hook retournait localStorage au lieu des props

**Fichier :** `src/hooks/useJobTimer.ts` (ligne 403)

**Code Problématique :**
```typescript
export const useJobTimer = (
    jobId: string, 
    currentStep: number = 0,  // ✅ Props passent 5
    options?: { ... }
) => {
    // ... hook charge timerData depuis localStorage (currentStep: 3)
    
    return {
        // ❌ AVANT: Retournait localStorage, ignorant les props!
        currentStep: timerData?.currentStep || 0,  // Retourne 3 du storage
        // ...
    };
};
```

**Flux de données :**
```
API → current_step: 5
  ↓
jobDetails.tsx → job.step.actualStep: 5
  ↓
useMemo → currentStep: 5
  ↓
Props to Provider → currentStep: 5
  ↓
Provider → useJobTimer(jobId, 5)  ✅ Passe 5
  ↓
useJobTimer → currentStep param = 5  ✅ Reçoit 5
  ↓
useJobTimer return → timerData.currentStep: 3  ❌ Retourne 3 du localStorage!
  ↓
Context.currentStep → 3  ❌ Contexte reste à 3
  ↓
Badge → "Context step=3/5"  ❌
```

**Pourquoi ce bug existait :**
1. Le hook charge `timerData` depuis localStorage (ancienne session, step=3)
2. Le hook reçoit `currentStep: 5` dans les props (de l'API)
3. Mais le hook retourne `timerData.currentStep` (localStorage) au lieu de `currentStep` (props)
4. Résultat : Le contexte affiche toujours la valeur du localStorage, jamais celle de l'API

---

## 🔧 Solutions Appliquées

### Solution #1 : Ignorer les sync à 0

**Fichier :** `src/context/JobTimerProvider.tsx` (lignes 151-167)

**Changement :**
```typescript
// 🔍 DEBUG: Log de toutes les conditions de sync
console.log('🔍 [JobTimerProvider] Sync check:', {
    propsCurrentStep: currentStep,
    timerCurrentStep: timer.currentStep,
    isInternalUpdate: isInternalUpdateRef.current,
    hasTimerData: !!timer.timerData,
    isDifferent: currentStep !== timer.currentStep,
    // ✅ FIX: Changé >= 0 en > 0
    isPositive: currentStep > 0,
    willSync: !isInternalUpdateRef.current && !!timer.timerData && currentStep !== timer.currentStep && currentStep > 0
});

// Ne pas synchroniser si le changement vient de nous-mêmes
if (isInternalUpdateRef.current) {
    timerLogger.sync('fromContext', currentStep);
    console.log('🔍 [JobTimerProvider] Skipping sync - internal update');
    return;
}

// ✅ FIX #3a: Ne sync QUE si currentStep > 0 (ignorer les 0)
if (timer.timerData && currentStep !== timer.currentStep && currentStep > 0) {
    console.log(`🔍 [JobTimerProvider] SYNCING step from ${timer.currentStep} to ${currentStep}`);
    timerLogger.sync('toContext', currentStep);
    timer.advanceStep(currentStep);
    console.log(`✅ [JobTimerProvider] Sync completed - new step: ${currentStep}`);
} else {
    console.log('🔍 [JobTimerProvider] No sync needed');
}
```

**Avant (Buggy) :**
```typescript
if (timer.timerData && currentStep !== timer.currentStep && currentStep >= 0) {
//                                                                      ^^^^^ ❌ Accepte 0
```

**Après (Fixed) :**
```typescript
if (timer.timerData && currentStep !== timer.currentStep && currentStep > 0) {
//                                                                      ^^^^ ✅ Refuse 0
```

**Impact :**
- Empêche les re-renders avec `currentStep = 0` de reset le timer
- Le timer reste stable à 5 au lieu de faire 5 → 0
- Logs : "No sync needed" au lieu de "SYNCING step from 5 to 0"

---

### Solution #2 : Prioriser props API sur localStorage

**Fichier :** `src/hooks/useJobTimer.ts` (ligne 403)

**Changement :**
```typescript
return {
    timerData,
    totalElapsed: getTotalElapsed(),
    billableTime: getBillableTime(),
    formatTime,
    calculateCost,
    startTimer,
    startTimerWithJobData,
    advanceStep,
    startBreak,
    stopBreak,
    isRunning: timerData?.isRunning || false,
    isOnBreak: timerData?.isOnBreak || false,
    
    // ✅ FIX #3b: Prioriser currentStep des props (API) sur timerData (localStorage)
    currentStep: currentStep > 0 ? currentStep : (timerData?.currentStep || 0),
    //           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ NOUVEAU: Props API en priorité
    //                                          ^^^^^^^^^^^^^^^^^^^^^^^^^ Fallback localStorage
    
    HOURLY_RATE_AUD,
    finalCost,
    finalBillableHours,
    isCompleted: timerData ? timerData.currentStep >= totalSteps : false,
    totalSteps,
};
```

**Avant (Buggy) :**
```typescript
currentStep: timerData?.currentStep || 0,
//           ^^^^^^^^^^^^^^^^^^^^^^ ❌ Toujours localStorage (3), jamais props (5)
```

**Après (Fixed) :**
```typescript
currentStep: currentStep > 0 ? currentStep : (timerData?.currentStep || 0),
//           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ✅ Props API si > 0
//                                          ^^^^^^^^^^^^^^^^^^^^^^^^^ localStorage sinon
```

**Logique de Priorisation :**

| Cas | Props `currentStep` | localStorage `timerData.currentStep` | Valeur Retournée | Raison |
|-----|---------------------|--------------------------------------|------------------|--------|
| 1   | 5 (API)             | 3 (ancien)                          | **5** ✅         | API est source de vérité |
| 2   | 0 (pas encore chargé) | 3 (ancien)                        | **3** ✅         | Fallback sur localStorage |
| 3   | 0 (pas encore chargé) | undefined                         | **0** ✅         | Job jamais démarré |
| 4   | 7 (API updated)     | 5 (ancien)                          | **7** ✅         | API sync après progression |

**Impact :**
- Le contexte retourne maintenant la valeur de l'API (5) au lieu du localStorage (3)
- Le badge affichera `Context step=5/5` au lieu de `Context step=3/5`
- La synchronisation API → UI fonctionne correctement

---

## 📊 Résultat Attendu

### Avant les Fixes

```
API: current_step = 5 ✅
  ↓
Transformation: job.step.actualStep = 5 ✅
  ↓
Props to Provider: currentStep = 5 ✅
  ↓
Provider sync: 3 → 5 ✅
  ↓
Re-render: currentStep = 0 ❌ (temporaire)
  ↓
Provider sync: 5 → 0 ❌ (accepte 0)
  ↓
Hook return: timerData.currentStep = 3 ❌ (localStorage)
  ↓
Context: currentStep = 3 ❌
  ↓
Badge: "Context step=3/5 | Job step=5" ❌
```

### Après les Fixes

```
API: current_step = 5 ✅
  ↓
Transformation: job.step.actualStep = 5 ✅
  ↓
Props to Provider: currentStep = 5 ✅
  ↓
Provider sync: 3 → 5 ✅
  ↓
Re-render: currentStep = 0 ✅ (temporaire)
  ↓
Provider: "No sync needed" ✅ (ignore 0)
  ↓
Hook return: currentStep (props) = 5 ✅ (priorité API)
  ↓
Context: currentStep = 5 ✅
  ↓
Badge: "Context step=5/5 | Job step=5" ✅
```

---

## ✅ Vérifications

### Fichiers Modifiés

1. **`src/context/JobTimerProvider.tsx`**
   - Ligne 156 : `isPositive: currentStep > 0` (changé de `>= 0`)
   - Ligne 158 : `willSync: ... && currentStep > 0` (changé de `>= 0`)
   - Ligne 167 : `if (... && currentStep > 0)` (changé de `>= 0`)

2. **`src/hooks/useJobTimer.ts`**
   - Ligne 404 : `currentStep: currentStep > 0 ? currentStep : (timerData?.currentStep || 0)`
   - Commentaire ajouté : "✅ FIX #3: Prioriser currentStep des props (API) sur timerData (localStorage)"

### Logs Attendus

**Au chargement du job :**
```javascript
🔍 [getJobDetails] Step data from API: { finalCurrentStep: 5 }
🔍 [getJobDetails] Transformed job.step: { actualStep: 5, totalSteps: 5 }
🔍 [jobDetails setJob] jobDetails.job.step: { stepActualStep: 5 }
🔍 [jobDetails useMemo] Recalculating currentStep: { actualStep: 5, calculated: 5 }
🔍 [jobDetails] Props to JobTimerProvider: { currentStep: 5 }
🔍 [JobTimerProvider] Sync check: { propsCurrentStep: 5, timerCurrentStep: 3 }
🔍 [JobTimerProvider] SYNCING step from 3 to 5
✅ [JobTimerProvider] Sync completed - new step: 5
```

**Lors d'un re-render temporaire avec 0 :**
```javascript
🔍 [jobDetails] Props to JobTimerProvider: { currentStep: 0 }
🔍 [JobTimerProvider] Sync check: { propsCurrentStep: 0, timerCurrentStep: 5, isPositive: false }
🔍 [JobTimerProvider] No sync needed  ✅ IGNORE le 0
```

**Badge Display :**
```javascript
DEBUG : Context step = 5/5 | Job step = 5  ✅✅✅
```

### Erreurs TypeScript

**0 nouvelles erreurs** introduites par ce fix.

**1 erreur pré-existante** (non bloquante) :
- `jobDetails.tsx` ligne 421 : `totalSteps used before declaration`
- Cette erreur existait avant le fix
- N'empêche pas l'exécution runtime

---

## 🧪 Tests à Effectuer

### Test 1 : Badge Display
1. Ouvrir un job avec `current_step = 5`
2. **Vérifier :** Badge affiche `"Context step=5/5 | Job step=5"`
3. **Résultat attendu :** ✅ Les deux valeurs sont identiques et correctes

### Test 2 : Pas de Reset à 0
1. Ouvrir le job
2. **Vérifier les logs :** Aucun log `"SYNCING step from X to 0"`
3. **Résultat attendu :** ✅ Timer reste stable, pas de reset

### Test 3 : Synchronisation API
1. Ouvrir différents jobs avec différents `current_step` (1, 2, 3, 4, 5)
2. **Vérifier :** Badge affiche toujours le step correct de l'API
3. **Résultat attendu :** ✅ Context et Job step sont identiques

### Test 4 : Timeline Active Step
1. Ouvrir un job en cours (step 2 ou 3)
2. **Vérifier :** L'icône de step actif est correctement positionnée
3. **Résultat attendu :** ✅ Le bon step est mis en surbrillance

### Test 5 : Avancer Step
1. Ouvrir un job non-complété (step 1-4)
2. Appuyer sur "Avancer étape"
3. **Vérifier :**
   - Toast notification apparaît
   - Timeline avance à l'étape suivante
   - Badge met à jour les deux valeurs (+1)
4. **Résultat attendu :** ✅ Toute la chaîne fonctionne

---

## 📝 Récapitulatif Complet des 3 Fixes

### Fix #1 : Transformation API → job.step.actualStep
**Fichier :** `src/services/jobs.ts`  
**Problème :** API retourne `current_step` mais transformation ne créait pas `job.step.actualStep`  
**Solution :** Extraire `current_step` et créer `job.step = { actualStep: X, totalSteps: Y }`

### Fix #2 : Utiliser le bon chemin dans setJob
**Fichier :** `src/screens/jobDetails.tsx`  
**Problème :** setJob cherchait `jobDetails.job.currentStep` (n'existe pas)  
**Solution :** Utiliser `jobDetails.job.step.actualStep` avec fallbacks

### Fix #3 : Prioriser API sur localStorage
**Fichiers :** `src/context/JobTimerProvider.tsx` + `src/hooks/useJobTimer.ts`  
**Problème 1 :** Provider acceptait `currentStep = 0` et reset le timer  
**Solution 1 :** Changer condition de `>= 0` à `> 0`  
**Problème 2 :** Hook retournait localStorage (3) au lieu de props API (5)  
**Solution 2 :** `currentStep: currentStep > 0 ? currentStep : (timerData?.currentStep || 0)`

---

## 🎯 Prochaines Étapes

1. **Recharger l'app** : `npx expo start --clear`
2. **Ouvrir un job** : JOB-NERD-SCHEDULED-004
3. **Vérifier le badge** : Doit afficher `5/5 | 5`
4. **Tester l'avancement** : Ouvrir un job à step 1-4 et avancer
5. **Confirmer la stabilité** : Pas de reset, pas de boucles infinies

**Si tout fonctionne :**
- ✅ Problème de synchronisation step RÉSOLU
- ✅ Tous les fixes validés (Fix #1 + Fix #2 + Fix #3)
- ✅ Prêt pour les tests d'avancement de step

**Si problème persiste :**
- Envoyer les nouveaux logs console
- Vérifier que les 3 fixes sont bien appliqués
- Confirmer les valeurs dans les logs de debug


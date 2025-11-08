# 🔧 FIX BOUCLE INFINIE TIMER - 04 Nov 2025

## 🐛 PROBLÈME IDENTIFIÉ

**Symptôme:** Boucle infinie de logs dans la console
```
🔍 [JobTimerProvider] Sync check: Object
🔍 [JobTimerProvider] No sync needed
```
Se répète indéfiniment toutes les ~100ms.

**Cause racine:**
Le `useEffect` de synchronisation dans `JobTimerProvider.tsx` (lignes 150-178) avait `timer.currentStep` et `timer.timerData` dans ses dépendances. Ces valeurs changent continuellement quand le timer tourne, causant le re-déclenchement infini du useEffect.

```typescript
// ❌ AVANT (BOUCLE INFINIE)
useEffect(() => {
    if (timer.timerData && currentStep !== timer.currentStep && currentStep > 0) {
        timer.advanceStep(currentStep);
    }
}, [currentStep, timer.currentStep, timer.timerData]); 
//          ^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^
//          Ces deux changent constamment !
```

---

## ✅ SOLUTION APPLIQUÉE

### 1. Ajout d'une ref pour tracker le dernier step synchronisé

```typescript
// ✅ FIX: Tracker le dernier step synchronisé
const lastSyncedStepRef = useRef<number>(currentStep);
```

### 2. Modification du useEffect pour éviter les re-syncs

```typescript
// ✅ APRÈS (PAS DE BOUCLE)
useEffect(() => {
    // Ne pas synchroniser si le changement vient de nous-mêmes
    if (isInternalUpdateRef.current) {
        timerLogger.sync('fromContext', currentStep);
        return;
    }
    
    // ✅ Ne sync que si le step a VRAIMENT changé depuis la dernière sync
    if (currentStep !== lastSyncedStepRef.current && currentStep > 0 && timer.timerData) {
        console.log(`🔄 [JobTimerProvider] SYNCING step from ${timer.currentStep} to ${currentStep}`);
        timerLogger.sync('toContext', currentStep);
        timer.advanceStep(currentStep);
        lastSyncedStepRef.current = currentStep; // ✅ Sauvegarder le step synchronisé
        console.log(`✅ [JobTimerProvider] Sync completed`);
    }
}, [currentStep]); // ✅ Dépendance UNIQUEMENT sur currentStep
// Plus de timer.currentStep ni timer.timerData dans les dépendances !
```

---

## 🎯 CHANGEMENTS APPLIQUÉS

### Fichier modifié: `src/context/JobTimerProvider.tsx`

**Ligne ~63-66:**
```typescript
// AJOUTÉ
const lastSyncedStepRef = useRef<number>(currentStep);
```

**Ligne ~150-165:**
```typescript
// MODIFIÉ: useEffect de synchronisation
useEffect(() => {
    if (isInternalUpdateRef.current) {
        timerLogger.sync('fromContext', currentStep);
        return;
    }
    
    if (currentStep !== lastSyncedStepRef.current && currentStep > 0 && timer.timerData) {
        console.log(`🔄 [JobTimerProvider] SYNCING step from ${timer.currentStep} to ${currentStep}`);
        timer.advanceStep(currentStep);
        lastSyncedStepRef.current = currentStep;
        console.log(`✅ [JobTimerProvider] Sync completed`);
    }
}, [currentStep]); // ✅ Dépendances réduites
```

---

## 🔍 POURQUOI ÇA MARCHE

### Avant (boucle infinie)
```
1. useEffect se déclenche (currentStep=2, timer.currentStep=1)
2. Appelle timer.advanceStep(2)
3. timer.currentStep change de 1 → 2
4. useEffect se déclenche à nouveau (dépendance: timer.currentStep)
5. timer.timerData se met à jour (timer tick)
6. useEffect se déclenche encore (dépendance: timer.timerData)
7. Retour à l'étape 4 → BOUCLE INFINIE
```

### Après (stable)
```
1. useEffect se déclenche (currentStep=2, lastSyncedStepRef=1)
2. Condition: 2 !== 1 → TRUE → Sync
3. lastSyncedStepRef = 2
4. timer.currentStep change de 1 → 2
5. useEffect NE SE DÉCLENCHE PAS (timer.currentStep n'est plus une dépendance)
6. timer.timerData se met à jour (timer tick)
7. useEffect NE SE DÉCLENCHE PAS (timer.timerData n'est plus une dépendance)
8. Prochain déclenchement: UNIQUEMENT si currentStep (props) change
```

---

## 📊 RÉSULTAT ATTENDU

### Avant le fix
```
Console Logs (toutes les 100ms):
🔍 [JobTimerProvider] Sync check: Object
🔍 [JobTimerProvider] No sync needed
🔍 [JobTimerProvider] Sync check: Object
🔍 [JobTimerProvider] No sync needed
... (infini)
```

### Après le fix
```
Console Logs (une seule fois au changement):
🔄 [JobTimerProvider] SYNCING step from 1 to 2
✅ [JobTimerProvider] Sync completed

(Puis silence jusqu'au prochain changement de step)
```

---

## ✅ VERIFICATION

### Test 1: Démarrer l'app
```bash
1. npx expo start --clear
2. Ouvrir un job
3. Vérifier les logs console
4. ✅ Doit montrer le sync UNE SEULE FOIS
5. ❌ Ne doit PAS répéter les logs indéfiniment
```

### Test 2: Avancer step
```bash
1. Avancer le job à step 2
2. Vérifier les logs
3. ✅ Doit montrer:
   🔄 [JobTimerProvider] SYNCING step from 1 to 2
   ✅ [JobTimerProvider] Sync completed
4. ❌ Ne doit PAS montrer de logs répétés après
```

### Test 3: Timer qui tourne
```bash
1. Démarrer le timer
2. Attendre 10 secondes
3. Vérifier les logs
4. ✅ Timer doit s'incrémenter (0h01, 0h02, etc.)
5. ❌ Ne doit PAS montrer de "Sync check" répétés
```

---

## 🎯 CONCLUSION

**Problème:** Boucle infinie causée par des dépendances qui changent constamment dans useEffect

**Solution:** 
1. Utiliser une ref (`lastSyncedStepRef`) pour tracker le dernier step synchronisé
2. Ne dépendre QUE de `currentStep` (props) dans le useEffect
3. Comparer avec `lastSyncedStepRef` au lieu de `timer.currentStep`

**Résultat:** Synchronisation stable sans boucle infinie ✅

---

**Créé:** 04 Novembre 2025  
**Status:** ✅ FIX APPLIQUÉ  
**Fichier modifié:** `src/context/JobTimerProvider.tsx`

# 🔄 Documentation - Flux de Synchronisation JobDetails ⟷ JobTimerProvider

**Date:** 2 novembre 2025  
**Version:** 1.0

---

## 📋 Vue d'ensemble

Cette documentation explique le **flux de synchronisation bidirectionnelle** entre `jobDetails.tsx` et `JobTimerProvider.tsx`. Ce mécanisme est **critique** et **délicat** car il peut facilement créer des boucles infinies s'il n'est pas bien compris.

---

## 🎯 Objectif de la synchronisation

**Problème à résoudre:**
- `jobDetails.tsx` reçoit des données API avec `job.step.actualStep`
- `JobTimerProvider` gère le timer et maintient `currentStep` en mémoire
- Les deux doivent rester **synchronisés** en permanence

**Flux de données:**
```
API → jobDetails → JobTimerProvider → Tous les composants enfants
↑                                              ↓
└──────────── Callback onStepChange ───────────┘
```

---

## ⚙️ Mécanisme de protection contre les boucles

### 🔒 **Protection avec `isInternalUpdateRef`**

```typescript
// Dans JobTimerProvider.tsx
const isInternalUpdateRef = useRef(false);
```

**Rôle:** Distinguer les changements **internes** (provenant du context) des changements **externes** (provenant de jobDetails).

**Cycle de vie:**
```
1. Timer change step (ex: bouton "Étape suivante")
   ↓
2. isInternalUpdateRef = true (marquer comme interne)
   ↓
3. timer.advanceStep(newStep) (changer le state)
   ↓
4. onStepChange(newStep) (notifier jobDetails)
   ↓
5. jobDetails met à jour son state local
   ↓
6. useEffect détecte le changement de currentStep
   ↓
7. isInternalUpdateRef = true → SKIP sync ✅
   ↓
8. Timeout 100ms → isInternalUpdateRef = false
```

---

## 🔁 Flux détaillé étape par étape

### **Scénario 1: Changement depuis le Timer (bouton "Étape suivante")**

```typescript
// 1. User clique sur "Étape suivante" dans JobClock
handleNextStep() → nextStep()

// 2. Dans JobTimerProvider.nextStep()
const nextStep = useCallback(() => {
    if (timer.currentStep < safeTotalSteps) {
        const newStep = timer.currentStep + 1;
        
        // ✅ ÉTAPE CRITIQUE: Marquer comme update interne
        isInternalUpdateRef.current = true;
        
        // Changer le state du timer
        timer.advanceStep(newStep);
        
        // Notifier jobDetails du changement
        if (onStepChange) {
            onStepChange(newStep); // → jobDetails.handleStepChange(newStep)
        }
        
        // Reset après 100ms
        setTimeout(() => {
            isInternalUpdateRef.current = false;
        }, 100);
    }
}, [timer.currentStep, timer.advanceStep, safeTotalSteps, onStepChange]);

// 3. Dans jobDetails.handleStepChange()
const handleStepChange = (newStep: number) => {
    jobDetailsLogger.stepChange(newStep);
    
    // Mettre à jour le state local (job.step.actualStep)
    setJob((prevJob: any) => ({
        ...prevJob,
        step: {
            ...prevJob.step,
            actualStep: newStep // ← Déclenche useMemo qui calcule currentStep
        },
        current_step: newStep
    }));
};

// 4. useMemo recalcule currentStep
const currentStep = React.useMemo(() => {
    return job?.step?.actualStep || 0; // newStep
}, [job?.step?.actualStep]); // ← Dépendance change!

// 5. useEffect dans JobTimerProvider détecte currentStep changé
useEffect(() => {
    // ✅ PROTECTION: Ne pas synchroniser si changement interne
    if (isInternalUpdateRef.current) {
        timerLogger.sync('fromContext', currentStep);
        return; // ← SKIP! Pas de boucle ✅
    }
    
    // Si changement externe, synchroniser
    if (currentStep !== timer.currentStep && currentStep >= 0) {
        timer.advanceStep(currentStep);
    }
}, [currentStep]);
```

**Résultat:** Pas de boucle ✅

---

### **Scénario 2: Changement depuis l'API (données rafraîchies)**

```typescript
// 1. API retourne nouvelles données avec step différent
useEffect(() => {
    if (jobDetails) {
        setJob((prevJob: any) => ({
            ...prevJob,
            step: {
                ...prevJob.step,
                actualStep: jobDetails.job?.current_step || 0 // Nouvelle valeur API
            }
        }));
    }
}, [jobDetails]);

// 2. useMemo recalcule currentStep (nouvelle valeur)
const currentStep = React.useMemo(() => {
    return job?.step?.actualStep || 0; // Valeur de l'API
}, [job?.step?.actualStep]);

// 3. currentStep passé comme prop à JobTimerProvider
<JobTimerProvider
    currentStep={currentStep} // ← Prop change!
    ...
/>

// 4. useEffect dans JobTimerProvider
useEffect(() => {
    // isInternalUpdateRef.current = false (changement externe)
    if (isInternalUpdateRef.current) {
        return; // Non, pas un changement interne
    }
    
    // ✅ Synchroniser avec le timer
    if (currentStep !== timer.currentStep && currentStep >= 0) {
        timerLogger.sync('toContext', currentStep);
        timer.advanceStep(currentStep); // Mettre à jour le timer
    }
}, [currentStep]);
```

**Résultat:** Timer synchronisé avec API ✅

---

## ⚠️ Points d'attention critiques

### **1. Timeout de 100ms**

```typescript
setTimeout(() => {
    isInternalUpdateRef.current = false;
}, 100);
```

**Pourquoi 100ms?**
- Assez long pour que React termine tous les re-renders
- Assez court pour ne pas bloquer les changements externes
- **⚠️ Fragile:** Si React est lent (ancien device), peut créer des bugs

**Alternative possible:** Utiliser `queueMicrotask` ou `Promise.resolve().then()`

---

### **2. Dépendances du useEffect**

```typescript
useEffect(() => {
    // ...
}, [currentStep]); // ⚠️ NE PAS ajouter timer.currentStep ici!
```

**Pourquoi?**
- Si on ajoute `timer.currentStep`, l'effet s'exécute quand le timer change
- Crée une boucle: timer change → effect → timer change → effect → ...
- **Solution:** Seulement `currentStep` (la prop externe)

---

### **3. Ordre des opérations dans nextStep()**

```typescript
// ✅ BON ORDRE
isInternalUpdateRef.current = true;  // 1. Marquer AVANT
timer.advanceStep(newStep);          // 2. Changer timer
onStepChange(newStep);               // 3. Notifier jobDetails
setTimeout(() => { ... }, 100);      // 4. Reset après délai

// ❌ MAUVAIS ORDRE
timer.advanceStep(newStep);          // 1. Timer change
onStepChange(newStep);               // 2. jobDetails change
isInternalUpdateRef.current = true;  // 3. Marquer APRÈS (trop tard!)
// → Boucle infinie possible!
```

---

## 🔍 Debugging

### **Logs utiles**

```typescript
// Dans JobTimerProvider
timerLogger.sync('toContext', currentStep);   // Sync vers timer
timerLogger.sync('fromContext', currentStep); // Skip (changement interne)

// Dans jobDetails
jobDetailsLogger.stepChange(newStep); // Step changé depuis timer
```

### **Vérifier les boucles**

```bash
# Si logs en boucle:
🔄 [JobTimerProvider] Sync toContext: 3
🔄 [JobDetails] Step changed to: 3
🔄 [JobTimerProvider] Sync toContext: 3
🔄 [JobDetails] Step changed to: 3
# → Boucle infinie détectée! ❌

# Si normal:
🔄 [JobTimerProvider] Sync toContext: 3
🔄 [JobDetails] Step changed to: 3
🔒 [JobTimerProvider] Skipping sync - internal update
# → Protection fonctionne ✅
```

---

## 📊 Diagramme de séquence

```
┌─────────────┐         ┌──────────────────┐         ┌────────────┐
│  JobDetails │         │ JobTimerProvider │         │ useJobTimer│
└──────┬──────┘         └────────┬─────────┘         └─────┬──────┘
       │                         │                         │
       │ User clicks "Next Step" │                         │
       │◄────────────────────────│                         │
       │                         │                         │
       │                    nextStep()                     │
       │                         ├─────────────────────────►
       │                         │                         │
       │                  isInternalUpdate = true          │
       │                         │                         │
       │                    advanceStep(3)                 │
       │                         ├─────────────────────────►
       │                         │                         │
       │                         │     timer.currentStep = 3
       │                         │◄─────────────────────────
       │                         │                         │
       │  onStepChange(3)        │                         │
       │◄────────────────────────│                         │
       │                         │                         │
       │ setJob({ actualStep: 3 })                        │
       │                         │                         │
       │ currentStep memo → 3    │                         │
       │                         │                         │
       │ <Provider currentStep={3}/>                      │
       │─────────────────────────►                        │
       │                         │                         │
       │                   useEffect [currentStep]         │
       │                         │                         │
       │                   isInternalUpdate? YES           │
       │                         │                         │
       │                      SKIP sync ✅                 │
       │                         │                         │
       │                   setTimeout 100ms                │
       │                         │                         │
       │               isInternalUpdate = false            │
       │                         │                         │
```

---

## 🚀 Recommandations d'amélioration

### **Option 1: Debounce**

```typescript
import { useDebounce } from '@/hooks/useDebounce';

// Dans JobTimerProvider
const debouncedCurrentStep = useDebounce(currentStep, 50);

useEffect(() => {
    if (isInternalUpdateRef.current) return;
    
    if (debouncedCurrentStep !== timer.currentStep) {
        timer.advanceStep(debouncedCurrentStep);
    }
}, [debouncedCurrentStep]);
```

**Avantages:**
- Réduit les re-renders
- Plus robuste sur devices lents

---

### **Option 2: useRef au lieu de setTimeout**

```typescript
const syncCounterRef = useRef(0);

const nextStep = useCallback(() => {
    const syncId = ++syncCounterRef.current; // Incrémenter compteur
    isInternalUpdateRef.current = true;
    
    timer.advanceStep(newStep);
    onStepChange(newStep);
    
    // Reset seulement si pas de nouveau sync
    requestAnimationFrame(() => {
        if (syncCounterRef.current === syncId) {
            isInternalUpdateRef.current = false;
        }
    });
}, []);
```

**Avantages:**
- Plus précis (basé sur frame)
- Pas de timeout arbitraire

---

### **Option 3: State machine**

```typescript
type SyncState = 'idle' | 'syncing-to-timer' | 'syncing-from-timer';
const [syncState, setSyncState] = useState<SyncState>('idle');

// Rend le flow plus explicite
```

**Avantages:**
- Plus facile à debugger
- Flow plus clair

---

## 📝 Checklist de vérification

Avant de modifier le code de synchronisation, vérifier:

- [ ] `isInternalUpdateRef` est défini comme `useRef(false)`
- [ ] Marquer `isInternalUpdateRef = true` **AVANT** `timer.advanceStep()`
- [ ] Reset `isInternalUpdateRef = false` après **tous les chemins** (try/catch)
- [ ] `useEffect([currentStep])` ne contient **PAS** `timer.currentStep`
- [ ] Timeout/reset est appelé dans `finally` ou `setTimeout`
- [ ] Logs ajoutés pour débugger (`timerLogger.sync()`)
- [ ] Tests manuels sur device lent

---

## 🐛 Scénarios de bugs connus

### **Bug 1: Boucle infinie si timeout trop court**

```typescript
// ❌ Problème
setTimeout(() => {
    isInternalUpdateRef.current = false;
}, 10); // Trop court!

// Sur device lent:
// 1. isInternalUpdate = true
// 2. timer change
// 3. Timeout reset (10ms passées)
// 4. useEffect s'exécute
// 5. isInternalUpdate = false (trop tôt!)
// 6. Re-sync → Boucle ❌
```

**Solution:** Augmenter à 100ms ou utiliser `requestAnimationFrame`

---

### **Bug 2: Race condition sur multiple clics rapides**

```typescript
// User clique 3 fois rapidement:
// Click 1: step 2
// Click 2: step 3
// Click 3: step 4

// Sans protection:
// 1. isInternalUpdate = true
// 2. step → 2
// 3. Timeout 100ms
// 4. Click 2 avant timeout!
// 5. isInternalUpdate déjà true (OK)
// 6. step → 3
// 7. Timeout reset (100ms depuis click 1)
// 8. Click 3 pendant timeout
// 9. Possible désynchronisation
```

**Solution:** Vérifier `syncCounterRef` (Option 2 ci-dessus)

---

## 📚 Références

- `jobDetails.tsx` - Lignes 315-350 (useMemo et handlers)
- `JobTimerProvider.tsx` - Lignes 75-160 (nextStep, stopTimer, sync)
- `useJobTimer.ts` - Lignes 185-250 (advanceStep logic)

---

**Auteur:** Romain Giovanni (slashforyou)  
**Dernière mise à jour:** 2 novembre 2025  
**Version:** 1.0

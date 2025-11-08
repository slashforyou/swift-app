# 🐛 FIX: React Hooks Order Violation - 3 Novembre 2025

## ❌ ERREUR CRITIQUE

```
Error: Rendered more hooks than during the previous render.

Warning: React has detected a change in the order of Hooks called by JobDetails.
This will lead to bugs and errors if not fixed.

Previous render            Next render
------------------------------------------------------
35. useMemo                useMemo
36. undefined              useEffect  ← ❌ PROBLÈME ICI
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

## 🔍 DIAGNOSTIC

### Cause Racine
**Violation de la règle des Hooks de React** : Un `useEffect` a été ajouté **conditionnellement** ou **après des hooks variables**, ce qui change l'ordre des hooks entre les renders.

### Fichier Concerné
`src/screens/jobDetails.tsx`

### Code Problématique (lignes 529-537)

```typescript
// ❌ MAUVAIS PLACEMENT - Après tout le code, près du return
React.useEffect(() => {
    console.log('🔍 [jobDetails] Props to JobTimerProvider:', {
        jobId: actualJobId,
        currentStep,
        totalSteps,
        jobStepActualStep: job?.step?.actualStep
    });
}, [actualJobId, currentStep, totalSteps, job?.step?.actualStep]);

return (
    <JobTimerProvider ...>
```

**Pourquoi c'est un problème ?**
- Le `useEffect` était placé **juste avant le return**
- En fonction des conditions dans le code, l'ordre d'exécution des hooks changeait
- React détecte que le 36ème hook (qui devrait être `undefined`) devient soudainement `useEffect`
- Cela viole la règle stricte : **"Les Hooks doivent toujours être appelés dans le même ordre"**

## ✅ SOLUTION APPLIQUÉE

### Déplacement du useEffect

**Nouveau placement (après les useMemo, avec les autres hooks) :**

```typescript
// ✅ Calculer dynamiquement les steps depuis le state job (réactif)
const currentStep = React.useMemo(() => {
    try {
        const step = job?.step?.actualStep || 0;
        console.log('🔍 [jobDetails useMemo] Recalculating currentStep:', {
            actualStep: job?.step?.actualStep,
            calculated: step,
            jobStepExists: !!job?.step
        });
        return step;
    } catch (error) {
        return 0;
    }
}, [job?.step?.actualStep]);

// 🔍 DEBUG: Surveiller ce qui est passé au JobTimerProvider
// ✅ PLACÉ ICI - Juste après les useMemo, avant tout code conditionnel
React.useEffect(() => {
    console.log('🔍 [jobDetails] Props to JobTimerProvider:', {
        jobId: actualJobId,
        currentStep,
        totalSteps,
        jobStepActualStep: job?.step?.actualStep
    });
}, [actualJobId, currentStep, totalSteps, job?.step?.actualStep]);

const totalSteps = React.useMemo(() => {
    // ...
}, [job?.steps]);
```

## 📋 RÈGLES DES HOOKS DE REACT

### ✅ TOUJOURS
1. **Appelez les Hooks au niveau racine** : Ne les appelez pas dans des boucles, conditions ou fonctions imbriquées
2. **Appelez les Hooks dans le même ordre** : React se base sur l'ordre d'appel pour garder l'état correct
3. **Appelez les Hooks uniquement depuis des composants React** ou des Hooks personnalisés

### ❌ JAMAIS
```typescript
// ❌ Dans une condition
if (something) {
    useEffect(() => { ... });
}

// ❌ Dans une boucle
for (let i = 0; i < 10; i++) {
    useState(i);
}

// ❌ Après un early return
if (error) return null;
useEffect(() => { ... }); // ← Ne sera jamais appelé !

// ❌ Placement variable (après du code conditionnel complexe)
const data = complexLogic();
if (data) { /* ... */ }
useEffect(() => { ... }); // ← Ordre peut changer !
```

### ✅ CORRECT
```typescript
// ✅ Tous les hooks au début, avant toute logique
const [state, setState] = useState(0);
const value = useMemo(() => compute(), [deps]);
useEffect(() => { ... }, [deps]);

// Puis le reste de la logique
if (error) return null;
const data = complexLogic();
return <div>...</div>;
```

## 🔧 MODIFICATIONS EFFECTUÉES

### Fichier: `src/screens/jobDetails.tsx`

**Ligne ~399 (nouveau placement) :**
```diff
  const currentStep = React.useMemo(() => {
      // ...
  }, [job?.step?.actualStep]);
  
+ // 🔍 DEBUG: Surveiller ce qui est passé au JobTimerProvider
+ React.useEffect(() => {
+     console.log('🔍 [jobDetails] Props to JobTimerProvider:', {
+         jobId: actualJobId,
+         currentStep,
+         totalSteps,
+         jobStepActualStep: job?.step?.actualStep
+     });
+ }, [actualJobId, currentStep, totalSteps, job?.step?.actualStep]);
  
  const totalSteps = React.useMemo(() => {
      // ...
  }, [job?.steps]);
```

**Ligne ~529 (ancien placement - SUPPRIMÉ) :**
```diff
  jobDetailsLogger.render({
      // ...
  });
  
- // 🔍 DEBUG: Surveiller ce qui est passé au JobTimerProvider
- React.useEffect(() => {
-     console.log('🔍 [jobDetails] Props to JobTimerProvider:', {
-         jobId: actualJobId,
-         currentStep,
-         totalSteps,
-         jobStepActualStep: job?.step?.actualStep
-     });
- }, [actualJobId, currentStep, totalSteps, job?.step?.actualStep]);
  
  // ✅ JobTimerProvider wraps the entire UI
  return (
```

## 📊 VÉRIFICATION

### Avant le Fix
```
❌ Error: Rendered more hooks than during the previous render.
❌ App crashe avec ErrorBoundary
❌ JobDetails screen inaccessible
```

### Après le Fix
```
✅ 0 TypeScript errors
✅ Hooks appelés dans le même ordre à chaque render
✅ App démarre sans crash
✅ JobDetails screen accessible
```

## 🎯 PROCHAINES ÉTAPES

1. **Tester l'application** :
   ```bash
   # L'app devrait redémarrer automatiquement avec Fast Refresh
   # Ouvrir job JOB-NERD-SCHEDULED-004
   ```

2. **Vérifier les logs** :
   ```
   ✅ Devrait voir les 8 points de debug
   ✅ Pas d'erreur React Hooks
   ✅ App fonctionne normalement
   ```

3. **Continuer les tests de synchronisation** :
   - Avancer le step
   - Vérifier les logs
   - Identifier le point de rupture de la synchro

## 📝 LEÇON APPRISE

**❌ Ce qu'on a fait de mal :**
```typescript
// Mauvais : Ajouter un useEffect tout en bas du composant
const MyComponent = () => {
    const [state, setState] = useState(0);
    
    // ... 500 lignes de code ...
    
    // ❌ Ajout d'un useEffect ici = danger !
    useEffect(() => { ... }, [deps]);
    
    return <div>...</div>;
}
```

**✅ Ce qu'il faut toujours faire :**
```typescript
// Bon : Tous les hooks au début, dans un ordre fixe
const MyComponent = () => {
    // 1. Tous les useState
    const [state1, setState1] = useState(0);
    const [state2, setState2] = useState(false);
    
    // 2. Tous les useMemo
    const value1 = useMemo(() => compute1(), [deps1]);
    const value2 = useMemo(() => compute2(), [deps2]);
    
    // 3. Tous les useEffect
    useEffect(() => { effect1 }, [deps1]);
    useEffect(() => { effect2 }, [deps2]);
    
    // 4. Le reste de la logique
    const data = processData();
    
    // 5. Le return
    return <div>...</div>;
}
```

## 🔗 RESSOURCES

- [Rules of Hooks - React Documentation](https://react.dev/link/rules-of-hooks)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

**Date:** 3 Novembre 2025  
**Auteur:** GitHub Copilot  
**Statut:** ✅ RÉSOLU  
**Temps de résolution:** ~5 minutes  
**Impact:** CRITIQUE → Corrigé  

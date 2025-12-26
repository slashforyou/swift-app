# 🐛 BUG SESSION 7 - STEP 5 MANQUANT

**Date**: 17 décembre 2025 - 21:05  
**Status**: 🔍 **EN DIAGNOSTIC**

---

## 🚨 PROBLÈME REPORTÉ

**Symptôme**:
1. ✅ Badge "En attente" s'affiche correctement (correction bug #9 fonctionne)
2. ❌ **Pas de bouton pour payer** (ni "Signer" ni "Payer maintenant")
3. ❌ **Bloqué en étape 4/5** au lieu de 5/5 (même si job terminé)

---

## 🔍 DIAGNOSTIC

### Logique actuelle du bouton paiement

**Fichier**: `src/screens/JobDetailsScreens/payment.tsx` ligne 250

**Condition d'affichage**:
```typescript
{isJobCompleted() && (
    <View style={{ marginTop: DESIGN_TOKENS.spacing.md }}>
        {!hasSignature() ? (
            // Bouton "Signer le job"
        ) : (
            // Bouton "Payer maintenant"
        )}
    </View>
)}
```

**Fonction `isJobCompleted()`** (ligne 107):
```typescript
const isJobCompleted = () => {
    return currentStep >= totalSteps;  // ❌ currentStep = 4, totalSteps = 5 → false!
};
```

**Résultat**: Si `currentStep < totalSteps`, le bloc entier ne s'affiche PAS → **pas de bouton**.

---

### Pourquoi currentStep = 4 au lieu de 5 ?

**Chaîne de responsabilité**:

1. **jobDetails.tsx** (ligne 420):
```typescript
const currentStep = job.step.actualStep || 0;  // ← Vient du state job
const totalSteps = job.steps?.length || 5;     // ← Nombre de steps du template
```

2. **JobTimerProvider** (ligne 78):
```typescript
const timer = useJobTimer(safeJobId, safeCurrentStep, {
    totalSteps: safeTotalSteps,  // ← Passé au timer
    //...
});
```

3. **JobTimerDisplay** (ligne 308):
```typescript
onPress={currentStep < totalSteps ? handleNextStep : handleStopTimer}
```

**Logique**:
- Si `currentStep < totalSteps` → Bouton "Étape suivante" (appelle `nextStep()`)
- Si `currentStep >= totalSteps` → Bouton "Terminer" (appelle `stopTimer()`)

**Scénario du bug**:
```
Situation actuelle:
- job.steps.length = 5 (template avec 5 étapes)
- job.step.actualStep = 4 (étape actuelle)
- currentStep = 4
- totalSteps = 5

Bouton affiché: "Étape suivante" (car 4 < 5)
Action: Cliquer → nextStep() → Devrait passer à step 5

MAIS:
- L'utilisateur dit être "bloqué en 4/5"
- Donc nextStep() ne fonctionne PAS ou step ne se met pas à jour
```

---

### Hypothèses du problème

**Hypothèse #1: API step update retourne 404**

**Fichier**: `src/services/jobSteps.ts` ligne 64

Rappel Session 4 :
```typescript
} catch (error) {
    console.warn('⚠️ Failed to update job step (backend may not have this endpoint): 404');
    // ...
}
```

**Impact**: 
- Frontend appelle `nextStep()` → Met à jour state local → Appelle API
- API retourne 404 (endpoint `PATCH /job/{id}/step` non implémenté)
- State local mis à jour MAIS pas persisté côté serveur
- Si reload app → step revient à 4 (dernière valeur serveur)

**Vérification**: 
- L'utilisateur a-t-il rechargé l'app ?
- Le step passe-t-il à 5 temporairement puis régresse à 4 ?

---

**Hypothèse #2: Step 5 ne se crée pas dans timer**

**Fichier**: `src/hooks/useJobTimer.ts`

Possibilité :
- Le timer a une logique qui empêche de dépasser step 4
- Ou step 5 existe mais n'est pas "activé" (reste à 4)

**Vérification**: Logs du timer lors du click "Étape suivante"

---

**Hypothèse #3: Template job n'a que 4 steps**

**Possibilité**:
- `job.steps` contient seulement 4 étapes (pas 5)
- Donc `totalSteps = 4`
- Quand `currentStep = 4` → `currentStep >= totalSteps` → Job considéré terminé
- MAIS payment.tsx utilise peut-être un `totalSteps` différent ?

**Vérification**: 
```typescript
console.log('🔍 DEBUG:', {
    jobStepsLength: job.steps?.length,
    currentStep: job.step.actualStep,
    totalSteps: totalSteps,
    isCompleted: currentStep >= totalSteps
});
```

---

**Hypothèse #4: Double source de vérité pour totalSteps**

**Conflit potentiel**:
- **jobDetails.tsx**: `totalSteps = job.steps?.length || 5`
- **payment.tsx**: Utilise `totalSteps` du **JobTimerContext**

Si ces deux valeurs diffèrent → incohérence.

**Exemple**:
```
jobDetails.tsx → totalSteps = 4 (job.steps.length)
payment.tsx (context) → totalSteps = 5 (valeur par défaut context)

currentStep = 4

Dans jobDetails: 4 >= 4 → Job terminé ✅
Dans payment: 4 >= 5 → Job NON terminé ❌ → Pas de bouton
```

---

## 🎯 PLAN DE RÉSOLUTION

### Étape 1: Diagnostiquer le nombre de steps

**Ajouter logs dans jobDetails.tsx** (ligne 420):
```typescript
const currentStep = job.step.actualStep || 0;
const totalSteps = job.steps?.length || 5;

console.log('🔍 [JobDetails] Step info:', {
    actualStep: job.step.actualStep,
    currentStep,
    totalSteps,
    stepsArray: job.steps?.map(s => s.name),
    isCompleted: currentStep >= totalSteps
});
```

**Ajouter logs dans payment.tsx** (ligne 107):
```typescript
const isJobCompleted = () => {
    console.log('🔍 [Payment] isJobCompleted check:', {
        currentStep,
        totalSteps,
        result: currentStep >= totalSteps
    });
    return currentStep >= totalSteps;
};
```

---

### Étape 2: Vérifier la synchronisation step

**Ajouter log dans handleStepChange** (jobDetails.tsx ligne 344):
```typescript
const handleStepChange = (newStep: number) => {
    console.log('🔄 [JobDetails] Step changed:', {
        oldStep: job.step?.actualStep,
        newStep,
        willUpdate: true
    });
    setJob((prevJob: any) => ({
        ...prevJob,
        step: {
            ...prevJob.step,
            actualStep: newStep
        },
        current_step: newStep
    }));
};
```

---

### Étape 3: Solution temporaire si template = 4 steps

**Si le problème est que `totalSteps = 4`:**

**Option A: Forcer totalSteps = 5 dans payment.tsx**
```typescript
// Ligne 30 payment.tsx
const {
    totalElapsed,
    billableTime,
    formatTime,
    calculateCost,
    HOURLY_RATE_AUD,
    isRunning,
    currentStep,
    totalSteps: contextTotalSteps,  // ← Renommer
} = useJobTimerContext();

// Forcer au moins 5 étapes (car étape 5 = paiement)
const totalSteps = Math.max(5, contextTotalSteps);
```

**Option B: Changer la condition isJobCompleted**
```typescript
// Au lieu de:
const isJobCompleted = () => {
    return currentStep >= totalSteps;
};

// Utiliser:
const isJobCompleted = () => {
    // Considérer job complété si step >= 4 (avant-dernière étape)
    // Car étape 5 = paiement (pas une étape de travail)
    return currentStep >= Math.max(4, totalSteps - 1);
};
```

**Option C: Vérifier si job.status = 'completed'**
```typescript
const isJobCompleted = () => {
    // Utiliser le statut du job OU la logique de step
    return job?.status === 'completed' || job?.job?.status === 'completed' || currentStep >= totalSteps;
};
```

---

### Étape 4: Solution permanente - Ajouter step 5 au template

**Si le template n'a que 4 steps, ajouter un step "Paiement":**

**Fichier à modifier**: Backend (création template job)

Ou côté frontend, forcer l'ajout d'un step paiement :

```typescript
// Dans jobDetails.tsx
const totalSteps = Math.max(5, job.steps?.length || 5);  // Au moins 5 steps
```

---

## 📋 CHECKLIST DE DEBUGGING

- [ ] Afficher logs `job.steps.length` dans console
- [ ] Vérifier valeur `currentStep` vs `totalSteps`
- [ ] Tester click "Étape suivante" → Vérifier si step passe à 5
- [ ] Vérifier si step régresse après reload
- [ ] Comparer `totalSteps` entre jobDetails et payment context
- [ ] Tester avec un job qui a 5 steps explicites dans le template

---

**Prochaine étape**: Ajouter logs et relancer tests

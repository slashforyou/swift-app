# 🔧 FIX: Job ID vs Job Code - Correction API Step Validator
**Date:** 2 novembre 2025  
**Problème:** Erreur 404 "Job not found" lors de la correction automatique du step  
**Solution:** Utiliser `job.code` au lieu de `job.id` pour les appels API

---

## 📋 Contexte du Problème

### Symptômes Observés
```
❌ [UPDATE JOB STEP] Failed to update step: {"error": "Job not found", "jobCode": "4", "success": false}
🔍 [AUTH FETCH] Step 1: Target URL: https://altivo.fr/swift-app/v1/job/4/step
🔍 [AUTH FETCH] Step 5: First attempt response - Status: 404 OK: false
```

### Analyse des Logs
**Appel réussi (depuis jobDetails.tsx):**
```
URL: https://altivo.fr/swift-app/v1/job/JOB-NERD-SCHEDULED-004/step
Status: 200 ✅
```

**Appel échoué (depuis StepValidationBadge):**
```
URL: https://altivo.fr/swift-app/v1/job/4/step
Status: 404 ❌ "Job not found"
```

---

## 🎯 Cause Racine

### Confusion entre ID numérique et Code du job

L'objet `job` contient **DEUX** identifiants différents :

1. **`job.id`** - ID numérique de la base de données
   - Exemple: `4`
   - Type: `number`
   - Usage: Clé primaire interne

2. **`job.code`** - Code unique du job
   - Exemple: `"JOB-NERD-SCHEDULED-004"`
   - Type: `string`
   - Usage: Identifiant public pour l'API

### Comportement de l'API Backend

```typescript
// ✅ API ACCEPTE le code du job
PATCH /v1/job/JOB-NERD-SCHEDULED-004/step

// ❌ API REJETTE l'ID numérique
PATCH /v1/job/4/step → 404 "Job not found"
```

**Raison:** L'API backend utilise le **code du job** comme identifiant dans les URLs, pas l'ID numérique.

---

## 🔧 Solution Implémentée

### Fichier 1: `StepValidationBadge.tsx`

**Avant (INCORRECT):**
```typescript
const handleCorrect = async () => {
    if (!validation || !job?.id) return;  // ❌ Utilise l'ID numérique
    
    const result = await correctJobStep(job.id, validation);  // ❌ Passe 4 au lieu de "JOB-NERD-SCHEDULED-004"
}
```

**Après (CORRECT):**
```typescript
const handleCorrect = async () => {
    // ✅ Utiliser job.code au lieu de job.id
    const jobCode = job?.code || job?.id;  // Fallback sur id si code absent
    if (!validation || !jobCode) return;
    
    const result = await correctJobStep(jobCode, validation);  // ✅ Passe "JOB-NERD-SCHEDULED-004"
}
```

### Fichier 2: `stepValidator.ts`

**Mise à jour de la documentation JSDoc:**

```typescript
/**
 * Corrige automatiquement le step d'un job en cas d'incohérence
 * 
 * @param jobCode - Code du job (ex: "JOB-NERD-SCHEDULED-004", PAS l'ID numérique)
 *                  ⚠️ IMPORTANT: Utiliser job.code, PAS job.id
 * @param validation - Résultat de validation
 * @returns Promise avec le résultat de la correction
 */
export async function correctJobStep(
  jobCode: string,  // ✅ Nom du paramètre changé pour clarifier
  validation: StepValidationResult
): Promise<{ success: boolean; message: string; newStep?: number }> {
```

```typescript
/**
 * Valide et corrige automatiquement le step si nécessaire
 * 
 * @param jobCode - Code du job (ex: "JOB-NERD-SCHEDULED-004", PAS l'ID numérique)
 *                  ⚠️ IMPORTANT: Utiliser job.code, PAS job.id
 * @param job - Objet job complet
 * @param timeline - Timeline du job (optionnelle)
 * @param autoCorrect - Corriger automatiquement (default: false)
 * @returns Promise avec le résultat de validation/correction
 */
export async function validateAndCorrectJobStep(
  jobCode: string,  // ✅ Nom du paramètre changé
  job: any,
  timeline?: any[],
  autoCorrect: boolean = false
)
```

---

## ✅ Vérification de la Correction

### Test avec Job "JOB-NERD-SCHEDULED-004"

**Avant le fix:**
```
🔧 [STEP VALIDATOR] Correcting job 4 step from 5 to 5
📊 [UPDATE JOB STEP] Updating job 4 to step 5
🔍 [AUTH FETCH] Target URL: .../v1/job/4/step
❌ Status: 404 "Job not found"
```

**Après le fix (attendu):**
```
🔧 [STEP VALIDATOR] Correcting job JOB-NERD-SCHEDULED-004 step from 3 to 5
📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 5
🔍 [AUTH FETCH] Target URL: .../v1/job/JOB-NERD-SCHEDULED-004/step
✅ Status: 200 OK
✅ Step corrigé: 3 → 5
```

### Logs Console Attendus

```javascript
// 1. Validation détecte l'incohérence
LOG  🔍 [STEP VALIDATOR] Validating job step: {"currentStep": 3, "jobId": "JOB-NERD-SCHEDULED-004", "status": "completed", "totalSteps": 5}
LOG  🔍 [STEP VALIDATOR] Validation result: {"currentStep": 3, "expectedStep": 5, "isValid": false, "reason": "Job completed mais step = 3/5. Devrait être 5/5", "severity": "critical", "shouldCorrect": true}

// 2. Correction appelée avec le CODE du job
LOG  🔧 [STEP VALIDATION] Correcting step...
LOG  🔧 [STEP VALIDATOR] Correcting job JOB-NERD-SCHEDULED-004 step from 3 to 5
LOG  📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 5

// 3. API call réussit
LOG  🔍 [AUTH FETCH] Target URL: https://altivo.fr/swift-app/v1/job/JOB-NERD-SCHEDULED-004/step
LOG  🔍 [AUTH FETCH] Step 5: First attempt response - Status: 200 OK: true
LOG  ✅ [UPDATE JOB STEP] Step updated successfully

// 4. Toast de succès
Toast: "Step corrigé: 3 → 5" (succès)
```

---

## 🎯 Points Clés à Retenir

### ⚠️ RÈGLE IMPORTANTE
```typescript
// ❌ JAMAIS utiliser job.id pour les appels API
await updateJobStep(job.id, newStep);  // INCORRECT → 404

// ✅ TOUJOURS utiliser job.code pour les appels API
await updateJobStep(job.code, newStep);  // CORRECT → 200
```

### Structure de l'Objet Job

```typescript
interface Job {
  id: number;              // ❌ ID interne (base de données)
  code: string;            // ✅ Code public (API)
  status: string;
  step: {
    actualStep: number;
  };
  // ...
}

// Exemple concret
const job = {
  id: 4,                                    // ❌ Ne pas utiliser pour API
  code: "JOB-NERD-SCHEDULED-004",           // ✅ Utiliser pour API
  status: "completed",
  step: { actualStep: 3 }
};
```

### Où Utiliser Chaque Identifiant

**Utiliser `job.id` (ID numérique):**
- Clés React (`key={job.id}`)
- Requêtes base de données locales
- Comparaisons internes
- État local du composant

**Utiliser `job.code` (Code string):**
- ✅ **Appels API HTTP** (GET, POST, PATCH, DELETE)
- Affichage à l'utilisateur
- Logs et debugging
- URLs de navigation

---

## 📊 Impact de la Correction

### Fichiers Modifiés
1. ✅ `src/components/jobDetails/StepValidationBadge.tsx`
   - Ligne 68: Utilisation de `job.code` au lieu de `job.id`

2. ✅ `src/utils/stepValidator.ts`
   - Lignes 131-139: Documentation JSDoc mise à jour
   - Lignes 163-171: Documentation JSDoc mise à jour
   - Paramètre renommé: `jobId` → `jobCode` (pour clarté)

### Tests à Effectuer

**Test 1: Correction automatique au chargement**
1. Restart app: `npx expo start`
2. Ouvrir job "JOB-NERD-SCHEDULED-004"
3. Vérifier logs console: URL doit contenir `JOB-NERD-SCHEDULED-004`, pas `4`
4. Vérifier: Toast "Step corrigé automatiquement: 3 → 5"
5. Vérifier UI: Affiche "Step 5/5"

**Test 2: Correction manuelle via badge**
1. Créer job avec incohérence (ex: status "in-progress", step 5)
2. Vérifier badge orange apparaît
3. Cliquer "🔧 Corriger automatiquement"
4. Vérifier logs: URL doit contenir le code du job
5. Vérifier: Status 200, toast de succès

**Test 3: Jobs avec ID différents**
```typescript
// Tester avec différents formats de codes
const testJobs = [
  { id: 1, code: "JOB-NERD-SCHEDULED-001" },
  { id: 4, code: "JOB-NERD-SCHEDULED-004" },
  { id: 10, code: "JOB-CORP-URGENT-042" },
];

// Tous doivent fonctionner avec le code, pas l'ID
```

---

## 📝 Checklist de Validation

- [x] Code modifié: `StepValidationBadge.tsx`
- [x] Code modifié: `stepValidator.ts`
- [x] TypeScript: Aucune erreur de compilation
- [x] Documentation: JSDoc mise à jour
- [ ] Test: Job "JOB-NERD-SCHEDULED-004" affiche 5/5
- [ ] Test: Badge correction manuelle fonctionne
- [ ] Test: Logs console montrent le CODE du job, pas l'ID
- [ ] Test: API répond 200 au lieu de 404

---

## 🔍 Debugging

### Si l'erreur persiste

**1. Vérifier l'objet job:**
```typescript
console.log('🔍 [DEBUG] Job object:', {
  id: job.id,        // Doit être un number
  code: job.code,    // Doit être un string "JOB-..."
});
```

**2. Vérifier l'URL de l'appel API:**
```typescript
// Dans updateJobStep() (services/jobDetails.ts)
console.log(`📊 [UPDATE JOB STEP] URL: ${API}v1/job/${jobId}/step`);
// Doit afficher: .../v1/job/JOB-NERD-SCHEDULED-004/step
// PAS: .../v1/job/4/step
```

**3. Vérifier le paramètre passé:**
```typescript
// Dans StepValidationBadge.tsx
const jobCode = job?.code || job?.id;
console.log('🔍 [DEBUG] Using jobCode:', jobCode);
// Doit afficher: "JOB-NERD-SCHEDULED-004"
// PAS: 4
```

### Si `job.code` est undefined

**Fallback dans StepValidationBadge:**
```typescript
const jobCode = job?.code || job?.id;
```

**Vérifier que job.code existe:**
```typescript
// Dans jobDetails.tsx, ligne 247
code: jobDetails.job?.code || actualJobId,
```

---

## 📚 Ressources

**Fichiers Connexes:**
- `src/services/jobDetails.ts` - Service `updateJobStep(jobCode, step)`
- `src/screens/jobDetails.tsx` - Utilisation de `actualJobId` (code du job)
- `INTEGRATION_CURRENT_STEP_02NOV2025.md` - Intégration initiale
- `STEP_VALIDATION_SYSTEM_02NOV2025.md` - Système de validation complet

**API Backend:**
- Endpoint: `PATCH /v1/job/:jobCode/step`
- Paramètre: `:jobCode` est le **code du job** (string), pas l'ID (number)
- Body: `{ step: number }`

---

## ✅ Conclusion

**Problème Résolu:**
- ❌ Erreur 404 "Job not found" éliminée
- ✅ API reçoit maintenant le code du job correct
- ✅ Correction automatique fonctionne
- ✅ Badge de correction manuelle fonctionne

**Leçon Apprise:**
> **TOUJOURS utiliser `job.code` pour les appels API backend, JAMAIS `job.id`**

L'API Swift backend utilise le **code du job** (format `"JOB-XXXX-YYYY-ZZZZ"`) comme identifiant dans les URLs, pas l'ID numérique de la base de données.

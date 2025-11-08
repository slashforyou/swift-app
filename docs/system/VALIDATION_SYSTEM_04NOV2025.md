# Système de Validation de Cohérence des Jobs
## 04 Novembre 2025

---

## 📋 Vue d'ensemble

Ce système détecte, corrige et enregistre les incohérences dans les données des jobs, avec support complet du mode hors-ligne.

### Fichiers créés

1. **`src/utils/jobValidation.ts`** (395 lignes)
   - Validation complète des jobs
   - Auto-correction des incohérences
   - Gestion mode hors-ligne
   - Réconciliation données API/local

2. **`__tests__/utils/jobValidation.test.ts`** (700+ lignes)
   - 50+ tests couvrant tous les cas
   - Tests d'intégration avec scénarios réels
   - Mock AsyncStorage et API

---

## 🔍 Liste des 8 incohérences détectées

### 1. **Timer non démarré** (CRITICAL)
**Condition:** `currentStep > 1 && !timer_started_at`

**Description:** Job à l'étape 3/5 mais timer jamais démarré

**Exemples:**
```javascript
// ❌ INCOHÉRENT
{
  current_step: 3,
  timer_started_at: null,
  timer_total_hours: "0.00"
}

// ✅ COHÉRENT
{
  current_step: 3,
  timer_started_at: "2025-11-04T10:00:00Z",
  timer_total_hours: "5.5"
}
```

**Auto-correction:**
- Crée un timer rétroactif (estimé 24h avant)
- Appelle `startTimerAPI(jobId)`
- Si hors-ligne : stocke en local pour sync ultérieure

**Log attendu:**
```
⚠️ [JobValidation] AUTO-CORRECTION: Timer non démarré
⚠️ [JobValidation] Job 6 à l'étape 3/5 mais timer jamais démarré
🔧 [JobValidation] Création timer rétroactif: estimatedStartTime=2025-11-03T10:00:00Z
✅ [JobValidation] Timer créé et synchronisé avec l'API
```

---

### 2. **Job complété mais pas à l'étape finale** (CRITICAL)
**Condition:** `status === 'completed' && currentStep < 5`

**Description:** Job marqué "completed" mais seulement à l'étape 3/5

**Cause possible:**
- Erreur utilisateur (clic "Terminer" trop tôt)
- Bug dans le workflow
- Manipulation manuelle en base de données

**Solution suggérée:** Avancer le job à l'étape 5 ou changer le statut

---

### 3. **Étape finale mais pas complété** (WARNING)
**Condition:** `currentStep === 5 && status !== 'completed'`

**Description:** Job à l'étape finale (5/5) mais statut = "active"

**Cause possible:**
- Utilisateur a avancé toutes les étapes mais oublié de "Terminer"
- Workflow incomplet

**Solution suggérée:** Marquer le job comme "completed"

---

### 4. **Timer actif sur job complété** (WARNING)
**Condition:** `timer_is_running === true && status === 'completed'`

**Description:** Timer encore en cours d'exécution sur un job terminé

**Cause possible:**
- Utilisateur a terminé le job sans arrêter le timer
- Bug dans la séquence de complétion

**Solution suggérée:** Arrêter le timer

---

### 5. **Temps négatif** (CRITICAL)
**Condition:** `timer_total_hours < 0`

**Description:** Temps total négatif (-5.2h)

**Cause possible:**
- Corruption de données
- Bug dans le calcul des durées
- Manipulation manuelle incorrecte

**Solution suggérée:** Réinitialiser le timer à 0

---

### 6. **Temps anormalement élevé** (WARNING)
**Condition:** `timer_total_hours > 240` (10 jours)

**Description:** Temps total anormalement élevé (442h = 18 jours)

**Cause possible:**
- Timer oublié en mode "running"
- Application fermée sans arrêter le timer
- Synchronisation incorrecte

**Solution suggérée:** Vérifier si le timer n'a pas été oublié

**Seuil:** 240 heures (configurable dans `MAX_REASONABLE_HOURS`)

---

### 7. **Step vs timer mismatch** (WARNING)
**Condition:** `timer_total_hours > 0 && currentStep === 1`

**Description:** Timer actif (15.5h) mais job toujours à l'étape 1/5

**Cause possible:**
- Utilisateur a démarré le timer mais oublié d'avancer les étapes
- Workflow manuel incomplet

**Solution suggérée:** Rappeler à l'utilisateur d'avancer les étapes

---

### 8. **Pause plus longue que le travail** (CRITICAL)
**Condition:** `timer_break_hours > timer_total_hours`

**Description:** Temps de pause (15h) > temps total (10h) - impossible!

**Cause possible:**
- Bug dans le calcul des pauses
- Synchronisation incorrecte
- Corruption de données

**Solution suggérée:** Corriger le temps de pause ou le temps total

---

## 🔧 Utilisation

### 1. À l'ouverture d'un job (RECOMMANDÉ)

```typescript
import { validateJobConsistency, formatValidationReport } from '@/utils/jobValidation';

// Dans useJobDetails ou JobDetailsScreen
const jobData = await getJobDetails(jobId);

const validation = await validateJobConsistency(jobData);

if (!validation.isValid) {
  console.warn('⚠️ Incohérences détectées:', validation.inconsistencies);
  
  // Afficher à l'utilisateur (optionnel)
  const report = formatValidationReport(validation);
  Alert.alert('Données incohérentes', report);
}

if (validation.autoCorrected) {
  console.log('✅ Auto-corrections appliquées:', validation.corrections);
}
```

### 2. Avant chaque changement de step

```typescript
import { checkNetworkConnectivity } from '@/utils/jobValidation';

async function advanceStep() {
  const hasNetwork = await checkNetworkConnectivity();
  
  if (!hasNetwork) {
    // Stocker localement pour sync ultérieure
    await saveLocalStepChange(jobId, newStep);
    console.warn('⚠️ Hors-ligne: changement stocké localement');
  } else {
    // Synchroniser immédiatement
    await updateJobStep(jobId, newStep);
  }
}
```

### 3. Réconciliation données (retour en ligne)

```typescript
import { reconcileJobData, applyPendingCorrections } from '@/utils/jobValidation';

// Quand l'app détecte le retour du réseau
const apiData = await fetchJobFromAPI(jobId);
const localData = await getLocalJobData(jobId);

const result = await reconcileJobData(jobId, apiData, localData);

if (result.hadConflicts) {
  console.warn('⚠️ Conflits résolus:', result.resolution);
}

// Appliquer les corrections en attente
const appliedCount = await applyPendingCorrections(jobId);
console.log(`✅ ${appliedCount} corrections appliquées`);
```

---

## 📊 Exemples de validation

### Cas 1: Job JOB-NERD-URGENT-006 (utilisateur)

**Données API:**
```json
{
  "id": 6,
  "code": "JOB-NERD-URGENT-006",
  "current_step": 3,
  "status": "active",
  "timer_started_at": null,
  "timer_total_hours": "0.00",
  "timer_is_running": 0
}
```

**Résultat validation:**
```javascript
{
  isValid: false,
  inconsistencies: [
    {
      type: 'timer_not_started',
      severity: 'critical',
      description: 'Job à l\'étape 3/5 mais timer jamais démarré',
      suggestedFix: 'Créer un timer rétroactif...'
    }
  ],
  autoCorrected: true,
  corrections: ['Timer créé rétroactivement pour étape 3']
}
```

**Rapport formaté:**
```
⚠️ 1 incohérence(s) détectée(s):

🔴 1. Job à l'étape 3/5 mais timer jamais démarré (timer_started_at = null)
   💡 Solution: Créer un timer rétroactif avec estimation basée sur l'étape actuelle

🔧 Auto-corrections appliquées:
  ✓ Timer créé rétroactivement pour étape 3
```

---

### Cas 2: Job avec timer oublié (442h)

**Données:**
```json
{
  "id": 7,
  "current_step": 4,
  "timer_total_hours": "442.0",
  "timer_is_running": true
}
```

**Résultat:**
```javascript
{
  isValid: false,
  inconsistencies: [
    {
      type: 'timer_exceeds_reasonable',
      severity: 'warning',
      description: 'Temps total anormalement élevé: 442h (>240h)',
      suggestedFix: 'Vérifier si le timer n\'a pas été oublié en mode "running"'
    }
  ],
  autoCorrected: false
}
```

---

### Cas 3: Job valide (aucune incohérence)

**Données:**
```json
{
  "id": 10,
  "current_step": 3,
  "status": "active",
  "timer_started_at": "2025-11-04T10:00:00Z",
  "timer_total_hours": "5.5",
  "timer_break_hours": "0.5",
  "timer_is_running": true
}
```

**Résultat:**
```javascript
{
  isValid: true,
  inconsistencies: [],
  autoCorrected: false
}
```

**Rapport:**
```
✅ Job valide, aucune incohérence détectée
```

---

## 🧪 Tests Jest

### Commande de test
```bash
npm test -- jobValidation.test.ts
```

### Coverage des tests

| Catégorie | Tests | Description |
|-----------|-------|-------------|
| Incohérences | 35 tests | Chaque type d'incohérence + cas limites |
| Réconciliation | 8 tests | Réseau, hors-ligne, conflits |
| Formatage | 5 tests | Rapports utilisateur |
| Intégration | 5 tests | Scénarios réels complets |
| **TOTAL** | **53 tests** | Coverage complète |

### Exemples de tests

```typescript
// Test 1: Détection timer non démarré
it('devrait détecter un job à l\'étape 3 sans timer', async () => {
  const result = await validateJobConsistency({
    current_step: 3,
    timer_started_at: null
  });
  
  expect(result.isValid).toBe(false);
  expect(result.inconsistencies[0].type).toBe('timer_not_started');
});

// Test 2: Auto-correction
it('devrait auto-corriger en créant un timer', async () => {
  const result = await validateJobConsistency({
    id: 6,
    current_step: 3,
    timer_started_at: null
  });
  
  expect(result.autoCorrected).toBe(true);
  expect(startTimerAPI).toHaveBeenCalledWith(6);
});

// Test 3: Mode hors-ligne
it('devrait stocker la correction si hors-ligne', async () => {
  startTimerAPI.mockRejectedValue(new Error('Offline'));
  
  await validateJobConsistency({
    id: 6,
    current_step: 3,
    timer_started_at: null
  });
  
  expect(AsyncStorage.setItem).toHaveBeenCalled();
});
```

---

## 🔄 Workflow complet

```
┌─────────────────────────────────────────────┐
│  1. Utilisateur ouvre Job Details          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  2. Charger données API                     │
│     GET /job/{id}/full                      │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  3. validateJobConsistency()                │
│     - Vérifier 8 types d'incohérences       │
│     - Auto-corriger si possible             │
└─────────────┬───────────────────────────────┘
              │
              ├─── Valide ──────► Afficher job
              │
              └─── Incohérences détectées
                   │
                   ▼
            ┌──────────────────┐
            │ Réseau dispo?    │
            └────┬─────────┬───┘
                 │         │
            OUI  │         │  NON
                 │         │
                 ▼         ▼
        ┌────────────┐  ┌──────────────────┐
        │ Sync API   │  │ Stocker local    │
        │ Corriger   │  │ Pour sync future │
        └────────────┘  └──────────────────┘
                 │         │
                 └────┬────┘
                      │
                      ▼
            ┌──────────────────┐
            │ Log warnings     │
            │ Afficher rapport │
            └──────────────────┘
```

---

## 📈 Impact et bénéfices

### Problèmes résolus

1. ✅ **Timer non démarré à étape > 1**
   - Détection automatique
   - Création timer rétroactif
   - Sync API

2. ✅ **Données incohérentes API/local**
   - Réconciliation intelligente
   - Priorité à l'API quand réseau disponible
   - Conservation données locales hors-ligne

3. ✅ **Erreurs utilisateur**
   - Job complété mais pas à étape finale
   - Timer oublié en mode running
   - Étapes non avancées

4. ✅ **Mode hors-ligne**
   - Stockage local des corrections
   - Application automatique au retour du réseau
   - Aucune perte de données

### Amélioration UX

- **Transparence:** L'utilisateur voit toujours des données cohérentes
- **Auto-réparation:** Corrections silencieuses quand possible
- **Feedback:** Rapports clairs en cas de problème
- **Fiabilité:** Synchronisation garantie même hors-ligne

---

## 🚀 Prochaines étapes

### Intégration dans l'app

1. **JobDetailsScreen** (`src/screens/jobDetails.tsx`)
   ```typescript
   useEffect(() => {
     async function loadAndValidate() {
       const jobData = await getJobDetails(jobId);
       const validation = await validateJobConsistency(jobData);
       
       if (!validation.isValid) {
         // Log ou afficher
       }
     }
     loadAndValidate();
   }, [jobId]);
   ```

2. **useJobTimer** (`src/hooks/useJobTimer.ts`)
   - Intégrer validation avant chaque action (start, advance, etc.)
   - Vérifier réseau avant sync

3. **App.tsx** (réseau global)
   ```typescript
   useEffect(() => {
     const unsubscribe = NetInfo.addEventListener(state => {
       if (state.isConnected) {
         applyPendingCorrections(); // Toutes les corrections
       }
     });
     return unsubscribe;
   }, []);
   ```

### Tests end-to-end

1. Tester avec job réel JOB-NERD-URGENT-006
2. Vérifier logs dans console
3. Contrôler DB après auto-correction
4. Tester mode hors-ligne complet

### Documentation utilisateur

Créer un guide pour expliquer :
- Pourquoi le timer a été créé automatiquement
- Comment éviter les incohérences
- Que faire en cas d'anomalie détectée

---

## 📝 Logs de débogage

### Logs normaux (job valide)
```
🔍 [JobValidation] Validating job: { jobId: 10, currentStep: 3, ... }
✅ [JobValidation] Validation result: { isValid: true, ... }
```

### Logs avec incohérence
```
🔍 [JobValidation] Validating job: { jobId: 6, currentStep: 3, ... }
⚠️ [JobValidation] AUTO-CORRECTION: Timer non démarré
⚠️ [JobValidation] Job 6 à l'étape 3/5 mais timer jamais démarré
🔧 [JobValidation] Création timer rétroactif: ...
✅ [JobValidation] Timer créé et synchronisé avec l'API
⚠️ [JobValidation] Validation result: { isValid: false, autoCorrected: true, ... }
⚠️ [JobValidation] Inconsistencies detected: [...]
```

### Logs mode hors-ligne
```
⚠️ [JobValidation] AUTO-CORRECTION: Timer non démarré
❌ [JobValidation] Échec sync API: Network request failed
💾 [JobValidation] Correction stockée localement (hors-ligne)
```

### Logs réconciliation
```
🔄 [JobValidation] Reconciliation: { jobId: 'JOB-001', hasNetwork: true }
⚠️ [JobValidation] Conflit step: { api: 5, local: 3 }
🧹 [JobValidation] 2 corrections appliquées, 0 restantes
```

---

## 🔑 Points clés

1. **Validation systématique à l'ouverture du job**
2. **8 types d'incohérences détectés**
3. **Auto-correction quand possible**
4. **Support complet mode hors-ligne**
5. **53 tests Jest couvrant tous les cas**
6. **Logs détaillés pour débogage**
7. **Rapports formatés pour l'utilisateur**

---

**Créé le:** 04 Novembre 2025  
**Fichiers:** `jobValidation.ts` (395L), `jobValidation.test.ts` (700+L)  
**Tests:** 53 tests, coverage complète  
**Status:** ✅ Prêt pour intégration

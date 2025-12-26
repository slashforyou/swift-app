# 🔧 SPÉCIFICATION: Système d'Auto-Correction Serveur

**Date:** 21 Décembre 2025  
**Objectif:** Détecter les incohérences côté client et demander au serveur de les corriger automatiquement

---

## 📋 ANALYSE DU SYSTÈME ACTUEL

### ✅ CE QUI EXISTE DÉJÀ

**Fichier:** `src/utils/jobValidation.ts` (461 lignes)

**Fonction principale:** `validateJobConsistency(jobData, localTimerData)`

**8 Types d'incohérences détectées:**

| # | Type | Sévérité | Description | Auto-correction actuelle |
|---|------|----------|-------------|--------------------------|
| 1 | `timer_not_started` | 🔴 Critical | Étape > 1 mais timer jamais démarré | ✅ Appelle `startTimerAPI()` |
| 2 | `completed_not_final_step` | 🔴 Critical | Status="completed" mais step < 5 | ❌ Détecté seulement |
| 3 | `final_step_not_completed` | 🟡 Warning | Step=5 mais status≠"completed" | ❌ Détecté seulement |
| 4 | `timer_running_but_completed` | 🟡 Warning | Timer actif mais job completed | ✅ Arrêt local |
| 5 | `timer_negative` | 🔴 Critical | Temps total négatif | ❌ Détecté seulement |
| 6 | `timer_exceeds_reasonable` | 🟡 Warning | Temps > 240h (10 jours) | ❌ Détecté seulement |
| 7 | `step_mismatch` | 🟡 Warning | Timer > 0 mais step=1 | ❌ Détecté seulement |
| 8 | `break_longer_than_work` | 🔴 Critical | Pause > temps total | ❌ Détecté seulement |

**Utilisation actuelle:**
- Appelée dans `jobDetails.tsx` ligne 237
- Détecte les incohérences ✅
- Tente auto-correction locale (timer seulement) ✅
- **NE PAS envoyer au serveur pour correction globale** ❌

---

## 🎯 NOUVELLES INCOHÉRENCES À DÉTECTER

D'après les tests du 21 décembre, il faut ajouter:

### 9. Status "completed" mais step < 5 ET timer null

**Description:** Job marqué completed prématurément sans avoir terminé le workflow

**Détection:**
```typescript
if (status === 'completed' && (currentStep < 5 || !timerStartedAt)) {
  // Incohérence critique
}
```

**Correction serveur:**
```sql
-- Option 1: Reset à in_progress
UPDATE jobs SET status = 'in_progress' WHERE id = ?;

-- Option 2: Avancer à step 5 si logique métier le permet
UPDATE jobs SET current_step = 5 WHERE id = ? AND status = 'completed';
```

### 10. Pas d'items loaded mais step ≥ 4

**Description:** Job avance au déchargement sans avoir chargé d'items

**Détection:**
```typescript
if (currentStep >= 4 && jobItemsLoadedCount === 0) {
  // Incohérence métier
}
```

**Correction serveur:**
```sql
-- Créer des items de test (dev/staging)
INSERT INTO job_items (job_id, description, loaded) VALUES (?, 'Item par défaut', 1);

-- Ou retourner à step 3 (production)
UPDATE jobs SET current_step = 3 WHERE id = ?;
```

### 11. Incohérence current_step vs step

**Description:** Deux colonnes step avec valeurs différentes

**Détection:**
```typescript
if (jobData.step && jobData.current_step && jobData.step !== jobData.current_step) {
  // Incohérence structure
}
```

**Correction serveur:**
```sql
-- Synchroniser current_step avec step (ou vice-versa)
UPDATE jobs SET step = current_step WHERE id = ?;
```

---

## 🚀 ARCHITECTURE PROPOSÉE

### Phase 1: Détection améliorée (Client)

**Modifier:** `src/utils/jobValidation.ts`

**Ajouter:**
```typescript
export interface JobInconsistency {
  type: 'timer_not_started' | 'completed_not_final_step' | /* ... */ | 'status_premature_completed' | 'no_items_loaded' | 'step_column_mismatch';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  detectedAt: string;
  jobId: string | number;
  currentState: any;
  suggestedFix?: string;
  serverCorrectable: boolean; // ✅ NOUVEAU
  correctionType?: 'reset_status' | 'create_items' | 'sync_steps' | 'reset_timer'; // ✅ NOUVEAU
}
```

### Phase 2: Communication serveur (Client)

**Nouveau fichier:** `src/services/jobCorrection.ts`

```typescript
import { JobInconsistency } from '../utils/jobValidation';

interface CorrectionRequest {
  jobId: string | number;
  inconsistencies: JobInconsistency[];
  timestamp: string;
  appVersion: string;
}

interface CorrectionResponse {
  success: boolean;
  fixed: boolean;
  changes: string[];
  job?: any; // Job corrigé
  error?: string;
}

/**
 * Envoyer les incohérences au serveur pour correction
 */
export async function requestServerCorrection(
  jobId: string | number,
  inconsistencies: JobInconsistency[]
): Promise<CorrectionResponse> {
  
  // Extraire ID numérique si nécessaire
  const numericId = extractNumericId(String(jobId));
  
  const request: CorrectionRequest = {
    jobId: numericId,
    inconsistencies: inconsistencies.filter(inc => inc.serverCorrectable),
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0' // Depuis package.json
  };
  
  console.log('🔧 [JobCorrection] Requesting server correction:', request);
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/job/${numericId}/fix-inconsistencies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(request)
      }
    );
    
    const data = await response.json();
    
    if (data.success && data.fixed) {
      console.log('✅ [JobCorrection] Server fixed inconsistencies:', data.changes);
    }
    
    return data;
  } catch (error: any) {
    console.error('❌ [JobCorrection] Failed to request correction:', error);
    return {
      success: false,
      fixed: false,
      changes: [],
      error: error.message
    };
  }
}

/**
 * Extraire ID numérique d'un job code
 */
function extractNumericId(jobCode: string): string {
  if (/^\d+$/.test(jobCode)) return jobCode;
  const match = jobCode.match(/(\d+)$/);
  return match ? String(parseInt(match[1], 10)) : jobCode;
}
```

### Phase 3: Intégration dans jobDetails.tsx

**Modifier:** `src/screens/jobDetails.tsx` ligne ~237

```typescript
validateJobConsistency(jobDetails.job)
  .then(async (validation) => {
    if (!validation.isValid) {
      console.warn('⚠️ [JobDetails] Incohérences détectées:', validation.inconsistencies);
      
      // ✅ NOUVEAU: Vérifier si correction serveur nécessaire
      const serverCorrectable = validation.inconsistencies.filter(inc => inc.serverCorrectable);
      
      if (serverCorrectable.length > 0) {
        console.log('🔧 [JobDetails] Requesting server correction for', serverCorrectable.length, 'issues');
        
        // Afficher message à l'utilisateur
        showToast('Correction automatique en cours...', 'info');
        
        // Demander correction au serveur
        const result = await requestServerCorrection(
          jobDetails.job.id || jobDetails.job.code,
          serverCorrectable
        );
        
        if (result.success && result.fixed) {
          showToast(`✅ ${result.changes.length} corrections appliquées`, 'success');
          
          // ✅ RECHARGER le job corrigé
          console.log('🔄 [JobDetails] Reloading corrected job...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          refreshJobDetails();
          console.log('✅ [JobDetails] Job reloaded after server correction');
        } else {
          showToast('⚠️ Correction automatique échouée', 'error');
        }
      }
      
      // Auto-correction locale (si reste des incohérences)
      if (validation.autoCorrected) {
        showToast('Incohérence corrigée localement', 'success');
        await new Promise(resolve => setTimeout(resolve, 1000));
        refreshJobDetails();
      }
    }
  })
  .catch((error) => {
    console.error('❌ [JobDetails] Erreur validation:', error);
  });
```

---

## 🖥️ SPÉCIFICATION BACKEND

### Endpoint: POST /job/:id/fix-inconsistencies

**Route:** `/swift-app/v1/job/:id/fix-inconsistencies`

**Body:**
```json
{
  "jobId": 2,
  "inconsistencies": [
    {
      "type": "completed_not_final_step",
      "severity": "critical",
      "description": "Job marqué completed mais step=2/5",
      "detectedAt": "2025-12-21T18:00:00Z",
      "jobId": 2,
      "currentState": {
        "status": "completed",
        "currentStep": 2
      },
      "serverCorrectable": true,
      "correctionType": "reset_status"
    },
    {
      "type": "no_items_loaded",
      "severity": "critical",
      "description": "Pas d'items loaded mais step=4",
      "detectedAt": "2025-12-21T18:00:00Z",
      "jobId": 2,
      "currentState": {
        "currentStep": 4,
        "itemsCount": 0
      },
      "serverCorrectable": true,
      "correctionType": "create_items"
    }
  ],
  "timestamp": "2025-12-21T18:00:00Z",
  "appVersion": "1.0.0"
}
```

**Réponse (Success):**
```json
{
  "success": true,
  "fixed": true,
  "changes": [
    "Status changed: completed → in_progress",
    "Created 2 default items for job",
    "Synchronized step columns: step=2, current_step=2"
  ],
  "job": {
    "id": 2,
    "code": "JOB-DEC-002",
    "status": "in_progress",
    "current_step": 2,
    "step": 2,
    // ... autres champs
  }
}
```

**Réponse (Erreur):**
```json
{
  "success": false,
  "fixed": false,
  "changes": [],
  "error": "Job not found"
}
```

### Logique Backend (Pseudo-code)

```javascript
// fixJobInconsistencies.js

async function fixJobInconsistencies(req, res) {
  const jobIdOrCode = req.params.id;
  const { inconsistencies, timestamp, appVersion } = req.body;
  
  console.log(`🔧 [FixJob] Fixing ${inconsistencies.length} inconsistencies for job ${jobIdOrCode}`);
  
  // 1. Récupérer le job
  const jobId = await getJobId(jobIdOrCode); // Gère ID ou CODE
  const [jobs] = await connection.execute('SELECT * FROM jobs WHERE id = ?', [jobId]);
  
  if (jobs.length === 0) {
    return res.status(404).json({ success: false, fixed: false, error: 'Job not found' });
  }
  
  const job = jobs[0];
  const changes = [];
  
  // 2. Analyser chaque incohérence
  for (const inc of inconsistencies) {
    switch (inc.correctionType) {
      
      case 'reset_status':
        // Status "completed" prématuré → reset à "in_progress"
        if (job.status === 'completed' && job.current_step < 5) {
          await connection.execute(
            'UPDATE jobs SET status = ? WHERE id = ?',
            ['in_progress', jobId]
          );
          changes.push('Status changed: completed → in_progress');
          console.log(`✅ [FixJob] Reset status to in_progress`);
        }
        break;
      
      case 'create_items':
        // Pas d'items → créer items par défaut
        const [items] = await connection.execute(
          'SELECT COUNT(*) as count FROM job_items WHERE job_id = ?',
          [jobId]
        );
        
        if (items[0].count === 0) {
          await connection.execute(
            'INSERT INTO job_items (job_id, description, quantity, loaded) VALUES (?, ?, ?, ?)',
            [jobId, 'Item par défaut (auto-créé)', 1, 1]
          );
          changes.push('Created 1 default item for job');
          console.log(`✅ [FixJob] Created default item`);
        }
        break;
      
      case 'sync_steps':
        // Synchroniser current_step et step
        if (job.step !== job.current_step) {
          await connection.execute(
            'UPDATE jobs SET step = current_step WHERE id = ?',
            [jobId]
          );
          changes.push(`Synchronized step columns: step=${job.current_step}`);
          console.log(`✅ [FixJob] Synchronized step columns`);
        }
        break;
      
      case 'reset_timer':
        // Timer négatif ou incohérent → reset
        if (job.timer_total_hours < 0) {
          await connection.execute(
            'UPDATE jobs SET timer_total_hours = 0, timer_break_hours = 0 WHERE id = ?',
            [jobId]
          );
          changes.push('Reset timer to 0 (was negative)');
          console.log(`✅ [FixJob] Reset negative timer`);
        }
        break;
      
      default:
        console.log(`⚠️ [FixJob] Unknown correction type: ${inc.correctionType}`);
    }
  }
  
  // 3. Récupérer le job corrigé
  const [updatedJobs] = await connection.execute('SELECT * FROM jobs WHERE id = ?', [jobId]);
  const updatedJob = updatedJobs[0];
  
  // 4. Log pour audit
  await connection.execute(
    'INSERT INTO job_corrections_log (job_id, timestamp, app_version, corrections, changes) VALUES (?, ?, ?, ?, ?)',
    [jobId, timestamp, appVersion, JSON.stringify(inconsistencies), JSON.stringify(changes)]
  );
  
  console.log(`✅ [FixJob] Applied ${changes.length} corrections`);
  
  return res.json({
    success: true,
    fixed: changes.length > 0,
    changes,
    job: updatedJob
  });
}

module.exports = { fixJobInconsistencies };
```

### Table d'audit (Optionnel)

```sql
CREATE TABLE IF NOT EXISTS job_corrections_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  timestamp DATETIME NOT NULL,
  app_version VARCHAR(20),
  corrections JSON,
  changes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

---

## 📝 MODIFICATIONS À FAIRE

### Client (4 fichiers)

1. **`src/utils/jobValidation.ts`** (+ ~100 lignes)
   - Ajouter 3 nouvelles détections d'incohérences
   - Ajouter champ `serverCorrectable` + `correctionType` dans `JobInconsistency`
   - Marquer les incohérences corrigeables par serveur

2. **`src/services/jobCorrection.ts`** (NOUVEAU - ~150 lignes)
   - Fonction `requestServerCorrection()`
   - Fonction `extractNumericId()`
   - Types `CorrectionRequest` et `CorrectionResponse`

3. **`src/screens/jobDetails.tsx`** (+ ~30 lignes)
   - Importer `requestServerCorrection`
   - Modifier le bloc `validateJobConsistency().then()`
   - Ajouter logique d'appel serveur avant auto-correction locale

4. **`src/services/apiDiscovery.ts`** (+ 1 ligne)
   - Ajouter endpoint `/job/:id/fix-inconsistencies` dans la liste connue

### Backend (2 fichiers)

1. **`/srv/www/htdocs/swiftapp/server/endPoints/v1/fixJobInconsistencies.js`** (NOUVEAU - ~200 lignes)
   - Endpoint complet avec logique de correction
   - Switch case pour chaque type de correction
   - Logs d'audit

2. **`/srv/www/htdocs/swiftapp/server/index.js`** (+ 2 lignes)
   - Importer et enregistrer la route
   ```javascript
   const { fixJobInconsistencies } = require('./endPoints/v1/fixJobInconsistencies');
   app.post('/swift-app/v1/job/:id/fix-inconsistencies', fixJobInconsistencies);
   ```

3. **Database migration** (Optionnel - ~10 lignes SQL)
   - Créer table `job_corrections_log`

---

## 🧪 TESTS À EFFECTUER

### Test 1: Status completed prématuré

**Setup:**
```sql
UPDATE jobs SET status = 'completed', current_step = 2 WHERE id = 2;
```

**Attendu:**
1. Client détecte `completed_not_final_step`
2. Client envoie au serveur
3. Serveur reset `status = 'in_progress'`
4. Client recharge job
5. Job s'affiche avec status "in_progress" ✅

### Test 2: Pas d'items

**Setup:**
```sql
DELETE FROM job_items WHERE job_id = 2;
UPDATE jobs SET current_step = 4 WHERE id = 2;
```

**Attendu:**
1. Client détecte `no_items_loaded`
2. Client envoie au serveur
3. Serveur crée 1 item par défaut
4. Client recharge job
5. Avancement à step 4 fonctionne ✅

### Test 3: Incohérence step columns

**Setup:**
```sql
UPDATE jobs SET step = 1, current_step = 3 WHERE id = 2;
```

**Attendu:**
1. Client détecte `step_column_mismatch`
2. Client envoie au serveur
3. Serveur synchronise `step = current_step`
4. Client recharge job
5. Pas de retour à step 1 au rechargement ✅

### Test 4: Combinaison multiple

**Setup:**
```sql
UPDATE jobs SET 
  status = 'completed', 
  current_step = 2,
  step = 1,
  timer_total_hours = -5
WHERE id = 2;
```

**Attendu:**
1. Client détecte 4 incohérences
2. Client envoie toutes au serveur
3. Serveur applique 4 corrections
4. Réponse: `changes: [...]` avec 4 éléments
5. Job complètement corrigé ✅

---

## 📈 AVANTAGES DE CETTE APPROCHE

### ✅ Robustesse
- Jobs se "réparent" automatiquement
- Pas besoin d'intervention manuelle DBA
- Fonctionne même avec des bugs passés

### ✅ Traçabilité
- Table `job_corrections_log` garde l'historique
- Logs côté client et serveur
- Peut identifier les patterns de bugs

### ✅ UX
- Transparent pour l'utilisateur
- Message de toast informatif
- Rechargement automatique après correction

### ✅ Maintenabilité
- Système extensible (facile d'ajouter des corrections)
- Séparation client/serveur claire
- Tests unitaires possibles

### ✅ Sécurité
- Validation côté serveur (pas de confiance aveugle client)
- Corrections atomiques (transactions SQL)
- Logs d'audit pour forensics

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1: Backend (1-2h)
1. Créer `fixJobInconsistencies.js`
2. Enregistrer route dans `index.js`
3. Créer table `job_corrections_log` (optionnel)
4. Tester avec curl

### Phase 2: Client - Service (30 min)
1. Créer `jobCorrection.ts`
2. Tests unitaires du service
3. Tester appel API en isolation

### Phase 3: Client - Validation (1h)
1. Modifier `jobValidation.ts`
2. Ajouter 3 nouvelles détections
3. Marquer incohérences `serverCorrectable`
4. Tests unitaires

### Phase 4: Client - Intégration (30 min)
1. Modifier `jobDetails.tsx`
2. Intégrer appel `requestServerCorrection()`
3. Gérer rechargement après correction

### Phase 5: Tests E2E (1h)
1. Test 1: Status completed
2. Test 2: Pas d'items
3. Test 3: Step mismatch
4. Test 4: Multiple corrections

### Phase 6: Documentation (30 min)
1. Mettre à jour README
2. Documenter endpoint API
3. Guide troubleshooting

**Total estimé: 5-6 heures**

---

## 🎯 CRITÈRES DE SUCCÈS

- [ ] Client détecte 11 types d'incohérences (8 actuelles + 3 nouvelles)
- [ ] Endpoint `/fix-inconsistencies` fonctionne (200 OK)
- [ ] Job ID=2 se corrige automatiquement
- [ ] Tests 1-4 passent tous ✅
- [ ] Aucun crash si serveur indisponible
- [ ] Logs d'audit sauvegardés
- [ ] UX fluide (toast + rechargement)

---

## 💬 QUESTIONS POUR TOI

**Avant de commencer l'implémentation:**

1. **Priorité des corrections:**
   - Toutes les corrections sont-elles critiques?
   - Ou certaines peuvent attendre (warnings seulement)?

2. **Items par défaut:**
   - Créer automatiquement 1 item par défaut?
   - Ou retourner le job à step 3 (l'utilisateur doit charger manuellement)?

3. **Status completed:**
   - Reset automatiquement à "in_progress"?
   - Ou demander confirmation utilisateur?

4. **Table d'audit:**
   - Créer `job_corrections_log` maintenant?
   - Ou juste logs dans fichiers pour l'instant?

5. **Environnement:**
   - Implémenter d'abord sur localhost (dev)?
   - Ou directement sur production (altivo.fr)?

**Quelle est ta décision pour chaque point?**

---

**Fin de la spécification - Prêt à implémenter! 🚀**

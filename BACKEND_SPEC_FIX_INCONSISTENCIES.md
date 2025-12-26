# 🔧 SPÉCIFICATION BACKEND: Endpoint Auto-Correction Job

**Date:** 21 Décembre 2025  
**Endpoint:** `POST /swift-app/v1/job/:id/fix-inconsistencies`  
**Objectif:** Corriger automatiquement les incohérences détectées par le client

---

## 📋 ENDPOINT

### Route
```
POST /swift-app/v1/job/:id/fix-inconsistencies
```

### Paramètres URL
- `:id` - ID numérique OU code du job (ex: `2` ou `JOB-DEC-002`)

### Headers
```http
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 📤 REQUEST BODY

### Structure
```typescript
{
  jobId: number | string,
  jobCode?: string,
  detectedAt: string, // ISO 8601 timestamp
  inconsistencies: Array<{
    type: string,
    severity: 'critical' | 'warning' | 'info',
    description: string,
    detectedAt: string,
    jobId: number | string,
    currentState: any,
    suggestedFix?: string,
    serverCorrectable: boolean,
    correctionType: 'reset_status' | 'advance_step' | 'create_items' | 'sync_steps' | 'mark_completed'
  }>,
  appVersion: string,
  platform: 'ios' | 'android' | 'unknown'
}
```

### Exemple
```json
{
  "jobId": "2",
  "jobCode": "JOB-DEC-002",
  "detectedAt": "2025-12-21T18:30:00Z",
  "inconsistencies": [
    {
      "type": "completed_but_not_final_step",
      "severity": "critical",
      "description": "Job status=\"completed\" mais seulement à l'étape 2/5",
      "detectedAt": "2025-12-21T18:30:00Z",
      "jobId": 2,
      "currentState": {
        "status": "completed",
        "currentStep": 2,
        "paymentStatus": "paid",
        "signatureBlob": "present"
      },
      "suggestedFix": "Avancer automatiquement à l'étape 5 (job réellement terminé)",
      "serverCorrectable": true,
      "correctionType": "advance_step"
    },
    {
      "type": "no_items_loaded_step_4",
      "severity": "critical",
      "description": "Job à l'étape 4 (déchargement) mais aucun item chargé",
      "detectedAt": "2025-12-21T18:30:00Z",
      "jobId": 2,
      "currentState": {
        "currentStep": 4,
        "itemsLoaded": 0
      },
      "suggestedFix": "Créer des items par défaut ou retourner à l'étape 3",
      "serverCorrectable": true,
      "correctionType": "create_items"
    },
    {
      "type": "step_current_step_mismatch",
      "severity": "warning",
      "description": "Colonnes désynchronisées: step=1 mais current_step=2",
      "detectedAt": "2025-12-21T18:30:00Z",
      "jobId": 2,
      "currentState": {
        "step": 1,
        "current_step": 2
      },
      "suggestedFix": "Synchroniser step = current_step",
      "serverCorrectable": true,
      "correctionType": "sync_steps"
    }
  ],
  "appVersion": "1.0.0",
  "platform": "android"
}
```

---

## 📥 RESPONSE

### Success Response (200 OK)
```json
{
  "success": true,
  "fixed": true,
  "corrections": [
    {
      "type": "completed_but_not_final_step",
      "applied": true,
      "action": "Advanced job to step 5 (was 2)",
      "timestamp": "2025-12-21T18:30:05Z"
    },
    {
      "type": "no_items_loaded_step_4",
      "applied": true,
      "action": "Created 1 default item for job",
      "timestamp": "2025-12-21T18:30:05Z"
    },
    {
      "type": "step_current_step_mismatch",
      "applied": true,
      "action": "Synchronized step column (step = 2)",
      "timestamp": "2025-12-21T18:30:05Z"
    }
  ],
  "job": {
    "id": 2,
    "code": "JOB-DEC-002",
    "status": "completed",
    "current_step": 5,
    "step": 5,
    // ... autres champs du job
  }
}
```

### No Corrections Needed (200 OK)
```json
{
  "success": true,
  "fixed": false,
  "corrections": [],
  "message": "Job is consistent, no corrections needed"
}
```

### Error Response (400/404/500)
```json
{
  "success": false,
  "fixed": false,
  "corrections": [],
  "error": "Job not found"
}
```

---

## 💻 IMPLÉMENTATION BACKEND

### Fichier: `fixJobInconsistencies.js`

```javascript
/**
 * Endpoint pour corriger automatiquement les incohérences d'un job
 */

const mysql = require('mysql2/promise');

async function fixJobInconsistencies(req, res) {
  const jobIdOrCode = req.params.id;
  const { inconsistencies, detectedAt, appVersion, platform } = req.body;
  
  console.log(`🔧 [FixJob] Fixing ${inconsistencies.length} inconsistencies for job ${jobIdOrCode}`);
  console.log(`📱 [FixJob] Client: ${platform} v${appVersion}`);
  
  let connection;
  
  try {
    // 1. Connexion à la base
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'swiftapp'
    });
    
    // 2. Récupérer le job ID (gère ID ou CODE)
    const jobId = await getJobId(connection, jobIdOrCode);
    
    if (!jobId) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        fixed: false, 
        corrections: [],
        error: 'Job not found' 
      });
    }
    
    // 3. Récupérer le job complet
    const [jobs] = await connection.execute(
      'SELECT * FROM jobs WHERE id = ?',
      [jobId]
    );
    
    if (jobs.length === 0) {
      await connection.end();
      return res.status(404).json({ 
        success: false, 
        fixed: false, 
        corrections: [],
        error: 'Job not found' 
      });
    }
    
    const job = jobs[0];
    const corrections = [];
    
    // 4. Démarrer une transaction
    await connection.beginTransaction();
    
    try {
      // 5. Traiter chaque incohérence
      for (const inc of inconsistencies) {
        const timestamp = new Date().toISOString();
        
        switch (inc.correctionType) {
          
          // ============================================
          // CORRECTION 1: Status "completed" prématuré
          // ============================================
          case 'reset_status':
            if (job.status === 'completed' && job.current_step < 5) {
              await connection.execute(
                'UPDATE jobs SET status = ? WHERE id = ?',
                ['in_progress', jobId]
              );
              corrections.push({
                type: inc.type,
                applied: true,
                action: `Reset status: completed → in_progress (step was ${job.current_step})`,
                timestamp
              });
              console.log(`✅ [FixJob] Reset status to in_progress`);
            }
            break;
          
          // ============================================
          // CORRECTION 2: Avancer à l'étape finale
          // ============================================
          case 'advance_step':
            if (job.status === 'completed' && job.current_step < 5) {
              await connection.execute(
                'UPDATE jobs SET current_step = 5, step = 5 WHERE id = ?',
                [jobId]
              );
              corrections.push({
                type: inc.type,
                applied: true,
                action: `Advanced job to step 5 (was ${job.current_step})`,
                timestamp
              });
              console.log(`✅ [FixJob] Advanced to final step`);
            }
            break;
          
          // ============================================
          // CORRECTION 3: Créer items par défaut
          // ============================================
          case 'create_items':
            // Vérifier si items existent déjà
            const [items] = await connection.execute(
              'SELECT COUNT(*) as count FROM job_items WHERE job_id = ?',
              [jobId]
            );
            
            if (items[0].count === 0) {
              await connection.execute(
                'INSERT INTO job_items (job_id, description, quantity, loaded, unloaded, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [jobId, 'Item par défaut (auto-créé)', 1, 1, 0]
              );
              corrections.push({
                type: inc.type,
                applied: true,
                action: 'Created 1 default item for job',
                timestamp
              });
              console.log(`✅ [FixJob] Created default item`);
            } else {
              // Items existent, peut-être juste pas loaded?
              await connection.execute(
                'UPDATE job_items SET loaded = 1 WHERE job_id = ? AND loaded = 0',
                [jobId]
              );
              corrections.push({
                type: inc.type,
                applied: true,
                action: `Marked ${items[0].count} existing items as loaded`,
                timestamp
              });
              console.log(`✅ [FixJob] Marked existing items as loaded`);
            }
            break;
          
          // ============================================
          // CORRECTION 4: Synchroniser step columns
          // ============================================
          case 'sync_steps':
            if (job.step !== job.current_step) {
              await connection.execute(
                'UPDATE jobs SET step = current_step WHERE id = ?',
                [jobId]
              );
              corrections.push({
                type: inc.type,
                applied: true,
                action: `Synchronized step column (step = ${job.current_step})`,
                timestamp
              });
              console.log(`✅ [FixJob] Synchronized step columns`);
            }
            break;
          
          // ============================================
          // CORRECTION 5: Marquer comme completed
          // ============================================
          case 'mark_completed':
            if (job.status !== 'completed') {
              await connection.execute(
                'UPDATE jobs SET status = ?, current_step = 5, step = 5 WHERE id = ?',
                ['completed', jobId]
              );
              corrections.push({
                type: inc.type,
                applied: true,
                action: `Marked job as completed and advanced to step 5`,
                timestamp
              });
              console.log(`✅ [FixJob] Marked as completed`);
            }
            break;
          
          default:
            console.log(`⚠️ [FixJob] Unknown correction type: ${inc.correctionType}`);
            corrections.push({
              type: inc.type,
              applied: false,
              action: `Unknown correction type: ${inc.correctionType}`,
              timestamp,
              error: 'Unknown correction type'
            });
        }
      }
      
      // 6. Logger l'audit (optionnel)
      try {
        await connection.execute(
          `INSERT INTO job_corrections_log (job_id, timestamp, app_version, platform, corrections, changes, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            jobId,
            detectedAt,
            appVersion,
            platform,
            JSON.stringify(inconsistencies),
            JSON.stringify(corrections)
          ]
        );
      } catch (auditError) {
        // Si table n'existe pas, juste logger mais continuer
        console.warn('⚠️ [FixJob] Audit log failed (table may not exist):', auditError.message);
      }
      
      // 7. Commit la transaction
      await connection.commit();
      console.log(`✅ [FixJob] Applied ${corrections.filter(c => c.applied).length} corrections`);
      
      // 8. Récupérer le job mis à jour
      const [updatedJobs] = await connection.execute(
        'SELECT * FROM jobs WHERE id = ?',
        [jobId]
      );
      
      // 9. Retourner la réponse
      await connection.end();
      
      return res.json({
        success: true,
        fixed: corrections.filter(c => c.applied).length > 0,
        corrections,
        job: updatedJobs[0]
      });
      
    } catch (error) {
      // Rollback en cas d'erreur
      await connection.rollback();
      await connection.end();
      
      console.error('❌ [FixJob] Transaction failed:', error);
      return res.status(500).json({
        success: false,
        fixed: false,
        corrections: [],
        error: `Transaction failed: ${error.message}`
      });
    }
    
  } catch (error) {
    if (connection) await connection.end();
    
    console.error('❌ [FixJob] Error:', error);
    return res.status(500).json({
      success: false,
      fixed: false,
      corrections: [],
      error: error.message
    });
  }
}

/**
 * Récupérer l'ID du job à partir d'un ID ou CODE
 */
async function getJobId(connection, jobIdOrCode) {
  // Si c'est un nombre, retourner directement
  if (/^\d+$/.test(jobIdOrCode)) {
    return parseInt(jobIdOrCode, 10);
  }
  
  // Sinon, chercher par CODE
  const [jobs] = await connection.execute(
    'SELECT id FROM jobs WHERE code = ?',
    [jobIdOrCode]
  );
  
  return jobs.length > 0 ? jobs[0].id : null;
}

module.exports = { fixJobInconsistencies };
```

---

## 🗂️ TABLE AUDIT (OPTIONNEL)

### Migration SQL

```sql
-- Table pour logger les corrections automatiques
CREATE TABLE IF NOT EXISTS job_corrections_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  timestamp DATETIME NOT NULL,
  app_version VARCHAR(20),
  platform VARCHAR(20),
  corrections JSON NOT NULL COMMENT 'Liste des incohérences détectées',
  changes JSON NOT NULL COMMENT 'Liste des corrections appliquées',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_job_id (job_id),
  INDEX idx_timestamp (timestamp),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Requêtes utiles

```sql
-- Voir toutes les corrections pour un job
SELECT * FROM job_corrections_log 
WHERE job_id = 2 
ORDER BY created_at DESC;

-- Compter les corrections par type
SELECT 
  JSON_UNQUOTE(JSON_EXTRACT(corrections, '$[*].type')) as correction_types,
  COUNT(*) as count
FROM job_corrections_log
GROUP BY correction_types;

-- Jobs avec le plus de corrections
SELECT 
  job_id,
  COUNT(*) as correction_count,
  MAX(created_at) as last_correction
FROM job_corrections_log
GROUP BY job_id
ORDER BY correction_count DESC
LIMIT 10;
```

---

## 📝 ENREGISTRER LA ROUTE

### Fichier: `index.js` (serveur principal)

```javascript
// Importer le contrôleur
const { fixJobInconsistencies } = require('./endPoints/v1/fixJobInconsistencies');

// Enregistrer la route
app.post('/swift-app/v1/job/:id/fix-inconsistencies', fixJobInconsistencies);
```

Position suggérée: après les autres routes jobs (start, advance-step, complete)

---

## 🧪 TESTS BACKEND

### Test 1: Job completed mais step=2

```bash
curl -X POST http://localhost:3021/swift-app/v1/job/2/fix-inconsistencies \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 2,
    "detectedAt": "2025-12-21T18:30:00Z",
    "inconsistencies": [{
      "type": "completed_but_not_final_step",
      "severity": "critical",
      "serverCorrectable": true,
      "correctionType": "advance_step",
      "currentState": {
        "status": "completed",
        "currentStep": 2,
        "paymentStatus": "paid",
        "signatureBlob": "present"
      }
    }],
    "appVersion": "1.0.0",
    "platform": "test"
  }'
```

**Attendu:** 
- HTTP 200
- `fixed: true`
- `current_step` mis à jour à 5

### Test 2: Pas d'items

```bash
curl -X POST http://localhost:3021/swift-app/v1/job/2/fix-inconsistencies \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 2,
    "inconsistencies": [{
      "type": "no_items_loaded_step_4",
      "correctionType": "create_items",
      "serverCorrectable": true
    }],
    "appVersion": "1.0.0",
    "platform": "test"
  }'
```

**Attendu:**
- Item créé dans `job_items`
- `loaded = 1`

### Test 3: Step mismatch

```bash
curl -X POST http://localhost:3021/swift-app/v1/job/2/fix-inconsistencies \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 2,
    "inconsistencies": [{
      "type": "step_current_step_mismatch",
      "correctionType": "sync_steps",
      "serverCorrectable": true
    }],
    "appVersion": "1.0.0",
    "platform": "test"
  }'
```

**Attendu:**
- `step = current_step`

---

## ✅ CHECKLIST IMPLÉMENTATION

- [ ] Créer fichier `fixJobInconsistencies.js`
- [ ] Implémenter fonction `fixJobInconsistencies()`
- [ ] Implémenter fonction `getJobId()`
- [ ] Ajouter les 5 corrections (switch/case)
- [ ] Enregistrer route dans `index.js`
- [ ] Créer table `job_corrections_log` (optionnel)
- [ ] Tester avec curl (3 tests minimum)
- [ ] Tester avec app mobile (job ID=2)
- [ ] Vérifier logs serveur
- [ ] Valider job corrigé dans DB

---

## 🎯 CRITÈRES DE SUCCÈS

1. ✅ Endpoint répond 200 OK
2. ✅ Job ID=2 corrigé automatiquement
3. ✅ Status reset de "completed" → "in_progress"
4. ✅ Items créés dans job_items
5. ✅ Step synchronisé (step = current_step)
6. ✅ Client reçoit job corrigé
7. ✅ Client recharge et affiche job correct
8. ✅ Pas d'erreurs dans logs serveur
9. ✅ Transaction atomique (rollback si erreur)
10. ✅ Audit log créé (si table existe)

---

**Temps estimé:** 1-2h d'implémentation backend + 30 min de tests

**Prêt à implémenter!** 🚀

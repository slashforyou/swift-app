# 🔧 DEBUG RAPIDE - Job ID=8 (JOB-DEC-002)

**Date:** 21 Décembre 2025  
**Job:** ID=8, Code=JOB-DEC-002  
**Problème:** Corrections ne s'appliquent pas

---

## 🔍 DIAGNOSTIC SQL

### 1. État Actuel du Job

```sql
SELECT 
  id,
  code,
  status,
  current_step,
  step,
  payment_status,
  signature_blob IS NOT NULL as has_signature,
  signature_date,
  timer_started_at,
  timer_total_hours,
  created_at,
  updated_at
FROM jobs 
WHERE id = 8\G
```

**Attendu:** Incohérences visibles

---

### 2. Vérifier Colonnes step

```sql
-- Type de la colonne step
DESCRIBE jobs;

-- Valeur exacte de step
SELECT 
  id,
  step,
  current_step,
  CASE 
    WHEN step = current_step THEN '✅ Synced'
    WHEN step IS NULL THEN '⚠️ NULL'
    WHEN step != current_step THEN '❌ Mismatch'
    ELSE '❓ Unknown'
  END as status
FROM jobs 
WHERE id = 8;
```

---

### 3. Historique Modifications

```sql
-- Dernières modifications du job
SELECT 
  'jobs' as table_name,
  id,
  code,
  updated_at as last_modified,
  status,
  current_step
FROM jobs 
WHERE id = 8

UNION ALL

-- Logs de corrections (si table existe)
SELECT 
  'corrections' as table_name,
  job_id as id,
  'N/A' as code,
  created_at as last_modified,
  'N/A' as status,
  JSON_EXTRACT(changes, '$[0].action') as current_step
FROM job_corrections_log 
WHERE job_id = 8
ORDER BY last_modified DESC
LIMIT 10;
```

---

## ✅ CORRECTIONS MANUELLES

### Option 1: Reset Complet (Job Pas Terminé)

```sql
-- Reset job à l'étape 1
UPDATE jobs 
SET 
  status = 'in_progress',
  current_step = 1,
  step = 1,
  timer_started_at = NULL,
  timer_total_hours = 0,
  timer_is_running = 0,
  signature_blob = NULL,
  signature_date = NULL,
  updated_at = NOW()
WHERE id = 8;

-- Vérifier
SELECT id, status, current_step, step FROM jobs WHERE id = 8;
```

---

### Option 2: Avancer à Step 5 (Job Terminé)

```sql
-- Avancer job à l'étape finale
UPDATE jobs 
SET 
  status = 'completed',
  current_step = 5,
  step = 5,
  updated_at = NOW()
WHERE id = 8;

-- Vérifier
SELECT id, status, current_step, step FROM jobs WHERE id = 8;
```

---

### Option 3: Synchroniser step seulement

```sql
-- Synchroniser step avec current_step
UPDATE jobs 
SET 
  step = current_step,
  updated_at = NOW()
WHERE id = 8;

-- Vérifier
SELECT id, status, current_step, step FROM jobs WHERE id = 8;
```

---

## 🧪 TEST BACKEND APRÈS CORRECTION

### Curl Test
```bash
curl -X POST http://localhost:3021/swift-app/v1/job/8/fix-inconsistencies \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 8,
    "jobCode": "JOB-DEC-002",
    "detectedAt": "2025-12-21T09:00:00Z",
    "inconsistencies": [
      {
        "type": "completed_but_not_final_step",
        "severity": "critical",
        "correctionType": "advance_step",
        "currentState": {
          "status": "completed",
          "currentStep": 2
        }
      }
    ],
    "appVersion": "1.0.0",
    "platform": "android"
  }'
```

**Attendu:**
```json
{
  "success": true,
  "fixed": true,
  "corrections": [
    {
      "type": "completed_but_not_final_step",
      "applied": true,
      "action": "Advanced job to step 5 (was 2)",
      "timestamp": "..."
    }
  ]
}
```

---

## 🔍 VÉRIFICATIONS POST-CORRECTION

### 1. Job Corrigé?
```sql
SELECT 
  id,
  code,
  status,
  current_step,
  step,
  CASE 
    WHEN status = 'completed' AND current_step = 5 AND step = 5 THEN '✅ OK'
    ELSE '❌ Still broken'
  END as check_status
FROM jobs 
WHERE id = 8;
```

### 2. Log Créé?
```sql
SELECT 
  id,
  job_id,
  JSON_PRETTY(corrections) as detected,
  JSON_PRETTY(changes) as applied,
  created_at
FROM job_corrections_log 
WHERE job_id = 8 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🚨 SI TOUJOURS BLOQUÉ

### Debug Serveur
```bash
# Voir les logs en temps réel
tail -f /root/.forever/dbyv.log

# Ou si process s'appelle autrement
pm2 logs dbyv --lines 50
```

### Debug Client (Logs Attendus)
```javascript
// ✅ BON:
LOG  🔧 [JobCorrection] Requesting server correction
LOG  📡 [JobCorrection] Response status: 200
LOG  ✅ [JobCorrection] Server corrected 1 issues

// ❌ MAUVAIS:
LOG  ℹ️ [JobCorrection] Server analyzed but no corrections applied
```

---

## 🎯 DÉCISION RAPIDE

**Tu veux quoi pour le job ID=8?**

**A) Reset complet** (recommencer de zéro):
```sql
UPDATE jobs SET status='in_progress', current_step=1, step=1, 
  timer_started_at=NULL, signature_blob=NULL WHERE id=8;
```

**B) Avancer à step 5** (marquer terminé):
```sql
UPDATE jobs SET status='completed', current_step=5, step=5 WHERE id=8;
```

**C) Juste sync step**:
```sql
UPDATE jobs SET step=current_step WHERE id=8;
```

**D) Supprimer et recréer** (fresh start):
```sql
DELETE FROM jobs WHERE id=8;
-- Puis créer un nouveau job propre
```

---

**Choisis et exécute!** 🚀

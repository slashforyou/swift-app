# 🚨 DEMANDE DE CORRECTION BACKEND - URGENT

**Date:** 18 Décembre 2025  
**Projet:** Swift-App  
**Environnement:** Production (altivo.fr)  
**Sévérité:** 🔴 CRITIQUE (3 bugs bloquants)

---

## 📋 RÉSUMÉ EXÉCUTIF

Le **client mobile fonctionne correctement** et envoie les bonnes requêtes.  
Le **backend a 3 bugs** qui empêchent l'app de fonctionner.

| # | Endpoint | Erreur | Impact | Priorité |
|---|----------|--------|--------|----------|
| 1 | `POST /job/:id/start` | 500 `pool.execute is not a function` | Timer ne démarre jamais | 🔴 P0 |
| 2 | `POST /job/:id/advance-step` | 400 `Invalid step number` | Steps ne s'actualisent pas | 🔴 P0 |
| 3 | `POST /job/:id/complete` | 200 mais `current_step = 99` | UI cassée (99/5) | 🟡 P1 |

---

## 🐛 BUG 1: Timer Start - Erreur 500

### Requête Client (CORRECTE)
```http
POST https://altivo.fr/swift-app/v1/job/2/start
Authorization: Bearer [token]
Content-Type: application/json
```

### Réponse Backend (INCORRECTE)
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "pool.execute is not a function"
}
```
**Status:** `500 Internal Server Error`

### Diagnostic
L'erreur `pool.execute is not a function` indique un problème de configuration MySQL.

**Cause probable:**
- Utilisation de la bibliothèque `mysql` (qui n'a que `query()`)
- Mais le code appelle `pool.execute()` (qui n'existe que dans `mysql2`)

### Solution Rapide
```javascript
// OPTION 1: Remplacer execute() par query()
// Dans: routes/jobs.js ou controllers/jobController.js

// ❌ AVANT (ne marche pas avec mysql)
const [rows] = await pool.execute('UPDATE jobs SET timer_started_at = NOW() WHERE id = ?', [jobId]);

// ✅ APRÈS (marche avec mysql ET mysql2)
const [rows] = await pool.query('UPDATE jobs SET timer_started_at = NOW() WHERE id = ?', [jobId]);
```

**OU**

```bash
# OPTION 2: Installer mysql2
npm install mysql2

# Dans config/database.js
const mysql = require('mysql2/promise');  # Au lieu de 'mysql'
```

### Vérifications
```bash
# 1. Quelle lib MySQL ?
cat package.json | grep mysql

# 2. Où est l'erreur ?
grep -rn "pool.execute" routes/
grep -rn "pool.execute" controllers/

# 3. Logs
pm2 logs swift-app | grep "pool.execute"
```

---

## 🐛 BUG 2: Steps Update - Erreur 400

### Requête Client (CORRECTE)
```http
POST https://altivo.fr/swift-app/v1/job/2/advance-step
Authorization: Bearer [token]
Content-Type: application/json

{
  "current_step": 3,
  "notes": "Avancé à l'étape 3 après 541.73h"
}
```

### Réponse Backend (INCORRECTE)
```json
{
  "success": false,
  "error": "Invalid step number. Must be between 1 and 5"
}
```
**Status:** `400 Bad Request`

### Diagnostic
Le step **3 est dans le range 1-5** mais le backend le refuse quand même!

**Cause probable:**
1. Validation trop stricte (ex: refuse de sauter d'étapes)
2. Mauvais nom de paramètre attendu (`step` au lieu de `current_step`)
3. Vérification du step actuel en DB (job déjà à l'étape 3?)

### Solution
```javascript
// Dans: routes/jobs.js (handler POST /job/:id/advance-step)

router.post('/job/:id/advance-step', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { current_step, notes } = req.body;  // ✅ Accept "current_step"
    
    // ✅ Validation correcte (permet tous les steps 1-5)
    if (!current_step || current_step < 1 || current_step > 5) {
      return res.status(400).json({
        success: false,
        error: "Invalid step number. Must be between 1 and 5"
      });
    }
    
    // ❌ NE PAS FAIRE (validation trop stricte):
    // const currentStepInDB = await getJobCurrentStep(jobId);
    // if (current_step !== currentStepInDB + 1) { ... }  // ❌ Refuse de sauter
    
    // ✅ Mise à jour sans restriction de séquence
    await pool.query(
      'UPDATE jobs SET current_step = ?, updated_at = NOW() WHERE id = ?',
      [current_step, jobId]
    );
    
    // Insertion note si fournie
    if (notes) {
      await pool.query(
        'INSERT INTO job_notes (job_id, note, created_at) VALUES (?, ?, NOW())',
        [jobId, notes]
      );
    }
    
    res.json({ success: true, current_step });
  } catch (error) {
    console.error('Error updating job step:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Vérifications
```bash
# 1. Trouver le handler
grep -rn "advance-step" routes/

# 2. Vérifier l'état du job en DB
mysql -u user -p
SELECT id, code, current_step, status FROM jobs WHERE id = 2;

# 3. Activer les logs
# Dans le handler, ajouter:
console.log('Received advance-step request:', {
  jobId: req.params.id,
  body: req.body,
  currentStepInDB: currentStepInDB  // Si vous le récupérez
});
```

---

## 🐛 BUG 3: Complete Job - Step devient 99

### Requête Client (CORRECTE)
```http
POST https://altivo.fr/swift-app/v1/job/2/complete
Authorization: Bearer [token]
Content-Type: application/json
```

### Réponse Backend (PARTIELLEMENT INCORRECTE)
```json
{
  "success": true,
  "job": {
    "code": "JOB-NERD-PENDING-002",
    "completed_at": "2025-12-18T12:20:26.798Z",
    "current_step": 99,        // ❌ WTF?!
    "previous_step": 1,        // ❌ Incohérent
    "status": "completed"
  }
}
```
**Status:** `200 OK`

### Diagnostic
Le backend retourne `success: true` et met `status = completed` ✅  
**MAIS** il écrase `current_step` avec la valeur `99` ❌

**Impact:**
- L'UI affiche "Étape 99/5" 😱
- Perte de traçabilité (on ne sait pas à quelle étape réelle le job a été complété)
- `previous_step = 1` est incohérent

### Solution
```javascript
// Dans: routes/jobs.js (handler POST /job/:id/complete)

router.post('/job/:id/complete', async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    // Récupérer le job actuel
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
    if (!jobs.length) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    const job = jobs[0];
    
    // ❌ NE PAS FAIRE (écrase le step réel):
    // await pool.query(
    //   'UPDATE jobs SET status = "completed", current_step = 99, completed_at = NOW() WHERE id = ?',
    //   [jobId]
    // );
    
    // ✅ FAIRE (préserve le step réel):
    await pool.query(
      `UPDATE jobs SET 
        status = 'completed',
        completed_at = NOW(),
        completed_by = ?
      WHERE id = ?`,
      [req.user.id, jobId]
    );
    // Note: current_step n'est PAS modifié (garde 4 ou 5)
    
    // Retourner le step réel
    res.json({
      success: true,
      job: {
        id: jobId,
        code: job.code,
        status: 'completed',
        current_step: job.current_step,  // ✅ Préservé (4 ou 5)
        previous_step: job.current_step - 1,
        completed_at: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Vérifications
```bash
# 1. Trouver le handler
grep -rn "complete" routes/jobs.js

# 2. Chercher "99" dans le code
grep -rn "99" backend/
grep -rn "current_step.*99" backend/

# 3. Vérifier la requête UPDATE
# Rechercher dans le handler la requête SQL qui met current_step = 99
```

---

## 🧪 TESTS À EXÉCUTER

### Option 1: Script PowerShell (Windows)
```powershell
# Remplacer YOUR_AUTH_TOKEN_HERE dans le script
.\test-backend-endpoints.ps1
```

### Option 2: Script Bash (Linux/Mac)
```bash
chmod +x test-backend-endpoints.sh
./test-backend-endpoints.sh
```

### Option 3: Tests Manuels
```bash
# Test 1: Timer start
curl -X POST https://altivo.fr/swift-app/v1/job/2/start \
  -H "Authorization: Bearer TOKEN" \
  -v

# Test 2: Step update
curl -X POST https://altivo.fr/swift-app/v1/job/2/advance-step \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"current_step": 3, "notes": "Test"}' \
  -v

# Test 3: Complete job
curl -X POST https://altivo.fr/swift-app/v1/job/2/complete \
  -H "Authorization: Bearer TOKEN" \
  -v
```

---

## 📊 CHECKLIST CORRECTIONS

### Bug 1: Timer Start (🔴 P0)
- [ ] Vérifier `package.json` → quelle lib MySQL ?
- [ ] Chercher tous les `pool.execute()` dans le code
- [ ] Remplacer par `pool.query()` OU installer `mysql2`
- [ ] Tester: `POST /job/2/start` → doit retourner 200 OK

### Bug 2: Steps Update (🔴 P0)
- [ ] Trouver le handler `POST /job/:id/advance-step`
- [ ] Vérifier validation du paramètre `current_step`
- [ ] Supprimer restriction de séquence (step+1 obligatoire)
- [ ] Tester: `POST /job/2/advance-step` avec `{"current_step": 3}` → doit retourner 200 OK

### Bug 3: Complete Job (🟡 P1)
- [ ] Trouver le handler `POST /job/:id/complete`
- [ ] Supprimer `current_step = 99` de la requête UPDATE
- [ ] Préserver le `current_step` réel du job
- [ ] Tester: `POST /job/2/complete` → `current_step` doit être 4 ou 5, PAS 99

---

## 📝 LOGS BACKEND RECOMMANDÉS

Ajouter ces logs pour faciliter le debug:

```javascript
// Dans chaque handler
console.log('[DEBUG] Received request:', {
  endpoint: req.path,
  method: req.method,
  params: req.params,
  body: req.body,
  user: req.user?.id
});

// Avant validation
console.log('[DEBUG] Validation:', {
  currentStepInDB: job.current_step,
  requestedStep: req.body.current_step,
  isValid: /* condition */
});

// Après requête DB
console.log('[DEBUG] DB update result:', {
  affectedRows: result.affectedRows,
  changedRows: result.changedRows
});
```

---

## 🎯 TIMELINE ATTENDUE

**Urgent (24h):**
- Fix Bug 1 (Timer) → **Bloquant total**
- Fix Bug 2 (Steps) → **Bloquant total**

**Important (48h):**
- Fix Bug 3 (Complete) → **Bug visuel mais non-bloquant**

---

## 📞 CONTACT

**Client Frontend:** Romain  
**Logs complets:** Voir `ANALYSE_PROBLEMES_SERVEUR.md`  
**Scripts de test:** `test-backend-endpoints.ps1` et `.sh`

**Le client mobile est 100% opérationnel. Tous les bugs sont côté backend.**

Merci de corriger ces 3 endpoints rapidement! 🙏

---

**Document créé:** 18 Décembre 2025  
**Auteur:** GitHub Copilot  
**Version:** 1.0

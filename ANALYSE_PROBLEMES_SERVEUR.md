# 🔍 ANALYSE DÉTAILLÉE - Problèmes Serveur Backend

**Date:** 18 Décembre 2025  
**Session:** 9 - Tests post-fix  
**Status:** ❌ ÉCHEC - Problèmes backend critiques

---

## 📊 RÉSUMÉ EXÉCUTIF

| Problème | Erreur | Cause Probable | Côté |
|----------|--------|----------------|------|
| **Timer 500** | `pool.execute is not a function` | Configuration DB cassée | 🔴 SERVEUR |
| **Steps 400** | `Invalid step number` | Validation backend incorrecte | 🔴 SERVEUR |
| **Signature deprecated** | Legacy API expo-file-system | Version Expo 54 | 🟡 CLIENT |
| **Complete 200 mais step 99** | Backend met step à 99 au lieu de 5 | Logique backend incorrecte | 🔴 SERVEUR |

**VERDICT:** 3/4 problèmes sont côté SERVEUR 🔴

---

## 🚨 PROBLÈME 1: Timer Start - Erreur 500 Critique

### Logs Client
```log
LOG  🚀 [startTimerAPI] Starting job timer: JOB-DEC-002 → numeric ID: 2
LOG  🚀 [startTimerAPI] Full URL: https://altivo.fr/swift-app/v1/job/2/start
LOG  🚀 [startTimerAPI] Response status: 500 OK: false
LOG  🚀 [startTimerAPI] Response data: {
  "details": "pool.execute is not a function",
  "error": "Internal server error",
  "success": false
}
ERROR ❌ [startTimerAPI] Job start failed
```

### Analyse Technique
- **Endpoint appelé:** `POST /swift-app/v1/job/2/start` ✅ (correct)
- **ID numérique:** `2` ✅ (extraction correcte)
- **Status HTTP:** `500` ❌ (Internal Server Error)
- **Erreur backend:** `pool.execute is not a function`

### Diagnostic
🔴 **ERREUR SERVEUR CRITIQUE**

Le message `pool.execute is not a function` indique que:
1. Le backend tente d'exécuter une requête SQL
2. L'objet `pool` (connexion base de données) n'a pas la méthode `execute()`
3. **Deux causes possibles:**
   - Configuration MySQL incorrecte (utilise `query()` au lieu de `execute()`)
   - Pool de connexion non initialisé correctement
   - Migration de bibliothèque DB (mysql → mysql2 ou inverse)

### ✅ VÉRIFICATIONS SERVEUR NÉCESSAIRES

1. **Vérifier le fichier de configuration DB**
   ```bash
   # Rechercher dans le backend
   grep -r "pool.execute" .
   grep -r "createPool" .
   ```

2. **Vérifier quelle bibliothèque MySQL est utilisée**
   ```bash
   # Dans package.json du backend
   cat package.json | grep -i mysql
   ```
   
   Attente: `mysql2` (supporte `execute()`) ou `mysql` (supporte seulement `query()`)

3. **Vérifier le code de l'endpoint `/job/:id/start`**
   ```javascript
   // Rechercher le handler
   // Probablement dans: routes/jobs.js ou controllers/jobController.js
   
   // CORRECT (mysql2):
   const [rows] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [jobId]);
   
   // INCORRECT (mysql):
   const [rows] = await pool.execute(...); // ❌ N'existe pas!
   // Devrait être:
   const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
   ```

4. **Solution rapide serveur:**
   ```javascript
   // Option 1: Utiliser query() au lieu de execute()
   const [rows] = await pool.query('UPDATE jobs SET timer_started_at = NOW() WHERE id = ?', [jobId]);
   
   // Option 2: Installer mysql2 et remplacer mysql
   npm install mysql2
   // Puis dans config/database.js:
   const mysql = require('mysql2/promise');
   ```

---

## 🚨 PROBLÈME 2: Steps Update - Erreur 400 "Invalid step number"

### Logs Client
```log
LOG  📊 [UPDATE JOB STEP] Calling API: {
  "current_step": 3,
  "endpoint": "/swift-app/v1/job/2/advance-step",
  "jobId": "JOB-DEC-002",
  "notes": "Avancé à l'étape 3 après 541.73h",
  "numericId": "2"
}
WARN ⚠️ Failed to update job step: 400 {
  "success": false,
  "error": "Invalid step number. Must be between 1 and 5"
}
```

### Analyse Technique
- **Endpoint appelé:** `POST /swift-app/v1/job/2/advance-step` ✅
- **Body envoyé:** `{ current_step: 3, notes: "..." }` ✅
- **Step demandé:** `3` (dans range 1-5) ✅
- **Réponse backend:** "Invalid step number. Must be between 1 and 5" ❌

### Diagnostic
🔴 **VALIDATION BACKEND INCORRECTE**

Le backend REFUSE l'étape 3 alors qu'elle est dans le range 1-5!

**Hypothèses:**
1. Backend vérifie `current_step > previous_step + 1` (ne peut sauter d'étapes)
2. Backend s'attend à `step` au lieu de `current_step`
3. Backend vérifie le step actuel en DB (job est déjà à l'étape 3?)
4. Validation incorrecte (bug serveur)

### ✅ VÉRIFICATIONS SERVEUR NÉCESSAIRES

1. **Vérifier le handler de `/job/:id/advance-step`**
   ```javascript
   // Rechercher le fichier
   grep -r "advance-step" routes/
   
   // Vérifier la validation
   // Exemple de ce qui POURRAIT causer l'erreur:
   
   // ❌ INCORRECT: Ne permet pas de sauter d'étapes
   if (newStep !== currentStep + 1) {
     return res.status(400).json({
       success: false,
       error: "Invalid step number. Must be between 1 and 5"
     });
   }
   
   // ✅ CORRECT: Permet d'avancer à n'importe quelle étape
   if (newStep < 1 || newStep > 5) {
     return res.status(400).json({
       success: false,
       error: "Invalid step number. Must be between 1 and 5"
     });
   }
   ```

2. **Vérifier le nom du paramètre attendu**
   ```javascript
   // Backend attend peut-être "step" au lieu de "current_step"
   
   // Ce que le client envoie:
   { current_step: 3, notes: "..." }
   
   // Ce que le backend attend peut-être:
   { step: 3, notes: "..." }
   // OU
   { new_step: 3, notes: "..." }
   ```

3. **Vérifier l'état actuel du job en DB**
   ```sql
   -- Exécuter dans MySQL
   SELECT id, code, current_step, status FROM jobs WHERE id = 2;
   
   -- Si current_step = 3 déjà, le backend pourrait refuser la mise à jour
   ```

4. **Consulter les logs backend**
   ```bash
   # Voir les logs du serveur au moment de l'erreur
   tail -f /var/log/swift-app/backend.log
   # OU
   pm2 logs swift-app
   ```

5. **Solution rapide serveur:**
   ```javascript
   // Dans le handler POST /job/:id/advance-step
   
   router.post('/job/:id/advance-step', async (req, res) => {
     try {
       const jobId = parseInt(req.params.id);
       const { current_step, notes } = req.body; // ✅ Accept current_step
       
       // ✅ Validation correcte
       if (!current_step || current_step < 1 || current_step > 5) {
         return res.status(400).json({
           success: false,
           error: "Invalid step number. Must be between 1 and 5"
         });
       }
       
       // ✅ Mise à jour sans validation de séquence
       await pool.query(
         'UPDATE jobs SET current_step = ?, updated_at = NOW() WHERE id = ?',
         [current_step, jobId]
       );
       
       // ✅ Insertion note si fournie
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

---

## 🚨 PROBLÈME 3: Complete Job - Step devient 99 au lieu de 5

### Logs Client
```log
LOG  📊 [COMPLETE JOB] Calling API: {
  "endpoint": "/swift-app/v1/job/2/complete",
  "jobId": "JOB-DEC-002",
  "numericId": "2"
}

LOG  ✅ [COMPLETE JOB] Job completed successfully: {
  "response": {
    "job": {
      "code": "JOB-NERD-PENDING-002",
      "completed_at": "2025-12-18T12:20:26.798Z",
      "current_step": 99,  // ❌ WTF?!
      "previous_step": 1,
      "status": "completed"
    },
    "success": true
  }
}
```

### Analyse Technique
- **Endpoint appelé:** `POST /swift-app/v1/job/2/complete` ✅
- **Réponse:** `200 OK` ✅
- **Status:** `completed` ✅
- **Mais:** `current_step: 99` ❌ (devrait être 5)
- **Et:** `previous_step: 1` ❌ (devrait être 4)

### Diagnostic
🔴 **LOGIQUE BACKEND INCORRECTE**

Le backend met arbitrairement `current_step = 99` lors de la completion!

**Pourquoi c'est un problème:**
1. Le frontend affiche "Étape 99/5" 😱
2. La logique de progression est cassée
3. Pas de trace des étapes réelles franchies
4. `previous_step = 1` indique que le job était à l'étape 1 (incohérent)

### ✅ VÉRIFICATIONS SERVEUR NÉCESSAIRES

1. **Vérifier le handler de `/job/:id/complete`**
   ```javascript
   // Rechercher le fichier
   grep -r "complete" routes/jobs.js
   
   // Probablement quelque chose comme:
   
   // ❌ INCORRECT: Écrase le step réel
   await pool.query(
     'UPDATE jobs SET status = "completed", current_step = 99, completed_at = NOW() WHERE id = ?',
     [jobId]
   );
   
   // ✅ CORRECT: Préserve le step réel
   await pool.query(
     'UPDATE jobs SET status = "completed", completed_at = NOW() WHERE id = ?',
     [jobId]
   );
   // OU si on veut marquer explicitement:
   await pool.query(
     'UPDATE jobs SET status = "completed", current_step = 5, completed_at = NOW() WHERE id = ?',
     [jobId]
   );
   ```

2. **Vérifier si 99 est une "magic number" dans le code**
   ```bash
   grep -r "99" backend/
   grep -r "current_step.*99" backend/
   ```

3. **Solution serveur:**
   ```javascript
   router.post('/job/:id/complete', async (req, res) => {
     try {
       const jobId = parseInt(req.params.id);
       
       // Récupérer le job actuel
       const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
       if (!jobs.length) {
         return res.status(404).json({ success: false, error: 'Job not found' });
       }
       
       const job = jobs[0];
       
       // ✅ Compléter SANS changer le step
       await pool.query(
         `UPDATE jobs SET 
           status = 'completed',
           completed_at = NOW(),
           completed_by = ?
         WHERE id = ?`,
         [req.user.id, jobId]
       );
       
       // ✅ Retourner le step réel (5) pas 99
       res.json({
         success: true,
         job: {
           id: jobId,
           code: job.code,
           status: 'completed',
           current_step: job.current_step, // ✅ Préservé
           completed_at: new Date()
         }
       });
     } catch (error) {
       res.status(500).json({ success: false, error: error.message });
     }
   });
   ```

---

## 🟡 PROBLÈME 4: Signature - API Deprecated (Client)

### Logs Client
```log
WARN Method writeAsStringAsync imported from "expo-file-system" is deprecated.
You can migrate to the new filesystem API using "File" and "Directory" classes or import the legacy API from "expo-file-system/legacy".

ERROR Signature save error: [Error: Method writeAsStringAsync imported from "expo-file-system" is deprecated...]
```

### Analyse Technique
- **Cause:** Expo SDK 54 a déprécié l'ancienne API FileSystem
- **Impact:** Les signatures ne peuvent plus être sauvées
- **Côté:** Client (pas serveur)

### Diagnostic
🟡 **PROBLÈME CLIENT - Migration Expo nécessaire**

Ce n'est PAS un problème serveur, mais une migration Expo nécessaire côté client.

### ✅ FIX CLIENT (à faire après les fixes serveur)
```typescript
// OPTION 1: Utiliser l'API legacy (temporaire)
import * as FileSystem from 'expo-file-system/legacy';

// OPTION 2: Migrer vers la nouvelle API (recommandé)
import { File } from 'expo-file-system';

async function dataUrlToPngFile(dataUrl: string, filename: string) {
  const base64 = dataUrl.split(',')[1];
  const uri = `${FileSystem.documentDirectory}${filename}`;
  
  // Nouvelle API
  const file = new File(uri);
  await file.write(base64, { encoding: 'base64' });
  
  return uri;
}
```

---

## 📋 CHECKLIST VÉRIFICATIONS SERVEUR

### Priorité 1: Timer Start (Bloquant)
- [ ] Vérifier quelle lib MySQL est utilisée (`mysql` vs `mysql2`)
- [ ] Rechercher tous les `pool.execute()` dans le code
- [ ] Remplacer par `pool.query()` OU installer `mysql2`
- [ ] Tester l'endpoint manuellement: `POST /swift-app/v1/job/2/start`

### Priorité 2: Steps Update (Bloquant)
- [ ] Trouver le handler `POST /job/:id/advance-step`
- [ ] Vérifier la validation du paramètre `current_step`
- [ ] Vérifier si validation de séquence existe (step+1 obligatoire?)
- [ ] Consulter l'état du job en DB: `SELECT * FROM jobs WHERE id = 2`
- [ ] Activer les logs backend pour voir l'erreur complète
- [ ] Tester manuellement:
  ```bash
  curl -X POST https://altivo.fr/swift-app/v1/job/2/advance-step \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"current_step": 3, "notes": "Test"}'
  ```

### Priorité 3: Complete Job (Non-bloquant mais bug)
- [ ] Trouver le handler `POST /job/:id/complete`
- [ ] Chercher pourquoi `current_step = 99`
- [ ] Modifier pour préserver le step réel
- [ ] Vérifier la logique de `previous_step`

### Logs Backend à Activer
```javascript
// Ajouter dans chaque endpoint
console.log('[DEBUG] Received request:', {
  endpoint: req.path,
  params: req.params,
  body: req.body,
  query: req.query
});

// Ajouter avant la validation
console.log('[DEBUG] Validation:', {
  currentStepInDB: job.current_step,
  requestedStep: req.body.current_step,
  isValid: /* condition */
});
```

---

## 🎯 COMMANDES À EXÉCUTER SUR LE SERVEUR

### 1. Diagnostic Rapide
```bash
# SSH vers le serveur
ssh user@altivo.fr

# Vérifier les logs en temps réel
pm2 logs swift-app --lines 100

# Vérifier quelle lib MySQL
cd /path/to/backend
cat package.json | grep mysql

# Chercher pool.execute
grep -rn "pool.execute" .

# Chercher le handler advance-step
grep -rn "advance-step" routes/
```

### 2. Test DB Direct
```bash
# Connexion MySQL
mysql -u swift_user -p swift_db

# Vérifier le job
SELECT id, code, current_step, status, timer_started_at FROM jobs WHERE id = 2;

# Vérifier la structure
DESCRIBE jobs;
```

### 3. Test Endpoints Manuels
```bash
# Test timer start
curl -X POST https://altivo.fr/swift-app/v1/job/2/start \
  -H "Authorization: Bearer TOKEN" \
  -v

# Test step update
curl -X POST https://altivo.fr/swift-app/v1/job/2/advance-step \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"current_step": 3}' \
  -v
```

---

## 📊 SYNTHÈSE POUR LE DEV BACKEND

**Cher développeur backend,**

Le client envoie les requêtes CORRECTEMENT avec les bons endpoints et IDs numériques.
Mais votre backend a 3 bugs critiques:

1. **`POST /job/:id/start`** → Erreur 500 `pool.execute is not a function`
   - Fix: Remplacer `pool.execute()` par `pool.query()` OU installer `mysql2`

2. **`POST /job/:id/advance-step`** → Erreur 400 "Invalid step number" pour step 3 (pourtant dans range 1-5)
   - Fix: Vérifier la validation, accepter `current_step` entre 1 et 5 sans restriction de séquence

3. **`POST /job/:id/complete`** → Retourne success mais met `current_step = 99`
   - Fix: Ne pas modifier `current_step` lors de la completion, juste changer le `status`

**Les logs complets sont ci-dessus. Merci de corriger ces 3 endpoints.**

---

**Auteur:** GitHub Copilot  
**Date:** 18 Décembre 2025  
**Status:** Attend correction serveur 🔴

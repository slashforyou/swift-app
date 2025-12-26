# 🔍 ANALYSE DÉTAILLÉE DES ERREURS - Tests Session 9

**Date:** 19 Décembre 2025, 22h50  
**Status:** ❌ ÉCHEC PARTIEL - Nouveaux problèmes détectés

---

## 📊 LISTE DES ERREURS DÉTECTÉES

### ❌ ERREUR 1: Timer Start - Status "completed"
```log
LOG  🚀 [startTimerAPI] Response status: 400 OK: false
LOG  🚀 [startTimerAPI] Response data: {
  "currentStatus": "completed",
  "error": "Job cannot be started from status: completed. Only pending or scheduled jobs can be started.",
  "success": false
}
```

**Symptôme:** Backend refuse de démarrer timer car job status = "completed"  
**Impact:** Timer ne démarre jamais  
**Fréquence:** À chaque tentative

---

### ❌ ERREUR 2: Steps Update - Endpoint 404
```log
LOG  📊 [UPDATE JOB STEP] Calling API: {
  "current_step": 3,
  "endpoint": "/swift-app/v1/job/2/advance-step",
  "jobId": "JOB-DEC-002",
  "numericId": "2"
}
DEBUG 📊 [UPDATE JOB STEP] Endpoint returned 404, invalidating cache and using local fallback
```

**Symptôme:** Endpoint `/job/2/advance-step` retourne 404  
**Impact:** Steps ne se synchronisent PAS avec backend (local only)  
**Fréquence:** À chaque changement de step (3, 4, 5)

---

### ❌ ERREUR 3: Complete Job - Already Completed
```log
LOG  📊 [COMPLETE JOB] Calling API: {
  "endpoint": "/swift-app/v1/job/2/complete",
  "jobId": "JOB-DEC-002",
  "numericId": "2"
}
ERROR ❌ [COMPLETE JOB] Error: {
  "success": false,
  "message": "Job is already completed"
}
```

**Symptôme:** Backend dit que job est déjà "completed"  
**Impact:** Cannot complete job (déjà fait)  
**Fréquence:** À chaque tentative

---

### ❌ ERREUR 4: Step Persistence - Revient à 2
```log
LOG  🔍 [JobDetails] Step configuration: {"actualStep": 2, "currentStep": 2, ...}
```

**Symptôme:** Après refresh, job revient à step 2  
**Impact:** Steps ne persistent PAS en DB  
**Fréquence:** À chaque refresh de la page

---

### ⚠️ ERREUR 5: Signature Deprecated (Non-bloquant)
```log
WARN Method writeAsStringAsync imported from "expo-file-system" is deprecated
ERROR Signature save error
```

**Symptôme:** API Expo FileSystem dépréciée  
**Impact:** Signatures ne se sauvent pas  
**Fréquence:** À chaque tentative de signature

---

## 🔍 CAUSES POTENTIELLES

### ERREUR 1: Timer - Status "completed"

**Cause Root:**
Le job a le **status = "completed"** en DB mais **current_step = 2** (incohérence!)

**Preuve:**
```log
"currentStatus": "completed"  // Backend dit completed
"actualStep": 2               // Mais step = 2 (pas 5)
"jobStatus": "in_progress"    // Client pense in_progress
```

**Hypothèses:**
1. **Job complété lors test précédent** → Status = "completed" en DB
2. **Backend reset step à 2** → Mais oublie de reset status
3. **Incohérence DB** → Status et step désynchronisés

**Vérification nécessaire (Backend):**
```sql
SELECT id, code, status, current_step FROM jobs WHERE id = 2;
-- Attendu: status = 'in_progress' ET current_step = 2
-- Réel probable: status = 'completed' ET current_step = 2  ❌
```

---

### ERREUR 2: Steps - Endpoint 404

**Cause Root:**
L'endpoint `/swift-app/v1/job/2/advance-step` retourne 404 (NOT FOUND)

**Mais le backend a dit avoir corrigé!**

**Hypothèses:**
1. **URL incorrecte côté client** → On appelle le mauvais endpoint
2. **Endpoint pas redéployé** → Code pas mis à jour sur serveur
3. **Route manquante** → Endpoint jamais créé/enregistré
4. **ID au lieu de CODE** → Backend attend peut-être le CODE pas l'ID

**Vérification nécessaire (Backend):**
```bash
# Tester endpoint manuellement
curl -X POST https://altivo.fr/swift-app/v1/job/2/advance-step \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}' \
  -v

# Vérifier routes enregistrées
grep -rn "advance-step" /srv/www/htdocs/swiftapp/server/

# Vérifier que fichier existe
ls -la /srv/www/htdocs/swiftapp/server/endPoints/v1/advanceJobStep.js
```

---

### ERREUR 3: Complete - Already Completed

**Cause Root:**
Job status = "completed" en DB donc backend refuse de le re-compléter

**C'est NORMAL** si job déjà complété lors test précédent!

**Solution:** Utiliser un job FRESH (status = 'pending' ou 'in_progress')

---

### ERREUR 4: Step Persistence - Revient à 2

**Cause Root:**
Steps ne se synchronisent PAS avec backend (404) → Fallback local only

**Preuve:**
```log
DEBUG 📊 [UPDATE JOB STEP] Endpoint returned 404, invalidating cache and using local fallback
```

**Conséquence:**
- Step avance localement (3 → 4 → 5) ✅
- Mais backend JAMAIS notifié (404) ❌
- Au refresh: backend renvoie step 2 (valeur DB) ❌
- Local overwrite par DB value ❌

**Fix requis:** Résoudre ERREUR 2 (endpoint 404)

---

## 🎯 RÉSULTATS ATTENDUS

### Test 1: Timer Start
**Attendu:**
```log
LOG 🚀 [startTimerAPI] Response status: 200 OK: true
LOG 🚀 [startTimerAPI] Job started successfully
```

**Requis:**
- Job status = 'pending' OU 'in_progress' en DB
- Endpoint `/job/:id/start` accessible
- Backend accepte ID numérique

---

### Test 2: Steps Update
**Attendu:**
```log
LOG 📊 [UPDATE JOB STEP] Calling API: {"current_step": 3, ...}
LOG ✅ [UPDATE JOB STEP] Step updated successfully
```

**Requis:**
- Endpoint `/job/:id/advance-step` retourne 200 (pas 404)
- Backend accepte paramètre `current_step`
- Step sauvé en DB

---

### Test 3: Complete Job
**Attendu:**
```log
LOG ✅ [COMPLETE JOB] Job completed successfully
LOG Response: {"job": {"current_step": 5, "status": "completed"}}
```

**Requis:**
- Job status != 'completed' avant appel
- Endpoint `/job/:id/complete` accessible
- Step preserved (5 pas 99)

---

### Test 4: Step Persistence
**Attendu:**
Après refresh:
```log
LOG 🔍 [JobDetails] Step configuration: {"actualStep": 3, "currentStep": 3}
```

**Requis:**
- Steps synchronisés avec backend (pas 404)
- DB updated avec current_step = 3
- GET /job/:id retourne step 3

---

## 💡 SOLUTION COMPLÈTE

### Phase 1: Diagnostic Backend (URGENT)

**Action 1: Vérifier état du job en DB**
```sql
-- Exécuter sur le serveur MySQL
SELECT 
  id, 
  code, 
  status, 
  current_step, 
  timer_started_at,
  updated_at
FROM jobs 
WHERE code = 'JOB-DEC-002';
```

**Résultat attendu:**
```
id: 2
code: JOB-DEC-002
status: completed        ❌ PROBLÈME!
current_step: 2          ❌ INCOHÉRENT!
timer_started_at: NULL
```

**Si status = 'completed':**
→ Le job a été complété lors test précédent
→ Need to RESET job OU utiliser nouveau job

---

**Action 2: Tester endpoint advance-step manuellement**
```bash
# Sur le serveur OU localement
curl -X POST https://altivo.fr/swift-app/v1/job/2/advance-step \
  -H "Authorization: Bearer test-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}' \
  -v
```

**Résultats possibles:**

**Si 404:**
```json
{"error": "Not Found"}
```
→ Endpoint pas enregistré OU route incorrecte

**Si 200:**
```json
{"success": true, "new_step": 3}
```
→ Endpoint fonctionne! Problème d'URL côté client?

**Si 400:**
```json
{"error": "Invalid step number"}
```
→ Validation backend incorrecte

---

**Action 3: Vérifier routes enregistrées**
```bash
# Sur le serveur
cd /srv/www/htdocs/swiftapp/server/

# Chercher toutes les routes "advance"
grep -rn "advance" routes/
grep -rn "advance" index.js
grep -rn "advance" app.js

# Vérifier fichier existe
ls -la endPoints/v1/advanceJobStep.js
```

**Si fichier manquant:**
→ Endpoint pas créé!

**Si fichier existe mais pas de route:**
→ Route pas enregistrée dans index.js/app.js

---

### Phase 2: Corrections Backend

#### CAS A: Job status = "completed" (Need reset)

**Solution 1: Reset job à "in_progress"**
```sql
-- OPTION RAPIDE (temporaire)
UPDATE jobs 
SET 
  status = 'in_progress',
  current_step = 2,
  timer_started_at = NULL,
  updated_at = NOW()
WHERE id = 2;
```

**Solution 2: Créer nouveau job de test**
```sql
-- OPTION PROPRE (recommandée)
INSERT INTO jobs (
  code, 
  client_id, 
  status, 
  current_step,
  created_at,
  updated_at
) VALUES (
  'JOB-TEST-001',
  1,
  'pending',
  1,
  NOW(),
  NOW()
);

-- Noter l'ID retourné (ex: 15)
-- Utiliser ce job pour tests
```

---

#### CAS B: Endpoint advance-step retourne 404

**Diagnostic:**
```bash
# Vérifier que fichier existe
ls -la /srv/www/htdocs/swiftapp/server/endPoints/v1/advanceJobStep.js

# Chercher comment endpoint est enregistré
grep -A5 "advance" /srv/www/htdocs/swiftapp/server/index.js
```

**Si route manquante, ajouter dans index.js:**
```javascript
// Dans /srv/www/htdocs/swiftapp/server/index.js

// Importer le handler
const advanceJobStep = require('./endPoints/v1/advanceJobStep');

// Enregistrer la route
app.post('/swift-app/v1/job/:id/advance-step', advanceJobStep);
```

**Puis redémarrer serveur:**
```bash
forever restart dbyv
```

---

**Si URL incorrecte:**
```javascript
// Vérifier dans advanceJobStep.js ou routes/jobs.js
// Quelle URL est attendue?

// Possibilités:
router.post('/job/:id/advance-step', handler);           // ✅ Correct
router.post('/jobs/:id/advance-step', handler);          // ❌ /jobs/ au lieu de /job/
router.post('/job/:job_id/advance-step', handler);       // ❌ :job_id au lieu de :id
router.post('/job/:code/advance-step', handler);         // ❌ CODE au lieu de ID
```

---

#### CAS C: Backend attend CODE au lieu de ID

**Symptôme:** Endpoint existe mais refuse ID numérique

**Test:**
```bash
# Test avec ID numérique
curl -X POST https://altivo.fr/swift-app/v1/job/2/advance-step \
  -d '{"current_step": 3}'
# Résultat: 404

# Test avec CODE
curl -X POST https://altivo.fr/swift-app/v1/job/JOB-DEC-002/advance-step \
  -d '{"current_step": 3}'
# Résultat: 200 ✅
```

**Si backend attend CODE:**

**Option 1: Modifier route backend (recommandé)**
```javascript
// Supporter les DEUX: ID et CODE
router.post('/job/:jobIdOrCode/advance-step', async (req, res) => {
  const { jobIdOrCode } = req.params;
  
  // Détecter si ID ou CODE
  let jobId;
  if (/^\d+$/.test(jobIdOrCode)) {
    // C'est un ID numérique
    jobId = parseInt(jobIdOrCode);
  } else {
    // C'est un CODE, récupérer ID depuis DB
    const [jobs] = await pool.query('SELECT id FROM jobs WHERE code = ?', [jobIdOrCode]);
    if (!jobs.length) {
      return res.status(404).json({ error: 'Job not found' });
    }
    jobId = jobs[0].id;
  }
  
  // Continue avec jobId...
});
```

**Option 2: Modifier client pour envoyer CODE**
```typescript
// jobSteps.ts
// Au lieu de:
const response = await fetch(`${API_BASE_URL}/job/${numericId}/advance-step`, ...);

// Utiliser:
const response = await fetch(`${API_BASE_URL}/job/${jobId}/advance-step`, ...);
// (jobId = "JOB-DEC-002")
```

---

### Phase 3: Corrections Client

#### Fix 1: Signature FileSystem (Expo deprecated)

**Fichier:** `src/components/signingBloc.tsx`

**Remplacement:**
```typescript
// AVANT (ligne 354-358)
import * as FileSystem from 'expo-file-system';

const dataUrlToPngFile = async (dataUrl: string) => {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
  const uri = `${dir}signature_${Date.now()}.png`;
  
  await FileSystem.writeAsStringAsync(uri, base64, { 
    encoding: 'base64' as any
  });
  return uri;
};

// APRÈS (OPTION 1: Legacy API - Rapide)
import * as FileSystem from 'expo-file-system/legacy';

const dataUrlToPngFile = async (dataUrl: string) => {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  const uri = `${dir}signature_${Date.now()}.png`;
  
  await FileSystem.writeAsStringAsync(uri, base64, { 
    encoding: FileSystem.EncodingType.Base64
  });
  return uri;
};

// APRÈS (OPTION 2: Nouvelle API - Recommandée mais plus complexe)
import { File, Paths } from 'expo-file-system';

const dataUrlToPngFile = async (dataUrl: string) => {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const filename = `signature_${Date.now()}.png`;
  const uri = Paths.document + '/' + filename;
  
  const file = new File(uri);
  await file.write(base64, { encoding: 'base64' });
  
  return uri;
};
```

---

#### Fix 2: Améliorer logs pour debugging

**Fichier:** `src/services/jobSteps.ts`

**Ajouter logging détaillé:**
```typescript
// Ligne 88 - Avant fetch
console.log('📊 [UPDATE JOB STEP] About to call:', {
  fullUrl: `${API_BASE_URL}/job/${numericId}/advance-step`,
  method: 'POST',
  headers: authHeaders,
  payload
});

const response = await fetch(`${API_BASE_URL}/job/${numericId}/advance-step`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify(payload)
});

// Après fetch
console.log('📊 [UPDATE JOB STEP] Response received:', {
  status: response.status,
  ok: response.ok,
  statusText: response.statusText
});

const data = await response.json();
console.log('📊 [UPDATE JOB STEP] Response data:', data);
```

---

## 📋 TÂCHES À SÉPARER

### 🔴 TÂCHES BACKEND (PRIORITÉ P0)

#### Tâche B1: Vérifier état job en DB
**Responsable:** Dev Backend  
**Temps estimé:** 2 minutes  
**Commande:**
```sql
SELECT id, code, status, current_step, timer_started_at 
FROM jobs 
WHERE code = 'JOB-DEC-002';
```

**Objectif:** Confirmer que status = 'completed' et current_step = 2

**Livrable:** Screenshot résultat SQL

---

#### Tâche B2: Reset job OU créer nouveau job de test
**Responsable:** Dev Backend  
**Temps estimé:** 5 minutes  
**Option A - Reset:**
```sql
UPDATE jobs 
SET status = 'in_progress', current_step = 2, timer_started_at = NULL
WHERE id = 2;
```

**Option B - Nouveau job (RECOMMANDÉ):**
```sql
INSERT INTO jobs (code, client_id, status, current_step, created_at, updated_at)
VALUES ('JOB-TEST-DEC-003', 1, 'pending', 1, NOW(), NOW());
-- Noter l'ID retourné
```

**Livrable:** Code job de test (ex: JOB-TEST-DEC-003) + ID

---

#### Tâche B3: Tester endpoint advance-step manuellement
**Responsable:** Dev Backend  
**Temps estimé:** 3 minutes  
**Commandes:**
```bash
# Test 1: Avec ID numérique
curl -X POST http://localhost:3021/swift-app/v1/job/2/advance-step \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}' \
  -v

# Test 2: Avec CODE
curl -X POST http://localhost:3021/swift-app/v1/job/JOB-DEC-002/advance-step \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}' \
  -v
```

**Objectif:** Déterminer si endpoint existe et quel format accepte (ID vs CODE)

**Livrable:** 
- Status code (200, 404, 400?)
- Réponse JSON
- Quel format fonctionne? (ID ou CODE)

---

#### Tâche B4: Vérifier routes enregistrées
**Responsable:** Dev Backend  
**Temps estimé:** 5 minutes  
**Commandes:**
```bash
cd /srv/www/htdocs/swiftapp/server/

# Chercher fichier endpoint
ls -la endPoints/v1/advanceJobStep.js

# Chercher enregistrement route
grep -rn "advance" index.js
grep -rn "advance" app.js
grep -rn "advance" routes/
```

**Objectif:** Confirmer que route est bien enregistrée

**Livrable:** 
- Fichier existe? OUI/NON
- Route enregistrée? OUI/NON
- URL exacte de la route

---

#### Tâche B5: Corriger endpoint si nécessaire
**Responsable:** Dev Backend  
**Temps estimé:** 10-15 minutes  
**Selon résultats tâche B3:**

**Si 404:**
→ Ajouter route dans index.js + redémarrer serveur

**Si endpoint attend CODE:**
→ Modifier pour accepter ID ET CODE (code fourni dans Phase 2)

**Livrable:** 
- Code modifié
- Serveur redémarré
- Test curl qui passe (200 OK)

---

### 🟡 TÂCHES CLIENT (PRIORITÉ P1)

#### Tâche C1: Fix Signature FileSystem
**Responsable:** Développeur Client (moi)  
**Temps estimé:** 10 minutes  
**Fichier:** `src/components/signingBloc.tsx`  
**Action:** Remplacer import par `expo-file-system/legacy`

**Code:**
```typescript
// Ligne 1
import * as FileSystem from 'expo-file-system/legacy';

// Ligne 356
await FileSystem.writeAsStringAsync(uri, base64, { 
  encoding: FileSystem.EncodingType.Base64
});
```

**Test:** Tenter signature après fix

**Livrable:** Signature sauvée sans erreur deprecated

---

#### Tâche C2: Améliorer logs debugging
**Responsable:** Développeur Client (moi)  
**Temps estimé:** 15 minutes  
**Fichier:** `src/services/jobSteps.ts`  
**Action:** Ajouter logs détaillés (URL complète, status, response)

**Objectif:** Mieux comprendre pourquoi 404

**Livrable:** Logs montrent URL exacte appelée + réponse complète

---

#### Tâche C3: Support CODE si backend le requiert
**Responsable:** Développeur Client (moi)  
**Temps estimé:** 20 minutes  
**Fichier:** `src/services/jobSteps.ts`, `jobTimer.ts`  
**Condition:** Si tâche B3 montre que backend attend CODE

**Action:** 
```typescript
// Option: Envoyer CODE au lieu d'ID
const response = await fetch(`${API_BASE_URL}/job/${jobId}/advance-step`, ...);
// jobId = "JOB-DEC-002" (CODE) au lieu de "2" (ID)
```

**Livrable:** Client envoie CODE, backend accepte

---

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

### Étape 1: Diagnostic Backend (10 min)
1. ✅ Tâche B1: Vérifier état job
2. ✅ Tâche B3: Tester endpoint manuellement
3. ✅ Tâche B4: Vérifier routes enregistrées

**STOP** → Analyser résultats → Décider suite

---

### Étape 2: Corrections Backend (15-30 min)
4. ✅ Tâche B2: Reset job OU créer nouveau job
5. ✅ Tâche B5: Corriger endpoint si nécessaire

**TEST** → Curl doit retourner 200 OK

---

### Étape 3: Corrections Client (30 min)
6. ✅ Tâche C1: Fix Signature FileSystem
7. ✅ Tâche C2: Améliorer logs
8. ✅ Tâche C3: Support CODE si requis (conditionnel)

**TEST** → App doit fonctionner end-to-end

---

### Étape 4: Tests Finaux (30 min)
9. ✅ Test 1: Timer start sur nouveau job
10. ✅ Test 2: Steps update (2 → 3 → 4 → 5)
11. ✅ Test 3: Complete job
12. ✅ Test 4: Refresh + vérifier persistance
13. ✅ Test 5: Signature save

---

## 📞 COMMUNICATION BACKEND

**Message à envoyer:**

```
Salut,

J'ai testé les corrections mais on a encore des problèmes.

PROBLÈME PRINCIPAL:
L'endpoint POST /job/2/advance-step retourne 404.

DIAGNOSTIC NÉCESSAIRE:
Peux-tu exécuter ces commandes et me renvoyer les résultats?

1. État du job:
SELECT id, code, status, current_step FROM jobs WHERE code = 'JOB-DEC-002';

2. Test endpoint avec ID:
curl -X POST http://localhost:3021/swift-app/v1/job/2/advance-step \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}' \
  -v

3. Test endpoint avec CODE:
curl -X POST http://localhost:3021/swift-app/v1/job/JOB-DEC-002/advance-step \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}' \
  -v

4. Vérifier route:
grep -rn "advance" /srv/www/htdocs/swiftapp/server/index.js

QUESTIONS:
- Le fichier advanceJobStep.js existe bien?
- La route est enregistrée dans index.js?
- Quel format attend l'endpoint: ID numérique (2) ou CODE (JOB-DEC-002)?

Merci!
Romain

P.S.: Le job JOB-DEC-002 est status = "completed", peux-tu aussi:
- Soit le reset à "in_progress"
- Soit créer un nouveau job de test (JOB-TEST-DEC-003)?
```

---

**Auteur:** GitHub Copilot  
**Date:** 19 Décembre 2025  
**Status:** 📋 PLAN D'ACTION COMPLET  
**Prochaine étape:** Attendre diagnostic backend

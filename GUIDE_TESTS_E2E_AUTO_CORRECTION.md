# 🧪 GUIDE TESTS E2E - Auto-Correction Job

**Date:** 21 Décembre 2025  
**Durée estimée:** 30 minutes  
**Prérequis:** Backend déployé ✅

---

## 🎯 OBJECTIF

Valider que le système de correction automatique fonctionne de bout en bout:
- Client détecte les incohérences
- Client appelle le backend
- Backend corrige en base de données
- Client recharge le job corrigé
- Utilisateur voit les changements

---

## 📱 TEST 1: Auto-Correction au Chargement

### Préparation (1 min)

**Vérifier l'état du job ID=2 dans la base:**
```sql
SELECT 
  id,
  code,
  status,
  current_step,
  step,
  payment_status,
  signature_blob IS NOT NULL as has_signature
FROM jobs 
WHERE id = 2;
```

**État attendu (AVANT correction):**
- status = "completed"
- current_step = quelque chose < 5 (probablement 2 ou 3)
- step ≠ current_step (désynchronisé)

---

### Étapes du Test (5 min)

1. **Ouvrir l'app mobile**
   - Connexion avec ton compte
   - Aller dans la liste des jobs

2. **Ouvrir le job JOB-DEC-002**
   - Tap sur le job dans la liste
   - jobDetails.tsx se charge

3. **Observer la console (IMPORTANT!)**
   
   **Logs attendus (dans cet ordre):**
   ```javascript
   // 1. Détection des incohérences
   LOG  ⚠️ Job validation failed: [Array d'incohérences]
   
   // 2. Filtrage des corrections serveur
   LOG  🔧 [JobDetails] Found server-correctable issues: 3
   
   // 3. Appel backend
   LOG  🔧 [ServerCorrection] Requesting corrections: {
     url: "https://altivo.fr/swift-app/v1/job/2/fix-inconsistencies",
     jobId: "2",
     issuesCount: 3
   }
   
   // 4. Réponse backend
   LOG  ✅ [ServerCorrection] Success: {
     fixed: true,
     corrections: 3
   }
   ```

4. **Observer l'interface**
   
   **Toast attendu (ordre chronologique):**
   ```
   1. "Correction automatique en cours..." (bleu info)
   2. "✅ 3 corrections appliquées" (vert success)
   ```

5. **Vérifier le rechargement**
   - L'écran devrait se recharger automatiquement après 1 seconde
   - Le job devrait s'afficher avec les données corrigées

---

### Validation (2 min)

**Vérifier l'état du job dans l'app:**
- Current Step affiché = 5/5 ✅
- Status = "Completed" ou "Terminé" ✅
- Pas d'erreurs affichées ✅

**Vérifier en base de données:**
```sql
SELECT 
  id,
  code,
  status,
  current_step,
  step
FROM jobs 
WHERE id = 2;
```

**Résultat attendu (APRÈS correction):**
- status = "completed" ✅
- current_step = 5 ✅
- step = 5 ✅

**Vérifier les items créés:**
```sql
SELECT * FROM job_items WHERE job_id = 2;
```

**Résultat attendu:**
- Au moins 1 item présent ✅
- loaded = 1 ✅
- description = "Item par défaut (auto-créé)" (si créé) ✅

**Vérifier le log d'audit:**
```sql
SELECT 
  id,
  job_id,
  app_version,
  platform,
  JSON_PRETTY(corrections) as detected,
  JSON_PRETTY(changes) as applied,
  created_at
FROM job_corrections_log 
WHERE job_id = 2 
ORDER BY created_at DESC 
LIMIT 1;
```

**Résultat attendu:**
- 1 ligne créée ✅
- 3 corrections dans le JSON `applied` ✅
- platform = "android" ou "ios" ✅
- Timestamp récent ✅

---

### ✅ Critères de Succès Test 1

- [ ] Toast "Correction automatique en cours..." affiché
- [ ] Toast "✅ 3 corrections appliquées" affiché
- [ ] Job rechargé automatiquement
- [ ] current_step = 5 dans l'app
- [ ] current_step = 5 en base de données
- [ ] step = 5 en base de données
- [ ] Items créés dans job_items
- [ ] Log créé dans job_corrections_log

**Si 8/8 ✅ → TEST 1 RÉUSSI** 🎉

---

## 🔄 TEST 2: Workflow Complet Après Correction

**Prérequis:** Test 1 réussi (job corrigé)

### Étapes (15 min)

#### 2.1 - Démarrer le Timer

1. **Action:** Tap sur le bouton "Démarrer" (timer)
2. **Attendu:** 
   - Requête: `POST /job/2/start`
   - Réponse: 200 OK ✅
   - Timer démarre (chronomètre visible)
   - Pas d'erreur 400 "Job cannot be started"

**Log attendu:**
```javascript
LOG  🚀 [startTimerAPI] Starting job timer: JOB-DEC-002
LOG  🚀 [startTimerAPI] Response status: 200 OK: true
```

---

#### 2.2 - Avancer les Étapes

**Étape 1 → 2:**
1. **Action:** Tap "Étape suivante"
2. **Attendu:** 
   - Requête: `POST /job/2/advance-step` body: `{current_step: 2}`
   - Réponse: 200 OK ✅
   - UI affiche "Étape 2/5"

**Étape 2 → 3:**
1. **Action:** Tap "Étape suivante"
2. **Attendu:** 200 OK ✅, UI affiche "Étape 3/5"

**Étape 3 → 4:**
1. **Action:** Tap "Étape suivante"
2. **Attendu:** 200 OK ✅, UI affiche "Étape 4/5"
3. **Important:** Pas d'erreur "No items marked as loaded" (items créés par auto-correction!)

**Étape 4 → 5:**
1. **Action:** Tap "Étape suivante"
2. **Attendu:** 200 OK ✅, UI affiche "Étape 5/5"

**Log attendu (pour chaque étape):**
```javascript
LOG  🔄 [JobDetails] Step change requested: {newStep: X, oldStep: Y}
LOG  📊 [UPDATE JOB STEP] Calling API: {current_step: X, numericId: "2"}
```

---

#### 2.3 - Signature

1. **Action:** Tap sur "Signer"
2. **Action:** Dessiner une signature
3. **Action:** Tap "Valider"
4. **Attendu:**
   - Signature sauvegardée ✅
   - **AUCUN warning "FileSystem deprecated"** (fix appliqué!)
   - Toast "Signature enregistrée" ou similaire

**Log attendu:**
```javascript
LOG  📝 [Signature] Saving signature...
LOG  ✅ [Signature] Signature saved successfully
```

**Log NON attendu (bug corrigé):**
```javascript
WARN  Method writeAsStringAsync imported from "expo-file-system" is deprecated
// ❌ Ce log NE DOIT PLUS APPARAÎTRE
```

---

#### 2.4 - Compléter le Job

1. **Action:** Tap sur "Terminer" ou "Compléter"
2. **Attendu:**
   - Requête: `POST /job/2/complete`
   - Réponse: 200 OK ✅
   - Toast "Job terminé" ou similaire
   - **Pas d'erreur 400 "Job is already completed"**

**Log attendu:**
```javascript
LOG  📊 [COMPLETE JOB] Calling API: {jobId: "JOB-DEC-002"}
LOG  ✅ [COMPLETE JOB] Job completed successfully
```

---

#### 2.5 - Vérifier la Persistance

1. **Action:** Fermer l'app complètement (swipe)
2. **Action:** Rouvrir l'app
3. **Action:** Ouvrir le job JOB-DEC-002
4. **Attendu:**
   - current_step = 5 ✅
   - Status = "Terminé" ✅
   - Timer arrêté ✅
   - Signature présente ✅
   - **Pas de retour à l'étape 2 ou 3** (bug de persistance corrigé!)

---

### ✅ Critères de Succès Test 2

- [ ] Timer démarre (200 OK)
- [ ] Étape 1→2 (200 OK)
- [ ] Étape 2→3 (200 OK)
- [ ] Étape 3→4 (200 OK) - Items chargés!
- [ ] Étape 4→5 (200 OK)
- [ ] Signature sans warning deprecated
- [ ] Complétion (200 OK)
- [ ] Persistance après rechargement

**Si 8/8 ✅ → TEST 2 RÉUSSI** 🎉

---

## 🐛 TEST 3: Cas d'Erreur (Optionnel)

### 3.1 - Backend Indisponible

**Préparation:**
- Temporairement stopper le backend: `pm2 stop dbyv`

**Test:**
1. Ouvrir un job avec incohérences
2. **Attendu:**
   - Toast "⚠️ Correction automatique échouée"
   - Job reste dans l'état incohérent (pas de crash)
   - App continue de fonctionner

**Restauration:**
- Redémarrer backend: `pm2 start dbyv`

---

### 3.2 - Job Sans Incohérences

**Préparation:**
- Créer un nouveau job propre (status="in_progress", step=1)

**Test:**
1. Ouvrir ce job
2. **Attendu:**
   - Aucun toast "Correction automatique"
   - Job s'affiche normalement
   - Pas de requête POST fix-inconsistencies envoyée

---

## 📊 CHECKLIST FINALE

### Client-Side
- [ ] Détection des incohérences fonctionne
- [ ] Service jobCorrection.ts appelle le backend
- [ ] Toast "Correction en cours" affiché
- [ ] Toast "X corrections appliquées" affiché
- [ ] Job rechargé automatiquement
- [ ] Signature sans warning deprecated

### Backend-Side
- [ ] Endpoint répond 200 OK
- [ ] Corrections SQL appliquées en DB
- [ ] Transaction atomique garantie
- [ ] Log audit créé dans job_corrections_log

### Workflow Complet
- [ ] Timer démarre sans erreur
- [ ] Toutes les étapes 1→2→3→4→5 passent
- [ ] Signature sauvegardée
- [ ] Job complété sans erreur
- [ ] Persistance fonctionne après rechargement

---

## 📝 RAPPORT DE TEST

### Template de Rapport

```markdown
# Rapport Tests E2E - [DATE]

## Test 1: Auto-Correction
- Toast info: ✅ / ❌
- Toast success: ✅ / ❌
- Rechargement: ✅ / ❌
- DB corrigée: ✅ / ❌
- Résultat: SUCCÈS / ÉCHEC

## Test 2: Workflow Complet
- Timer: ✅ / ❌
- Étapes 1-5: ✅ / ❌
- Signature: ✅ / ❌
- Complétion: ✅ / ❌
- Persistance: ✅ / ❌
- Résultat: SUCCÈS / ÉCHEC

## Bugs Trouvés
1. [Description bug]
   - Sévérité: Critique / Majeur / Mineur
   - Étapes repro: [...]
   - Logs: [...]

## Conclusion
- Tests réussis: X/X
- Système opérationnel: OUI / NON
- Prêt production: OUI / NON
```

---

## 🎯 VERDICT FINAL

**Si tous les tests passent:**

✅ **Phase 1 Auto-Correction = 100% OPÉRATIONNELLE**

**Livrables complets:**
- Client: 861 lignes de code
- Backend: 381 lignes de code
- Documentation: 5 documents
- Tests: 3 scénarios validés

**Système prêt pour:**
- ✅ Déploiement production
- ✅ Monitoring utilisateurs
- ✅ Phase 2 (29 cas additionnels)

---

## 💡 TIPS DE DEBUG

### Console Logs à Surveiller

**Bons logs (✅ succès):**
```javascript
LOG  🔧 [JobDetails] Found server-correctable issues: 3
LOG  🔧 [ServerCorrection] Requesting corrections
LOG  ✅ [ServerCorrection] Success: {fixed: true, corrections: 3}
```

**Mauvais logs (❌ problème):**
```javascript
ERROR  ❌ [ServerCorrection] Error: [détails erreur]
WARN   ⚠️ Failed to update job step: 400
ERROR  ❌ [COMPLETE JOB] Error: Job is already completed
```

---

### Requêtes SQL de Debug

**Voir l'état actuel du job:**
```sql
SELECT * FROM jobs WHERE id = 2\G
```

**Voir les corrections appliquées:**
```sql
SELECT 
  JSON_PRETTY(changes) 
FROM job_corrections_log 
WHERE job_id = 2 
ORDER BY created_at DESC 
LIMIT 1;
```

**Voir les logs serveur:**
```bash
tail -f /root/.forever/dbyv.log
```

---

## 🚀 COMMENCER LES TESTS

**Prêt?**

1. ✅ Backend déployé
2. ✅ Client à jour
3. ✅ Job ID=2 en état incohérent
4. ✅ Console dev tools ouverte

**Go!** Lance les tests et observe la magie opérer ! 🎉

---

**Bonne chance!** 🍀

_Guide créé le 21 Décembre 2025 - Version 1.0_

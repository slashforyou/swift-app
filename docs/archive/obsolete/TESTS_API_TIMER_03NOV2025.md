# 🧪 Tests API Timer - Guide de Validation (3 Nov 2025)

## 🎯 Objectif

Valider que l'API backend répond correctement aux nouveaux endpoints de timer.

---

## 📋 Checklist des Tests

### ✅ Test 1 : Vérifier que l'API retourne les nouvelles données

**Endpoint :** `GET /api/v1/jobs/1/full`

**Ce qu'on doit voir dans la réponse :**

```json
{
  "data": {
    "job": {
      "timer_total_hours": 442.5,
      "timer_billable_hours": 430.5,
      "timer_break_hours": 12.0,
      "timer_is_running": false,
      "timer_started_at": "2025-10-11T06:02:13.000Z",
      "timer_last_updated": "2025-11-03T14:30:00.000Z"
    },
    "timeline": {
      "timer_total_hours": 442.5,
      "timer_billable_hours": 430.5,
      "timer_break_hours": 12.0,
      "timer_is_running": false,
      "step_history": [
        {
          "step": 1,
          "step_name": "Préparation",
          "started_at": "2025-10-11T06:02:13.000Z",
          "completed_at": "2025-10-11T08:30:00.000Z",
          "duration_hours": 2.5,
          "break_hours": 0.5,
          "is_current": false
        },
        {
          "step": 2,
          "step_name": "En route",
          "started_at": "2025-10-11T08:30:00.000Z",
          "completed_at": null,
          "duration_hours": 440.0,
          "break_hours": 11.5,
          "is_current": true
        }
      ]
    }
  }
}
```

**Action :**
- Ouvrir un job dans l'app
- Vérifier les logs console
- Chercher `[getJobDetails] /full endpoint raw response`
- Vérifier que `timeline.step_history` existe

---

### ✅ Test 2 : Synchroniser le timer vers l'API

**Fonction testée :** `syncTimerToAPI()`

**Scénario :**
1. Ouvrir un job (ex: JOB-NERD-ACTIVE-001)
2. Le timer local a 442h enregistrées
3. L'app appelle automatiquement `syncTimerToAPI()` au chargement

**Logs attendus :**
```
📤 [syncTimerToAPI] Syncing timer to API: {
  jobId: "1",
  currentStep: 2,
  totalElapsedHours: "442.50",
  billableHours: "430.50",
  isRunning: false,
  stepsCount: 2
}
✅ [syncTimerToAPI] Timer synced successfully: { success: true, ... }
```

**Vérification backend :**
- Ouvrir la base de données
- Vérifier `jobs` table :
  - `timer_billable_hours = 430.5`
  - `timer_break_hours = 12.0`
  - `timer_is_running = 0`
- Vérifier `job_step_history` table :
  - 2 entrées pour job_id = 1
  - Step 1 avec `completed_at` rempli
  - Step 2 avec `completed_at = NULL`

---

### ✅ Test 3 : Démarrer le timer

**Fonction testée :** `startTimerAPI()`

**Scénario :**
1. Ouvrir un job jamais démarré
2. Appuyer sur "Démarrer le timer"
3. Vérifier l'appel API

**Logs attendus :**
```
🚀 [startTimerAPI] Starting timer for job: "3"
✅ [startTimerAPI] Timer started: { success: true, ... }
```

**Vérification backend :**
- `jobs.timer_is_running = 1`
- `jobs.timer_started_at = NOW()`
- `jobs.current_step = 1`

---

### ✅ Test 4 : Avancer le step

**Fonction testée :** `advanceStepAPI()`

**Scénario :**
1. Ouvrir un job au step 2
2. Appuyer sur "Avancer étape"
3. Vérifier l'appel API

**Logs attendus :**
```
⏭️ [advanceStepAPI] Advancing step: {
  jobId: "1",
  fromStep: 2,
  toStep: 3,
  durationHours: "440.00"
}
✅ [advanceStepAPI] Step advanced: { success: true, ... }
```

**Vérification backend :**
- `jobs.current_step = 3`
- `job_step_history` step 2 : `completed_at = NOW()`
- `job_step_history` step 3 : nouvelle entrée créée

---

### ✅ Test 5 : Mettre en pause

**Fonction testée :** `pauseTimerAPI()`

**Scénario :**
1. Timer en cours
2. Appuyer sur "Pause"
3. Vérifier l'appel API

**Logs attendus :**
```
⏸️ [pauseTimerAPI] Pausing timer: {
  jobId: "1",
  currentStep: 2,
  elapsedHours: "442.50"
}
✅ [pauseTimerAPI] Timer paused: { success: true, ... }
```

**Vérification backend :**
- `jobs.timer_is_running = 0`
- `jobs.timer_total_hours = 442.5`

---

### ✅ Test 6 : Reprendre après pause

**Fonction testée :** `resumeTimerAPI()`

**Scénario :**
1. Timer en pause
2. Appuyer sur "Reprendre"
3. Vérifier l'appel API

**Logs attendus :**
```
▶️ [resumeTimerAPI] Resuming timer: {
  jobId: "1",
  breakHours: "1.00"
}
✅ [resumeTimerAPI] Timer resumed: { success: true, ... }
```

**Vérification backend :**
- `jobs.timer_is_running = 1`
- `jobs.timer_break_hours += 1.0`

---

### ✅ Test 7 : Compléter le job

**Fonction testée :** `completeJobAPI()`

**Scénario :**
1. Job au step 4 ou 5
2. Appuyer sur "Terminer le job"
3. Vérifier l'appel API

**Logs attendus :**
```
✅ [completeJobAPI] Completing job: {
  jobId: "1",
  billableHours: "430.50",
  breakHours: "12.00",
  finalCost: 8850
}
✅ [completeJobAPI] Job completed: { success: true, ... }
```

**Vérification backend :**
- `jobs.status = 'completed'`
- `jobs.current_step = 5`
- `jobs.timer_is_running = 0`
- `jobs.amount_total = 8850.00`
- Tous les steps dans `job_step_history` ont `completed_at` rempli

---

## 🐛 Debugging - Erreurs Communes

### Erreur 1 : Endpoint 404

**Symptôme :**
```
❌ [syncTimerToAPI] Failed to sync timer: 404 Not Found
```

**Cause :** Routes pas ajoutées dans `routes/api.php`

**Solution :**
```php
Route::put('/jobs/{id}/timer', [JobTimerController::class, 'syncTimer']);
```

---

### Erreur 2 : Validation Error

**Symptôme :**
```
❌ [syncTimerToAPI] Error details: {
  "message": "The current step field is required."
}
```

**Cause :** Données manquantes dans le body

**Solution :** Vérifier que `convertTimerDataToAPI()` retourne toutes les données requises

---

### Erreur 3 : Unauthorized 401

**Symptôme :**
```
❌ [syncTimerToAPI] Failed to sync timer: 401 Unauthorized
```

**Cause :** Token manquant ou expiré

**Solution :** Vérifier `getAuthHeaders()` retourne un token valide

---

### Erreur 4 : step_history vide

**Symptôme :** `timeline.step_history = []` dans la réponse API

**Cause :** Pas de données dans `job_step_history` table

**Solution :**
1. Vérifier que la table existe : `SHOW TABLES LIKE 'job_step_history'`
2. Vérifier les données : `SELECT * FROM job_step_history WHERE job_id = 1`
3. Si vide, appeler `syncTimerToAPI()` pour peupler

---

## 📊 Exemple de Réponse Complète Attendue

Après avoir sync le timer, `GET /api/v1/jobs/1/full` devrait retourner :

```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "code": "JOB-NERD-ACTIVE-001",
      "current_step": 2,
      "status": "active",
      "timer_total_hours": 442.5,
      "timer_billable_hours": 430.5,
      "timer_break_hours": 12.0,
      "timer_is_running": false,
      "timer_started_at": "2025-10-11T06:02:13.000Z",
      "timer_last_updated": "2025-11-03T14:30:00.000Z"
    },
    "workflow": {
      "current_step": 2,
      "total_steps": 5,
      "step_name": "En route"
    },
    "timeline": {
      "created_at": "2025-10-11T06:02:13.000Z",
      "last_updated": "2025-11-03T14:30:00.000Z",
      "total_duration_hours": 555,
      "time_in_current_step_hours": 555,
      
      "timer_total_hours": 442.5,
      "timer_billable_hours": 430.5,
      "timer_break_hours": 12.0,
      "timer_is_running": false,
      "timer_started_at": "2025-10-11T06:02:13.000Z",
      "timer_last_updated": "2025-11-03T14:30:00.000Z",
      
      "step_history": [
        {
          "step": 1,
          "step_name": "Préparation",
          "started_at": "2025-10-11T06:02:13.000Z",
          "completed_at": "2025-10-11T08:30:00.000Z",
          "duration_hours": 2.5,
          "break_hours": 0.5,
          "is_current": false
        },
        {
          "step": 2,
          "step_name": "En route",
          "started_at": "2025-10-11T08:30:00.000Z",
          "completed_at": null,
          "duration_hours": 440.0,
          "break_hours": 11.5,
          "is_current": true
        }
      ],
      
      "sla_status": "critical",
      "estimated_completion": "2025-10-15T18:00:00.000Z"
    }
  }
}
```

---

## ✅ Checklist Finale

Avant de passer à l'intégration dans l'app :

- [ ] `GET /jobs/{id}/full` retourne `timeline.step_history` ✅
- [ ] `GET /jobs/{id}/full` retourne `job.timer_billable_hours` ✅
- [ ] `PUT /jobs/{id}/timer` fonctionne (200 OK) ✅
- [ ] `POST /jobs/{id}/timer/start` fonctionne ✅
- [ ] `PUT /jobs/{id}/advance-step` fonctionne ✅
- [ ] `POST /jobs/{id}/timer/pause` fonctionne ✅
- [ ] `POST /jobs/{id}/timer/resume` fonctionne ✅
- [ ] `POST /jobs/{id}/complete` fonctionne ✅
- [ ] Base de données : `job_step_history` table existe ✅
- [ ] Base de données : Données sauvegardées correctement ✅

---

## 🚀 Prochaine Étape

Une fois tous les tests ✅, on intègre les appels API dans `useJobTimer.ts` et `JobTimerProvider.tsx` pour synchroniser automatiquement à chaque action.

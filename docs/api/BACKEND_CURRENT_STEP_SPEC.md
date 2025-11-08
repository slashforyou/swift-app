# 🔧 Spécification Backend - Tracking du Current Step

**Date:** 2 novembre 2025  
**Auteur:** Frontend Team  
**Priorité:** 🔴 CRITIQUE  
**Système:** Job Management - Step Tracking

---

## 📋 PROBLÈME ACTUEL

### Symptôme
Les jobs terminés affichent un step incorrect dans l'interface mobile :
- **Job ID:** `JOB-NERD-SCHEDULED-004`
- **Statut:** `completed` ✅
- **Step affiché:** `3/5` ❌ (devrait être `5/5`)

### Cause Racine
L'API ne retourne **PAS** le champ `current_step` dans les réponses de `fetchJobDetails()`.

Le frontend essaie d'accéder à `jobDetails.job?.current_step` mais reçoit `undefined`, ce qui force un fallback vers la valeur locale précédente (stale data).

```tsx
// Code frontend actuel (ligne 250 de jobDetails.tsx)
actualStep: jobDetails.job?.current_step || prevJob.step?.actualStep || 0,
//                        ^^^^^^^^^^^^ toujours undefined !
```

### Impact
- ❌ Jobs terminés affichent un step intermédiaire
- ❌ Bouton "Terminer le job" ne s'affiche pas correctement
- ❌ Incohérence entre `status: completed` et `current_step: 3`
- ❌ Utilisateurs pensent que les jobs ne sont pas terminés

---

## 🎯 SOLUTION REQUISE

### 1. Ajouter le champ `current_step` à la table `jobs`

**Migration SQL nécessaire :**

```sql
-- Ajouter la colonne current_step
ALTER TABLE jobs 
ADD COLUMN current_step INTEGER DEFAULT 0 NOT NULL;

-- Créer un index pour les requêtes
CREATE INDEX idx_jobs_current_step ON jobs(current_step);

-- Initialiser les valeurs existantes
UPDATE jobs 
SET current_step = 
    CASE 
        WHEN status = 'completed' THEN 5  -- Assumer 5 steps par défaut
        WHEN status = 'in-progress' THEN 1
        WHEN status = 'paused' THEN 1
        ELSE 0
    END
WHERE current_step = 0;
```

**Contraintes à respecter :**
- Type: `INTEGER`
- NOT NULL
- Default: `0`
- Valeurs valides: `0` à `totalSteps` (généralement 5)

---

### 2. Modifier l'API GET `/jobs/:id`

**Endpoint:** `GET /api/v1/jobs/:id` ou `/jobs/details/:id`

**Champ à ajouter dans la réponse JSON :**

```json
{
  "job": {
    "id": "JOB-NERD-SCHEDULED-004",
    "title": "Déménagement appartement",
    "status": "completed",
    "current_step": 5,  // ← AJOUTER CE CHAMP
    "priority": "medium",
    "scheduledDate": "2025-10-25T09:00:00Z",
    "pickupAddress": "123 Main St",
    "deliveryAddress": "456 Oak Ave",
    // ... autres champs existants
  },
  "client": { ... },
  "crew": [ ... ],
  "trucks": [ ... ]
}
```

**Interface TypeScript attendue (frontend) :**

```typescript
export interface JobInfo {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'paused' | 'completed' | 'cancelled';
  current_step: number;  // ← NOUVEAU CHAMP À RETOURNER
  priority: 'low' | 'medium' | 'high' | 'urgent';
  // ... autres champs
}
```

---

### 3. Créer l'API PATCH pour mettre à jour le step

**Endpoint:** `PATCH /api/v1/jobs/:id/step`

**Payload attendu :**

```json
{
  "current_step": 3
}
```

**Réponse attendue :**

```json
{
  "success": true,
  "job": {
    "id": "JOB-XXX",
    "current_step": 3,
    "updatedAt": "2025-11-02T14:30:00Z"
  }
}
```

**Validation backend requise :**
```javascript
// Pseudo-code
function updateJobStep(jobId, newStep) {
  // 1. Vérifier que le job existe
  const job = await getJob(jobId);
  if (!job) throw new Error('Job not found');
  
  // 2. Valider le step
  const totalSteps = getJobTypeSteps(job.type); // Ex: 5 pour moving
  if (newStep < 0 || newStep > totalSteps) {
    throw new Error(`Invalid step: must be between 0 and ${totalSteps}`);
  }
  
  // 3. Mettre à jour la DB
  await db.query(
    'UPDATE jobs SET current_step = $1, updated_at = NOW() WHERE id = $2',
    [newStep, jobId]
  );
  
  // 4. Si step = totalSteps, mettre status à "completed" ?
  if (newStep === totalSteps && job.status !== 'completed') {
    await db.query(
      'UPDATE jobs SET status = $1 WHERE id = $2',
      ['completed', jobId]
    );
  }
  
  return { success: true, current_step: newStep };
}
```

---

### 4. Logique métier : Synchronisation Step ↔ Status

**Règles à implémenter backend :**

| Action | Status Update | Current Step Update |
|--------|--------------|---------------------|
| Démarrer le job | `pending` → `in-progress` | `0` → `1` |
| Passer au step suivant | Garder `in-progress` | Incrémenter +1 |
| Mettre en pause | `in-progress` → `paused` | Garder inchangé |
| Reprendre | `paused` → `in-progress` | Garder inchangé |
| Terminer le job | `in-progress` → `completed` | → `totalSteps` (5) |
| Annuler | → `cancelled` | Garder inchangé |

**Trigger SQL automatique (optionnel mais recommandé) :**

```sql
-- Trigger pour synchroniser status et step
CREATE OR REPLACE FUNCTION sync_job_step_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le job passe à "completed", forcer step au maximum
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.current_step := 5;  -- ou récupérer totalSteps depuis job_type
  END IF;
  
  -- Si le job passe à "in-progress" depuis "pending", mettre step à 1
  IF NEW.status = 'in-progress' AND OLD.status = 'pending' THEN
    NEW.current_step := GREATEST(NEW.current_step, 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_sync_step
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION sync_job_step_on_status_change();
```

---

## 🔄 INTEGRATION FRONTEND

### Quand le frontend appelle l'API PATCH

**Événements qui déclenchent la mise à jour :**

1. **Changement manuel de step** (boutons "Next Step" / "Previous Step")
   ```tsx
   // jobDetails.tsx ligne 340
   const handleStepChange = (newStep: number) => {
       // Appeler l'API
       await updateJobStep(jobId, newStep);
       
       // Mettre à jour le state local
       setJob(prevJob => ({
           ...prevJob,
           step: { ...prevJob.step, actualStep: newStep },
           current_step: newStep
       }));
   };
   ```

2. **Passage automatique au step suivant** (timer)
   ```tsx
   // JobTimerContext - après X minutes
   const goToNextStep = async () => {
       const nextStep = currentStep + 1;
       await updateJobStep(jobId, nextStep);
   };
   ```

3. **Complétion du job** (bouton "Terminer")
   ```tsx
   const handleCompleteJob = async () => {
       // Forcer step au maximum
       await updateJobStep(jobId, totalSteps);
       
       // Mettre status à "completed"
       await updateJobStatus(jobId, 'completed');
   };
   ```

### Service à créer côté frontend

```typescript
// src/services/jobDetails.ts

/**
 * Met à jour le step actuel d'un job
 */
export async function updateJobStep(
  jobId: string, 
  newStep: number
): Promise<{ success: boolean; current_step: number }> {
  
  const response = await authenticatedFetch(
    `${API}/jobs/${jobId}/step`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_step: newStep })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update step: ${response.statusText}`);
  }
  
  return await response.json();
}
```

---

## ✅ CHECKLIST BACKEND

### Phase 1 : Base de données
- [ ] Migration : Ajouter colonne `current_step` à table `jobs`
- [ ] Créer index sur `current_step`
- [ ] Initialiser valeurs existantes (completed = 5, in_progress = 1, else = 0)
- [ ] (Optionnel) Créer trigger de synchronisation status ↔ step

### Phase 2 : API GET
- [ ] Modifier endpoint `GET /jobs/:id` pour inclure `current_step` dans la réponse
- [ ] Tester avec job existant (vérifier que le champ apparaît)
- [ ] Vérifier compatibilité avec anciens clients (pas de breaking change)

### Phase 3 : API PATCH
- [ ] Créer endpoint `PATCH /jobs/:id/step`
- [ ] Validation : step entre 0 et totalSteps
- [ ] Retourner `{ success: true, job: { current_step } }`
- [ ] Logger les changements de step (audit trail)

### Phase 4 : Logique métier
- [ ] Implémenter sync status → step (completed = 5)
- [ ] Implémenter sync step → status (step 5 = completed)
- [ ] Gérer les cas edge (pause, reprise, annulation)

### Phase 5 : Tests
- [ ] Test unitaire : updateJobStep() avec valeurs valides
- [ ] Test unitaire : validation (step négatif, step > max)
- [ ] Test intégration : GET jobs/:id retourne current_step
- [ ] Test intégration : PATCH jobs/:id/step met à jour la DB
- [ ] Test e2e : job completed → current_step = 5

---

## 📊 EXEMPLES DE CAS D'USAGE

### Cas 1 : Job en cours (step intermédiaire)
```json
GET /jobs/JOB-ABC-123
Response:
{
  "job": {
    "id": "JOB-ABC-123",
    "status": "in-progress",
    "current_step": 2,  // En route vers le client
    "total_steps": 5
  }
}
```

### Cas 2 : Job terminé
```json
GET /jobs/JOB-NERD-SCHEDULED-004
Response:
{
  "job": {
    "id": "JOB-NERD-SCHEDULED-004",
    "status": "completed",
    "current_step": 5,  // Dernier step ✅
    "total_steps": 5,
    "endDate": "2025-10-25T16:30:00Z"
  }
}
```

### Cas 3 : Mise à jour du step
```json
PATCH /jobs/JOB-ABC-123/step
Body: { "current_step": 3 }

Response:
{
  "success": true,
  "job": {
    "id": "JOB-ABC-123",
    "current_step": 3,
    "updatedAt": "2025-11-02T14:35:00Z"
  }
}
```

---

## 🚨 POINTS D'ATTENTION

### 1. Rétrocompatibilité
- Les anciens clients qui n'envoient pas `current_step` doivent continuer à fonctionner
- Valeur par défaut : `0` (job pas démarré)

### 2. Gestion des erreurs
```json
// Step invalide (> totalSteps)
PATCH /jobs/JOB-XXX/step
Body: { "current_step": 10 }

Response 400:
{
  "error": "Invalid step",
  "message": "Step must be between 0 and 5",
  "current_step": 2,
  "max_steps": 5
}
```

### 3. Sécurité
- Vérifier que l'utilisateur a le droit de modifier ce job
- Seuls les crew members assignés peuvent changer le step
- Admin peut forcer un step

### 4. Performance
- Index sur `current_step` pour les requêtes de stats
- Éviter les N+1 queries si plusieurs jobs chargés

---

## 📈 MÉTRIQUES À SUIVRE

Après déploiement, monitorer :
- Nombre de jobs avec `current_step = null` (devrait être 0)
- Incohérences : `status = completed` mais `current_step < totalSteps`
- Temps de réponse API GET jobs/:id (pas de régression)
- Taux d'erreur sur PATCH jobs/:id/step

---

## 🔗 LIENS ET RÉFÉRENCES

**Frontend :**
- Interface TypeScript : `src/services/jobDetails.ts` ligne 55 (`JobInfo`)
- Logique de mise à jour : `src/screens/jobDetails.tsx` ligne 340 (`handleStepChange`)
- Affichage : `src/components/JobTimerDisplay.tsx`

**Documents connexes :**
- `API-Doc.md` - Documentation API existante
- `JOB_DETAILS_SYSTEM.md` - Système de détails de job
- `RECAP_FUSION_TIMER_TIMELINE_02NOV2025.md` - Fusion timer/timeline

---

## ❓ QUESTIONS POUR LE BACKEND

1. **Quel est le nom exact de l'endpoint GET pour les détails de job ?**
   - `/jobs/:id` ?
   - `/jobs/details/:id` ?
   - `/api/v1/jobs/:id` ?

2. **Quelle est la structure actuelle de la table `jobs` ?**
   - Avez-vous déjà une colonne `current_step` ?
   - Y a-t-il un champ `job_type` pour déterminer le nombre de steps ?

3. **Comment gérez-vous les steps par type de job ?**
   - Moving = 5 steps
   - Delivery = 3 steps
   - Autre ?

4. **Voulez-vous un trigger automatique ou gérer la sync manuellement ?**
   - Trigger SQL : status → step
   - Logique applicative : controller gère tout

5. **Format de réponse d'erreur préféré ?**
   - `{ error: "...", message: "..." }` ?
   - `{ success: false, error: { code, message } }` ?

---

## 📞 CONTACT

Pour toute question sur cette spécification :
- Frontend Lead : [votre nom]
- Slack : #backend-api-requests
- Priorité : URGENT (bloque validation de jobs terminés)

---

**Version:** 1.0  
**Dernière mise à jour :** 2 novembre 2025

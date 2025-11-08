# 🔧 Modifications Backend - Tracking du Current Step

**Date:** 2 novembre 2025  
**Auteur:** Frontend Team  
**Priorité:** 🔴 CRITIQUE  
**Bug ID:** Job terminé affiche step 3/5 au lieu de 5/5

---

## 📋 CONTEXTE

### Problème actuel
**Job ID:** `JOB-NERD-SCHEDULED-004`  
**Status backend:** `completed` ✅  
**Current step attendu:** `5/5`  
**Current step affiché:** `3/5` ❌

### Cause racine
L'endpoint `GET /swift-app/v1/job/:id` ne retourne **PAS** le champ `current_step`, ce qui force le frontend à utiliser une valeur obsolète stockée localement.

---

## 🎯 MODIFICATIONS REQUISES

### 1️⃣ **BASE DE DONNÉES - Table `jobs`**

#### Migration SQL à exécuter

```sql
-- Ajouter la colonne current_step
ALTER TABLE jobs 
ADD COLUMN current_step INTEGER DEFAULT 0 NOT NULL
COMMENT 'Step actuel du job (0 = pas commencé, 5 = terminé pour un moving job)';

-- Créer un index pour optimiser les requêtes
CREATE INDEX idx_jobs_current_step ON jobs(current_step);

-- Initialiser les valeurs pour les jobs existants
UPDATE jobs 
SET current_step = 
    CASE 
        WHEN status = 'completed' THEN 5
        WHEN status = 'in-progress' OR status = 'paused' THEN 1
        ELSE 0
    END
WHERE current_step = 0;
```

#### Contraintes de la colonne
- **Type:** `INTEGER`
- **NOT NULL:** Oui (avec default 0)
- **Valeurs valides:** `0` à `total_steps` (généralement 5 pour les moving jobs)
- **Default:** `0` (job pas encore démarré)

---

### 2️⃣ **ENDPOINT GET - Ajouter `current_step` dans la réponse**

#### Endpoint concerné
```
GET /swift-app/v1/job/:id
```

#### Modification à apporter

**Réponse ACTUELLE (incomplète) :**
```json
{
  "success": true,
  "job": {
    "id": "JOB-NERD-SCHEDULED-004",
    "title": "Déménagement appartement",
    "description": "...",
    "status": "completed",
    "priority": "medium",
    "createdAt": "2025-10-25T09:00:00Z",
    "scheduledDate": "2025-10-25T09:00:00Z",
    "startDate": "2025-10-25T10:00:00Z",
    "endDate": "2025-10-25T16:30:00Z",
    "pickupAddress": "123 Main St",
    "deliveryAddress": "456 Oak Ave",
    "estimatedDuration": 360,
    "actualDuration": 390,
    "estimatedCost": 450.00,
    "actualCost": 487.50,
    "clientId": "123",
    "createdBy": "456",
    "isArchived": false,
    "isUrgent": false,
    "requiresSignature": true
    // ❌ current_step MANQUANT !
  },
  "client": { ... },
  "crew": [ ... ],
  "trucks": [ ... ],
  "items": [ ... ],
  "notes": [ ... ],
  "timeline": [ ... ],
  "media": [ ... ],
  "addresses": [ ... ]
}
```

**Réponse ATTENDUE (avec current_step) :**
```json
{
  "success": true,
  "job": {
    "id": "JOB-NERD-SCHEDULED-004",
    "title": "Déménagement appartement",
    "description": "...",
    "status": "completed",
    "current_step": 5,  // ← AJOUTER CE CHAMP
    "priority": "medium",
    "createdAt": "2025-10-25T09:00:00Z",
    "scheduledDate": "2025-10-25T09:00:00Z",
    "startDate": "2025-10-25T10:00:00Z",
    "endDate": "2025-10-25T16:30:00Z",
    // ... autres champs identiques
  },
  // ... autres sections identiques
}
```

#### Code backend à modifier

**Fichier probablement concerné :** `endPoints/v1/job.js` ou similaire

**Modification SQL :**
```javascript
// Avant (exemple)
const jobQuery = `
  SELECT 
    id, title, description, status, priority,
    created_at, scheduled_date, start_date, end_date,
    pickup_address, delivery_address,
    estimated_duration, actual_duration,
    estimated_cost, actual_cost,
    client_id, created_by,
    is_archived, is_urgent, requires_signature
  FROM jobs
  WHERE id = ?
`;

// Après (AJOUTER current_step)
const jobQuery = `
  SELECT 
    id, title, description, status, priority,
    current_step,  -- ← AJOUTER ICI
    created_at, scheduled_date, start_date, end_date,
    pickup_address, delivery_address,
    estimated_duration, actual_duration,
    estimated_cost, actual_cost,
    client_id, created_by,
    is_archived, is_urgent, requires_signature
  FROM jobs
  WHERE id = ?
`;
```

**Mapping dans la réponse :**
```javascript
// S'assurer que current_step est inclus dans l'objet job
const job = {
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  current_step: row.current_step,  // ← AJOUTER ICI
  // ... reste des champs
};
```

---

### 3️⃣ **ENDPOINT PATCH - Mettre à jour le step**

#### Nouvel endpoint à créer
```
PATCH /swift-app/v1/job/:id/step
```

#### Spécifications

**Headers requis :**
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Body attendu :**
```json
{
  "current_step": 3
}
```

**Validations backend :**
1. ✅ Token JWT valide
2. ✅ Job existe
3. ✅ Utilisateur a les droits (assigné au job ou admin)
4. ✅ `current_step` est un entier entre 0 et 5 (ou total_steps du job type)
5. ✅ Si step = 5 (max) → mettre automatiquement `status = 'completed'`

**Réponse succès (200) :**
```json
{
  "success": true,
  "job": {
    "id": "JOB-ABC-123",
    "current_step": 3,
    "status": "in-progress",
    "updated_at": "2025-11-02T14:35:00Z"
  }
}
```

**Réponses d'erreur :**

```json
// 400 - Step invalide (> max)
{
  "success": false,
  "error": "Invalid step",
  "message": "Step must be between 0 and 5",
  "current_step": 3,
  "max_steps": 5
}

// 401 - Non autorisé
{
  "success": false,
  "error": "Unauthorized",
  "message": "You are not authorized to modify this job"
}

// 404 - Job inexistant
{
  "success": false,
  "error": "Not found",
  "message": "Job not found"
}
```

#### Pseudo-code de l'implémentation

```javascript
// endPoints/v1/job-step.js (à créer)

router.patch('/v1/job/:id/step', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { current_step } = req.body;
    const userId = req.user.id; // Depuis le JWT
    
    // 1. Valider le step
    if (!Number.isInteger(current_step) || current_step < 0 || current_step > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid step',
        message: 'Step must be between 0 and 5',
        max_steps: 5
      });
    }
    
    // 2. Vérifier que le job existe
    const jobQuery = 'SELECT * FROM jobs WHERE id = ?';
    const [job] = await db.query(jobQuery, [id]);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Job not found'
      });
    }
    
    // 3. Vérifier les permissions (optionnel)
    // const isAssigned = await checkUserAssignedToJob(userId, id);
    // if (!isAssigned && !req.user.isAdmin) {
    //   return res.status(401).json({ ... });
    // }
    
    // 4. Déterminer le nouveau status
    let newStatus = job.status;
    if (current_step === 5 && job.status !== 'completed') {
      newStatus = 'completed';
    } else if (current_step === 1 && job.status === 'pending') {
      newStatus = 'in-progress';
    }
    
    // 5. Mettre à jour la DB
    const updateQuery = `
      UPDATE jobs 
      SET current_step = ?, 
          status = ?,
          updated_at = NOW()
      WHERE id = ?
    `;
    await db.query(updateQuery, [current_step, newStatus, id]);
    
    // 6. Retourner la réponse
    return res.status(200).json({
      success: true,
      job: {
        id: id,
        current_step: current_step,
        status: newStatus,
        updated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error updating job step:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to update job step'
    });
  }
});
```

---

### 4️⃣ **LOGIQUE DE SYNCHRONISATION status ↔ step**

#### Règles métier à implémenter

| Événement | Action sur `status` | Action sur `current_step` |
|-----------|-------------------|-------------------------|
| **Créer un job** | `pending` | `0` |
| **Démarrer un job** (`POST /job/:id/start`) | `pending` → `in-progress` | `0` → `1` |
| **Changer de step** (`PATCH /job/:id/step`) | Garder (sauf si step=5) | Valeur fournie |
| **Atteindre step final** (step = 5) | `in-progress` → `completed` | `5` |
| **Mettre en pause** (`POST /job/:id/pause`) | `in-progress` → `paused` | Garder inchangé |
| **Reprendre** (`POST /job/:id/resume`) | `paused` → `in-progress` | Garder inchangé |
| **Terminer manuellement** (`POST /job/:id/complete`) | → `completed` | → `5` (forcer) |
| **Annuler** (`DELETE /job/:id` ou cancel) | → `cancelled` | Garder inchangé |

#### Modifications des endpoints existants

**1. POST /swift-app/v1/job/:id/start**
```javascript
// Ajouter la mise à jour du step
UPDATE jobs 
SET status = 'in-progress',
    current_step = 1,  -- ← AJOUTER
    start_date = NOW(),
    updated_at = NOW()
WHERE id = ?
```

**2. POST /swift-app/v1/job/:id/complete**
```javascript
// Forcer le step au maximum
UPDATE jobs 
SET status = 'completed',
    current_step = 5,  -- ← AJOUTER
    end_date = NOW(),
    updated_at = NOW()
WHERE id = ?
```

**3. POST /swift-app/v1/job/:id/pause**
```javascript
// Le step ne change pas lors de la pause
UPDATE jobs 
SET status = 'paused',
    -- current_step reste inchangé
    updated_at = NOW()
WHERE id = ?
```

**4. POST /swift-app/v1/job/:id/resume**
```javascript
// Le step ne change pas lors de la reprise
UPDATE jobs 
SET status = 'in-progress',
    -- current_step reste inchangé
    updated_at = NOW()
WHERE id = ?
```

---

### 5️⃣ **TRIGGER SQL (Optionnel - Recommandé)**

#### Synchronisation automatique status → step

```sql
DELIMITER //

CREATE TRIGGER sync_job_step_on_status_change
BEFORE UPDATE ON jobs
FOR EACH ROW
BEGIN
  -- Si le job passe à "completed", forcer le step au max
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SET NEW.current_step = 5;
    SET NEW.end_date = NOW();
  END IF;
  
  -- Si le job passe à "in-progress" depuis "pending", mettre step à 1
  IF NEW.status = 'in-progress' AND OLD.status = 'pending' THEN
    SET NEW.current_step = GREATEST(NEW.current_step, 1);
    SET NEW.start_date = NOW();
  END IF;
  
  -- Si on atteint le step 5, passer en completed automatiquement
  IF NEW.current_step = 5 AND NEW.status != 'completed' THEN
    SET NEW.status = 'completed';
    SET NEW.end_date = NOW();
  END IF;
END//

DELIMITER ;
```

**Avantages du trigger :**
- ✅ Garantit la cohérence status ↔ step
- ✅ Pas besoin de dupliquer la logique dans chaque endpoint
- ✅ Protection contre les incohérences

**Inconvénient :**
- ⚠️ Logique métier dans la DB (peut compliquer le debugging)

**Alternative sans trigger :**
- Créer une fonction utilitaire backend `syncJobStatusAndStep(jobId)` appelée après chaque modification

---

## ✅ CHECKLIST BACKEND

### Phase 1 : Base de données ⏱️ 15 min
- [ ] **Migration :** Exécuter le script SQL pour ajouter `current_step`
- [ ] **Index :** Créer l'index sur `current_step`
- [ ] **Initialisation :** Mettre à jour les jobs existants (completed=5, in_progress=1, else=0)
- [ ] **Trigger (optionnel) :** Créer le trigger de synchronisation

### Phase 2 : Endpoint GET ⏱️ 10 min
- [ ] **Modifier la requête SQL** : Ajouter `current_step` dans le SELECT
- [ ] **Mapper la réponse** : Inclure `current_step` dans l'objet job JSON
- [ ] **Tester** : Appeler `GET /v1/job/:id` et vérifier que le champ apparaît

### Phase 3 : Endpoint PATCH ⏱️ 30 min
- [ ] **Créer le fichier** : `endPoints/v1/job-step.js` (ou ajouter la route)
- [ ] **Validation** : Vérifier step entre 0 et 5
- [ ] **Permissions** : Vérifier que l'utilisateur peut modifier ce job
- [ ] **Synchronisation** : Si step=5 → status='completed'
- [ ] **Réponse** : Retourner `{ success, job: { id, current_step, status, updated_at } }`

### Phase 4 : Endpoints existants ⏱️ 20 min
- [ ] **POST /job/:id/start** : Ajouter `current_step = 1`
- [ ] **POST /job/:id/complete** : Ajouter `current_step = 5`
- [ ] **POST /job/:id/pause** : Garder current_step inchangé
- [ ] **POST /job/:id/resume** : Garder current_step inchangé

### Phase 5 : Tests ⏱️ 30 min
- [ ] **Test unitaire** : Validation step (valide, invalide, négatif, > max)
- [ ] **Test GET** : Vérifier que current_step apparaît dans la réponse
- [ ] **Test PATCH** : Mettre à jour step et vérifier DB
- [ ] **Test sync** : Step 5 → status completed (et inverse)
- [ ] **Test permissions** : Utilisateur non assigné ne peut pas modifier

### Phase 6 : Documentation ⏱️ 10 min
- [ ] **Mettre à jour API-Doc.md** : Ajouter le nouveau champ + endpoint PATCH
- [ ] **Changelog** : Documenter les modifications
- [ ] **Tests Postman** : Ajouter les exemples de requêtes

---

## 📊 EXEMPLES DE REQUÊTES

### Exemple 1 : GET job avec current_step

```bash
curl -X GET "https://altivo.fr/swift-app/v1/job/JOB-NERD-SCHEDULED-004" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "success": true,
  "job": {
    "id": "JOB-NERD-SCHEDULED-004",
    "status": "completed",
    "current_step": 5,
    "title": "Déménagement appartement",
    // ... autres champs
  }
}
```

### Exemple 2 : PATCH step d'un job en cours

```bash
curl -X PATCH "https://altivo.fr/swift-app/v1/job/JOB-ABC-123/step" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}'
```

**Réponse attendue :**
```json
{
  "success": true,
  "job": {
    "id": "JOB-ABC-123",
    "current_step": 3,
    "status": "in-progress",
    "updated_at": "2025-11-02T14:35:00.000Z"
  }
}
```

### Exemple 3 : PATCH step au max (auto-complete)

```bash
curl -X PATCH "https://altivo.fr/swift-app/v1/job/JOB-ABC-123/step" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"current_step": 5}'
```

**Réponse attendue :**
```json
{
  "success": true,
  "job": {
    "id": "JOB-ABC-123",
    "current_step": 5,
    "status": "completed",  // ← Changé automatiquement
    "updated_at": "2025-11-02T14:35:00.000Z"
  }
}
```

### Exemple 4 : Erreur - step invalide

```bash
curl -X PATCH "https://altivo.fr/swift-app/v1/job/JOB-ABC-123/step" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"current_step": 10}'
```

**Réponse attendue (400) :**
```json
{
  "success": false,
  "error": "Invalid step",
  "message": "Step must be between 0 and 5",
  "current_step": 3,
  "max_steps": 5
}
```

---

## 🔗 INTÉGRATION FRONTEND

### Interface TypeScript (déjà en place)

```typescript
// src/services/jobDetails.ts
export interface JobInfo {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'paused' | 'completed' | 'cancelled';
  current_step: number;  // ← Champ à ajouter dans l'interface
  priority: 'low' | 'medium' | 'high' | 'urgent';
  // ... autres champs existants
}
```

### Service d'update à créer

```typescript
// src/services/jobDetails.ts (à ajouter)

/**
 * Met à jour le step actuel d'un job
 */
export async function updateJobStep(
  jobId: string, 
  newStep: number
): Promise<{ success: boolean; job: any }> {
  
  const response = await authenticatedFetch(
    `${API}/v1/job/${jobId}/step`,
    {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ current_step: newStep })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update step');
  }
  
  return await response.json();
}
```

### Utilisation dans jobDetails.tsx

```typescript
// src/screens/jobDetails.tsx (ligne 340 - déjà en place)

const handleStepChange = async (newStep: number) => {
  jobDetailsLogger.stepChange(newStep);
  
  try {
    // ✅ Appeler l'API backend
    const response = await updateJobStep(job.id, newStep);
    
    // ✅ Mettre à jour le state local avec la réponse
    setJob((prevJob: any) => ({
      ...prevJob,
      step: {
        ...prevJob.step,
        actualStep: response.job.current_step
      },
      current_step: response.job.current_step,
      status: response.job.status  // Status peut changer si step = 5
    }));
    
    showToast('Step mis à jour avec succès', 'success');
    
  } catch (error) {
    console.error('Erreur mise à jour step:', error);
    showToast('Erreur lors de la mise à jour du step', 'error');
  }
};
```

---

## 🚨 POINTS D'ATTENTION

### 1. Rétrocompatibilité
- ✅ Anciens clients qui ne gèrent pas `current_step` continuent de fonctionner
- ✅ Valeur par défaut `0` pour les nouveaux jobs
- ✅ Migration des jobs existants via le script SQL

### 2. Types de jobs
Si différents types de jobs ont des nombres de steps différents :
```sql
-- Option : Ajouter une colonne job_type et total_steps
ALTER TABLE jobs ADD COLUMN job_type VARCHAR(50) DEFAULT 'moving';
ALTER TABLE jobs ADD COLUMN total_steps INTEGER DEFAULT 5;

-- Adapter la validation
-- Pour un delivery job : total_steps = 3
-- Pour un moving job : total_steps = 5
```

### 3. Performance
- ✅ Index sur `current_step` pour les requêtes de stats
- ✅ Pas de requêtes N+1 si liste de jobs
- ✅ Cache frontend pour éviter les appels répétés

### 4. Sécurité
- ✅ Vérifier JWT token sur endpoint PATCH
- ✅ Vérifier que l'utilisateur est assigné au job
- ✅ Admin peut forcer n'importe quel step

---

## 📈 MÉTRIQUES POST-DÉPLOIEMENT

À monitorer après le déploiement :
- **Incohérences** : Jobs avec `status = completed` mais `current_step < 5`
- **Erreurs API** : Taux d'erreur sur `PATCH /job/:id/step`
- **Performance** : Temps de réponse `GET /job/:id` (pas de régression)
- **Utilisation** : Nombre de fois où le step est mis à jour par job

---

## 📞 CONTACT & QUESTIONS

### Questions ouvertes pour le backend :

1. **Localisation du code :**
   - Quel est le fichier exact pour `GET /v1/job/:id` ? (`endPoints/v1/job.js` ?)
   - Où créer le nouveau `PATCH /v1/job/:id/step` ?

2. **Base de données :**
   - Confirmez-vous que la table s'appelle bien `jobs` ?
   - Quel est le type de base de données ? (MySQL, PostgreSQL, autre ?)

3. **Trigger ou logique applicative :**
   - Préférez-vous un trigger SQL automatique ou gérer la sync dans le code ?

4. **Types de jobs :**
   - Y a-t-il différents types de jobs avec des nombres de steps différents ?
   - Si oui, où est stockée cette information ?

5. **Tests :**
   - Y a-t-il une suite de tests backend existante ?
   - Souhaitez-vous des tests Postman ou des tests unitaires ?

---

**Prochaine étape :** Une fois ces modifications backend déployées, le frontend pourra :
1. Afficher le step correct pour les jobs terminés (5/5 au lieu de 3/5)
2. Mettre à jour le step en temps réel via `PATCH /job/:id/step`
3. Synchroniser automatiquement le status quand step = 5

**Délai estimé backend :** 2-3 heures (dev + tests)  
**Délai estimé frontend :** 30 minutes (intégration du nouveau service)

---

**Version:** 1.0  
**Dernière mise à jour :** 2 novembre 2025

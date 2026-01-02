# 🔧 TÂCHES BACKEND - SWIFT APP
> Document généré le 2 janvier 2026  
> À destination du développeur backend

---

## 📋 RÉSUMÉ EXÉCUTIF

Ce document contient **toutes les tâches backend** nécessaires pour le bon fonctionnement de l'application mobile SwiftApp. Les tâches sont classées par **priorité** (🔴 Critique → 🟢 Basse).

**Estimation totale** : ~40-50 heures de travail

---

# 🔴 PRIORITÉ CRITIQUE - Bugs Bloquants

Ces bugs empêchent le workflow complet des jobs dans l'application mobile.

---

## 1. Bug MySQL - pool.execute() ne fonctionne pas

### Symptôme
Les endpoints retournent des erreurs 500 avec message lié à `pool.execute()`.

### Diagnostic à faire
```bash
# Vérifier quelle lib MySQL est installée
cat package.json | grep mysql
```

### Solution A (si mysql classique)
Remplacer tous les `pool.execute()` par `pool.query()` :
```javascript
// ❌ Avant
const [rows] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [jobId]);

// ✅ Après
const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
```

### Solution B (préférée)
Installer `mysql2` qui supporte `execute()` :
```bash
npm install mysql2
```
Et importer :
```javascript
const mysql = require('mysql2/promise');
```

### Test de validation
```bash
curl -X POST http://api.example.com/swift-app/v1/job/2/start \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Doit retourner 200 OK (pas 500)
```

---

## 2. Bug Advance Step - Restriction de séquence

### Symptôme
L'endpoint `POST /job/:id/advance-step` refuse les sauts de steps.  
Exemple : on ne peut pas passer de step 1 à step 3 directement.

### Comportement actuel (problématique)
```
Request: { "current_step": 3 }
Response: 400 Bad Request - "Invalid step progression"
```

### Comportement attendu
L'app doit pouvoir définir n'importe quelle valeur de step (0-5) sans restriction.

### Fichiers à modifier
Chercher le handler de l'endpoint :
```bash
grep -r "advance-step" ./routes/
grep -r "advance-step" ./controllers/
```

### Code à modifier
```javascript
// ❌ Supprimer cette validation
if (new_step !== current_step + 1) {
  return res.status(400).json({ error: 'Invalid step progression' });
}

// ✅ Garder seulement la validation de range
if (new_step < 0 || new_step > 5) {
  return res.status(400).json({ error: 'Step must be between 0 and 5' });
}
```

### Test de validation
```bash
# Doit fonctionner même si le job est à step 1
curl -X POST http://api.example.com/swift-app/v1/job/2/advance-step \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_step": 3}'

# Doit retourner 200 OK
```

---

## 3. Bug Complete Job - Step 99

### Symptôme
Quand un job est complété, le `current_step` est forcé à 99 en base de données.  
Cela casse la logique de l'app qui attend une valeur 0-5.

### Comportement actuel (problématique)
```sql
-- Requête actuelle
UPDATE jobs SET status = 'completed', current_step = 99 WHERE id = ?
```

### Comportement attendu
```sql
-- Requête correcte : ne pas modifier current_step
UPDATE jobs SET status = 'completed' WHERE id = ?
-- Ou préserver la valeur actuelle (généralement 5)
```

### Fichiers à modifier
```bash
grep -r "current_step.*99" ./
grep -r "/complete" ./routes/
```

### Code à modifier
```javascript
// ❌ Avant
await pool.query(
  'UPDATE jobs SET status = ?, current_step = 99 WHERE id = ?',
  ['completed', jobId]
);

// ✅ Après - Préserver le current_step
await pool.query(
  'UPDATE jobs SET status = ? WHERE id = ?',
  ['completed', jobId]
);
```

### Test de validation
```bash
# 1. Récupérer le step actuel d'un job
curl http://api.example.com/swift-app/v1/job/2 \
  -H "Authorization: Bearer TOKEN"
# Note: current_step = 4 ou 5

# 2. Compléter le job
curl -X POST http://api.example.com/swift-app/v1/job/2/complete \
  -H "Authorization: Bearer TOKEN"

# 3. Vérifier que current_step est TOUJOURS 4 ou 5 (PAS 99)
curl http://api.example.com/swift-app/v1/job/2 \
  -H "Authorization: Bearer TOKEN"
```

---

# 🟠 PRIORITÉ HAUTE - Nouvelles Fonctionnalités

Ces fonctionnalités sont nécessaires pour la synchronisation app/backend.

---

## 4. Ajouter `current_step` dans la réponse API

### Contexte
L'app mobile gère localement le `current_step` mais doit pouvoir le synchroniser avec le backend.

### Modification GET /job/:id
```javascript
// Ajouter dans la réponse JSON
{
  "job": {
    "id": 123,
    "status": "in-progress",
    "current_step": 3,  // ← AJOUTER CE CHAMP
    // ... autres champs
  }
}
```

### Migration BDD (si colonne n'existe pas)
```sql
-- Ajouter la colonne
ALTER TABLE jobs ADD COLUMN current_step INTEGER DEFAULT 0;

-- Créer index pour performance
CREATE INDEX idx_jobs_current_step ON jobs(current_step);

-- Initialiser les valeurs existantes
UPDATE jobs SET current_step = 5 WHERE status = 'completed';
UPDATE jobs SET current_step = 1 WHERE status = 'in-progress';
UPDATE jobs SET current_step = 0 WHERE status NOT IN ('completed', 'in-progress');
```

---

## 5. Endpoint PUT /job/:id/step

### Objectif
Permettre à l'app de synchroniser le step actuel vers le backend.

### Spécification
```
PUT /swift-app/v1/job/:id/step
Content-Type: application/json
Authorization: Bearer TOKEN

Request Body:
{
  "current_step": 3
}

Response 200:
{
  "success": true,
  "job": {
    "id": 123,
    "current_step": 3
  }
}

Response 400:
{
  "error": "current_step must be between 0 and 5"
}
```

### Implémentation suggérée
```javascript
router.put('/job/:id/step', authenticate, async (req, res) => {
  const { id } = req.params;
  const { current_step } = req.body;
  
  // Validation
  if (current_step < 0 || current_step > 5) {
    return res.status(400).json({ 
      error: 'current_step must be between 0 and 5' 
    });
  }
  
  // Update
  await pool.query(
    'UPDATE jobs SET current_step = ? WHERE id = ?',
    [current_step, id]
  );
  
  // Log pour audit
  await pool.query(
    'INSERT INTO job_step_history (job_id, step, changed_at) VALUES (?, ?, NOW())',
    [id, current_step]
  );
  
  return res.json({ 
    success: true, 
    job: { id, current_step } 
  });
});
```

---

## 6. Endpoint Timer Sync

### Objectif
Synchroniser les données du timer de l'app vers le backend.

### Colonnes à ajouter (table jobs)
```sql
ALTER TABLE jobs ADD COLUMN timer_total_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN timer_billable_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN timer_break_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN timer_is_running BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN timer_started_at TIMESTAMP NULL;
ALTER TABLE jobs ADD COLUMN timer_last_updated TIMESTAMP NULL;
```

### Spécification endpoint
```
POST /swift-app/v1/job/:id/sync-timer
Content-Type: application/json
Authorization: Bearer TOKEN

Request Body:
{
  "total_hours": 2.5,
  "billable_hours": 2.0,
  "break_hours": 0.5,
  "is_running": true,
  "started_at": "2026-01-02T10:00:00Z"
}

Response 200:
{
  "success": true,
  "timer": {
    "total_hours": 2.5,
    "billable_hours": 2.0,
    "synced_at": "2026-01-02T12:30:00Z"
  }
}
```

---

# 🟡 PRIORITÉ MOYENNE - Stripe & Paiements

---

## 7. Endpoints Stripe Paiements

### POST /api/stripe/create-payment-intent
```javascript
// Créer une intention de paiement
Request: { 
  amount: 15000,  // en centimes (150.00€)
  currency: "eur",
  job_id: 123,
  customer_email: "client@example.com"
}

Response: {
  client_secret: "pi_xxx_secret_xxx",
  payment_intent_id: "pi_xxx"
}
```

### POST /api/stripe/confirm-payment
```javascript
// Confirmer un paiement réussi côté backend
Request: { 
  payment_intent_id: "pi_xxx",
  job_id: 123
}

Response: {
  success: true,
  job_status: "paid"
}
```

### GET /api/stripe/payment-status/:id
```javascript
// Vérifier le statut d'un paiement
Response: {
  status: "succeeded", // succeeded | pending | failed
  amount: 15000,
  created_at: "2026-01-02T12:00:00Z"
}
```

---

## 8. Endpoints Stripe Factures

### POST /api/stripe/create-invoice
```javascript
Request: {
  job_id: 123,
  customer_id: "cus_xxx",
  items: [
    { description: "Service XYZ", amount: 15000 }
  ]
}
```

### GET /api/stripe/invoices
```javascript
// Lister factures avec pagination
Query: ?page=1&limit=20&status=paid

Response: {
  invoices: [...],
  total: 50,
  page: 1
}
```

### POST /api/stripe/send-invoice
```javascript
Request: { 
  invoice_id: "in_xxx" 
}
// Envoie par email au client
```

---

## 9. Endpoints Remboursements

### POST /api/stripe/refund/:payment_id
```javascript
Request: {
  amount: 5000,  // Remboursement partiel (optionnel)
  reason: "customer_request"
}

Response: {
  refund_id: "re_xxx",
  status: "succeeded"
}
```

---

# 🟢 PRIORITÉ BASSE - Staff & Photos API

---

## 10. Staff Management API

### GET /api/staff
```javascript
// Lister tous les employés de l'entreprise
Response: {
  staff: [
    { id: 1, name: "John", role: "employee", status: "active" },
    { id: 2, name: "Jane", role: "contractor", status: "active" }
  ]
}
```

### POST /api/staff/invite
```javascript
Request: {
  email: "new@employee.com",
  role: "employee",
  permissions: ["jobs:view", "jobs:edit"]
}
// Envoie un email d'invitation
```

### POST /api/staff/contractor
```javascript
Request: {
  name: "Contractor Inc.",
  email: "contractor@example.com",
  phone: "+33612345678"
}
```

---

## 11. Photos API (déjà implémenté ? À vérifier)

### GET /swift-app/v1/job/:jobId/images
```javascript
Response: {
  images: [
    { 
      id: 1, 
      filename: "photo1.jpg", 
      url: "https://...",
      description: "Photo avant travaux",
      created_at: "2026-01-02T10:00:00Z"
    }
  ]
}
```

### POST /swift-app/v1/job/:jobId/image
```javascript
// Multipart form-data
// file: <binary>
// description: "Photo après travaux"

Response: {
  id: 2,
  filename: "photo2.jpg",
  url: "https://..."
}
```

### PATCH /swift-app/v1/image/:id
```javascript
Request: { description: "Nouvelle description" }
```

---

# 📊 RÉCAPITULATIF PAR PRIORITÉ

| Priorité | Tâche | Estimation |
|----------|-------|------------|
| 🔴 CRITIQUE | Bug MySQL pool.execute() | 1-2h |
| 🔴 CRITIQUE | Bug Advance Step restriction | 1h |
| 🔴 CRITIQUE | Bug Complete Job step=99 | 1h |
| 🟠 HAUTE | Ajouter current_step dans GET /job/:id | 2h |
| 🟠 HAUTE | Créer PUT /job/:id/step | 2h |
| 🟠 HAUTE | Endpoint Timer Sync | 3-4h |
| 🟡 MOYENNE | Stripe create-payment-intent | 3h |
| 🟡 MOYENNE | Stripe confirm-payment | 2h |
| 🟡 MOYENNE | Stripe payment-status | 1h |
| 🟡 MOYENNE | Stripe invoices (3 endpoints) | 4h |
| 🟡 MOYENNE | Stripe refunds | 2h |
| 🟢 BASSE | Staff API (5 endpoints) | 4-6h |
| 🟢 BASSE | Photos API (vérification) | 2h |

**Total estimé : 28-35 heures**

---

# ✅ CHECKLIST DE VALIDATION

Une fois les corrections effectuées, merci de confirmer :

## Bugs Critiques
- [ ] `POST /job/:id/start` retourne 200 OK
- [ ] `POST /job/:id/advance-step` accepte les sauts de step
- [ ] `POST /job/:id/complete` ne met pas current_step à 99

## Nouvelles Features
- [ ] GET /job/:id retourne `current_step` dans la réponse
- [ ] PUT /job/:id/step fonctionne
- [ ] POST /job/:id/sync-timer fonctionne

## Stripe
- [ ] create-payment-intent fonctionne en mode test
- [ ] confirm-payment met à jour le statut job

---

# 📞 CONTACT

Pour toute question sur ce document :
- **Frontend** : [équipe frontend]
- **Référence** : MASTER_TASKS.md (swift-app repo)

---

*Document généré automatiquement depuis MASTER_TASKS.md*

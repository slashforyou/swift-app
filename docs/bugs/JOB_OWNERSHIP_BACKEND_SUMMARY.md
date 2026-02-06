# 🔧 Job Ownership - Résumé Technique pour Backend

**Date:** Janvier 2026  
**Statut Backend:** ✅ PRÊT (confirmé)  
**Statut Frontend:** ✅ INTÉGRATION TERMINÉE

---

## 📋 Modifications Frontend Réalisées

### 1. Types TypeScript Enrichis

**Fichier:** `src/services/jobs.ts`

```typescript
interface JobAPI {
  // Nouveaux statuts
  status:
    | "pending"
    | "assigned"
    | "accepted"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "declined";
  assignment_status?: "none" | "pending" | "accepted" | "declined";

  // Ownership
  contractee?: {
    company_id: number;
    company_name: string;
    created_by_name: string;
    stripe_account_id?: string;
  };

  contractor?: {
    company_id: number;
    company_name: string;
    assigned_staff_name?: string;
    assigned_at?: string;
  };

  // Permissions
  permissions?: {
    is_owner: boolean;
    is_assigned: boolean;
    can_accept: boolean;
    can_decline: boolean;
    can_start: boolean;
    can_complete: boolean;
    can_edit: boolean;
  };
}
```

### 2. Nouveaux Endpoints Consommés

```typescript
// POST /v1/jobs/{id}/accept
acceptJob(jobId: string, notes?: string): Promise<void>

// POST /v1/jobs/{id}/decline
declineJob(jobId: string, reason: string): Promise<void>
```

### 3. Composants UI

- **JobOwnershipBanner** - Affiche la propriété (contractee vs contractor)
- **JobAssignmentActions** - Boutons Accept/Decline avec modals

### 4. Intégration JobDetails

- Bannière d'ownership affichée si `job.contractee` existe
- Boutons accept/decline affichés si `job.permissions.can_accept || can_decline`
- Handlers qui appellent les endpoints et rafraîchissent les données

---

## 🎯 Ce Que le Backend Doit Retourner

### GET /v1/jobs/{id} - Réponse Attendue

```json
{
  "id": 123,
  "code": "JOB-2026-001",
  "status": "assigned",
  "assignment_status": "pending",

  "contractee": {
    "company_id": 1,
    "company_name": "Entreprise Créatrice",
    "created_by_name": "John Doe",
    "stripe_account_id": "acct_123"
  },

  "contractor": {
    "company_id": 2,
    "company_name": "Entreprise Exécutante",
    "assigned_staff_name": "Jane Smith",
    "assigned_at": "2026-01-15T10:30:00Z"
  },

  "permissions": {
    "is_owner": false,
    "is_assigned": true,
    "can_accept": true,
    "can_decline": true,
    "can_start": false,
    "can_complete": false,
    "can_edit": false
  }
}
```

**Règles de permissions:**

- `can_accept = true` ⟺ `is_assigned && assignment_status === 'pending'`
- `can_decline = true` ⟺ `is_assigned && assignment_status === 'pending'`
- `can_start = true` ⟺ `(is_owner || is_assigned) && assignment_status !== 'pending'`

### POST /v1/jobs/{id}/accept

**Request:**

```json
{
  "notes": "Optional acceptance message"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Job accepted successfully",
  "job": {
    "status": "accepted",
    "assignment_status": "accepted",
    "permissions": {
      "can_accept": false,
      "can_decline": false,
      "can_start": true
    }
  }
}
```

**Effet attendu:**

- `assignment_status` → 'accepted'
- `status` → 'accepted'
- `assignment_responded_at` → timestamp actuel
- Permissions mises à jour

### POST /v1/jobs/{id}/decline

**Request:**

```json
{
  "reason": "Raison du refus (10-500 caractères)" // REQUIS
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Job declined successfully",
  "job": {
    "status": "declined",
    "assignment_status": "declined",
    "declined_reason": "...",
    "declined_at": "2026-01-15T11:00:00Z",
    "permissions": {
      "is_assigned": false
    }
  }
}
```

**Effet attendu:**

- `assignment_status` → 'declined'
- `status` → 'declined' (ou 'pending' si vous préférez le rendre réassignable)
- `declined_reason` → sauvegardé en BDD
- `declined_at` → timestamp actuel
- `permissions.is_assigned` → false (le job n'apparaît plus pour le contractor)

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CRÉATION (Entreprise A)                                 │
│    status = 'pending'                                       │
│    assignment_status = 'none'                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ASSIGNATION à Entreprise B                              │
│    status = 'assigned'                                      │
│    assignment_status = 'pending'                            │
│    contractee.company_id = 1 (Entreprise A)                │
│    contractor.company_id = 2 (Entreprise B)                │
│    permissions.can_accept = true                            │
│    permissions.can_decline = true                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│ 3a. ACCEPTATION          │  │ 3b. REFUS                │
│ POST /accept             │  │ POST /decline            │
│ status = 'accepted'      │  │ status = 'declined'      │
│ assignment_status =      │  │ assignment_status =      │
│   'accepted'             │  │   'declined'             │
│ can_accept = false       │  │ is_assigned = false      │
│ can_decline = false      │  │                          │
│ can_start = true         │  │ Job retiré de la liste   │
└──────────────────────────┘  └──────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. DÉMARRAGE                                                │
│    status = 'in-progress'                                   │
└─────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. COMPLÉTION                                               │
│    status = 'completed'                                     │
│    Paiement envoyé à contractee.stripe_account_id           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Backend

### Structure de Données

- [ ] Champs BDD: `contractee_company_id`, `contractor_company_id`, `assignment_status` ENUM
- [ ] Champs BDD: `assigned_at`, `assignment_responded_at`, `declined_reason`, `declined_at`
- [ ] Index sur `contractor_company_id`, `assignment_status`

### Endpoints

- [ ] GET /v1/jobs/{id} retourne ownership + permissions
- [ ] POST /v1/jobs/{id}/accept fonctionne
- [ ] POST /v1/jobs/{id}/decline fonctionne
- [ ] Validation: reason min 10 caractères pour /decline

### Logique

- [ ] Calcul automatique des permissions selon is_owner/is_assigned/statuts
- [ ] Auto-acceptation si même entreprise (assignment_status = 'none')
- [ ] Notifications (optionnel): assignation, acceptation, refus

### Tests

- [ ] Test unitaire: GET /jobs/{id} avec ownership
- [ ] Test unitaire: POST /accept change les statuts
- [ ] Test unitaire: POST /decline avec raison
- [ ] Test intégration: Workflow complet A → B → accept

---

## 🧪 Scénarios de Test

### Test 1: Même Entreprise (Auto-Accept)

```
1. User A (Entreprise 1) crée un job
2. User A assigne à User B (aussi Entreprise 1)
3. Backend doit retourner:
   - assignment_status = 'none'
   - contractee.company_id === contractor.company_id
   - Frontend ne montre PAS de bannière d'ownership
   - Pas de boutons accept/decline
```

### Test 2: Entreprise Différente (Manual Accept)

```
1. User A (Entreprise 1) crée un job
2. User A assigne à User B (Entreprise 2)
3. Backend doit retourner:
   - status = 'assigned'
   - assignment_status = 'pending'
   - contractee.company_id = 1
   - contractor.company_id = 2
   - permissions.can_accept = true
   - permissions.can_decline = true
4. Frontend montre bannière + 2 boutons
```

### Test 3: Acceptation

```
1. Depuis Test 2, User B clique "Accepter"
2. Frontend POST /v1/jobs/{id}/accept
3. Backend doit:
   - Mettre assignment_status = 'accepted'
   - Mettre status = 'accepted'
   - Mettre assignment_responded_at = NOW()
   - Retourner permissions.can_accept = false, can_decline = false
4. Frontend rafraîchit:
   - Bannière badge devient "ACCEPTÉ" (vert)
   - Boutons accept/decline cachés
```

### Test 4: Refus

```
1. User B clique "Refuser"
2. Modal demande une raison (min 10 chars)
3. Frontend POST /v1/jobs/{id}/decline avec { reason }
4. Backend doit:
   - Mettre assignment_status = 'declined'
   - Mettre status = 'declined'
   - Sauvegarder declined_reason
   - Mettre declined_at = NOW()
   - Retourner permissions.is_assigned = false
5. Frontend:
   - Toast "Job refusé"
   - Navigation retour (job retiré de la liste)
```

### Test 5: Créateur Après Refus

```
1. User A (créateur) consulte le job refusé
2. Backend doit retourner:
   - status = 'declined' (ou 'pending' si réassignable)
   - assignment_status = 'declined'
   - declined_reason visible
   - permissions.is_owner = true
   - permissions.can_edit = true (peut réassigner)
```

---

## 🔗 Liens Documentation

- **Intégration complète:** `docs/bugs/JOB_OWNERSHIP_INTEGRATION_COMPLETE.md`
- **Spécifications backend:** `docs/bugs/JOB_OWNERSHIP_REQUIREMENTS.md`
- **Guide frontend:** `docs/bugs/JOB_OWNERSHIP_FRONTEND_IMPLEMENTATION.md`
- **Executive summary:** `docs/bugs/JOB_OWNERSHIP_EXECUTIVE_SUMMARY.md`

---

## 💬 Contact

Pour questions ou clarifications:

- **Frontend:** Romain
- **Backend:** [Team Backend]

---

**Status:** ✅ Frontend prêt pour intégration | 🔄 En attente de tests backend

_Dernière mise à jour: Janvier 2026_

# 📋 EXIGENCES BACKEND - Gestion Ownership des Jobs

**Date:** 1er février 2026  
**Priorité:** HAUTE  
**Status:** À implémenter

---

## 🎯 Contexte & Problème Résolu

### Situation Actuelle



- **Utilisateur** (Company 2) est assigné à des jobs créés par **Company 1**
- **Paiement** va correctement à Company 1 (créateur du job = contractee)
- **Problème:** Le frontend ne montre pas clairement à qui appartient le job
- **Problème:** Pas de workflow pour accepter/refuser un job quand on n'est pas le créateur



### Solution Implémentée Frontend

1. ✅ Affichage clair de l'entreprise propriétaire du job
2. ✅ Distinction visuelle entre "Contractee" (créateur) et "Contractor" (exécutant)
3. ✅ Actions pour accepter/refuser un job assigné
4. ✅ Statuts de job enrichis pour gérer les assignations

---


## 📊 Nouveaux Statuts de Job Requis


### Statuts Actuels


```typescript
type JobStatus = "pending" | "in-progress" | "completed" | "cancelled";

```

### Statuts Proposés (Enrichis)

```typescript
type JobStatus =
  | "pending" // Job créé, en attente d'assignation
  | "assigned" // Job assigné à un contractor, en attente d'acceptation
  | "accepted" // Contractor a accepté le job
  | "in-progress" // Job en cours d'exécution

  | "completed" // Job terminé et payé
  | "cancelled" // Job annulé
  | "declined"; // Contractor a refusé le job
```



### Flux de Statuts

#### Scénario 1: Job Créé par la Même Compagnie


```
pending → accepted (auto) → in-progress → completed
```

#### Scénario 2: Job Assigné à une Autre Compagnie

```

pending → assigned (lors de l'assignation) → accepted (action manuelle) → in-progress → completed
                   ↓
                declined (action manuelle) → pending (retour en attente)
```

---


## 🔧 Modifications Backend Nécessaires


### 1️⃣ Base de Données - Table `jobs`

#### Champs Existants à Vérifier

```sql
-- Champs probablement déjà présents
contractor_company_id INT       -- ID de l'entreprise qui exécute (peut être différent de creator)

created_by_user_id INT          -- ID de l'utilisateur créateur
created_by_first_name VARCHAR
created_by_last_name VARCHAR
created_by_email VARCHAR
```


#### Nouveaux Champs Requis

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contractee_company_id INT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contractee_company_name VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assignment_status ENUM(
  'none',           -- Pas d'assignation externe
  'pending',        -- Assignation en attente d'acceptation

  'accepted',       -- Assignation acceptée
  'declined'        -- Assignation refusée

) DEFAULT 'none';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assignment_responded_at TIMESTAMP NULL;
```

**Logique:**

- `contractee_company_id` = Company qui a créé le job (reçoit le paiement)
- `contractor_company_id` = Company assignée pour exécuter le job (peut être la même)

- `assignment_status` = Statut de l'assignation externe

---


### 2️⃣ Endpoints API à Créer/Modifier

#### A. **GET /v1/jobs/{job_id}** (Modifier)

**Réponse Actuelle:**

```json
{
  "success": true,
  "data": {

    "id": "123",
    "status": "pending",
    "contractor_company_id": 2,
    "created_by_user_id": 5,
    ...
  }
}
```

**Réponse Enrichie Requise:**

```json
{
  "success": true,
  "data": {
    "id": "123",
    "status": "assigned",
    "assignment_status": "pending",

    // Contractee (créateur du job, reçoit le paiement)
    "contractee": {
      "company_id": 1,
      "company_name": "Nerd-Test Removals",
      "created_by_user_id": 5,
      "created_by_name": "John Doe",
      "stripe_account_id": "acct_xxx"
    },

    // Contractor (exécutant assigné)
    "contractor": {
      "company_id": 2,
      "company_name": "Swift Movers",
      "assigned_staff_id": "10",
      "assigned_staff_name": "Jane Smith",
      "assigned_at": "2026-01-31T10:00:00Z"
    },

    // Permissions de l'utilisateur actuel

    "permissions": {
      "can_accept": true,      // Si assigné mais pas accepté
      "can_decline": true,      // Si assigné mais pas accepté
      "can_start": false,       // Si accepté et pas démarré
      "can_complete": false,    // Si en cours
      "can_edit": true,         // Si créateur ou accepté
      "is_owner": false,        // Si créateur
      "is_assigned": true       // Si assigné

    },

    ...

  }
}
```

---

#### B. **POST /v1/jobs/{job_id}/accept** (Nouveau)


**But:** Accepter un job assigné


**Request:**

```json

{
  "user_id": 10,
  "notes": "Accepté, équipe disponible pour ce jour"
}
```

**Response:**


```json
{

  "success": true,
  "message": "Job accepted successfully",
  "data": {

    "job_id": "123",

    "status": "accepted",
    "assignment_status": "accepted",
    "accepted_at": "2026-02-01T14:30:00Z",
    "accepted_by_user_id": 10
  }
}

```


**Logique Backend:**

1. Vérifier que l'utilisateur appartient à la company assignée (`contractor_company_id`)
2. Vérifier que le job est en statut `assigned` avec `assignment_status = 'pending'`
3. Mettre à jour:
   ```sql
   UPDATE jobs SET

     status = 'accepted',
     assignment_status = 'accepted',
     assignment_responded_at = NOW()
   WHERE id = {job_id};
   ```
4. Envoyer notification au créateur du job

---



#### C. **POST /v1/jobs/{job_id}/decline** (Nouveau)


**But:** Refuser un job assigné

**Request:**

```json
{
  "user_id": 10,
  "reason": "Équipe non disponible ce jour-là",

  "suggest_reschedule": true
}
```

**Response:**


```json

{
  "success": true,

  "message": "Job declined successfully",
  "data": {
    "job_id": "123",
    "status": "pending",
    "assignment_status": "declined",

    "declined_at": "2026-02-01T14:30:00Z",
    "declined_by_user_id": 10,
    "contractor_company_id": null

  }

}
```

**Logique Backend:**

1. Vérifier que l'utilisateur appartient à la company assignée
2. Vérifier que le job est en statut `assigned` avec `assignment_status = 'pending'`

3. Mettre à jour:

   ```sql
   UPDATE jobs SET
     status = 'pending',
     assignment_status = 'declined',
     assignment_responded_at = NOW(),
     contractor_company_id = NULL,
     assigned_staff_id = NULL
   WHERE id = {job_id};

   ```
4. Envoyer notification au créateur avec la raison
5. Job retourne en pool pour réassignation


---


#### D. **GET /v1/jobs** (Modifier - Filtrage)

**Nouveaux Paramètres de Requête:**

```
?assignment_status=pending    // Jobs en attente d'acceptation

?is_owner=true               // Jobs dont je suis le créateur
?is_assigned=true            // Jobs qui me sont assignés
?pending_action=true         // Jobs nécessitant mon action
```

**Exemple:**

```
GET /v1/jobs?status=assigned&assignment_status=pending&is_assigned=true
```

→ Retourne tous les jobs assignés à ma company en attente d'acceptation

---

### 3️⃣ Logique de Création de Job


#### Lors de la création (POST /v1/jobs)

**Si contractor_company_id = company du créateur:**

```sql
INSERT INTO jobs (
  contractee_company_id,
  contractor_company_id,
  status,
  assignment_status,
  ...
) VALUES (
  {creator_company_id},
  {creator_company_id},
  'accepted',          -- Auto-accepté car même company
  'none',              -- Pas d'assignation externe
  ...
);
```

**Si contractor_company_id ≠ company du créateur:**

```sql
INSERT INTO jobs (
  contractee_company_id,
  contractor_company_id,
  status,
  assignment_status,
  assigned_at,
  ...
) VALUES (

  {creator_company_id},
  {assigned_company_id},
  'assigned',          -- En attente d'acceptation
  'pending',           -- Assignation en attente
  NOW(),
  ...
);
```


---

### 4️⃣ Permissions & Règles Métier

#### Règles d'Accès aux Actions

| Action           | Condition                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| **Accepter Job** | `contractor_company_id = ma_company` ET `assignment_status = 'pending'`   |
| **Refuser Job**  | `contractor_company_id = ma_company` ET `assignment_status = 'pending'`   |
| **Démarrer Job** | (`is_owner` OU `assignment_status = 'accepted'`) ET `status = 'accepted'` |
| **Éditer Job**   | `is_owner` OU (`assignment_status = 'accepted'` ET pas commencé)          |
| **Annuler Job**  | `is_owner` uniquement                                                     |
| **Voir Détails** | `is_owner` OU `contractor_company_id = ma_company`                        |

---



### 5️⃣ Notifications

#### Événements à Notifier

1. **Job Assigné** → Notifier le contractor
   - Email/Push au staff assigné
   - Email au manager de la company assignée

2. **Job Accepté** → Notifier le créateur

   - "Swift Movers a accepté votre job #123"

3. **Job Refusé** → Notifier le créateur

   - "Swift Movers a refusé votre job #123"
   - Inclure la raison

4. **Job Réassigné** → Notifier l'ancien et le nouveau contractor

---

## 📱 Modifications Frontend Déjà Implémentées

### 1. Badge "Job Owner" sur les Cartes


```tsx
{
  job.contractee.company_id !== userCompanyId && (

    <Badge>Job de: {job.contractee.company_name}</Badge>
  );
}
```


### 2. Section "Parties Impliquées" dans JobDetails

```tsx
<CompanySection title="Contractee (Créateur)">
  <CompanyInfo
    name={job.contractee.company_name}
    isPrimary={true}
  />
</CompanySection>



<CompanySection title="Contractor (Exécutant)">
  <CompanyInfo
    name={job.contractor.company_name}
    isAssigned={true}
  />
</CompanySection>
```

### 3. Actions d'Acceptation/Refus



```tsx
{
  canAcceptJob && (
    <>
      <Button onPress={handleAcceptJob}>Accepter le Job</Button>
      <Button variant="outline" onPress={handleDeclineJob}>
        Refuser
      </Button>

    </>
  );
}

```

### 4. Filtres dans Calendar

```tsx
- "Mes Jobs" (créés par ma company)
- "Jobs Assignés" (assignés à ma company)

- "En Attente d'Action" (à accepter/refuser)

```

---

## 🧪 Cas de Test Backend


### Test 1: Job Même Company

```
1. User Company 1 crée job
2. Assigne à staff de Company 1


3. Backend: status = 'accepted', assignment_status = 'none'
4. Frontend: Pas de badge, bouton "Démarrer" visible immédiatement
```

### Test 2: Job Autre Company - Accepté

```
1. User Company 1 crée job
2. Assigne à Company 2
3. Backend: status = 'assigned', assignment_status = 'pending'
4. User Company 2 voit badge "Job de: Company 1"
5. User Company 2 clique "Accepter"
6. Backend: status = 'accepted', assignment_status = 'accepted'

7. Frontend: Badge devient "Accepté", bouton "Démarrer" visible
```

### Test 3: Job Autre Company - Refusé

```
1. User Company 1 crée job

2. Assigne à Company 2
3. Backend: status = 'assigned', assignment_status = 'pending'
4. User Company 2 clique "Refuser"
5. Backend: status = 'pending', assignment_status = 'declined', contractor_company_id = NULL
6. User Company 1 reçoit notification de refus
7. Job retourne dans le pool
```


### Test 4: Paiement Multi-Company

```
1. Company 1 crée job, assigne à Company 2
2. Company 2 accepte et complète le job

3. Client paie
4. Backend: Paiement va sur stripe_account_id de Company 1 (contractee)
5. Frontend affiche clairement "Paiement à: Company 1"
```

---

## 📦 Résumé des Changements Backend

### Base de Données

- [ ] Ajouter `contractee_company_id`
- [ ] Ajouter `contractee_company_name`
- [ ] Ajouter `assignment_status` ENUM
- [ ] Ajouter `assigned_at` TIMESTAMP
- [ ] Ajouter `assignment_responded_at` TIMESTAMP

### Endpoints

- [ ] Modifier `GET /v1/jobs/{id}` → Ajouter sections contractee/contractor/permissions
- [ ] Créer `POST /v1/jobs/{id}/accept`
- [ ] Créer `POST /v1/jobs/{id}/decline`
- [ ] Modifier `GET /v1/jobs` → Ajouter filtres assignment_status, is_owner, is_assigned
- [ ] Modifier `POST /v1/jobs` → Gérer auto-acceptation vs assignation externe

### Logique Métier

- [ ] Implémenter workflow acceptation/refus
- [ ] Gérer réassignation après refus
- [ ] Permissions basées sur ownership/assignment
- [ ] Notifications pour assignation/acceptation/refus

### Stripe/Paiements

- [ ] Vérifier que `stripe_account_id` utilisé = contractee, pas contractor
- [ ] Documentation claire dans réponse API

---

## ✅ Prochaines Étapes

1. **Backend:** Implémenter les modifications listées ci-dessus
2. **Frontend:** Intégrer les nouveaux endpoints (déjà préparé)
3. **Test:** Valider les 4 scénarios de test
4. **Documentation:** Mettre à jour la doc API

---

**Créé par:** GitHub Copilot  
**Date:** 1er février 2026  
**Contact:** Équipe Frontend

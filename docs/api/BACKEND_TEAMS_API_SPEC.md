# 👥 API Specification - Teams Management

**Document créé le :** 8 Janvier 2026  
**Application :** Swift App  
**API Base URL :** `https://altivo.fr/swift-app/`  
**Version API :** v1

---

## 📋 Résumé

Implémentation du CRUD complet pour la gestion des équipes de personnel (Teams).

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/v1/company/:companyId/teams` | GET | Lister les équipes |
| `/v1/company/:companyId/teams` | POST | Créer une équipe |
| `/v1/company/:companyId/teams/:teamId` | PUT | Modifier une équipe |
| `/v1/company/:companyId/teams/:teamId` | DELETE | Supprimer une équipe |
| `/v1/jobs/:jobId` | PATCH | Assigner équipe à job (optionnel) |

---

## 1️⃣ GET - Lister les équipes

```
GET /v1/company/{companyId}/teams
```

### Query Parameters (optionnels)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Numéro de page (défaut: 1) |
| `per_page` | number | Éléments par page (défaut: 20) |
| `search` | string | Recherche par nom |

### Response - 200 OK

```json
{
  "success": true,
  "teams": [
    {
      "id": "team_001",
      "name": "Équipe Sydney Nord",
      "description": "Déménagements zone nord Sydney",
      "leader_id": "staff_001",
      "leader": {
        "id": "staff_001",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com"
      },
      "members": [
        {
          "id": "staff_002",
          "firstName": "Sarah",
          "lastName": "Johnson",
          "email": "sarah@example.com",
          "role": "mover"
        },
        {
          "id": "staff_003",
          "firstName": "Mike",
          "lastName": "Brown",
          "email": "mike@example.com",
          "role": "driver"
        }
      ],
      "member_count": 5,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-08T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 3,
    "total_pages": 1
  }
}
```

### Response - 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token invalide ou expiré"
}
```

---

## 2️⃣ POST - Créer une équipe

```
POST /v1/company/{companyId}/teams
```

### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body

```json
{
  "name": "Équipe Melbourne",
  "description": "Équipe pour zone Melbourne CBD",
  "leader_id": "staff_001",
  "member_ids": ["staff_002", "staff_003", "staff_004"]
}
```

### Validation

| Champ | Requis | Type | Contraintes |
|-------|--------|------|-------------|
| `name` | ✅ Oui | string | 1-100 caractères, unique par company |
| `description` | ❌ Non | string | Max 500 caractères |
| `leader_id` | ❌ Non | string | Doit être un staff_id valide de la company |
| `member_ids` | ❌ Non | string[] | Staff IDs valides de la company |

### Response - 201 Created

```json
{
  "success": true,
  "message": "Équipe créée avec succès",
  "team": {
    "id": "team_002",
    "name": "Équipe Melbourne",
    "description": "Équipe pour zone Melbourne CBD",
    "leader_id": "staff_001",
    "leader": {
      "id": "staff_001",
      "firstName": "John",
      "lastName": "Smith"
    },
    "members": [
      { "id": "staff_002", "firstName": "Sarah", "lastName": "Johnson" },
      { "id": "staff_003", "firstName": "Mike", "lastName": "Brown" },
      { "id": "staff_004", "firstName": "Emma", "lastName": "Wilson" }
    ],
    "member_count": 3,
    "created_at": "2026-01-08T14:30:00Z"
  }
}
```

### Response - 400 Bad Request

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Le nom de l'équipe est requis",
  "details": {
    "field": "name",
    "code": "REQUIRED"
  }
}
```

### Response - 409 Conflict

```json
{
  "success": false,
  "error": "Conflict",
  "message": "Une équipe avec ce nom existe déjà"
}
```

---

## 3️⃣ PUT - Modifier une équipe

```
PUT /v1/company/{companyId}/teams/{teamId}
```

### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body

```json
{
  "name": "Équipe Melbourne CBD",
  "description": "Description mise à jour",
  "leader_id": "staff_002",
  "member_ids": ["staff_001", "staff_003", "staff_005"]
}
```

### Comportement

- Tous les champs sont optionnels (PATCH behavior)
- `member_ids` **remplace** la liste existante (pas d'ajout)
- Pour ajouter/retirer un membre, envoyer la liste complète mise à jour

### Response - 200 OK

```json
{
  "success": true,
  "message": "Équipe mise à jour avec succès",
  "team": {
    "id": "team_002",
    "name": "Équipe Melbourne CBD",
    "description": "Description mise à jour",
    "leader_id": "staff_002",
    "leader": {
      "id": "staff_002",
      "firstName": "Sarah",
      "lastName": "Johnson"
    },
    "members": [
      { "id": "staff_001", "firstName": "John", "lastName": "Smith" },
      { "id": "staff_003", "firstName": "Mike", "lastName": "Brown" },
      { "id": "staff_005", "firstName": "Alex", "lastName": "Taylor" }
    ],
    "member_count": 3,
    "updated_at": "2026-01-08T15:00:00Z"
  }
}
```

### Response - 404 Not Found

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Équipe non trouvée"
}
```

---

## 4️⃣ DELETE - Supprimer une équipe

```
DELETE /v1/company/{companyId}/teams/{teamId}
```

### Headers

```
Authorization: Bearer {token}
```

### Comportement

- Supprime l'équipe et ses associations (team_members)
- Ne supprime PAS les membres staff
- Les jobs assignés à cette équipe perdent leur `assigned_team_id`

### Response - 200 OK

```json
{
  "success": true,
  "message": "Équipe supprimée avec succès"
}
```

### Response - 404 Not Found

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Équipe non trouvée"
}
```

---

## 5️⃣ PATCH - Assigner équipe à un job (Optionnel)

```
PATCH /v1/jobs/{jobId}
```

### Request Body

```json
{
  "assigned_team_id": "team_001"
}
```

> **Note:** Cet endpoint existe déjà. Il faut juste ajouter le support du champ `assigned_team_id`.

### Response enrichie pour GET /v1/jobs/{jobId}

```json
{
  "success": true,
  "job": {
    "id": "job_456",
    "assigned_team_id": "team_001",
    "assigned_team": {
      "id": "team_001",
      "name": "Équipe Sydney Nord",
      "member_count": 5
    }
  }
}
```

---

## 🗄️ Schéma Base de Données

### Table `teams`

```sql
CREATE TABLE teams (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  leader_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (leader_id) REFERENCES staff(id) ON DELETE SET NULL,
  UNIQUE KEY unique_team_name_per_company (company_id, name)
);
```

### Table `team_members`

```sql
CREATE TABLE team_members (
  team_id VARCHAR(36) NOT NULL,
  staff_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (team_id, staff_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);
```

### Migration optionnelle table `jobs`

```sql
ALTER TABLE jobs 
ADD COLUMN assigned_team_id VARCHAR(36),
ADD FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL;
```

---

## ⚠️ Points d'attention

### Sécurité

- Vérifier que l'utilisateur appartient à la `company_id` demandée
- Vérifier que les `staff_id` dans `member_ids` appartiennent à la même company
- Le `leader_id` doit aussi appartenir à la company

### Validation

- Nom d'équipe unique par company
- Un staff peut appartenir à plusieurs équipes
- Le leader peut aussi être dans la liste des membres (ou pas)

### Performance

- Index sur `company_id` dans la table `teams`
- Index sur `team_id` dans la table `team_members`

---

## 📱 Intégration Frontend

Une fois les endpoints implémentés, le frontend créera :

- `src/services/teamsService.ts` - Service API
- `src/hooks/useTeams.ts` - Hook React
- `src/screens/teams/TeamsScreen.tsx` - Liste des équipes
- `src/screens/teams/TeamDetailsScreen.tsx` - Détails équipe
- `src/components/teams/CreateTeamModal.tsx` - Création équipe

---

## ✅ Checklist Backend

- [ ] Créer table `teams`
- [ ] Créer table `team_members`
- [ ] Implémenter `GET /v1/company/:id/teams`
- [ ] Implémenter `POST /v1/company/:id/teams`
- [ ] Implémenter `PUT /v1/company/:id/teams/:teamId`
- [ ] Implémenter `DELETE /v1/company/:id/teams/:teamId`
- [ ] (Optionnel) Ajouter `assigned_team_id` aux jobs
- [ ] Tests unitaires
- [ ] Documentation Swagger/OpenAPI

---

**Questions ?** Contacter l'équipe frontend pour clarifications.

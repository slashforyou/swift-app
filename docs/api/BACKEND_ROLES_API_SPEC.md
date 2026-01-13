# 🔐 API Specification - Roles & Permissions (RBAC)

**Document créé le :** 8 Janvier 2026  
**Application :** Swift App  
**API Base URL :** `https://altivo.fr/swift-app/`  
**Version API :** v1

---

## 📋 Résumé

Implémentation d'un système de contrôle d'accès basé sur les rôles (RBAC).

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/v1/company/:companyId/roles` | GET | Lister les rôles disponibles |
| `/v1/company/:companyId/roles` | POST | Créer un rôle personnalisé |
| `/v1/company/:companyId/roles/:roleId` | PUT | Modifier un rôle |
| `/v1/company/:companyId/roles/:roleId` | DELETE | Supprimer un rôle |
| `/v1/staff/:staffId/role` | PATCH | Assigner un rôle à un staff |
| `/v1/users/me/permissions` | GET | Récupérer ses permissions |

---

## 🎭 Rôles Prédéfinis

| Rôle | Clé | Description | Modifiable |
|------|-----|-------------|------------|
| Propriétaire | `owner` | Accès total, propriétaire de l'entreprise | ❌ Non |
| Administrateur | `admin` | Accès total sauf suppression entreprise | ❌ Non |
| Manager | `manager` | CRUD jobs, staff, véhicules | ✅ Oui |
| Superviseur | `supervisor` | Voir/modifier jobs assignés | ✅ Oui |
| Déménageur | `mover` | Voir jobs assignés, mettre à jour statut | ✅ Oui |
| Lecture seule | `viewer` | Voir uniquement | ✅ Oui |

---

## 🔑 Permissions Disponibles

| Permission | Description |
|------------|-------------|
| `jobs.read` | Voir les jobs |
| `jobs.write` | Créer/modifier les jobs |
| `jobs.delete` | Supprimer les jobs |
| `jobs.assign` | Assigner staff/équipe aux jobs |
| `staff.read` | Voir le personnel |
| `staff.write` | Créer/modifier le personnel |
| `staff.delete` | Supprimer le personnel |
| `staff.invite` | Inviter du personnel |
| `vehicles.read` | Voir les véhicules |
| `vehicles.write` | Créer/modifier les véhicules |
| `vehicles.delete` | Supprimer les véhicules |
| `clients.read` | Voir les clients |
| `clients.write` | Créer/modifier les clients |
| `clients.delete` | Supprimer les clients |
| `payments.read` | Voir les paiements |
| `payments.write` | Gérer les paiements |
| `invoices.read` | Voir les factures |
| `invoices.write` | Créer/modifier les factures |
| `settings.read` | Voir les paramètres |
| `settings.write` | Modifier les paramètres |
| `teams.read` | Voir les équipes |
| `teams.write` | Gérer les équipes |
| `roles.read` | Voir les rôles |
| `roles.write` | Gérer les rôles (admin only) |

---

## 📊 Matrice de Permissions par Rôle

| Permission | Owner | Admin | Manager | Supervisor | Mover | Viewer |
|------------|:-----:|:-----:|:-------:|:----------:|:-----:|:------:|
| `jobs.read` | ✅ | ✅ | ✅ | ✅* | ✅* | ✅ |
| `jobs.write` | ✅ | ✅ | ✅ | ✅* | ❌ | ❌ |
| `jobs.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `jobs.assign` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `staff.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `staff.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `staff.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `staff.invite` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `vehicles.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `vehicles.write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `vehicles.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `clients.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `clients.write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `clients.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `payments.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `payments.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `invoices.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `invoices.write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `settings.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `settings.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `teams.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `teams.write` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `roles.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `roles.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> **\*** = Limité aux ressources assignées à l'utilisateur

---

## 1️⃣ GET - Lister les rôles

```
GET /v1/company/{companyId}/roles
```

### Response - 200 OK

```json
{
  "success": true,
  "roles": [
    {
      "id": "role_owner",
      "name": "owner",
      "display_name": "Propriétaire",
      "description": "Accès total à l'entreprise",
      "is_system": true,
      "is_editable": false,
      "permissions": ["*"],
      "staff_count": 1,
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "role_admin",
      "name": "admin",
      "display_name": "Administrateur",
      "description": "Accès total sauf suppression entreprise",
      "is_system": true,
      "is_editable": false,
      "permissions": [
        "jobs.read", "jobs.write", "jobs.delete", "jobs.assign",
        "staff.read", "staff.write", "staff.delete", "staff.invite",
        "vehicles.read", "vehicles.write", "vehicles.delete",
        "clients.read", "clients.write", "clients.delete",
        "payments.read", "payments.write",
        "invoices.read", "invoices.write",
        "settings.read", "settings.write",
        "teams.read", "teams.write",
        "roles.read", "roles.write"
      ],
      "staff_count": 2,
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "role_manager",
      "name": "manager",
      "display_name": "Manager",
      "description": "Gestion des opérations quotidiennes",
      "is_system": true,
      "is_editable": true,
      "permissions": [
        "jobs.read", "jobs.write", "jobs.assign",
        "staff.read", "staff.invite",
        "vehicles.read", "vehicles.write",
        "clients.read", "clients.write",
        "payments.read",
        "invoices.read", "invoices.write",
        "settings.read",
        "teams.read", "teams.write"
      ],
      "staff_count": 3,
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "role_mover",
      "name": "mover",
      "display_name": "Déménageur",
      "description": "Voir et mettre à jour les jobs assignés",
      "is_system": true,
      "is_editable": true,
      "permissions": [
        "jobs.read"
      ],
      "scope": "assigned",
      "staff_count": 15,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## 2️⃣ POST - Créer un rôle personnalisé

```
POST /v1/company/{companyId}/roles
```

### Request Body

```json
{
  "name": "team_lead",
  "display_name": "Chef d'équipe",
  "description": "Responsable d'une équipe de déménageurs",
  "permissions": [
    "jobs.read",
    "jobs.write",
    "staff.read",
    "vehicles.read",
    "teams.read"
  ],
  "scope": "team"
}
```

### Validation

| Champ | Requis | Type | Contraintes |
|-------|--------|------|-------------|
| `name` | ✅ Oui | string | 1-50 chars, snake_case, unique par company |
| `display_name` | ✅ Oui | string | 1-100 caractères |
| `description` | ❌ Non | string | Max 500 caractères |
| `permissions` | ✅ Oui | string[] | Liste de permissions valides |
| `scope` | ❌ Non | string | `all`, `team`, `assigned` (défaut: `all`) |

### Scope Explanation

| Scope | Description |
|-------|-------------|
| `all` | Accès à toutes les ressources de la company |
| `team` | Accès limité aux ressources de son équipe |
| `assigned` | Accès limité aux ressources assignées directement |

### Response - 201 Created

```json
{
  "success": true,
  "message": "Rôle créé avec succès",
  "role": {
    "id": "role_custom_001",
    "name": "team_lead",
    "display_name": "Chef d'équipe",
    "description": "Responsable d'une équipe de déménageurs",
    "is_system": false,
    "is_editable": true,
    "permissions": ["jobs.read", "jobs.write", "staff.read", "vehicles.read", "teams.read"],
    "scope": "team",
    "staff_count": 0,
    "created_at": "2026-01-08T14:30:00Z"
  }
}
```

### Response - 400 Bad Request

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Permission invalide: 'invalid.permission'",
  "details": {
    "field": "permissions",
    "invalid_values": ["invalid.permission"]
  }
}
```

---

## 3️⃣ PUT - Modifier un rôle

```
PUT /v1/company/{companyId}/roles/{roleId}
```

### Request Body

```json
{
  "display_name": "Chef d'équipe Senior",
  "description": "Responsable senior avec plus de permissions",
  "permissions": [
    "jobs.read",
    "jobs.write",
    "jobs.assign",
    "staff.read",
    "staff.invite",
    "vehicles.read",
    "teams.read",
    "teams.write"
  ]
}
```

### Comportement

- Seuls les rôles avec `is_editable: true` peuvent être modifiés
- Le champ `name` ne peut pas être modifié après création
- Les rôles système (`owner`, `admin`) ne peuvent pas être modifiés

### Response - 200 OK

```json
{
  "success": true,
  "message": "Rôle mis à jour avec succès",
  "role": {
    "id": "role_custom_001",
    "name": "team_lead",
    "display_name": "Chef d'équipe Senior",
    "permissions": ["jobs.read", "jobs.write", "jobs.assign", "staff.read", "staff.invite", "vehicles.read", "teams.read", "teams.write"],
    "updated_at": "2026-01-08T15:00:00Z"
  }
}
```

### Response - 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Ce rôle système ne peut pas être modifié"
}
```

---

## 4️⃣ DELETE - Supprimer un rôle

```
DELETE /v1/company/{companyId}/roles/{roleId}
```

### Comportement

- Seuls les rôles personnalisés (`is_system: false`) peuvent être supprimés
- Les staff avec ce rôle seront réassignés au rôle `viewer` par défaut

### Query Parameters

| Param | Description |
|-------|-------------|
| `fallback_role` | ID du rôle de remplacement (défaut: `role_viewer`) |

### Response - 200 OK

```json
{
  "success": true,
  "message": "Rôle supprimé avec succès",
  "affected_staff": 3,
  "fallback_role": "viewer"
}
```

### Response - 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Les rôles système ne peuvent pas être supprimés"
}
```

---

## 5️⃣ PATCH - Assigner un rôle à un staff

```
PATCH /v1/staff/{staffId}/role
```

### Request Body

```json
{
  "role_id": "role_manager"
}
```

### Validation

- L'utilisateur doit avoir la permission `roles.write`
- Le rôle `owner` ne peut être assigné qu'à un seul utilisateur
- Un admin ne peut pas rétrograder un autre admin (sauf owner)

### Response - 200 OK

```json
{
  "success": true,
  "message": "Rôle assigné avec succès",
  "staff": {
    "id": "staff_123",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "role": {
      "id": "role_manager",
      "name": "manager",
      "display_name": "Manager"
    },
    "updated_at": "2026-01-08T15:30:00Z"
  }
}
```

---

## 6️⃣ GET - Récupérer ses permissions

```
GET /v1/users/me/permissions
```

### Response - 200 OK

```json
{
  "success": true,
  "user_id": 15,
  "role": {
    "id": "role_manager",
    "name": "manager",
    "display_name": "Manager"
  },
  "permissions": [
    "jobs.read",
    "jobs.write",
    "jobs.assign",
    "staff.read",
    "staff.invite",
    "vehicles.read",
    "vehicles.write",
    "clients.read",
    "clients.write",
    "payments.read",
    "invoices.read",
    "invoices.write",
    "settings.read",
    "teams.read",
    "teams.write"
  ],
  "scope": "all",
  "restrictions": null
}
```

### Response avec restrictions (scope: assigned)

```json
{
  "success": true,
  "user_id": 42,
  "role": {
    "id": "role_mover",
    "name": "mover",
    "display_name": "Déménageur"
  },
  "permissions": [
    "jobs.read"
  ],
  "scope": "assigned",
  "restrictions": {
    "jobs": {
      "filter": "assigned_to_me",
      "allowed_actions": ["read", "update_status"]
    }
  }
}
```

---

## 🗄️ Schéma Base de Données

### Table `roles`

```sql
CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_editable BOOLEAN DEFAULT TRUE,
  scope ENUM('all', 'team', 'assigned') DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_name_per_company (company_id, name)
);
```

### Table `role_permissions`

```sql
CREATE TABLE role_permissions (
  role_id VARCHAR(36) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (role_id, permission),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

### Table `permissions` (référence)

```sql
CREATE TABLE permissions (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed des permissions
INSERT INTO permissions (id, category, display_name, description) VALUES
('jobs.read', 'jobs', 'Voir les jobs', 'Permet de voir la liste et les détails des jobs'),
('jobs.write', 'jobs', 'Modifier les jobs', 'Permet de créer et modifier des jobs'),
('jobs.delete', 'jobs', 'Supprimer les jobs', 'Permet de supprimer des jobs'),
('jobs.assign', 'jobs', 'Assigner aux jobs', 'Permet d assigner du staff et des équipes aux jobs'),
('staff.read', 'staff', 'Voir le personnel', 'Permet de voir la liste du personnel'),
('staff.write', 'staff', 'Modifier le personnel', 'Permet de modifier les informations du personnel'),
('staff.delete', 'staff', 'Supprimer le personnel', 'Permet de supprimer du personnel'),
('staff.invite', 'staff', 'Inviter du personnel', 'Permet d inviter de nouveaux membres'),
-- ... autres permissions
;
```

### Migration table `staff`

```sql
ALTER TABLE staff 
ADD COLUMN role_id VARCHAR(36),
ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Valeur par défaut pour staff existants
UPDATE staff SET role_id = 'role_mover' WHERE role_id IS NULL;
```

---

## 🔒 Middleware de Vérification

### Exemple d'implémentation (Node.js)

```javascript
// middleware/checkPermission.js
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    const userId = req.user.id;
    
    // Récupérer les permissions de l'utilisateur
    const userPermissions = await getUserPermissions(userId);
    
    // Vérifier la permission
    if (!userPermissions.includes(requiredPermission) && !userPermissions.includes('*')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Permission requise: ${requiredPermission}`
      });
    }
    
    // Vérifier le scope si nécessaire
    if (userPermissions.scope === 'assigned') {
      req.scopeFilter = { assigned_to: userId };
    } else if (userPermissions.scope === 'team') {
      const teamIds = await getUserTeamIds(userId);
      req.scopeFilter = { team_id: { $in: teamIds } };
    }
    
    next();
  };
};

// Usage dans les routes
router.get('/jobs', checkPermission('jobs.read'), jobsController.list);
router.post('/jobs', checkPermission('jobs.write'), jobsController.create);
router.delete('/jobs/:id', checkPermission('jobs.delete'), jobsController.delete);
```

---

## ⚠️ Points d'attention

### Sécurité

- Le rôle `owner` est unique par company
- Un utilisateur ne peut pas s'auto-attribuer plus de permissions
- Les actions sensibles (suppression company, changement owner) nécessitent le rôle `owner`
- Logger toutes les modifications de rôles pour audit

### Validation

- Vérifier que les permissions demandées existent
- Empêcher la création de rôles avec plus de permissions que l'utilisateur actuel
- Valider le format snake_case pour les noms de rôles

### Performance

- Cache les permissions utilisateur (invalider au changement de rôle)
- Index sur `staff.role_id`
- Index sur `role_permissions.role_id`

---

## 📱 Intégration Frontend

Une fois les endpoints implémentés, le frontend créera :

- `src/services/rolesService.ts` - Service API
- `src/hooks/useRoles.ts` - Hook React pour gestion des rôles
- `src/hooks/usePermissions.ts` - Hook pour vérifier les permissions
- `src/contexts/PermissionsContext.tsx` - Context global des permissions
- `src/components/PermissionGate.tsx` - HOC pour masquer les éléments UI
- `src/screens/settings/RolesScreen.tsx` - Gestion des rôles

### Exemple d'utilisation Frontend

```typescript
// Vérifier une permission
const { hasPermission } = usePermissions();
if (hasPermission('jobs.delete')) {
  // Afficher bouton supprimer
}

// Composant PermissionGate
<PermissionGate permission="staff.write">
  <Button onPress={handleEditStaff}>Modifier</Button>
</PermissionGate>
```

---

## ✅ Checklist Backend

- [ ] Créer table `roles`
- [ ] Créer table `role_permissions`
- [ ] Créer table `permissions`
- [ ] Seed des rôles système (owner, admin, manager, supervisor, mover, viewer)
- [ ] Seed des permissions
- [ ] Ajouter `role_id` à la table `staff`
- [ ] Implémenter `GET /v1/company/:id/roles`
- [ ] Implémenter `POST /v1/company/:id/roles`
- [ ] Implémenter `PUT /v1/company/:id/roles/:roleId`
- [ ] Implémenter `DELETE /v1/company/:id/roles/:roleId`
- [ ] Implémenter `PATCH /v1/staff/:id/role`
- [ ] Implémenter `GET /v1/users/me/permissions`
- [ ] Créer middleware `checkPermission`
- [ ] Appliquer middleware sur tous les endpoints existants
- [ ] Tests unitaires
- [ ] Documentation Swagger/OpenAPI

---

## 🕐 Estimation de Temps

| Tâche | Durée estimée |
|-------|---------------|
| Tables & migrations | 2-3 heures |
| Endpoints CRUD rôles | 4-6 heures |
| Endpoint permissions | 2-3 heures |
| Middleware checkPermission | 3-4 heures |
| Application sur endpoints existants | 4-6 heures |
| Tests | 4-6 heures |
| **Total** | **19-28 heures** |

---

**Questions ?** Contacter l'équipe frontend pour clarifications.

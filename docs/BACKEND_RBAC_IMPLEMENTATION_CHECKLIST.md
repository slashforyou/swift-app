# 🔐 Backend RBAC Implementation Checklist

**Document créé le :** 9 Janvier 2026  
**Dernière mise à jour :** 9 Janvier 2026  
**Destinataire :** Développeur Backend  
**Statut Frontend :** ✅ TERMINÉ  
**Statut Backend :** ✅ TERMINÉ  
**Priorité :** ✅ COMPLÉTÉ

---

## 🎉 IMPLÉMENTATION TERMINÉE

> **Tous les endpoints RBAC sont maintenant fonctionnels !**  
> Le système de permissions est prêt à être utilisé en production.

### ✅ Endpoints implémentés

| Endpoint | Méthode | Status | Notes |
|----------|---------|--------|-------|
| `/v1/users/me/permissions` | GET | ✅ | Retourne `"id": "role_manager"` |
| `/v1/company/:id/roles` | GET | ✅ | Liste avec format `role_name` |
| `/v1/company/:id/roles` | POST | ✅ | Crée avec ID `role_{name}` |
| `/v1/company/:id/roles/:roleId` | PUT | ✅ | Accepte format nom |
| `/v1/company/:id/roles/:roleId` | DELETE | ✅ | Accepte format nom |
| `/v1/staff/:id/role` | PATCH | ✅ | Accepte `{"role_id": "role_manager"}` |

---

## 📋 Résumé

Le système RBAC est **entièrement fonctionnel** côté frontend ET backend.

### Fichiers Frontend créés :

| Fichier | Description |
|---------|-------------|
| `src/services/rolesService.ts` | Service API avec types et fonctions |
| `src/hooks/useRoles.ts` | Hook React pour gestion des rôles |
| `src/hooks/usePermissions.ts` | Hook pour vérifier les permissions |
| `src/contexts/PermissionsContext.tsx` | Context global des permissions |
| `src/components/PermissionGate.tsx` | Composant pour masquer UI selon permissions |
| `src/screens/settings/RolesManagementScreen.tsx` | Écran d'administration des rôles |

---

## 🚨 ENDPOINT CRITIQUE - À implémenter en premier

### `GET /v1/users/me/permissions`

**Pourquoi c'est critique :** Appelé après chaque connexion pour charger les permissions de l'utilisateur. Sans cet endpoint, tout le système RBAC est désactivé.

**Quand c'est appelé :** Immédiatement après `login()` réussi.

#### Request
```http
GET /v1/users/me/permissions
Authorization: Bearer {token}
```

#### Response attendue - 200 OK
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

#### Response pour un mover (scope: assigned)
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

#### Response pour un owner (wildcard)
```json
{
  "success": true,
  "user_id": 1,
  "role": {
    "id": "role_owner",
    "name": "owner",
    "display_name": "Propriétaire"
  },
  "permissions": ["*"],
  "scope": "all",
  "restrictions": null
}
```

---

## 📊 Tous les Endpoints Requis

| # | Endpoint | Méthode | Priorité | Description |
|---|----------|---------|----------|-------------|
| 1 | `/v1/users/me/permissions` | GET | 🔴 CRITIQUE | Permissions de l'utilisateur connecté |
| 2 | `/v1/company/:id/roles` | GET | 🟠 Haute | Lister les rôles de la company |
| 3 | `/v1/company/:id/roles` | POST | 🟡 Moyenne | Créer un rôle personnalisé |
| 4 | `/v1/company/:id/roles/:roleId` | PUT | 🟡 Moyenne | Modifier un rôle |
| 5 | `/v1/company/:id/roles/:roleId` | DELETE | 🟡 Moyenne | Supprimer un rôle |
| 6 | `/v1/staff/:id/role` | PATCH | 🟠 Haute | Assigner un rôle à un staff |

---

## 1️⃣ GET /v1/company/:companyId/roles

Liste tous les rôles disponibles pour une company.

### Request
```http
GET /v1/company/1/roles
Authorization: Bearer {token}
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
      "scope": "all",
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
      "scope": "all",
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
      "scope": "all",
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
      "permissions": ["jobs.read"],
      "scope": "assigned",
      "staff_count": 15,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Champs importants

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | ID unique du rôle |
| `name` | string | Slug du rôle (snake_case) |
| `display_name` | string | Nom affiché à l'utilisateur |
| `is_system` | boolean | `true` = rôle prédéfini, ne peut pas être supprimé |
| `is_editable` | boolean | `true` = les permissions peuvent être modifiées |
| `permissions` | string[] | Liste des permissions (`["*"]` = toutes) |
| `scope` | string | `"all"` \| `"team"` \| `"assigned"` |
| `staff_count` | number | Nombre de staff avec ce rôle |

---

## 2️⃣ POST /v1/company/:companyId/roles

Créer un nouveau rôle personnalisé.

### Request
```http
POST /v1/company/1/roles
Authorization: Bearer {token}
Content-Type: application/json

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

| Champ | Requis | Contraintes |
|-------|--------|-------------|
| `name` | ✅ Oui | 1-50 chars, snake_case, unique par company |
| `display_name` | ✅ Oui | 1-100 caractères |
| `description` | ❌ Non | Max 500 caractères |
| `permissions` | ✅ Oui | Tableau de permissions valides |
| `scope` | ❌ Non | `"all"` (défaut), `"team"`, `"assigned"` |

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
    "created_at": "2026-01-09T14:30:00Z"
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

## 3️⃣ PUT /v1/company/:companyId/roles/:roleId

Modifier un rôle existant.

### Request
```http
PUT /v1/company/1/roles/role_custom_001
Authorization: Bearer {token}
Content-Type: application/json

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
  ],
  "scope": "team"
}
```

### Règles métier
- ❌ Le champ `name` ne peut PAS être modifié
- ❌ Les rôles avec `is_editable: false` ne peuvent pas être modifiés
- ❌ Les rôles `owner` et `admin` ne peuvent pas être modifiés

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
    "scope": "team",
    "updated_at": "2026-01-09T15:00:00Z"
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

## 4️⃣ DELETE /v1/company/:companyId/roles/:roleId

Supprimer un rôle personnalisé.

### Request
```http
DELETE /v1/company/1/roles/role_custom_001?fallback_role=role_mover
Authorization: Bearer {token}
```

### Query Parameters

| Param | Description | Défaut |
|-------|-------------|--------|
| `fallback_role` | ID du rôle de remplacement pour les staff affectés | `role_viewer` |

### Règles métier
- ❌ Les rôles avec `is_system: true` ne peuvent pas être supprimés
- ⚠️ Les staff avec ce rôle seront réassignés au `fallback_role`

### Response - 200 OK
```json
{
  "success": true,
  "message": "Rôle supprimé avec succès",
  "affected_staff": 3,
  "fallback_role": "mover"
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

## 5️⃣ PATCH /v1/staff/:staffId/role

Assigner un rôle à un membre du staff.

### Request
```http
PATCH /v1/staff/123/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role_id": "role_manager"
}
```

### Règles métier
- L'utilisateur doit avoir la permission `roles.write`
- Le rôle `owner` ne peut être assigné qu'à UN SEUL utilisateur par company
- Un admin ne peut pas rétrograder un autre admin (sauf si l'utilisateur est owner)

### Response - 200 OK
```json
{
  "success": true,
  "message": "Rôle assigné avec succès",
  "staff": {
    "id": "123",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "role": {
      "id": "role_manager",
      "name": "manager",
      "display_name": "Manager"
    },
    "updated_at": "2026-01-09T15:30:00Z"
  }
}
```

---

## 🔑 Liste des Permissions Valides

Le frontend attend exactement ces 24 permissions :

### Jobs (4)
| Permission | Description |
|------------|-------------|
| `jobs.read` | Voir les jobs |
| `jobs.write` | Créer/modifier les jobs |
| `jobs.delete` | Supprimer les jobs |
| `jobs.assign` | Assigner staff/équipe aux jobs |

### Staff (4)
| Permission | Description |
|------------|-------------|
| `staff.read` | Voir le personnel |
| `staff.write` | Créer/modifier le personnel |
| `staff.delete` | Supprimer le personnel |
| `staff.invite` | Inviter du personnel |

### Vehicles (3)
| Permission | Description |
|------------|-------------|
| `vehicles.read` | Voir les véhicules |
| `vehicles.write` | Créer/modifier les véhicules |
| `vehicles.delete` | Supprimer les véhicules |

### Clients (3)
| Permission | Description |
|------------|-------------|
| `clients.read` | Voir les clients |
| `clients.write` | Créer/modifier les clients |
| `clients.delete` | Supprimer les clients |

### Finances (4)
| Permission | Description |
|------------|-------------|
| `payments.read` | Voir les paiements |
| `payments.write` | Gérer les paiements |
| `invoices.read` | Voir les factures |
| `invoices.write` | Créer/modifier les factures |

### Settings (2)
| Permission | Description |
|------------|-------------|
| `settings.read` | Voir les paramètres |
| `settings.write` | Modifier les paramètres |

### Teams (2)
| Permission | Description |
|------------|-------------|
| `teams.read` | Voir les équipes |
| `teams.write` | Gérer les équipes |

### Roles (2)
| Permission | Description |
|------------|-------------|
| `roles.read` | Voir les rôles |
| `roles.write` | Gérer les rôles (admin only) |

---

## 🎭 Rôles Système à Seeder

À créer lors de la migration initiale :

| Rôle | `name` | `is_system` | `is_editable` | `scope` |
|------|--------|-------------|---------------|---------|
| Propriétaire | `owner` | `true` | `false` | `all` |
| Administrateur | `admin` | `true` | `false` | `all` |
| Manager | `manager` | `true` | `true` | `all` |
| Superviseur | `supervisor` | `true` | `true` | `team` |
| Déménageur | `mover` | `true` | `true` | `assigned` |
| Lecture seule | `viewer` | `true` | `true` | `all` |

### Permissions par rôle par défaut

```javascript
const ROLE_PERMISSIONS = {
  owner: ['*'],
  admin: [
    'jobs.read', 'jobs.write', 'jobs.delete', 'jobs.assign',
    'staff.read', 'staff.write', 'staff.delete', 'staff.invite',
    'vehicles.read', 'vehicles.write', 'vehicles.delete',
    'clients.read', 'clients.write', 'clients.delete',
    'payments.read', 'payments.write',
    'invoices.read', 'invoices.write',
    'settings.read', 'settings.write',
    'teams.read', 'teams.write',
    'roles.read', 'roles.write'
  ],
  manager: [
    'jobs.read', 'jobs.write', 'jobs.assign',
    'staff.read', 'staff.invite',
    'vehicles.read', 'vehicles.write',
    'clients.read', 'clients.write',
    'payments.read',
    'invoices.read', 'invoices.write',
    'settings.read',
    'teams.read', 'teams.write'
  ],
  supervisor: [
    'jobs.read', 'jobs.write',
    'staff.read',
    'vehicles.read',
    'clients.read',
    'teams.read'
  ],
  mover: [
    'jobs.read'
  ],
  viewer: [
    'jobs.read',
    'staff.read',
    'vehicles.read',
    'clients.read',
    'teams.read'
  ]
};
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
  UNIQUE KEY unique_role_name_per_company (company_id, name),
  INDEX idx_company_id (company_id)
);
```

### Table `role_permissions`
```sql
CREATE TABLE role_permissions (
  role_id VARCHAR(36) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (role_id, permission),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_role_id (role_id)
);
```

### Migration table `staff`
```sql
ALTER TABLE staff 
ADD COLUMN role_id VARCHAR(36),
ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
ADD INDEX idx_role_id (role_id);

-- Valeur par défaut pour staff existants
UPDATE staff SET role_id = (
  SELECT id FROM roles WHERE name = 'mover' AND company_id = staff.company_id
) WHERE role_id IS NULL;
```

---

## ✅ Checklist d'Implémentation

### Phase 1 - Base de données (2-3h)
- [x] Créer table `roles`
- [x] Créer table `role_permissions`
- [x] Ajouter colonne `role_id` à `staff`
- [x] Seeder les 6 rôles système pour chaque company
- [x] Seeder les permissions pour chaque rôle

### Phase 2 - Endpoint critique (2-3h)
- [x] **`GET /v1/users/me/permissions`** ← PRIORITÉ #1
- [x] Tester avec différents rôles (owner, admin, manager, mover)

### Phase 3 - CRUD Rôles (4-6h)
- [x] `GET /v1/company/:id/roles`
- [x] `POST /v1/company/:id/roles`
- [x] `PUT /v1/company/:id/roles/:roleId`
- [x] `DELETE /v1/company/:id/roles/:roleId`

### Phase 4 - Assignation (2-3h)
- [x] `PATCH /v1/staff/:id/role`
- [x] Validation des règles métier (owner unique, etc.)

### Phase 5 - Middleware (optionnel mais recommandé)
- [ ] Créer middleware `checkPermission(permission)`
- [ ] Appliquer sur les endpoints existants

---

## 🧪 Tests Recommandés

```bash
# 1. Tester GET permissions après login
curl -X GET "https://altivo.fr/swift-app/v1/users/me/permissions" \
  -H "Authorization: Bearer {token}"

# 2. Tester liste des rôles
curl -X GET "https://altivo.fr/swift-app/v1/company/1/roles" \
  -H "Authorization: Bearer {token}"

# 3. Tester création rôle
curl -X POST "https://altivo.fr/swift-app/v1/company/1/roles" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"test_role","display_name":"Test Role","permissions":["jobs.read"]}'
```

---

## 📞 Contact

**Questions Frontend :** L'équipe frontend est disponible pour clarifier les formats de données.

**Temps estimé total :** 15-20 heures

---

## 📝 Historique des modifications

| Date | Auteur | Changement |
|------|--------|------------|
| 09/01/2026 | Frontend | Création du document avec spécifications |
| 09/01/2026 | Backend | ✅ Implémentation complète de tous les endpoints |

**Fichiers backend modifiés :**
- `roles.js` - Logique de parsing des IDs dans UPDATE, DELETE et ASSIGN
- `BACKEND_PHASE2_IMPLEMENTATION.md` - Documentation mise à jour avec le bon format

---

**✅ Le système RBAC est maintenant pleinement opérationnel !** 🚀

# Phase 2 - Staff Management Integration

**Date**: 17 janvier 2026  
**Status**: ✅ FRONTEND INTÉGRÉ  
**Backend**: Swift App Server (port 3021)

---

## 📋 Résumé

Cette documentation décrit l'intégration frontend des fonctionnalités Phase 2 :
- **STAFF-02**: Gestion des équipes (Teams)
- **STAFF-03**: Harmonisation des rôles et permissions

---

## 🏢 STAFF-02: Teams Management

### Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `src/services/teamsService.ts` | Service API pour les équipes |
| `src/hooks/useTeams.ts` | Hook React pour la gestion des équipes |

### Nouveaux endpoints utilisés

| Méthode | Endpoint | Fonction |
|---------|----------|----------|
| `GET` | `/v1/teams?business_id={id}` | `fetchTeams()` |
| `POST` | `/v1/teams` | `createTeam()` |
| `GET` | `/v1/teams/:teamId` | `fetchTeamById()` |
| `PUT` | `/v1/teams/:teamId` | `updateTeam()` |
| `DELETE` | `/v1/teams/:teamId` | `deleteTeam()` |
| `POST` | `/v1/teams/:teamId/members` | `addTeamMember()` |
| `DELETE` | `/v1/teams/:teamId/members/:staffId` | `removeTeamMember()` |
| `POST` | `/v1/jobs/:jobId/team` | `assignTeamToJob()` |

### Types TypeScript

```typescript
export interface Team {
  id: number;
  name: string;
  description: string | null;
  color: string;              // Nouveau: couleur hex pour l'affichage
  is_active: boolean;         // Nouveau: flag soft delete
  company_id: number;
  members: TeamMember[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_leader: boolean;         // Nouveau: indique si le membre est chef d'équipe
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  color?: string;             // Défaut: #3B82F6
  company_id: number;
}

export interface AddMemberRequest {
  staff_id: number;
  is_leader?: boolean;
}
```

### Utilisation du hook useTeams

```typescript
import { useTeams } from '@/hooks/useTeams';

function TeamsScreen() {
  const {
    teams,
    isLoading,
    createTeam,
    addMember,
    assignToJob,
    getTeamColor,
    isTeamActive,
  } = useTeams();

  // Créer une équipe
  const handleCreate = async () => {
    const team = await createTeam({
      name: 'Équipe Alpha',
      color: '#3B82F6',
      company_id: 1,
    });
  };

  // Ajouter un membre
  const handleAddMember = async (teamId: number) => {
    await addMember(teamId, 5, false); // staffId=5, isLeader=false
  };

  // Assigner à un job
  const handleAssign = async () => {
    await assignToJob('job-123', 1);
  };
}
```

---

## 🔐 STAFF-03: Roles & Permissions

### Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `src/services/rolesService.ts` | Service API pour les rôles et permissions |
| `src/hooks/usePermissions.ts` | Hook React pour vérifier les permissions |

### Nouveaux endpoints utilisés

| Méthode | Endpoint | Fonction |
|---------|----------|----------|
| `GET` | `/v1/roles?business_id={id}` | `fetchRoles()` |
| `GET` | `/v1/users/:userId/permissions?business_id={id}` | `fetchUserPermissions()` |
| `PUT` | `/v1/users/:userId/role` | `assignRoleToUser()` |
| `POST` | `/v1/permissions/check` | `checkPermission()` |

### Rôles système

| Code | Nom | Description |
|------|-----|-------------|
| `owner` | Propriétaire | Accès complet (wildcard `*`) |
| `admin` | Administrateur | Gestion complète sauf suppression compte |
| `manager` | Gestionnaire | Gestion jobs/staff, pas les settings business |
| `technician` | Technicien | Accès limité aux jobs assignés |
| `viewer` | Lecture seule | Voir uniquement |
| `supervisor` | Superviseur (legacy) | Voir et modifier jobs assignés |
| `mover` | Déménageur (legacy) | Voir jobs, mettre à jour statut |

### Permissions disponibles

```typescript
export const AVAILABLE_PERMISSIONS = [
  // Business
  'business.view', 'business.edit',
  // Staff
  'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.assign_role',
  // Jobs
  'jobs.view_all', 'jobs.view_assigned', 'jobs.create', 'jobs.edit', 
  'jobs.delete', 'jobs.assign_staff', 'jobs.complete',
  // Vehicles
  'vehicles.view', 'vehicles.manage',
  // Payments
  'payments.view', 'payments.process',
  // Reports
  'reports.view', 'reports.export',
  // Teams
  'teams.view', 'teams.manage',
];
```

### Utilisation du hook usePermissions

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function ProtectedComponent() {
  const {
    hasPermission,
    hasAnyPermission,
    isOwner,
    isAdmin,
    isManager,
    isTechnician,
    canManageStaff,
    canManageJobs,
    canManageTeams,
    canProcessPayments,
    checkPermissionAsync,
  } = usePermissions();

  // Vérification synchrone (cache local)
  if (!hasPermission('jobs.create')) {
    return <Text>Accès refusé</Text>;
  }

  // Vérification asynchrone (API - plus précise)
  const verifyAccess = async () => {
    const canCreate = await checkPermissionAsync('jobs.create');
    // ...
  };

  // Helpers pratiques
  if (canManageStaff) {
    // Afficher les options de gestion du personnel
  }

  return <JobCreationForm />;
}
```

### Matrice des permissions

| Permission | owner | admin | manager | technician | viewer |
|------------|:-----:|:-----:|:-------:|:----------:|:------:|
| `business.view` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `business.edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `staff.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `staff.create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `staff.edit` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `staff.delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `jobs.view_all` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `jobs.view_assigned` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `jobs.create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `jobs.edit` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `jobs.complete` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `payments.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `payments.process` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `teams.view` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `teams.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🔄 Migration

### Anciens endpoints (conservés pour rétrocompatibilité)

Ces endpoints fonctionnent toujours :
- `GET /v1/company/:companyId/teams`
- `POST /v1/company/:companyId/teams`
- `PATCH /v1/staff/:staffId/role`

### Nouvelles fonctions

| Ancienne | Nouvelle | Notes |
|----------|----------|-------|
| `assignRoleToStaff()` | `assignRoleToUser()` | L'ancienne fonction appelle la nouvelle |
| - | `checkPermission()` | Vérification API des permissions |
| - | `fetchUserPermissions()` | Récupère les permissions d'un user |
| - | `addTeamMember()` | Ajout individuel de membre |
| - | `unassignTeamFromJob()` | Retirer une équipe d'un job |

---

## ⚠️ Notes importantes

1. **business_id requis**: Tous les endpoints nécessitent `business_id` en query param
2. **Soft delete**: Les équipes supprimées ont `is_active = false`
3. **Wildcard permission**: Le rôle `owner` a `*` qui bypass toutes les vérifications
4. **Rôles legacy**: `supervisor` et `mover` conservés pour rétrocompatibilité

---

## ✅ Checklist d'intégration

- [x] `teamsService.ts` mis à jour avec nouveaux endpoints
- [x] `rolesService.ts` mis à jour avec nouveaux endpoints  
- [x] `useTeams.ts` hook mis à jour
- [x] `usePermissions.ts` hook mis à jour
- [x] Types TypeScript harmonisés
- [x] Fonctions de compatibilité descendante ajoutées
- [x] Documentation créée

---

**Intégré par**: GitHub Copilot  
**Date**: 17 janvier 2026

/**
 * Permissions Components
 * Phase 2 - STAFF-03
 */

export {
    AdminOnly, CanCreateJob,
    CanManageStaff,
    CanManageTeams,
    CanProcessPayments, ManagerOnly, OwnerOnly, PermissionGate
} from './PermissionGate';

export type { PermissionGateProps } from './PermissionGate';

export {
    RoleBadge,
    RoleIndicator,
    RoleList,
    getRoleColor,
    getRoleIcon
} from './RoleBadge';

export type {
    RoleBadgeProps,
    RoleIndicatorProps,
    RoleListProps
} from './RoleBadge';


/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 * @module components/PermissionGate
 */

import React, { ReactNode } from 'react';
import { usePermissionsContext } from '../contexts/PermissionsContext';

// ============================================================================
// Types
// ============================================================================

interface PermissionGateProps {
  /**
   * Single permission or array of permissions to check
   */
  permission: string | string[];
  
  /**
   * If true, requires ALL permissions (AND). If false, requires ANY permission (OR).
   * Default: false (OR)
   */
  requireAll?: boolean;
  
  /**
   * Content to render if permission check passes
   */
  children: ReactNode;
  
  /**
   * Content to render if permission check fails
   * Default: null (nothing rendered)
   */
  fallback?: ReactNode;
  
  /**
   * If true, inverts the permission check (renders if user DOESN'T have permission)
   * Default: false
   */
  invert?: boolean;
}

interface RoleOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
  invert = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isInitialized } = usePermissionsContext();
  
  // Don't render anything until permissions are loaded
  if (!isInitialized) {
    return null;
  }
  
  // Determine if user has required permission(s)
  let hasAccess: boolean;
  
  if (Array.isArray(permission)) {
    hasAccess = requireAll 
      ? hasAllPermissions(permission) 
      : hasAnyPermission(permission);
  } else {
    hasAccess = hasPermission(permission);
  }
  
  // Apply inversion if requested
  if (invert) {
    hasAccess = !hasAccess;
  }
  
  // Render based on access
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// Specialized Components
// ============================================================================

/**
 * Only renders for owners
 */
export function OwnerOnly({ children, fallback = null }: RoleOnlyProps) {
  const { isOwner, isInitialized } = usePermissionsContext();
  
  if (!isInitialized) return null;
  return isOwner ? <>{children}</> : <>{fallback}</>;
}

/**
 * Only renders for admins (includes owner)
 */
export function AdminOnly({ children, fallback = null }: RoleOnlyProps) {
  const { isAdmin, isInitialized } = usePermissionsContext();
  
  if (!isInitialized) return null;
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

/**
 * Only renders for managers (includes admin and owner)
 */
export function ManagerOnly({ children, fallback = null }: RoleOnlyProps) {
  const { isManager, isInitialized } = usePermissionsContext();
  
  if (!isInitialized) return null;
  return isManager ? <>{children}</> : <>{fallback}</>;
}

/**
 * Renders if user can read jobs
 */
export function CanReadJobs({ children, fallback = null }: RoleOnlyProps) {
  return <PermissionGate permission="jobs.read" fallback={fallback}>{children}</PermissionGate>;
}

/**
 * Renders if user can write jobs
 */
export function CanWriteJobs({ children, fallback = null }: RoleOnlyProps) {
  return <PermissionGate permission="jobs.write" fallback={fallback}>{children}</PermissionGate>;
}

/**
 * Renders if user can delete jobs
 */
export function CanDeleteJobs({ children, fallback = null }: RoleOnlyProps) {
  return <PermissionGate permission="jobs.delete" fallback={fallback}>{children}</PermissionGate>;
}

/**
 * Renders if user can manage staff
 */
export function CanManageStaff({ children, fallback = null }: RoleOnlyProps) {
  return <PermissionGate permission={['staff.write', 'staff.delete', 'staff.invite']} fallback={fallback}>{children}</PermissionGate>;
}

/**
 * Renders if user can manage settings
 */
export function CanManageSettings({ children, fallback = null }: RoleOnlyProps) {
  return <PermissionGate permission="settings.write" fallback={fallback}>{children}</PermissionGate>;
}

/**
 * Renders if user can manage roles
 */
export function CanManageRoles({ children, fallback = null }: RoleOnlyProps) {
  return <PermissionGate permission="roles.write" fallback={fallback}>{children}</PermissionGate>;
}

export default PermissionGate;

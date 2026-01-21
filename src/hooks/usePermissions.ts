/**
 * usePermissions Hook
 * React hook for checking user permissions
 * Phase 2 - STAFF-03 Implementation
 * @module hooks/usePermissions
 * @updated 2026-01-17 - Aligned with new v1 endpoints
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    PermissionScope,
    UserPermissions,
    checkPermission as checkPermissionApi,
    fetchMyPermissions,
    getRoleDisplayName,
    hasWildcardPermission,
} from '../services/rolesService';

// ============================================================================
// Types
// ============================================================================

interface UsePermissionsState {
  permissions: UserPermissions | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface UsePermissionsReturn extends UsePermissionsState {
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  checkPermissionAsync: (permission: string) => Promise<boolean>;
  
  // Role info
  roleName: string | null;
  roleDisplayName: string | null;
  scope: PermissionScope;
  
  // Restrictions
  hasRestrictions: boolean;
  getRestriction: (resource: string) => { filter: string; allowed_actions: string[] } | null;
  
  // Actions
  refreshPermissions: () => Promise<void>;
  clearError: () => void;
  
  // Helpers
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTechnician: boolean;
  isViewer: boolean;
  canManageStaff: boolean;
  canManageJobs: boolean;
  canManageTeams: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
  canProcessPayments: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePermissions(): UsePermissionsReturn {
  const [state, setState] = useState<UsePermissionsState>({
    permissions: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  });

  // ---------------------------------------------------------------------------
  // Fetch Permissions
  // ---------------------------------------------------------------------------

  const loadPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permissions = await fetchMyPermissions();
      setState({
        permissions,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load permissions';
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        error: message,
      }));
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  // ---------------------------------------------------------------------------
  // Permission Checks
  // ---------------------------------------------------------------------------

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.permissions) return false;
    
    // Check for wildcard (owner has all permissions)
    if (hasWildcardPermission(state.permissions.permissions)) {
      return true;
    }
    
    return state.permissions.permissions.includes(permission);
  }, [state.permissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

  /**
   * Check permission via API (more accurate but async)
   */
  const checkPermissionAsync = useCallback(async (permission: string): Promise<boolean> => {
    if (!state.permissions?.user_id) return false;
    try {
      return await checkPermissionApi(state.permissions.user_id, permission);
    } catch {
      // Fallback to local check
      return hasPermission(permission);
    }
  }, [state.permissions?.user_id, hasPermission]);

  // ---------------------------------------------------------------------------
  // Role Info
  // ---------------------------------------------------------------------------

  const roleName = useMemo(() => {
    // API returns role as string code (e.g., 'owner', 'admin', 'manager')
    const role = state.permissions?.role;
    return role ?? null;
  }, [state.permissions]);

  const roleDisplayName = useMemo(() => {
    if (!roleName) return null;
    return getRoleDisplayName(roleName);
  }, [roleName]);

  const scope = useMemo((): PermissionScope => {
    return state.permissions?.scope ?? 'all';
  }, [state.permissions]);

  // ---------------------------------------------------------------------------
  // Restrictions
  // ---------------------------------------------------------------------------

  const hasRestrictions = useMemo(() => {
    return state.permissions?.restrictions !== null && 
           state.permissions?.restrictions !== undefined &&
           Object.keys(state.permissions.restrictions).length > 0;
  }, [state.permissions]);

  const getRestriction = useCallback((resource: string) => {
    if (!state.permissions?.restrictions) return null;
    return state.permissions.restrictions[resource] ?? null;
  }, [state.permissions]);

  // ---------------------------------------------------------------------------
  // Helper Booleans
  // ---------------------------------------------------------------------------

  const isOwner = useMemo(() => {
    return roleName === 'owner' || 
           state.permissions?.is_owner === true ||
           hasWildcardPermission(state.permissions?.permissions ?? []);
  }, [roleName, state.permissions]);

  const isAdmin = useMemo(() => {
    return roleName === 'admin' || isOwner;
  }, [roleName, isOwner]);

  const isManager = useMemo(() => {
    return roleName === 'manager' || isAdmin;
  }, [roleName, isAdmin]);

  const isTechnician = useMemo(() => {
    return roleName === 'technician';
  }, [roleName]);

  const isViewer = useMemo(() => {
    return roleName === 'viewer';
  }, [roleName]);

  const canManageStaff = useMemo(() => {
    return hasAnyPermission(['staff.create', 'staff.edit', 'staff.delete', 'staff.assign_role']);
  }, [hasAnyPermission]);

  const canManageJobs = useMemo(() => {
    return hasAnyPermission(['jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.assign_staff']);
  }, [hasAnyPermission]);

  const canManageTeams = useMemo(() => {
    return hasPermission('teams.manage');
  }, [hasPermission]);

  const canManageSettings = useMemo(() => {
    return hasPermission('business.edit');
  }, [hasPermission]);

  const canViewReports = useMemo(() => {
    return hasPermission('reports.view');
  }, [hasPermission]);

  const canProcessPayments = useMemo(() => {
    return hasPermission('payments.process');
  }, [hasPermission]);

  // ---------------------------------------------------------------------------
  // Error Handling
  // ---------------------------------------------------------------------------

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ---------------------------------------------------------------------------
  // Initial Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    permissions: state.permissions,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionAsync,
    
    // Role info
    roleName,
    roleDisplayName,
    scope,
    
    // Restrictions
    hasRestrictions,
    getRestriction,
    
    // Actions
    refreshPermissions,
    clearError,
    
    // Helpers
    isOwner,
    isAdmin,
    isManager,
    isTechnician,
    isViewer,
    canManageStaff,
    canManageJobs,
    canManageTeams,
    canManageSettings,
    canViewReports,
    canProcessPayments,
  };
}

export default usePermissions;

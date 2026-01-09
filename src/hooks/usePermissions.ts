/**
 * usePermissions Hook
 * React hook for checking user permissions
 * @module hooks/usePermissions
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    PermissionScope,
    UserPermissions,
    fetchMyPermissions,
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
  canManageStaff: boolean;
  canManageJobs: boolean;
  canManageSettings: boolean;
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

  // ---------------------------------------------------------------------------
  // Role Info
  // ---------------------------------------------------------------------------

  const roleName = useMemo(() => {
    return state.permissions?.role?.name ?? null;
  }, [state.permissions]);

  const roleDisplayName = useMemo(() => {
    return state.permissions?.role?.display_name ?? null;
  }, [state.permissions]);

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
    return roleName === 'owner' || hasWildcardPermission(state.permissions?.permissions ?? []);
  }, [roleName, state.permissions]);

  const isAdmin = useMemo(() => {
    return roleName === 'admin' || isOwner;
  }, [roleName, isOwner]);

  const isManager = useMemo(() => {
    return roleName === 'manager' || isAdmin;
  }, [roleName, isAdmin]);

  const canManageStaff = useMemo(() => {
    return hasAnyPermission(['staff.write', 'staff.delete', 'staff.invite']);
  }, [hasAnyPermission]);

  const canManageJobs = useMemo(() => {
    return hasAnyPermission(['jobs.write', 'jobs.delete', 'jobs.assign']);
  }, [hasAnyPermission]);

  const canManageSettings = useMemo(() => {
    return hasPermission('settings.write');
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
    canManageStaff,
    canManageJobs,
    canManageSettings,
  };
}

export default usePermissions;

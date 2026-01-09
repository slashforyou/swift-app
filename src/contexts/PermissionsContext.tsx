/**
 * PermissionsContext
 * Global context for user permissions
 * @module contexts/PermissionsContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  UserPermissions,
  PermissionScope,
  fetchMyPermissions,
  hasWildcardPermission,
} from '../services/rolesService';

// ============================================================================
// Types
// ============================================================================

interface PermissionsContextState {
  permissions: UserPermissions | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface PermissionsContextValue extends PermissionsContextState {
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Role info
  roleName: string | null;
  roleDisplayName: string | null;
  scope: PermissionScope;
  
  // Actions
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;
  
  // Helpers
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

// ============================================================================
// Context
// ============================================================================

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface PermissionsProviderProps {
  children: ReactNode;
  autoLoad?: boolean;
}

export function PermissionsProvider({ children, autoLoad = true }: PermissionsProviderProps) {
  const [state, setState] = useState<PermissionsContextState>({
    permissions: null,
    isLoading: false,
    isInitialized: false,
    error: null,
  });

  // ---------------------------------------------------------------------------
  // Load Permissions
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

  const clearPermissions = useCallback(() => {
    setState({
      permissions: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Permission Checks
  // ---------------------------------------------------------------------------

  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.permissions) return false;
    
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
  // Computed Values
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

  const isOwner = useMemo(() => {
    return roleName === 'owner' || hasWildcardPermission(state.permissions?.permissions ?? []);
  }, [roleName, state.permissions]);

  const isAdmin = useMemo(() => {
    return roleName === 'admin' || isOwner;
  }, [roleName, isOwner]);

  const isManager = useMemo(() => {
    return roleName === 'manager' || isAdmin;
  }, [roleName, isAdmin]);

  // ---------------------------------------------------------------------------
  // Auto Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (autoLoad) {
      loadPermissions();
    }
  }, [autoLoad, loadPermissions]);

  // ---------------------------------------------------------------------------
  // Context Value
  // ---------------------------------------------------------------------------

  const value: PermissionsContextValue = useMemo(() => ({
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
    
    // Actions
    refreshPermissions,
    clearPermissions,
    
    // Helpers
    isOwner,
    isAdmin,
    isManager,
  }), [
    state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    roleName,
    roleDisplayName,
    scope,
    refreshPermissions,
    clearPermissions,
    isOwner,
    isAdmin,
    isManager,
  ]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePermissionsContext(): PermissionsContextValue {
  const context = useContext(PermissionsContext);
  
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  
  return context;
}

export default PermissionsContext;

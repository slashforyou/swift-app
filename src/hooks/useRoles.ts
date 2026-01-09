/**
 * useRoles Hook
 * React hook for role management with state handling
 * @module hooks/useRoles
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  fetchRoles,
  createRole as createRoleApi,
  updateRole as updateRoleApi,
  deleteRole as deleteRoleApi,
  assignRoleToStaff as assignRoleToStaffApi,
  getSystemRoles,
  getCustomRoles,
  getEditableRoles,
} from '../services/rolesService';

// ============================================================================
// Types
// ============================================================================

interface UseRolesState {
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseRolesReturn extends UseRolesState {
  // Computed
  systemRoles: Role[];
  customRoles: Role[];
  editableRoles: Role[];
  
  // Fetch operations
  loadRoles: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  
  // CRUD operations
  createRole: (data: CreateRoleRequest) => Promise<Role | null>;
  updateRole: (roleId: string, data: UpdateRoleRequest) => Promise<Role | null>;
  deleteRole: (roleId: string, fallbackRole?: string) => Promise<boolean>;
  
  // Staff assignment
  assignToStaff: (staffId: string | number, roleId: string | number) => Promise<boolean>;
  
  // Selection
  selectRole: (role: Role | null) => void;
  getRoleById: (roleId: string) => Role | undefined;
  getRoleByName: (name: string) => Role | undefined;
  
  // Helpers
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRoles(): UseRolesReturn {
  const [state, setState] = useState<UseRolesState>({
    roles: [],
    selectedRole: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
  });

  // ---------------------------------------------------------------------------
  // Computed Properties
  // ---------------------------------------------------------------------------

  const systemRoles = getSystemRoles(state.roles);
  const customRoles = getCustomRoles(state.roles);
  const editableRoles = getEditableRoles(state.roles);

  // ---------------------------------------------------------------------------
  // Fetch Operations
  // ---------------------------------------------------------------------------

  const loadRoles = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const roles = await fetchRoles();
      setState(prev => ({
        ...prev,
        roles,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load roles';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      const roles = await fetchRoles();
      setState(prev => ({
        ...prev,
        roles,
        isRefreshing: false,
      }));
    } catch {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  const createRole = useCallback(async (data: CreateRoleRequest): Promise<Role | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const role = await createRoleApi(data);
      setState(prev => ({
        ...prev,
        roles: [...prev.roles, role],
        isLoading: false,
      }));
      return role;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create role';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const updateRole = useCallback(async (roleId: string, data: UpdateRoleRequest): Promise<Role | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedRole = await updateRoleApi(roleId, data);
      setState(prev => ({
        ...prev,
        roles: prev.roles.map(r => r.id === roleId ? updatedRole : r),
        selectedRole: prev.selectedRole?.id === roleId ? updatedRole : prev.selectedRole,
        isLoading: false,
      }));
      return updatedRole;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const deleteRole = useCallback(async (roleId: string, fallbackRole?: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await deleteRoleApi(roleId, fallbackRole);
      setState(prev => ({
        ...prev,
        roles: prev.roles.filter(r => r.id !== roleId),
        selectedRole: prev.selectedRole?.id === roleId ? null : prev.selectedRole,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete role';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Staff Assignment
  // ---------------------------------------------------------------------------

  const assignToStaff = useCallback(async (staffId: string | number, roleId: string | number): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await assignRoleToStaffApi(staffId, roleId);
      // Refresh roles to update staff_count
      await refreshRoles();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign role';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, [refreshRoles]);

  // ---------------------------------------------------------------------------
  // Selection & Helpers
  // ---------------------------------------------------------------------------

  const selectRole = useCallback((role: Role | null) => {
    setState(prev => ({ ...prev, selectedRole: role }));
  }, []);

  const getRoleById = useCallback((roleId: string): Role | undefined => {
    return state.roles.find(r => r.id === roleId);
  }, [state.roles]);

  const getRoleByName = useCallback((name: string): Role | undefined => {
    return state.roles.find(r => r.name === name);
  }, [state.roles]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ---------------------------------------------------------------------------
  // Initial Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    roles: state.roles,
    selectedRole: state.selectedRole,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    
    // Computed
    systemRoles,
    customRoles,
    editableRoles,
    
    // Fetch operations
    loadRoles,
    refreshRoles,
    
    // CRUD operations
    createRole,
    updateRole,
    deleteRole,
    
    // Staff assignment
    assignToStaff,
    
    // Selection & helpers
    selectRole,
    getRoleById,
    getRoleByName,
    clearError,
  };
}

export default useRoles;

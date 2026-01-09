/**
 * Roles Service
 * CRUD operations for role management (RBAC)
 * @module services/rolesService
 */

import { ServerData } from '../constants/ServerData';
import { fetchWithAuth } from '../utils/session';
import { fetchUserProfile } from './user';

// ============================================================================
// Types
// ============================================================================

export type PermissionScope = 'all' | 'team' | 'assigned';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  is_editable: boolean;
  permissions: string[];
  scope: PermissionScope;
  staff_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  scope?: PermissionScope;
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  permissions?: string[];
  scope?: PermissionScope;
}

export interface RolesListResponse {
  success: boolean;
  roles: Role[];
}

export interface RoleResponse {
  success: boolean;
  message?: string;
  role: Role;
}

export interface UserPermissions {
  success: boolean;
  user_id: number;
  role: {
    id: string;
    name: string;
    display_name: string;
  } | null;
  permissions: string[];
  scope: PermissionScope;
  restrictions: Record<string, {
    filter: string;
    allowed_actions: string[];
  }> | null;
}

export interface AssignRoleResponse {
  success: boolean;
  message?: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: {
      id: string;
      name: string;
      display_name: string;
    };
  };
}

// ============================================================================
// Available Permissions (Reference)
// ============================================================================

export const AVAILABLE_PERMISSIONS = [
  // Jobs
  'jobs.read',
  'jobs.write',
  'jobs.delete',
  'jobs.assign',
  // Staff
  'staff.read',
  'staff.write',
  'staff.delete',
  'staff.invite',
  // Vehicles
  'vehicles.read',
  'vehicles.write',
  'vehicles.delete',
  // Clients
  'clients.read',
  'clients.write',
  'clients.delete',
  // Payments
  'payments.read',
  'payments.write',
  // Invoices
  'invoices.read',
  'invoices.write',
  // Settings
  'settings.read',
  'settings.write',
  // Teams
  'teams.read',
  'teams.write',
  // Roles
  'roles.read',
  'roles.write',
] as const;

export type Permission = typeof AVAILABLE_PERMISSIONS[number];

export const PERMISSION_CATEGORIES = {
  jobs: ['jobs.read', 'jobs.write', 'jobs.delete', 'jobs.assign'],
  staff: ['staff.read', 'staff.write', 'staff.delete', 'staff.invite'],
  vehicles: ['vehicles.read', 'vehicles.write', 'vehicles.delete'],
  clients: ['clients.read', 'clients.write', 'clients.delete'],
  payments: ['payments.read', 'payments.write'],
  invoices: ['invoices.read', 'invoices.write'],
  settings: ['settings.read', 'settings.write'],
  teams: ['teams.read', 'teams.write'],
  roles: ['roles.read', 'roles.write'],
} as const;

// ============================================================================
// Helper to get Company ID
// ============================================================================

async function getCompanyId(): Promise<string> {
  const profile = await fetchUserProfile();
  const userId = profile.id.toString();
  
  if (userId === '15') {
    return '1';
  }
  
  return userId;
}

// ============================================================================
// API Functions - Roles
// ============================================================================

/**
 * Fetch all roles for a company
 */
export async function fetchRoles(): Promise<Role[]> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const url = `${ServerData.serverUrl}v1/company/${companyId}/roles`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch roles');
  }

  return data.roles;
}

/**
 * Create a new custom role
 */
export async function createRole(request: CreateRoleRequest): Promise<Role> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  if (!request.name || request.name.trim() === '') {
    throw new Error('Role name is required');
  }

  if (!request.permissions || request.permissions.length === 0) {
    throw new Error('At least one permission is required');
  }

  const url = `${ServerData.serverUrl}v1/company/${companyId}/roles`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to create role');
  }

  return data.role;
}

/**
 * Update an existing role
 */
export async function updateRole(roleId: string, request: UpdateRoleRequest): Promise<Role> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const url = `${ServerData.serverUrl}v1/company/${companyId}/roles/${roleId}`;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to update role');
  }

  return data.role;
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string, fallbackRole?: string, permanent = false): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const params = new URLSearchParams();
  if (fallbackRole) params.append('fallback_role', fallbackRole);
  if (permanent) params.append('permanent', 'true');
  
  const queryString = params.toString();
  const url = `${ServerData.serverUrl}v1/company/${companyId}/roles/${roleId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetchWithAuth(url, { method: 'DELETE' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete role');
  }
}

// ============================================================================
// API Functions - Staff Role Assignment
// ============================================================================

/**
 * Assign a role to a staff member
 */
export async function assignRoleToStaff(staffId: string | number, roleId: string | number): Promise<AssignRoleResponse['staff']> {
  const url = `${ServerData.serverUrl}v1/staff/${staffId}/role`;
  const response = await fetchWithAuth(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role_id: roleId }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to assign role');
  }

  return data.staff;
}

// ============================================================================
// API Functions - User Permissions
// ============================================================================

/**
 * Get current user's permissions
 */
export async function fetchMyPermissions(): Promise<UserPermissions> {
  const url = `${ServerData.serverUrl}v1/users/me/permissions`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch permissions');
  }

  return data;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a permission is valid
 */
export function isValidPermission(permission: string): boolean {
  return AVAILABLE_PERMISSIONS.includes(permission as Permission);
}

/**
 * Get permissions by category
 */
export function getPermissionsByCategory(category: keyof typeof PERMISSION_CATEGORIES): readonly string[] {
  return PERMISSION_CATEGORIES[category] || [];
}

/**
 * Get category for a permission
 */
export function getPermissionCategory(permission: string): string | null {
  for (const [category, permissions] of Object.entries(PERMISSION_CATEGORIES)) {
    if (permissions.includes(permission as never)) {
      return category;
    }
  }
  return null;
}

/**
 * Get display name for a permission
 */
export function getPermissionDisplayName(permission: string): string {
  const parts = permission.split('.');
  if (parts.length !== 2) return permission;
  
  const [category, action] = parts;
  const categoryNames: Record<string, string> = {
    jobs: 'Jobs',
    staff: 'Personnel',
    vehicles: 'Véhicules',
    clients: 'Clients',
    payments: 'Paiements',
    invoices: 'Factures',
    settings: 'Paramètres',
    teams: 'Équipes',
    roles: 'Rôles',
  };
  
  const actionNames: Record<string, string> = {
    read: 'Voir',
    write: 'Modifier',
    delete: 'Supprimer',
    assign: 'Assigner',
    invite: 'Inviter',
  };
  
  return `${actionNames[action] || action} ${categoryNames[category] || category}`;
}

/**
 * Check if user has wildcard permission
 */
export function hasWildcardPermission(permissions: string[]): boolean {
  return permissions.includes('*');
}

/**
 * Get role by name from list
 */
export function getRoleByName(roles: Role[], name: string): Role | undefined {
  return roles.find(r => r.name === name);
}

/**
 * Get system roles
 */
export function getSystemRoles(roles: Role[]): Role[] {
  return roles.filter(r => r.is_system);
}

/**
 * Get custom roles
 */
export function getCustomRoles(roles: Role[]): Role[] {
  return roles.filter(r => !r.is_system);
}

/**
 * Get editable roles
 */
export function getEditableRoles(roles: Role[]): Role[] {
  return roles.filter(r => r.is_editable);
}

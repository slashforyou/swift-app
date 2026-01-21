/**
 * Roles & Permissions Service
 * CRUD operations for role management (RBAC)
 * Phase 2 - STAFF-03 Implementation
 * @module services/rolesService
 * @updated 2026-01-17 - Aligned with new v1 endpoints
 */

import { ServerData } from '../constants/ServerData';
import { fetchWithAuth } from '../utils/session';
import { fetchUserProfile } from './user';

// ============================================================================
// Types
// ============================================================================

export type PermissionScope = 'all' | 'team' | 'assigned';

export type SystemRoleCode = 'owner' | 'admin' | 'manager' | 'technician' | 'viewer' | 'supervisor' | 'mover';

export interface Role {
  id: string;
  code: SystemRoleCode | string; // System role code
  name: string;
  display_name?: string;
  description?: string;
  is_system: boolean;
  is_editable?: boolean;
  permissions: string[];
  scope?: PermissionScope;
  staff_count?: number;
  created_at?: string;
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
  role: string; // Role code: 'owner', 'admin', 'manager', etc.
  permissions: string[];
  is_owner: boolean;
  scope?: PermissionScope;
  restrictions?: Record<string, {
    filter: string;
    allowed_actions: string[];
  }> | null;
}

export interface AssignRoleRequest {
  role: SystemRoleCode | string;
  business_id: number;
}

export interface AssignRoleResponse {
  success: boolean;
  message?: string;
  data: {
    user_id: number;
    role: string;
    permissions: string[];
  };
}

export interface CheckPermissionRequest {
  user_id: number;
  permission: string;
  business_id: number;
}

export interface CheckPermissionResponse {
  success: boolean;
  data: {
    has_permission: boolean;
    user_id: number;
    permission: string;
    role: string;
  };
}

// ============================================================================
// Available Permissions (Reference) - Phase 2 STAFF-03
// ============================================================================

export const AVAILABLE_PERMISSIONS = [
  // Business
  'business.view',
  'business.edit',
  // Staff
  'staff.view',
  'staff.create',
  'staff.edit',
  'staff.delete',
  'staff.assign_role',
  // Jobs
  'jobs.view_all',
  'jobs.view_assigned',
  'jobs.create',
  'jobs.edit',
  'jobs.delete',
  'jobs.assign_staff',
  'jobs.complete',
  // Vehicles
  'vehicles.view',
  'vehicles.manage',
  // Payments
  'payments.view',
  'payments.process',
  // Reports
  'reports.view',
  'reports.export',
  // Teams
  'teams.view',
  'teams.manage',
] as const;

export type Permission = typeof AVAILABLE_PERMISSIONS[number];

export const PERMISSION_CATEGORIES = {
  business: ['business.view', 'business.edit'],
  staff: ['staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.assign_role'],
  jobs: ['jobs.view_all', 'jobs.view_assigned', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.assign_staff', 'jobs.complete'],
  vehicles: ['vehicles.view', 'vehicles.manage'],
  payments: ['payments.view', 'payments.process'],
  reports: ['reports.view', 'reports.export'],
  teams: ['teams.view', 'teams.manage'],
} as const;

// Permission matrix by role (reference - backend is source of truth)
export const ROLE_PERMISSIONS: Record<SystemRoleCode, string[]> = {
  owner: ['*'], // Wildcard - all permissions
  admin: [
    'business.view', 'business.edit',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.assign_role',
    'jobs.view_all', 'jobs.view_assigned', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.assign_staff', 'jobs.complete',
    'vehicles.view', 'vehicles.manage',
    'payments.view', 'payments.process',
    'reports.view', 'reports.export',
    'teams.view', 'teams.manage',
  ],
  manager: [
    'staff.view', 'staff.create', 'staff.edit',
    'jobs.view_all', 'jobs.view_assigned', 'jobs.create', 'jobs.edit', 'jobs.assign_staff', 'jobs.complete',
    'vehicles.view', 'vehicles.manage',
    'payments.view',
    'reports.view', 'reports.export',
    'teams.view', 'teams.manage',
  ],
  technician: [
    'jobs.view_assigned', 'jobs.edit', 'jobs.complete',
    'vehicles.view',
    'teams.view',
  ],
  viewer: [
    'jobs.view_all', 'jobs.view_assigned',
    'reports.view',
  ],
  supervisor: [ // Legacy role
    'jobs.view_assigned', 'jobs.edit', 'jobs.complete',
    'vehicles.view',
  ],
  mover: [ // Legacy role
    'jobs.view_assigned', 'jobs.complete',
  ],
};

// ============================================================================
// Helper to get Business ID
// ============================================================================

async function getBusinessId(): Promise<number> {
  const profile = await fetchUserProfile();
  const userId = profile.id;
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  
  // TEMPORAIRE: D'après les données, l'utilisateur 15 est lié à Business ID: 1
  if (userIdNum === 15) {
    return 1;
  }
  
  return userIdNum;
}

// ============================================================================
// API Functions - Roles (New v1 Endpoints)
// ============================================================================

/**
 * Fetch all roles for a business
 * GET /v1/roles?business_id={id}
 */
export async function fetchRoles(): Promise<Role[]> {
  const businessId = await getBusinessId();

  const url = `${ServerData.serverUrl}v1/roles?business_id=${businessId}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch roles');
  }

  return data.data?.roles ?? data.roles;
}

/**
 * Create a new custom role
 * Note: System roles cannot be created, only custom roles
 * @deprecated Custom role creation not available in Phase 2
 */
export async function createRole(request: CreateRoleRequest): Promise<Role> {
  const businessId = await getBusinessId();

  if (!request.name || request.name.trim() === '') {
    throw new Error('Role name is required');
  }

  if (!request.permissions || request.permissions.length === 0) {
    throw new Error('At least one permission is required');
  }

  const url = `${ServerData.serverUrl}v1/company/${businessId}/roles`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to create role');
  }

  return data.data?.role ?? data.role;
}

/**
 * Update an existing role
 * Note: System roles cannot be modified
 * @deprecated Role modification not available in Phase 2
 */
export async function updateRole(roleId: string, request: UpdateRoleRequest): Promise<Role> {
  const businessId = await getBusinessId();

  const url = `${ServerData.serverUrl}v1/company/${businessId}/roles/${roleId}`;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to update role');
  }

  return data.data?.role ?? data.role;
}

/**
 * Delete a role
 * Note: System roles cannot be deleted
 * @deprecated Role deletion not available in Phase 2
 */
export async function deleteRole(roleId: string, fallbackRole?: string, permanent = false): Promise<void> {
  const businessId = await getBusinessId();

  const params = new URLSearchParams();
  if (fallbackRole) params.append('fallback_role', fallbackRole);
  if (permanent) params.append('permanent', 'true');
  
  const queryString = params.toString();
  const url = `${ServerData.serverUrl}v1/company/${businessId}/roles/${roleId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetchWithAuth(url, { method: 'DELETE' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete role');
  }
}

// ============================================================================
// API Functions - User Permissions (New v1 Endpoints)
// ============================================================================

/**
 * Get user's permissions
 * GET /v1/users/:userId/permissions?business_id={id}
 */
export async function fetchUserPermissions(userId: number): Promise<UserPermissions> {
  const businessId = await getBusinessId();

  const url = `${ServerData.serverUrl}v1/users/${userId}/permissions?business_id=${businessId}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch user permissions');
  }

  return data.data ?? data;
}

/**
 * Get current user's permissions
 */
export async function fetchMyPermissions(): Promise<UserPermissions> {
  const profile = await fetchUserProfile();
  const userId = typeof profile.id === 'string' ? parseInt(profile.id, 10) : profile.id;
  return fetchUserPermissions(userId);
}

/**
 * Assign a role to a user
 * PUT /v1/users/:userId/role
 */
export async function assignRoleToUser(userId: number, role: SystemRoleCode | string): Promise<AssignRoleResponse['data']> {
  const businessId = await getBusinessId();

  const url = `${ServerData.serverUrl}v1/users/${userId}/role`;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, business_id: businessId }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to assign role');
  }

  return data.data;
}

/**
 * Check if a user has a specific permission
 * POST /v1/permissions/check
 */
export async function checkPermission(userId: number, permission: string): Promise<boolean> {
  const businessId = await getBusinessId();

  const url = `${ServerData.serverUrl}v1/permissions/check`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, permission, business_id: businessId }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to check permission');
  }

  return data.data?.has_permission ?? false;
}

// ============================================================================
// Backward Compatibility Functions
// ============================================================================

/**
 * Assign a role to a staff member
 * @deprecated Use assignRoleToUser instead
 */
export async function assignRoleToStaff(staffId: string | number, roleId: string | number): Promise<AssignRoleResponse['data']> {
  const numericId = typeof staffId === 'string' ? parseInt(staffId, 10) : staffId;
  const roleCode = String(roleId);
  return assignRoleToUser(numericId, roleCode);
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
    business: 'Business',
    jobs: 'Jobs',
    staff: 'Personnel',
    vehicles: 'Véhicules',
    payments: 'Paiements',
    reports: 'Rapports',
    teams: 'Équipes',
  };
  
  const actionNames: Record<string, string> = {
    view: 'Voir',
    view_all: 'Voir tout',
    view_assigned: 'Voir assignés',
    edit: 'Modifier',
    create: 'Créer',
    delete: 'Supprimer',
    assign_staff: 'Assigner personnel',
    assign_role: 'Assigner rôle',
    complete: 'Terminer',
    manage: 'Gérer',
    process: 'Traiter',
    export: 'Exporter',
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
/**
 * Get role by code from list
 */
export function getRoleByCode(roles: Role[], code: SystemRoleCode | string): Role | undefined {
  return roles.find(r => r.code === code);
}

/**
 * Check if role is a system role
 */
export function isSystemRole(roleCode: string): boolean {
  const systemRoles: SystemRoleCode[] = ['owner', 'admin', 'manager', 'technician', 'viewer', 'supervisor', 'mover'];
  return systemRoles.includes(roleCode as SystemRoleCode);
}

/**
 * Get role display name by code
 */
export function getRoleDisplayName(roleCode: SystemRoleCode | string): string {
  const roleNames: Record<string, string> = {
    owner: 'Propriétaire',
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    technician: 'Technicien',
    viewer: 'Lecture seule',
    supervisor: 'Superviseur',
    mover: 'Déménageur',
  };
  return roleNames[roleCode] || roleCode;
}

/**
 * Check if a role can perform an action based on local permission matrix
 * Note: For accurate permission check, use checkPermission() API
 */
export function roleHasPermission(roleCode: SystemRoleCode | string, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[roleCode as SystemRoleCode];
  if (!rolePermissions) return false;
  
  // Owner has wildcard permission
  if (rolePermissions.includes('*')) return true;
  
  return rolePermissions.includes(permission);
}
/**
 * Teams Service
 * CRUD operations for team management
 * Phase 2 - STAFF-02 Implementation
 * @module services/teamsService
 * @updated 2026-01-17 - Aligned with new v1 endpoints
 */

import { ServerData } from '../constants/ServerData';
import { fetchWithAuth } from '../utils/session';
import { fetchUserProfile } from './user';

// ============================================================================
// Types
// ============================================================================

export interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string; // 'technician', 'manager', etc.
  is_leader: boolean;
  joined_at?: string;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  color: string; // Hex color for team display
  is_active: boolean; // Soft delete flag
  company_id: number;
  leader_id?: number | null;
  leader?: TeamMember | null;
  members: TeamMember[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  color?: string; // Hex color, defaults to #3B82F6
  company_id?: number; // Optional, will be fetched from user profile if not provided
  leader_id?: number;
  member_ids?: number[];
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  color?: string;
  leader_id?: number | null;
  member_ids?: number[];
}

export interface AddMemberRequest {
  staff_id: number;
  is_leader?: boolean;
}

export interface AssignTeamToJobRequest {
  team_id: number;
}

export interface TeamsListResponse {
  success: boolean;
  teams: Team[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface TeamResponse {
  success: boolean;
  message?: string;
  team: Team;
}

export interface FetchTeamsOptions {
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
}

// ============================================================================
// Helper to get Company ID
// ============================================================================

/**
 * Get company ID from user profile
 */
async function getCompanyId(): Promise<number> {
  const profile = await fetchUserProfile();
  const userId = profile.id;
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  
  // TEMPORAIRE: D'après les données, l'utilisateur 15 est lié à Company ID: 1
  if (userIdNum === 15) {
    return 1;
  }
  
  // Pour d'autres utilisateurs, utiliser l'ancien comportement (user_id = company_id)
  return userIdNum;
}

// ============================================================================
// API Functions - New v1 Endpoints
// ============================================================================

/**
 * Fetch all teams for a company
 * GET /v1/teams?business_id={id}
 */
export async function fetchTeams(options: FetchTeamsOptions = {}): Promise<TeamsListResponse> {
  const companyId = await getCompanyId();

  const params = new URLSearchParams();
  params.append('business_id', companyId.toString());
  if (options.page) params.append('page', options.page.toString());
  if (options.perPage) params.append('per_page', options.perPage.toString());
  if (options.search) params.append('search', options.search);
  if (options.includeDeleted) params.append('include_deleted', 'true');

  const url = `${ServerData.serverUrl}v1/teams?${params.toString()}`;

  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch teams');
  }

  return data;
}

/**
 * Fetch a single team by ID
 * GET /v1/teams/:teamId
 */
export async function fetchTeamById(teamId: number): Promise<Team> {
  const url = `${ServerData.serverUrl}v1/teams/${teamId}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch team');
  }

  return data.data?.team ?? data.team;
}

/**
 * Create a new team
 * POST /v1/teams
 */
export async function createTeam(request: CreateTeamRequest): Promise<Team> {
  const companyId = await getCompanyId();

  if (!request.name || request.name.trim() === '') {
    throw new Error('Team name is required');
  }

  const payload = {
    ...request,
    company_id: request.company_id || companyId,
    color: request.color || '#3B82F6', // Default blue color
  };

  const url = `${ServerData.serverUrl}v1/teams`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to create team');
  }

  return data.data?.team ?? data.team;
}

/**
 * Update an existing team
 * PUT /v1/teams/:teamId
 */
export async function updateTeam(teamId: number, request: UpdateTeamRequest): Promise<Team> {
  const url = `${ServerData.serverUrl}v1/teams/${teamId}`;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to update team');
  }

  return data.data?.team ?? data.team;
}

/**
 * Delete a team (soft delete by default)
 * DELETE /v1/teams/:teamId
 */
export async function deleteTeam(teamId: number, permanent = false): Promise<void> {
  const url = `${ServerData.serverUrl}v1/teams/${teamId}${permanent ? '?permanent=true' : ''}`;
  const response = await fetchWithAuth(url, { method: 'DELETE' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete team');
  }
}

/**
 * Add a member to a team
 * POST /v1/teams/:teamId/members
 */
export async function addTeamMember(teamId: number, staffId: number, isLeader = false): Promise<Team> {
  const url = `${ServerData.serverUrl}v1/teams/${teamId}/members`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staff_id: staffId, is_leader: isLeader }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to add member to team');
  }

  return data.data?.team ?? data.team;
}

/**
 * Remove a member from a team
 * DELETE /v1/teams/:teamId/members/:staffId
 */
export async function removeTeamMember(teamId: number, staffId: number): Promise<Team> {
  const url = `${ServerData.serverUrl}v1/teams/${teamId}/members/${staffId}`;
  const response = await fetchWithAuth(url, { method: 'DELETE' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to remove member from team');
  }

  return data.data?.team ?? data.team;
}

/**
 * Assign a team to a job
 * POST /v1/jobs/:jobId/team
 */
export async function assignTeamToJob(jobId: string | number, teamId: number): Promise<void> {
  const url = `${ServerData.serverUrl}v1/jobs/${jobId}/team`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to assign team to job');
  }
}

/**
 * Unassign a team from a job
 */
export async function unassignTeamFromJob(jobId: string | number): Promise<void> {
  const url = `${ServerData.serverUrl}v1/jobs/${jobId}/team`;
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to unassign team from job');
  }
}

// ============================================================================
// Backward Compatibility Functions
// ============================================================================

/**
 * Add multiple members to a team (convenience wrapper)
 * @deprecated Use addTeamMember for single member addition
 */
export async function addTeamMembers(teamId: number, memberIds: number[]): Promise<Team> {
  let team: Team | null = null;
  for (const memberId of memberIds) {
    team = await addTeamMember(teamId, memberId);
  }
  return team ?? await fetchTeamById(teamId);
}

/**
 * Set team leader (convenience wrapper)
 */
export async function setTeamLeader(teamId: number, leaderId: number | null): Promise<Team> {
  if (leaderId === null) {
    return updateTeam(teamId, { leader_id: null });
  }
  // Add member as leader
  return addTeamMember(teamId, leaderId, true);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get full name of a team member
 */
export function getTeamMemberFullName(member: TeamMember): string {
  return `${member.first_name} ${member.last_name}`.trim();
}

/**
 * Get team leader full name
 */
export function getTeamLeaderName(team: Team): string | null {
  if (!team.leader) return null;
  return getTeamMemberFullName(team.leader);
}

/**
 * Check if a staff member is in a team
 */
export function isStaffInTeam(team: Team, staffId: number): boolean {
  return team.members.some(m => m.id === staffId) || team.leader_id === staffId;
}

/**
 * Get teams that a staff member belongs to
 */
export async function getTeamsForStaff(staffId: number): Promise<Team[]> {
  const { teams } = await fetchTeams();
  return teams.filter(team => isStaffInTeam(team, staffId));
}

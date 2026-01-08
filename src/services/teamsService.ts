/**
 * Teams Service
 * CRUD operations for team management
 * @module services/teamsService
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
  role: 'leader' | 'member';
  joined_at: string;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  leader_id: number | null;
  leader: TeamMember | null;
  members: TeamMember[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  leader_id?: number;
  member_ids?: number[];
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  leader_id?: number | null;
  member_ids?: number[];
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
async function getCompanyId(): Promise<string> {
  const profile = await fetchUserProfile();
  const userId = profile.id.toString();
  
  // TEMPORAIRE: D'après les données, l'utilisateur 15 est lié à Company ID: 1
  if (userId === '15') {
    return '1';
  }
  
  // Pour d'autres utilisateurs, utiliser l'ancien comportement (user_id = company_id)
  return userId;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all teams for a company
 */
export async function fetchTeams(options: FetchTeamsOptions = {}): Promise<TeamsListResponse> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.perPage) params.append('per_page', options.perPage.toString());
  if (options.search) params.append('search', options.search);
  if (options.includeDeleted) params.append('include_deleted', 'true');

  const queryString = params.toString();
  const url = `${ServerData.serverUrl}v1/company/${companyId}/teams${queryString ? `?${queryString}` : ''}`;

  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch teams');
  }

  return data;
}

/**
 * Fetch a single team by ID
 */
export async function fetchTeamById(teamId: number): Promise<Team> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const url = `${ServerData.serverUrl}v1/company/${companyId}/teams/${teamId}`;
  const response = await fetchWithAuth(url, { method: 'GET' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch team');
  }

  return data.team;
}

/**
 * Create a new team
 */
export async function createTeam(request: CreateTeamRequest): Promise<Team> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  if (!request.name || request.name.trim() === '') {
    throw new Error('Team name is required');
  }

  const url = `${ServerData.serverUrl}v1/company/${companyId}/teams`;
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to create team');
  }

  return data.team;
}

/**
 * Update an existing team
 */
export async function updateTeam(teamId: number, request: UpdateTeamRequest): Promise<Team> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const url = `${ServerData.serverUrl}v1/company/${companyId}/teams/${teamId}`;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to update team');
  }

  return data.team;
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: number, permanent = false): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) {
    throw new Error('Company ID not found');
  }

  const url = `${ServerData.serverUrl}v1/company/${companyId}/teams/${teamId}${permanent ? '?permanent=true' : ''}`;
  const response = await fetchWithAuth(url, { method: 'DELETE' });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete team');
  }
}

/**
 * Add members to a team
 */
export async function addTeamMembers(teamId: number, memberIds: number[]): Promise<Team> {
  const team = await fetchTeamById(teamId);
  const existingMemberIds = team.members.map(m => m.id);
  const newMemberIds = [...new Set([...existingMemberIds, ...memberIds])];
  
  return updateTeam(teamId, { member_ids: newMemberIds });
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(teamId: number, memberId: number): Promise<Team> {
  const team = await fetchTeamById(teamId);
  const newMemberIds = team.members
    .map(m => m.id)
    .filter(id => id !== memberId);
  
  return updateTeam(teamId, { member_ids: newMemberIds });
}

/**
 * Set team leader
 */
export async function setTeamLeader(teamId: number, leaderId: number | null): Promise<Team> {
  return updateTeam(teamId, { leader_id: leaderId });
}

/**
 * Assign a team to a job
 */
export async function assignTeamToJob(jobId: string | number, teamId: number | null): Promise<void> {
  const url = `${ServerData.serverUrl}v1/job/${jobId}`;
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigned_team_id: teamId }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to assign team to job');
  }
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

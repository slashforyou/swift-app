/**
 * useTeams Hook
 * React hook for team management with state handling
 * Phase 2 - STAFF-02 Implementation
 * @module hooks/useTeams
 * @updated 2026-01-17 - Aligned with new v1 endpoints
 */

import { useCallback, useEffect, useState } from 'react';
import {
    CreateTeamRequest,
    FetchTeamsOptions,
    Team,
    TeamMember,
    UpdateTeamRequest,
    addTeamMember as addTeamMemberApi,
    addTeamMembers as addTeamMembersApi,
    assignTeamToJob as assignTeamToJobApi,
    createTeam as createTeamApi,
    deleteTeam as deleteTeamApi,
    fetchTeamById,
    fetchTeams,
    getTeamMemberFullName,
    removeTeamMember as removeTeamMemberApi,
    setTeamLeader as setTeamLeaderApi,
    unassignTeamFromJob as unassignTeamFromJobApi,
    updateTeam as updateTeamApi,
} from '../services/teamsService';

// ============================================================================
// Types
// ============================================================================

interface UseTeamsState {
  teams: Team[];
  selectedTeam: Team | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface UseTeamsReturn extends UseTeamsState {
  // Fetch operations
  loadTeams: (options?: FetchTeamsOptions) => Promise<void>;
  loadTeamById: (teamId: number) => Promise<Team | null>;
  refreshTeams: () => Promise<void>;
  
  // CRUD operations
  createTeam: (data: CreateTeamRequest) => Promise<Team | null>;
  updateTeam: (teamId: number, data: UpdateTeamRequest) => Promise<Team | null>;
  deleteTeam: (teamId: number, permanent?: boolean) => Promise<boolean>;
  
  // Member operations
  addMember: (teamId: number, staffId: number, isLeader?: boolean) => Promise<Team | null>;
  addMembers: (teamId: number, memberIds: number[]) => Promise<Team | null>;
  removeMember: (teamId: number, memberId: number) => Promise<Team | null>;
  setLeader: (teamId: number, leaderId: number | null) => Promise<Team | null>;
  
  // Job assignment
  assignToJob: (jobId: string | number, teamId: number) => Promise<boolean>;
  unassignFromJob: (jobId: string | number) => Promise<boolean>;
  
  // Selection
  selectTeam: (team: Team | null) => void;
  
  // Search
  searchTeams: (query: string) => Promise<void>;
  
  // Helpers
  getMemberName: (member: TeamMember) => string;
  getTeamColor: (team: Team) => string;
  isTeamActive: (team: Team) => boolean;
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTeams(): UseTeamsReturn {
  const [state, setState] = useState<UseTeamsState>({
    teams: [],
    selectedTeam: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    pagination: {
      page: 1,
      perPage: 20,
      total: 0,
      totalPages: 0,
    },
  });

  // ---------------------------------------------------------------------------
  // Fetch Operations
  // ---------------------------------------------------------------------------

  const loadTeams = useCallback(async (options: FetchTeamsOptions = {}) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetchTeams(options);
      setState(prev => ({
        ...prev,
        teams: response.teams,
        pagination: {
          page: response.pagination.page,
          perPage: response.pagination.per_page,
          total: response.pagination.total,
          totalPages: response.pagination.total_pages,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load teams';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  const loadTeamById = useCallback(async (teamId: number): Promise<Team | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const team = await fetchTeamById(teamId);
      setState(prev => ({
        ...prev,
        selectedTeam: team,
        isLoading: false,
      }));
      return team;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load team';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const refreshTeams = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      const response = await fetchTeams({
        page: state.pagination.page,
        perPage: state.pagination.perPage,
      });
      setState(prev => ({
        ...prev,
        teams: response.teams,
        pagination: {
          page: response.pagination.page,
          perPage: response.pagination.per_page,
          total: response.pagination.total,
          totalPages: response.pagination.total_pages,
        },
        isRefreshing: false,
      }));
    } catch {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [state.pagination.page, state.pagination.perPage]);

  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  const createTeam = useCallback(async (data: CreateTeamRequest): Promise<Team | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const team = await createTeamApi(data);
      setState(prev => ({
        ...prev,
        teams: [team, ...prev.teams],
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total + 1,
        },
        isLoading: false,
      }));
      return team;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create team';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const updateTeam = useCallback(async (teamId: number, data: UpdateTeamRequest): Promise<Team | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedTeam = await updateTeamApi(teamId, data);
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === teamId ? updatedTeam : t),
        selectedTeam: prev.selectedTeam?.id === teamId ? updatedTeam : prev.selectedTeam,
        isLoading: false,
      }));
      return updatedTeam;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update team';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const deleteTeam = useCallback(async (teamId: number, permanent = false): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await deleteTeamApi(teamId, permanent);
      setState(prev => ({
        ...prev,
        teams: prev.teams.filter(t => t.id !== teamId),
        selectedTeam: prev.selectedTeam?.id === teamId ? null : prev.selectedTeam,
        pagination: {
          ...prev.pagination,
          total: Math.max(0, prev.pagination.total - 1),
        },
        isLoading: false,
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete team';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Member Operations
  // ---------------------------------------------------------------------------

  /**
   * Add a single member to a team
   */
  const addMember = useCallback(async (teamId: number, staffId: number, isLeader = false): Promise<Team | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedTeam = await addTeamMemberApi(teamId, staffId, isLeader);
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === teamId ? updatedTeam : t),
        selectedTeam: prev.selectedTeam?.id === teamId ? updatedTeam : prev.selectedTeam,
        isLoading: false,
      }));
      return updatedTeam;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add member';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  /**
   * Add multiple members to a team
   */
  const addMembers = useCallback(async (teamId: number, memberIds: number[]): Promise<Team | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedTeam = await addTeamMembersApi(teamId, memberIds);
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === teamId ? updatedTeam : t),
        selectedTeam: prev.selectedTeam?.id === teamId ? updatedTeam : prev.selectedTeam,
        isLoading: false,
      }));
      return updatedTeam;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add members';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const removeMember = useCallback(async (teamId: number, memberId: number): Promise<Team | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedTeam = await removeTeamMemberApi(teamId, memberId);
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === teamId ? updatedTeam : t),
        selectedTeam: prev.selectedTeam?.id === teamId ? updatedTeam : prev.selectedTeam,
        isLoading: false,
      }));
      return updatedTeam;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  const setLeader = useCallback(async (teamId: number, leaderId: number | null): Promise<Team | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedTeam = await setTeamLeaderApi(teamId, leaderId);
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === teamId ? updatedTeam : t),
        selectedTeam: prev.selectedTeam?.id === teamId ? updatedTeam : prev.selectedTeam,
        isLoading: false,
      }));
      return updatedTeam;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set leader';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Job Assignment
  // ---------------------------------------------------------------------------

  /**
   * Assign a team to a job
   */
  const assignToJob = useCallback(async (jobId: string | number, teamId: number): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await assignTeamToJobApi(jobId, teamId);
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign team to job';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  /**
   * Unassign a team from a job
   */
  const unassignFromJob = useCallback(async (jobId: string | number): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await unassignTeamFromJobApi(jobId);
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unassign team from job';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Selection & Search
  // ---------------------------------------------------------------------------

  const selectTeam = useCallback((team: Team | null) => {
    setState(prev => ({ ...prev, selectedTeam: team }));
  }, []);

  const searchTeams = useCallback(async (query: string) => {
    await loadTeams({ search: query });
  }, [loadTeams]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const getMemberName = useCallback((member: TeamMember): string => {
    return getTeamMemberFullName(member);
  }, []);

  /**
   * Get the display color for a team
   */
  const getTeamColor = useCallback((team: Team): string => {
    return team.color || '#3B82F6'; // Default blue
  }, []);

  /**
   * Check if a team is active (not soft-deleted)
   */
  const isTeamActive = useCallback((team: Team): boolean => {
    return team.is_active !== false;
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ---------------------------------------------------------------------------
  // Initial Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    teams: state.teams,
    selectedTeam: state.selectedTeam,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    pagination: state.pagination,
    
    // Fetch operations
    loadTeams,
    loadTeamById,
    refreshTeams,
    
    // CRUD operations
    createTeam,
    updateTeam,
    deleteTeam,
    
    // Member operations
    addMember,
    addMembers,
    removeMember,
    setLeader,
    
    // Job assignment
    assignToJob,
    unassignFromJob,
    
    // Selection & search
    selectTeam,
    searchTeams,
    
    // Helpers
    getMemberName,
    getTeamColor,
    isTeamActive,
    clearError,
  };
}

export default useTeams;

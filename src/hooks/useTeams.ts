/**
 * useTeams Hook
 * React hook for team management with state handling
 * @module hooks/useTeams
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Team,
  TeamMember,
  CreateTeamRequest,
  UpdateTeamRequest,
  FetchTeamsOptions,
  fetchTeams,
  fetchTeamById,
  createTeam as createTeamApi,
  updateTeam as updateTeamApi,
  deleteTeam as deleteTeamApi,
  addTeamMembers as addTeamMembersApi,
  removeTeamMember as removeTeamMemberApi,
  setTeamLeader as setTeamLeaderApi,
  assignTeamToJob as assignTeamToJobApi,
  getTeamMemberFullName,
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
  addMembers: (teamId: number, memberIds: number[]) => Promise<Team | null>;
  removeMember: (teamId: number, memberId: number) => Promise<Team | null>;
  setLeader: (teamId: number, leaderId: number | null) => Promise<Team | null>;
  
  // Job assignment
  assignToJob: (jobId: string | number, teamId: number | null) => Promise<boolean>;
  
  // Selection
  selectTeam: (team: Team | null) => void;
  
  // Search
  searchTeams: (query: string) => Promise<void>;
  
  // Helpers
  getMemberName: (member: TeamMember) => string;
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

  const assignToJob = useCallback(async (jobId: string | number, teamId: number | null): Promise<boolean> => {
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
    addMembers,
    removeMember,
    setLeader,
    
    // Job assignment
    assignToJob,
    
    // Selection & search
    selectTeam,
    searchTeams,
    
    // Helpers
    getMemberName,
    clearError,
  };
}

export default useTeams;

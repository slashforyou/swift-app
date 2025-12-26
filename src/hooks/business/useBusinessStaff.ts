/**
 * useBusinessStaff - Hook pour la gestion du personnel
 * Gère l'état du staff avec stockage local AsyncStorage
 */
import { useCallback, useEffect, useState } from 'react';
import {
    archiveBusinessStaff,
    createBusinessStaff,
    deleteBusinessStaff,
    fetchBusinessStaff,
    fetchStaffDetails,
    getStaffStats,
    searchBusinessStaff,
    unarchiveBusinessStaff,
    updateBusinessStaff,
    type BusinessStaff,
    type StaffCreateData,
} from '../../services/business';

interface UseBusinessStaffReturn {
  // État
  staff: BusinessStaff[];
  currentStaffMember: BusinessStaff | null;
  staffStats: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<BusinessStaff['role'], number>;
    byTeam: Record<BusinessStaff['team'], number>;
    averageRate: number;
  } | null;
  
  // États de chargement
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSearching: boolean;
  
  // État d'erreur
  error: string | null;
  
  // Actions
  loadStaff: () => Promise<void>;
  loadStaffDetails: (staffId: string) => Promise<void>;
  createStaffMember: (staffData: StaffCreateData) => Promise<BusinessStaff | null>;
  updateStaffMember: (staffId: string, updates: Partial<StaffCreateData & { status: BusinessStaff['status'] }>) => Promise<BusinessStaff | null>;
  removeStaffMember: (staffId: string) => Promise<void>;
  archiveStaffMember: (staffId: string) => Promise<void>;
  unarchiveStaffMember: (staffId: string) => Promise<void>;
  searchStaffMembers: (criteria: {
    name?: string;
    role?: BusinessStaff['role'];
    team?: BusinessStaff['team'];
    status?: BusinessStaff['status'];
  }) => Promise<BusinessStaff[]>;
  refreshStaff: () => Promise<void>;
  clearError: () => void;
  setCurrentStaffMember: (staff: BusinessStaff | null) => void;
  
  // Utilitaires
  getStaffByRole: (role: BusinessStaff['role']) => BusinessStaff[];
  getStaffByTeam: (team: BusinessStaff['team']) => BusinessStaff[];
  getActiveStaff: () => BusinessStaff[];
  calculateTeamCosts: () => Record<BusinessStaff['team'], number>;
}

export const useBusinessStaff = (): UseBusinessStaffReturn => {
  // États
  const [staff, setStaff] = useState<BusinessStaff[]>([]);
  const [currentStaffMember, setCurrentStaffMember] = useState<BusinessStaff | null>(null);
  const [staffStats, setStaffStats] = useState<UseBusinessStaffReturn['staffStats']>(null);
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // État d'erreur
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge la liste du personnel
   */
  const loadStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [staffList, stats] = await Promise.all([
        fetchBusinessStaff(),
        getStaffStats()
      ]);
      
      setStaff(staffList);
      setStaffStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load staff';
      setError(errorMessage);
      console.error('Error loading staff:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charge les détails d'un membre du personnel
   */
  const loadStaffDetails = useCallback(async (staffId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const staffMember = await fetchStaffDetails(staffId);
      setCurrentStaffMember(staffMember);
      
      // Mettre à jour la liste si le membre existe
      setStaff(prev => 
        prev.map(s => s.id === staffId ? staffMember : s)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load staff details';
      setError(errorMessage);
      console.error('Error loading staff details:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crée un nouveau membre du personnel
   */
  const createStaffMember = useCallback(async (
    staffData: StaffCreateData
  ): Promise<BusinessStaff | null> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const newStaffMember = await createBusinessStaff(staffData);
      
      // Ajouter à la liste
      setStaff(prev => [...prev, newStaffMember]);
      
      // Recharger les stats
      const stats = await getStaffStats();
      setStaffStats(stats);
      
      return newStaffMember;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create staff member';
      setError(errorMessage);
      console.error('Error creating staff member:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Met à jour un membre du personnel
   */
  const updateStaffMember = useCallback(async (
    staffId: string,
    updates: Partial<StaffCreateData & { status: BusinessStaff['status'] }>
  ): Promise<BusinessStaff | null> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedStaffMember = await updateBusinessStaff(staffId, updates);
      
      // Mettre à jour la liste
      setStaff(prev => 
        prev.map(s => s.id === staffId ? updatedStaffMember : s)
      );
      
      // Mettre à jour le membre courant si c'est lui
      if (currentStaffMember?.id === staffId) {
        setCurrentStaffMember(updatedStaffMember);
      }
      
      // Recharger les stats
      const stats = await getStaffStats();
      setStaffStats(stats);
      
      return updatedStaffMember;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff member';
      setError(errorMessage);
      console.error('Error updating staff member:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [currentStaffMember]);

  /**
   * Supprime un membre du personnel
   */
  const removeStaffMember = useCallback(async (staffId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteBusinessStaff(staffId);
      
      // Retirer de la liste
      setStaff(prev => prev.filter(s => s.id !== staffId));
      
      // Si c'était le membre courant, le réinitialiser
      if (currentStaffMember?.id === staffId) {
        setCurrentStaffMember(null);
      }
      
      // Recharger les stats
      const stats = await getStaffStats();
      setStaffStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete staff member';
      setError(errorMessage);
      console.error('Error deleting staff member:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [currentStaffMember]);

  /**
   * Archive un membre du personnel
   */
  const archiveStaffMember = useCallback(async (staffId: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const archivedStaff = await archiveBusinessStaff(staffId);
      
      // Mettre à jour la liste
      setStaff(prev => 
        prev.map(s => s.id === staffId ? archivedStaff : s)
      );
      
      // Mettre à jour le membre courant si c'est lui
      if (currentStaffMember?.id === staffId) {
        setCurrentStaffMember(archivedStaff);
      }
      
      // Recharger les stats
      const stats = await getStaffStats();
      setStaffStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive staff member';
      setError(errorMessage);
      console.error('Error archiving staff member:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [currentStaffMember]);

  /**
   * Réactive un membre du personnel
   */
  const unarchiveStaffMember = useCallback(async (staffId: string) => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const unarchivedStaff = await unarchiveBusinessStaff(staffId);
      
      // Mettre à jour la liste
      setStaff(prev => 
        prev.map(s => s.id === staffId ? unarchivedStaff : s)
      );
      
      // Mettre à jour le membre courant si c'est lui
      if (currentStaffMember?.id === staffId) {
        setCurrentStaffMember(unarchivedStaff);
      }
      
      // Recharger les stats
      const stats = await getStaffStats();
      setStaffStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unarchive staff member';
      setError(errorMessage);
      console.error('Error unarchiving staff member:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [currentStaffMember]);

  /**
   * Recherche dans le personnel
   */
  const searchStaffMembers = useCallback(async (criteria: {
    name?: string;
    role?: BusinessStaff['role'];
    team?: BusinessStaff['team'];
    status?: BusinessStaff['status'];
  }): Promise<BusinessStaff[]> => {
    try {
      setIsSearching(true);
      setError(null);
      
      const searchResults = await searchBusinessStaff(criteria);
      return searchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search staff';
      setError(errorMessage);
      console.error('Error searching staff:', err);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Actualise le personnel
   */
  const refreshStaff = useCallback(async () => {
    await loadStaff();
  }, [loadStaff]);

  /**
   * Efface l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Filtre le personnel par rôle
   */
  const getStaffByRole = useCallback((role: BusinessStaff['role']): BusinessStaff[] => {
    return staff.filter(staffMember => staffMember.role === role);
  }, [staff]);

  /**
   * Filtre le personnel par équipe
   */
  const getStaffByTeam = useCallback((team: BusinessStaff['team']): BusinessStaff[] => {
    return staff.filter(staffMember => staffMember.team === team);
  }, [staff]);

  /**
   * Récupère le personnel actif
   */
  const getActiveStaff = useCallback((): BusinessStaff[] => {
    return staff.filter(staffMember => staffMember.status === 'active');
  }, [staff]);

  /**
   * Calcule les coûts par équipe
   */
  const calculateTeamCosts = useCallback((): Record<BusinessStaff['team'], number> => {
    const costs: Record<BusinessStaff['team'], number> = {
      'local-moving-a': 0,
      'local-moving-b': 0,
      'interstate': 0,
      'packing': 0,
      'storage': 0,
    };

    staff.forEach(staffMember => {
      if (staffMember.status === 'active') {
        costs[staffMember.team] += staffMember.hourlyRate;
      }
    });

    return costs;
  }, [staff]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  return {
    // État
    staff,
    currentStaffMember,
    staffStats,
    
    // États de chargement
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isSearching,
    
    // État d'erreur
    error,
    
    // Actions
    loadStaff,
    loadStaffDetails,
    createStaffMember,
    updateStaffMember,
    removeStaffMember,
    archiveStaffMember,
    unarchiveStaffMember,
    searchStaffMembers,
    refreshStaff,
    clearError,
    setCurrentStaffMember,
    
    // Utilitaires
    getStaffByRole,
    getStaffByTeam,
    getActiveStaff,
    calculateTeamCosts,
  };
};
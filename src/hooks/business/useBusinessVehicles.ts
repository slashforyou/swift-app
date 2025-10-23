/**
 * useBusinessVehicles - Hook pour la gestion des véhicules business
 * Gère l'état des véhicules avec API intégrée
 */
import { useCallback, useEffect, useState } from 'react';
import {
    createBusinessVehicle,
    createMultipleVehicles,
    deleteBusinessVehicle,
    fetchBusinessVehicles,
    updateBusinessVehicle,
    type BusinessVehicle,
    type VehicleCreateData,
} from '../../services/business';

interface UseBusinessVehiclesReturn {
  // État
  vehicles: BusinessVehicle[];
  
  // États de chargement
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // État d'erreur
  error: string | null;
  
  // Actions
  loadVehicles: () => Promise<void>;
  createVehicle: (vehicleData: VehicleCreateData) => Promise<BusinessVehicle | null>;
  createMultiple: (vehiclesData: VehicleCreateData[]) => Promise<BusinessVehicle[] | null>;
  updateVehicle: (vehicleId: string, updates: Partial<VehicleCreateData>) => Promise<BusinessVehicle | null>;
  removeVehicle: (vehicleId: string) => Promise<void>;
  refreshVehicles: () => Promise<void>;
  clearError: () => void;
  
  // Utilitaires
  getVehiclesByType: (type: BusinessVehicle['type']) => BusinessVehicle[];
  getActiveVehicles: () => BusinessVehicle[];
  getVehicleStats: () => {
    total: number;
    active: number;
    maintenance: number;
    byType: Record<string, number>;
  };
}

export const useBusinessVehicles = (companyId: string = 'swift-removals-001'): UseBusinessVehiclesReturn => {
  // États
  const [vehicles, setVehicles] = useState<BusinessVehicle[]>([]);
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // État d'erreur
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge la liste des véhicules
   */
  const loadVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const vehiclesList = await fetchBusinessVehicles(companyId);
      setVehicles(vehiclesList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(errorMessage);
      console.error('Error loading vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  /**
   * Crée un nouveau véhicule
   */
  const createVehicle = useCallback(async (
    vehicleData: VehicleCreateData
  ): Promise<BusinessVehicle | null> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const newVehicle = await createBusinessVehicle(companyId, vehicleData);
      
      // Ajouter à la liste
      setVehicles(prev => [...prev, newVehicle]);
      
      return newVehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create vehicle';
      setError(errorMessage);
      console.error('Error creating vehicle:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Crée plusieurs véhicules
   */
  const createMultiple = useCallback(async (
    vehiclesData: VehicleCreateData[]
  ): Promise<BusinessVehicle[] | null> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const newVehicles = await createMultipleVehicles(companyId, vehiclesData);
      
      // Ajouter à la liste
      setVehicles(prev => [...prev, ...newVehicles]);
      
      return newVehicles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create vehicles';
      setError(errorMessage);
      console.error('Error creating multiple vehicles:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Met à jour un véhicule existant
   */
  const updateVehicle = useCallback(async (
    vehicleId: string,
    updates: Partial<VehicleCreateData>
  ): Promise<BusinessVehicle | null> => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const updatedVehicle = await updateBusinessVehicle(companyId, vehicleId, updates);
      
      // Mettre à jour la liste
      setVehicles(prev => 
        prev.map(v => v.id === vehicleId ? updatedVehicle : v)
      );
      
      return updatedVehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vehicle';
      setError(errorMessage);
      console.error('Error updating vehicle:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  /**
   * Supprime un véhicule
   */
  const removeVehicle = useCallback(async (vehicleId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteBusinessVehicle(companyId, vehicleId);
      
      // Retirer de la liste
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete vehicle';
      setError(errorMessage);
      console.error('Error deleting vehicle:', err);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  /**
   * Actualise la liste des véhicules
   */
  const refreshVehicles = useCallback(async () => {
    await loadVehicles();
  }, [loadVehicles]);

  /**
   * Efface l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Filtre les véhicules par type
   */
  const getVehiclesByType = useCallback((type: BusinessVehicle['type']): BusinessVehicle[] => {
    return vehicles.filter(vehicle => vehicle.type === type);
  }, [vehicles]);

  /**
   * Récupère les véhicules disponibles
   */
  const getActiveVehicles = useCallback((): BusinessVehicle[] => {
    return vehicles.filter(vehicle => vehicle.status === 'available');
  }, [vehicles]);

  /**
   * Calcule les statistiques des véhicules
   */
  const getVehicleStats = useCallback(() => {
    const stats = {
      total: vehicles.length,
      active: vehicles.filter(v => v.status === 'available').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      byType: {} as Record<string, number>,
    };

    // Compter par type
    vehicles.forEach(vehicle => {
      stats.byType[vehicle.type] = (stats.byType[vehicle.type] || 0) + 1;
    });

    return stats;
  }, [vehicles]);

  /**
   * Chargement initial
   */
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  return {
    // État
    vehicles,
    
    // États de chargement
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // État d'erreur
    error,
    
    // Actions
    loadVehicles,
    createVehicle,
    createMultiple,
    updateVehicle,
    removeVehicle,
    refreshVehicles,
    clearError,
    
    // Utilitaires
    getVehiclesByType,
    getActiveVehicles,
    getVehicleStats,
  };
};
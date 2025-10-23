/**
 * useVehicles Hook - React hook for vehicle management
 * Provides state management and API integration for vehicles
 * 
 * @author Swift App Team
 * @date October 2025
 */

import { useCallback, useEffect, useState } from 'react';
import {
    assignStaffToVehicle,
    createMaintenanceRecord,
    createVehicle,
    deleteVehicle,
    fetchVehicleById,
    fetchVehicleMaintenance,
    fetchVehicles,
    MaintenanceCreateData,
    MaintenanceRecord,
    updateVehicle,
    updateVehicleStatus,
    VehicleAPI,
    VehicleCreateData,
    VehicleUpdateData,
} from '../services/vehiclesService';

// =====================================
// INTERFACES
// =====================================

export interface UseVehiclesReturn {
  // State
  vehicles: VehicleAPI[];
  isLoading: boolean;
  error: string | null;
  
  // Statistics
  totalVehicles: number;
  availableCount: number;
  inUseCount: number;
  maintenanceCount: number;
  
  // Actions
  refetch: () => Promise<void>;
  addVehicle: (data: VehicleCreateData) => Promise<VehicleAPI | null>;
  editVehicle: (id: string, data: VehicleUpdateData) => Promise<VehicleAPI | null>;
  removeVehicle: (id: string) => Promise<boolean>;
  changeStatus: (id: string, status: VehicleAPI['status']) => Promise<VehicleAPI | null>;
  assignStaff: (id: string, staffName: string) => Promise<VehicleAPI | null>;
}

export interface UseVehicleDetailsReturn {
  // State
  vehicle: VehicleAPI | null;
  maintenanceHistory: MaintenanceRecord[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  updateVehicle: (data: VehicleUpdateData) => Promise<VehicleAPI | null>;
  addMaintenanceRecord: (data: MaintenanceCreateData) => Promise<MaintenanceRecord | null>;
}

// =====================================
// HOOK: useVehicles (List management)
// =====================================

/**
 * Hook for managing list of vehicles
 * Provides CRUD operations and statistics
 * 
 * @returns UseVehiclesReturn
 * 
 * @example
 * ```tsx
 * const {
 *   vehicles,
 *   isLoading,
 *   error,
 *   totalVehicles,
 *   availableCount,
 *   addVehicle,
 *   editVehicle,
 *   removeVehicle
 * } = useVehicles();
 * ```
 */
export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<VehicleAPI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vehicles from API
  const loadVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('[useVehicles] Error loading vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Calculate statistics
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === 'available').length;
  const inUseCount = vehicles.filter(v => v.status === 'in-use').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;

  // Add new vehicle
  const addVehicle = useCallback(
    async (data: VehicleCreateData): Promise<VehicleAPI | null> => {
      try {
        const newVehicle = await createVehicle(data);
        setVehicles(prev => [...prev, newVehicle]);
        return newVehicle;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
        setError(errorMessage);
        console.error('[useVehicles] Error adding vehicle:', err);
        return null;
      }
    },
    []
  );

  // Edit existing vehicle
  const editVehicle = useCallback(
    async (id: string, data: VehicleUpdateData): Promise<VehicleAPI | null> => {
      try {
        const updatedVehicle = await updateVehicle(id, data);
        setVehicles(prev =>
          prev.map(v => (v.id === id ? updatedVehicle : v))
        );
        return updatedVehicle;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification';
        setError(errorMessage);
        console.error('[useVehicles] Error editing vehicle:', err);
        return null;
      }
    },
    []
  );

  // Remove vehicle
  const removeVehicle = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteVehicle(id);
        setVehicles(prev => prev.filter(v => v.id !== id));
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
        setError(errorMessage);
        console.error('[useVehicles] Error removing vehicle:', err);
        return false;
      }
    },
    []
  );

  // Change vehicle status
  const changeStatus = useCallback(
    async (id: string, status: VehicleAPI['status']): Promise<VehicleAPI | null> => {
      try {
        const updatedVehicle = await updateVehicleStatus(id, status);
        setVehicles(prev =>
          prev.map(v => (v.id === id ? updatedVehicle : v))
        );
        return updatedVehicle;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de statut';
        setError(errorMessage);
        console.error('[useVehicles] Error changing status:', err);
        return null;
      }
    },
    []
  );

  // Assign staff to vehicle
  const assignStaff = useCallback(
    async (id: string, staffName: string): Promise<VehicleAPI | null> => {
      try {
        const updatedVehicle = await assignStaffToVehicle(id, staffName);
        setVehicles(prev =>
          prev.map(v => (v.id === id ? updatedVehicle : v))
        );
        return updatedVehicle;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'assignation';
        setError(errorMessage);
        console.error('[useVehicles] Error assigning staff:', err);
        return null;
      }
    },
    []
  );

  return {
    // State
    vehicles,
    isLoading,
    error,
    
    // Statistics
    totalVehicles,
    availableCount,
    inUseCount,
    maintenanceCount,
    
    // Actions
    refetch: loadVehicles,
    addVehicle,
    editVehicle,
    removeVehicle,
    changeStatus,
    assignStaff,
  };
}

// =====================================
// HOOK: useVehicleDetails (Single vehicle)
// =====================================

/**
 * Hook for managing single vehicle details and maintenance
 * 
 * @param vehicleId - Vehicle ID
 * @returns UseVehicleDetailsReturn
 * 
 * @example
 * ```tsx
 * const {
 *   vehicle,
 *   maintenanceHistory,
 *   isLoading,
 *   updateVehicle,
 *   addMaintenanceRecord
 * } = useVehicleDetails('v1');
 * ```
 */
export function useVehicleDetails(vehicleId: string): UseVehicleDetailsReturn {
  const [vehicle, setVehicle] = useState<VehicleAPI | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vehicle and maintenance data
  const loadData = useCallback(async () => {
    if (!vehicleId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [vehicleData, maintenanceData] = await Promise.all([
        fetchVehicleById(vehicleId),
        fetchVehicleMaintenance(vehicleId),
      ]);

      setVehicle(vehicleData);
      setMaintenanceHistory(maintenanceData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('[useVehicleDetails] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update vehicle
  const updateVehicleData = useCallback(
    async (data: VehicleUpdateData): Promise<VehicleAPI | null> => {
      if (!vehicleId) return null;

      try {
        const updatedVehicle = await updateVehicle(vehicleId, data);
        setVehicle(updatedVehicle);
        return updatedVehicle;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification';
        setError(errorMessage);
        console.error('[useVehicleDetails] Error updating vehicle:', err);
        return null;
      }
    },
    [vehicleId]
  );

  // Add maintenance record
  const addMaintenanceRecord = useCallback(
    async (data: MaintenanceCreateData): Promise<MaintenanceRecord | null> => {
      if (!vehicleId) return null;

      try {
        const newRecord = await createMaintenanceRecord(vehicleId, data);
        setMaintenanceHistory(prev => [newRecord, ...prev]);
        return newRecord;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création';
        setError(errorMessage);
        console.error('[useVehicleDetails] Error adding maintenance:', err);
        return null;
      }
    },
    [vehicleId]
  );

  return {
    // State
    vehicle,
    maintenanceHistory,
    isLoading,
    error,
    
    // Actions
    refetch: loadData,
    updateVehicle: updateVehicleData,
    addMaintenanceRecord,
  };
}

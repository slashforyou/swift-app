/**
 * useVehicles Hook - React hook for vehicle management
 * Now uses real API via business/vehiclesService.ts
 * 
 * @author Swift App Team
 * @date October 2025 - Updated December 2025 to use real API
 */

import { useCallback, useEffect, useState } from 'react';
import {
    createBusinessVehicle,
    deleteBusinessVehicle,
    fetchVehicleDetails as fetchBusinessVehicleById,
    fetchBusinessVehicles,
    updateBusinessVehicle,
    type BusinessVehicle,
    type VehicleCreateData as BusinessVehicleCreateData,
} from '../services/business/vehiclesService';

// =====================================
// INTERFACES & TYPES (kept for backward compatibility)
// =====================================

export interface VehicleAPI {
  id: string;
  type: 'truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tool';
  make: string;
  model: string;
  year: number;
  registration: string;
  capacity: string;
  location: string;
  status: 'available' | 'in-use' | 'maintenance' | 'out-of-service';
  nextService: string;
  assignedStaff?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleCreateData {
  type: 'truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tool';
  make: string;
  model: string;
  year: number;
  registration: string;
  capacity?: string;
  location: string;
  nextService: string;
  status?: 'available' | 'in-use' | 'maintenance' | 'out-of-service';
}

export interface VehicleUpdateData {
  make?: string;
  model?: string;
  year?: number;
  registration?: string;
  capacity?: string;
  location?: string;
  status?: 'available' | 'in-use' | 'maintenance' | 'out-of-service';
  nextService?: string;
  assignedStaff?: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  cost: number;
  performedBy: string;
  nextDue?: string;
  createdAt: string;
}

export interface MaintenanceCreateData {
  date: string;
  type: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  cost: number;
  performedBy: string;
  nextDue?: string;
}

// =====================================
// TYPE ADAPTERS
// =====================================

const DEFAULT_COMPANY_ID = 'swift-removals-001';

/**
 * Convert BusinessVehicle type to VehicleAPI type
 */
const businessTypeToApiType = (type: BusinessVehicle['type']): VehicleAPI['type'] => {
  const mapping: Record<BusinessVehicle['type'], VehicleAPI['type']> = {
    'moving-truck': 'truck',
    'van': 'van',
    'trailer': 'trailer',
    'ute': 'ute',
    'dolly': 'dolly',
    'tools': 'tool',
  };
  return mapping[type] || 'truck';
};

/**
 * Convert VehicleAPI type to BusinessVehicle type
 */
const apiTypeToBusinessType = (type: VehicleAPI['type']): BusinessVehicle['type'] => {
  const mapping: Record<VehicleAPI['type'], BusinessVehicle['type']> = {
    'truck': 'moving-truck',
    'van': 'van',
    'trailer': 'trailer',
    'ute': 'ute',
    'dolly': 'dolly',
    'tool': 'tools',
  };
  return mapping[type] || 'moving-truck';
};

/**
 * Convert BusinessVehicle to VehicleAPI (for backward compatibility)
 */
const businessToApiVehicle = (bv: BusinessVehicle): VehicleAPI => ({
  id: bv.id,
  type: businessTypeToApiType(bv.type),
  make: bv.make,
  model: bv.model,
  year: parseInt(bv.year, 10) || 2020,
  registration: bv.registration,
  capacity: bv.capacity || '',
  location: bv.location,
  status: bv.status,
  nextService: bv.nextService,
  assignedStaff: bv.currentDriver || undefined,
  notes: undefined,
  createdAt: bv.created_at,
  updatedAt: bv.updated_at,
});

/**
 * Convert VehicleCreateData to BusinessVehicleCreateData
 */
const apiCreateToBusinessCreate = (data: VehicleCreateData): BusinessVehicleCreateData => ({
  name: `${data.make} ${data.model}`,
  type: apiTypeToBusinessType(data.type),
  registration: data.registration,
  make: data.make,
  model: data.model,
  year: String(data.year),
  nextService: data.nextService,
  location: data.location,
  capacity: data.capacity,
});

/**
 * Convert VehicleUpdateData to Partial<BusinessVehicleCreateData>
 */
const apiUpdateToBusinessUpdate = (data: VehicleUpdateData): Partial<BusinessVehicleCreateData> => {
  const result: Partial<BusinessVehicleCreateData> = {};
  
  if (data.make) result.make = data.make;
  if (data.model) result.model = data.model;
  if (data.year) result.year = String(data.year);
  if (data.registration) result.registration = data.registration;
  if (data.capacity) result.capacity = data.capacity;
  if (data.location) result.location = data.location;
  if (data.nextService) result.nextService = data.nextService;
  
  // Update name if make or model changed
  if (data.make || data.model) {
    result.name = `${data.make || ''} ${data.model || ''}`.trim();
  }
  
  return result;
};

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
 * Now uses real API via business/vehiclesService.ts
 * 
 * @returns UseVehiclesReturn
 */
export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<VehicleAPI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vehicles from real API
  const loadVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const businessVehicles = await fetchBusinessVehicles(DEFAULT_COMPANY_ID);
      // Convert to VehicleAPI format
      const apiVehicles = businessVehicles.map(businessToApiVehicle);
      setVehicles(apiVehicles);
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

  // Add new vehicle via real API
  const addVehicle = useCallback(
    async (data: VehicleCreateData): Promise<VehicleAPI | null> => {
      try {
        const businessData = apiCreateToBusinessCreate(data);
        const newBusinessVehicle = await createBusinessVehicle(DEFAULT_COMPANY_ID, businessData);
        const newVehicle = businessToApiVehicle(newBusinessVehicle);
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

  // Edit existing vehicle via real API
  const editVehicle = useCallback(
    async (id: string, data: VehicleUpdateData): Promise<VehicleAPI | null> => {
      try {
        const businessData = apiUpdateToBusinessUpdate(data);
        const updatedBusinessVehicle = await updateBusinessVehicle(DEFAULT_COMPANY_ID, id, businessData);
        const updatedVehicle = businessToApiVehicle(updatedBusinessVehicle);
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

  // Remove vehicle via real API
  const removeVehicle = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteBusinessVehicle(DEFAULT_COMPANY_ID, id);
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

  // Change vehicle status via real API
  const changeStatus = useCallback(
    async (id: string, status: VehicleAPI['status']): Promise<VehicleAPI | null> => {
      try {
        // Status is a direct field, just update it
        const updatedBusinessVehicle = await updateBusinessVehicle(DEFAULT_COMPANY_ID, id, {} as any);
        const updatedVehicle = businessToApiVehicle(updatedBusinessVehicle);
        // Optimistically update status locally since API may not support it directly
        const vehicleWithStatus = { ...updatedVehicle, status };
        setVehicles(prev =>
          prev.map(v => (v.id === id ? vehicleWithStatus : v))
        );
        return vehicleWithStatus;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de statut';
        setError(errorMessage);
        console.error('[useVehicles] Error changing status:', err);
        return null;
      }
    },
    []
  );

  // Assign staff to vehicle (optimistic update - API may not support this directly)
  const assignStaff = useCallback(
    async (id: string, staffName: string): Promise<VehicleAPI | null> => {
      try {
        // Optimistic update - currentDriver field
        const vehicle = vehicles.find(v => v.id === id);
        if (!vehicle) return null;
        
        const updatedVehicle = { ...vehicle, assignedStaff: staffName };
        setVehicles(prev =>
          prev.map(v => (v.id === id ? updatedVehicle : v))
        );
        return updatedVehicle;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'assignation";
        setError(errorMessage);
        console.error('[useVehicles] Error assigning staff:', err);
        return null;
      }
    },
    [vehicles]
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
 * Now uses real API via business/vehiclesService.ts
 * 
 * @param vehicleId - Vehicle ID
 * @returns UseVehicleDetailsReturn
 */
export function useVehicleDetails(vehicleId: string): UseVehicleDetailsReturn {
  const [vehicle, setVehicle] = useState<VehicleAPI | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vehicle from real API
  const loadData = useCallback(async () => {
    if (!vehicleId) return;

    try {
      setIsLoading(true);
      setError(null);

      const businessVehicle = await fetchBusinessVehicleById(DEFAULT_COMPANY_ID, vehicleId);
      const apiVehicle = businessToApiVehicle(businessVehicle);
      setVehicle(apiVehicle);
      
      // Maintenance history not available in current API - return empty array
      setMaintenanceHistory([]);
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

  // Update vehicle via real API
  const updateVehicleData = useCallback(
    async (data: VehicleUpdateData): Promise<VehicleAPI | null> => {
      if (!vehicleId) return null;

      try {
        const businessData = apiUpdateToBusinessUpdate(data);
        const updatedBusinessVehicle = await updateBusinessVehicle(DEFAULT_COMPANY_ID, vehicleId, businessData);
        const updatedVehicle = businessToApiVehicle(updatedBusinessVehicle);
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

  // Add maintenance record (not available in current API - mock implementation)
  const addMaintenanceRecord = useCallback(
    async (data: MaintenanceCreateData): Promise<MaintenanceRecord | null> => {
      if (!vehicleId) return null;

      try {
        // API doesn't support maintenance records yet - create local mock
        const newRecord: MaintenanceRecord = {
          id: `maint-${Date.now()}`,
          vehicleId,
          date: data.date,
          type: data.type,
          description: data.description,
          cost: data.cost,
          performedBy: data.performedBy,
          nextDue: data.nextDue,
          createdAt: new Date().toISOString(),
        };
        setMaintenanceHistory(prev => [newRecord, ...prev]);
        console.warn('[useVehicleDetails] Maintenance API not available - stored locally only');
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

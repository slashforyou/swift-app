/**
 * Vehicles Service - Re-exports for backward compatibility
 * 
 * The actual implementation is now in:
 * - business/vehiclesService.ts (API calls)
 * - hooks/useVehicles.ts (types and adapters)
 * 
 * @author Swift App Team
 * @date October 2025 - Updated December 2025 to use real API
 * @deprecated Import from hooks/useVehicles.ts or services/business/vehiclesService.ts instead
 */

// Re-export types from useVehicles for backward compatibility
export {
    type MaintenanceCreateData, type MaintenanceRecord, type VehicleAPI,
    type VehicleCreateData,
    type VehicleUpdateData
} from '../hooks/useVehicles';

// Re-export business vehicle types for convenience
export {
    createBusinessVehicle, createMultipleVehicles, deleteBusinessVehicle, fetchBusinessVehicles,
    fetchVehicleDetails, updateBusinessVehicle, uploadVehiclePhoto, type BusinessVehicle,
    type VehicleCreateData as BusinessVehicleCreateData
} from './business/vehiclesService';

/**
 * @deprecated Use fetchBusinessVehicles from business/vehiclesService instead
 */
export async function fetchVehicles() {
  const { fetchBusinessVehicles: fetch } = await import('./business/vehiclesService');
  return fetch('swift-removals-001');
}

/**
 * @deprecated Use fetchVehicleDetails from business/vehiclesService instead
 */
export async function fetchVehicleById(vehicleId: string) {
  const { fetchVehicleDetails: fetch } = await import('./business/vehiclesService');
  return fetch('swift-removals-001', vehicleId);
}

/**
 * @deprecated Use createBusinessVehicle from business/vehiclesService instead
 */
export async function createVehicle(data: any) {
  const { createBusinessVehicle: create } = await import('./business/vehiclesService');
  return create('swift-removals-001', data);
}

/**
 * @deprecated Use updateBusinessVehicle from business/vehiclesService instead
 */
export async function updateVehicle(vehicleId: string, data: any) {
  const { updateBusinessVehicle: update } = await import('./business/vehiclesService');
  return update('swift-removals-001', vehicleId, data);
}

/**
 * @deprecated Use deleteBusinessVehicle from business/vehiclesService instead
 */
export async function deleteVehicle(vehicleId: string) {
  const { deleteBusinessVehicle: del } = await import('./business/vehiclesService');
  return del('swift-removals-001', vehicleId);
}

/**
 * @deprecated Status update should be done via updateBusinessVehicle
 */
export async function updateVehicleStatus(vehicleId: string, status: string) {
  const { updateBusinessVehicle: update } = await import('./business/vehiclesService');
  return update('swift-removals-001', vehicleId, {} as any);
}

/**
 * @deprecated Staff assignment should be done via updateBusinessVehicle
 */
export async function assignStaffToVehicle(vehicleId: string, staffName: string) {
  // Not directly supported by API - return optimistic update
  console.warn('[vehiclesService] assignStaffToVehicle: API does not support this - optimistic update only');
  return { id: vehicleId, currentDriver: staffName };
}

/**
 * @deprecated Maintenance API not available
 */
export async function fetchVehicleMaintenance(vehicleId: string) {
  // Not supported by current API
  console.warn('[vehiclesService] fetchVehicleMaintenance: API does not support this');
  return [];
}

/**
 * @deprecated Maintenance API not available
 */
export async function createMaintenanceRecord(vehicleId: string, data: any) {
  // Not supported by current API
  console.warn('[vehiclesService] createMaintenanceRecord: API does not support this');
  return {
    id: `maint-${Date.now()}`,
    vehicleId,
    ...data,
    createdAt: new Date().toISOString(),
  };
}

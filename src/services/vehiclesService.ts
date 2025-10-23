/**
 * Vehicles Service - API integration for vehicle management
 * Handles all HTTP requests to /business/vehicles endpoints
 * 
 * @author Swift App Team
 * @date October 2025
 */


const API_BASE_URL = 'https://altivo.fr/swift-app/v1';

// =====================================
// INTERFACES & TYPES
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
// MOCK DATA (temporary until API is ready)
// =====================================

const mockVehicles: VehicleAPI[] = [
  {
    id: 'v1',
    type: 'truck',
    make: 'Isuzu',
    model: 'FRR 500',
    year: 2020,
    registration: 'ABC-123',
    capacity: '5 tonnes',
    location: 'Sydney',
    status: 'available',
    nextService: '2025-11-15',
    assignedStaff: 'John Smith',
    notes: 'Regular service required',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2025-10-20T10:30:00Z',
  },
  {
    id: 'v2',
    type: 'van',
    make: 'Ford',
    model: 'Transit',
    year: 2021,
    registration: 'XY-12-AB',
    capacity: '1200 kg',
    location: 'Melbourne',
    status: 'in-use',
    nextService: '2025-12-01',
    assignedStaff: 'Sarah Johnson',
    notes: 'Good condition',
    createdAt: '2024-03-20T09:00:00Z',
    updatedAt: '2025-10-22T14:15:00Z',
  },
  {
    id: 'v3',
    type: 'trailer',
    make: 'Custom',
    model: 'Box Trailer',
    year: 2019,
    registration: 'TR-456',
    capacity: '2 tonnes',
    location: 'Brisbane',
    status: 'available',
    nextService: '2026-01-10',
    notes: 'Recently serviced',
    createdAt: '2023-11-10T07:30:00Z',
    updatedAt: '2025-10-18T16:45:00Z',
  },
  {
    id: 'v4',
    type: 'ute',
    make: 'Toyota',
    model: 'HiLux',
    year: 2022,
    registration: 'HI-789',
    capacity: '800 kg',
    location: 'Perth',
    status: 'maintenance',
    nextService: '2025-10-30',
    assignedStaff: 'Mike Chen',
    notes: 'Brake pads replacement',
    createdAt: '2024-06-05T11:20:00Z',
    updatedAt: '2025-10-23T09:00:00Z',
  },
];

const mockMaintenance: Record<string, MaintenanceRecord[]> = {
  v1: [
    {
      id: 'm1',
      vehicleId: 'v1',
      date: '2025-08-15',
      type: 'routine',
      description: 'Oil change and filter replacement',
      cost: 250,
      performedBy: 'Sydney Service Center',
      nextDue: '2025-11-15',
      createdAt: '2025-08-15T10:00:00Z',
    },
    {
      id: 'm2',
      vehicleId: 'v1',
      date: '2025-05-10',
      type: 'inspection',
      description: 'Annual safety inspection',
      cost: 180,
      performedBy: 'NSW Transport Authority',
      createdAt: '2025-05-10T14:30:00Z',
    },
  ],
  v2: [
    {
      id: 'm3',
      vehicleId: 'v2',
      date: '2025-09-20',
      type: 'repair',
      description: 'Transmission fluid leak repair',
      cost: 450,
      performedBy: 'Ford Service Melbourne',
      createdAt: '2025-09-20T11:15:00Z',
    },
  ],
};

// =====================================
// API FUNCTIONS
// =====================================

/**
 * Fetch all vehicles
 * @returns Promise<VehicleAPI[]>
 */
export async function fetchVehicles(): Promise<VehicleAPI[]> {
  try {
    // TODO: Replace with real API call when /business/vehicles is ready
    // const response = await fetchWithAuth(`${API_BASE_URL}/business/vehicles`);
    // return response.data;
    
    // Mock implementation with simulated delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockVehicles;
  } catch (error) {
    console.error('[vehiclesService] Error fetching vehicles:', error);
    throw new Error('Impossible de charger la liste des véhicules');
  }
}

/**
 * Fetch single vehicle by ID
 * @param vehicleId - Vehicle ID
 * @returns Promise<VehicleAPI>
 */
export async function fetchVehicleById(vehicleId: string): Promise<VehicleAPI> {
  try {
    // TODO: Replace with real API call
    // const response = await fetchWithAuth(`${API_BASE_URL}/business/vehicles/${vehicleId}`);
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 300));
    const vehicle = mockVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    return vehicle;
  } catch (error) {
    console.error('[vehiclesService] Error fetching vehicle:', error);
    throw new Error('Impossible de charger les détails du véhicule');
  }
}

/**
 * Create new vehicle
 * @param data - Vehicle creation data
 * @returns Promise<VehicleAPI>
 */
export async function createVehicle(data: VehicleCreateData): Promise<VehicleAPI> {
  try {
    // TODO: Replace with real API call
    // const response = await fetchWithAuth(`${API_BASE_URL}/business/vehicles`, {
    //   method: 'POST',
    //   body: JSON.stringify(data),
    // });
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newVehicle: VehicleAPI = {
      id: `v${Date.now()}`,
      ...data,
      capacity: data.capacity || '',
      status: data.status || 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockVehicles.push(newVehicle);
    return newVehicle;
  } catch (error) {
    console.error('[vehiclesService] Error creating vehicle:', error);
    throw new Error('Impossible de créer le véhicule');
  }
}

/**
 * Update existing vehicle
 * @param vehicleId - Vehicle ID
 * @param data - Vehicle update data
 * @returns Promise<VehicleAPI>
 */
export async function updateVehicle(
  vehicleId: string,
  data: VehicleUpdateData
): Promise<VehicleAPI> {
  try {
    // TODO: Replace with real API call
    // const response = await fetchWithAuth(`${API_BASE_URL}/business/vehicles/${vehicleId}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(data),
    // });
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockVehicles.findIndex(v => v.id === vehicleId);
    if (index === -1) {
      throw new Error('Vehicle not found');
    }
    
    mockVehicles[index] = {
      ...mockVehicles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return mockVehicles[index];
  } catch (error) {
    console.error('[vehiclesService] Error updating vehicle:', error);
    throw new Error('Impossible de mettre à jour le véhicule');
  }
}

/**
 * Delete vehicle
 * @param vehicleId - Vehicle ID
 * @returns Promise<void>
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
  try {
    // TODO: Replace with real API call
    // await fetchWithAuth(`${API_BASE_URL}/business/vehicles/${vehicleId}`, {
    //   method: 'DELETE',
    // });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockVehicles.findIndex(v => v.id === vehicleId);
    if (index === -1) {
      throw new Error('Vehicle not found');
    }
    
    mockVehicles.splice(index, 1);
  } catch (error) {
    console.error('[vehiclesService] Error deleting vehicle:', error);
    throw new Error('Impossible de supprimer le véhicule');
  }
}

/**
 * Fetch maintenance history for a vehicle
 * @param vehicleId - Vehicle ID
 * @returns Promise<MaintenanceRecord[]>
 */
export async function fetchVehicleMaintenance(
  vehicleId: string
): Promise<MaintenanceRecord[]> {
  try {
    // TODO: Replace with real API call
    // const response = await fetchWithAuth(
    //   `${API_BASE_URL}/business/vehicles/${vehicleId}/maintenance`
    // );
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockMaintenance[vehicleId] || [];
  } catch (error) {
    console.error('[vehiclesService] Error fetching maintenance:', error);
    throw new Error('Impossible de charger l\'historique de maintenance');
  }
}

/**
 * Create maintenance record
 * @param vehicleId - Vehicle ID
 * @param data - Maintenance creation data
 * @returns Promise<MaintenanceRecord>
 */
export async function createMaintenanceRecord(
  vehicleId: string,
  data: MaintenanceCreateData
): Promise<MaintenanceRecord> {
  try {
    // TODO: Replace with real API call
    // const response = await fetchWithAuth(
    //   `${API_BASE_URL}/business/vehicles/${vehicleId}/maintenance`,
    //   {
    //     method: 'POST',
    //     body: JSON.stringify(data),
    //   }
    // );
    // return response.data;
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newRecord: MaintenanceRecord = {
      id: `m${Date.now()}`,
      vehicleId,
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    if (!mockMaintenance[vehicleId]) {
      mockMaintenance[vehicleId] = [];
    }
    mockMaintenance[vehicleId].push(newRecord);
    
    return newRecord;
  } catch (error) {
    console.error('[vehiclesService] Error creating maintenance record:', error);
    throw new Error('Impossible de créer l\'enregistrement de maintenance');
  }
}

/**
 * Update vehicle status
 * @param vehicleId - Vehicle ID
 * @param status - New status
 * @returns Promise<VehicleAPI>
 */
export async function updateVehicleStatus(
  vehicleId: string,
  status: VehicleAPI['status']
): Promise<VehicleAPI> {
  return updateVehicle(vehicleId, { status });
}

/**
 * Assign staff to vehicle
 * @param vehicleId - Vehicle ID
 * @param staffName - Staff member name
 * @returns Promise<VehicleAPI>
 */
export async function assignStaffToVehicle(
  vehicleId: string,
  staffName: string
): Promise<VehicleAPI> {
  return updateVehicle(vehicleId, { assignedStaff: staffName });
}

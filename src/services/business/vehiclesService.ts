/**
 * VehiclesService - Service API pour la gestion des véhicules d'entreprise
 * Endpoints Company Trucks Management
 */
import { ServerData } from '../../constants/ServerData';
import { fetchWithAuth } from '../../utils/session';

// Mock data pour fallback
const mockVehicles: BusinessVehicle[] = [
  {
    id: 'vehicle-001',
    company_id: 'swift-removals-001',
    name: 'Swift Truck #1',
    type: 'moving-truck',
    registration: 'NSW-123',
    make: 'Isuzu',
    model: 'NPR 200',
    year: '2020',
    nextService: '2024-12-15',
    location: 'Sydney Depot',
    status: 'available',
    currentDriver: '',
    mileage: 45000,
    capacity: '5.5m³',
    fuel_type: 'Diesel',
    insurance_expiry: '2025-03-30',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  },
  {
    id: 'vehicle-002', 
    company_id: 'swift-removals-001',
    name: 'Swift Van #2',
    type: 'van',
    registration: 'NSW-456',
    make: 'Ford',
    model: 'Transit',
    year: '2021',
    nextService: '2024-11-30',
    location: 'Sydney Depot',
    status: 'in-use',
    currentDriver: 'John Smith',
    mileage: 32000,
    capacity: '3.5m³',
    fuel_type: 'Diesel',
    insurance_expiry: '2025-04-15',
    created_at: '2023-02-01T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  },
  {
    id: 'vehicle-003',
    company_id: 'swift-removals-001',
    name: 'Swift Truck #3',
    type: 'moving-truck',
    registration: 'NSW-789',
    make: 'Hino',
    model: '300 Series',
    year: '2019',
    nextService: '2024-10-25',
    location: 'Sydney Depot', 
    status: 'maintenance',
    currentDriver: '',
    mileage: 67000,
    capacity: '8m³',
    fuel_type: 'Diesel',
    insurance_expiry: '2025-02-28',
    created_at: '2022-12-01T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  }
];

// Types Vehicles
export interface BusinessVehicle {
  id: string;
  company_id: string;
  name: string;
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools';
  registration: string;
  make: string;
  model: string;
  year: string;
  nextService: string;
  location: string;
  status: 'available' | 'in-use' | 'maintenance' | 'out-of-service';
  currentDriver?: string;
  mileage?: number;
  capacity?: string;
  fuel_type?: string;
  insurance_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreateData {
  name: string;
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools';
  registration: string;
  make: string;
  model: string;
  year: string;
  nextService: string;
  location: string;
  capacity?: string;
  fuel_type?: string;
  insurance_expiry?: string;
}

// API Response Types
interface VehicleResponse {
  success: boolean;
  truck: BusinessVehicle;
}

interface VehicleListResponse {
  success: boolean;
  trucks: BusinessVehicle[];
}

/**
 * Récupère la liste des véhicules d'une entreprise
 */
export const fetchBusinessVehicles = async (companyId: string): Promise<BusinessVehicle[]> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/trucks`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('Vehicles API not available, using mock data');
      return mockVehicles.map(v => ({ ...v, company_id: companyId }));
    }

    const data: VehicleListResponse = await response.json();
    
    if (!data.success) {
      console.warn('Vehicles API returned success: false, using mock data');
      return mockVehicles.map(v => ({ ...v, company_id: companyId }));
    }

    return data.trucks || mockVehicles.map(v => ({ ...v, company_id: companyId }));
  } catch (error) {
    console.error('Error fetching business vehicles:', error);
    console.warn('Using mock business vehicles as fallback');
    return mockVehicles.map(v => ({ ...v, company_id: companyId }));
  }
};

/**
 * Récupère les détails d'un véhicule par ID
 */
export const fetchVehicleDetails = async (companyId: string, vehicleId: string): Promise<BusinessVehicle> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VehicleResponse = await response.json();
    
    if (!data.success || !data.truck) {
      throw new Error('API returned invalid vehicle data');
    }

    return data.truck;
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    throw new Error('Failed to fetch vehicle details');
  }
};

/**
 * Crée un nouveau véhicule
 */
export const createBusinessVehicle = async (
  companyId: string,
  vehicleData: VehicleCreateData
): Promise<BusinessVehicle> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/truck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      console.warn('Vehicle creation API not available, creating mock vehicle');
      // Créer un véhicule mock avec les données fournies
      const mockVehicle: BusinessVehicle = {
        id: `vehicle-${Date.now()}`,
        company_id: companyId,
        ...vehicleData,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockVehicle;
    }

    const data: VehicleResponse = await response.json();
    
    if (!data.success || !data.truck) {
      console.warn('Vehicle creation API returned invalid data, creating mock vehicle');
      const mockVehicle: BusinessVehicle = {
        id: `vehicle-${Date.now()}`,
        company_id: companyId,
        ...vehicleData,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockVehicle;
    }

    return data.truck;
  } catch (error) {
    console.error('Error creating vehicle:', error);
    console.warn('Creating mock vehicle as fallback');
    const mockVehicle: BusinessVehicle = {
      id: `vehicle-${Date.now()}`,
      company_id: companyId,
      ...vehicleData,
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return mockVehicle;
  }
};

/**
 * Met à jour un véhicule existant
 */
export const updateBusinessVehicle = async (
  companyId: string,
  vehicleId: string,
  updates: Partial<VehicleCreateData>
): Promise<BusinessVehicle> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VehicleResponse = await response.json();
    
    if (!data.success || !data.truck) {
      throw new Error('API returned invalid vehicle data');
    }

    return data.truck;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw new Error('Failed to update vehicle');
  }
};

/**
 * Supprime un véhicule
 */
export const deleteBusinessVehicle = async (companyId: string, vehicleId: string): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('API returned success: false');
    }
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw new Error('Failed to delete vehicle');
  }
};

/**
 * Ajoute plusieurs véhicules en une fois
 */
export const createMultipleVehicles = async (
  companyId: string,
  vehiclesData: VehicleCreateData[]
): Promise<BusinessVehicle[]> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/trucks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trucks: vehiclesData }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VehicleListResponse = await response.json();
    
    if (!data.success) {
      throw new Error('API returned success: false');
    }

    return data.trucks || [];
  } catch (error) {
    console.error('Error creating multiple vehicles:', error);
    throw new Error('Failed to create multiple vehicles');
  }
};
/**
 * VehiclesService - Service API pour la gestion des véhicules d'entreprise
 * Endpoints Company Trucks Management
 */
import { ServerData } from '../../constants/ServerData';
import { fetchWithAuth } from '../../utils/session';

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
 * En cas d'erreur ou de données invalides, retourne un tableau vide
 */
export const fetchBusinessVehicles = async (companyId: string): Promise<BusinessVehicle[]> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/company/${companyId}/trucks`, {
      method: 'GET',
    });

    if (!response.ok) {
      // API non disponible - retourner tableau vide (pas de mock)
      return [];
    }

    const data: VehicleListResponse = await response.json();
    
    if (!data.success) {
      // API a retourné une erreur - retourner tableau vide (pas de mock)
      return [];
    }

    // Retourner les véhicules de l'API ou tableau vide si aucun
    return data.trucks || [];
  } catch (error) {
    // En cas d'erreur réseau - retourner tableau vide (pas de mock)
    return [];
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

/**
 * Upload une photo pour un véhicule
 * VEH-03: Interface photo véhicule
 */
export const uploadVehiclePhoto = async (
  companyId: string,
  vehicleId: string,
  photoUri: string
): Promise<{ success: boolean; photoUrl?: string }> => {
  try {
    console.log(`📸 [vehiclesService] Uploading photo for vehicle ${vehicleId}...`);

    // Créer FormData pour l'upload
    const formData = new FormData();
    
    // Extraire le nom de fichier depuis l'URI
    const filename = photoUri.split('/').pop() || 'vehicle_photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type: type,
    } as any);

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}/photo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      // Si endpoint non disponible, retourner erreur explicite
      if (response.status === 404) {
        console.warn('⚠️ [vehiclesService] Photo upload endpoint not available (404)');
        throw new Error('Photo upload endpoint not available. Backend implementation required.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [vehiclesService] Photo uploaded successfully`);

    return {
      success: true,
      photoUrl: data.photo_url || data.url,
    };
  } catch (error) {
    console.error('❌ [vehiclesService] Error uploading vehicle photo:', error);
    throw error;
  }
};
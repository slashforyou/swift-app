/**
 * VehiclesService - Service API pour la gestion des véhicules d'entreprise
 * Endpoints Company Trucks Management
 */
import { ServerData } from "../../constants/ServerData";
import { fetchWithAuth } from "../../utils/session";

// Types Vehicles
export interface BusinessVehicle {
  id: string;
  company_id: string;
  name: string;
  type: "moving-truck" | "van" | "trailer" | "ute" | "dolly" | "tools";
  registration: string;
  make: string;
  model: string;
  year: string;
  nextService: string;
  location: string;
  status: "available" | "in-use" | "maintenance" | "out-of-service";
  currentDriver?: string;
  mileage?: number;
  capacity?: string;
  fuel_type?: string;
  insurance_expiry?: string;
  license_plate?: string;
  volume?: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreateData {
  name: string;
  type: "moving-truck" | "van" | "trailer" | "ute" | "dolly" | "tools";
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
export const fetchBusinessVehicles = async (
  companyId: string,
): Promise<BusinessVehicle[]> => {
  try {
    console.log(
      `🚛 [vehiclesService] Fetching vehicles for company: ${companyId}`,
    );
    console.log(
      `🌐 [vehiclesService] API URL: ${ServerData.serverUrl}v1/company/${companyId}/trucks`,
    );

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/trucks`,
      {
        method: "GET",
      },
    );

    console.log(`📡 [vehiclesService] API Response status: ${response.status}`);

    if (!response.ok) {
      console.warn(
        "⚠️ [vehiclesService] API not available - returning empty array",
      );
      return [];
    }

    const data = await response.json();
    console.log(
      "📦 [vehiclesService] API Response data:",
      JSON.stringify(data, null, 2),
    );

    if (!data.success) {
      console.warn(
        "⚠️ [vehiclesService] API returned success: false - returning empty array",
      );
      return [];
    }

    // L'API retourne { success, data: { trucks: [...] } }
    const trucks = data.data?.trucks || data.trucks || [];
    console.log(
      `✅ [vehiclesService] Successfully loaded ${trucks.length} vehicles`,
    );
    return trucks;
  } catch (error) {
    console.error("❌ [vehiclesService] Error fetching vehicles:", error);
    return [];
  }
};

/**
 * Récupère les détails d'un véhicule par ID
 */
export const fetchVehicleDetails = async (
  companyId: string,
  vehicleId: string,
): Promise<BusinessVehicle> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VehicleResponse = await response.json();

    if (!data.success || !data.truck) {
      throw new Error("API returned invalid vehicle data");
    }

    return data.truck;
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    throw new Error("Failed to fetch vehicle details");
  }
};

/**
 * Crée un nouveau véhicule
 */
export const createBusinessVehicle = async (
  companyId: string,
  vehicleData: VehicleCreateData,
): Promise<BusinessVehicle> => {
  try {
    console.log(
      "🚛 [vehiclesService] Creating vehicle for company:",
      companyId,
    );
    console.log("📋 [vehiclesService] Vehicle data:", vehicleData);

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/truck`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      },
    );

    console.log(
      `📡 [vehiclesService] Create vehicle response status: ${response.status}`,
    );

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data: VehicleResponse = await response.json();
    console.log("📦 [vehiclesService] Create vehicle response:", data);

    if (!data.success || !data.truck) {
      throw new Error("API returned invalid data");
    }

    console.log("✅ [vehiclesService] Vehicle created successfully");
    return data.truck;
  } catch (error) {
    console.error("❌ [vehiclesService] Error creating vehicle:", error);
    throw new Error("Failed to create vehicle - API not available");
  }
};

/**
 * Met à jour un véhicule existant
 */
export const updateBusinessVehicle = async (
  companyId: string,
  vehicleId: string,
  updates: Partial<VehicleCreateData>,
): Promise<BusinessVehicle> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VehicleResponse = await response.json();

    if (!data.success || !data.truck) {
      throw new Error("API returned invalid vehicle data");
    }

    return data.truck;
  } catch (error) {
    console.error("Error updating vehicle:", error);
    throw new Error("Failed to update vehicle");
  }
};

/**
 * Supprime un véhicule
 */
export const deleteBusinessVehicle = async (
  companyId: string,
  vehicleId: string,
): Promise<void> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned success: false");
    }
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    throw new Error("Failed to delete vehicle");
  }
};

/**
 * Ajoute plusieurs véhicules en une fois
 */
export const createMultipleVehicles = async (
  companyId: string,
  vehiclesData: VehicleCreateData[],
): Promise<BusinessVehicle[]> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/trucks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trucks: vehiclesData }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: VehicleListResponse = await response.json();

    if (!data.success) {
      throw new Error("API returned success: false");
    }

    return data.trucks || [];
  } catch (error) {
    console.error("Error creating multiple vehicles:", error);
    throw new Error("Failed to create multiple vehicles");
  }
};

// ========================================
// 📸 VEHICLE PHOTO MANAGEMENT - Phase 2
// ========================================

/**
 * Types pour les photos de véhicules
 */
export type VehicleImageType =
  | "exterior"
  | "interior"
  | "damage"
  | "document"
  | "other";

export interface VehicleImage {
  id: number;
  truck_id: number;
  filename: string;
  original_filename?: string;
  url: string;
  gcs_path?: string;
  image_type: VehicleImageType;
  description?: string;
  is_primary: boolean;
  created_at: string;
}

export interface UploadVehiclePhotoOptions {
  description?: string;
  image_type?: VehicleImageType;
  is_primary?: boolean;
}

/**
 * Upload une photo pour un véhicule
 * POST /v1/company/{companyId}/trucks/{truckId}/image
 *
 * @see BACKEND_REQUIREMENTS_PHASE2.md
 */
export const uploadVehiclePhoto = async (
  companyId: string,
  vehicleId: string,
  photoUri: string,
  options?: UploadVehiclePhotoOptions,
): Promise<{ success: boolean; image?: VehicleImage }> => {
  try {
    // Créer FormData pour l'upload
    const formData = new FormData();

    // Extraire le nom de fichier depuis l'URI
    const filename = photoUri.split("/").pop() || "vehicle_photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("image", {
      uri: photoUri,
      name: filename,
      type: type,
    } as any);

    // Ajouter les options optionnelles
    if (options?.description) {
      formData.append("description", options.description);
    }
    if (options?.image_type) {
      formData.append("image_type", options.image_type);
    }
    if (options?.is_primary !== undefined) {
      formData.append("is_primary", String(options.is_primary));
    }

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}/image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Upload failed");
    }

    return {
      success: true,
      image: data.data as VehicleImage,
    };
  } catch (error) {
    console.error("[vehiclesService] Error uploading vehicle photo:", error);
    throw error;
  }
};

/**
 * Récupère la liste des images d'un véhicule
 * GET /v1/company/{companyId}/trucks/{truckId}/images
 */
export const fetchVehicleImages = async (
  companyId: string,
  vehicleId: string,
  options?: { image_type?: VehicleImageType; include_deleted?: boolean },
): Promise<VehicleImage[]> => {
  try {
    const params = new URLSearchParams();
    if (options?.image_type) {
      params.append("image_type", options.image_type);
    }
    if (options?.include_deleted) {
      params.append("include_deleted", "true");
    }

    const url = `${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}/images${
      params.toString() ? "?" + params.toString() : ""
    }`;

    const response = await fetchWithAuth(url, {
      method: "GET",
    });

    if (!response.ok) {
      // Si pas d'images, retourner tableau vide
      if (response.status === 404) {
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      return [];
    }

    return data.data?.images || [];
  } catch (error) {
    console.error("[vehiclesService] Error fetching vehicle images:", error);
    return [];
  }
};

/**
 * Supprime une image de véhicule
 * DELETE /v1/company/{companyId}/trucks/{truckId}/images/{imageId}
 */
export const deleteVehicleImage = async (
  companyId: string,
  vehicleId: string,
  imageId: number,
  permanent: boolean = false,
): Promise<boolean> => {
  try {
    const url = `${ServerData.serverUrl}v1/company/${companyId}/trucks/${vehicleId}/images/${imageId}${
      permanent ? "?permanent=true" : ""
    }`;

    const response = await fetchWithAuth(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("[vehiclesService] Error deleting vehicle image:", error);
    return false;
  }
};

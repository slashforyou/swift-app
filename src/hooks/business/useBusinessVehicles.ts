/**
 * useBusinessVehicles - Hook pour la gestion des véhicules business
 * Gère l'état des véhicules avec API intégrée
 */
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
    createBusinessVehicle,
    createMultipleVehicles,
    deleteBusinessVehicle,
    fetchBusinessVehicles,
    updateBusinessVehicle,
    type BusinessVehicle,
    type VehicleCreateData,
} from "../../services/business";

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
  createVehicle: (
    vehicleData: VehicleCreateData,
  ) => Promise<BusinessVehicle | null>;
  createMultiple: (
    vehiclesData: VehicleCreateData[],
  ) => Promise<BusinessVehicle[] | null>;
  updateVehicle: (
    vehicleId: string,
    updates: Partial<VehicleCreateData>,
  ) => Promise<BusinessVehicle | null>;
  removeVehicle: (vehicleId: string) => Promise<void>;
  refreshVehicles: () => Promise<void>;
  clearError: () => void;

  // Utilitaires
  getVehiclesByType: (type: BusinessVehicle["type"]) => BusinessVehicle[];
  getActiveVehicles: () => BusinessVehicle[];
  getVehicleStats: () => {
    total: number;
    active: number;
    maintenance: number;
    byType: Record<string, number>;
  };
}

export const useBusinessVehicles = (
  companyIdProp?: string,
): UseBusinessVehiclesReturn => {
  // États
  const [vehicles, setVehicles] = useState<BusinessVehicle[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // État d'erreur
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère le company_id depuis SecureStore au premier chargement
   */
  useEffect(() => {
    const loadCompanyId = async () => {
      try {
        console.log("🔍 [useBusinessVehicles] Loading company ID...");

        // Utiliser le prop si fourni
        if (companyIdProp) {
          console.log(
            "✅ [useBusinessVehicles] Using company ID from prop:",
            companyIdProp,
          );
          setCompanyId(companyIdProp);
          return;
        }

        // Sinon, récupérer depuis SecureStore
        const userDataStr = await SecureStore.getItemAsync("user_data");
        console.log(
          "📦 [useBusinessVehicles] User data string:",
          userDataStr ? "Found" : "Not found",
        );

        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          console.log(
            "👤 [useBusinessVehicles] Parsed user data company_id:",
            userData.company_id,
          );
          console.log(
            "🏢 [useBusinessVehicles] Company ID from user data:",
            userData.company_id,
          );
          setCompanyId(userData.company_id || null);
        } else {
          console.warn(
            "⚠️ [useBusinessVehicles] No user data found in SecureStore",
          );
        }
      } catch (err) {
        console.error(
          "❌ [useBusinessVehicles] Error loading company ID:",
          err,
        );
      }
    };

    loadCompanyId();
  }, [companyIdProp]);

  /**
   * Charge la liste des véhicules
   */
  const loadVehicles = useCallback(async () => {
    // Ne rien charger si pas de company_id
    if (!companyId) {
      console.log(
        "⚠️ [useBusinessVehicles] No company ID, skipping vehicle load",
      );
      setVehicles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(
        "🚛 [useBusinessVehicles] Loading vehicles for company:",
        companyId,
      );
      const vehiclesList = await fetchBusinessVehicles(companyId);
      console.log(
        `✅ [useBusinessVehicles] Loaded ${vehiclesList.length} vehicles`,
      );
      setVehicles(vehiclesList);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load vehicles";
      setError(errorMessage);
      console.error("❌ [useBusinessVehicles] Error loading vehicles:", err);
      // En cas d'erreur, retourner liste vide (pas de mock)
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  /**
   * Crée un nouveau véhicule
   */
  const createVehicle = useCallback(
    async (vehicleData: VehicleCreateData): Promise<BusinessVehicle | null> => {
      if (!companyId) {
        console.error(
          "❌ [useBusinessVehicles] Cannot create vehicle: no company ID",
        );
        return null;
      }

      try {
        setIsCreating(true);
        setError(null);

        const newVehicle = await createBusinessVehicle(companyId, vehicleData);

        // Ajouter à la liste
        setVehicles((prev) => [...prev, newVehicle]);

        return newVehicle;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create vehicle";
        setError(errorMessage);
        console.error("❌ [useBusinessVehicles] Error creating vehicle:", err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [companyId],
  );

  /**
   * Crée plusieurs véhicules
   */
  const createMultiple = useCallback(
    async (
      vehiclesData: VehicleCreateData[],
    ): Promise<BusinessVehicle[] | null> => {
      if (!companyId) {
        console.error(
          "❌ [useBusinessVehicles] Cannot create vehicles: no company ID",
        );
        return null;
      }

      try {
        setIsCreating(true);
        setError(null);

        const newVehicles = await createMultipleVehicles(
          companyId,
          vehiclesData,
        );

        // Ajouter à la liste
        setVehicles((prev) => [...prev, ...newVehicles]);

        return newVehicles;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create vehicles";
        setError(errorMessage);
        console.error(
          "❌ [useBusinessVehicles] Error creating multiple vehicles:",
          err,
        );
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [companyId],
  );

  /**
   * Met à jour un véhicule existant
   */
  const updateVehicle = useCallback(
    async (
      vehicleId: string,
      updates: Partial<VehicleCreateData>,
    ): Promise<BusinessVehicle | null> => {
      if (!companyId) {
        console.error(
          "❌ [useBusinessVehicles] Cannot update vehicle: no company ID",
        );
        return null;
      }

      try {
        setIsUpdating(true);
        setError(null);

        const updatedVehicle = await updateBusinessVehicle(
          companyId,
          vehicleId,
          updates,
        );

        // Mettre à jour la liste
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicleId ? updatedVehicle : v)),
        );

        return updatedVehicle;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update vehicle";
        setError(errorMessage);
        console.error("❌ [useBusinessVehicles] Error updating vehicle:", err);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [companyId],
  );

  /**
   * Supprime un véhicule
   */
  const removeVehicle = useCallback(
    async (vehicleId: string) => {
      if (!companyId) {
        console.error(
          "❌ [useBusinessVehicles] Cannot delete vehicle: no company ID",
        );
        return;
      }

      try {
        setIsDeleting(true);
        setError(null);

        await deleteBusinessVehicle(companyId, vehicleId);

        // Retirer de la liste
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete vehicle";
        setError(errorMessage);
        console.error("❌ [useBusinessVehicles] Error deleting vehicle:", err);
      } finally {
        setIsDeleting(false);
      }
    },
    [companyId],
  );

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
  const getVehiclesByType = useCallback(
    (type: BusinessVehicle["type"]): BusinessVehicle[] => {
      return vehicles.filter((vehicle) => vehicle.type === type);
    },
    [vehicles],
  );

  /**
   * Récupère les véhicules disponibles
   */
  const getActiveVehicles = useCallback((): BusinessVehicle[] => {
    return vehicles.filter((vehicle) => vehicle.status === "available");
  }, [vehicles]);

  /**
   * Calcule les statistiques des véhicules
   */
  const getVehicleStats = useCallback(() => {
    const stats = {
      total: vehicles.length,
      active: vehicles.filter((v) => v.status === "available").length,
      maintenance: vehicles.filter((v) => v.status === "maintenance").length,
      byType: {} as Record<string, number>,
    };

    // Compter par type
    vehicles.forEach((vehicle) => {
      stats.byType[vehicle.type] = (stats.byType[vehicle.type] || 0) + 1;
    });

    return stats;
  }, [vehicles]);

  /**
   * Chargement initial - attendre que company_id soit chargé
   */
  useEffect(() => {
    console.log(
      "🎯 [useBusinessVehicles] useEffect triggered, companyId:",
      companyId,
    );
    if (companyId) {
      console.log(
        "✅ [useBusinessVehicles] Company ID available, loading vehicles for:",
        companyId,
      );
      loadVehicles();
    } else {
      console.log("⏳ [useBusinessVehicles] Waiting for company ID...");
    }
  }, [companyId, loadVehicles]);

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

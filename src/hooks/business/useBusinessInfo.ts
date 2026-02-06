/**
 * useBusinessInfo - Hook pour la gestion des informations business
 * Gère l'état des informations de l'entreprise avec API intégrée
 */
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
    createBusiness,
    deleteBusiness,
    fetchBusinessDetails,
    fetchBusinessList,
    fetchBusinessStats,
    updateBusinessInfo,
    type BusinessInfo,
    type BusinessStats,
} from "../../services/business";

interface UseBusinessInfoReturn {
  // État
  businesses: BusinessInfo[];
  currentBusiness: BusinessInfo | null;
  businessStats: BusinessStats | null;

  // États de chargement
  isLoading: boolean;
  isUpdating: boolean;
  isCreating: boolean;
  isDeleting: boolean;

  // État d'erreur
  error: string | null;

  // Actions
  loadBusinesses: () => Promise<void>;
  loadBusinessDetails: (businessId: string) => Promise<void>;
  createNewBusiness: (
    businessData: Omit<BusinessInfo, "id" | "created_at" | "updated_at">,
  ) => Promise<BusinessInfo | null>;
  updateBusiness: (
    businessId: string,
    updates: Partial<BusinessInfo>,
  ) => Promise<BusinessInfo | null>;
  removeBusiness: (businessId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  setCurrentBusiness: (business: BusinessInfo | null) => void;
}

export const useBusinessInfo = (): UseBusinessInfoReturn => {
  // États
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessInfo | null>(
    null,
  );
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(
    null,
  );

  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // État d'erreur
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge la liste des entreprises
   */
  const loadBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // D'abord essayer de charger depuis le profil utilisateur
      try {
        const userDataStr = await SecureStore.getItemAsync("user_data");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          console.log("[useBusinessInfo] User data loaded:", {
            hasCompany: !!userData.company,
            company_id: userData.company_id,
            company_role: userData.company_role,
          });

          // Si l'utilisateur a une company dans son profil, l'utiliser
          if (userData.company && userData.company_id) {
            const businessFromProfile: BusinessInfo = {
              id: userData.company_id.toString(),
              name: userData.company.name,
              address: "",
              city: "",
              state: "",
              postcode: "",
              phone: "",
              email: "",
              businessType: "Moving Services",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            console.log(
              "[useBusinessInfo] Using business from user profile:",
              businessFromProfile,
            );
            setBusinesses([businessFromProfile]);
            setCurrentBusiness(businessFromProfile);

            // Charger les stats si possible
            try {
              const stats = await fetchBusinessStats(businessFromProfile.id);
              setBusinessStats(stats);
            } catch (statsError) {
              console.warn(
                "[useBusinessInfo] Could not load business stats:",
                statsError,
              );
            }

            setIsLoading(false);
            return;
          }
        }
      } catch (userDataError) {
        console.warn(
          "[useBusinessInfo] Could not load user data from SecureStore:",
          userDataError,
        );
      }

      // Sinon, essayer l'API
      console.log("[useBusinessInfo] Fetching from API...");
      const businesses = await fetchBusinessList();
      console.log("[useBusinessInfo] Fetched businesses:", businesses);
      setBusinesses(businesses);

      // Charger les stats depuis l'API avec fallback
      if (businesses.length > 0) {
        try {
          const stats = await fetchBusinessStats(businesses[0].id);
          setBusinessStats(stats);
        } catch (statsError) {
          console.warn(
            "[useBusinessInfo] Could not load business stats:",
            statsError,
          );
          // Les stats par défaut sont gérées dans le service avec fallback
        }
      }

      // Si pas d'entreprise courante mais qu'il y en a dans la liste, prendre la première
      if (!currentBusiness && businesses.length > 0) {
        setCurrentBusiness(businesses[0]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load businesses";
      setError(errorMessage);
      console.error("[useBusinessInfo] Error loading businesses:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness]);

  /**
   * Charge les détails d'une entreprise spécifique
   */
  const loadBusinessDetails = useCallback(async (businessId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const business = await fetchBusinessDetails(businessId);
      setCurrentBusiness(business);

      // Mettre à jour la liste si l'entreprise existe
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? business : b)),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load business details";
      setError(errorMessage);
      console.error("Error loading business details:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crée une nouvelle entreprise
   */
  const createNewBusiness = useCallback(
    async (
      businessData: Omit<BusinessInfo, "id" | "created_at" | "updated_at">,
    ): Promise<BusinessInfo | null> => {
      try {
        setIsCreating(true);
        setError(null);

        const newBusiness = await createBusiness(businessData);

        // Ajouter à la liste
        setBusinesses((prev) => [...prev, newBusiness]);

        // Si c'est la première entreprise, la définir comme courante
        if (!currentBusiness) {
          setCurrentBusiness(newBusiness);
        }

        return newBusiness;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create business";
        setError(errorMessage);
        console.error("Error creating business:", err);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [currentBusiness],
  );

  /**
   * Met à jour une entreprise existante
   */
  const updateBusiness = useCallback(
    async (
      businessId: string,
      updates: Partial<BusinessInfo>,
    ): Promise<BusinessInfo | null> => {
      try {
        setIsUpdating(true);
        setError(null);

        const updatedBusiness = await updateBusinessInfo(businessId, updates);

        // Mettre à jour la liste
        setBusinesses((prev) =>
          prev.map((b) => (b.id === businessId ? updatedBusiness : b)),
        );

        // Mettre à jour l'entreprise courante si c'est elle
        if (currentBusiness?.id === businessId) {
          setCurrentBusiness(updatedBusiness);
        }

        return updatedBusiness;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update business";
        setError(errorMessage);
        console.error("Error updating business:", err);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [currentBusiness],
  );

  /**
   * Supprime une entreprise
   */
  const removeBusiness = useCallback(
    async (businessId: string) => {
      try {
        setIsDeleting(true);
        setError(null);

        await deleteBusiness(businessId);

        // Retirer de la liste
        setBusinesses((prev) => prev.filter((b) => b.id !== businessId));

        // Si c'était l'entreprise courante, la réinitialiser
        if (currentBusiness?.id === businessId) {
          setCurrentBusiness(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete business";
        setError(errorMessage);
        console.error("Error deleting business:", err);
      } finally {
        setIsDeleting(false);
      }
    },
    [currentBusiness],
  );

  /**
   * Actualise toutes les données
   */
  const refreshData = useCallback(async () => {
    await loadBusinesses();
  }, [loadBusinesses]);

  /**
   * Efface l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Chargement initial - Load businesses on mount
   */
  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    // État
    businesses,
    currentBusiness,
    businessStats,

    // États de chargement
    isLoading,
    isUpdating,
    isCreating,
    isDeleting,

    // État d'erreur
    error,

    // Actions
    loadBusinesses,
    loadBusinessDetails,
    createNewBusiness,
    updateBusiness,
    removeBusiness,
    refreshData,
    clearError,
    setCurrentBusiness,
  };
};

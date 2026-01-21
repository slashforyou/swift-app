// hooks/useClients.ts
import { useCallback, useEffect, useState } from "react";
import { ClientAPI, fetchClients } from "../services/clients";
import { isLoggedIn } from "../utils/auth";

interface UseClientsReturn {
  clients: ClientAPI[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalClients: number;
  archivedClients: number;
  activeClients: number;
}

export const useClients = (): UseClientsReturn => {
  const [clients, setClients] = useState<ClientAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Vérifier si l'utilisateur est connecté
      const loggedIn = await isLoggedIn();
      console.log("🔍 [useClients] User logged in:", loggedIn);

      if (!loggedIn) {
        console.warn("⚠️ [useClients] User not logged in");
        setError("Vous devez être connecté pour voir les clients.");
        setClients([]);
        return;
      }

      // Utiliser l'API réelle
      console.log("📡 [useClients] Fetching clients from API...");
      const apiClients = await fetchClients();
      console.log(
        `✅ [useClients] Received ${apiClients?.length || 0} clients:`,
        JSON.stringify(apiClients, null, 2),
      );

      if (!Array.isArray(apiClients)) {
        console.error(
          "❌ [useClients] API returned non-array:",
          typeof apiClients,
          apiClients,
        );
        setError("Format de données invalide reçu de l'API");
        setClients([]);
        return;
      }

      setClients(apiClients);
    } catch (err) {
      console.error("❌ [useClients] Error fetching clients:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        setError("Session expirée. Veuillez vous reconnecter.");
      } else if (
        errorMessage.includes("Network") ||
        errorMessage.includes("fetch")
      ) {
        setError("Problème de connexion réseau.");
      } else {
        setError(`Erreur lors du chargement des clients: ${errorMessage}`);
      }
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchClientsData();
  }, [fetchClientsData]);

  useEffect(() => {
    fetchClientsData();
  }, [fetchClientsData]);

  // Calculs dérivés avec protection contre undefined
  const safeClients = Array.isArray(clients) ? clients : [];
  const totalClients = safeClients.length;
  const archivedClients = safeClients.filter(
    (client) => client.isArchived,
  ).length;
  const activeClients = totalClients - archivedClients;

  return {
    clients: safeClients,
    isLoading,
    error,
    refetch,
    totalClients,
    archivedClients,
    activeClients,
  };
};

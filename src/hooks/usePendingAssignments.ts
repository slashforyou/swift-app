import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPendingAssignments, PendingAssignment } from "../services/jobs";
import { isLoggedIn } from "../utils/auth";

interface UsePendingAssignmentsReturn {
  assignments: PendingAssignment[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook qui récupère les jobs en attente de réponse pour le contractor connecté.
 * Utilisé sur la page d'accueil pour afficher les notifications d'assignation.
 */
export function usePendingAssignments(): UsePendingAssignmentsReturn {
  const [assignments, setAssignments] = useState<PendingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) return;

    setIsLoading(true);
    try {
      const data = await fetchPendingAssignments();
      if (isMounted.current) {
        setAssignments(data);
      }
    } catch {
      // Non-blocking: home screen should not crash if this fails
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { assignments, isLoading, refetch };
}

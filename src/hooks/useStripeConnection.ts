/**
 * Hook pour la détection de connexion Stripe
 */
import { useCallback, useEffect, useState } from 'react';

export interface StripeConnectionStatus {
  isConnected: boolean;
  status: 'not_connected' | 'incomplete' | 'active' | 'restricted' | 'pending';
  account?: any;
  details?: string;
}

export const useStripeConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<StripeConnectionStatus>({
    isConnected: false,
    status: 'not_connected'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TEMPORAIRE: Désactiver l'appel Stripe pour tester
      // const status = await checkStripeConnectionStatus();
      
      // Mock data pour tester l'interface
      const status = {
        isConnected: false,
        status: 'not_connected' as const,
        details: 'Stripe check temporarily disabled'
      };
      
      setConnectionStatus(status);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, []); // ✅ CORRECTION: Retirer checkConnection des dépendances

  return {
    ...connectionStatus,
    loading,
    error,
    refresh: checkConnection
  };
};
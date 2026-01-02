/**
 * Hook pour la détection de connexion Stripe
 */
import { useCallback, useEffect, useState } from 'react';
import { checkStripeConnectionStatus } from '../services/StripeService';

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
      
      // ✅ RÉACTIVÉ: Appel réel à l'API Stripe
      const status = await checkStripeConnectionStatus();
      
      setConnectionStatus(status);
      
    } catch (err) {

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnectionStatus({
        isConnected: false,
        status: 'not_connected',
        details: errorMessage
      });
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...connectionStatus,
    loading,
    error,
    refresh: checkConnection
  };
};
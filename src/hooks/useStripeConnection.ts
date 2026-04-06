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
  const [hasSucceeded, setHasSucceeded] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await checkStripeConnectionStatus();
      
      setConnectionStatus(status);
      setHasSucceeded(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      // Only set not_connected if we never had a successful check
      // This prevents flickering the banner on transient network errors
      if (!hasSucceeded) {
        setConnectionStatus({
          isConnected: false,
          status: 'not_connected',
          details: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  }, [hasSucceeded]);

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
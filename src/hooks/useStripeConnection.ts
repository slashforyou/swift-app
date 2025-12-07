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
      
      console.log('🔍 [STRIPE HOOK] Checking Stripe connection...');
      const status = await checkStripeConnectionStatus();
      
      console.log('✅ [STRIPE HOOK] Connection status result:', status);
      setConnectionStatus(status);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ [STRIPE HOOK] Error checking connection:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    ...connectionStatus,
    loading,
    error,
    refresh: checkConnection
  };
};
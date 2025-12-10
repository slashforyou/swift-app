/**
 * useStripeConnect - Hook pour la gestion de Stripe Connect
 * Gère l'onboarding, le statut du compte et les capacités
 */

import { useCallback, useEffect, useState } from 'react';
import { StripeConnectStatusResponse, StripeConnectionStatus } from '../types/stripe';

export interface UseStripeConnectResult {
  status: StripeConnectionStatus;
  loading: boolean;
  error: string | null;
  connectAccount: () => Promise<string>;
  refreshStatus: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useStripeConnect = (): UseStripeConnectResult => {
  const [status, setStatus] = useState<StripeConnectionStatus>({
    isConnected: false,
    status: 'not_connected',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Remplacer par vraie API
      const mockResponse: StripeConnectStatusResponse = {
        success: true,
        data: {
          status: 'not_connected',
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
          onboarding_completed: false,
        },
      };

      setStatus({
        isConnected: mockResponse.data.status === 'active',
        status: mockResponse.data.status,
        capabilities: {
          charges_enabled: mockResponse.data.charges_enabled,
          payouts_enabled: mockResponse.data.payouts_enabled,
        },
      });
    } catch (err) {
      console.error('[useStripeConnect] Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du statut Stripe');
    } finally {
      setLoading(false);
    }
  }, []);

  const connectAccount = useCallback(async (): Promise<string> => {
    setError(null);
    
    try {
      // TODO: Remplacer par vraie API
      const mockOnboardingUrl = 'https://connect.stripe.com/oauth/authorize?client_id=mock';
      return mockOnboardingUrl;
    } catch (err) {
      console.error('[useStripeConnect] Error creating account link:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du lien de connexion';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);
    setLoading(true);
    
    try {
      // TODO: Remplacer par vraie API
      console.log('[useStripeConnect] Disconnecting account...');
      
      setStatus({
        isConnected: false,
        status: 'not_connected',
      });
    } catch (err) {
      console.error('[useStripeConnect] Error disconnecting:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loading,
    error,
    connectAccount,
    refreshStatus,
    disconnect,
  };
};

export default useStripeConnect;
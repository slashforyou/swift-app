/**
 * useStripeConnect - Hook pour la gestion de Stripe Connect
 * Gère l'onboarding, le statut du compte et les capacités
 * ✅ Utilise les endpoints réels: GET /stripe/connect/status, GET /stripe/connect/onboarding, DELETE /stripe/connect/disconnect
 */

import { useCallback, useEffect, useState } from 'react';
import { ServerData } from '../constants/ServerData';
import { StripeConnectionStatus } from '../types/stripe';
import { fetchWithAuth } from '../utils/session';

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
      // ✅ Appeler l'API réelle GET /stripe/connect/status
      const response = await fetchWithAuth(`${ServerData.serverUrl}v1/stripe/connect/status`, {
        method: 'GET',
      });

      if (!response.ok) {
        // Si pas connecté (404 ou autre), mettre le statut à not_connected
        console.log('[useStripeConnect] Account not connected or API error:', response.status);
        setStatus({
          isConnected: false,
          status: 'not_connected',
        });
        return;
      }

      const data = await response.json();
      console.log('✅ [useStripeConnect] Status fetched:', data);

      const statusData = data.data || data;
      setStatus({
        isConnected: statusData.status === 'active' || statusData.onboarding_completed === true,
        status: statusData.status || (statusData.onboarding_completed ? 'active' : 'pending'),
        capabilities: {
          charges_enabled: statusData.charges_enabled || false,
          payouts_enabled: statusData.payouts_enabled || false,
        },
      });
    } catch (err) {
      console.error('[useStripeConnect] Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du statut Stripe');
      // En cas d'erreur, considérer comme non connecté
      setStatus({
        isConnected: false,
        status: 'not_connected',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const connectAccount = useCallback(async (): Promise<string> => {
    setError(null);
    
    try {
      // ✅ Appeler l'API réelle GET /stripe/connect/onboarding
      const response = await fetchWithAuth(`${ServerData.serverUrl}v1/stripe/connect/onboarding`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Échec de création du lien d'onboarding`);
      }

      const data = await response.json();
      console.log('✅ [useStripeConnect] Onboarding URL fetched:', data);

      // Retourner l'URL d'onboarding
      const onboardingUrl = data.data?.url || data.url || data.onboarding_url;
      if (!onboardingUrl) {
        throw new Error('URL d\'onboarding non trouvée dans la réponse');
      }

      return onboardingUrl;
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
      // ✅ Appeler l'API réelle DELETE /stripe/connect/disconnect
      console.log('[useStripeConnect] Disconnecting account...');
      
      const response = await fetchWithAuth(`${ServerData.serverUrl}v1/stripe/connect/disconnect`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Échec de la déconnexion`);
      }

      console.log('✅ [useStripeConnect] Account disconnected');
      
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
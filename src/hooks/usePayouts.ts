/**
 * usePayouts - Hook pour la gestion des virements Stripe
 * Gère la liste des payouts, création de virements et historique
 * ✅ Utilise les endpoints réels: GET /stripe/payouts, GET /stripe/balance, POST /stripe/payouts/create
 */

import { useCallback, useEffect, useState } from 'react';
import { ServerData } from '../constants/ServerData';
import { Payout } from '../types/stripe';
import { fetchWithAuth } from '../utils/session';

export interface UsePayoutsResult {
  payouts: Payout[];
  loading: boolean;
  error: string | null;
  balance: {
    available: number;
    pending: number;
    currency: string;
  };
  createPayout: (amount: number) => Promise<string>;
  refreshPayouts: () => Promise<void>;
}

export const usePayouts = (): UsePayoutsResult => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState({
    available: 0,
    pending: 0,
    currency: 'EUR',
  });

  const refreshPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ Appeler les APIs réelles en parallèle
      const [payoutsResponse, balanceResponse] = await Promise.all([
        fetchWithAuth(`${ServerData.serverUrl}v1/stripe/payouts`, { method: 'GET' }),
        fetchWithAuth(`${ServerData.serverUrl}v1/stripe/balance`, { method: 'GET' }),
      ]);

      // Traiter les payouts
      if (payoutsResponse.ok) {
        const payoutsData = await payoutsResponse.json();
        console.log('✅ [usePayouts] Payouts fetched:', payoutsData);
        
        // Mapper les données API vers notre type Payout
        const apiPayouts: Payout[] = (payoutsData.data || payoutsData || []).map((p: any) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency || 'aud',
          status: p.status,
          arrival_date: p.arrival_date ? p.arrival_date * 1000 : Date.now(), // Stripe retourne des timestamps en secondes
          created: p.created ? p.created * 1000 : Date.now(),
          method: p.method || 'standard',
          type: p.type || 'bank_account',
          description: p.description || 'Virement Stripe',
        }));
        setPayouts(apiPayouts);
      } else {
        console.warn('[usePayouts] Could not fetch payouts, using empty list');
        setPayouts([]);
      }

      // Traiter le balance
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log('✅ [usePayouts] Balance fetched:', balanceData);
        
        // Stripe retourne le balance en centimes
        const available = balanceData.data?.available?.[0] || balanceData.available?.[0] || { amount: 0, currency: 'aud' };
        const pending = balanceData.data?.pending?.[0] || balanceData.pending?.[0] || { amount: 0, currency: 'aud' };
        
        setBalance({
          available: (available.amount || 0) / 100,
          pending: (pending.amount || 0) / 100,
          currency: (available.currency || 'aud').toUpperCase(),
        });
      } else {
        console.warn('[usePayouts] Could not fetch balance, using defaults');
        setBalance({ available: 0, pending: 0, currency: 'AUD' });
      }
    } catch (err) {
      console.error('[usePayouts] Error fetching payouts:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des virements');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayout = useCallback(async (amount: number): Promise<string> => {
    setError(null);
    
    try {
      console.log('[usePayouts] Creating payout for amount:', amount);
      
      // ✅ Appeler l'API réelle POST /stripe/payouts/create
      const response = await fetchWithAuth(`${ServerData.serverUrl}v1/stripe/payouts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convertir en centimes
          currency: 'aud',
          method: 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Échec de création du virement`);
      }

      const data = await response.json();
      console.log('✅ [usePayouts] Payout created:', data);

      const newPayout: Payout = {
        id: data.data?.id || data.id || `po_${Date.now()}`,
        amount: amount * 100,
        currency: 'aud',
        status: 'pending',
        arrival_date: Date.now() + 86400000,
        created: Date.now(),
        method: 'standard',
        type: 'bank_account',
        description: 'Virement manuel',
      };

      setPayouts(prev => [newPayout, ...prev]);
      setBalance(prev => ({
        ...prev,
        available: prev.available - amount,
        pending: prev.pending + amount,
      }));

      return newPayout.id;
    } catch (err) {
      console.error('[usePayouts] Error creating payout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du virement';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    refreshPayouts();
  }, [refreshPayouts]);

  return {
    payouts,
    loading,
    error,
    balance,
    createPayout,
    refreshPayouts,
  };
};

export default usePayouts;
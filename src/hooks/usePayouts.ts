/**
 * usePayouts - Hook pour la gestion des virements Stripe
 * Gère la liste des payouts, création de virements et historique
 */

import { useCallback, useEffect, useState } from 'react';
import { Payout } from '../types/stripe';

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
      // TODO: Remplacer par vraie API
      const mockPayouts: Payout[] = [
        {
          id: 'po_mock_1',
          amount: 50000, // 500.00 EUR en centimes
          currency: 'eur',
          status: 'paid',
          arrival_date: Date.now() + 86400000, // +1 jour
          created: Date.now() - 86400000, // -1 jour
          method: 'standard',
          type: 'bank_account',
          description: 'Virement automatique hebdomadaire',
        },
        {
          id: 'po_mock_2',
          amount: 25000, // 250.00 EUR
          currency: 'eur',
          status: 'pending',
          arrival_date: Date.now() + 172800000, // +2 jours
          created: Date.now() - 3600000, // -1 heure
          method: 'instant',
          type: 'bank_account',
          description: 'Virement instantané',
        },
      ];

      setPayouts(mockPayouts);
      setBalance({
        available: 1250.50,
        pending: 300.25,
        currency: 'EUR',
      });
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
      // TODO: Remplacer par vraie API
      console.log('[usePayouts] Creating payout for amount:', amount);
      
      const newPayout: Payout = {
        id: `po_mock_${Date.now()}`,
        amount: amount * 100, // Convertir en centimes
        currency: 'eur',
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
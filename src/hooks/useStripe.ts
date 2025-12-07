/**
 * Hooks Stripe - Hooks React pour gérer les données Stripe
 */
import { useCallback, useEffect, useState } from 'react';
import {
    createInstantPayout,
    createStripePaymentLink,
    fetchStripeAccount,
    fetchStripeBalance,
    fetchStripePayments,
    fetchStripePayouts,
    updateStripeAccountSettings
} from '../services/StripeService';
import { type PaymentStatus, type PayoutStatus, type StripePaymentLinkRequest } from '../types/stripeTypes';

// Types pour nos hooks
export interface Payment {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  customer: string;
  method: string;
}

export interface Payout {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  description: string;
  arrivalDate: string;
  method: 'standard' | 'instant';
  type: 'bank_account' | 'card';
}

export interface AccountInfo {
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_completed: boolean;
  business_name: string;
  support_email: string;
  country: string;
  default_currency: string;
  available_balance: number;
  pending_balance: number;
  bank_accounts: Array<{
    id: string;
    bank_name: string;
    last4: string;
    currency: string;
  }>;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    disabled_reason: string | null;
  };
}

/**
 * Hook pour gérer les paiements Stripe
 */
export const useStripePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async (refresh = false) => {
    if (loading && !refresh) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchStripePayments();
      setPayments(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des paiements';
      setError(errorMessage);
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadPayments();
  }, []);

  return {
    payments,
    loading,
    error,
    refresh: () => loadPayments(true)
  };
};

/**
 * Hook pour gérer les virements Stripe
 */
export const useStripePayouts = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayouts = useCallback(async (refresh = false) => {
    if (loading && !refresh) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchStripePayouts();
      setPayouts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des virements';
      setError(errorMessage);
      console.error('Error loading payouts:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const createPayout = useCallback(async (amount: number): Promise<string> => {
    setError(null);
    try {
      const payoutId = await createInstantPayout(amount);
      // Refresh les données après création
      await loadPayouts(true);
      return payoutId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du virement';
      setError(errorMessage);
      throw err;
    }
  }, [loadPayouts]);

  useEffect(() => {
    loadPayouts();
  }, []);

  return {
    payouts,
    loading,
    error,
    refresh: () => loadPayouts(true),
    createPayout
  };
};

/**
 * Hook pour gérer le compte Stripe
 */
export const useStripeAccount = () => {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [balance, setBalance] = useState<{ available: number; pending: number }>({ available: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccount = useCallback(async (refresh = false) => {
    if (loading && !refresh) return;

    setLoading(true);
    setError(null);

    try {
      const [accountData, balanceData] = await Promise.all([
        fetchStripeAccount(),
        fetchStripeBalance()
      ]);

      setAccount({
        ...accountData,
        available_balance: balanceData.available,
        pending_balance: balanceData.pending
      });
      setBalance(balanceData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du compte';
      setError(errorMessage);
      console.error('Error loading account:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const updateSettings = useCallback(async (settings: {
    business_name?: string;
    support_email?: string;
    support_phone?: string;
    statement_descriptor?: string;
  }) => {
    setError(null);
    try {
      await updateStripeAccountSettings(settings);
      // Refresh les données après mise à jour
      await loadAccount(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw err;
    }
  }, [loadAccount]);

  useEffect(() => {
    loadAccount();
  }, []);

  return {
    account,
    balance,
    loading,
    error,
    refresh: () => loadAccount(true),
    updateSettings
  };
};

/**
 * Hook pour créer des liens de paiement
 */
export const useStripePaymentLinks = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentLink = useCallback(async (request: StripePaymentLinkRequest): Promise<string> => {
    setCreating(true);
    setError(null);

    try {
      const url = await createStripePaymentLink(request);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du lien';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return {
    createPaymentLink,
    creating,
    error
  };
};

/**
 * Hook combiné pour toutes les données Stripe
 */
export const useStripeData = () => {
  const payments = useStripePayments();
  const payouts = useStripePayouts();
  const account = useStripeAccount();
  const paymentLinks = useStripePaymentLinks();

  const refreshAll = useCallback(() => {
    payments.refresh();
    payouts.refresh();
    account.refresh();
  }, [payments, payouts, account]);

  const isLoading = payments.loading || payouts.loading || account.loading;
  const hasError = payments.error || payouts.error || account.error;

  return {
    payments,
    payouts,
    account,
    paymentLinks,
    refreshAll,
    isLoading,
    hasError
  };
};
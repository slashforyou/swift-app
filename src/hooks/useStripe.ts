/**
 * Hooks Stripe - Hooks React pour gérer les données Stripe
 */
import { useCallback, useEffect, useState } from 'react';
import {
    createInstantPayout,
    createStripePaymentLink,
    deactivateStripePaymentLink,
    fetchStripeAccount,
    fetchStripeBalance,
    fetchStripePaymentLinks,
    fetchStripePayments,
    fetchStripePayouts,
    getStripeAccountSettings,
    getStripePaymentLink,
    getStripeSettingsHistory,
    updateStripeAccountSettings,
    updateStripePaymentLink,
    type CreatePaymentLinkRequest,
    type PaymentLink,
    type SettingsHistoryEntry,
    type StripeAccountSettings
} from '../services/StripeService';
import { type PaymentStatus, type PayoutStatus } from '../types/stripeTypes';

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
  receipt_url?: string; // URL du reçu Stripe
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
  bank_accounts: {
    id: string;
    bank_name: string;
    last4: string;
    currency: string;
  }[];
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

  const updateSettings = useCallback(async (settings: Partial<Omit<StripeAccountSettings, 'account_status'>>) => {
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
 * Utilise les nouveaux endpoints Payment Links API
 */
export const useStripePaymentLinks = () => {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentLinks = useCallback(async (options?: { limit?: number; active?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchStripePaymentLinks(options);
      setPaymentLinks(data.payment_links);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des liens';
      setError(errorMessage);
      console.error('Error loading payment links:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPaymentLink = useCallback(async (request: CreatePaymentLinkRequest): Promise<PaymentLink> => {
    setCreating(true);
    setError(null);

    try {
      const paymentLink = await createStripePaymentLink(request);
      // Ajouter le nouveau lien à la liste
      setPaymentLinks(prev => [paymentLink, ...prev]);
      return paymentLink;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du lien';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  const getPaymentLink = useCallback(async (linkId: string): Promise<PaymentLink> => {
    setError(null);
    try {
      return await getStripePaymentLink(linkId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du lien';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePaymentLink = useCallback(async (
    linkId: string,
    updates: { active?: boolean; metadata?: Record<string, string> }
  ): Promise<PaymentLink> => {
    setError(null);
    try {
      const updatedLink = await updateStripePaymentLink(linkId, updates);
      // Mettre à jour dans la liste locale
      setPaymentLinks(prev => prev.map(link => 
        link.id === linkId ? updatedLink : link
      ));
      return updatedLink;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du lien';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deactivatePaymentLink = useCallback(async (linkId: string): Promise<void> => {
    setError(null);
    try {
      await deactivateStripePaymentLink(linkId);
      // Mettre à jour le statut dans la liste locale
      setPaymentLinks(prev => prev.map(link => 
        link.id === linkId ? { ...link, active: false } : link
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la désactivation du lien';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadPaymentLinks();
  }, []);

  return {
    paymentLinks,
    loading,
    creating,
    error,
    refresh: loadPaymentLinks,
    createPaymentLink,
    getPaymentLink,
    updatePaymentLink,
    deactivatePaymentLink
  };
};

/**
 * Hook pour gérer les paramètres du compte Stripe
 * Utilise les nouveaux endpoints Account Settings API
 */
export const useStripeSettings = () => {
  const [settings, setSettings] = useState<StripeAccountSettings | null>(null);
  const [history, setHistory] = useState<SettingsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getStripeAccountSettings();
      setSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des paramètres';
      setError(errorMessage);
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (
    newSettings: Partial<Omit<StripeAccountSettings, 'account_status'>>
  ): Promise<StripeAccountSettings> => {
    setSaving(true);
    setError(null);

    try {
      const updatedSettings = await updateStripeAccountSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const loadHistory = useCallback(async (limit?: number) => {
    setError(null);
    try {
      const historyData = await getStripeSettingsHistory(limit);
      setHistory(historyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique';
      setError(errorMessage);
      console.error('Error loading history:', err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    history,
    loading,
    saving,
    error,
    refresh: loadSettings,
    updateSettings,
    loadHistory
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
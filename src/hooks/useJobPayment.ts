/**
 * useJobPayment - Hook React pour gérer les paiements de jobs
 * Intégration complète avec le système Stripe Payment Intents
 */
import { useCallback, useState } from 'react';
import {
    confirmJobPayment,
    createJobPaymentIntent,
    getJobPaymentHistory
} from '../services/StripeService';

// Types pour le hook
export interface JobPaymentIntent {
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  application_fee_amount: number;
  status: string;
  metadata: any;
}

export interface JobPaymentHistory {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    description: string;
    created: string;
    updated: string | null;
    application_fee: number;
    method: string | null;
    metadata: {
      swiftapp_job_id: string;
      swiftapp_user_id: string;
      job_title?: string;
    };
  }>;
  meta: {
    job_id: number;
    total_payments: number;
    source: string;
  };
}

export interface UseJobPaymentState {
  // État du paiement
  paymentIntent: JobPaymentIntent | null;
  loading: boolean;
  error: string | null;
  
  // État de confirmation
  confirming: boolean;
  confirmationResult: any;
  
  // Historique des paiements
  paymentHistory: JobPaymentHistory | null;
  loadingHistory: boolean;
}

export interface UseJobPaymentActions {
  // Créer un Payment Intent
  createPayment: (jobId: string | number, options?: {
    amount?: number;
    currency?: string;
    description?: string;
  }) => Promise<JobPaymentIntent>;
  
  // Confirmer le paiement après Stripe
  confirmPayment: (jobId: string | number, paymentIntentId: string, status: 'succeeded' | 'failed') => Promise<any>;
  
  // Charger l'historique
  loadHistory: (jobId: string | number) => Promise<JobPaymentHistory>;
  
  // Reset de l'état
  reset: () => void;
}

/**
 * Hook principal pour les paiements de jobs
 */
export const useJobPayment = (): UseJobPaymentState & UseJobPaymentActions => {
  // État principal
  const [state, setState] = useState<UseJobPaymentState>({
    paymentIntent: null,
    loading: false,
    error: null,
    confirming: false,
    confirmationResult: null,
    paymentHistory: null,
    loadingHistory: false
  });

  // Fonction utilitaire pour mettre à jour l'état
  const updateState = useCallback((updates: Partial<UseJobPaymentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Créer un Payment Intent pour un job
  const createPayment = useCallback(async (
    jobId: string | number,
    options?: {
      amount?: number;
      currency?: string;
      description?: string;
    }
  ): Promise<JobPaymentIntent> => {
    console.log(`💳 [useJobPayment] Creating payment for job ${jobId}...`);
    
    updateState({ loading: true, error: null });

    try {
      const paymentIntent = await createJobPaymentIntent(jobId, options || {});
      
      updateState({ 
        paymentIntent,
        loading: false 
      });
      
      console.log(`✅ [useJobPayment] Payment Intent created:`, paymentIntent.payment_intent_id);
      return paymentIntent;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du paiement';
      console.error(`❌ [useJobPayment] Create payment error:`, error);
      
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      
      throw error;
    }
  }, [updateState]);

  // Confirmer le paiement après traitement Stripe
  const confirmPayment = useCallback(async (
    jobId: string | number,
    paymentIntentId: string,
    status: 'succeeded' | 'failed'
  ): Promise<any> => {
    console.log(`✅ [useJobPayment] Confirming payment for job ${jobId}...`);
    
    updateState({ confirming: true, error: null });

    try {
      const result = await confirmJobPayment(jobId, paymentIntentId, status);
      
      updateState({ 
        confirming: false,
        confirmationResult: result
      });
      
      console.log(`✅ [useJobPayment] Payment confirmed:`, result.payment_status);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la confirmation du paiement';
      console.error(`❌ [useJobPayment] Confirm payment error:`, error);
      
      updateState({ 
        confirming: false, 
        error: errorMessage 
      });
      
      throw error;
    }
  }, [updateState]);

  // Charger l'historique des paiements
  const loadHistory = useCallback(async (
    jobId: string | number
  ): Promise<JobPaymentHistory> => {
    console.log(`📊 [useJobPayment] Loading payment history for job ${jobId}...`);
    
    updateState({ loadingHistory: true, error: null });

    try {
      const history = await getJobPaymentHistory(jobId);
      
      updateState({ 
        paymentHistory: history,
        loadingHistory: false 
      });
      
      console.log(`✅ [useJobPayment] History loaded:`, history.payments.length, 'payments');
      return history;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de l\'historique';
      console.error(`❌ [useJobPayment] Load history error:`, error);
      
      updateState({ 
        loadingHistory: false, 
        error: errorMessage 
      });
      
      throw error;
    }
  }, [updateState]);

  // Reset de l'état
  const reset = useCallback(() => {
    console.log('🔄 [useJobPayment] Resetting state...');
    setState({
      paymentIntent: null,
      loading: false,
      error: null,
      confirming: false,
      confirmationResult: null,
      paymentHistory: null,
      loadingHistory: false
    });
  }, []);

  return {
    // État
    ...state,
    
    // Actions
    createPayment,
    confirmPayment,
    loadHistory,
    reset
  };
};

/**
 * Hook simplifié pour les paiements rapides
 * Combine création + confirmation en une seule action
 */
export const useQuickJobPayment = () => {
  const jobPayment = useJobPayment();

  const processPayment = useCallback(async (
    jobId: string | number,
    stripeConfirmFunction: (clientSecret: string) => Promise<any>,
    options?: {
      amount?: number;
      currency?: string;
      description?: string;
    }
  ) => {
    try {
      console.log(`🚀 [useQuickJobPayment] Processing payment for job ${jobId}...`);
      
      // 1. Créer le Payment Intent
      const paymentIntent = await jobPayment.createPayment(jobId, options);
      
      // 2. Traiter avec Stripe (frontend)
      const stripeResult = await stripeConfirmFunction(paymentIntent.client_secret);
      
      // 3. Confirmer côté backend
      const confirmStatus = stripeResult.error ? 'failed' : 'succeeded';
      const finalResult = await jobPayment.confirmPayment(
        jobId,
        paymentIntent.payment_intent_id,
        confirmStatus
      );

      console.log(`✅ [useQuickJobPayment] Payment processed successfully`);
      return { stripeResult, finalResult };

    } catch (error) {
      console.error(`❌ [useQuickJobPayment] Payment processing failed:`, error);
      throw error;
    }
  }, [jobPayment]);

  return {
    ...jobPayment,
    processPayment
  };
};

export default useJobPayment;
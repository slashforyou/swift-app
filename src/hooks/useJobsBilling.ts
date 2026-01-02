import { useCallback, useEffect, useState } from 'react';
import { fetchJobs } from '../services/jobs';
import { createStripeInvoice } from '../services/StripeService';

export interface JobBilling {
  id: string;
  code?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  client: {
    name?: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  time: {
    startWindowStart: string;
    endWindowStart: string;
  };
  addresses: {
    type: string;
    street: string;
    city: string;
  }[];
  billing: {
    estimatedCost: number;
    actualCost?: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    currency: string;
  };
}

export interface UseJobsBillingResult {
  jobs: JobBilling[];
  isLoading: boolean;
  error: string | null;
  totalUnpaid: number;
  totalPartial: number;
  totalPaid: number;
  refreshJobs: () => Promise<void>;
  createInvoice: (jobId: string) => Promise<void>;
  processRefund: (jobId: string, amount: number) => Promise<void>;
}

export const useJobsBilling = (): UseJobsBillingResult => {
  const [jobs, setJobs] = useState<JobBilling[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction utilitaire pour déterminer le status de paiement
  const determinePaymentStatus = useCallback((actualCost: number, estimatedCost: number): 'unpaid' | 'partial' | 'paid' => {
    if (!actualCost || actualCost === 0) return 'unpaid';
    if (actualCost < estimatedCost) return 'partial';
    return 'paid';
  }, []);

  // Convertir les données API vers le format de billing
  const convertToJobBilling = useCallback((apiJob: any): JobBilling => {
    const estimatedCost = apiJob.estimatedCost || apiJob.estimated_cost || 0;
    const actualCost = apiJob.actualCost || apiJob.actual_cost || 0;

    return {
      id: apiJob.id,
      code: apiJob.code,
      status: apiJob.status,
      client: {
        name: apiJob.client?.name,
        firstName: apiJob.client?.firstName || apiJob.client?.first_name || '',
        lastName: apiJob.client?.lastName || apiJob.client?.last_name || '',
        phone: apiJob.client?.phone || '',
        email: apiJob.client?.email || '',
      },
      time: {
        startWindowStart: apiJob.time?.startWindowStart || apiJob.scheduled_date || '',
        endWindowStart: apiJob.time?.endWindowStart || '',
      },
      addresses: apiJob.addresses || [
        {
          type: 'pickup',
          street: apiJob.pickupAddress || apiJob.pickup_address || '',
          city: 'Sydney',
        }
      ],
      billing: {
        estimatedCost,
        actualCost,
        paymentStatus: determinePaymentStatus(actualCost, estimatedCost),
        currency: 'AUD',
      },
    };
  }, [determinePaymentStatus]);

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Récupérer les jobs de l'année courante pour la facturation
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      
      // TEMP_DISABLED: console.log(`📋 [useJobsBilling] Fetching jobs for billing from ${startOfYear.toLocaleDateString()} to ${endOfYear.toLocaleDateString()}`);
      
      const apiJobs = await fetchJobs(startOfYear, endOfYear);
      
      if (!apiJobs || !Array.isArray(apiJobs)) {
        console.warn('⚠️ [useJobsBilling] Invalid API response:', apiJobs);
        setJobs([]);
        return;
      }

      // Convertir et filtrer uniquement les jobs terminés ou en cours (qui peuvent être facturés)
      const billingJobs = apiJobs
        .filter(job => job.status === 'completed' || job.status === 'in-progress')
        .map(convertToJobBilling)
        .sort((a, b) => new Date(b.time.startWindowStart).getTime() - new Date(a.time.startWindowStart).getTime());

      // TEMP_DISABLED: console.log(`✅ [useJobsBilling] Loaded ${billingJobs.length} jobs for billing`);
      setJobs(billingJobs);

    } catch (err) {

      console.error('❌ [useJobsBilling] Error loading jobs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [convertToJobBilling]);

  const refreshJobs = async () => {
    await loadJobs();
  };

  const createInvoice = async (jobId: string) => {
    try {
      // Trouver le job pour récupérer les infos client
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // ✅ Appel réel au service Stripe pour créer la facture
      const invoiceData = {
        customer_email: job.client.email,
        customer_name: job.client.name || `${job.client.firstName} ${job.client.lastName}`,
        description: `Invoice for Job ${job.code || jobId}`,
        line_items: [
          {
            description: `Moving Service - Job ${job.code || jobId}`,
            quantity: 1,
            unit_amount: Math.round((job.billing.estimatedCost || 0) * 100), // En centimes
            currency: job.billing.currency || 'AUD'
          }
        ],
        metadata: {
          job_id: jobId,
          job_code: job.code || ''
        }
      };

      const result = await createStripeInvoice(invoiceData);
      
      // Mettre à jour le job pour indiquer qu'une facture a été créée
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === jobId 
            ? {
                ...j,
                billing: {
                  ...j.billing,
                  paymentStatus: 'unpaid' // Facture créée mais pas encore payée
                }
              }
            : job
        )
      );
      
      // TEMP_DISABLED: console.log(`✅ [useJobsBilling] Invoice created for job ${jobId}`);
    } catch (err) {

      console.error('❌ [useJobsBilling] Error creating invoice:', err);
      throw new Error('Erreur lors de la création de la facture');
    }
  };

  const processRefund = async (jobId: string, amount: number) => {
    try {
      // TEMP_DISABLED: console.log(`💸 [useJobsBilling] Processing refund of ${amount} for job ${jobId}`);
      
      // Simuler le traitement du remboursement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour le job avec le remboursement
      setJobs(prevJobs => 
        prevJobs.map(job => {
          if (job.id === jobId) {
            const newActualCost = Math.max(0, (job.billing.actualCost || 0) - amount);
            return {
              ...job,
              billing: {
                ...job.billing,
                actualCost: newActualCost,
                paymentStatus: determinePaymentStatus(newActualCost, job.billing.estimatedCost)
              }
            };
          }
          return job;
        })
      );
      
      // TEMP_DISABLED: console.log(`✅ [useJobsBilling] Refund processed for job ${jobId}`);
    } catch (err) {

      console.error('❌ [useJobsBilling] Error processing refund:', err);
      throw new Error('Erreur lors du traitement du remboursement');
    }
  };

  // Calculer les totaux
  const totalUnpaid = jobs.filter(job => job.billing.paymentStatus === 'unpaid').length;
  const totalPartial = jobs.filter(job => job.billing.paymentStatus === 'partial').length;
  const totalPaid = jobs.filter(job => job.billing.paymentStatus === 'paid').length;

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    isLoading,
    error,
    totalUnpaid,
    totalPartial,
    totalPaid,
    refreshJobs,
    createInvoice,
    processRefund,
  };
};
/**
 * Tests pour useJobsBilling hook
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { JobBilling, useJobsBilling } from '../../src/hooks/useJobsBilling';

// Mock du service jobs
jest.mock('../../src/services/jobs', () => ({
  fetchJobs: jest.fn()
}));

// Mock du service Stripe
jest.mock('../../src/services/StripeService', () => ({
  createStripeInvoice: jest.fn().mockResolvedValue({
    id: 'inv_123',
    status: 'open',
    amount_due: 50000
  })
}));

// Mock des données de test
const mockApiJobs = [
  {
    id: 'job1',
    code: 'JOB001',
    status: 'completed',
    client: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+61 400 000 001',
      email: 'john.doe@email.com'
    },
    time: {
      startWindowStart: '2025-10-20T08:00:00Z',
      endWindowStart: '2025-10-20T12:00:00Z'
    },
    addresses: [{
      type: 'pickup',
      street: '123 Collins Street',
      city: 'Sydney'
    }],
    estimatedCost: 500,
    actualCost: 550
  },
  {
    id: 'job2',
    code: 'JOB002', 
    status: 'completed',
    client: {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+61 400 000 002',
      email: 'jane.smith@email.com'
    },
    time: {
      startWindowStart: '2025-10-21T09:00:00Z',
      endWindowStart: '2025-10-21T13:00:00Z'
    },
    addresses: [{
      type: 'pickup',
      street: '456 George Street',
      city: 'Sydney'
    }],
    estimatedCost: 300,
    actualCost: 0
  }
];

const { fetchJobs } = require('../../src/services/jobs');

describe('useJobsBilling Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chargement des jobs', () => {
    it('devrait charger les jobs avec succès', async () => {
      fetchJobs.mockResolvedValueOnce(mockApiJobs);

      const { result } = renderHook(() => useJobsBilling());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.jobs).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('devrait filtrer uniquement les jobs terminés et en cours', async () => {
      const jobsWithPending = [
        ...mockApiJobs,
        {
          id: 'job3',
          status: 'pending',
          client: { firstName: 'Test', lastName: 'User' },
          estimatedCost: 200
        }
      ];

      fetchJobs.mockResolvedValueOnce(jobsWithPending);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Seuls les jobs 'completed' et 'in-progress' sont inclus
      expect(result.current.jobs).toHaveLength(2);
    });
  });

  describe('Statut des paiements', () => {
    it('devrait calculer correctement les statuts de paiement', async () => {
      fetchJobs.mockResolvedValueOnce(mockApiJobs);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Job1: actualCost (550) >= estimatedCost (500) = paid
      expect(result.current.jobs[1].billing.paymentStatus).toBe('paid');
      
      // Job2: actualCost (0) = unpaid
      expect(result.current.jobs[0].billing.paymentStatus).toBe('unpaid');
    });

    it('devrait calculer les totaux par statut', async () => {
      fetchJobs.mockResolvedValueOnce(mockApiJobs);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalPaid).toBe(1);
      expect(result.current.totalUnpaid).toBe(1);
      expect(result.current.totalPartial).toBe(0);
    });
  });

  describe('Actions de facturation', () => {
    it('devrait créer une facture', async () => {
      fetchJobs.mockResolvedValueOnce(mockApiJobs);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.createInvoice('job2');

      // Le job non payé devrait maintenant avoir le statut 'unpaid' confirmé
      const updatedJob = result.current.jobs.find((job: JobBilling) => job.id === 'job2');
      expect(updatedJob?.billing.paymentStatus).toBe('unpaid');
    });

    it('devrait traiter un remboursement', async () => {
      fetchJobs.mockResolvedValueOnce(mockApiJobs);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.processRefund('job1', 100);

      // Attendre que la mise à jour du state soit terminée
      await waitFor(() => {
        const refundedJob = result.current.jobs.find((job: JobBilling) => job.id === 'job1');
        expect(refundedJob?.billing.actualCost).toBe(450);
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de chargement', async () => {
      const errorMessage = 'Erreur réseau';
      fetchJobs.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.jobs).toHaveLength(0);
    });

    it('devrait gérer les réponses API invalides', async () => {
      fetchJobs.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.jobs).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Actualisation des données', () => {
    it('devrait permettre de rafraîchir les jobs', async () => {
      fetchJobs.mockResolvedValueOnce(mockApiJobs);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Vérifier qu'on a bien les 2 jobs initiaux
      expect(result.current.jobs).toHaveLength(2);

      // Mocker la réponse pour le refresh avec moins de jobs
      fetchJobs.mockResolvedValueOnce([mockApiJobs[0]]);

      await result.current.refreshJobs();

      // Attendre que le refresh soit terminé
      await waitFor(() => {
        expect(result.current.jobs).toHaveLength(1);
      });
    });
  });

  describe('Conversion des données', () => {
    it('devrait convertir correctement les données API', async () => {
      fetchJobs.mockResolvedValueOnce([mockApiJobs[0]]);

      const { result } = renderHook(() => useJobsBilling());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const job = result.current.jobs[0];
      expect(job.id).toBe('job1');
      expect(job.code).toBe('JOB001');
      expect(job.client.firstName).toBe('John');
      expect(job.billing.currency).toBe('AUD');
      expect(job.billing.estimatedCost).toBe(500);
      expect(job.billing.actualCost).toBe(550);
    });
  });
});
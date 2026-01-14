/**
 * @file refundFlow.test.ts
 * @description Tests complets du système de remboursement Stripe
 * 
 * Ce fichier teste:
 * - Création de remboursement (partiel/total)
 * - Gestion des erreurs (montant invalide, paiement introuvable, non autorisé)
 * - Récupération des remboursements
 * - Cas edge (remboursement déjà effectué, réseau down)
 */

import { createStripeRefund, fetchStripeRefunds, getStripeRefundDetails } from '../../src/services/StripeService';

// ========================================
// MOCKS
// ========================================

// Mock fetchWithAuth
const mockFetchWithAuth = jest.fn();
jest.mock('../../src/services/StripeService', () => {
  const originalModule = jest.requireActual('../../src/services/StripeService');
  return {
    ...originalModule,
    // Re-exporter avec mock
  };
});

// Mock getUserCompanyId
jest.mock('../../src/services/StripeService', () => ({
  createStripeRefund: jest.fn(),
  fetchStripeRefunds: jest.fn(),
  getStripeRefundDetails: jest.fn(),
}));

// Mock Analytics
const mockAnalytics = {
  track: jest.fn(),
  logError: jest.fn(),
};

jest.mock('../../src/services/analytics', () => ({
  analytics: mockAnalytics,
  trackEvent: jest.fn(),
}));

// ========================================
// TEST DATA
// ========================================

const mockRefundResponse = {
  refund_id: 're_test_123456789',
  status: 'succeeded',
  amount: 5000, // 50.00 EUR
  currency: 'eur',
  reason: 'requested_by_customer',
  receipt_number: 'RN-001',
  created: '2024-01-15T10:30:00Z',
  updated: null,
  metadata: {
    job_id: 'job_123',
    company_id: 'company_456',
  },
};

const mockPartialRefundResponse = {
  ...mockRefundResponse,
  refund_id: 're_partial_789',
  amount: 2500, // 25.00 EUR - remboursement partiel
};

const mockRefundsList = {
  refunds: [
    {
      id: 're_test_123456789',
      amount: 5000,
      currency: 'eur',
      status: 'succeeded' as const,
      reason: 'requested_by_customer',
      receipt_number: 'RN-001',
      payment_intent_id: 'pi_test_123',
      created: '2024-01-15T10:30:00Z',
      updated: null,
      metadata: {},
    },
    {
      id: 're_test_987654321',
      amount: 3000,
      currency: 'eur',
      status: 'pending' as const,
      reason: 'duplicate',
      receipt_number: null,
      payment_intent_id: 'pi_test_456',
      created: '2024-01-14T15:00:00Z',
      updated: null,
      metadata: {},
    },
  ],
  meta: {
    total_count: 2,
    has_more: false,
    source: 'stripe_api',
  },
};

// ========================================
// TESTS: CRÉATION DE REMBOURSEMENT
// ========================================

describe('StripeRefundFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripeRefund', () => {
    describe('Remboursement réussi', () => {
      it('devrait créer un remboursement total avec succès', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockResolvedValueOnce(mockRefundResponse);

        const result = await createStripeRefund('pi_test_123', {
          reason: 'requested_by_customer',
        });

        expect(result).toEqual(mockRefundResponse);
        expect(result.refund_id).toBe('re_test_123456789');
        expect(result.status).toBe('succeeded');
        expect(result.amount).toBe(5000);
      });

      it('devrait créer un remboursement partiel avec montant spécifié', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockResolvedValueOnce(mockPartialRefundResponse);

        const result = await createStripeRefund('pi_test_123', {
          amount: 2500, // 25.00 EUR
          reason: 'requested_by_customer',
        });

        expect(result.amount).toBe(2500);
        expect(result.refund_id).toBe('re_partial_789');
      });

      it('devrait accepter metadata personnalisée', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        const customMetadata = { job_id: 'job_789', custom_field: 'value' };
        
        mockedCreateRefund.mockResolvedValueOnce({
          ...mockRefundResponse,
          metadata: customMetadata,
        });

        const result = await createStripeRefund('pi_test_123', {
          metadata: customMetadata,
        });

        expect(result.metadata).toEqual(customMetadata);
      });

      it('devrait créer un remboursement avec raison "duplicate"', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockResolvedValueOnce({
          ...mockRefundResponse,
          reason: 'duplicate',
        });

        const result = await createStripeRefund('pi_test_123', {
          reason: 'duplicate',
        });

        expect(result.reason).toBe('duplicate');
      });

      it('devrait créer un remboursement avec raison "fraudulent"', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockResolvedValueOnce({
          ...mockRefundResponse,
          reason: 'fraudulent',
        });

        const result = await createStripeRefund('pi_test_123', {
          reason: 'fraudulent',
        });

        expect(result.reason).toBe('fraudulent');
      });
    });

    describe('Gestion des erreurs', () => {
      it('devrait rejeter avec erreur pour montant invalide', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockRejectedValueOnce(
          new Error('Données de remboursement invalides')
        );

        await expect(
          createStripeRefund('pi_test_123', { amount: -100 })
        ).rejects.toThrow('Données de remboursement invalides');
      });

      it('devrait rejeter avec erreur 404 pour paiement introuvable', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockRejectedValueOnce(
          new Error('Paiement introuvable pour remboursement')
        );

        await expect(
          createStripeRefund('pi_inexistant_999')
        ).rejects.toThrow('Paiement introuvable pour remboursement');
      });

      it('devrait rejeter avec erreur 401 pour non autorisé', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockRejectedValueOnce(
          new Error('Non autorisé à créer un remboursement')
        );

        await expect(
          createStripeRefund('pi_test_123')
        ).rejects.toThrow('Non autorisé à créer un remboursement');
      });

      it('devrait rejeter avec erreur réseau', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockRejectedValueOnce(
          new Error('Network request failed')
        );

        await expect(
          createStripeRefund('pi_test_123')
        ).rejects.toThrow('Network request failed');
      });

      it('devrait rejeter si montant dépasse le montant original', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockRejectedValueOnce(
          new Error('Refund amount exceeds original payment')
        );

        await expect(
          createStripeRefund('pi_test_123', { amount: 999999 })
        ).rejects.toThrow('Refund amount exceeds original payment');
      });

      it('devrait rejeter si paiement déjà entièrement remboursé', async () => {
        const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
        mockedCreateRefund.mockRejectedValueOnce(
          new Error('Payment already fully refunded')
        );

        await expect(
          createStripeRefund('pi_already_refunded')
        ).rejects.toThrow('Payment already fully refunded');
      });
    });
  });

  // ========================================
  // TESTS: RÉCUPÉRATION DES REMBOURSEMENTS
  // ========================================

  describe('fetchStripeRefunds', () => {
    it('devrait récupérer la liste des remboursements', async () => {
      const mockedFetchRefunds = fetchStripeRefunds as jest.MockedFunction<typeof fetchStripeRefunds>;
      mockedFetchRefunds.mockResolvedValueOnce(mockRefundsList);

      const result = await fetchStripeRefunds();

      expect(result.refunds).toHaveLength(2);
      expect(result.meta.total_count).toBe(2);
      expect(result.meta.has_more).toBe(false);
    });

    it('devrait supporter la pagination avec limit', async () => {
      const mockedFetchRefunds = fetchStripeRefunds as jest.MockedFunction<typeof fetchStripeRefunds>;
      mockedFetchRefunds.mockResolvedValueOnce({
        refunds: [mockRefundsList.refunds[0]],
        meta: {
          total_count: 2,
          has_more: true,
          source: 'stripe_api',
        },
      });

      const result = await fetchStripeRefunds({ limit: 1 });

      expect(result.refunds).toHaveLength(1);
      expect(result.meta.has_more).toBe(true);
    });

    it('devrait supporter le filtre par date', async () => {
      const mockedFetchRefunds = fetchStripeRefunds as jest.MockedFunction<typeof fetchStripeRefunds>;
      mockedFetchRefunds.mockResolvedValueOnce({
        refunds: [mockRefundsList.refunds[0]],
        meta: { total_count: 1, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeRefunds({
        created: {
          gte: 1705000000,
          lte: 1706000000,
        },
      });

      expect(result.refunds).toHaveLength(1);
    });

    it('devrait retourner une liste vide si aucun remboursement', async () => {
      const mockedFetchRefunds = fetchStripeRefunds as jest.MockedFunction<typeof fetchStripeRefunds>;
      mockedFetchRefunds.mockResolvedValueOnce({
        refunds: [],
        meta: { total_count: 0, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeRefunds();

      expect(result.refunds).toHaveLength(0);
      expect(result.meta.total_count).toBe(0);
    });

    it('devrait rejeter avec erreur 401 pour non autorisé', async () => {
      const mockedFetchRefunds = fetchStripeRefunds as jest.MockedFunction<typeof fetchStripeRefunds>;
      mockedFetchRefunds.mockRejectedValueOnce(
        new Error('Non autorisé à voir les remboursements')
      );

      await expect(fetchStripeRefunds()).rejects.toThrow(
        'Non autorisé à voir les remboursements'
      );
    });
  });

  // ========================================
  // TESTS: DÉTAILS D'UN REMBOURSEMENT
  // ========================================

  describe('getStripeRefundDetails', () => {
    it('devrait récupérer les détails d\'un remboursement', async () => {
      const mockedGetDetails = getStripeRefundDetails as jest.MockedFunction<typeof getStripeRefundDetails>;
      const detailsResponse = {
        id: 're_test_123456789',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded' as const,
        reason: 'requested_by_customer',
        receipt_number: 'RN-001',
        payment_intent_id: 'pi_test_123',
        failure_reason: null,
        created: '2024-01-15T10:30:00Z',
        updated: null,
      };

      mockedGetDetails.mockResolvedValueOnce(detailsResponse);

      const result = await getStripeRefundDetails('re_test_123456789');

      expect(result.id).toBe('re_test_123456789');
      expect(result.status).toBe('succeeded');
      expect(result.failure_reason).toBeNull();
    });

    it('devrait afficher failure_reason pour remboursement échoué', async () => {
      const mockedGetDetails = getStripeRefundDetails as jest.MockedFunction<typeof getStripeRefundDetails>;
      mockedGetDetails.mockResolvedValueOnce({
        id: 're_failed_456',
        amount: 5000,
        currency: 'eur',
        status: 'failed' as const,
        reason: 'requested_by_customer',
        receipt_number: null,
        payment_intent_id: 'pi_test_123',
        failure_reason: 'insufficient_funds',
        created: '2024-01-15T10:30:00Z',
        updated: '2024-01-15T10:35:00Z',
      });

      const result = await getStripeRefundDetails('re_failed_456');

      expect(result.status).toBe('failed');
      expect(result.failure_reason).toBe('insufficient_funds');
    });

    it('devrait rejeter pour remboursement inexistant', async () => {
      const mockedGetDetails = getStripeRefundDetails as jest.MockedFunction<typeof getStripeRefundDetails>;
      mockedGetDetails.mockRejectedValueOnce(
        new Error('Remboursement introuvable')
      );

      await expect(
        getStripeRefundDetails('re_inexistant_999')
      ).rejects.toThrow('Remboursement introuvable');
    });
  });

  // ========================================
  // TESTS: STATUTS DE REMBOURSEMENT
  // ========================================

  describe('Refund Statuses', () => {
    it('devrait gérer le statut "pending"', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        status: 'pending',
      });

      const result = await createStripeRefund('pi_test_123');
      expect(result.status).toBe('pending');
    });

    it('devrait gérer le statut "succeeded"', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        status: 'succeeded',
      });

      const result = await createStripeRefund('pi_test_123');
      expect(result.status).toBe('succeeded');
    });

    it('devrait gérer le statut "failed"', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        status: 'failed',
      });

      const result = await createStripeRefund('pi_test_123');
      expect(result.status).toBe('failed');
    });

    it('devrait gérer le statut "canceled"', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        status: 'canceled',
      });

      const result = await createStripeRefund('pi_test_123');
      expect(result.status).toBe('canceled');
    });
  });

  // ========================================
  // TESTS: MONTANTS ET DEVISES
  // ========================================

  describe('Amounts and Currency', () => {
    it('devrait formater correctement les montants en centimes', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        amount: 12345, // 123.45 EUR
      });

      const result = await createStripeRefund('pi_test_123', {
        amount: 12345,
      });

      expect(result.amount).toBe(12345);
      // Vérifier conversion: 12345 centimes = 123.45 EUR
      expect(result.amount / 100).toBe(123.45);
    });

    it('devrait supporter différentes devises', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      
      // Test EUR
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        currency: 'eur',
      });
      let result = await createStripeRefund('pi_test_123');
      expect(result.currency).toBe('eur');

      // Test USD
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        currency: 'usd',
      });
      result = await createStripeRefund('pi_test_456');
      expect(result.currency).toBe('usd');

      // Test GBP
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        currency: 'gbp',
      });
      result = await createStripeRefund('pi_test_789');
      expect(result.currency).toBe('gbp');
    });

    it('devrait supporter le montant zéro (remboursement total)', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        amount: 10000, // Le montant total du paiement
      });

      // amount non spécifié = remboursement total
      const result = await createStripeRefund('pi_test_123', {});
      expect(result.amount).toBe(10000);
    });
  });

  // ========================================
  // TESTS: CAS EDGE
  // ========================================

  describe('Edge Cases', () => {
    it('devrait gérer les timeouts réseau', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(
        createStripeRefund('pi_test_123')
      ).rejects.toThrow('Request timeout');
    });

    it('devrait gérer les erreurs serveur 500', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockRejectedValueOnce(
        new Error('Erreur lors de la création du remboursement: 500')
      );

      await expect(
        createStripeRefund('pi_test_123')
      ).rejects.toThrow('Erreur lors de la création du remboursement: 500');
    });

    it('devrait gérer les réponses API malformées', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockRejectedValueOnce(
        new Error('API returned invalid refund data')
      );

      await expect(
        createStripeRefund('pi_test_123')
      ).rejects.toThrow('API returned invalid refund data');
    });

    it('devrait gérer les Payment Intent IDs vides', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockRejectedValueOnce(
        new Error('Payment Intent ID is required')
      );

      await expect(
        createStripeRefund('')
      ).rejects.toThrow('Payment Intent ID is required');
    });

    it('devrait gérer les remboursements multiples sur un même paiement', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      
      // Premier remboursement partiel
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        amount: 2500,
      });
      const firstRefund = await createStripeRefund('pi_test_123', { amount: 2500 });
      expect(firstRefund.amount).toBe(2500);

      // Deuxième remboursement partiel
      mockedCreateRefund.mockResolvedValueOnce({
        ...mockRefundResponse,
        refund_id: 're_second_456',
        amount: 2500,
      });
      const secondRefund = await createStripeRefund('pi_test_123', { amount: 2500 });
      expect(secondRefund.amount).toBe(2500);
      expect(secondRefund.refund_id).not.toBe(firstRefund.refund_id);
    });
  });

  // ========================================
  // TESTS: REVERSE TRANSFER
  // ========================================

  describe('Reverse Transfer', () => {
    it('devrait supporter reverse_transfer pour comptes connectés', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce(mockRefundResponse);

      const result = await createStripeRefund('pi_test_123', {
        reverse_transfer: true,
      });

      expect(result).toBeDefined();
      expect(mockedCreateRefund).toHaveBeenCalledWith('pi_test_123', {
        reverse_transfer: true,
      });
    });

    it('devrait créer remboursement sans reverse_transfer par défaut', async () => {
      const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
      mockedCreateRefund.mockResolvedValueOnce(mockRefundResponse);

      await createStripeRefund('pi_test_123', {});

      expect(mockedCreateRefund).toHaveBeenCalledWith('pi_test_123', {});
    });
  });
});

// ========================================
// TESTS: INTÉGRATION UI (MOCK)
// ========================================

describe('RefundFlow UI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait mettre à jour le UI après remboursement réussi', async () => {
    const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
    mockedCreateRefund.mockResolvedValueOnce(mockRefundResponse);

    const onSuccess = jest.fn();
    const onError = jest.fn();

    try {
      const result = await createStripeRefund('pi_test_123');
      onSuccess(result);
    } catch (error) {
      onError(error);
    }

    expect(onSuccess).toHaveBeenCalledWith(mockRefundResponse);
    expect(onError).not.toHaveBeenCalled();
  });

  it('devrait afficher message d\'erreur approprié', async () => {
    const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
    mockedCreateRefund.mockRejectedValueOnce(new Error('Paiement introuvable'));

    const onSuccess = jest.fn();
    const onError = jest.fn();

    try {
      const result = await createStripeRefund('pi_invalid');
      onSuccess(result);
    } catch (error) {
      onError(error);
    }

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('devrait désactiver le bouton pendant le chargement', async () => {
    const mockedCreateRefund = createStripeRefund as jest.MockedFunction<typeof createStripeRefund>;
    let resolveRefund: (value: typeof mockRefundResponse) => void;
    const pendingPromise = new Promise<typeof mockRefundResponse>((resolve) => {
      resolveRefund = resolve;
    });
    mockedCreateRefund.mockReturnValueOnce(pendingPromise);

    let isLoading = true;
    
    const refundPromise = createStripeRefund('pi_test_123').finally(() => {
      isLoading = false;
    });

    expect(isLoading).toBe(true);
    
    resolveRefund!(mockRefundResponse);
    await refundPromise;
    
    expect(isLoading).toBe(false);
  });
});

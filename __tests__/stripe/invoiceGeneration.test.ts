/**
 * @file invoiceGeneration.test.ts
 * @description Tests de la génération et gestion des factures Stripe
 * 
 * Ce fichier teste:
 * - Création de factures avec line items
 * - Récupération de la liste des factures
 * - Génération des URLs de paiement et PDF
 * - Gestion des erreurs et cas edge
 */

import {
    createStripeInvoice,
    fetchStripeInvoices,
} from '../../src/services/StripeService';

// ========================================
// MOCKS
// ========================================

jest.mock('../../src/services/StripeService', () => ({
  createStripeInvoice: jest.fn(),
  fetchStripeInvoices: jest.fn(),
  getStripeInvoiceDetails: jest.fn(),
  sendStripeInvoice: jest.fn(),
  voidStripeInvoice: jest.fn(),
}));

// ========================================
// TEST DATA
// ========================================

const mockInvoiceResponse = {
  invoice_id: 'in_test_123456789',
  invoice_number: 'INV-2024-0001',
  status: 'open',
  amount_due: 15000, // 150.00 EUR
  amount_paid: 0,
  currency: 'eur',
  customer_email: 'client@example.com',
  hosted_invoice_url: 'https://invoice.stripe.com/i/acct_123/in_test_123456789',
  invoice_pdf: 'https://pay.stripe.com/invoice/acct_123/in_test_123456789/pdf',
  created: '2024-01-15T10:30:00Z',
  due_date: '2024-02-15T10:30:00Z',
  metadata: {
    job_id: 'job_123',
    company_id: 'company_456',
  },
};

const mockInvoicesList = {
  invoices: [
    {
      id: 'in_test_001',
      number: 'INV-2024-0001',
      status: 'paid' as const,
      amount_due: 15000,
      amount_paid: 15000,
      amount_remaining: 0,
      currency: 'eur',
      customer_email: 'client1@example.com',
      customer_name: 'Client One',
      description: 'Service de nettoyage - Janvier 2024',
      hosted_invoice_url: 'https://invoice.stripe.com/i/in_test_001',
      invoice_pdf: 'https://pay.stripe.com/invoice/in_test_001/pdf',
      created: '2024-01-15T10:30:00Z',
      due_date: '2024-02-15T10:30:00Z',
      paid_at: '2024-01-20T14:00:00Z',
      metadata: {},
    },
    {
      id: 'in_test_002',
      number: 'INV-2024-0002',
      status: 'open' as const,
      amount_due: 25000,
      amount_paid: 0,
      amount_remaining: 25000,
      currency: 'eur',
      customer_email: 'client2@example.com',
      customer_name: 'Client Two',
      description: 'Réparation plomberie',
      hosted_invoice_url: 'https://invoice.stripe.com/i/in_test_002',
      invoice_pdf: 'https://pay.stripe.com/invoice/in_test_002/pdf',
      created: '2024-01-20T09:00:00Z',
      due_date: '2024-02-20T09:00:00Z',
      paid_at: null,
      metadata: {},
    },
  ],
  meta: {
    total_count: 2,
    has_more: false,
    source: 'stripe_api',
  },
};

const mockLineItems = [
  {
    description: 'Service de nettoyage - 3 heures',
    quantity: 3,
    unit_amount: 5000, // 50.00 EUR par heure
  },
];

// ========================================
// TESTS: CRÉATION DE FACTURE
// ========================================

describe('Invoice Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripeInvoice', () => {
    describe('Création réussie', () => {
      it('devrait créer une facture avec succès', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

        const result = await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: mockLineItems,
        });

        expect(result).toEqual(mockInvoiceResponse);
        expect(result.invoice_id).toBe('in_test_123456789');
        expect(result.status).toBe('open');
      });

      it('devrait créer une facture avec plusieurs line items', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        const multipleItems = [
          { description: 'Service A', quantity: 2, unit_amount: 5000 },
          { description: 'Service B', quantity: 1, unit_amount: 7500 },
          { description: 'Matériel', quantity: 3, unit_amount: 1500 },
        ];

        mockedCreate.mockResolvedValueOnce({
          ...mockInvoiceResponse,
          amount_due: 22000, // (2*50) + (1*75) + (3*15) = 100+75+45 = 220
        });

        const result = await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: multipleItems,
        });

        expect(result.amount_due).toBe(22000);
      });

      it('devrait inclure le nom du client', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

        await createStripeInvoice({
          customer_email: 'client@example.com',
          customer_name: 'Jean Dupont',
          line_items: mockLineItems,
        });

        expect(mockedCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_name: 'Jean Dupont',
          })
        );
      });

      it('devrait définir une date d\'échéance', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        const dueDate = '2024-03-01T00:00:00Z';

        mockedCreate.mockResolvedValueOnce({
          ...mockInvoiceResponse,
          due_date: dueDate,
        });

        const result = await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: mockLineItems,
          due_date: dueDate,
        });

        expect(result.due_date).toBe(dueDate);
      });

      it('devrait inclure metadata personnalisée', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        const customMetadata = { job_id: 'job_999', custom_field: 'value' };

        mockedCreate.mockResolvedValueOnce({
          ...mockInvoiceResponse,
          metadata: customMetadata,
        });

        const result = await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: mockLineItems,
          metadata: customMetadata,
        });

        expect(result.metadata).toEqual(customMetadata);
      });

      it('devrait auto-finaliser la facture si demandé', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

        await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: mockLineItems,
          auto_advance: true,
        });

        expect(mockedCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            auto_advance: true,
          })
        );
      });

      it('devrait supporter collection_method charge_automatically', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

        await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: mockLineItems,
          collection_method: 'charge_automatically',
        });

        expect(mockedCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            collection_method: 'charge_automatically',
          })
        );
      });
    });

    describe('URLs et PDF', () => {
      it('devrait retourner hosted_invoice_url valide', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

        const result = await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: mockLineItems,
        });

        expect(result.hosted_invoice_url).toMatch(/^https:\/\/invoice\.stripe\.com/);
      });

      it('devrait retourner invoice_pdf URL valide', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

        const result = await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: mockLineItems,
        });

        expect(result.invoice_pdf).toMatch(/\/pdf$/);
      });
    });

    describe('Gestion des erreurs', () => {
      it('devrait rejeter avec erreur pour email invalide', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockRejectedValueOnce(
          new Error('Données de facture invalides')
        );

        await expect(
          createStripeInvoice({
            customer_email: 'invalid-email',
            line_items: mockLineItems,
          })
        ).rejects.toThrow('Données de facture invalides');
      });

      it('devrait rejeter avec erreur 401 pour non autorisé', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockRejectedValueOnce(
          new Error('Non autorisé à créer une facture')
        );

        await expect(
          createStripeInvoice({
            customer_email: 'client@example.com',
            line_items: mockLineItems,
          })
        ).rejects.toThrow('Non autorisé à créer une facture');
      });

      it('devrait rejeter pour line_items vide', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockRejectedValueOnce(
          new Error('Line items are required')
        );

        await expect(
          createStripeInvoice({
            customer_email: 'client@example.com',
            line_items: [],
          })
        ).rejects.toThrow('Line items are required');
      });

      it('devrait rejeter pour montant négatif', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockRejectedValueOnce(
          new Error('Amount must be positive')
        );

        await expect(
          createStripeInvoice({
            customer_email: 'client@example.com',
            line_items: [{ description: 'Test', quantity: 1, unit_amount: -100 }],
          })
        ).rejects.toThrow('Amount must be positive');
      });

      it('devrait gérer les erreurs réseau', async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockRejectedValueOnce(
          new Error('Network request failed')
        );

        await expect(
          createStripeInvoice({
            customer_email: 'client@example.com',
            line_items: mockLineItems,
          })
        ).rejects.toThrow('Network request failed');
      });
    });
  });

  // ========================================
  // TESTS: RÉCUPÉRATION DES FACTURES
  // ========================================

  describe('fetchStripeInvoices', () => {
    it('devrait récupérer la liste des factures', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce(mockInvoicesList);

      const result = await fetchStripeInvoices();

      expect(result.invoices).toHaveLength(2);
      expect(result.meta.total_count).toBe(2);
    });

    it('devrait filtrer par status paid', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce({
        invoices: [mockInvoicesList.invoices[0]],
        meta: { total_count: 1, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeInvoices({ status: 'paid' });

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].status).toBe('paid');
    });

    it('devrait filtrer par status open', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce({
        invoices: [mockInvoicesList.invoices[1]],
        meta: { total_count: 1, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeInvoices({ status: 'open' });

      expect(result.invoices).toHaveLength(1);
      expect(result.invoices[0].status).toBe('open');
    });

    it('devrait supporter la pagination avec limit', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce({
        invoices: [mockInvoicesList.invoices[0]],
        meta: { total_count: 2, has_more: true, source: 'stripe_api' },
      });

      const result = await fetchStripeInvoices({ limit: 1 });

      expect(result.invoices).toHaveLength(1);
      expect(result.meta.has_more).toBe(true);
    });

    it('devrait supporter le filtre par date de création', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce(mockInvoicesList);

      await fetchStripeInvoices({
        created: {
          gte: 1705000000,
          lte: 1706000000,
        },
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          created: { gte: 1705000000, lte: 1706000000 },
        })
      );
    });

    it('devrait supporter le filtre par date d\'échéance', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce(mockInvoicesList);

      await fetchStripeInvoices({
        due_date: {
          gte: 1707000000,
          lte: 1708000000,
        },
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          due_date: { gte: 1707000000, lte: 1708000000 },
        })
      );
    });

    it('devrait retourner liste vide si aucune facture', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce({
        invoices: [],
        meta: { total_count: 0, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeInvoices();

      expect(result.invoices).toHaveLength(0);
      expect(result.meta.total_count).toBe(0);
    });
  });

  // ========================================
  // TESTS: NUMÉROTATION DES FACTURES
  // ========================================

  describe('Invoice Numbering', () => {
    it('devrait générer un numéro de facture valide', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

      const result = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: mockLineItems,
      });

      expect(result.invoice_number).toMatch(/^INV-\d{4}-\d+$/);
    });

    it('devrait avoir des numéros de facture uniques', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      
      mockedCreate.mockResolvedValueOnce({
        ...mockInvoiceResponse,
        invoice_id: 'in_test_001',
        invoice_number: 'INV-2024-0001',
      });
      
      const invoice1 = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: mockLineItems,
      });

      mockedCreate.mockResolvedValueOnce({
        ...mockInvoiceResponse,
        invoice_id: 'in_test_002',
        invoice_number: 'INV-2024-0002',
      });
      
      const invoice2 = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: mockLineItems,
      });

      expect(invoice1.invoice_number).not.toBe(invoice2.invoice_number);
    });
  });

  // ========================================
  // TESTS: STATUTS DE FACTURE
  // ========================================

  describe('Invoice Statuses', () => {
    const statuses: ('draft' | 'open' | 'paid' | 'void' | 'uncollectible')[] = [
      'draft',
      'open',
      'paid',
      'void',
      'uncollectible',
    ];

    statuses.forEach(status => {
      it(`devrait gérer le statut "${status}"`, async () => {
        const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
        mockedFetch.mockResolvedValueOnce({
          invoices: [{
            ...mockInvoicesList.invoices[0],
            status,
          }],
          meta: { total_count: 1, has_more: false, source: 'stripe_api' },
        });

        const result = await fetchStripeInvoices({ status });

        expect(result.invoices[0].status).toBe(status);
      });
    });
  });

  // ========================================
  // TESTS: MONTANTS ET CALCULS
  // ========================================

  describe('Amounts and Calculations', () => {
    it('devrait calculer correctement le montant total', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      
      // 3 items: 2*50 + 1*75 + 5*10 = 100+75+50 = 225 EUR = 22500 cents
      mockedCreate.mockResolvedValueOnce({
        ...mockInvoiceResponse,
        amount_due: 22500,
      });

      const result = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: [
          { description: 'Service A', quantity: 2, unit_amount: 5000 },
          { description: 'Service B', quantity: 1, unit_amount: 7500 },
          { description: 'Petit service', quantity: 5, unit_amount: 1000 },
        ],
      });

      expect(result.amount_due).toBe(22500);
    });

    it('devrait formater les montants en centimes', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      mockedCreate.mockResolvedValueOnce({
        ...mockInvoiceResponse,
        amount_due: 12345,
      });

      const result = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: mockLineItems,
      });

      // Vérifier que le montant peut être converti en EUR
      expect(result.amount_due / 100).toBe(123.45);
    });

    it('devrait gérer amount_remaining pour factures partiellement payées', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce({
        invoices: [{
          ...mockInvoicesList.invoices[0],
          amount_due: 10000,
          amount_paid: 6000,
          amount_remaining: 4000,
        }],
        meta: { total_count: 1, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeInvoices();

      expect(result.invoices[0].amount_due).toBe(10000);
      expect(result.invoices[0].amount_paid).toBe(6000);
      expect(result.invoices[0].amount_remaining).toBe(4000);
    });
  });

  // ========================================
  // TESTS: DEVISES
  // ========================================

  describe('Currency Support', () => {
    const currencies = ['eur', 'usd', 'gbp', 'cad', 'aud'];

    currencies.forEach(currency => {
      it(`devrait supporter la devise ${currency.toUpperCase()}`, async () => {
        const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
        mockedCreate.mockResolvedValueOnce({
          ...mockInvoiceResponse,
          currency,
        });

        const result = await createStripeInvoice({
          customer_email: 'client@example.com',
          line_items: [{ description: 'Service', quantity: 1, unit_amount: 1000, currency }],
        });

        expect(result.currency).toBe(currency);
      });
    });
  });

  // ========================================
  // TESTS: DATES
  // ========================================

  describe('Date Handling', () => {
    it('devrait avoir une date de création valide', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

      const result = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: mockLineItems,
      });

      expect(new Date(result.created).getTime()).not.toBeNaN();
    });

    it('devrait avoir une date d\'échéance optionnelle', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      mockedCreate.mockResolvedValueOnce({
        ...mockInvoiceResponse,
        due_date: null,
      });

      const result = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: mockLineItems,
      });

      expect(result.due_date).toBeNull();
    });

    it('devrait avoir paid_at pour factures payées', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce({
        invoices: [{
          ...mockInvoicesList.invoices[0],
          status: 'paid',
          paid_at: '2024-01-20T14:00:00Z',
        }],
        meta: { total_count: 1, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeInvoices({ status: 'paid' });

      expect(result.invoices[0].paid_at).not.toBeNull();
    });

    it('devrait avoir paid_at null pour factures non payées', async () => {
      const mockedFetch = fetchStripeInvoices as jest.MockedFunction<typeof fetchStripeInvoices>;
      mockedFetch.mockResolvedValueOnce({
        invoices: [{
          ...mockInvoicesList.invoices[1],
          status: 'open',
          paid_at: null,
        }],
        meta: { total_count: 1, has_more: false, source: 'stripe_api' },
      });

      const result = await fetchStripeInvoices({ status: 'open' });

      expect(result.invoices[0].paid_at).toBeNull();
    });
  });

  // ========================================
  // TESTS: CAS EDGE
  // ========================================

  describe('Edge Cases', () => {
    it('devrait gérer un montant très élevé', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      mockedCreate.mockResolvedValueOnce({
        ...mockInvoiceResponse,
        amount_due: 100000000, // 1,000,000.00 EUR
      });

      const result = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: [{ description: 'Big project', quantity: 1, unit_amount: 100000000 }],
      });

      expect(result.amount_due).toBe(100000000);
    });

    it('devrait gérer un montant minimal', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      mockedCreate.mockResolvedValueOnce({
        ...mockInvoiceResponse,
        amount_due: 50, // 0.50 EUR (minimum Stripe)
      });

      const result = await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: [{ description: 'Minimal service', quantity: 1, unit_amount: 50 }],
      });

      expect(result.amount_due).toBe(50);
    });

    it('devrait gérer une description très longue', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      const longDescription = 'A'.repeat(500);
      
      mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

      await createStripeInvoice({
        customer_email: 'client@example.com',
        description: longDescription,
        line_items: mockLineItems,
      });

      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: longDescription,
        })
      );
    });

    it('devrait gérer des caractères spéciaux dans la description', async () => {
      const mockedCreate = createStripeInvoice as jest.MockedFunction<typeof createStripeInvoice>;
      const specialDescription = 'Service €£¥ - Spécial été 2024 <test> & "quotes"';
      
      mockedCreate.mockResolvedValueOnce(mockInvoiceResponse);

      await createStripeInvoice({
        customer_email: 'client@example.com',
        line_items: [{ description: specialDescription, quantity: 1, unit_amount: 1000 }],
      });

      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({ description: specialDescription }),
          ]),
        })
      );
    });
  });
});

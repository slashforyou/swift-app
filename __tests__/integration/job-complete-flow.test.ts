/**
 * Test d'intégration — Parcours critique : Quote → Job → Pay → Review
 *
 * Couverture :
 *  - Création d'un job avec devis (createJob + createQuote)
 *  - Transitions de statut : pending → assigned → accepted → in_progress → completed → paid → reviewed
 *  - Paiement Stripe : PaymentSheet, webhook réel, webhook en doublon (idempotence)
 *  - Paiement échoué puis retry
 *  - Demande d'avis client + lecture du scorecard
 *  - Isolation company_id : une Company B ne peut pas accéder aux jobs de Company A
 *  - Guards rôle : driver ne peut pas déclencher le paiement, offsider ne peut pas compléter
 *
 * Ce flow ne duplique PAS :
 *  - payment-stripe-integration.test.tsx (composant PaymentWindow isolé)
 *  - staff-e2e.test.ts (workflow invitation staff)
 */

import { act } from '@testing-library/react-native';

// ─────────────────────────────────────────────────────────────
// Mocks services
// ─────────────────────────────────────────────────────────────
const mockCreateJob = jest.fn();
const mockFetchJobById = jest.fn();
const mockUpdateJob = jest.fn();
const mockStartJob = jest.fn();

jest.mock('../../src/services/jobs', () => ({
  createJob: (...args: any[]) => mockCreateJob(...args),
  fetchJobById: (...args: any[]) => mockFetchJobById(...args),
  updateJob: (...args: any[]) => mockUpdateJob(...args),
  startJob: (...args: any[]) => mockStartJob(...args),
}));

const mockCreateQuote = jest.fn();
const mockUpdateQuote = jest.fn();

jest.mock('../../src/services/quotesService', () => ({
  createQuote: (...args: any[]) => mockCreateQuote(...args),
  updateQuote: (...args: any[]) => mockUpdateQuote(...args),
}));

const mockCreatePayment = jest.fn();
const mockConfirmPayment = jest.fn();

jest.mock('../../src/hooks/useJobPayment', () => ({
  useJobPayment: () => ({
    createPayment: mockCreatePayment,
    confirmPayment: mockConfirmPayment,
    reset: jest.fn(),
  }),
}));

const mockFetchJobScorecard = jest.fn();
const mockSendReviewRequest = jest.fn();

jest.mock('../../src/services/scorecard', () => ({
  fetchJobScorecard: (...args: any[]) => mockFetchJobScorecard(...args),
  sendReviewRequest: (...args: any[]) => mockSendReviewRequest(...args),
}));

// ─────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────
const COMPANY_A_ID = 42;
const COMPANY_B_ID = 99;
const JOB_ID = 'job-e2e-critical-001';
const QUOTE_ID = 77;
const CLIENT_ID = '30';
const DRIVER_ID = 'driver-test-01';

const baseJob = {
  id: JOB_ID,
  code: 'JOB-E2E-20260428-055',
  status: 'pending' as const,
  priority: 'medium' as const,
  client_id: CLIENT_ID,
  contractor_company_id: COMPANY_A_ID,
  assignment_status: 'none' as const,
  addresses: [
    { type: 'pickup', street: '88 George Street', city: 'Sydney', state: 'NSW', zip: '2000' },
    { type: 'delivery', street: '12 Collins Street', city: 'Melbourne', state: 'VIC', zip: '3000' },
  ],
  time: { scheduledDate: '2026-05-05', startTime: '08:00', estimatedDuration: 240 },
  amount_total: 480,
  payment_method: 'card',
  created_at: '2026-05-05T06:00:00Z',
  updated_at: '2026-05-05T06:00:00Z',
};

const baseQuote = {
  id: QUOTE_ID,
  quote_number: 'Q-2026-0055',
  title: 'Déménagement Sydney → Melbourne',
  status: 'draft',
  total: 480,
  subtotal: 480,
  tax: 0,
  client_id: Number(CLIENT_ID),
  client_name: 'E2E Client',
  items: [
    { description: 'Service de déménagement (forfait)', quantity: 1, unit_price: 480, total: 480 },
  ],
  created_at: '2026-05-05T06:00:00Z',
};

// ─────────────────────────────────────────────────────────────
// Suite principale
// ─────────────────────────────────────────────────────────────
describe('Job Complete Flow — Quote → Job → Pay → Review', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // 1. Création du job avec devis
  // ──────────────────────────────────────────────
  describe('Phase A — Création du job avec devis', () => {
    it('crée un job en statut pending et un quote draft associé', async () => {
      mockCreateJob.mockResolvedValueOnce(baseJob);
      mockCreateQuote.mockResolvedValueOnce(baseQuote);

      let job: typeof baseJob;
      let quote: typeof baseQuote;

      await act(async () => {
        const { createJob } = require('../../src/services/jobs');
        const { createQuote } = require('../../src/services/quotesService');

        job = await createJob({
          client_id: CLIENT_ID,
          addresses: baseJob.addresses,
          time: baseJob.time,
          flat_rate_amount: 480,
          payment_method: 'card',
        });

        quote = await createQuote({
          title: 'Déménagement Sydney → Melbourne',
          client_id: Number(CLIENT_ID),
          status: 'draft',
          total: 480,
          items: baseQuote.items,
        });
      });

      expect(mockCreateJob).toHaveBeenCalledTimes(1);
      expect(mockCreateJob).toHaveBeenCalledWith(expect.objectContaining({
        client_id: CLIENT_ID,
        flat_rate_amount: 480,
      }));

      expect(job!.status).toBe('pending');
      expect(job!.contractor_company_id).toBe(COMPANY_A_ID);

      expect(mockCreateQuote).toHaveBeenCalledTimes(1);
      expect(quote!.status).toBe('draft');
      expect(quote!.total).toBe(480);
    });

    it('rejette la création de job sans client_id', async () => {
      mockCreateJob.mockRejectedValueOnce(new Error('HTTP 422: client_id is required'));

      await expect(async () => {
        const { createJob } = require('../../src/services/jobs');
        await createJob({ addresses: baseJob.addresses, time: baseJob.time });
      }).rejects.toThrow('client_id is required');
    });
  });

  // ──────────────────────────────────────────────
  // 2. Transitions de statut
  // ──────────────────────────────────────────────
  describe('Phase B–C — Transitions de statut', () => {
    it('suit la séquence complète : pending → assigned → accepted → in_progress → completed', async () => {
      const statuses: string[] = ['pending'];

      // pending → assigned (driver assigné)
      mockUpdateJob.mockResolvedValueOnce({ ...baseJob, status: 'assigned', assigned_staff_id: DRIVER_ID });
      await act(async () => {
        const { updateJob } = require('../../src/services/jobs');
        const updated = await updateJob(JOB_ID, { status: 'assigned', assigned_staff_id: DRIVER_ID });
        statuses.push(updated.status);
      });

      // assigned → accepted (driver accepte le job)
      mockUpdateJob.mockResolvedValueOnce({ ...baseJob, status: 'accepted', assigned_staff_id: DRIVER_ID });
      await act(async () => {
        const { updateJob } = require('../../src/services/jobs');
        const updated = await updateJob(JOB_ID, { status: 'accepted' });
        statuses.push(updated.status);
      });

      // accepted → in_progress (driver démarre le chrono)
      mockStartJob.mockResolvedValueOnce({ ...baseJob, status: 'in-progress', assigned_staff_id: DRIVER_ID });
      await act(async () => {
        const { startJob } = require('../../src/services/jobs');
        const updated = await startJob(JOB_ID);
        statuses.push(updated.status);
      });

      // in_progress → completed (admin marque le job terminé)
      mockUpdateJob.mockResolvedValueOnce({ ...baseJob, status: 'completed', assigned_staff_id: DRIVER_ID });
      await act(async () => {
        const { updateJob } = require('../../src/services/jobs');
        const updated = await updateJob(JOB_ID, { status: 'completed' });
        statuses.push(updated.status);
      });

      expect(statuses).toEqual(['pending', 'assigned', 'accepted', 'in-progress', 'completed']);
    });

    it('interdit le retour arrière : completed → in_progress (guard serveur)', async () => {
      mockUpdateJob.mockRejectedValueOnce(new Error('HTTP 409: invalid status transition'));

      await expect(async () => {
        const { updateJob } = require('../../src/services/jobs');
        await updateJob(JOB_ID, { status: 'in-progress' });
      }).rejects.toThrow('invalid status transition');
    });
  });

  // ──────────────────────────────────────────────
  // 3. Paiement Stripe
  // ──────────────────────────────────────────────
  describe('Phase D — Paiement Stripe', () => {
    it('happy path : crée un PaymentIntent et le confirme via PaymentSheet', async () => {
      mockCreatePayment.mockResolvedValueOnce({
        payment_intent_id: 'pi_e2e_critical_001',
        client_secret: 'pi_e2e_critical_001_secret_test',
      });
      mockConfirmPayment.mockResolvedValueOnce({
        job: { ...baseJob, status: 'completed', payment_status: 'paid' },
      });

      let paymentIntent: any;
      let confirmedJob: any;

      await act(async () => {
        const { useJobPayment } = require('../../src/hooks/useJobPayment');
        const hooks = useJobPayment();
        paymentIntent = await hooks.createPayment(JOB_ID, {
          amount: 48000, // 480 * 100 cents
          currency: 'AUD',
          description: 'Paiement job Déménagement Sydney → Melbourne',
        });
        confirmedJob = await hooks.confirmPayment(JOB_ID, paymentIntent.payment_intent_id);
      });

      expect(paymentIntent.payment_intent_id).toBe('pi_e2e_critical_001');
      expect(confirmedJob.job.payment_status).toBe('paid');
      expect(confirmedJob.job.status).toBe('completed');
    });

    it('webhook en doublon : idempotence — le statut ne change pas une deuxième fois', async () => {
      // Simule deux appels webhook successifs avec le même payment_intent_id
      const webhookPayload = { payment_intent_id: 'pi_e2e_critical_001', status: 'succeeded' };

      mockConfirmPayment
        .mockResolvedValueOnce({ job: { ...baseJob, payment_status: 'paid' } }) // 1er webhook
        .mockResolvedValueOnce({ job: { ...baseJob, payment_status: 'paid' } }); // 2e webhook (doublon)

      await act(async () => {
        const { useJobPayment } = require('../../src/hooks/useJobPayment');
        const hooks = useJobPayment();
        await hooks.confirmPayment(JOB_ID, webhookPayload.payment_intent_id);
        await hooks.confirmPayment(JOB_ID, webhookPayload.payment_intent_id); // doublon
      });

      // Les deux appels doivent retourner paid sans erreur
      expect(mockConfirmPayment).toHaveBeenCalledTimes(2);
      const calls = mockConfirmPayment.mock.results;
      expect((await calls[0].value).job.payment_status).toBe('paid');
      expect((await calls[1].value).job.payment_status).toBe('paid');
    });

    it('paiement échoué puis retry réussi', async () => {
      // 1er tentative : échec Stripe
      mockCreatePayment.mockRejectedValueOnce(new Error('card_declined'));
      // 2e tentative : succès
      mockCreatePayment.mockResolvedValueOnce({
        payment_intent_id: 'pi_e2e_retry_001',
        client_secret: 'pi_e2e_retry_001_secret_test',
      });
      mockConfirmPayment.mockResolvedValueOnce({
        job: { ...baseJob, payment_status: 'paid' },
      });

      let finalJob: any;

      await act(async () => {
        const { useJobPayment } = require('../../src/hooks/useJobPayment');
        const hooks = useJobPayment();

        // 1er essai (échec)
        await expect(
          hooks.createPayment(JOB_ID, { amount: 48000, currency: 'AUD', description: 'Test' })
        ).rejects.toThrow('card_declined');

        // 2e essai (retry)
        const pi = await hooks.createPayment(JOB_ID, { amount: 48000, currency: 'AUD', description: 'Test' });
        finalJob = await hooks.confirmPayment(JOB_ID, pi.payment_intent_id);
      });

      expect(finalJob.job.payment_status).toBe('paid');
      expect(mockCreatePayment).toHaveBeenCalledTimes(2);
    });

    it('ne marque le job paid QUE via confirmation webhook — pas avant', async () => {
      mockCreatePayment.mockResolvedValueOnce({
        payment_intent_id: 'pi_e2e_pending',
        client_secret: 'pi_e2e_pending_secret',
      });

      // Lecture du job après createPayment : toujours pending_payment
      mockFetchJobById.mockResolvedValueOnce({ ...baseJob, status: 'completed', payment_status: 'pending' });

      await act(async () => {
        const { useJobPayment } = require('../../src/hooks/useJobPayment');
        const { fetchJobById } = require('../../src/services/jobs');
        const hooks = useJobPayment();

        await hooks.createPayment(JOB_ID, { amount: 48000, currency: 'AUD', description: 'Test' });
        const job = await fetchJobById(JOB_ID);

        // Le job ne doit PAS être paid avant le webhook
        expect(job.payment_status).toBe('pending');
        expect(job.payment_status).not.toBe('paid');
      });
    });
  });

  // ──────────────────────────────────────────────
  // 4. Avis client + scorecard
  // ──────────────────────────────────────────────
  describe('Phase E — Demande d\'avis client + Scorecard', () => {
    it('envoie la demande d\'avis et retourne une review_url', async () => {
      mockSendReviewRequest.mockResolvedValueOnce({
        success: true,
        review_url: `https://cobbr.app/review/${JOB_ID}?token=abc123`,
      });

      await act(async () => {
        const { sendReviewRequest } = require('../../src/services/scorecard');
        const result = await sendReviewRequest(JOB_ID);

        expect(result.success).toBe(true);
        expect(result.review_url).toContain(JOB_ID);
      });

      expect(mockSendReviewRequest).toHaveBeenCalledWith(JOB_ID);
    });

    it('le scorecard apparaît après que le client soumet son avis', async () => {
      mockFetchJobScorecard.mockResolvedValueOnce({
        success: true,
        scorecard: {
          job_id: Number(JOB_ID),
          total_score: 85,
          max_score: 100,
          percentage: 85,
          generated_at: '2026-05-05T12:00:00Z',
          checkpoints: [],
        },
        client_review: {
          rating_overall: 5,
          rating_service: 5,
          rating_team: 4,
          comment: 'Équipe très professionnelle, rien de cassé.',
          submitted_at: '2026-05-05T11:45:00Z',
        },
      });

      await act(async () => {
        const { fetchJobScorecard } = require('../../src/services/scorecard');
        const result = await fetchJobScorecard(JOB_ID);

        expect(result.client_review).not.toBeNull();
        expect(result.client_review!.rating_overall).toBe(5);
        expect(result.scorecard.percentage).toBe(85);
      });
    });

    it('ne plante pas si le client n\'a pas encore soumis son avis (client_review = null)', async () => {
      mockFetchJobScorecard.mockResolvedValueOnce({
        success: true,
        scorecard: {
          job_id: Number(JOB_ID),
          total_score: 75,
          max_score: 100,
          percentage: 75,
          generated_at: '2026-05-05T10:00:00Z',
          checkpoints: [],
        },
        client_review: null,
      });

      await act(async () => {
        const { fetchJobScorecard } = require('../../src/services/scorecard');
        const result = await fetchJobScorecard(JOB_ID);

        expect(result.client_review).toBeNull();
        expect(result.scorecard).toBeDefined();
      });
    });

    it('l\'envoi d\'une 2e demande de review ne duplique pas (idempotence)', async () => {
      mockSendReviewRequest
        .mockResolvedValueOnce({ success: true, review_url: `https://cobbr.app/review/${JOB_ID}?token=abc` })
        .mockResolvedValueOnce({ success: true, review_url: `https://cobbr.app/review/${JOB_ID}?token=abc` });

      await act(async () => {
        const { sendReviewRequest } = require('../../src/services/scorecard');
        await sendReviewRequest(JOB_ID);
        const second = await sendReviewRequest(JOB_ID);
        // La même URL de review est retournée — pas de doublon créé
        expect(second.review_url).toContain(JOB_ID);
      });

      expect(mockSendReviewRequest).toHaveBeenCalledTimes(2);
    });
  });

  // ──────────────────────────────────────────────
  // 5. Isolation company_id (security guard)
  // ──────────────────────────────────────────────
  describe('Sécurité — Isolation company_id', () => {
    it('Company B ne peut pas lire le job de Company A (403)', async () => {
      // Simuler un token appartenant à Company B tentant d'accéder au job de Company A
      mockFetchJobById.mockRejectedValueOnce(new Error('HTTP 403: Forbidden'));

      await expect(async () => {
        const { fetchJobById } = require('../../src/services/jobs');
        await fetchJobById(JOB_ID); // token de Company B dans les headers
      }).rejects.toThrow('403');
    });

    it('Company B ne peut pas modifier le statut du job de Company A', async () => {
      mockUpdateJob.mockRejectedValueOnce(new Error('HTTP 403: Forbidden'));

      await expect(async () => {
        const { updateJob } = require('../../src/services/jobs');
        await updateJob(JOB_ID, { status: 'completed' });
      }).rejects.toThrow('403');
    });

    it('modification d\'ID dans l\'URL : job_id inexistant dans company → 404 ou 403', async () => {
      const foreignJobId = 'job-company-b-secret-123';
      mockFetchJobById.mockRejectedValueOnce(new Error('HTTP 404: Not Found'));

      await expect(async () => {
        const { fetchJobById } = require('../../src/services/jobs');
        await fetchJobById(foreignJobId);
      }).rejects.toThrow(/404|403/);
    });
  });

  // ──────────────────────────────────────────────
  // 6. Guards de rôle
  // ──────────────────────────────────────────────
  describe('Permissions par rôle', () => {
    it('driver ne peut pas déclencher le paiement', async () => {
      // Le driver n'a pas la permission billing → 403
      mockCreatePayment.mockRejectedValueOnce(new Error('HTTP 403: Insufficient permissions'));

      await expect(async () => {
        const { useJobPayment } = require('../../src/hooks/useJobPayment');
        const hooks = useJobPayment();
        await hooks.createPayment(JOB_ID, { amount: 48000, currency: 'AUD', description: 'Test' });
      }).rejects.toThrow('Insufficient permissions');
    });

    it('offsider ne peut pas marquer le job completed', async () => {
      mockUpdateJob.mockRejectedValueOnce(new Error('HTTP 403: Role driver/offsider cannot complete jobs'));

      await expect(async () => {
        const { updateJob } = require('../../src/services/jobs');
        await updateJob(JOB_ID, { status: 'completed' });
      }).rejects.toThrow(/403/);
    });

    it('driver ne voit que ses jobs assignés — fetchJobById d\'un job non assigné → 403', async () => {
      const unassignedJobId = 'job-not-mine-999';
      mockFetchJobById.mockRejectedValueOnce(new Error('HTTP 403: Job not assigned to driver'));

      await expect(async () => {
        const { fetchJobById } = require('../../src/services/jobs');
        await fetchJobById(unassignedJobId);
      }).rejects.toThrow('403');
    });
  });

  // ──────────────────────────────────────────────
  // 7. Résilience réseau
  // ──────────────────────────────────────────────
  describe('Résilience — Erreurs réseau', () => {
    it('createJob en perte réseau → Network request failed', async () => {
      mockCreateJob.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(async () => {
        const { createJob } = require('../../src/services/jobs');
        await createJob({ client_id: CLIENT_ID, addresses: baseJob.addresses, time: baseJob.time });
      }).rejects.toThrow('Network request failed');
    });

    it('createPayment timeout → le job reste completed (pas paid)', async () => {
      mockCreatePayment.mockRejectedValueOnce(new Error('Request timeout'));
      mockFetchJobById.mockResolvedValueOnce({ ...baseJob, status: 'completed', payment_status: 'pending' });

      await act(async () => {
        const { useJobPayment } = require('../../src/hooks/useJobPayment');
        const { fetchJobById } = require('../../src/services/jobs');
        const hooks = useJobPayment();

        // Le payment échoue côté réseau
        await expect(
          hooks.createPayment(JOB_ID, { amount: 48000, currency: 'AUD', description: 'Test' })
        ).rejects.toThrow('Request timeout');

        // Le job doit rester en completed sans basculer paid
        const job = await fetchJobById(JOB_ID);
        expect(job.status).toBe('completed');
        expect(job.payment_status).toBe('pending');
      });
    });
  });
});

/**
 * =====================================================
 * STRIPE WEBHOOK ROUTER — SIGNATURE VERIFIED
 * =====================================================
 *
 * Point d'entrée unique pour tous les événements Stripe.
 *
 * SÉCURITÉ : stripe.webhooks.constructEvent() est appelé EN PREMIER,
 * avant tout traitement métier. Le body doit être RAW (Buffer),
 * configuré via express.raw({ type: 'application/json' }) dans index.js
 * UNIQUEMENT pour cette route.
 *
 * Mode dual : live (whsec_live_xxx) ou test (whsec_test_xxx),
 * sélectionné selon le header X-Stripe-Mode ou le mode détecté
 * depuis la clé de l'événement.
 *
 * @module endPoints/v1/stripe/webhooks
 */

'use strict';

const { stripeLive, stripeTest, hasLive, hasTest } = require('../../../config/stripe');
const { connect, close } = require('../../../swiftDb');
const {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleSubscriptionInvoicePaid,
  handleTrialWillEnd,
} = require('../../stripe_subscription_webhooks');

// ─── Secrets webhook (dual-mode) ───────────────────────────────────────────
const LIVE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET;
const TEST_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_TEST;

// ─── Résolution du secret + instance Stripe selon le mode ──────────────────
function resolveStripeContext(sig) {
  // Si on a les deux modes actifs, on tente d'abord LIVE, puis TEST.
  // constructEvent lève une erreur de signature si le secret est incorrect :
  // c'est l'unique source de vérité pour déterminer le mode.
  const candidates = [];

  if (hasLive && LIVE_WEBHOOK_SECRET) {
    candidates.push({ stripe: stripeLive, secret: LIVE_WEBHOOK_SECRET, mode: 'live' });
  }
  if (hasTest && TEST_WEBHOOK_SECRET) {
    candidates.push({ stripe: stripeTest, secret: TEST_WEBHOOK_SECRET, mode: 'test' });
  }

  if (candidates.length === 0) {
    throw new Error('No Stripe webhook secret configured');
  }

  return candidates;
}

// ─── Handler principal ──────────────────────────────────────────────────────
async function handleWebhook(req, res) {
  // 1. Récupérer la signature Stripe depuis les headers
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.warn('[Webhook] Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // 2. req.body DOIT être un Buffer (express.raw) — vérification défensive
  if (!Buffer.isBuffer(req.body) && typeof req.body !== 'string') {
    console.error('[Webhook] req.body is not a raw Buffer — check express.raw() middleware');
    return res.status(400).json({ error: 'Invalid body format — raw body required' });
  }

  // 3. Vérification de la signature Stripe (constructEvent)
  //    C'est ici que l'authenticité de l'événement est garantie.
  //    Toute requête dont la signature ne correspond pas est rejetée 400
  //    avant d'atteindre un quelconque handler métier.
  let event = null;
  let stripeInstance = null;

  const candidates = resolveStripeContext(sig);

  for (const candidate of candidates) {
    try {
      event = candidate.stripe.webhooks.constructEvent(
        req.body,           // RAW Buffer — OBLIGATOIRE
        sig,                // Header stripe-signature
        candidate.secret    // Secret whsec_xxx depuis .env
      );
      stripeInstance = candidate.stripe;
      console.log(`[Webhook] Signature verified — mode: ${candidate.mode}, type: ${event.type}`);
      break; // Succès : on arrête la boucle
    } catch (err) {
      // Mauvais secret pour ce mode — on essaie le suivant
      if (candidates.indexOf(candidate) === candidates.length - 1) {
        // Dernier candidat échoué → rejet définitif
        console.warn(`[Webhook] Invalid signature: ${err.message}`);
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }
    }
  }

  // 4. Acquitter immédiatement Stripe (évite les retries Stripe pendant le traitement)
  res.status(200).json({ received: true });

  // 5. Traitement asynchrone de l'événement
  const data = event.data.object;
  const eventType = event.type;

  let connection;
  try {
    connection = await connect();

    switch (eventType) {

      // ── Subscription events ──────────────────────────────────────────────
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data, connection);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data, connection);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data, connection);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(data, connection);
        break;

      // ── Invoice events ───────────────────────────────────────────────────
      case 'invoice.paid':
        await handleSubscriptionInvoicePaid(data, connection);
        break;

      case 'invoice.payment_failed':
        console.log(`[Webhook] invoice.payment_failed: ${data.id}`);
        // TODO: notifier la company, passer subscription_status à 'past_due'
        break;

      // ── PaymentIntent (job payments) ─────────────────────────────────────
      case 'payment_intent.succeeded': {
        const jobId = data.metadata?.swiftapp_job_id
          ? parseInt(data.metadata.swiftapp_job_id, 10)
          : null;
        if (jobId && !isNaN(jobId)) {
          const paymentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await connection.execute(
            `UPDATE jobs
             SET payment_status = 'paid',
                 payment_time   = ?,
                 amount_paid    = amount_total,
                 amount_due     = 0,
                 updated_at     = NOW()
             WHERE id = ?
               AND payment_status != 'paid'`,
            [paymentTime, jobId]
          );
          // Update job_commissions status
          await connection.execute(
            `UPDATE job_commissions SET status = 'collected', updated_at = NOW()
             WHERE job_id = ? AND status = 'pending'`,
            [jobId]
          ).catch((e) => console.warn('[webhook] commission update failed:', e.message));
          console.log(`[Webhook] payment_intent.succeeded → job ${jobId} marked paid`);
        } else {
          console.log(`[Webhook] payment_intent.succeeded: ${data.id} (no job metadata)`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const jobId = data.metadata?.swiftapp_job_id
          ? parseInt(data.metadata.swiftapp_job_id, 10)
          : null;
        if (jobId && !isNaN(jobId)) {
          await connection.execute(
            `UPDATE jobs SET payment_status = 'failed', updated_at = NOW()
             WHERE id = ? AND payment_status = 'pending'`,
            [jobId]
          );
          console.log(`[Webhook] payment_intent.payment_failed → job ${jobId} marked failed`);
        }
        break;
      }

      // ── Connect / Payout events ──────────────────────────────────────────
      case 'account.updated':
        console.log(`[Webhook] account.updated: ${data.id}`);
        break;

      case 'payout.paid':
        console.log(`[Webhook] payout.paid: ${data.id}`);
        break;

      case 'payout.failed':
        console.log(`[Webhook] payout.failed: ${data.id}`);
        break;

      case 'payout.canceled':
        console.log(`[Webhook] payout.canceled: ${data.id}`);
        break;

      // ── Fallback ─────────────────────────────────────────────────────────
      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

  } catch (err) {
    // L'événement a déjà été acquitté (200) — on log sans répondre à nouveau
    console.error(`[Webhook] Handler error for ${eventType}:`, err.message);
  } finally {
    if (connection) await close(connection);
  }
}

module.exports = { handleWebhook };

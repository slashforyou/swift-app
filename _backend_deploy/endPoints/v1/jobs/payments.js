/**
 * =====================================================
 * 💼 JOB PAYMENTS ENDPOINTS
 * =====================================================
 * 
 * Module de gestion des paiements directs pour les jobs.
 * 
 * Fonctionnalités:
 * - Création de Payment Intents pour jobs (sans facture)
 * - Confirmation de paiements jobs
 * - Historique des paiements via API Stripe (pas de stockage local)
 * - Mise à jour automatique du statut job
 * - Support Stripe Connect avec Application Fee
 * - Sécurité: Aucune donnée sensible stockée localement
 * 
 * Architecture Sécurisée:
 * - Payment Intents gérés entièrement par Stripe
 * - Seul le Payment Intent ID stocké dans jobs.payment_link
 * - Historique récupéré via API Stripe (stripe.paymentIntents.list)
 * - Métadonnées Stripe utilisées pour lier jobs et paiements
 * 
 * @author Romain Giovanni (slashforyou)
 * @date 2025-12-07
 */

const { stripe, config } = require('../../../config/stripe');
const { connect, close } = require('../../../swiftDb');

/**
 * POST /swift-app/v1/jobs/{job_id}/payment/create
 * 
 * Crée un Payment Intent pour un job spécifique.
 * 
 * Features:
 * - Paiement direct job (sans facture intermédiaire)
 * - Application Fee automatique (commission plateforme)
 * - Support Connected Account
 * - Métadonnées job complètes
 * - Création Customer Stripe si nécessaire
 * 
 * Params:
 * - job_id: ID du job à payer
 * 
 * Body:
 * - amount (optional): Montant custom, sinon amount_total du job
 * - currency (optional): Devise, default AUD
 * - description (optional): Description custom
 * 
 * Response:
 * - payment_intent_id: ID du Payment Intent Stripe
 * - client_secret: Pour frontend Stripe Elements
 * - amount: Montant en cents
 * - currency: Devise
 */
async function createJobPaymentIntent(req, res) {
  const db = await connect();
  
  try {
    const userId = req.user.id;
    const userCompanyId = req.user.company_id;
    const userRole = req.user.role;
    const jobId = parseInt(req.params.job_id);
    const { amount: customAmount, currency = 'AUD', description } = req.body;
    
    console.log('💳 [Job Payment] Creating Payment Intent', {
      job_id: jobId,
      user_id: userId,
      company_id: userCompanyId
    });
    
    // Récupérer le job avec vérification que l'utilisateur y a accès
    const [jobs] = await db.query(`
      SELECT 
        j.*,
        c.id as client_id,
        c.stripe_customer_id,
        c.email as client_email,
        c.first_name,
        c.last_name,
        c.stripe_customer_account_id,
        c.stripe_customer_account_type,
        sca.stripe_account_id,
        sca.charges_enabled,
        comp.stripe_platform_fee_percentage,
        comp.name as company_name,
        ju.role as user_job_role,
        ju.user_id as ju_user_id
      FROM jobs j
      LEFT JOIN clients c ON j.client_id = c.id
      LEFT JOIN stripe_connected_accounts sca ON j.contractor_company_id = sca.company_id AND sca.disconnected_at IS NULL
      LEFT JOIN companies comp ON j.contractor_company_id = comp.id
      LEFT JOIN job_users ju ON j.id = ju.job_id AND ju.user_id = ?
      WHERE j.id = ?
        AND (
          ju.user_id IS NOT NULL
          OR (
            j.contractor_company_id = ?
            AND j.contractee_company_id = j.contractor_company_id
            AND ? IN ('owner','admin')
          )
        )
    `, [userId, jobId, userCompanyId, userRole]);
    
    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }
    
    const job = jobs[0];
    
    // Validation du job
    if (job.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Job is already paid'
      });
    }
    
    if (job.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot create payment for cancelled job'
      });
    }
    
    // Déterminer le montant
    const amount = Number(customAmount ?? job.amount_total);
    const normalizedCurrency = currency.toLowerCase();
    const amountCents = Math.round(amount * 100);
    
    if (!Number.isFinite(amount) || amountCents <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Job has no amount or invalid amount provided'
      });
    }

    if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency format'
      });
    }
    
    // Vérifier Connected Account
    if (!job.stripe_account_id || !job.charges_enabled) {
      return res.status(400).json({
        success: false,
        error: 'Company Stripe account not ready for payments',
        action_required: 'complete_stripe_onboarding'
      });
    }
    
    // Créer/récupérer Stripe Customer
    let stripeCustomerId = job.stripe_customer_id;
    const customerAccountId = job.stripe_customer_account_id;
    const customerAccountType = job.stripe_customer_account_type;
    const isCustomerScopedToDifferentAccount =
      stripeCustomerId && customerAccountId && customerAccountId !== job.stripe_account_id;
    const isCustomerPlatformScoped = stripeCustomerId && customerAccountType === 'platform';

    if (isCustomerScopedToDifferentAccount || isCustomerPlatformScoped) {
      console.warn('⚠️ [Job Payment] Stripe customer scope mismatch, recreating', {
        client_id: job.client_id,
        job_id: jobId,
        customer_account_id: customerAccountId,
        connected_account_id: job.stripe_account_id
      });
      stripeCustomerId = null;
    }
    if (!stripeCustomerId && job.client_id) {
      console.log(`👤 [Job Payment] Creating Stripe Customer for client ${job.client_id}`);
      
      const customer = await stripe.customers.create({
        email: job.client_email,
        name: `${job.first_name} ${job.last_name}`,
        metadata: {
          swiftapp_client_id: job.client_id.toString(),
          swiftapp_company_id: job.contractor_company_id.toString()
        }
      }, {
        stripeAccount: job.stripe_account_id
      });
      
      stripeCustomerId = customer.id;
      
      // Sauvegarder customer_id en DB
      await db.query(
        `UPDATE clients
         SET stripe_customer_id = ?,
             stripe_customer_account_id = ?,
             stripe_customer_account_type = 'connected'
         WHERE id = ?`,
        [stripeCustomerId, job.stripe_account_id, job.client_id]
      );
    }
    
    // [PATCH] commission_v1 — plan-based platform fee
    const PLAN_COMMISSION_RATES = { free: 0.03, pro: 0.015, enterprise: 0.005 };
    const PLAN_MIN_FEE_CENTS    = { free: 50,   pro: 25,    enterprise: 0     };
    let planType = 'free';
    try {
      const companyId = job.contractor_company_id || req.user.company_id;
      const [planRows] = await connection.execute(
        'SELECT plan_type FROM companies WHERE id = ?', [companyId]
      );
      planType = planRows[0]?.plan_type || 'free';
    } catch (_planErr) {
      // fallback to free plan on error
    }
    const planRate   = PLAN_COMMISSION_RATES[planType] ?? 0.03;
    const planMinFee = PLAN_MIN_FEE_CENTS[planType]    ?? 50;
    const applicationFeeAmount = Math.max(planMinFee, Math.round(amountCents * planRate));
    // Record commission in job_commissions (non-blocking)
    connection.execute(
      `INSERT IGNORE INTO job_commissions
         (job_id, company_id, plan_type, job_amount_aud, commission_rate, commission_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [jobId, job.contractor_company_id || 0, planType,
       amount, planRate, applicationFeeAmount / 100]
    ).catch((e) => console.warn('[commission] insert failed (non-blocking):', e.message));
    
    // Préparer description
    const paymentDescription = description || 
      `Job Payment #${job.code} - ${job.company_name}`;
    
    console.log(`💰 [Job Payment] Amount: $${amount}, Fee: $${applicationFeeAmount / 100}`);
    
    // Créer Payment Intent
    const paymentIntentParams = {
      amount: amountCents, // Convertir en cents
      currency: normalizedCurrency,
      customer: stripeCustomerId || undefined,
      description: paymentDescription,
      application_fee_amount: applicationFeeAmount,
      metadata: {
        swiftapp_job_id: jobId.toString(),
        swiftapp_company_id: job.contractor_company_id.toString(),
        swiftapp_client_id: job.client_id ? job.client_id.toString() : 'none',
        swiftapp_user_id: userId.toString(),
        swiftapp_type: 'job_payment',
        swiftapp_job_code: job.code
      },
      automatic_payment_methods: {
        enabled: true
      }
    };
    
    const idempotencyKey = `job_${jobId}_amt_${amountCents}_cur_${normalizedCurrency}`;
    const createPaymentIntent = async (customerId, allowRetry) => {
      try {
        return await stripe.paymentIntents.create(
          {
            ...paymentIntentParams,
            customer: customerId || undefined
          },
          { stripeAccount: job.stripe_account_id, idempotencyKey }
        );
      } catch (stripeError) {
        const isMissingCustomer = stripeError?.type === 'StripeInvalidRequestError'
          && stripeError?.code === 'resource_missing'
          && stripeError?.param === 'customer';
        if (!isMissingCustomer || !allowRetry || !job.client_id) {
          throw stripeError;
        }

        console.warn('⚠️ [Job Payment] Stripe customer missing, recreating...', {
          client_id: job.client_id,
          job_id: jobId
        });

        const customer = await stripe.customers.create({
          email: job.client_email,
          name: `${job.first_name} ${job.last_name}`,
          metadata: {
            swiftapp_client_id: job.client_id.toString(),
            swiftapp_company_id: job.contractor_company_id.toString()
          }
        }, {
          stripeAccount: job.stripe_account_id
        });

        stripeCustomerId = customer.id;

        await db.query(
          `UPDATE clients
           SET stripe_customer_id = ?,
               stripe_customer_account_id = ?,
               stripe_customer_account_type = 'connected'
           WHERE id = ?`,
          [stripeCustomerId, job.stripe_account_id, job.client_id]
        );

        return await createPaymentIntent(stripeCustomerId, false);
      }
    };

    const paymentIntent = await createPaymentIntent(stripeCustomerId, true);

    if (stripeCustomerId && !customerAccountId && job.client_id) {
      await db.query(
        `UPDATE clients
         SET stripe_customer_account_id = ?,
             stripe_customer_account_type = 'connected'
         WHERE id = ?`,
        [job.stripe_account_id, job.client_id]
      );
    }
    
    console.log(`✅ [Job Payment] Created Payment Intent: ${paymentIntent.id}`);
    
    // Sauvegarder seulement le Payment Intent ID dans le job (pas de duplication des données Stripe)
    await db.query(
      'UPDATE jobs SET payment_link = ?, payment_status = ?, updated_at = NOW() WHERE id = ?',
      [paymentIntent.id, 'pending', jobId]
    );
    
    res.status(201).json({
      success: true,
      data: {
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: amountCents,
        currency: normalizedCurrency,
        application_fee_amount: applicationFeeAmount,
        // IMPORTANT: Le frontend DOIT utiliser ce stripe_account_id dans le SDK
        stripe_account_id: job.stripe_account_id,
        job: {
          id: jobId,
          code: job.code,
          amount_total: job.amount_total,
          payment_status: 'pending'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [Job Payment] Error creating Payment Intent:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stripe request',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      message: error.message
    });
  } finally {
    await close(db);
  }
}

/**
 * POST /swift-app/v1/jobs/{job_id}/payment/confirm
 * 
 * Confirme un paiement pour un job et met à jour le statut.
 * 
 * Params:
 * - job_id: ID du job
 * 
 * Body:
 * - payment_intent_id: ID du Payment Intent à confirmer
 * - status: succeeded|failed
 * 
 * Response:
 * - job: Job mis à jour
 * - payment_status: Statut final du paiement
 */
async function confirmJobPayment(req, res) {
  const db = await connect();
  
  try {
    const userId = req.user.id;
    const userCompanyId = req.user.company_id;
    const userRole = req.user.role;
    const jobId = parseInt(req.params.job_id);
    const { payment_intent_id, status } = req.body;
    
    console.log('✅ [Job Payment] Confirming payment', {
      payment_intent_id,
      job_id: jobId,
      user_id: userId,
      company_id: userCompanyId
    });
    
    if (!userId || !userCompanyId || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required user or job context'
      });
    }

    if (!payment_intent_id || !status) {
      return res.status(400).json({
        success: false,
        error: 'payment_intent_id and status are required'
      });
    }
    
    // Récupérer le job en vérifiant l'accès utilisateur
    const [jobs] = await db.query(`
      SELECT j.*
      FROM jobs j
      LEFT JOIN job_users ju ON j.id = ju.job_id AND ju.user_id = ?
      WHERE j.id = ?
        AND (
          ju.user_id IS NOT NULL
          OR (
            j.contractor_company_id = ?
            AND j.contractee_company_id = j.contractor_company_id
            AND ? IN ('owner','admin')
          )
        )
    `, [userId, jobId, userCompanyId, userRole]);
    
    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }
    
    const job = jobs[0];

    if (job.payment_status === 'paid' && status === 'succeeded') {
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        data: {
          job,
          payment_status: 'paid',
          payment_intent_id
        }
      });
    }
    
    // Vérifier que le Payment Intent correspond au job
    if (job.payment_link !== payment_intent_id) {
      return res.status(400).json({
        success: false,
        error: 'Payment Intent does not match job'
      });
    }
    
    // Mise à jour selon le statut
    let newPaymentStatus;
    let paymentTime = null;
    
    switch (status) {
      case 'succeeded':
        newPaymentStatus = 'paid';
        paymentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        break;
      case 'failed':
        newPaymentStatus = 'failed';
        break;
      default:
        newPaymentStatus = 'pending';
    }
    
    // Mettre à jour le job
    const updateFields = [
      'payment_status = ?',
      'updated_at = NOW()'
    ];
    const updateValues = [newPaymentStatus];
    
    if (paymentTime) {
      updateFields.push('payment_time = ?');
      updateValues.push(paymentTime);
    }
    
    if (status === 'succeeded') {
      updateFields.push('amount_paid = amount_total');
      updateFields.push('amount_due = 0');
    }
    
    updateValues.push(jobId);
    
    await db.query(
      `UPDATE jobs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Note: Pas de mise à jour de table transactions locale - Stripe gère tout

    // [Phase 3 JQS] Log job event — non-blocking
    if (status === 'succeeded') {
      try {
        await db.query(
          `INSERT INTO job_events (job_id, company_id, actor_user_id, event_type, payload)
           VALUES (?, ?, ?, 'payment_collected', JSON_OBJECT('amount', ?, 'method', 'stripe'))`,
          [jobId, userCompanyId, userId, job.amount_total || null]
        );
      } catch (evtErr) {
        console.error('[payment_collected] job_events insert failed:', evtErr.message);
      }
    }

    // Récupérer le job mis à jour
    const [updatedJobs] = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [jobId]
    );
    
    console.log(`✅ [Job Payment] Job ${jobId} payment status updated to: ${newPaymentStatus}`);
    
    res.json({
      success: true,
      data: {
        job: updatedJobs[0],
        payment_status: newPaymentStatus,
        payment_intent_id
      }
    });
    
  } catch (error) {
    console.error('❌ [Job Payment] Error confirming payment:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment',
      message: error.message
    });
  } finally {
    await close(db);
  }
}

/**
 * GET /swift-app/v1/jobs/{job_id}/payments
 * 
 * Récupère l'historique des paiements pour un job directement depuis Stripe.
 * Approche sécurisée : aucune donnée de transaction stockée localement.
 * 
 * Params:
 * - job_id: ID du job
 * 
 * Response:
 * - Array des paiements récupérés via API Stripe
 * - Métadonnées job incluses
 */
async function getJobPayments(req, res) {
  const db = await connect();
  
  try {
    const userId = req.user.id;
    const userCompanyId = req.user.company_id;
    const userRole = req.user.role;
    const jobId = parseInt(req.params.job_id);
    
    console.log('📊 [Job Payment] Getting payment history', {
      job_id: jobId,
      user_id: userId,
      company_id: userCompanyId
    });
    
    // Vérifier que le job existe et que l'utilisateur y a accès
    const [jobs] = await db.query(`
      SELECT j.id, j.code, j.contractor_company_id 
      FROM jobs j
      LEFT JOIN job_users ju ON j.id = ju.job_id AND ju.user_id = ?
      WHERE j.id = ?
        AND (
          ju.user_id IS NOT NULL
          OR (
            j.contractor_company_id = ?
            AND j.contractee_company_id = j.contractor_company_id
            AND ? IN ('owner','admin')
          )
        )
    `, [userId, jobId, userCompanyId, userRole]);
    
    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or unauthorized'
      });
    }
    
    // Récupérer le Connected Account pour accéder aux données Stripe
    const [accounts] = await db.query(`
      SELECT sca.stripe_account_id 
      FROM stripe_connected_accounts sca 
      WHERE sca.company_id = ? AND sca.disconnected_at IS NULL
    `, [jobs[0].contractor_company_id]);
    
    if (accounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Stripe account not connected'
      });
    }
    
    const stripeAccountId = accounts[0].stripe_account_id;
    
    try {
      // Rechercher les Payment Intents liés à ce job via les métadonnées
      // Note: Stripe list ne supporte pas le filtrage par metadata, on récupère et filtre
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100
      }, {
        stripeAccount: stripeAccountId
      });
      
      // Filtrer les Payment Intents pour ce job spécifique
      const jobPayments = paymentIntents.data.filter(pi => 
        pi.metadata?.swiftapp_job_id === jobId.toString()
      );
      
      // Formater les données pour correspondre au format demandé
      const payments = jobPayments.map(pi => {
        const lastCharge = pi.charges?.data?.[0];
        
        return {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency.toUpperCase(),
          status: pi.status,
          type: 'payment',
          description: pi.description || 'Job payment',
          created: new Date(pi.created * 1000).toISOString(),
          updated: lastCharge ? new Date(lastCharge.created * 1000).toISOString() : null,
          application_fee: pi.application_fee_amount || 0,
          method: lastCharge?.payment_method_details?.type || null,
          client: pi.customer ? {
            id: pi.customer
          } : null
        };
      });
      
      res.json({
        success: true,
        data: payments,
        meta: {
          job_id: jobId,
          job_code: jobs[0].code,
          total_payments: payments.length
        }
      });
      
    } catch (stripeError) {
      console.error('❌ [Job Payment] Stripe API error:', stripeError);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payments from Stripe',
        message: stripeError.message
      });
    }
    
  } catch (error) {
    console.error('❌ [Job Payment] Error getting payment history:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history',
      message: error.message
    });
  } finally {
    await close(db);
  }
}

module.exports = {
  createJobPaymentIntent,
  confirmJobPayment,
  getJobPayments
};
/**
 * =====================================================
 * 💳 STRIPE SUBSCRIPTIONS ENDPOINT
 * =====================================================
 *
 * Gestion des abonnements Stripe Billing pour les plans Pro/Expert.
 *
 * Endpoints:
 * - POST /subscriptions/create     → Crée un SetupIntent + Subscription
 * - POST /subscriptions/cancel     → Annule l'abonnement (fin de période)
 * - POST /subscriptions/resume     → Reprend un abonnement annulé
 * - GET  /subscriptions/status     → Statut de l'abonnement actuel
 * - POST /subscriptions/change-plan → Change de plan (upgrade/downgrade)
 *
 * @module endPoints/v1/stripe/subscriptions
 */

const { stripe, config } = require('../../../config/stripe');
const { connect, close } = require('../../../swiftDb');

/**
 * Récupère ou crée un Stripe Customer pour une company
 */
async function getOrCreateStripeCustomer(connection, companyId) {
  const [rows] = await connection.query(
    'SELECT c.id, c.name, c.email, c.stripe_customer_id, u.email as owner_email FROM companies c LEFT JOIN users u ON c.owner_user_id = u.id WHERE c.id = ?',
    [companyId]
  );

  if (!rows.length) throw new Error('Company not found');
  const company = rows[0];

  // Si le customer existe déjà, le retourner
  if (company.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(company.stripe_customer_id);
      if (!existing.deleted) return existing;
    } catch (err) {
      console.warn(`Stripe customer ${company.stripe_customer_id} not found, creating new one`);
    }
  }

  // Créer un nouveau Stripe Customer
  const customer = await stripe.customers.create({
    name: company.name,
    email: company.email || company.owner_email,
    metadata: {
      company_id: String(companyId),
      platform: 'cobbr'
    }
  });

  // Sauvegarder en DB
  await connection.query(
    'UPDATE companies SET stripe_customer_id = ? WHERE id = ?',
    [customer.id, companyId]
  );

  console.log(`✅ Created Stripe Customer ${customer.id} for company ${companyId}`);
  return customer;
}

/**
 * POST /swift-app/v1/stripe/subscriptions/create
 *
 * Crée un abonnement Stripe pour la company.
 * 1. Crée/récupère le Stripe Customer
 * 2. Crée un SetupIntent pour collecter le moyen de paiement
 * 3. Retourne le clientSecret pour le PaymentSheet
 *
 * Body: { plan_id: 'pro' | 'expert' }
 */
async function createSubscription(req, res) {
  const { plan_id } = req.body;
  const companyId = req.user?.company_id;

  if (!companyId) {
    return res.status(401).json({ success: false, error: 'No company found for user' });
  }

  if (!plan_id) {
    return res.status(400).json({ success: false, error: 'plan_id is required' });
  }

  const connection = await connect();

  try {
    // 1. Vérifier que le plan existe et a un stripe_price_id
    const [plans] = await connection.query(
      'SELECT id, stripe_price_id, price_monthly, label FROM plans WHERE id = ?',
      [plan_id]
    );

    if (!plans.length) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const plan = plans[0];

    if (plan.price_monthly === 0) {
      return res.status(400).json({ success: false, error: 'Cannot subscribe to a free plan' });
    }

    if (!plan.stripe_price_id) {
      return res.status(400).json({ success: false, error: 'Plan not configured for billing' });
    }

    // 2. Vérifier qu'il n'y a pas déjà un abonnement actif
    const [company] = await connection.query(
      'SELECT subscription_id, subscription_status FROM companies WHERE id = ?',
      [companyId]
    );

    if (company[0]?.subscription_status === 'active' && company[0]?.subscription_id) {
      return res.status(400).json({
        success: false,
        error: 'An active subscription already exists. Use change-plan to switch.',
        subscription_id: company[0].subscription_id
      });
    }

    // 3. Créer/récupérer le customer Stripe
    const customer = await getOrCreateStripeCustomer(connection, companyId);

    // 4. Créer un ephemeral key pour le PaymentSheet
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    // 5. Vérifier l'éligibilité au trial Stripe (had_trial = 0 → jamais eu de trial Stripe)
    const [trialRows] = await connection.query(
      'SELECT had_trial FROM companies WHERE id = ?',
      [companyId]
    );
    const isFirstTrial = !trialRows[0]?.had_trial;

    // 6. Créer la subscription (trial 14j si éligible, sinon débit immédiat à la fin de période)
    //    Pendant le trial, latest_invoice.payment_intent sera null — c'est normal
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripe_price_id }],
      ...(isFirstTrial ? { trial_period_days: 14 } : {}),
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        company_id: String(companyId),
        plan_id: plan_id,
        platform: 'cobbr'
      }
    });

    // 7. Sauvegarder l'ID de subscription en DB (status sera mis à jour par webhook)
    await connection.query(
      'UPDATE companies SET subscription_id = ?, subscription_status = ? WHERE id = ?',
      [subscription.id, 'incomplete', companyId]
    );

    // Si c'était le premier trial, marquer had_trial = 1 (anti-abus)
    if (isFirstTrial && subscription.trial_end) {
      await connection.query(
        'UPDATE companies SET had_trial = 1 WHERE id = ?',
        [companyId]
      );
    }

    // 8. Retourner les secrets pour le PaymentSheet natif
    //    Pendant le trial, paymentIntent est null — retourner clientSecret: null sans erreur
    const paymentIntent = subscription.latest_invoice?.payment_intent;

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret ?? null,
        ephemeralKey: ephemeralKey.secret,
        customerId: customer.id,
        publishableKey: config.publishableKey,
        trial_end: subscription.trial_end,
        is_trial: !!subscription.trial_end,
      }
    });

  } catch (error) {
    console.error('❌ createSubscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription'
    });
  } finally {
    await close(connection);
  }
}

/**
 * POST /swift-app/v1/stripe/subscriptions/cancel
 *
 * Annule l'abonnement à la fin de la période en cours.
 * L'accès au plan est préservé jusqu'à la fin du mois payé.
 */
async function cancelSubscription(req, res) {
  const companyId = req.user?.company_id;

  if (!companyId) {
    return res.status(401).json({ success: false, error: 'No company found' });
  }

  const connection = await connect();

  try {
    const [company] = await connection.query(
      'SELECT subscription_id, subscription_status FROM companies WHERE id = ?',
      [companyId]
    );

    if (!company[0]?.subscription_id) {
      return res.status(400).json({ success: false, error: 'No subscription found' });
    }

    // Cancel at period end (not immediately)
    const subscription = await stripe.subscriptions.update(
      company[0].subscription_id,
      { cancel_at_period_end: true }
    );

    await connection.query(
      'UPDATE companies SET subscription_status = ? WHERE id = ?',
      ['canceling', companyId]
    );

    res.json({
      success: true,
      data: {
        subscription_id: subscription.id,
        cancel_at: subscription.cancel_at,
        current_period_end: subscription.current_period_end,
      }
    });

  } catch (error) {
    console.error('❌ cancelSubscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await close(connection);
  }
}

/**
 * POST /swift-app/v1/stripe/subscriptions/resume
 *
 * Reprend un abonnement marqué pour annulation.
 */
async function resumeSubscription(req, res) {
  const companyId = req.user?.company_id;

  if (!companyId) {
    return res.status(401).json({ success: false, error: 'No company found' });
  }

  const connection = await connect();

  try {
    const [company] = await connection.query(
      'SELECT subscription_id FROM companies WHERE id = ?',
      [companyId]
    );

    if (!company[0]?.subscription_id) {
      return res.status(400).json({ success: false, error: 'No subscription found' });
    }

    const subscription = await stripe.subscriptions.update(
      company[0].subscription_id,
      { cancel_at_period_end: false }
    );

    await connection.query(
      'UPDATE companies SET subscription_status = ? WHERE id = ?',
      ['active', companyId]
    );

    res.json({
      success: true,
      data: { subscription_id: subscription.id, status: subscription.status }
    });

  } catch (error) {
    console.error('❌ resumeSubscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await close(connection);
  }
}

/**
 * GET /swift-app/v1/stripe/subscriptions/status
 *
 * Retourne le statut complet de l'abonnement.
 */
async function getSubscriptionStatus(req, res) {
  const companyId = req.user?.company_id;

  if (!companyId) {
    return res.status(401).json({ success: false, error: 'No company found' });
  }

  const connection = await connect();

  try {
    const [company] = await connection.query(
      'SELECT subscription_id, subscription_status, plan_type, stripe_customer_id FROM companies WHERE id = ?',
      [companyId]
    );

    if (!company.length) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const data = {
      plan_type: company[0].plan_type,
      subscription_status: company[0].subscription_status,
      subscription_id: company[0].subscription_id,
      stripe_details: null,
    };

    // Si il y a un abonnement Stripe, récupérer les détails
    if (company[0].subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(company[0].subscription_id);
        data.stripe_details = {
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          cancel_at: sub.cancel_at,
          default_payment_method: sub.default_payment_method,
        };
      } catch (err) {
        console.warn('Could not retrieve Stripe subscription:', err.message);
      }
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error('❌ getSubscriptionStatus error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await close(connection);
  }
}

/**
 * POST /swift-app/v1/stripe/subscriptions/change-plan
 *
 * Change de plan (upgrade ou downgrade).
 * Stripe gère automatiquement le prorata.
 *
 * Body: { plan_id: 'pro' | 'expert' }
 */
async function changePlan(req, res) {
  const { plan_id } = req.body;
  const companyId = req.user?.company_id;

  if (!companyId) {
    return res.status(401).json({ success: false, error: 'No company found' });
  }

  if (!plan_id) {
    return res.status(400).json({ success: false, error: 'plan_id is required' });
  }

  const connection = await connect();

  try {
    // 1. Récupérer le plan cible
    const [plans] = await connection.query(
      'SELECT id, stripe_price_id, price_monthly, platform_fee_percentage FROM plans WHERE id = ?',
      [plan_id]
    );

    if (!plans.length || !plans[0].stripe_price_id) {
      return res.status(404).json({ success: false, error: 'Plan not found or not configured' });
    }

    // 2. Récupérer la subscription actuelle
    const [company] = await connection.query(
      'SELECT subscription_id FROM companies WHERE id = ?',
      [companyId]
    );

    if (!company[0]?.subscription_id) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription. Use create endpoint first.'
      });
    }

    // 3. Récupérer les items de la subscription
    const subscription = await stripe.subscriptions.retrieve(company[0].subscription_id);

    if (subscription.items.data.length === 0) {
      return res.status(400).json({ success: false, error: 'Subscription has no items' });
    }

    // 4. Mettre à jour le plan (Stripe gère le prorata)
    const updatedSubscription = await stripe.subscriptions.update(
      company[0].subscription_id,
      {
        items: [{
          id: subscription.items.data[0].id,
          price: plans[0].stripe_price_id,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          plan_id: plan_id,
          company_id: String(companyId),
        }
      }
    );

    // 5. Mettre à jour le plan en DB + sync platform fee
    await connection.query(
      'UPDATE companies SET plan_type = ?, stripe_platform_fee_percentage = ? WHERE id = ?',
      [plan_id, plans[0].platform_fee_percentage || 2.5, companyId]
    );

    res.json({
      success: true,
      data: {
        subscription_id: updatedSubscription.id,
        plan_id,
        status: updatedSubscription.status,
      }
    });

  } catch (error) {
    console.error('❌ changePlan error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await close(connection);
  }
}

// ==================== ROUTES ====================
function registerRoutes(router, authenticateToken) {
  if (!stripe || !config) {
    console.warn('⚠️  Stripe not configured — subscription routes disabled');
    return;
  }

  router.post('/stripe/subscriptions/create', authenticateToken, createSubscription);
  router.post('/stripe/subscriptions/cancel', authenticateToken, cancelSubscription);
  router.post('/stripe/subscriptions/resume', authenticateToken, resumeSubscription);
  router.get('/stripe/subscriptions/status', authenticateToken, getSubscriptionStatus);
  router.post('/stripe/subscriptions/change-plan', authenticateToken, changePlan);

  console.log('✅ Stripe subscription routes registered');
}

module.exports = {
  registerRoutes,
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  getSubscriptionStatus,
  changePlan,
};

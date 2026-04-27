/**
 * Webhook handlers for Stripe subscription events.
 * To be injected into the existing webhooks.js switch/case block.
 */

const { sendPushToCompany, insertNotification } = require('../../utils/pushHelper');

// === SUBSCRIPTION EVENT HANDLERS ===

/**
 * customer.subscription.created
 * Subscription created but not necessarily active yet
 */
async function handleSubscriptionCreated(subscription, connection) {
  console.log(`📋 Subscription created: ${subscription.id}`);

  const companyId = subscription.metadata?.company_id;
  if (!companyId) return;

  await connection.query(
    'UPDATE companies SET subscription_id = ?, subscription_status = ? WHERE id = ?',
    [subscription.id, subscription.status, companyId]
  );
}

/**
 * customer.subscription.updated
 * Handles activation, plan changes, cancellation scheduling
 */
async function handleSubscriptionUpdated(subscription, connection) {
  console.log(`🔄 Subscription updated: ${subscription.id} → ${subscription.status}`);

  const companyId = subscription.metadata?.company_id;
  if (!companyId) return;

  // Map Stripe status to our local status
  let localStatus = subscription.status; // 'active', 'past_due', 'canceled', 'incomplete', etc.
  if (subscription.cancel_at_period_end && subscription.status === 'active') {
    localStatus = 'canceling';
  }

  // Get the plan_id from subscription metadata or price lookup
  let planId = subscription.metadata?.plan_id;

  if (!planId && subscription.items?.data?.length > 0) {
    const priceId = subscription.items.data[0].price?.id;
    if (priceId) {
      const [plans] = await connection.query(
        'SELECT id FROM plans WHERE stripe_price_id = ?',
        [priceId]
      );
      if (plans.length) planId = plans[0].id;
    }
  }

  // Update company
  const updateFields = ['subscription_status = ?'];
  const updateValues = [localStatus];

  if (planId && subscription.status === 'active') {
    updateFields.push('plan_type = ?');
    updateValues.push(planId);

    // Sync platform fee from plan
    const [planRows] = await connection.query(
      'SELECT platform_fee_percentage FROM plans WHERE id = ?',
      [planId]
    );
    if (planRows.length) {
      updateFields.push('stripe_platform_fee_percentage = ?');
      updateValues.push(planRows[0].platform_fee_percentage);
    }
  }

  updateValues.push(companyId);

  await connection.query(
    `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  console.log(`✅ Company ${companyId} updated: status=${localStatus}${planId ? ', plan=' + planId : ''}`);
}

/**
 * customer.subscription.deleted
 * Subscription has been fully canceled (after period end)
 */
async function handleSubscriptionDeleted(subscription, connection) {
  console.log(`❌ Subscription deleted: ${subscription.id}`);

  const companyId = subscription.metadata?.company_id;
  if (!companyId) return;

  // Downgrade to free plan and reset fee
  const [freePlan] = await connection.query(
    'SELECT platform_fee_percentage FROM plans WHERE id = ?',
    ['free']
  );
  const freeFee = freePlan.length ? freePlan[0].platform_fee_percentage : 2.50;

  await connection.query(
    'UPDATE companies SET plan_type = ?, subscription_status = ?, subscription_id = NULL, stripe_platform_fee_percentage = ? WHERE id = ?',
    ['free', 'canceled', freeFee, companyId]
  );

  console.log(`⬇️ Company ${companyId} downgraded to free plan`);
}

/**
 * invoice.paid — Updated to also handle subscription invoices
 */
async function handleSubscriptionInvoicePaid(invoice, connection) {
  // Only handle subscription invoices, not one-off
  if (!invoice.subscription) return false;

  console.log(`💰 Subscription invoice paid: ${invoice.id} for sub ${invoice.subscription}`);

  const companyId = invoice.subscription_details?.metadata?.company_id
    || invoice.metadata?.company_id;

  if (companyId) {
    await connection.query(
      'UPDATE companies SET subscription_status = ? WHERE id = ? AND subscription_id = ?',
      ['active', companyId, invoice.subscription]
    );
  }

  return true; // Handled
}

/**
 * customer.subscription.trial_will_end
 * Stripe envoie cet événement 3 jours avant la fin du trial.
 * → Push notification à tous les users de la company.
 * → Notification insérée en DB pour chaque user.
 */
async function handleTrialWillEnd(subscription, connection) {
  console.log(`⏳ Trial will end: ${subscription.id}`);

  const companyId = subscription.metadata?.company_id;
  if (!companyId) return;

  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toLocaleDateString('en-AU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'soon';

  const title = '⏳ Your free trial ends in 3 days';
  const body = `Your Cobbr trial expires on ${trialEnd}. Add a payment method to keep access.`;

  // Envoyer le push à toute la company
  await sendPushToCompany(connection, companyId, title, body, {
    type: 'system',
    screen: 'Subscription',
  });

  // Insérer une notification en DB pour chaque patron de la company
  const [owners] = await connection.query(
    "SELECT id FROM users WHERE company_id = ? AND role = 'patron'",
    [companyId]
  );

  for (const owner of owners) {
    await insertNotification(
      connection,
      owner.id,
      'system',
      title,
      body,
      null,
      'high'
    );
  }

  console.log(`✅ Trial warning sent for company ${companyId} (trial ends ${trialEnd})`);
}

module.exports = {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleSubscriptionInvoicePaid,
  handleTrialWillEnd,
};

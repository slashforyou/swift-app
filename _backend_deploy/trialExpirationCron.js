/**
 * trialExpirationCron — Expire les trials 14 jours
 *
 * Runs every day at 00:30 server time.
 * Finds companies with subscription_status = 'trial' AND trial_ends_at <= NOW().
 * Sets subscription_status = 'expired' and notifies the company owner.
 *
 * Usage in index.js (add after storageBillingCron):
 *   require('./cron/trialExpirationCron');
 *
 * Deploy to: /srv/www/htdocs/swiftapp/server/cron/trialExpirationCron.js
 */
'use strict';

const cron = require('node-cron');
const { connect } = require('../swiftDb');
const { insertNotification } = require('../utils/pushHelper');

// ── Run at 00:30 every day ──
cron.schedule('30 0 * * *', async () => {
  console.log('[trialExpirationCron] ▶ Running trial expiration check…');

  let connection;
  try {
    connection = await connect();

    // Find all companies whose trial period has expired
    const [expiredTrials] = await connection.execute(
      `SELECT c.id           AS company_id,
              c.name         AS company_name,
              c.trial_ends_at,
              c.owner_user_id
       FROM   companies c
       WHERE  c.subscription_status = 'trial'
         AND  c.trial_ends_at IS NOT NULL
         AND  c.trial_ends_at <= NOW()
         AND  c.owner_user_id IS NOT NULL
       ORDER  BY c.trial_ends_at ASC`
    );

    if (expiredTrials.length === 0) {
      console.log('[trialExpirationCron] No expired trials found.');
      return;
    }

    console.log(`[trialExpirationCron] Found ${expiredTrials.length} expired trial(s).`);

    // Batch-update to 'expired' — safe because owner_user_id IS NOT NULL guard above
    const companyIds = expiredTrials.map((r) => r.company_id);
    await connection.execute(
      `UPDATE companies
       SET    subscription_status = 'expired'
       WHERE  id IN (${companyIds.map(() => '?').join(',')})`,
      companyIds
    );
    console.log(`[trialExpirationCron] Marked ${companyIds.length} company/ies as expired.`);

    // Notify each owner — non-blocking (one failure must not abort the loop)
    for (const row of expiredTrials) {
      try {
        await insertNotification(
          connection,
          row.owner_user_id,
          'trial_expired',
          'Your free trial has ended',
          'Your 14-day free trial has expired. Subscribe now to keep access to Cobbr.',
          null,        // jobId — not applicable
          'high',
          { screen: 'Subscription', company_id: row.company_id }
        );
        console.log(
          `[trialExpirationCron] Notified owner ${row.owner_user_id}` +
          ` for company ${row.company_id} (${row.company_name})`
        );
      } catch (notifErr) {
        console.warn(
          `[trialExpirationCron] Could not notify owner ${row.owner_user_id}:`,
          notifErr.message
        );
      }
    }

  } catch (err) {
    console.error('[trialExpirationCron] Fatal error:', err.message, err.stack);
  } finally {
    if (connection) await connection.release();
  }
});

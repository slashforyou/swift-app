require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require('mysql2/promise');

(async () => {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      socketPath: process.env.DB_SOCKET
    });

    // 1. Check stripe_connected_accounts
    console.log('=== stripe_connected_accounts ===');
    const [sca] = await c.query('SELECT * FROM stripe_connected_accounts');
    sca.forEach(r => {
      console.log(JSON.stringify(r, null, 2));
    });

    // 2. Check companies with stripe info
    console.log('\n=== companies (stripe_onboarding_completed) ===');
    const [comps] = await c.query('SELECT id, name, owner_user_id, stripe_onboarding_completed, stripe_terms_accepted FROM companies');
    comps.forEach(r => console.log(JSON.stringify(r)));

    // 3. Check team_members for user 66
    console.log('\n=== team_members for user 66 ===');
    const [tm] = await c.query('SELECT * FROM team_members WHERE user_id = 66');
    tm.forEach(r => console.log(JSON.stringify(r)));

    await c.end();

    // 4. Now check Stripe accounts via API
    console.log('\n=== STRIPE API ===');
    for (const row of sca) {
      if (row.stripe_account_id) {
        try {
          const acct = await stripe.accounts.retrieve(row.stripe_account_id);
          console.log('\nAccount:', row.stripe_account_id, '(company_id:', row.company_id, ')');
          console.log('  charges_enabled:', acct.charges_enabled);
          console.log('  payouts_enabled:', acct.payouts_enabled);
          console.log('  details_submitted:', acct.details_submitted);
          console.log('  currently_due:', JSON.stringify(acct.requirements?.currently_due));
          console.log('  past_due:', JSON.stringify(acct.requirements?.past_due));
          console.log('  pending_verification:', JSON.stringify(acct.requirements?.pending_verification));
          console.log('  disabled_reason:', acct.requirements?.disabled_reason);
          console.log('  business_type:', acct.business_type);
          console.log('  country:', acct.country);
        } catch(e) {
          console.log('\nAccount:', row.stripe_account_id, '- ERROR:', e.message);
        }
      }
    }
  } catch(e) { console.error('ERROR:', e.message); }
})();

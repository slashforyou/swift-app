require('dotenv').config();
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

    // Mark company 12 onboarding as completed
    const [r1] = await c.query(
      'UPDATE companies SET stripe_onboarding_completed = 1 WHERE id = 12'
    );
    console.log('companies updated:', r1.affectedRows);

    // Mark stripe_connected_accounts onboarding_completed_at
    const [r2] = await c.query(
      'UPDATE stripe_connected_accounts SET onboarding_completed_at = NOW() WHERE company_id = 12 AND onboarding_completed_at IS NULL'
    );
    console.log('stripe_connected_accounts updated:', r2.affectedRows);

    // Verify
    const [rows] = await c.query('SELECT id, stripe_onboarding_completed FROM companies WHERE id = 12');
    console.log('Company 12:', rows[0]);

    const [sca] = await c.query('SELECT id, onboarding_completed_at, onboarding_progress FROM stripe_connected_accounts WHERE company_id = 12');
    console.log('SCA:', sca[0]);

    await c.end();
    console.log('Done');
  } catch(e) { console.error(e.message); }
})();

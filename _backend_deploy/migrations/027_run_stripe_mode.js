// Step 1: Add stripe_mode column
require('dotenv').config({ path: '/srv/www/htdocs/swiftapp/server/.env' });
const mysql = require('/srv/www/htdocs/swiftapp/server/node_modules/mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    socketPath: process.env.DB_SOCKET
  });

  const [cols] = await c.query("SHOW COLUMNS FROM stripe_connected_accounts LIKE 'stripe_mode'");
  if (cols.length === 0) {
    await c.query("ALTER TABLE stripe_connected_accounts ADD COLUMN stripe_mode ENUM('test','live') NOT NULL DEFAULT 'test' AFTER stripe_account_id");
    await c.query("UPDATE stripe_connected_accounts SET stripe_mode = 'test'");
    console.log('✅ Column stripe_mode added, existing accounts set to test');
  } else {
    console.log('ℹ️ Column stripe_mode already exists');
  }
  await c.end();
})().catch(e => { console.error('❌', e.message); process.exit(1); });

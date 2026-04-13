// Load env from .env file in server directory
const fs = require('fs');
const path = require('path');
const envPath = path.join('/srv/www/htdocs/swiftapp/server', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}
const { connect } = require(path.join('/srv/www/htdocs/swiftapp/server', 'swiftDb'));
(async () => {
  try {
    const c = await connect();
    const [r] = await c.query('SELECT id, company_id, stripe_account_id, account_type, stripe_mode FROM stripe_connected_accounts WHERE disconnected_at IS NULL');
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();

const path = require('path');
const {connect} = require(path.join('/srv/www/htdocs/swiftapp/server', 'swiftDb'));
(async () => {
  const c = await connect();
  const [r] = await c.query('SELECT id, company_id, stripe_account_id, account_type, stripe_mode FROM stripe_connected_accounts WHERE disconnected_at IS NULL');
  console.log(JSON.stringify(r, null, 2));
  await c.end();
})();

const mysql = require('/srv/www/htdocs/swiftapp/server/node_modules/mysql2/promise');
async function main() {
  const pool = mysql.createPool({ socketPath: '/run/mysql/mysql.sock', user: 'swiftapp_user', password: 'U%Xgxvc54EKUD39PcwNAYvuS', database: 'swiftapp' });
  const [users] = await pool.execute('SELECT id, company_id FROM users WHERE email = ?', ['contact@cobbr-app.com']);
  console.log('Users:', JSON.stringify(users));
  if (users.length > 0) {
    const u = users[0];
    if (u.company_id) {
      await pool.execute('DELETE FROM users WHERE company_id = ? AND id != ?', [u.company_id, u.id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [u.id]);
      await pool.execute('DELETE FROM companies WHERE id = ?', [u.company_id]);
      console.log('Deleted user ' + u.id + ' and company ' + u.company_id);
    } else {
      await pool.execute('DELETE FROM users WHERE id = ?', [u.id]);
      console.log('Deleted user ' + u.id);
    }
  } else {
    console.log('No user found with that email');
  }
  await pool.end();
}
main().catch(e => console.error(e));

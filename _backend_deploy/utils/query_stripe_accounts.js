// Temporary script to query stripe_connected_accounts table
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
  
  const [cols] = await c.query('DESCRIBE stripe_connected_accounts');
  console.log('=== TABLE STRUCTURE ===');
  console.log(JSON.stringify(cols, null, 2));
  
  const [rows] = await c.query('SELECT * FROM stripe_connected_accounts LIMIT 5');
  console.log('=== DATA ===');
  console.log(JSON.stringify(rows, null, 2));
  
  await c.end();
})().catch(e => console.error(e.message));

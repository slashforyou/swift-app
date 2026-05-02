require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    socketPath: process.env.DB_SOCKET,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  });
  const [r] = await c.query('SHOW CREATE TABLE trophy_ledgers');
  console.log(r[0]['Create Table']);
  c.end();
})();

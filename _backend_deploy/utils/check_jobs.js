require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    socketPath: process.env.DB_SOCKET,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  });
  // jobs table - client and address columns
  const [r] = await c.query('DESCRIBE jobs');
  const relevant = r.filter(col => 
    col.Field.includes('client') || col.Field.includes('address') || col.Field.includes('name')
  );
  console.log('jobs relevant cols:', relevant.map(x => x.Field).join(', '));
  c.end();
})();

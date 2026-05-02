require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    socketPath: process.env.DB_SOCKET,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  });
  const [tables] = await c.query("SHOW TABLES");
  const allTables = tables.map(t => Object.values(t)[0]);
  const jobTables = allTables.filter(t => t.startsWith('job'));
  console.log('job_* tables:', jobTables.join(', '));
  c.end();
})();

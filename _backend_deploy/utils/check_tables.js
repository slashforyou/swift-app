require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    socketPath: process.env.DB_SOCKET,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  });
  const [r] = await c.query('DESCRIBE job_images');
  console.log('job_images:', r.map(x => x.Field).join(', '));
  const [r2] = await c.query('DESCRIBE job_quality_scores');
  console.log('job_quality_scores:', r2.map(x => x.Field).join(', '));
  c.end();
})();

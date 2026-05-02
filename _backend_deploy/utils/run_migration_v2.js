// run_migration_v2.js — Exécute une migration SQL avec multipleStatements
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run_migration_v2.js migrations/xxx.sql');
  process.exit(1);
}

async function main() {
  let conn;
  try {
    // Charger les vars de connexion depuis l'env
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || process.env.MYSQL_USER;
    const dbPass = process.env.DB_PASS || process.env.MYSQL_PASSWORD;
    const dbName = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE;
    const dbSocket = process.env.DB_SOCKET || '/run/mysql/mysql.sock';

    conn = await mysql.createConnection({
      socketPath: dbSocket,
      user: dbUser,
      password: dbPass,
      database: dbName,
      multipleStatements: true,
    });

    console.log('Connected to DB:', dbName);

    const sql = fs.readFileSync(path.resolve(migrationFile), 'utf8');
    console.log('Running migration:', migrationFile, '(' + sql.length + ' chars)');

    const [results] = await conn.query(sql);

    // results peut être un tableau de résultats pour chaque statement
    const arr = Array.isArray(results) ? results : [results];
    arr.forEach(function(r, i) {
      if (r && r.serverStatus !== undefined) {
        // C'est un result header (CREATE, ALTER, INSERT)
        console.log('  [' + (i+1) + '] OK — affectedRows:', r.affectedRows || 0, 'warningStatus:', r.warningStatus || 0);
      } else if (Array.isArray(r)) {
        // SELECT result
        if (r.length > 0) {
          console.log('  [' + (i+1) + '] RESULT:', JSON.stringify(r[0]));
        }
      }
    });

    console.log('Migration completed successfully!');
  } catch (e) {
    console.error('Error:', e.message);
    if (e.sql) console.error('SQL context:', e.sql.substring(0, 200));
    process.exit(1);
  } finally {
    if (conn) conn.end();
    process.exit(0);
  }
}
main();

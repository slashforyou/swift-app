// run_migration.js — Exécute une migration SQL
require('dotenv').config();
const { connect } = require('./swiftDb');
const fs = require('fs');
const path = require('path');

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run_migration.js migrations/xxx.sql');
  process.exit(1);
}

async function main() {
  let conn;
  try {
    const sql = fs.readFileSync(path.resolve(migrationFile), 'utf8');
    // Découper par ; pour exécuter statement par statement
    const statements = sql.split(/;\s*\n/).filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));

    conn = await connect();
    console.log('Running migration:', migrationFile);
    console.log('Statements found:', statements.length);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      try {
        const [result] = await conn.query(stmt);
        if (result && result.affectedRows !== undefined) {
          console.log('  [' + (i+1) + '] OK — affectedRows:', result.affectedRows);
        } else if (Array.isArray(result) && result.length > 0) {
          // SELECT result
          console.log('  [' + (i+1) + '] RESULT:', JSON.stringify(result[0]));
        } else {
          console.log('  [' + (i+1) + '] OK');
        }
      } catch (e) {
        console.error('  [' + (i+1) + '] ERROR:', e.message);
        console.error('  Statement:', stmt.substring(0, 100));
        // Continue (migration additive — certaines colonnes peuvent déjà exister)
      }
    }
    console.log('Migration completed.');
  } catch (e) {
    console.error('Fatal:', e.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}
main();

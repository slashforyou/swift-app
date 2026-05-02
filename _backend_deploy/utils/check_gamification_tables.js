// check_gamification_tables.js — Liste les tables gamification/trophy/quest existantes
require('dotenv').config();
const { connect } = require('./swiftDb');

async function main() {
  let conn;
  try {
    conn = await connect();
    const patterns = ['gamif%', 'trophy%', 'quest%', 'job_score%', 'league%', 'level_reward%', 'unlocked%', 'client_review%', 'job_checkpoint%'];
    for (const p of patterns) {
      const [rows] = await conn.query('SHOW TABLES LIKE "' + p.replace(/%/g, '%') + '"');
      if (rows.length > 0) {
        console.log(`\nPattern '${p}':`);
        rows.forEach(r => console.log('  -', Object.values(r)[0]));
      }
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}
main();

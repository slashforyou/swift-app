require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    socketPath: process.env.DB_SOCKET,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  });

  const tables = [
    'gamification_badge_unlocks',
    'gamification_xp_events',
    'league_tiers',
    'level_rewards',
    'unlocked_rewards',
    'leaderboard_snapshots',
    'job_scorecards',
    'gamification_levels',
  ];

  for (const t of tables) {
    try {
      const [r] = await c.query(`DESCRIBE ${t}`);
      console.log(`\n=== ${t} ===`);
      r.forEach(col => console.log(`  ${col.Field} | ${col.Type} | ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`));
    } catch (e) {
      console.log(`\n=== ${t} === [NOT FOUND: ${e.message}]`);
    }
  }
  c.end();
})();

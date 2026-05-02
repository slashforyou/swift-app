// check_schema.js — Dump complet des schémas gamification existants
require('dotenv').config();
const { connect } = require('./swiftDb');

async function main() {
  let conn;
  try {
    conn = await connect();
    const tables = [
      'gamification_profiles','gamification_levels','gamification_badge_definitions',
      'gamification_badge_unlocks','gamification_xp_rewards','trophy_ledgers','trophy_events',
      'quests','gamification_quest_progress','gamification_quest_events',
      'job_scorecards','job_checkpoints','client_reviews','client_review_requests',
      'gamification_ranks','league_tiers','level_rewards','unlocked_rewards','leaderboard_snapshots'
    ];
    for (const t of tables) {
      try {
        const [rows] = await conn.query('DESCRIBE ' + t);
        console.log('\n=== ' + t + ' ===');
        rows.forEach(function(r) {
          console.log('  ' + r.Field + ' | ' + r.Type + (r.Null === 'YES' ? ' | NULL' : ' | NOT NULL'));
        });
      } catch(e) {
        console.log('\n=== ' + t + ' === [NOT FOUND]');
      }
    }
    console.log('\nDone.');
  } catch (e) {
    console.error(e.message);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}
main();

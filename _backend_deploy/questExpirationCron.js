'use strict';
// questExpirationCron.js
// Expire les quêtes dont la période est passée
// Cron: 1 0 * * * root node /srv/www/htdocs/swiftapp/server/cron/questExpirationCron.js >> /var/log/quest_expiration.log 2>&1

const { connect } = require('../swiftDb');

function getPeriodKey(type) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');

  if (type === 'daily')   return `daily_${yyyy}-${mm}-${dd}`;
  if (type === 'weekly') {
    const jan4      = new Date(yyyy, 0, 4);
    const dayOfYear = Math.floor((now - jan4) / 86400000) + jan4.getDay() + 1;
    const week      = String(Math.ceil(dayOfYear / 7)).padStart(2, '0');
    return `weekly_${yyyy}-W${week}`;
  }
  if (type === 'monthly') return `monthly_${yyyy}-${mm}`;
  return 'general';
}

async function runExpirationCron() {
  let conn;
  try {
    conn = await connect();
    console.log('[QuestExpir] Starting', new Date().toISOString());

    const dailyKey   = getPeriodKey('daily');
    const weeklyKey  = getPeriodKey('weekly');
    const monthlyKey = getPeriodKey('monthly');

    // Expire tous les in_progress/completed dont la période est révolue
    // (period_key ne correspond plus à la période courante)
    const [result] = await conn.execute(
      `UPDATE gamification_quest_progress gqp
       JOIN quests q ON q.code = gqp.quest_code
       SET gqp.status = 'expired', gqp.updated_at = NOW()
       WHERE gqp.status IN ('in_progress', 'completed')
         AND q.type != 'general'
         AND (
           (q.type = 'daily'   AND gqp.period_key != ?)
        OR (q.type = 'weekly'  AND gqp.period_key != ?)
        OR (q.type = 'monthly' AND gqp.period_key != ?)
         )`,
      [dailyKey, weeklyKey, monthlyKey]
    );

    console.log(`[QuestExpir] Expired ${result.affectedRows} quest progress entries`);
    console.log('[QuestExpir] Done', new Date().toISOString());
  } catch (e) {
    console.error('[QuestExpir] Fatal error:', e);
    process.exitCode = 1;
  } finally {
    try { conn?.release?.(); } catch (_) {}
    process.exit(process.exitCode || 0);
  }
}

runExpirationCron();

/**
 * dailyRecapCron.js — run via cron every 5 minutes.
 * For each user who completed at least one job today and whose last job ended
 * >= 15 minutes ago, build a recap entry and fire a push notification (once per day).
 *
 * Cron line (append to /etc/cron.d/swiftapp-gamification):
 *   * /5 * * * * root /root/.nvm/versions/node/v16.17.0/bin/node /srv/www/htdocs/swiftapp/server/utils/dailyRecapCron.js >> /var/log/swiftapp-recap.log 2>&1
 * (remove space in * /5 to make */5)
 */

'use strict';

const pool = require('../swiftDb');
const { sendPushToUser } = require('./pushHelper');

const DELAY_MINUTES = 15;

(async () => {
  let connection;
  try {
    connection = await pool.connect();

    // Create recap table if not yet done
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gamification_daily_recap (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT  NOT NULL,
        recap_date  DATE NOT NULL,
        total_xp_gained INT NOT NULL DEFAULT 0,
        jobs_completed  INT NOT NULL DEFAULT 0,
        level_before    INT NOT NULL DEFAULT 1,
        level_after     INT NOT NULL DEFAULT 1,
        level_up        TINYINT(1) NOT NULL DEFAULT 0,
        breakdown       JSON NULL,
        sent_at         DATETIME NULL,
        UNIQUE KEY uq_user_date (user_id, recap_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Idempotent: add missing columns if table was created by an older version
    for (const alterSql of [
      "ALTER TABLE gamification_daily_recap ADD COLUMN IF NOT EXISTS level_up TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE gamification_daily_recap ADD COLUMN IF NOT EXISTS breakdown JSON NULL",
      "ALTER TABLE gamification_daily_recap ADD COLUMN IF NOT EXISTS sent_at DATETIME NULL",
    ]) {
      await connection.execute(alterSql).catch(() => {}); // ignore if column already exists
    }

    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(Date.now() - DELAY_MINUTES * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    // Users who: completed a job today, last completion >= 15 min ago,
    //            not yet in gamification_daily_recap for today
    const [candidates] = await connection.execute(
      `SELECT l.entity_id AS user_id,
              MAX(l.created_at) AS last_job_at
       FROM gamification_reward_ledger l
       WHERE l.entity_type = 'user'
         AND l.trigger_event = 'job_completed'
         AND DATE(l.created_at) = ?
         AND NOT EXISTS (
           SELECT 1 FROM gamification_daily_recap r
           WHERE r.user_id = l.entity_id AND r.recap_date = ?
         )
       GROUP BY l.entity_id
       HAVING last_job_at <= ?`,
      [today, today, cutoff]
    );

    console.log(`[dailyRecapCron] ${today} — ${candidates.length} users to recap`);

    for (const row of candidates) {
      const userId = row.user_id;
      try {
        // Total XP today
        const [[xpRow]] = await connection.execute(
          `SELECT COALESCE(SUM(amount), 0) AS total
           FROM gamification_reward_ledger
           WHERE entity_type = 'user' AND entity_id = ?
             AND reward_type = 'xp' AND DATE(created_at) = ?`,
          [userId, today]
        );
        const xpToday = Number(xpRow.total) || 0;
        if (xpToday <= 0) continue;

        // Jobs completed today
        const [[jobsRow]] = await connection.execute(
          `SELECT COUNT(DISTINCT source_code) AS cnt
           FROM gamification_reward_ledger
           WHERE entity_type = 'user' AND entity_id = ?
             AND trigger_event = 'job_completed' AND DATE(created_at) = ?`,
          [userId, today]
        );
        const jobsCompleted = Number(jobsRow.cnt) || 0;

        // Current level (users table is authoritative)
        const [[userRow]] = await connection.execute(
          'SELECT COALESCE(experience, 0) AS xp, COALESCE(level, 1) AS level FROM users WHERE id = ?',
          [userId]
        );
        const currentLevel = userRow?.level ?? 1;
        const currentXp   = userRow?.xp ?? 0;
        const xpBefore    = Math.max(0, currentXp - xpToday);

        const [levelsRows] = await connection.execute(
          'SELECT level FROM gamification_levels WHERE xp_required <= ? ORDER BY xp_required DESC LIMIT 1',
          [xpBefore]
        );
        const levelBefore = levelsRows[0]?.level ?? 1;
        const levelUp     = currentLevel > levelBefore;

        // Save recap (INSERT IGNORE — idempotent)
        await connection.execute(
          `INSERT IGNORE INTO gamification_daily_recap
             (user_id, recap_date, total_xp_gained, jobs_completed, level_before, level_after, level_up)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, today, xpToday, jobsCompleted, levelBefore, currentLevel, levelUp ? 1 : 0]
        );

        // Build push message
        let title = levelUp
          ? `🎉 Niveau ${currentLevel} atteint !`
          : `✅ Beau travail aujourd'hui !`;
        let body = `+${xpToday} XP — ${jobsCompleted} job${jobsCompleted > 1 ? 's' : ''} completé${jobsCompleted > 1 ? 's' : ''} aujourd'hui.`;
        if (levelUp) body = `Niveau ${levelBefore} → ${currentLevel}  ${body}`;

        await sendPushToUser(connection, userId, title, body, {
          type: 'daily_recap',
          date: today,
          xp: xpToday,
          level_before: levelBefore,
          level_after: currentLevel,
        });

        console.log(`[dailyRecapCron] user=${userId} xp=${xpToday} jobs=${jobsCompleted} levelUp=${levelUp}`);
      } catch (ue) {
        console.error(`[dailyRecapCron] user=${userId} error:`, ue.message);
      }
    }
  } catch (err) {
    console.error('[dailyRecapCron] fatal:', err.message);
    process.exit(1);
  } finally {
    try { if (connection) connection.release?.() ?? connection.end?.(); } catch (_) {}
    process.exit(0);
  }
})();

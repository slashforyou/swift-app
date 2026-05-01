'use strict';

/**
 * Reputation Score Cron — Phase 3
 *
 * Daily job: updates users.reputation_score with the average JQS
 * of each user's last 90 days of completed jobs.
 *
 * Schedule: 03:00 AEST (UTC+10) = 17:00 UTC
 *
 * Called from index.js:
 *   const { startReputationCron } = require('./utils/reputationCron');
 *   startReputationCron();
 */

const { connect, close } = require('../swiftDb');

/**
 * Runs the UPDATE on all users who have JQS data in the last 90 days.
 * Uses a correlated subquery — safe and index-friendly when
 * job_quality_scores.user_id and calculated_at are indexed (see migration 064).
 */
async function updateReputationScores() {
  let connection;
  try {
    connection = await connect();

    const [result] = await connection.execute(`
      UPDATE users
      SET reputation_score = (
        SELECT AVG(jqs.score)
        FROM job_quality_scores jqs
        WHERE jqs.user_id = users.id
          AND jqs.calculated_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      )
      WHERE id IN (
        SELECT DISTINCT user_id
        FROM job_quality_scores
        WHERE calculated_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      )
    `);

    console.log(`[ReputationCron] Updated ${result.affectedRows} user(s) reputation_score`);
    close(connection);
  } catch (err) {
    console.error('[ReputationCron] updateReputationScores failed:', err.message);
    if (connection) close(connection);
  }
}

/**
 * Schedules the daily reputation score update.
 * Self-rescheduling via setTimeout — survives across midnight.
 */
function startReputationCron() {
  function scheduleNext() {
    const now = new Date();

    // Target: 17:00:00 UTC (= 03:00 AEST UTC+10)
    const next = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      17, 0, 0, 0
    ));

    // If target already passed today, push to tomorrow
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }

    const msUntilNext = next.getTime() - now.getTime();
    console.log(`[ReputationCron] Scheduled — next run in ${Math.round(msUntilNext / 60000)} min (${next.toUTCString()})`);

    setTimeout(async () => {
      console.log('[ReputationCron] Starting reputation score update...');
      await updateReputationScores();
      scheduleNext(); // reschedule for next day
    }, msUntilNext);
  }

  scheduleNext();
}

module.exports = { startReputationCron };

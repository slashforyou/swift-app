/**
 * Daily Recap Cron — Sends morning summary notification to all active users
 *
 * Runs every day at 07:00 server time.
 * For each company with active push tokens, sends a summary of today's jobs.
 *
 * Usage in index.js:
 *   require('./cron/dailyRecapCron');
 */

const cron = require("node-cron");
const { connect, close } = require("../swiftDb");
const { sendPushToUser, insertNotification } = require("../utils/pushHelper");

// ── Run at 07:00 every day ──
cron.schedule("0 7 * * *", async () => {
  console.log("[dailyRecapCron] ▶ Running daily recap…");

  let connection;
  try {
    connection = await connect();

    // Get all users with active push tokens
    const [activeUsers] = await connection.execute(`
      SELECT DISTINCT u.id AS user_id, u.company_id, u.first_name
      FROM users u
      JOIN user_push_tokens upt ON upt.user_id = u.id AND upt.is_active = 1
      JOIN notification_preferences np ON np.user_id = u.id AND np.push_notifications = 1
      WHERE u.company_id IS NOT NULL
    `);

    if (!activeUsers.length) {
      console.log("[dailyRecapCron] No active users with push tokens, skipping.");
      return;
    }

    // Group users by company
    const companiesMap = new Map();
    for (const user of activeUsers) {
      if (!companiesMap.has(user.company_id)) {
        companiesMap.set(user.company_id, []);
      }
      companiesMap.get(user.company_id).push(user);
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    let totalSent = 0;

    for (const [companyId, users] of companiesMap) {
      try {
        // Count today's jobs for this company
        const [jobStats] = await connection.execute(
          `SELECT
             COUNT(*) AS total_jobs,
             SUM(CASE WHEN status IN ('pending', 'assigned', 'accepted') THEN 1 ELSE 0 END) AS upcoming,
             SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
           FROM jobs
           WHERE (contractor_company_id = ? OR contractee_company_id = ?)
             AND DATE(start_date) = ?`,
          [companyId, companyId, todayStr]
        );

        const stats = jobStats[0] || { total_jobs: 0, upcoming: 0, in_progress: 0, completed: 0 };
        const totalJobs = parseInt(stats.total_jobs) || 0;

        // Don't notify if no jobs today
        if (totalJobs === 0) continue;

        // Count pending assignments (staff that hasn't accepted yet)
        const [pendingAssignments] = await connection.execute(
          `SELECT COUNT(*) AS pending_count
           FROM job_assignments ja
           JOIN jobs j ON j.id = ja.job_id
           WHERE ja.assigned_by_company_id = ?
             AND ja.status = 'pending'
             AND DATE(j.start_date) = ?`,
          [companyId, todayStr]
        );
        const pendingCount = parseInt(pendingAssignments[0]?.pending_count) || 0;

        // Build recap message
        const parts = [];
        if (stats.upcoming > 0) parts.push(`${stats.upcoming} à venir`);
        if (stats.in_progress > 0) parts.push(`${stats.in_progress} en cours`);
        if (stats.completed > 0) parts.push(`${stats.completed} terminé${stats.completed > 1 ? 's' : ''}`);

        let body = `${totalJobs} job${totalJobs > 1 ? 's' : ''} aujourd'hui`;
        if (parts.length) body += ` (${parts.join(', ')})`;
        if (pendingCount > 0) body += `. ⚠️ ${pendingCount} affectation${pendingCount > 1 ? 's' : ''} en attente`;

        const title = '📋 Récap du jour';

        // Send to each user of this company
        for (const user of users) {
          try {
            await sendPushToUser(connection, user.user_id, title, body, {
              type: 'daily_recap',
              screen: 'Calendar',
              date: todayStr,
            });
            await insertNotification(
              connection,
              user.user_id,
              'info',
              title,
              body,
              null,
              'normal',
              { date: todayStr, total_jobs: totalJobs, pending_assignments: pendingCount }
            );
            totalSent++;
          } catch (userErr) {
            console.warn(`[dailyRecapCron] Error for user ${user.user_id}:`, userErr.message);
          }
        }
      } catch (companyErr) {
        console.warn(`[dailyRecapCron] Error for company ${companyId}:`, companyErr.message);
      }
    }

    console.log(`[dailyRecapCron] ✅ Sent ${totalSent} daily recap notifications.`);
  } catch (error) {
    console.error("[dailyRecapCron] ❌ Fatal error:", error);
  } finally {
    if (connection) {
      try { await close(connection); } catch { /* ignore */ }
    }
  }
});

console.log("[dailyRecapCron] 📋 Scheduled: daily recap at 07:00");

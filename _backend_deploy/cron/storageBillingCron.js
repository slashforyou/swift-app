/**
 * Storage Billing Cron — Generates billing records for due storage lots
 *
 * Runs every day at 02:30 server time.
 * - Creates billing records for active lots where billing_next_due <= today
 * - Advances billing_next_due to next period
 * - Marks overdue billing records and lots
 *
 * Usage in index.js:
 *   require('./cron/storageBillingCron');
 */

const cron = require("node-cron");
const { connect } = require("../swiftDb");

// ── Run at 02:30 every day ──
cron.schedule("30 2 * * *", async () => {
  console.log("[storageBillingCron] ▶ Running storage billing generation…");

  let connection;
  try {
    connection = await connect();
    const today = new Date().toISOString().slice(0, 10);

    // 1. Find active lots where billing_next_due <= today
    const [dueLots] = await connection.execute(
      `SELECT id, company_id, client_name, billing_type, billing_amount, billing_next_due
       FROM storage_lots
       WHERE status = 'active'
         AND billing_amount > 0
         AND billing_next_due IS NOT NULL
         AND billing_next_due <= ?`,
      [today]
    );

    if (!dueLots.length) {
      console.log("[storageBillingCron] No lots due for billing today.");
    } else {
      console.log(`[storageBillingCron] ${dueLots.length} lot(s) due for billing.`);
    }

    let generatedCount = 0;

    for (const lot of dueLots) {
      const periodStart = lot.billing_next_due;
      let periodEnd;
      let nextDue;

      if (lot.billing_type === "weekly") {
        periodEnd = new Date(new Date(periodStart).getTime() + 7 * 86400000).toISOString().slice(0, 10);
        nextDue = periodEnd;
      } else if (lot.billing_type === "monthly") {
        const d = new Date(periodStart);
        d.setMonth(d.getMonth() + 1);
        periodEnd = d.toISOString().slice(0, 10);
        nextDue = periodEnd;
      } else {
        // fixed / one-time — no recurrence
        periodEnd = periodStart;
        nextDue = null;
      }

      // Insert billing record
      await connection.execute(
        `INSERT INTO storage_billing_history
           (lot_id, company_id, amount, period_start, period_end, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
        [lot.id, lot.company_id, lot.billing_amount, periodStart, periodEnd]
      );

      // Advance next due date
      if (nextDue) {
        await connection.execute(
          "UPDATE storage_lots SET billing_next_due = ? WHERE id = ?",
          [nextDue, lot.id]
        );
      } else {
        await connection.execute(
          "UPDATE storage_lots SET billing_next_due = NULL WHERE id = ?",
          [lot.id]
        );
      }

      generatedCount++;
    }

    // 2. Mark overdue: pending billing records past their period_end
    const [overdueResult] = await connection.execute(
      `UPDATE storage_billing_history
       SET status = 'overdue'
       WHERE status = 'pending' AND period_end < ?`,
      [today]
    );

    // 3. Mark lots with overdue billing as overdue
    const [lotOverdueResult] = await connection.execute(
      `UPDATE storage_lots sl
       SET sl.status = 'overdue'
       WHERE sl.status = 'active'
         AND EXISTS (
           SELECT 1 FROM storage_billing_history sbh
           WHERE sbh.lot_id = sl.id AND sbh.status = 'overdue'
         )`
    );

    console.log(`[storageBillingCron] ✅ Done: ${generatedCount} billing record(s) generated, ${overdueResult.affectedRows || 0} marked overdue, ${lotOverdueResult.affectedRows || 0} lot(s) marked overdue.`);

  } catch (err) {
    console.error("[storageBillingCron] ❌ Error:", err.message || err);
  } finally {
    if (connection) {
      try { connection.release(); } catch (_) {}
    }
  }
});

console.log("[storageBillingCron] 📅 Scheduled — runs daily at 02:30");

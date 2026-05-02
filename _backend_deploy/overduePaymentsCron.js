/**
 * overduePaymentsCron — Relance automatique des impayés
 *
 * Runs every day at 09:00 server time.
 * Checks for:
 *  1. monthly_invoices with status='sent' and due_date < today → marks 'overdue' + notif
 *  2. job_transfers with billing_status='invoiced' and payment_due_date < today → marks 'overdue'
 *  3. Sends push notification to company boss for each overdue item
 *
 * Usage in index.js:
 *   require('./cron/overduePaymentsCron');
 */

const cron = require("node-cron");
const { connect } = require("../swiftDb");
const { insertNotification } = require("../utils/pushHelper");

// ── Run at 09:00 every day ──
cron.schedule("0 9 * * *", async () => {
  console.log("[overduePaymentsCron] ▶ Running overdue payments check…");

  let connection;
  try {
    connection = await connect();
    const today = new Date().toISOString().slice(0, 10);

    // ── 1. Monthly invoices: sent + due_date < today → overdue ──
    const [overdueInvoices] = await connection.execute(
      `SELECT mi.id, mi.invoice_number, mi.company_id, mi.total_amount, mi.currency, mi.due_date,
              mi.client_name, u.id AS boss_user_id
       FROM monthly_invoices mi
       LEFT JOIN users u ON u.company_id = mi.company_id AND u.role IN ('boss', 'admin')
       WHERE mi.status = 'sent'
         AND mi.due_date IS NOT NULL
         AND mi.due_date < ?
       ORDER BY mi.company_id, mi.due_date ASC`,
      [today]
    );

    const invoiceIds = overdueInvoices.map((r) => r.id);
    if (invoiceIds.length > 0) {
      await connection.execute(
        `UPDATE monthly_invoices SET status = 'overdue' WHERE id IN (${invoiceIds.map(() => "?").join(",")})`,
        invoiceIds
      );
      console.log(`[overduePaymentsCron] Marked ${invoiceIds.length} invoice(s) as overdue`);

      // Group by company to avoid duplicate notifs
      const notifiedCompanies = new Set();
      for (const row of overdueInvoices) {
        if (!row.boss_user_id || notifiedCompanies.has(row.company_id)) continue;
        notifiedCompanies.add(row.company_id);
        try {
          await insertNotification({
            connection,
            userId: row.boss_user_id,
            type: "payment_overdue",
            title: "Overdue Invoice",
            body: `Invoice ${row.invoice_number} for ${row.client_name || "client"} is overdue (due ${row.due_date}).`,
            data: { invoice_id: row.id, screen: "MonthlyInvoices" },
          });
        } catch (e) {
          console.warn("[overduePaymentsCron] Could not notify user:", e.message);
        }
      }
    }

    // ── 2. Job transfers: invoiced + payment_due_date < today → overdue ──
    const [overdueTransfers] = await connection.execute(
      `SELECT jt.id, jt.sender_company_id, jt.recipient_company_id,
              jt.pricing_amount, jt.currency, jt.payment_due_date,
              j.code AS job_code,
              u.id AS boss_user_id
       FROM job_transfers jt
       LEFT JOIN jobs j ON j.id = jt.job_id
       LEFT JOIN users u ON u.company_id = jt.sender_company_id AND u.role IN ('boss', 'admin')
       WHERE jt.billing_status = 'invoiced'
         AND jt.payment_due_date IS NOT NULL
         AND jt.payment_due_date < ?
       ORDER BY jt.sender_company_id, jt.payment_due_date ASC`,
      [today]
    );

    const transferIds = overdueTransfers.map((r) => r.id);
    if (transferIds.length > 0) {
      await connection.execute(
        `UPDATE job_transfers SET billing_status = 'overdue' WHERE id IN (${transferIds.map(() => "?").join(",")})`,
        transferIds
      );
      console.log(`[overduePaymentsCron] Marked ${transferIds.length} transfer(s) as overdue`);

      const notifiedTransferCompanies = new Set();
      for (const row of overdueTransfers) {
        if (!row.boss_user_id || notifiedTransferCompanies.has(row.sender_company_id)) continue;
        notifiedTransferCompanies.add(row.sender_company_id);
        try {
          await insertNotification({
            connection,
            userId: row.boss_user_id,
            type: "transfer_overdue",
            title: "Overdue Transfer Payment",
            body: `Job ${row.job_code || row.id} payment was due on ${row.payment_due_date} and has not been recorded.`,
            data: { transfer_id: row.id, screen: "InterContractorBilling" },
          });
        } catch (e) {
          console.warn("[overduePaymentsCron] Could not notify user:", e.message);
        }
      }
    }

    if (invoiceIds.length === 0 && transferIds.length === 0) {
      console.log("[overduePaymentsCron] No overdue items found.");
    }
  } catch (err) {
    console.error("[overduePaymentsCron] ❌ Error:", err);
  } finally {
    if (connection) connection.release();
  }
});

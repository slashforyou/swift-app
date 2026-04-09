/**
 * Monthly Invoice Cron — Auto-generates invoices on the 1st of each month
 * Requires: npm install node-cron
 *
 * Usage in index.js:
 *   require('./cron/monthlyInvoiceCron');
 */

const cron = require("node-cron");
const { connect } = require("../swiftDb");
const mailSender = require("../endPoints/functions/mailSender")();

// ── GCS for signed logo URLs ──
let bucket;
try {
  bucket = require("../utils/gcsClient").bucket;
} catch (e) {
  console.warn("[monthlyInvoiceCron] GCS not available, logos will be skipped");
}

async function getSignedLogoUrl(logoPath) {
  if (!logoPath || !bucket) return null;
  try {
    const file = bucket.file(logoPath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 3600 * 1000,
    });
    return url;
  } catch (err) {
    console.warn("[monthlyInvoiceCron] Could not sign logo URL:", err.message);
    return null;
  }
}

// Run at 02:00 on the 1st of each month
cron.schedule("0 2 1 * *", async () => {
  console.log("📋 [CRON] Monthly invoice generation started");

  let connection;
  try {
    connection = await connect();

    // Previous month
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth(); // getMonth() is 0-based
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const periodEnd = new Date(year, month, 0).toISOString().slice(0, 10);

    // Get all active companies
    const [companies] = await connection.execute(
      `SELECT DISTINCT c.id, c.name, COALESCE(c.trading_name, c.name) AS display_name,
              c.email, c.stripe_platform_fee_percentage,
              c.logo_url, c.primary_color
       FROM companies c
       INNER JOIN jobs j ON j.contractor_company_id = c.id
       WHERE j.status IN ('completed', 'finished')
         AND j.start_window_start >= ?
         AND j.start_window_start < DATE_ADD(?, INTERVAL 1 DAY)`,
      [periodStart, periodEnd]
    );

    console.log(
      `📋 [CRON] Found ${companies.length} companies with completed jobs in ${periodStart}`
    );

    let generated = 0;
    let skipped = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        // Check if already exists
        const [existing] = await connection.execute(
          `SELECT id FROM monthly_invoices
           WHERE company_id = ? AND period_start = ? AND status != 'cancelled'`,
          [company.id, periodStart]
        );
        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Fetch completed jobs
        const [jobs] = await connection.execute(
          `SELECT j.id, j.code, j.billing_mode, j.flat_rate_amount, j.hourly_rate,
                  j.start_window_start,
                  COALESCE(
                    (SELECT SUM(si.duration_ms) FROM job_segment_instances si
                     WHERE si.job_id = j.id AND si.is_billable = 1),
                    0
                  ) AS billable_ms
           FROM jobs j
           WHERE j.contractor_company_id = ?
             AND j.status IN ('completed', 'finished')
             AND j.start_window_start >= ?
             AND j.start_window_start < DATE_ADD(?, INTERVAL 1 DAY)
           ORDER BY j.start_window_start ASC`,
          [company.id, periodStart, periodEnd]
        );

        if (jobs.length === 0) {
          skipped++;
          continue;
        }

        // Calculate
        const commissionRate = parseFloat(
          company.stripe_platform_fee_percentage || 0
        );
        let subtotal = 0;
        const items = [];

        for (const job of jobs) {
          let amount = 0;
          let hoursWorked = null;

          if (job.billing_mode === "flat_rate") {
            amount = parseFloat(job.flat_rate_amount || 0);
          } else {
            const hours = Number(job.billable_ms || 0) / 3600000;
            const rate = parseFloat(job.hourly_rate || 0);
            amount = Math.round(hours * rate * 100) / 100;
            hoursWorked = Math.round(hours * 100) / 100;
          }
          subtotal += amount;

          items.push({
            job_id: job.id,
            job_code: job.code,
            job_date: job.start_window_start
              ? new Date(job.start_window_start).toISOString().slice(0, 10)
              : null,
            description: `Job ${job.code || "#" + job.id}`,
            billing_mode: job.billing_mode || "location_to_location",
            hours_worked: hoursWorked,
            hourly_rate: job.hourly_rate ? parseFloat(job.hourly_rate) : null,
            amount: Math.round(amount * 100) / 100,
          });
        }

        subtotal = Math.round(subtotal * 100) / 100;
        const commissionAmount =
          Math.round(subtotal * (commissionRate / 100) * 100) / 100;
        const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
        const totalAmount =
          Math.round((subtotal - commissionAmount + taxAmount) * 100) / 100;

        // Invoice number
        const invoiceNumber = await nextInvoiceNumber(connection, periodStart);
        const dueDate = new Date(year, month, 14)
          .toISOString()
          .slice(0, 10);

        const [result] = await connection.execute(
          `INSERT INTO monthly_invoices
            (invoice_number, company_id, period_start, period_end,
             total_jobs, subtotal, commission_rate, commission_amount,
             tax_amount, total_amount, currency, status, due_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AUD', 'draft', ?)`,
          [
            invoiceNumber,
            company.id,
            periodStart,
            periodEnd,
            items.length,
            subtotal,
            commissionRate,
            commissionAmount,
            taxAmount,
            totalAmount,
            dueDate,
          ]
        );
        const invoiceId = result.insertId;

        for (const item of items) {
          await connection.execute(
            `INSERT INTO monthly_invoice_items
              (invoice_id, job_id, job_code, job_date, description,
               billing_mode, hours_worked, hourly_rate, amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              invoiceId,
              item.job_id,
              item.job_code,
              item.job_date,
              item.description,
              item.billing_mode,
              item.hours_worked,
              item.hourly_rate,
              item.amount,
            ]
          );
        }

        // Send notification email if company has email
        if (company.email) {
          try {
            const logoUrl = await getSignedLogoUrl(company.logo_url);
            await mailSender.invoiceNotificationMail({
              to: company.email,
              companyName: company.display_name,
              invoiceNumber,
              periodLabel: `${months[month - 1]} ${year}`,
              totalAmount,
              totalJobs: items.length,
              dueDate: new Date(dueDate).toLocaleDateString("en-AU"),
              logoUrl,
              primaryColor: company.primary_color,
            });
          } catch (emailErr) {
            console.error(
              `📋 [CRON] Email failed for ${company.display_name}:`,
              emailErr.message
            );
          }
        }

        generated++;
        console.log(
          `📋 [CRON] Generated ${invoiceNumber} for ${company.display_name} — $${totalAmount}`
        );
      } catch (companyErr) {
        errors++;
        console.error(
          `📋 [CRON] Error for company ${company.id}:`,
          companyErr.message
        );
      }
    }

    console.log(
      `📋 [CRON] Monthly invoice generation complete: ${generated} generated, ${skipped} skipped, ${errors} errors`
    );
  } catch (error) {
    console.error("📋 [CRON] Fatal error:", error);
  } finally {
    if (connection) connection.release();
  }
});

// ── Helpers ──

async function nextInvoiceNumber(connection, periodStart) {
  const yymm =
    String(new Date(periodStart).getFullYear()) +
    String(new Date(periodStart).getMonth() + 1).padStart(2, "0");

  const [rows] = await connection.execute(
    `SELECT invoice_number FROM monthly_invoices
     WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
    [`INV-${yymm}-%`]
  );

  let seq = 1;
  if (rows.length > 0) {
    const parts = rows[0].invoice_number.split("-");
    seq = parseInt(parts[2]) + 1;
  }
  return `INV-${yymm}-${String(seq).padStart(5, "0")}`;
}

console.log("📋 [CRON] Monthly invoice cron job registered (1st of each month at 02:00)");

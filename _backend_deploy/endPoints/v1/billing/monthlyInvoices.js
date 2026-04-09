/**
 * Monthly Invoice endpoints
 * POST   /v1/billing/monthly-invoices/generate     — generate invoice for a period
 * GET    /v1/billing/monthly-invoices               — list invoices
 * GET    /v1/billing/monthly-invoices/:id           — get invoice with line items
 * PATCH  /v1/billing/monthly-invoices/:id           — update status
 */

const { connect } = require("../../../swiftDb");
const mailSender = require("../../functions/mailSender")();

// ── GCS for signed logo URLs ──
let bucket, gcsConfig;
try {
  bucket = require("../../../utils/gcsClient").bucket;
  gcsConfig = require("../../../config/gcs");
} catch (e) {
  console.warn("[monthlyInvoices] GCS not available, logos will be skipped");
}

async function getSignedLogoUrl(logoPath) {
  if (!logoPath || !bucket) return null;
  try {
    const file = bucket.file(logoPath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 3600 * 1000, // 7 days for email
    });
    return url;
  } catch (err) {
    console.warn("[monthlyInvoices] Could not sign logo URL:", err.message);
    return null;
  }
}

// ──────────────────────────────────────────────────
// Helper — generate invoice number
//   monthly:     INV-YYYYMM-XXXXX
//   weekly:      INV-W-YYYYMMDD-XXXXX
//   fortnightly: INV-F-YYYYMMDD-XXXXX
// ──────────────────────────────────────────────────
async function nextInvoiceNumber(connection, periodStart, periodType = "monthly") {
  let prefix;
  if (periodType === "weekly") {
    const d = new Date(periodStart);
    prefix = `INV-W-${d.toISOString().slice(0, 10).replace(/-/g, "")}`;
  } else if (periodType === "fortnightly") {
    const d = new Date(periodStart);
    prefix = `INV-F-${d.toISOString().slice(0, 10).replace(/-/g, "")}`;
  } else {
    const yymm =
      String(new Date(periodStart).getFullYear()) +
      String(new Date(periodStart).getMonth() + 1).padStart(2, "0");
    prefix = `INV-${yymm}`;
  }

  const [rows] = await connection.execute(
    `SELECT invoice_number FROM monthly_invoices
     WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}-%`]
  );

  let seq = 1;
  if (rows.length > 0) {
    const last = rows[0].invoice_number;
    const parts = last.split("-");
    seq = parseInt(parts[parts.length - 1]) + 1;
  }
  return `${prefix}-${String(seq).padStart(5, "0")}`;
}

// ──────────────────────────────────────────────────
// Helper — compute period bounds from period_type + date
// ──────────────────────────────────────────────────
function computePeriodBounds(periodType, year, month, weekStart) {
  if (periodType === "weekly") {
    // weekStart is an ISO date string (Monday)
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Sunday
    return {
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
    };
  }
  if (periodType === "fortnightly") {
    // weekStart is an ISO date string (Monday of first week)
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 13); // Sunday of second week
    return {
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
    };
  }
  // monthly (default)
  const y = parseInt(year);
  const m = parseInt(month);
  return {
    periodStart: `${y}-${String(m).padStart(2, "0")}-01`,
    periodEnd: new Date(y, m, 0).toISOString().slice(0, 10),
  };
}

// ──────────────────────────────────────────────────
// GET /v1/billing/monthly-invoices/clients
// Returns distinct clients with completed jobs for this company
// ──────────────────────────────────────────────────
const listInvoiceClients = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT DISTINCT cl.id,
              cl.first_name, cl.last_name,
              CONCAT(COALESCE(cl.first_name, ''), ' ', COALESCE(cl.last_name, '')) AS display_name,
              COUNT(j.id) AS total_jobs
       FROM jobs j
       JOIN clients cl ON cl.id = j.client_id
       WHERE j.contractor_company_id = ?
         AND j.status IN ('completed', 'finished')
         AND j.client_id IS NOT NULL
       GROUP BY cl.id, cl.first_name, cl.last_name
       ORDER BY total_jobs DESC, cl.first_name ASC`,
      [companyId]
    );

    return res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        display_name: (r.display_name || "").trim() || `Client #${r.id}`,
        total_jobs: r.total_jobs,
      })),
    });
  } catch (error) {
    console.error("❌ GET monthly-invoices/clients error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────
// POST /v1/billing/monthly-invoices/generate
// Body: { period_type, year, month, week_start, client_id }
//   monthly:     { period_type: 'monthly', year: 2026, month: 3 }
//   weekly:      { period_type: 'weekly', week_start: '2026-04-07' }
//   fortnightly: { period_type: 'fortnightly', week_start: '2026-03-31' }
//   client_id:   (optional) filter by specific client
// ──────────────────────────────────────────────────
const generateMonthlyInvoice = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    const { year, month, period_type = "monthly", week_start, client_id } = req.body;

    // Validate period_type
    const validPeriodTypes = ["monthly", "weekly", "fortnightly"];
    if (!validPeriodTypes.includes(period_type))
      return res
        .status(400)
        .json({ success: false, error: "Invalid period_type" });

    // Validate inputs based on period_type
    if (period_type === "monthly") {
      if (!year || !month)
        return res
          .status(400)
          .json({ success: false, error: "year and month required for monthly" });
      const y = parseInt(year);
      const m = parseInt(month);
      if (isNaN(y) || isNaN(m) || m < 1 || m > 12)
        return res
          .status(400)
          .json({ success: false, error: "Invalid year/month" });
    } else {
      if (!week_start)
        return res
          .status(400)
          .json({ success: false, error: "week_start required for weekly/fortnightly" });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(week_start) || isNaN(new Date(week_start).getTime()))
        return res
          .status(400)
          .json({ success: false, error: "Invalid week_start date (YYYY-MM-DD)" });
    }

    const { periodStart, periodEnd } = computePeriodBounds(
      period_type, year, month, week_start
    );

    connection = await connect();

    // Check if already generated for this company + period + type + client
    const dupQuery = client_id
      ? `SELECT id, invoice_number FROM monthly_invoices
         WHERE company_id = ? AND period_type = ? AND period_start = ? AND client_id = ? AND status != 'cancelled'`
      : `SELECT id, invoice_number FROM monthly_invoices
         WHERE company_id = ? AND period_type = ? AND period_start = ? AND client_id IS NULL AND status != 'cancelled'`;
    const dupParams = client_id
      ? [companyId, period_type, periodStart, parseInt(client_id)]
      : [companyId, period_type, periodStart];

    const [existing] = await connection.execute(dupQuery, dupParams);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Invoice already exists for this period",
        invoice_number: existing[0].invoice_number,
        invoice_id: existing[0].id,
      });
    }

    // ── Fetch completed jobs for this company in the period ──
    let jobQuery = `SELECT j.id, j.code, j.status, j.billing_mode,
              j.flat_rate_amount, j.hourly_rate,
              j.start_window_start, j.client_id,
              j.contractor_company_id,
              cl.first_name AS client_first_name,
              cl.last_name AS client_last_name,
              COALESCE(
                (SELECT SUM(si.duration_ms) FROM job_segment_instances si
                 WHERE si.job_id = j.id AND si.is_billable = 1),
                0
              ) AS billable_ms
       FROM jobs j
       LEFT JOIN clients cl ON cl.id = j.client_id
       WHERE j.contractor_company_id = ?
         AND j.status IN ('completed', 'finished')
         AND j.start_window_start >= ?
         AND j.start_window_start < DATE_ADD(?, INTERVAL 1 DAY)`;
    const jobParams = [companyId, periodStart, periodEnd];

    if (client_id) {
      jobQuery += ` AND j.client_id = ?`;
      jobParams.push(parseInt(client_id));
    }

    jobQuery += ` ORDER BY j.start_window_start ASC`;

    const [jobs] = await connection.execute(jobQuery, jobParams);

    if (jobs.length === 0) {
      return res.status(200).json({
        success: false,
        empty: true,
        error: "No completed jobs found for this period",
      });
    }

    // ── Get company commission rate ──
    const [companyRows] = await connection.execute(
      `SELECT stripe_platform_fee_percentage FROM companies WHERE id = ?`,
      [companyId]
    );
    const commissionRate = companyRows.length > 0
      ? parseFloat(companyRows[0].stripe_platform_fee_percentage || 0)
      : 0;

    // ── Calculate line items ──
    const items = [];
    let subtotal = 0;

    for (const job of jobs) {
      let amount = 0;
      let hoursWorked = null;
      const billableMs = Number(job.billable_ms || 0);

      if (job.billing_mode === "flat_rate") {
        amount = parseFloat(job.flat_rate_amount || 0);
      } else {
        // hourly-based billing
        const hours = billableMs / 3600000;
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
        description: `Job ${job.code || "#" + job.id}${
          job.client_first_name
            ? ` — ${job.client_first_name} ${job.client_last_name || ""}`.trim()
            : ""
        }`,
        billing_mode: job.billing_mode || "location_to_location",
        hours_worked: hoursWorked,
        hourly_rate: job.hourly_rate ? parseFloat(job.hourly_rate) : null,
        amount: Math.round(amount * 100) / 100,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const commissionAmount = Math.round(subtotal * (commissionRate / 100) * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.1 * 100) / 100; // 10% GST (Australia)
    const totalAmount = Math.round((subtotal - commissionAmount + taxAmount) * 100) / 100;

    // ── Generate invoice number & insert ──
    const invoiceNumber = await nextInvoiceNumber(connection, periodStart, period_type);
    // Due date: 14 days after period end
    const dueD = new Date(periodEnd);
    dueD.setDate(dueD.getDate() + 14);
    const dueDate = dueD.toISOString().slice(0, 10);

    // Resolve client name for the record
    const clientName = client_id && jobs.length > 0 && jobs[0].client_first_name
      ? `${jobs[0].client_first_name} ${jobs[0].client_last_name || ""}`.trim()
      : null;

    const [result] = await connection.execute(
      `INSERT INTO monthly_invoices
        (invoice_number, company_id, client_id, client_name, period_type, period_start, period_end,
         total_jobs, subtotal, commission_rate, commission_amount,
         tax_amount, total_amount, currency, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AUD', 'draft', ?)`,
      [
        invoiceNumber,
        companyId,
        client_id ? parseInt(client_id) : null,
        clientName,
        period_type,
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

    // ── Insert line items ──
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

    return res.status(201).json({
      success: true,
      data: {
        id: invoiceId,
        invoice_number: invoiceNumber,
        period_type,
        period_start: periodStart,
        period_end: periodEnd,
        client_id: client_id ? parseInt(client_id) : null,
        client_name: clientName,
        total_jobs: items.length,
        subtotal,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        due_date: dueDate,
        status: "draft",
      },
    });
  } catch (error) {
    console.error("❌ POST monthly-invoices/generate error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────
// GET /v1/billing/monthly-invoices
// ──────────────────────────────────────────────────
const listMonthlyInvoices = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    const { status, year, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let where = "WHERE mi.company_id = ?";
    const params = [companyId];

    if (status) {
      where += " AND mi.status = ?";
      params.push(status);
    }
    if (year) {
      where += " AND YEAR(mi.period_start) = ?";
      params.push(parseInt(year));
    }

    connection = await connect();

    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM monthly_invoices mi ${where}`,
      params
    );

    const [rows] = await connection.execute(
      `SELECT mi.*, c.name AS company_name,
              COALESCE(c.trading_name, c.name) AS company_display_name,
              c.logo_url AS company_logo_url,
              c.primary_color AS company_primary_color
       FROM monthly_invoices mi
       LEFT JOIN companies c ON c.id = mi.company_id
       ${where}
       ORDER BY mi.period_start DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ GET monthly-invoices error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────
// GET /v1/billing/monthly-invoices/:id
// ──────────────────────────────────────────────────
const getMonthlyInvoice = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const invoiceId = parseInt(req.params.id);
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(invoiceId))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT mi.*, c.name AS company_name,
              COALESCE(c.trading_name, c.name) AS company_display_name,
              c.email AS company_email, c.phone AS company_phone,
              c.abn AS company_abn,
              c.logo_url AS company_logo_url,
              c.primary_color AS company_primary_color
       FROM monthly_invoices mi
       LEFT JOIN companies c ON c.id = mi.company_id
       WHERE mi.id = ? AND mi.company_id = ?`,
      [invoiceId, companyId]
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });

    // Get line items
    const [items] = await connection.execute(
      `SELECT * FROM monthly_invoice_items WHERE invoice_id = ? ORDER BY job_date ASC`,
      [invoiceId]
    );

    // Sign logo URL for frontend display
    const signedLogoUrl = await getSignedLogoUrl(rows[0].company_logo_url);

    return res.json({
      success: true,
      data: {
        ...rows[0],
        company_logo_url: signedLogoUrl,
        items,
      },
    });
  } catch (error) {
    console.error("❌ GET monthly-invoices/:id error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────
// PATCH /v1/billing/monthly-invoices/:id
// Body: { status, notes }
// ──────────────────────────────────────────────────
const updateMonthlyInvoice = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const invoiceId = parseInt(req.params.id);
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(invoiceId))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    connection = await connect();

    // Verify ownership
    const [rows] = await connection.execute(
      `SELECT * FROM monthly_invoices WHERE id = ? AND company_id = ?`,
      [invoiceId, companyId]
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });

    const { status, notes } = req.body;
    const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];

    const updates = [];
    const values = [];

    if (status) {
      if (!validStatuses.includes(status))
        return res
          .status(400)
          .json({ success: false, error: "Invalid status" });
      updates.push("status = ?");
      values.push(status);

      if (status === "sent" && !rows[0].sent_at) {
        updates.push("sent_at = NOW()");
      }
      if (status === "paid" && !rows[0].paid_at) {
        updates.push("paid_at = NOW()");
      }
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes || null);
    }

    if (updates.length === 0)
      return res
        .status(400)
        .json({ success: false, error: "No fields to update" });

    values.push(invoiceId);
    await connection.execute(
      `UPDATE monthly_invoices SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Return updated
    const [updated] = await connection.execute(
      `SELECT * FROM monthly_invoices WHERE id = ?`,
      [invoiceId]
    );

    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("❌ PATCH monthly-invoices/:id error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────
// POST /v1/billing/monthly-invoices/:id/send
// Sends the invoice via email to the company
// ──────────────────────────────────────────────────
const sendMonthlyInvoice = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const invoiceId = parseInt(req.params.id);
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(invoiceId))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    connection = await connect();

    // Fetch invoice + company
    const [invoiceRows] = await connection.execute(
      `SELECT mi.*, c.name AS company_name,
              COALESCE(c.trading_name, c.name) AS company_display_name,
              c.email AS company_email, c.abn AS company_abn,
              c.logo_url AS company_logo_url,
              c.primary_color AS company_primary_color
       FROM monthly_invoices mi
       LEFT JOIN companies c ON c.id = mi.company_id
       WHERE mi.id = ? AND mi.company_id = ?`,
      [invoiceId, companyId]
    );
    if (invoiceRows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });

    const invoice = invoiceRows[0];
    if (!invoice.company_email)
      return res
        .status(400)
        .json({ success: false, error: "No company email on file" });

    // Fetch items
    const [items] = await connection.execute(
      `SELECT * FROM monthly_invoice_items WHERE invoice_id = ? ORDER BY job_date ASC`,
      [invoiceId]
    );

    // ── Send via centralized mailSender ──
    const logoUrl = await getSignedLogoUrl(invoice.company_logo_url);
    await mailSender.invoiceDetailMail({
      to: invoice.company_email,
      invoice,
      items,
      logoUrl,
    });

    // Mark as sent
    await connection.execute(
      `UPDATE monthly_invoices SET status = 'sent', sent_at = NOW() WHERE id = ?`,
      [invoiceId]
    );

    return res.json({
      success: true,
      message: `Invoice sent to ${invoice.company_email}`,
    });
  } catch (error) {
    console.error("❌ POST monthly-invoices/:id/send error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────
// Helper — format period label
// ──────────────────────────────────────────────────
function formatPeriod(periodStart) {
  const d = new Date(periodStart);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

module.exports = {
  generateMonthlyInvoice,
  listMonthlyInvoices,
  listInvoiceClients,
  getMonthlyInvoice,
  updateMonthlyInvoice,
  sendMonthlyInvoice,
};

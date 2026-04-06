/**
 * Payment Issues endpoints
 *
 * POST /v1/jobs/:jobId/payment-issues   → Report a payment issue (staff terrain)
 * GET  /v1/jobs/:jobId/payment-issues   → List issues for a job (boss only)
 * PATCH /v1/payment-issues/:id/resolve  → Resolve an issue (boss only)
 */

const { connect } = require("../../swiftDb");

const VALID_TYPES = [
  "wrong_amount",
  "wrong_billing_mode",
  "missing_hours",
  "double_charge",
  "client_dispute",
  "other",
];

// ── Inline push helper (same pattern as counterProposal.js) ──────────────
async function sendPushToCompany(
  connection,
  companyId,
  title,
  body,
  data = {},
) {
  try {
    const [tokenRows] = await connection.execute(
      `SELECT ut.push_token
       FROM user_push_tokens ut
       JOIN users u ON u.id = ut.user_id
       WHERE u.company_id = ? AND ut.push_token IS NOT NULL AND ut.is_active = 1`,
      [companyId],
    );
    if (!tokenRows.length) return;

    const messages = tokenRows.map((r) => ({
      to: r.push_token,
      title,
      body,
      data: { ...data, screen: "JobsBilling" },
      sound: "default",
    }));

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn("[sendPushToCompany] Non-blocking error:", err.message);
  }
}

// ── POST /v1/jobs/:jobId/payment-issues ──────────────────────────────────
const reportPaymentIssue = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid job ID" });

    const { issue_type, description } = req.body || {};

    if (!issue_type || !VALID_TYPES.includes(issue_type))
      return res
        .status(400)
        .json({ success: false, error: "Invalid issue type" });

    if (description && description.length > 2000)
      return res
        .status(400)
        .json({ success: false, error: "Description too long (max 2000)" });

    connection = await connect();

    // Verify job exists and user has access (same company)
    const [jobRows] = await connection.execute(
      `SELECT j.id, j.code, j.contractee_company_id, j.contractor_company_id
       FROM jobs j
       JOIN users u ON u.id = ?
       WHERE j.id = ? AND (j.contractee_company_id = u.company_id OR j.contractor_company_id = u.company_id)`,
      [userId, jobId],
    );

    if (!jobRows.length)
      return res
        .status(404)
        .json({ success: false, error: "Job not found or access denied" });

    const job = jobRows[0];

    // Insert the issue
    const [result] = await connection.execute(
      `INSERT INTO job_payment_issues (job_id, reported_by, issue_type, description)
       VALUES (?, ?, ?, ?)`,
      [jobId, userId, issue_type, (description || "").trim() || null],
    );

    // Get reporter name for notification
    const [userRows] = await connection.execute(
      "SELECT first_name, last_name FROM users WHERE id = ?",
      [userId],
    );
    const reporterName = userRows[0]
      ? `${userRows[0].first_name} ${userRows[0].last_name}`.trim()
      : "An employee";

    // Notify boss (contractee company)
    sendPushToCompany(
      connection,
      job.contractee_company_id,
      "⚠️ Payment Issue Reported",
      `${reporterName} reported a payment issue on job ${job.code || jobId}`,
      { type: "payment_issue", job_id: jobId },
    ).catch(() => {});

    return res.json({
      success: true,
      issueId: result.insertId,
    });
  } catch (err) {
    console.error("[ PaymentIssue ] Report error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET /v1/jobs/:jobId/payment-issues ───────────────────────────────────
const getPaymentIssues = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid job ID" });

    connection = await connect();

    // Verify access
    const [access] = await connection.execute(
      `SELECT 1 FROM jobs j
       JOIN users u ON u.id = ?
       WHERE j.id = ? AND (j.contractee_company_id = u.company_id OR j.contractor_company_id = u.company_id)`,
      [userId, jobId],
    );
    if (!access.length)
      return res
        .status(404)
        .json({ success: false, error: "Job not found or access denied" });

    const [issues] = await connection.execute(
      `SELECT pi.*, u.first_name AS reporter_first_name, u.last_name AS reporter_last_name
       FROM job_payment_issues pi
       JOIN users u ON u.id = pi.reported_by
       WHERE pi.job_id = ?
       ORDER BY pi.created_at DESC`,
      [jobId],
    );

    return res.json({ success: true, issues });
  } catch (err) {
    console.error("[ PaymentIssue ] List error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ── PATCH /v1/payment-issues/:id/resolve ─────────────────────────────────
const resolvePaymentIssue = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    // Only boss / admin can resolve
    if (role !== "boss" && role !== "admin")
      return res
        .status(403)
        .json({ success: false, error: "Only the boss can resolve issues" });

    const issueId = parseInt(req.params.id);
    if (isNaN(issueId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid issue ID" });

    const { status, resolution_note } = req.body || {};
    if (!status || !["resolved", "rejected"].includes(status))
      return res
        .status(400)
        .json({ success: false, error: "Status must be 'resolved' or 'rejected'" });

    if (resolution_note && resolution_note.length > 2000)
      return res
        .status(400)
        .json({ success: false, error: "Note too long (max 2000)" });

    connection = await connect();

    // Verify the issue belongs to this boss's company
    const [issueRows] = await connection.execute(
      `SELECT pi.id, pi.reported_by, j.contractee_company_id
       FROM job_payment_issues pi
       JOIN jobs j ON j.id = pi.job_id
       JOIN users u ON u.id = ?
       WHERE pi.id = ? AND j.contractee_company_id = u.company_id`,
      [userId, issueId],
    );

    if (!issueRows.length)
      return res
        .status(404)
        .json({ success: false, error: "Issue not found or access denied" });

    await connection.execute(
      `UPDATE job_payment_issues
       SET status = ?, resolution_note = ?, resolved_by = ?, resolved_at = NOW()
       WHERE id = ?`,
      [status, (resolution_note || "").trim() || null, userId, issueId],
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("[ PaymentIssue ] Resolve error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { reportPaymentIssue, getPaymentIssues, resolvePaymentIssue };

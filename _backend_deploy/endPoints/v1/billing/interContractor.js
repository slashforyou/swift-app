/**
 * Inter-contractor billing endpoints
 * GET    /v1/billing/inter-contractor        — list transfers with billing info
 * PATCH  /v1/billing/inter-contractor/:id    — update billing status
 * GET    /v1/billing/inter-contractor/stats  — billing summary stats
 */

const { connect } = require("../../../swiftDb");

// ──────────────────────────────────────────────────────────
// GET /v1/billing/inter-contractor
// Returns all accepted transfers for current company (as sender or recipient)
// ──────────────────────────────────────────────────────────
const listInterContractorBilling = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    const { status, direction, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    connection = await connect();

    let where = `WHERE (jt.sender_company_id = ? OR jt.recipient_company_id = ?)
                   AND jt.status = 'accepted'`;
    const params = [companyId, companyId];

    // Filter by billing status
    if (status && ['not_billed', 'invoiced', 'paid', 'overdue'].includes(status)) {
      where += ` AND jt.billing_status = ?`;
      params.push(status);
    }

    // Filter by direction (payable = I sent/own the job, receivable = I'm contractor doing work)
    if (direction === 'payable') {
      where = where.replace(
        '(jt.sender_company_id = ? OR jt.recipient_company_id = ?)',
        'jt.sender_company_id = ?'
      );
      params.splice(1, 1); // Remove second companyId
    } else if (direction === 'receivable') {
      where = where.replace(
        '(jt.sender_company_id = ? OR jt.recipient_company_id = ?)',
        'jt.recipient_company_id = ?'
      );
      params.splice(0, 1); // Remove first companyId
    }

    // Count total
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM job_transfers jt ${where}`,
      params
    );
    const total = countResult[0].total;

    // Fetch with joins
    const [rows] = await connection.execute(
      `SELECT jt.id, jt.job_id, jt.sender_company_id, jt.recipient_company_id,
              jt.delegated_role, jt.delegated_role_label,
              jt.pricing_type, jt.pricing_amount, jt.currency,
              jt.billing_status, jt.invoiced_at, jt.paid_at,
              jt.payment_due_date, jt.payment_reference, jt.payment_notes,
              jt.created_at, jt.responded_at,
              j.code AS job_code, j.status AS job_status,
              j.start_window_start AS job_date,
              sc.name AS sender_company_name,
              COALESCE(sc.trading_name, sc.name) AS sender_display_name,
              rc.name AS recipient_company_name,
              COALESCE(rc.trading_name, rc.name) AS recipient_display_name,
              CASE WHEN jt.sender_company_id = ? THEN 'payable' ELSE 'receivable' END AS direction
       FROM job_transfers jt
       LEFT JOIN jobs j ON j.id = jt.job_id
       LEFT JOIN companies sc ON sc.id = jt.sender_company_id
       LEFT JOIN companies rc ON rc.id = jt.recipient_company_id
       ${where}
       ORDER BY j.start_window_start DESC, jt.created_at DESC
       LIMIT ? OFFSET ?`,
      [companyId, ...params, parseInt(limit), offset]
    );

    return res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    console.error("❌ GET /v1/billing/inter-contractor error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────────────
// GET /v1/billing/inter-contractor/stats
// Aggregated billing stats for current company
// ──────────────────────────────────────────────────────────
const getBillingStats = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    connection = await connect();

    // Payable stats (I'm sender = I owe money to contractors)
    const [payable] = await connection.execute(
      `SELECT
         COUNT(*) as total_count,
         SUM(pricing_amount) as total_amount,
         SUM(CASE WHEN billing_status = 'not_billed' THEN pricing_amount ELSE 0 END) as not_billed_amount,
         SUM(CASE WHEN billing_status = 'not_billed' THEN 1 ELSE 0 END) as not_billed_count,
         SUM(CASE WHEN billing_status = 'invoiced' THEN pricing_amount ELSE 0 END) as invoiced_amount,
         SUM(CASE WHEN billing_status = 'invoiced' THEN 1 ELSE 0 END) as invoiced_count,
         SUM(CASE WHEN billing_status = 'paid' THEN pricing_amount ELSE 0 END) as paid_amount,
         SUM(CASE WHEN billing_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
         SUM(CASE WHEN billing_status = 'overdue' THEN pricing_amount ELSE 0 END) as overdue_amount,
         SUM(CASE WHEN billing_status = 'overdue' THEN 1 ELSE 0 END) as overdue_count
       FROM job_transfers
       WHERE sender_company_id = ? AND status = 'accepted'`,
      [companyId]
    );

    // Receivable stats (I'm recipient = they owe me money)
    const [receivable] = await connection.execute(
      `SELECT
         COUNT(*) as total_count,
         SUM(pricing_amount) as total_amount,
         SUM(CASE WHEN billing_status = 'not_billed' THEN pricing_amount ELSE 0 END) as not_billed_amount,
         SUM(CASE WHEN billing_status = 'not_billed' THEN 1 ELSE 0 END) as not_billed_count,
         SUM(CASE WHEN billing_status = 'invoiced' THEN pricing_amount ELSE 0 END) as invoiced_amount,
         SUM(CASE WHEN billing_status = 'invoiced' THEN 1 ELSE 0 END) as invoiced_count,
         SUM(CASE WHEN billing_status = 'paid' THEN pricing_amount ELSE 0 END) as paid_amount,
         SUM(CASE WHEN billing_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
         SUM(CASE WHEN billing_status = 'overdue' THEN pricing_amount ELSE 0 END) as overdue_amount,
         SUM(CASE WHEN billing_status = 'overdue' THEN 1 ELSE 0 END) as overdue_count
       FROM job_transfers
       WHERE recipient_company_id = ? AND status = 'accepted'`,
      [companyId]
    );

    return res.json({
      success: true,
      data: {
        payable: payable[0],
        receivable: receivable[0]
      }
    });
  } catch (error) {
    console.error("❌ GET /v1/billing/inter-contractor/stats error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────────────
// PATCH /v1/billing/inter-contractor/:id
// Update billing status of a transfer
// ──────────────────────────────────────────────────────────
const updateBillingStatus = async (req, res) => {
  const transferId = parseInt(req.params.id);
  if (isNaN(transferId))
    return res.status(400).json({ success: false, error: "Invalid transfer ID" });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    connection = await connect();

    // Verify transfer exists and user has access
    const [rows] = await connection.execute(
      `SELECT * FROM job_transfers WHERE id = ? AND status = 'accepted'
       AND (sender_company_id = ? OR recipient_company_id = ?)`,
      [transferId, companyId, companyId]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, error: "Transfer not found" });

    const transfer = rows[0];
    const { billing_status, payment_due_date, payment_reference, payment_notes } = req.body;

    // Validate billing_status
    const validStatuses = ['not_billed', 'invoiced', 'paid', 'overdue'];
    if (billing_status && !validStatuses.includes(billing_status))
      return res.status(400).json({ success: false, error: "Invalid billing_status" });

    // Build update
    const updates = [];
    const values = [];

    if (billing_status) {
      updates.push('billing_status = ?');
      values.push(billing_status);

      if (billing_status === 'invoiced' && !transfer.invoiced_at) {
        updates.push('invoiced_at = NOW()');
      }
      if (billing_status === 'paid' && !transfer.paid_at) {
        updates.push('paid_at = NOW()');
      }
    }
    if (payment_due_date !== undefined) {
      updates.push('payment_due_date = ?');
      values.push(payment_due_date || null);
    }
    if (payment_reference !== undefined) {
      updates.push('payment_reference = ?');
      values.push(payment_reference || null);
    }
    if (payment_notes !== undefined) {
      updates.push('payment_notes = ?');
      values.push(payment_notes || null);
    }

    if (updates.length === 0)
      return res.status(400).json({ success: false, error: "No fields to update" });

    values.push(transferId);
    await connection.execute(
      `UPDATE job_transfers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated transfer
    const [updated] = await connection.execute(
      `SELECT jt.id, jt.billing_status, jt.invoiced_at, jt.paid_at,
              jt.payment_due_date, jt.payment_reference, jt.payment_notes
       FROM job_transfers jt WHERE jt.id = ?`,
      [transferId]
    );

    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("❌ PATCH /v1/billing/inter-contractor/:id error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  listInterContractorBilling,
  getBillingStats,
  updateBillingStatus
};

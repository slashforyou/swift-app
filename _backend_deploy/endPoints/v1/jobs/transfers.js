/**
 * CRUD /swift-app/v1/jobs/:jobId/transfers
 *
 * POST   /jobs/:jobId/transfers                          — créer une délégation
 * GET    /jobs/:jobId/transfers                          — liste les délégations du job
 * PATCH  /jobs/:jobId/transfers/:transferId/respond      — accepter / refuser
 * DELETE /jobs/:jobId/transfers/:transferId              — annuler (sender)
 */

const { connect } = require("../../../swiftDb");

// ──────────────────────────────────────────────────────────
// Résoudre job ID depuis code ou numérique
// ──────────────────────────────────────────────────────────
async function resolveJobId(connection, jobParam) {
  const numId = parseInt(jobParam);
  if (!isNaN(numId)) return numId;
  const [rows] = await connection.execute(
    "SELECT id FROM jobs WHERE code = ?",
    [jobParam],
  );
  return rows[0]?.id || null;
}

// ──────────────────────────────────────────────────────────
// POST /jobs/:jobId/transfers
// ──────────────────────────────────────────────────────────
const createTransferEndpoint = async (req, res) => {
  console.log("[ POST /jobs/:jobId/transfers ]", {
    jobId: req.params.jobId,
    body: req.body,
  });
  let connection;
  try {
    const senderCompanyId = req.user?.company_id;
    const userId = req.user?.id;
    if (!senderCompanyId)
      return res.status(403).json({ success: false, error: "No company" });

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);
    if (!jobId)
      return res.status(404).json({ success: false, error: "Job not found" });

    // Vérifier que l'user est bien owner du job
    const [jobRows] = await connection.execute(
      "SELECT id, contractee_company_id, status FROM jobs WHERE id = ?",
      [jobId],
    );
    if (jobRows.length === 0)
      return res.status(404).json({ success: false, error: "Job not found" });

    const job = jobRows[0];
    if (job.contractee_company_id !== senderCompanyId) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Only the job owner can create a transfer",
        });
    }
    if (["completed", "cancelled"].includes(job.status)) {
      return res
        .status(400)
        .json({ success: false, error: `Cannot transfer a ${job.status} job` });
    }

    // Vérifier qu'il n'y a pas déjà une délégation pending
    const [existing] = await connection.execute(
      "SELECT id FROM job_transfers WHERE job_id = ? AND status = 'pending'",
      [jobId],
    );
    if (existing.length > 0) {
      return res
        .status(409)
        .json({
          success: false,
          error: "A pending transfer already exists for this job",
        });
    }

    const {
      recipient_type = "company",
      recipient_company_id,
      recipient_contractor_id,
      delegated_role = "full_job",
      delegated_role_label,
      pricing_type = "flat",
      pricing_amount,
      message,
    } = req.body;

    if (!recipient_company_id && !recipient_contractor_id) {
      return res
        .status(400)
        .json({
          success: false,
          error: "recipient_company_id or recipient_contractor_id is required",
        });
    }
    if (!pricing_amount || parseFloat(pricing_amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "pricing_amount must be > 0" });
    }

    const [result] = await connection.execute(
      `INSERT INTO job_transfers
         (job_id, sender_company_id, recipient_type, recipient_company_id, recipient_contractor_id,
          delegated_role, delegated_role_label, pricing_type, pricing_amount, message, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        senderCompanyId,
        recipient_type,
        recipient_company_id || null,
        recipient_contractor_id || null,
        delegated_role,
        delegated_role_label || null,
        pricing_type,
        parseFloat(pricing_amount),
        message || null,
        userId,
      ],
    );

    const [transfer] = await connection.execute(
      `SELECT jt.*,
              sc.name AS sender_company_name,
              rc.name AS recipient_company_name
       FROM job_transfers jt
       LEFT JOIN companies sc ON sc.id = jt.sender_company_id
       LEFT JOIN companies rc ON rc.id = jt.recipient_company_id
       WHERE jt.id = ?`,
      [result.insertId],
    );

    return res.status(201).json({ success: true, data: transfer[0] });
  } catch (error) {
    console.error("❌ POST /jobs/:jobId/transfers error:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────────────
// GET /jobs/:jobId/transfers
// ──────────────────────────────────────────────────────────
const listTransfersEndpoint = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);
    if (!jobId)
      return res.status(404).json({ success: false, error: "Job not found" });

    // Seuls sender ou recipient peuvent voir les transferts
    const [rows] = await connection.execute(
      `SELECT jt.*,
              sc.name AS sender_company_name,
              rc.name AS recipient_company_name
       FROM job_transfers jt
       LEFT JOIN companies sc ON sc.id = jt.sender_company_id
       LEFT JOIN companies rc ON rc.id = jt.recipient_company_id
       WHERE jt.job_id = ?
         AND (jt.sender_company_id = ? OR jt.recipient_company_id = ?)
       ORDER BY jt.created_at DESC`,
      [jobId, companyId, companyId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ GET /jobs/:jobId/transfers error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────────────
// PATCH /jobs/:jobId/transfers/:transferId/respond
// ──────────────────────────────────────────────────────────
const respondToTransferEndpoint = async (req, res) => {
  const transferId = parseInt(req.params.transferId);
  console.log("[ PATCH /jobs/:jobId/transfers/:transferId/respond ]", {
    transferId,
    body: req.body,
  });
  let connection;
  try {
    const companyId = req.user?.company_id;
    const userId = req.user?.id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(transferId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid transfer ID" });

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);

    const [rows] = await connection.execute(
      `SELECT * FROM job_transfers WHERE id = ? AND job_id = ?`,
      [transferId, jobId],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Transfer not found" });

    const transfer = rows[0];

    // Seul le recipient peut répondre
    if (transfer.recipient_company_id !== companyId) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Only the recipient can respond to this transfer",
        });
    }
    if (transfer.status !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          error: `Transfer is already ${transfer.status}`,
        });
    }

    const { action, decline_reason } = req.body;
    if (!["accept", "decline"].includes(action)) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'action must be "accept" or "decline"',
        });
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    await connection.execute(
      `UPDATE job_transfers
       SET status = ?, decline_reason = ?, responded_at = NOW(), responded_by_user_id = ?
       WHERE id = ?`,
      [newStatus, decline_reason || null, userId, transferId],
    );

    // Si accepté → mettre à jour le job (contractor_company_id)
    if (newStatus === "accepted") {
      await connection.execute(
        `UPDATE jobs SET contractor_company_id = ?, assignment_status = 'accepted', assigned_at = NOW()
         WHERE id = ?`,
        [companyId, jobId],
      );
    }

    return res.json({ success: true, message: `Transfer ${newStatus}` });
  } catch (error) {
    console.error("❌ PATCH /jobs/:jobId/transfers/:id/respond error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────────────────
// DELETE /jobs/:jobId/transfers/:transferId  (cancel by sender)
// ──────────────────────────────────────────────────────────
const cancelTransferEndpoint = async (req, res) => {
  const transferId = parseInt(req.params.transferId);
  console.log("[ DELETE /jobs/:jobId/transfers/:transferId ]", { transferId });
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(transferId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid transfer ID" });

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);

    const [rows] = await connection.execute(
      "SELECT * FROM job_transfers WHERE id = ? AND job_id = ?",
      [transferId, jobId],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Transfer not found" });

    const transfer = rows[0];
    if (transfer.sender_company_id !== companyId) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Only the sender can cancel this transfer",
        });
    }
    if (transfer.status !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          error: `Cannot cancel a ${transfer.status} transfer`,
        });
    }

    await connection.execute(
      "UPDATE job_transfers SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?",
      [transferId],
    );

    return res.json({ success: true, message: "Transfer cancelled" });
  } catch (error) {
    console.error("❌ DELETE /jobs/:jobId/transfers/:id error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createTransferEndpoint,
  listTransfersEndpoint,
  respondToTransferEndpoint,
  cancelTransferEndpoint,
};

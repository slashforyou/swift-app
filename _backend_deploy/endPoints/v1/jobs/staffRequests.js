/**
 * POST /v1/jobs/:jobId/staff-requests
 *
 * Enregistre une demande de personnel (offsiders sans véhicule) pour un job.
 * Stocke la demande dans la table staff_requests et notifie les gestionnaires.
 *
 * Body: { offsider_count: number, note?: string }
 */

const { connect } = require("../../../swiftDb");

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
      data: { ...data, screen: "Calendar" },
      sound: "default",
    }));
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn("[staffRequests] Push non-blocking error:", err.message);
  }
}

async function resolveJobId(connection, jobParam) {
  const numId = parseInt(jobParam);
  if (!isNaN(numId)) return numId;
  const [rows] = await connection.execute(
    "SELECT id FROM jobs WHERE code = ?",
    [jobParam],
  );
  return rows[0]?.id || null;
}

const staffRequestsEndpoint = async (req, res) => {
  console.log("[ POST /jobs/:jobId/staff-requests ]", {
    jobId: req.params.jobId,
    body: req.body,
  });

  let connection;
  try {
    const userId = req.user?.id;
    const companyId = req.user?.company_id;
    if (!userId || !companyId) {
      return res
        .status(403)
        .json({ success: false, error: "Authentication required" });
    }

    const { offsider_count, note } = req.body;
    if (!offsider_count || offsider_count < 1 || offsider_count > 20) {
      return res.status(400).json({
        success: false,
        error: "offsider_count must be between 1 and 20",
      });
    }

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);
    if (!jobId) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Vérifier que le job appartient à la company
    const [jobRows] = await connection.execute(
      `SELECT j.id, j.code, j.contractee_company_id, j.contractor_company_id, j.status
       FROM jobs j WHERE j.id = ?`,
      [jobId],
    );
    const job = jobRows[0];
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const isAllowed =
      job.contractee_company_id === companyId ||
      job.contractor_company_id === companyId;
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to request staff for this job",
      });
    }

    // Insérer la demande de personnel
    const [insertResult] = await connection.execute(
      `INSERT INTO staff_requests
         (job_id, company_id, requested_by_user_id, offsider_count, note, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [jobId, companyId, userId, offsider_count, note || null],
    );

    const requestId = insertResult.insertId;

    // Notifier les gestionnaires de la company
    await sendPushToCompany(
      connection,
      companyId,
      "Demande de personnel",
      `${offsider_count} offsider${offsider_count > 1 ? "s" : ""} demandé${offsider_count > 1 ? "s" : ""} pour le job ${job.code}`,
      { job_id: jobId, job_code: job.code, request_id: requestId },
    );

    console.log(
      `✅ Staff request created: id=${requestId}, job=${jobId}, count=${offsider_count}`,
    );
    return res.status(201).json({
      success: true,
      staff_request: {
        id: requestId,
        job_id: jobId,
        job_code: job.code,
        offsider_count,
        note: note || null,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("❌ [staffRequests] Error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
};

module.exports = { staffRequestsEndpoint };

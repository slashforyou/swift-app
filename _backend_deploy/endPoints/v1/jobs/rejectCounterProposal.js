/**
 * POST /v1/jobs/:jobId/reject_counter_proposal
 *
 * Permet au créateur du job (contractee) de rejeter une contre-proposition.
 * Remet assignment_status → "pending" (le contractor peut re-proposer).
 * Notifie le contractor.
 *
 * Body (optionnel): { reason?: string }
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
    console.warn(
      "[rejectCounterProposal] Push non-blocking error:",
      err.message,
    );
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

const rejectCounterProposalEndpoint = async (req, res) => {
  console.log("[ POST /jobs/:jobId/reject_counter_proposal ]", {
    jobId: req.params.jobId,
    body: req.body,
  });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    const { reason } = req.body || {};

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);
    if (!jobId)
      return res.status(404).json({ success: false, error: "Job not found" });

    const [jobRows] = await connection.execute(
      `SELECT j.id, j.code, j.contractee_company_id, j.contractor_company_id, j.assignment_status,
              c.name AS contractor_name
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.contractor_company_id
       WHERE j.id = ?`,
      [jobId],
    );
    if (!jobRows.length)
      return res.status(404).json({ success: false, error: "Job not found" });

    const job = jobRows[0];

    // Seul le contractee peut rejeter une contre-proposition
    if (job.contractee_company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error:
          "Only the contractee (job creator) can reject a counter proposal",
      });
    }

    if (job.assignment_status !== "negotiating") {
      return res.status(400).json({
        success: false,
        error: `Job is not in negotiation (current status: "${job.assignment_status}")`,
      });
    }

    // Remettre assignment_status → pending + effacer les champs counter_proposal
    await connection.execute(
      `UPDATE jobs
       SET assignment_status = 'pending',
           counter_proposed_start = NULL,
           counter_proposed_end   = NULL,
           counter_proposal_note  = NULL,
           counter_proposed_at    = NULL,
           counter_proposed_by    = NULL
       WHERE id = ?`,
      [jobId],
    );

    // Mettre à jour le statut dans job_counter_proposals si la table existe
    try {
      await connection.execute(
        `UPDATE job_counter_proposals SET status = 'declined', responded_at = NOW()
         WHERE job_id = ? AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [jobId],
      );
    } catch {
      // Table peut ne pas exister — non bloquant
    }

    // Notifier le contractor
    if (job.contractor_company_id) {
      const [contracteeRows] = await connection.execute(
        "SELECT name FROM companies WHERE id = ?",
        [companyId],
      );
      const contracteeName = contracteeRows[0]?.name || "Le donneur d'ordre";
      const jobCode = job.code || jobId;
      const reasonText = reason ? ` : "${reason.substring(0, 80)}"` : "";

      await sendPushToCompany(
        connection,
        job.contractor_company_id,
        "❌ Proposition rejetée",
        `${contracteeName} a refusé votre proposition pour le job #${jobCode}${reasonText}`,
        {
          screen: "JobDetails",
          job_id: String(jobId),
          job_code: String(jobCode),
          type: "counter_proposal_rejected",
          reason: reason || null,
        },
      );
    }

    return res.json({
      success: true,
      message: "Counter proposal rejected — job back to pending",
      data: { assignment_status: "pending" },
    });
  } catch (error) {
    console.error("❌ POST /jobs/:jobId/reject_counter_proposal error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { rejectCounterProposalEndpoint };

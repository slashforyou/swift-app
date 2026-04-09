/**
 * POST /v1/jobs/:jobId/reject_counter_proposal
 *
 * Permet au créateur du job (contractee) de rejeter une contre-proposition.
 * Remet assignment_status → "pending" (le contractor peut re-proposer).
 * Notifie le contractor (push + DB).
 *
 * Body (optionnel): { reason?: string }
 */

const { connect } = require("../../../swiftDb");
const { notifyCompany } = require("../../../utils/pushHelper");

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

    // ── Push + DB notification au contractor ──
    if (job.contractor_company_id) {
      try {
        const [contracteeRows] = await connection.execute(
          "SELECT name FROM companies WHERE id = ?",
          [companyId],
        );
        const contracteeName = contracteeRows[0]?.name || "Le donneur d'ordre";
        const jobCode = job.code || jobId;
        const reasonText = reason ? ` : "${reason.substring(0, 80)}"` : "";

        await notifyCompany(
          connection,
          job.contractor_company_id,
          'job_update',
          '❌ Proposition rejetée',
          `${contracteeName} a refusé votre proposition pour le job #${jobCode}${reasonText}`,
          {
            jobId: job.id,
            priority: 'high',
            pushData: {
              type: 'counter_proposal_rejected',
              job_id: String(jobId),
              job_code: String(jobCode),
              screen: 'Calendar',
              reason: reason || null,
            },
            metadata: { reason: reason || null },
          }
        );
      } catch (pushErr) {
        console.warn('[rejectCounterProposal] Push failed (non-blocking):', pushErr.message);
      }
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

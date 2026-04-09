/**
 * POST /v1/jobs/:jobId/counter_proposal
 *
 * Permet au prestataire (contractor) de proposer un créneau alternatif,
 * un type de prix (horaire/forfait), un véhicule et des employés.
 * Met assignment_status → "negotiating".
 * Notifie le contractee (Entreprise A) — push + DB.
 *
 * Body: {
 *   proposed_start: ISO,
 *   proposed_end: ISO,
 *   note?: string,
 *   proposed_price?: number,
 *   price_type?: 'hourly' | 'flat' | 'daily',
 *   vehicle_id?: string,
 *   staff?: Array<{ user_id: string, role: 'driver' | 'offsider' | 'packer' }>
 * }
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

// ─────────────────────────────────────────────────────────────────────────────

const counterProposalEndpoint = async (req, res) => {
  console.log("[ POST /jobs/:jobId/counter_proposal ]", {
    jobId: req.params.jobId,
    body: req.body,
  });

  let connection;
  try {
    const companyId = req.user?.company_id;
    const userId = req.user?.id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    const {
      proposed_start,
      proposed_end,
      note,
      proposed_price,
      price_type,
      vehicle_id,
      staff,
    } = req.body;

    if (!proposed_start || !proposed_end) {
      return res.status(400).json({
        success: false,
        error: "proposed_start and proposed_end are required",
      });
    }

    // Validate price_type
    const validPriceTypes = ["hourly", "flat", "daily"];
    const resolvedPriceType =
      price_type && validPriceTypes.includes(price_type) ? price_type : null;

    connection = await connect();
    const jobId = await resolveJobId(connection, req.params.jobId);
    if (!jobId)
      return res.status(404).json({ success: false, error: "Job not found" });

    // Vérifier que l'appelant est bien le contractor du job
    const [jobRows] = await connection.execute(
      `SELECT j.id, j.code, j.contractor_company_id, j.contractee_company_id, j.assignment_status,
              c.name AS contractee_name
       FROM jobs j
       LEFT JOIN companies c ON c.id = j.contractee_company_id
       WHERE j.id = ?`,
      [jobId],
    );
    if (!jobRows.length)
      return res.status(404).json({ success: false, error: "Job not found" });

    const job = jobRows[0];

    if (job.contractor_company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: "Only the assigned contractor can submit a counter proposal",
      });
    }

    if (!["pending", "negotiating"].includes(job.assignment_status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot counter-propose on a job with status "${job.assignment_status}"`,
      });
    }

    // Créer l'entrée dans job_counter_proposals (si la table existe)
    let proposalId = null;
    try {
      const [insertResult] = await connection.execute(
        `INSERT INTO job_counter_proposals
           (job_id, contractor_company_id, proposed_start, proposed_end, note,
            proposed_price, price_type, vehicle_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          jobId,
          companyId,
          proposed_start,
          proposed_end,
          note || null,
          proposed_price != null ? Number(proposed_price) : null,
          resolvedPriceType,
          vehicle_id || null,
        ],
      );
      proposalId = insertResult.insertId;

      // Insert proposed staff if provided
      if (proposalId && Array.isArray(staff) && staff.length > 0) {
        for (const s of staff) {
          if (!s.user_id) continue;
          try {
            await connection.execute(
              `INSERT INTO job_counter_proposal_staff (proposal_id, user_id, role, created_at)
               VALUES (?, ?, ?, NOW())`,
              [proposalId, s.user_id, s.role || "driver"],
            );
          } catch (staffErr) {
            console.warn(
              "[counterProposal] staff insert error (non-blocking):",
              staffErr.message,
            );
          }
        }
      }
    } catch (tableErr) {
      console.warn(
        "[counterProposal] job_counter_proposals table not found:",
        tableErr.message,
      );
    }

    // Mettre à jour assignment_status → negotiating
    await connection.execute(
      `UPDATE jobs
       SET assignment_status        = 'negotiating',
           counter_proposed_start   = ?,
           counter_proposed_end     = ?,
           counter_proposal_note    = ?,
           counter_proposed_at      = NOW(),
           counter_proposed_by      = ?
       WHERE id = ?`,
      [proposed_start, proposed_end, note || null, userId, jobId],
    );

    // ── Push + DB notification au contractee ──
    if (job.contractee_company_id) {
      try {
        const [contractorRows] = await connection.execute(
          "SELECT name FROM companies WHERE id = ?",
          [companyId],
        );
        const contractorName = contractorRows[0]?.name || "Le prestataire";
        const jobCode = job.code || jobId;

        await notifyCompany(
          connection,
          job.contractee_company_id,
          'job_update',
          '🔄 Contre-proposition reçue',
          `${contractorName} propose un autre créneau pour le job #${jobCode}`,
          {
            jobId: job.id,
            priority: 'high',
            pushData: {
              type: 'counter_proposal_received',
              job_id: String(jobId),
              job_code: String(jobCode),
              screen: 'Calendar',
            },
          }
        );
      } catch (pushErr) {
        console.warn('[counterProposal] Push failed (non-blocking):', pushErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Counter proposal submitted",
      data: { proposal_id: proposalId, assignment_status: "negotiating" },
    });
  } catch (error) {
    console.error("❌ POST /jobs/:jobId/counter_proposal error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { counterProposalEndpoint };

/**
 * getJobActionsById.js
 * GET /swift-app/v1/jobs/:id/actions
 *
 * Retourne l'historique chronologique de toutes les actions réalisées sur un job.
 * Le paramètre :id peut être un ID numérique ou un code (ex: TST-MAR-007).
 *
 * Permission levels fournis dans la réponse :
 *   system     — action automatique serveur
 *   admin      — admin de la plateforme
 *   manager    — gestionnaire de la company contractante (créateur du job)
 *   employee   — employé
 *   contractor — prestataire (company assignée)
 *   client     — client final
 */
const { connect } = require("../../swiftDb");

const ACTION_LABELS = {
  job_created: { fr: "Job créé", severity: "info" },
  job_updated: { fr: "Job modifié", severity: "info" },
  job_accepted: { fr: "Job accepté", severity: "success" },
  job_declined: { fr: "Job refusé", severity: "warning" },
  job_started: { fr: "Job démarré", severity: "success" },
  job_paused: { fr: "Job mis en pause", severity: "warning" },
  job_resumed: { fr: "Job repris", severity: "info" },
  job_completed: { fr: "Job terminé", severity: "success" },
  job_archived: { fr: "Job archivé", severity: "info" },
  job_deleted: { fr: "Job supprimé", severity: "critical" },
  job_step_advanced: { fr: "Étape avancée", severity: "info" },
  transfer_created: { fr: "Transfert créé", severity: "info" },
  transfer_accepted: { fr: "Transfert accepté", severity: "success" },
  transfer_declined: { fr: "Transfert refusé", severity: "warning" },
  transfer_cancelled: { fr: "Transfert annulé", severity: "warning" },
  counter_proposal_created: {
    fr: "Contre-proposition soumise",
    severity: "info",
  },
  counter_proposal_accepted: {
    fr: "Contre-proposition acceptée",
    severity: "success",
  },
  counter_proposal_rejected: {
    fr: "Contre-proposition refusée",
    severity: "warning",
  },
  crew_assigned: { fr: "Équipier assigné", severity: "info" },
  crew_removed: { fr: "Équipier retiré", severity: "warning" },
  truck_assigned: { fr: "Véhicule assigné", severity: "info" },
  truck_removed: { fr: "Véhicule retiré", severity: "warning" },
  assignment_created: { fr: "Ressource assignée", severity: "info" },
  assignment_removed: { fr: "Ressource retirée", severity: "warning" },
  assignment_updated: { fr: "Ressource mise à jour", severity: "info" },
};

/**
 * GET /swift-app/v1/jobs/:id/actions
 * Query params: ?limit=50&offset=0&action_type=xxx
 */
const getJobActionsEndpoint = async (req, res) => {
  console.log("[ GET /jobs/:id/actions ]", req.params.id);
  let connection;
  try {
    const jobRef = req.params.id;
    const isNumeric = /^\d+$/.test(jobRef);
    const limit = Math.min(parseInt(req.query.limit || "100"), 200);
    const offset = parseInt(req.query.offset || "0");
    const filterType = req.query.action_type || null;

    // company_id UNIQUEMENT depuis le JWT — jamais du client
    const userCompanyId = req.user?.company_id;
    if (!userCompanyId) {
      return res.status(403).json({ success: false, error: "Access denied — missing company context" });
    }

    connection = await connect();

    // Resolve job
    let jobRow;
    if (isNumeric) {
      const [rows] = await connection.execute(
        "SELECT id, code, status, contractor_company_id, contractee_company_id FROM jobs WHERE id = ?",
        [parseInt(jobRef)],
      );
      jobRow = rows[0];
    } else {
      const [rows] = await connection.execute(
        "SELECT id, code, status, contractor_company_id, contractee_company_id FROM jobs WHERE code = ?",
        [jobRef],
      );
      jobRow = rows[0];
    }

    if (!jobRow) {
      return res
        .status(404)
        .json({ success: false, error: "Job not found", ref: jobRef });
    }

    // Vérifier que l'utilisateur appartient à l'une des deux companies du job
    const isContractee = parseInt(jobRow.contractee_company_id) === parseInt(userCompanyId);
    const isContractor = parseInt(jobRow.contractor_company_id) === parseInt(userCompanyId);
    if (!isContractee && !isContractor) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const jobId = jobRow.id;

    // Build query
    let whereExtras = "";
    const params = [jobId];
    if (filterType) {
      whereExtras += " AND ja.action_type = ?";
      params.push(filterType);
    }
    params.push(limit, offset);

    const [actions] = await connection.execute(
      `SELECT
         ja.id,
         ja.action_type,
         ja.actor_role,
         ja.permission_level,
         ja.old_status,
         ja.new_status,
         ja.metadata,
         ja.created_at,
         u.id      AS user_id,
         u.first_name,
         u.last_name,
         u.email,
         c.id      AS company_id,
         c.name    AS company_name
       FROM job_actions ja
       LEFT JOIN users     u ON u.id = ja.performed_by_user_id
       LEFT JOIN companies c ON c.id = ja.performed_by_company_id
       WHERE ja.job_id = ?${whereExtras}
       ORDER BY ja.created_at ASC
       LIMIT ? OFFSET ?`,
      params,
    );

    // Count total
    const countParams = [jobId];
    if (filterType) countParams.push(filterType);
    const [countRows] = await connection.execute(
      `SELECT COUNT(*) AS total FROM job_actions WHERE job_id = ?${filterType ? " AND action_type = ?" : ""}`,
      countParams,
    );

    const formatted = actions.map((a) => {
      const label = ACTION_LABELS[a.action_type] || {
        fr: a.action_type,
        severity: "info",
      };
      const metadata = a.metadata
        ? typeof a.metadata === "string"
          ? JSON.parse(a.metadata)
          : a.metadata
        : null;
      return {
        id: a.id,
        action_type: a.action_type,
        label: label.fr,
        severity: label.severity,
        actor_role: a.actor_role,
        permission_level: a.permission_level,
        old_status: a.old_status,
        new_status: a.new_status,
        metadata,
        created_at: a.created_at,
        performed_by: a.user_id
          ? {
              id: a.user_id,
              name: `${a.first_name || ""} ${a.last_name || ""}`.trim(),
              email: a.email || null,
            }
          : null,
        company: a.company_id
          ? {
              id: a.company_id,
              name: a.company_name,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      job: {
        id: jobRow.id,
        code: jobRow.code,
        status: jobRow.status,
        contractor_company_id: jobRow.contractor_company_id,
        contractee_company_id: jobRow.contractee_company_id,
      },
      actions: formatted,
      pagination: {
        total: countRows[0].total,
        limit,
        offset,
        has_more: offset + limit < countRows[0].total,
      },
    });
  } catch (error) {
    console.error("❌ GET /jobs/:id/actions error:", error);
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

module.exports = { getJobActionsEndpoint };

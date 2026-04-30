/**
 * getJobTimelineById.js — REWRITTEN
 * GET /swift-app/v1/job/:id/timeline
 *
 * Returns a chronological timeline sourced from job_actions table.
 * Falls back to legacy stub if table doesn't exist yet.
 */
const { connect } = require("../../swiftDb");

const ACTION_LABELS = {
  job_created: { fr: "Job créé", icon: "📝", severity: "info" },
  job_updated: { fr: "Job modifié", icon: "✏️", severity: "info" },
  job_accepted: { fr: "Job accepté", icon: "✅", severity: "success" },
  job_declined: { fr: "Job refusé", icon: "❌", severity: "warning" },
  job_started: { fr: "Job démarré", icon: "▶️", severity: "success" },
  job_paused: { fr: "Job mis en pause", icon: "⏸️", severity: "warning" },
  job_resumed: { fr: "Job repris", icon: "▶️", severity: "info" },
  job_completed: { fr: "Job terminé", icon: "🏁", severity: "success" },
  job_archived: { fr: "Job archivé", icon: "📦", severity: "info" },
  job_deleted: { fr: "Job supprimé", icon: "🗑️", severity: "critical" },
  job_step_advanced: { fr: "Étape avancée", icon: "➡️", severity: "info" },
  transfer_created: { fr: "Transfert envoyé", icon: "📤", severity: "info" },
  transfer_accepted: {
    fr: "Transfert accepté",
    icon: "🤝",
    severity: "success",
  },
  transfer_declined: {
    fr: "Transfert refusé",
    icon: "↩️",
    severity: "warning",
  },
  transfer_cancelled: {
    fr: "Transfert annulé",
    icon: "🚫",
    severity: "warning",
  },
  counter_proposal_created: {
    fr: "Contre-proposition soumise",
    icon: "💬",
    severity: "info",
  },
  counter_proposal_accepted: {
    fr: "Contre-proposition acceptée",
    icon: "✅",
    severity: "success",
  },
  counter_proposal_rejected: {
    fr: "Contre-proposition refusée",
    icon: "❌",
    severity: "warning",
  },
  crew_assigned: { fr: "Équipier assigné", icon: "👤", severity: "info" },
  crew_removed: { fr: "Équipier retiré", icon: "🔴", severity: "warning" },
  truck_assigned: { fr: "Véhicule assigné", icon: "🚛", severity: "info" },
  truck_removed: { fr: "Véhicule retiré", icon: "🔴", severity: "warning" },
  assignment_created: {
    fr: "Ressource assignée",
    icon: "🔗",
    severity: "info",
  },
  assignment_removed: {
    fr: "Ressource retirée",
    icon: "🔴",
    severity: "warning",
  },
};

const getJobTimelineByIdEndpoint = async (req, res) => {
  console.log("[ Get Job Timeline by ID ]", req.params.id);
  let connection;
  try {
    const jobRef = req.params.id;
    const isNumeric = /^\d+$/.test(jobRef);

    // company_id UNIQUEMENT depuis le JWT — jamais du client
    const userCompanyId = req.user?.company_id;
    if (!userCompanyId) {
      return res.status(403).json({ success: false, error: "Access denied — missing company context" });
    }

    connection = await connect();

    // Resolve job (inclure contractor/contractee pour vérification d'accès)
    let jobRows;
    if (isNumeric) {
      [jobRows] = await connection.execute(
        "SELECT id, code, status, created_at, updated_at, contractee_company_id, contractor_company_id FROM jobs WHERE id = ?",
        [parseInt(jobRef)],
      );
    } else {
      [jobRows] = await connection.execute(
        "SELECT id, code, status, created_at, updated_at, contractee_company_id, contractor_company_id FROM jobs WHERE code = ?",
        [jobRef],
      );
    }

    if (!jobRows || jobRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Job not found", ref: jobRef });
    }

    const job = jobRows[0];

    // Vérifier que l'utilisateur appartient à l'une des deux companies du job
    const isContractee = parseInt(job.contractee_company_id) === parseInt(userCompanyId);
    const isContractor = parseInt(job.contractor_company_id) === parseInt(userCompanyId);
    if (!isContractee && !isContractor) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const jobId = job.id;

    // Try to fetch from job_actions table
    let timeline = [];
    try {
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
           u.first_name,
           u.last_name,
           c.name AS company_name
         FROM job_actions ja
         LEFT JOIN users u       ON u.id = ja.performed_by_user_id
         LEFT JOIN companies c   ON c.id = ja.performed_by_company_id
         WHERE ja.job_id = ?
         ORDER BY ja.created_at ASC`,
        [jobId],
      );

      timeline = actions.map((a) => {
        const label = ACTION_LABELS[a.action_type] || {
          fr: a.action_type,
          icon: "📋",
          severity: "info",
        };
        const metadata = a.metadata
          ? typeof a.metadata === "string"
            ? JSON.parse(a.metadata)
            : a.metadata
          : null;
        const actor = a.first_name
          ? `${a.first_name} ${a.last_name || ""}`.trim()
          : a.company_name || "Système";

        return {
          id: a.id,
          action: a.action_type,
          label: label.fr,
          icon: label.icon,
          severity: label.severity,
          timestamp: a.created_at,
          user: actor,
          actor_role: a.actor_role,
          permission_level: a.permission_level,
          old_status: a.old_status,
          new_status: a.new_status,
          metadata,
          // Legacy compat
          status: a.new_status || a.old_status || null,
          details: `${label.fr} par ${actor}`,
        };
      });
    } catch (histError) {
      // Fallback: job_actions table not yet ready — return basic stub
      console.warn(
        "[getJobTimeline] job_actions unavailable, using stub:",
        histError.message,
      );
      timeline = [
        {
          action: "job_created",
          label: "Job créé",
          icon: "📝",
          severity: "info",
          timestamp: job.created_at,
          user: "Système",
          actor_role: "system",
          permission_level: "system",
          details: `Job ${job.code} créé`,
          status: "pending",
        },
        {
          action: "job_updated",
          label: `Statut: ${job.status}`,
          icon: "✏️",
          severity: "info",
          timestamp: job.updated_at,
          user: "Système",
          actor_role: "system",
          permission_level: "system",
          details: `Job status: ${job.status}`,
          status: job.status,
        },
      ];
    }

    return res.json({
      success: true,
      message: "Job timeline retrieved successfully",
      data: {
        jobCode: job.code,
        jobId: jobId,
        jobStatus: job.status,
        timelineCount: timeline.length,
        timeline,
      },
    });
  } catch (error) {
    console.error("❌ Error getting job timeline:", error);
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

module.exports = { getJobTimelineByIdEndpoint };

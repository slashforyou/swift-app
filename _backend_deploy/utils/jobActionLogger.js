/**
 * utils/jobActionLogger.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fire-and-forget logger for job lifecycle actions.
 * Inserts a row into the job_actions table without blocking the caller.
 *
 * Required by:
 *   endPoints/v1/createJob.js
 *   endPoints/v1/acceptJob.js
 *   endPoints/v1/startJobById.js
 *   endPoints/v1/completeJobById.js
 *   endPoints/v1/archiveJobById.js
 *   endPoints/v1/deleteJobById.js
 *   endPoints/v1/assignCrewToJobById.js
 *   endPoints/v1/removeCrewFromJobById.js
 *   endPoints/v1/assignTrucksToJobById.js
 *   endPoints/v1/removeTruckFromJobById.js
 *   endPoints/v1/jobs/transfers.js
 *   endPoints/v1/jobs/counterProposal.js
 *   endPoints/v1/jobs/acceptCounterProposal.js
 *   endPoints/v1/jobs/rejectCounterProposal.js
 *
 * Usage (fire and forget — no await):
 *   logJobAction({ jobId, actionType, userId, companyId, actorRole,
 *                  permissionLevel, oldStatus, newStatus, metadata });
 */

const { connect } = require("../swiftDb");

/**
 * @param {Object} opts
 * @param {number|string} opts.jobId
 * @param {string}        opts.actionType   e.g. 'job_created', 'job_started', ...
 * @param {number|null}   [opts.userId]     performed_by_user_id
 * @param {number|null}   [opts.companyId]  performed_by_company_id
 * @param {string|null}   [opts.actorRole]  'owner' | 'manager' | 'employee' | 'contractor' | 'client'
 * @param {string|null}   [opts.permissionLevel]
 * @param {string|null}   [opts.oldStatus]
 * @param {string|null}   [opts.newStatus]
 * @param {Object|null}   [opts.metadata]   arbitrary JSON
 */
function logJobAction({
  jobId,
  actionType,
  userId = null,
  companyId = null,
  actorRole = null,
  permissionLevel = null,
  oldStatus = null,
  newStatus = null,
  metadata = null,
} = {}) {
  // Validate minimum required fields — silently skip if missing
  if (!jobId || !actionType) {
    console.warn(
      "[jobActionLogger] Missing jobId or actionType — skipping log",
    );
    return;
  }

  const jid = parseInt(jobId, 10) || null;
  const uid = userId ? parseInt(userId, 10) || null : null;
  const cid = companyId ? parseInt(companyId, 10) || null : null;
  const meta = metadata ? JSON.stringify(metadata) : null;

  // Async INSERT — never throws, never blocks caller
  (async () => {
    let conn;
    try {
      conn = await connect();
      await conn.execute(
        `INSERT INTO job_actions
           (job_id, action_type, actor_role, permission_level,
            old_status, new_status, metadata,
            performed_by_user_id, performed_by_company_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          jid,
          actionType,
          actorRole,
          permissionLevel,
          oldStatus,
          newStatus,
          meta,
          uid,
          cid,
        ],
      );
    } catch (err) {
      // Log to console but NEVER propagate — this is logging, not critical path
      console.error(
        "[jobActionLogger] Failed to insert action:",
        actionType,
        "— error:",
        err.message,
      );
    } finally {
      if (conn) {
        try {
          conn.release ? conn.release() : conn.end();
        } catch (_) {}
      }
    }
  })();
}

module.exports = { logJobAction };

/**
 * GET /v1/jobs/pending-assignments
 *
 * Returns all jobs with assignment_status = 'pending' for the authenticated
 * user's contractor company. Used on the home screen to display pending
 * assignment notifications.
 */

const { connect } = require("../../../swiftDb");

const pendingAssignmentsEndpoint = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const userId = req.user?.id;

    if (!companyId && !userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    connection = await connect();

    let rows;
    if (companyId) {
      // Manager: fetch pending assignments for the whole company
      [rows] = await connection.execute(
        `SELECT
           j.id, j.code, j.status,
           j.start_window_start, j.start_window_end, j.timezone,
           j.assignment_status,
           j.contractee_company_id,
           c_contractee.name AS contractee_company_name,
           jtransfers.requested_drivers,
           jtransfers.requested_offsiders,
           jtransfers.pricing_amount,
           jtransfers.pricing_type,
           jtransfers.hour_counting_type,
           jtransfers.delegated_role,
           jtransfers.delegated_role_label,
           jtransfers.vehicle_label,
           jtransfers.message AS transfer_message,
           cl.first_name AS client_first_name,
           cl.last_name  AS client_last_name
         FROM jobs j
         LEFT JOIN companies c_contractee ON c_contractee.id = j.contractee_company_id
         LEFT JOIN job_transfers jtransfers
           ON jtransfers.job_id = j.id
          AND jtransfers.status IN ('pending', 'accepted', 'negotiating')
         LEFT JOIN clients cl ON cl.id = j.client_id
         WHERE j.contractor_company_id = ?
           AND j.assignment_status = 'pending'
         ORDER BY j.start_window_start ASC
         LIMIT 50`,
        [companyId],
      );
    } else {
      // Individual user: pending jobs assigned via job_users
      [rows] = await connection.execute(
        `SELECT
           j.id, j.code, j.status,
           j.start_window_start, j.start_window_end, j.timezone,
           j.assignment_status,
           j.contractee_company_id,
           c_contractee.name AS contractee_company_name,
           jtransfers.requested_drivers,
           jtransfers.requested_offsiders,
           jtransfers.pricing_amount,
           jtransfers.pricing_type,
           jtransfers.hour_counting_type,
           jtransfers.delegated_role,
           jtransfers.delegated_role_label,
           jtransfers.vehicle_label,
           jtransfers.message AS transfer_message,
           cl.first_name AS client_first_name,
           cl.last_name  AS client_last_name
         FROM jobs j
         JOIN job_users ju ON ju.job_id = j.id AND ju.user_id = ?
         LEFT JOIN companies c_contractee ON c_contractee.id = j.contractee_company_id
         LEFT JOIN job_transfers jtransfers
           ON jtransfers.job_id = j.id
          AND jtransfers.status IN ('pending', 'accepted', 'negotiating')
         LEFT JOIN clients cl ON cl.id = j.client_id
         WHERE j.assignment_status = 'pending'
         ORDER BY j.start_window_start ASC
         LIMIT 50`,
        [userId],
      );
    }

    const jobs = rows.map((row) => ({
      id: String(row.id),
      code: row.code || null,
      status: row.status,
      assignment_status: row.assignment_status,
      start_window_start: row.start_window_start,
      start_window_end: row.start_window_end,
      contractee_company_id: row.contractee_company_id,
      contractee_company_name: row.contractee_company_name || null,
      client_name:
        `${row.client_first_name || ""} ${row.client_last_name || ""}`.trim() ||
        null,
      requested_drivers:
        row.requested_drivers != null ? row.requested_drivers : null,
      requested_offsiders:
        row.requested_offsiders != null ? row.requested_offsiders : null,
      pricing_amount:
        row.pricing_amount != null ? Number(row.pricing_amount) : null,
      pricing_type: row.pricing_type || null,
      hour_counting_type: row.hour_counting_type || null,
      delegated_role: row.delegated_role || null,
      delegated_role_label: row.delegated_role_label || null,
      vehicle_label: row.vehicle_label || null,
      transfer_message: row.transfer_message || null,
    }));

    return res.json({ success: true, data: { jobs, count: jobs.length } });
  } catch (error) {
    console.error("❌ GET /v1/jobs/pending-assignments error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { pendingAssignmentsEndpoint };

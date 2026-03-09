/**
 * GET /swift-app/v1/transfers/incoming
 *
 * Liste toutes les délégations reçues (pending) pour la company connectée.
 * Inclut les infos du job et de l'expéditeur.
 */

const { connect } = require("../../../swiftDb");

const getIncomingTransfersEndpoint = async (req, res) => {
  console.log("[ GET /transfers/incoming ]", {
    companyId: req.user?.company_id,
  });
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId)
      return res.status(403).json({ success: false, error: "No company" });

    const { status = "pending" } = req.query;

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT
         jt.id, jt.job_id, jt.status, jt.delegated_role, jt.delegated_role_label,
         jt.pricing_type, jt.pricing_amount, jt.currency, jt.message,
         jt.created_at, jt.responded_at, jt.decline_reason,
         j.code AS job_code, j.status AS job_status,
         j.start_window_start, j.end_window_start,
         sc.name AS sender_company_name, sc.company_code AS sender_company_code
       FROM job_transfers jt
       JOIN jobs j ON j.id = jt.job_id
       JOIN companies sc ON sc.id = jt.sender_company_id
       WHERE jt.recipient_company_id = ?
         AND jt.status = ?
       ORDER BY jt.created_at DESC`,
      [companyId, status],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ GET /transfers/incoming error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getIncomingTransfersEndpoint };

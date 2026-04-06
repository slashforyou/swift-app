/**
 * POST /v1/admin/company/plan
 * Admin-only endpoint to change a company's plan.
 * Protected by ADMIN_SECRET header (not just JWT).
 *
 * Body: { company_id: number, plan_id: string }
 * Header: x-admin-secret: <ADMIN_SECRET from .env>
 */

const { connect } = require("../../swiftDb");

const setCompanyPlanEndpoint = async (req, res) => {
  let connection;
  try {
    // Verify admin secret
    const adminSecret = process.env.ADMIN_SECRET;
    const providedSecret = req.headers["x-admin-secret"];

    if (!adminSecret || providedSecret !== adminSecret) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const { company_id, plan_id } = req.body || {};

    if (!company_id || !plan_id) {
      return res
        .status(400)
        .json({ success: false, error: "company_id and plan_id are required" });
    }

    connection = await connect();

    // Verify plan exists
    const [plans] = await connection.execute(
      "SELECT id, platform_fee_percentage FROM plans WHERE id = ?",
      [plan_id],
    );

    if (!plans.length) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    const plan = plans[0];

    // Update company's plan and sync fee
    await connection.execute(
      `UPDATE companies
       SET plan_type = ?, stripe_platform_fee_percentage = ?
       WHERE id = ?`,
      [plan_id, plan.platform_fee_percentage, company_id],
    );

    console.log(`[ADMIN] Company ${company_id} plan changed to ${plan_id}`);

    return res.json({
      success: true,
      data: {
        company_id,
        plan_id,
        platform_fee_percentage: parseFloat(plan.platform_fee_percentage),
      },
    });
  } catch (error) {
    console.error("❌ POST /v1/admin/company/plan error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { setCompanyPlanEndpoint };

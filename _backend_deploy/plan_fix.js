/**
 * GET /v1/company/plan
 * Returns the current company's plan details and usage limits.
 * Requires authentication.
 */

const { connect } = require("../../../swiftDb");

const getCompanyPlanEndpoint = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    connection = await connect();

    // Get company's current plan with plan details
    const [rows] = await connection.execute(
      `SELECT c.plan_type, c.stripe_platform_fee_percentage,
              p.label, p.display_name, p.price_monthly, p.included_users,
              p.extra_user_price, p.max_jobs_created, p.max_jobs_accepted,
              p.platform_fee_percentage AS plan_fee, p.commission_rate,
              p.min_fee_aud, p.features
       FROM companies c
       LEFT JOIN plans p ON c.plan_type = p.id
       WHERE c.id = ?`,
      [companyId],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    const company = rows[0];

    // Count current users in company
    const [userCount] = await connection.execute(
      `SELECT COUNT(*) AS total FROM users WHERE company_id = ?`,
      [companyId],
    );

    // Count jobs created this month by this company
    const [jobCount] = await connection.execute(
      `SELECT COUNT(*) AS total FROM jobs
       WHERE company_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
      [companyId],
    );

    const plan = {
      id: company.plan_type,
      label: company.label || company.plan_type,
      display_name: company.display_name || company.plan_type,
      price_monthly: parseFloat(company.price_monthly || 0),
      platform_fee_percentage: parseFloat(
        company.plan_fee || company.stripe_platform_fee_percentage || 2.5,
      ),
      commission_rate: parseFloat(company.commission_rate || 0.025),
      min_fee_aud: parseFloat(company.min_fee_aud || 0),
      included_users: company.included_users || 5,
      extra_user_price: parseFloat(company.extra_user_price || 5),
      max_jobs_created:
        company.max_jobs_created != null ? company.max_jobs_created : 30,
      max_jobs_accepted:
        company.max_jobs_accepted != null ? company.max_jobs_accepted : -1,
      features: company.features ? JSON.parse(company.features) : {},
    };

    const usage = {
      current_users: userCount[0].total,
      extra_users: Math.max(0, userCount[0].total - plan.included_users),
      jobs_created_this_month: jobCount[0].total,
      jobs_remaining:
        plan.max_jobs_created === -1
          ? -1
          : Math.max(0, plan.max_jobs_created - jobCount[0].total),
    };

    return res.json({ success: true, data: { plan, usage } });
  } catch (error) {
    console.error("❌ GET /v1/company/plan error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getCompanyPlanEndpoint };

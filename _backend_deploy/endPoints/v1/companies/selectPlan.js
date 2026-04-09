/**
 * POST /v1/company/select-plan
 * User-facing endpoint to select/change a company's plan.
 * Updates plan_type and syncs the commission rate (stripe_platform_fee_percentage).
 *
 * For paid plans: records the selection. Stripe subscription must be created separately.
 * For free plan: immediate downgrade (if subscription is canceled/none).
 *
 * Body: { plan_id: string }
 * Requires authentication (company owner only).
 */

const { connect } = require("../../../swiftDb");

const selectPlanEndpoint = async (req, res) => {
  let connection;
  try {
    const companyId = req.user?.company_id;
    const userId = req.user?.id;

    if (!companyId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const { plan_id } = req.body || {};

    if (!plan_id || typeof plan_id !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "plan_id is required" });
    }

    connection = await connect();

    // Verify user is the company owner
    const [owners] = await connection.execute(
      "SELECT id FROM users WHERE id = ? AND company_id = ? AND role = 'patron'",
      [userId, companyId]
    );

    if (!owners.length) {
      return res.status(403).json({
        success: false,
        error: "Only the company owner can change the plan",
      });
    }

    // Verify plan exists
    const [plans] = await connection.execute(
      "SELECT id, label, display_name, price_monthly, platform_fee_percentage, commission_rate, is_public FROM plans WHERE id = ?",
      [plan_id]
    );

    if (!plans.length) {
      return res
        .status(404)
        .json({ success: false, error: "Plan not found" });
    }

    const plan = plans[0];

    // Admin-only plans can't be selected by users
    const features = plan.features ? JSON.parse(plan.features) : {};
    if (features.admin_only) {
      return res
        .status(403)
        .json({ success: false, error: "This plan is not available" });
    }

    // Get current company state
    const [companies] = await connection.execute(
      "SELECT plan_type, subscription_status, subscription_id FROM companies WHERE id = ?",
      [companyId]
    );

    if (!companies.length) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    const company = companies[0];

    // If downgrading to free while there's an active subscription, reject
    if (
      plan.price_monthly === 0 &&
      company.subscription_status === "active" &&
      company.subscription_id
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Cancel your subscription first before downgrading to the free plan",
      });
    }

    // Update company's plan_type and sync the platform fee
    await connection.execute(
      `UPDATE companies
       SET plan_type = ?, stripe_platform_fee_percentage = ?
       WHERE id = ?`,
      [plan_id, plan.platform_fee_percentage, companyId]
    );

    console.log(
      `✅ Company ${companyId} selected plan: ${plan_id} (fee: ${plan.platform_fee_percentage}%)`
    );

    const requiresSubscription = plan.price_monthly > 0;

    return res.json({
      success: true,
      data: {
        plan_id,
        plan_label: plan.display_name || plan.label,
        price_monthly: parseFloat(plan.price_monthly),
        platform_fee_percentage: parseFloat(plan.platform_fee_percentage),
        commission_rate: parseFloat(plan.commission_rate),
        requires_subscription: requiresSubscription,
      },
    });
  } catch (error) {
    console.error("❌ POST /v1/company/select-plan error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { selectPlanEndpoint };

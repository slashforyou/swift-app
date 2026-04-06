/**
 * GET /v1/plans
 * Returns all public plans (sorted by sort_order).
 * No authentication required — plans are public info.
 */

const { connect } = require("../../swiftDb");

// Cache plans in memory for 5 minutes
let cachedPlans = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

const getPlansEndpoint = async (req, res) => {
  let connection;
  try {
    const now = Date.now();

    if (cachedPlans && now - cacheTimestamp < CACHE_TTL) {
      return res.json({ success: true, data: cachedPlans });
    }

    connection = await connect();

    const [rows] = await connection.execute(
      `SELECT id, label, display_name, price_monthly, included_users,
              extra_user_price, max_jobs_created, max_jobs_accepted,
              platform_fee_percentage, commission_rate, min_fee_aud,
              features, is_public, sort_order
       FROM plans
       WHERE is_public = 1
       ORDER BY sort_order ASC`,
    );

    const plans = rows.map((row) => ({
      ...row,
      price_monthly: parseFloat(row.price_monthly),
      extra_user_price: parseFloat(row.extra_user_price),
      platform_fee_percentage: parseFloat(row.platform_fee_percentage),
      commission_rate: parseFloat(row.commission_rate),
      min_fee_aud: parseFloat(row.min_fee_aud),
      features: row.features ? JSON.parse(row.features) : {},
    }));

    cachedPlans = plans;
    cacheTimestamp = now;

    return res.json({ success: true, data: plans });
  } catch (error) {
    console.error("❌ GET /v1/plans error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getPlansEndpoint };

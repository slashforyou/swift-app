/**
 * GET /swift-app/v1/companies/me
 *
 * Retourne le profil complet de l'entreprise de l'utilisateur connecté,
 * incluant son company_code unique et le logo_url signé.
 */

const { connect } = require("../../../swiftDb");
const { bucket } = require("../../../utils/gcsClient");
const gcsConfig = require("../../../config/gcs");

const getMyCompanyEndpoint = async (req, res) => {
  console.log("[ GET /companies/me ]", {
    userId: req.user?.id,
    companyId: req.user?.company_id,
  });

  let connection;
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res
        .status(403)
        .json({
          success: false,
          error: "No company associated with this user",
        });
    }

    connection = await connect();
    const [rows] = await connection.execute(
      `SELECT id, name, trading_name, legal_name, abn, email, phone,
              street_address, suburb, state, postcode,
              company_code, plan_type, logo_url, created_at, updated_at
       FROM companies WHERE id = ?`,
      [companyId],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    const company = rows[0];

    // Generate signed URL if logo_url is a GCS path
    let signedLogoUrl = null;
    if (company.logo_url) {
      try {
        const file = bucket.file(company.logo_url);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + (gcsConfig.signedUrlExpires || 3600) * 1000,
        });
        signedLogoUrl = url;
      } catch (err) {
        console.warn("Could not generate signed URL for logo:", err.message);
      }
    }

    return res.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        trading_name: company.trading_name,
        legal_name: company.legal_name,
        abn: company.abn,
        email: company.email,
        phone: company.phone,
        address: {
          street: company.street_address,
          suburb: company.suburb,
          state: company.state,
          postcode: company.postcode,
        },
        company_code: company.company_code,
        plan_type: company.plan_type,
        logo_url: signedLogoUrl,
        created_at: company.created_at,
        updated_at: company.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ GET /companies/me error:", error);
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

module.exports = { getMyCompanyEndpoint };

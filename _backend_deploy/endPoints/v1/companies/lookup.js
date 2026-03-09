/**
 * GET /swift-app/v1/companies/lookup?code=XXXXXXXX
 *
 * Recherche une entreprise par son code unique à 8 caractères.
 * Retourne aussi si la company est déjà dans le carnet de l'utilisateur.
 */

const { connect } = require("../../../swiftDb");

const lookupCompanyEndpoint = async (req, res) => {
  const code = (req.query.code || "").toUpperCase().trim();
  console.log("[ GET /companies/lookup ]", { code, userId: req.user?.id });

  if (!code || !/^[A-Z0-9]{8}$/.test(code)) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          "Invalid company code. Must be exactly 8 uppercase alphanumeric characters.",
      });
  }

  let connection;
  try {
    const userCompanyId = req.user?.company_id;

    connection = await connect();

    // Trouver la company par code
    const [rows] = await connection.execute(
      `SELECT id, name, trading_name, suburb, state, company_code
       FROM companies WHERE company_code = ?`,
      [code],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No company found with this code." });
    }

    const company = rows[0];

    // Interdire de se chercher soi-même
    if (company.id === userCompanyId) {
      return res
        .status(400)
        .json({
          success: false,
          error: "You cannot add your own company as a relation.",
        });
    }

    // Vérifier si relation déjà enregistrée
    let isAlreadySaved = false;
    if (userCompanyId) {
      const [rel] = await connection.execute(
        `SELECT id FROM company_relations WHERE owner_company_id = ? AND related_company_id = ?`,
        [userCompanyId, company.id],
      );
      isAlreadySaved = rel.length > 0;
    }

    return res.json({
      success: true,
      data: {
        id: company.id,
        name: company.trading_name || company.name,
        suburb: company.suburb,
        state: company.state,
        company_code: company.company_code,
        is_already_saved: isAlreadySaved,
      },
    });
  } catch (error) {
    console.error("❌ GET /companies/lookup error:", error);
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

module.exports = { lookupCompanyEndpoint };

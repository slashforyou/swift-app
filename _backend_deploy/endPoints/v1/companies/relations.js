/**
 * CRUD /swift-app/v1/companies/relations
 *
 * GET    /companies/relations            — liste mes relations
 * POST   /companies/relations            — sauvegarder une relation
 * PATCH  /companies/relations/:id        — renommer (nickname)
 * DELETE /companies/relations/:id        — supprimer
 */

const { connect } = require("../../../swiftDb");

// ──────────────────────────────────────────────
// GET /companies/relations
// ──────────────────────────────────────────────
const listRelationsEndpoint = async (req, res) => {
  console.log("[ GET /companies/relations ]", {
    companyId: req.user?.company_id,
  });
  let connection;
  try {
    const ownerCompanyId = req.user?.company_id;
    if (!ownerCompanyId)
      return res.status(403).json({ success: false, error: "No company" });

    connection = await connect();
    const [rows] = await connection.execute(
      `SELECT cr.id, cr.related_type, cr.related_company_id, cr.related_contractor_id,
              cr.nickname, cr.created_at,
              COALESCE(cr.nickname, c.trading_name, c.name) AS related_company_name,
              c.company_code AS related_company_code
       FROM company_relations cr
       LEFT JOIN companies c ON c.id = cr.related_company_id
       WHERE cr.owner_company_id = ?
       ORDER BY COALESCE(cr.nickname, c.trading_name, c.name) ASC`,
      [ownerCompanyId],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ GET /companies/relations error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────
// POST /companies/relations
// ──────────────────────────────────────────────
const saveRelationEndpoint = async (req, res) => {
  console.log("[ POST /companies/relations ]", { body: req.body });
  let connection;
  try {
    const ownerCompanyId = req.user?.company_id;
    if (!ownerCompanyId)
      return res.status(403).json({ success: false, error: "No company" });

    const {
      related_type = "company",
      related_company_id,
      related_contractor_id,
      nickname,
    } = req.body;

    if (!related_company_id && !related_contractor_id) {
      return res
        .status(400)
        .json({
          success: false,
          error: "related_company_id or related_contractor_id is required",
        });
    }
    if (related_company_id && related_company_id === ownerCompanyId) {
      return res
        .status(400)
        .json({ success: false, error: "Cannot add yourself as a relation" });
    }

    connection = await connect();

    // Vérifier si déjà sauvegardée
    const [existing] = await connection.execute(
      `SELECT id FROM company_relations
       WHERE owner_company_id = ? AND related_company_id <=> ? AND related_contractor_id <=> ?`,
      [
        ownerCompanyId,
        related_company_id || null,
        related_contractor_id || null,
      ],
    );

    if (existing.length > 0) {
      // Déjà présente — retourner quand même 200 avec l'existant
      const [rel] = await connection.execute(
        `SELECT cr.*, COALESCE(cr.nickname, c.trading_name, c.name) AS related_company_name
         FROM company_relations cr
         LEFT JOIN companies c ON c.id = cr.related_company_id
         WHERE cr.id = ?`,
        [existing[0].id],
      );
      return res
        .status(200)
        .json({ success: true, already_saved: true, data: rel[0] });
    }

    // Résoudre le nom de la company liée
    let companyName = null;
    if (related_company_id) {
      const [co] = await connection.execute(
        "SELECT COALESCE(trading_name, name) AS n FROM companies WHERE id = ?",
        [related_company_id],
      );
      companyName = co[0]?.n || null;
    }

    const [result] = await connection.execute(
      `INSERT INTO company_relations
         (owner_company_id, related_type, related_company_id, related_contractor_id, related_company_name, nickname)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ownerCompanyId,
        related_type,
        related_company_id || null,
        related_contractor_id || null,
        companyName,
        nickname || null,
      ],
    );

    const [newRel] = await connection.execute(
      `SELECT cr.*, COALESCE(cr.nickname, c.trading_name, c.name) AS related_company_name
       FROM company_relations cr
       LEFT JOIN companies c ON c.id = cr.related_company_id
       WHERE cr.id = ?`,
      [result.insertId],
    );

    return res.status(201).json({ success: true, data: newRel[0] });
  } catch (error) {
    console.error("❌ POST /companies/relations error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────
// PATCH /companies/relations/:id
// ──────────────────────────────────────────────
const updateRelationEndpoint = async (req, res) => {
  const relationId = parseInt(req.params.id);
  console.log("[ PATCH /companies/relations/:id ]", { relationId });
  let connection;
  try {
    const ownerCompanyId = req.user?.company_id;
    if (!ownerCompanyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(relationId))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const { nickname } = req.body;

    connection = await connect();

    const [check] = await connection.execute(
      "SELECT id FROM company_relations WHERE id = ? AND owner_company_id = ?",
      [relationId, ownerCompanyId],
    );
    if (check.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Relation not found" });

    await connection.execute(
      "UPDATE company_relations SET nickname = ? WHERE id = ?",
      [nickname || null, relationId],
    );

    return res.json({ success: true, message: "Nickname updated" });
  } catch (error) {
    console.error("❌ PATCH /companies/relations/:id error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// ──────────────────────────────────────────────
// DELETE /companies/relations/:id
// ──────────────────────────────────────────────
const deleteRelationEndpoint = async (req, res) => {
  const relationId = parseInt(req.params.id);
  console.log("[ DELETE /companies/relations/:id ]", { relationId });
  let connection;
  try {
    const ownerCompanyId = req.user?.company_id;
    if (!ownerCompanyId)
      return res.status(403).json({ success: false, error: "No company" });
    if (isNaN(relationId))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    connection = await connect();

    const [result] = await connection.execute(
      "DELETE FROM company_relations WHERE id = ? AND owner_company_id = ?",
      [relationId, ownerCompanyId],
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, error: "Relation not found" });

    return res.json({ success: true, message: "Relation deleted" });
  } catch (error) {
    console.error("❌ DELETE /companies/relations/:id error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  listRelationsEndpoint,
  saveRelationEndpoint,
  updateRelationEndpoint,
  deleteRelationEndpoint,
};

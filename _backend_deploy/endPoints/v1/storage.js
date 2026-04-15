/**
 * Storage module endpoints
 * Manages storage units, lots, items, photos, and billing
 *
 * Units:
 *   GET    /v1/storage/units            — list company units
 *   POST   /v1/storage/units            — create unit
 *   PATCH  /v1/storage/units/:id        — update unit
 *   DELETE /v1/storage/units/:id        — soft delete unit
 *
 * Lots:
 *   GET    /v1/storage/lots             — list company lots
 *   GET    /v1/storage/lots/:id         — lot detail with units & items
 *   POST   /v1/storage/lots             — create lot
 *   PATCH  /v1/storage/lots/:id         — update lot
 *   DELETE /v1/storage/lots/:id         — soft delete lot
 *
 * Lot-Unit assignments:
 *   POST   /v1/storage/lots/:id/units          — assign unit to lot
 *   DELETE /v1/storage/lots/:lotId/units/:unitId — remove unit from lot
 *   PATCH  /v1/storage/lots/:id/units/reorder   — reorder units in lot
 *
 * Items:
 *   POST   /v1/storage/lots/:id/items           — add item
 *   PATCH  /v1/storage/items/:id                — update item
 *   DELETE /v1/storage/items/:id                — delete item
 *   POST   /v1/storage/items/:id/checkout       — check out item
 *
 * Photos:
 *   GET    /v1/storage/lots/:id/photos          — list photos for lot
 *   POST   /v1/storage/lots/:id/photos          — upload photo
 *   DELETE /v1/storage/photos/:id               — delete photo
 *
 * Billing:
 *   GET    /v1/storage/lots/:id/billing         — billing history for lot
 *   POST   /v1/storage/lots/:id/billing         — record payment
 *   PATCH  /v1/storage/billing/:id              — update billing record status
 *   POST   /v1/storage/billing/generate         — generate due billing records (cron)
 *   GET    /v1/storage/billing/summary          — company billing summary
 *
 * Stats:
 *   GET    /v1/storage/stats                    — dashboard stats
 */

const { connect } = require("../../swiftDb");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const crypto = require("crypto");

// GCS setup (reuse same bucket as job photos)
let gcs;
try {
  gcs = new Storage();
} catch {
  gcs = null;
}
const BUCKET_NAME = process.env.GCS_BUCKET || "cobbr-uploads";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

// Helper: get company_id from auth
function getCompanyId(req) {
  return req.user?.company_id;
}

// ════════════════════════════════════════════════════════════
// UNITS
// ════════════════════════════════════════════════════════════

const listUnits = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    conn = await connect();
    const [rows] = await conn.execute(
      `SELECT su.*, 
              COUNT(DISTINCT slu.id) as active_lots
       FROM storage_units su
       LEFT JOIN storage_lot_units slu ON slu.unit_id = su.id AND slu.removed_at IS NULL
       WHERE su.company_id = ? AND su.deleted_at IS NULL
       GROUP BY su.id
       ORDER BY su.name`,
      [companyId]
    );
    return res.json({ success: true, units: rows });
  } catch (err) {
    console.error("[Storage] listUnits error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const createUnit = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { name, unit_type, capacity_cbm, location_description, notes } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }

    const validTypes = ["container", "box", "room", "shelf"];
    const type = validTypes.includes(unit_type) ? unit_type : "container";

    conn = await connect();
    const [result] = await conn.execute(
      `INSERT INTO storage_units (company_id, name, unit_type, capacity_cbm, location_description, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, name.trim(), type, capacity_cbm || null, location_description || null, notes || null]
    );

    const [created] = await conn.execute("SELECT * FROM storage_units WHERE id = ?", [result.insertId]);
    return res.json({ success: true, unit: created[0] });
  } catch (err) {
    console.error("[Storage] createUnit error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const updateUnit = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { id } = req.params;
    const { name, unit_type, capacity_cbm, location_description, status, notes } = req.body || {};

    conn = await connect();

    // Verify ownership
    const [existing] = await conn.execute(
      "SELECT id FROM storage_units WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId]
    );
    if (!existing.length) return res.status(404).json({ success: false, error: "Unit not found" });

    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name.trim()); }
    if (unit_type !== undefined) { sets.push("unit_type = ?"); params.push(unit_type); }
    if (capacity_cbm !== undefined) { sets.push("capacity_cbm = ?"); params.push(capacity_cbm); }
    if (location_description !== undefined) { sets.push("location_description = ?"); params.push(location_description); }
    if (status !== undefined) { sets.push("status = ?"); params.push(status); }
    if (notes !== undefined) { sets.push("notes = ?"); params.push(notes); }

    if (sets.length === 0) return res.status(400).json({ success: false, error: "Nothing to update" });
    params.push(id, companyId);

    await conn.execute(
      `UPDATE storage_units SET ${sets.join(", ")} WHERE id = ? AND company_id = ?`,
      params
    );

    const [updated] = await conn.execute("SELECT * FROM storage_units WHERE id = ?", [id]);
    return res.json({ success: true, unit: updated[0] });
  } catch (err) {
    console.error("[Storage] updateUnit error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const deleteUnit = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    conn = await connect();
    const [result] = await conn.execute(
      "UPDATE storage_units SET deleted_at = NOW() WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [req.params.id, companyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Unit not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("[Storage] deleteUnit error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════
// LOTS
// ════════════════════════════════════════════════════════════

const listLots = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { status } = req.query;
    conn = await connect();

    let where = "sl.company_id = ? AND sl.deleted_at IS NULL";
    const params = [companyId];
    if (status && ["active", "completed", "overdue", "pending_pickup"].includes(status)) {
      where += " AND sl.status = ?";
      params.push(status);
    }

    const [rows] = await conn.execute(
      `SELECT sl.*,
              COUNT(DISTINCT slu.unit_id) as unit_count,
              COUNT(DISTINCT si.id) as item_count
       FROM storage_lots sl
       LEFT JOIN storage_lot_units slu ON slu.lot_id = sl.id AND slu.removed_at IS NULL
       LEFT JOIN storage_items si ON si.lot_id = sl.id AND si.checked_out_at IS NULL
       WHERE ${where}
       GROUP BY sl.id
       ORDER BY sl.created_at DESC`,
      params
    );
    return res.json({ success: true, lots: rows });
  } catch (err) {
    console.error("[Storage] listLots error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const getLot = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    conn = await connect();
    const { id } = req.params;

    // Lot data
    const [lots] = await conn.execute(
      "SELECT * FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId]
    );
    if (!lots.length) return res.status(404).json({ success: false, error: "Lot not found" });
    const lot = lots[0];

    // Units assigned to this lot
    const [units] = await conn.execute(
      `SELECT su.*, slu.position, slu.id as assignment_id
       FROM storage_lot_units slu
       JOIN storage_units su ON su.id = slu.unit_id
       WHERE slu.lot_id = ? AND slu.removed_at IS NULL
       ORDER BY slu.position`,
      [id]
    );

    // Items in this lot
    const [items] = await conn.execute(
      `SELECT si.*, su.name as unit_name
       FROM storage_items si
       LEFT JOIN storage_units su ON su.id = si.unit_id
       WHERE si.lot_id = ?
       ORDER BY si.checked_out_at IS NULL DESC, si.checked_in_at DESC`,
      [id]
    );

    // Recent photos (last 20)
    const [photos] = await conn.execute(
      `SELECT * FROM storage_photos
       WHERE lot_id = ? AND company_id = ?
       ORDER BY created_at DESC LIMIT 20`,
      [id, companyId]
    );

    // Billing summary
    const [billing] = await conn.execute(
      `SELECT * FROM storage_billing_history
       WHERE lot_id = ?
       ORDER BY period_start DESC LIMIT 10`,
      [id]
    );

    return res.json({
      success: true,
      lot: { ...lot, units, items, photos, billing },
    });
  } catch (err) {
    console.error("[Storage] getLot error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════
// CLIENT SEARCH (across storage lots + jobs.clients)
// ════════════════════════════════════════════════════════════
const searchClients = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.json({ success: true, clients: [] });

    const like = `%${q}%`;
    conn = await connect();

    // 1) From storage_lots (unique client names for this company)
    const [lotClients] = await conn.execute(
      `SELECT DISTINCT client_name, client_email, client_phone
       FROM storage_lots
       WHERE company_id = ? AND deleted_at IS NULL
         AND (client_name LIKE ? OR client_email LIKE ? OR client_phone LIKE ?)
       ORDER BY client_name
       LIMIT 10`,
      [companyId, like, like, like]
    );

    // 2) From clients table (linked to company jobs)
    const [jobClients] = await conn.execute(
      `SELECT DISTINCT cl.id as client_id, cl.first_name, cl.last_name, cl.email, cl.phone
       FROM clients cl
       JOIN jobs j ON j.client_id = cl.id
       WHERE j.contractor_company_id = ?
         AND (cl.first_name LIKE ? OR cl.last_name LIKE ? OR cl.email LIKE ? OR cl.phone LIKE ?
              OR CONCAT(cl.first_name, ' ', cl.last_name) LIKE ?)
       ORDER BY cl.first_name, cl.last_name
       LIMIT 10`,
      [companyId, like, like, like, like, like]
    );

    // Merge and deduplicate by name
    const seen = new Set();
    const clients = [];

    for (const c of lotClients) {
      const key = c.client_name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        clients.push({
          name: c.client_name,
          email: c.client_email || null,
          phone: c.client_phone || null,
          source: "storage",
        });
      }
    }

    for (const c of jobClients) {
      const name = `${c.first_name || ""} ${c.last_name || ""}`.trim();
      const key = name.toLowerCase();
      if (!seen.has(key) && name) {
        seen.add(key);
        clients.push({
          name,
          email: c.email || null,
          phone: c.phone || null,
          source: "job",
        });
      }
    }

    return res.json({ success: true, clients: clients.slice(0, 15) });
  } catch (err) {
    console.error("[Storage] searchClients error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const createLot = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { client_name, client_email, client_phone, job_id, billing_type, billing_amount, billing_start_date, notes } = req.body || {};
    if (!client_name || !client_name.trim()) {
      return res.status(400).json({ success: false, error: "Client name is required" });
    }

    const validBilling = ["fixed", "weekly", "monthly"];
    const bType = validBilling.includes(billing_type) ? billing_type : "monthly";
    const amount = parseFloat(billing_amount) || 0;
    const startDate = billing_start_date || new Date().toISOString().split("T")[0];

    // Calculate next due date
    let nextDue = startDate;
    if (bType === "weekly") {
      const d = new Date(startDate);
      d.setDate(d.getDate() + 7);
      nextDue = d.toISOString().split("T")[0];
    } else if (bType === "monthly") {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + 1);
      nextDue = d.toISOString().split("T")[0];
    }

    conn = await connect();
    const [result] = await conn.execute(
      `INSERT INTO storage_lots (company_id, client_name, client_email, client_phone, job_id, billing_type, billing_amount, billing_start_date, billing_next_due, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, client_name.trim(), client_email || null, client_phone || null, job_id || null, bType, amount, startDate, nextDue, notes || null]
    );

    const [created] = await conn.execute("SELECT * FROM storage_lots WHERE id = ?", [result.insertId]);
    return res.json({ success: true, lot: created[0] });
  } catch (err) {
    console.error("[Storage] createLot error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const updateLot = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { id } = req.params;
    const { client_name, client_email, client_phone, billing_type, billing_amount, status, notes } = req.body || {};

    conn = await connect();
    const [existing] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [id, companyId]
    );
    if (!existing.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const sets = [];
    const params = [];
    if (client_name !== undefined) { sets.push("client_name = ?"); params.push(client_name.trim()); }
    if (client_email !== undefined) { sets.push("client_email = ?"); params.push(client_email); }
    if (client_phone !== undefined) { sets.push("client_phone = ?"); params.push(client_phone); }
    if (billing_type !== undefined) { sets.push("billing_type = ?"); params.push(billing_type); }
    if (billing_amount !== undefined) { sets.push("billing_amount = ?"); params.push(parseFloat(billing_amount) || 0); }
    if (status !== undefined) { sets.push("status = ?"); params.push(status); }
    if (notes !== undefined) { sets.push("notes = ?"); params.push(notes); }

    if (sets.length === 0) return res.status(400).json({ success: false, error: "Nothing to update" });
    params.push(id, companyId);

    await conn.execute(
      `UPDATE storage_lots SET ${sets.join(", ")} WHERE id = ? AND company_id = ?`,
      params
    );

    const [updated] = await conn.execute("SELECT * FROM storage_lots WHERE id = ?", [id]);
    return res.json({ success: true, lot: updated[0] });
  } catch (err) {
    console.error("[Storage] updateLot error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const deleteLot = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    conn = await connect();
    const [result] = await conn.execute(
      "UPDATE storage_lots SET deleted_at = NOW() WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [req.params.id, companyId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Lot not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("[Storage] deleteLot error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════
// LOT-UNIT ASSIGNMENTS
// ════════════════════════════════════════════════════════════

const assignUnit = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const lotId = req.params.id;
    const { unit_id } = req.body || {};
    if (!unit_id) return res.status(400).json({ success: false, error: "unit_id is required" });

    conn = await connect();

    // Verify lot and unit ownership
    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const [unit] = await conn.execute(
      "SELECT id FROM storage_units WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [unit_id, companyId]
    );
    if (!unit.length) return res.status(404).json({ success: false, error: "Unit not found" });

    // Check not already assigned
    const [exists] = await conn.execute(
      "SELECT id FROM storage_lot_units WHERE lot_id = ? AND unit_id = ? AND removed_at IS NULL",
      [lotId, unit_id]
    );
    if (exists.length) return res.status(409).json({ success: false, error: "Unit already assigned to this lot" });

    // Get max position
    const [maxPos] = await conn.execute(
      "SELECT COALESCE(MAX(position), -1) as maxp FROM storage_lot_units WHERE lot_id = ? AND removed_at IS NULL",
      [lotId]
    );

    await conn.execute(
      "INSERT INTO storage_lot_units (lot_id, unit_id, position) VALUES (?, ?, ?)",
      [lotId, unit_id, (maxPos[0].maxp || 0) + 1]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("[Storage] assignUnit error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const removeUnitFromLot = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { lotId, unitId } = req.params;
    conn = await connect();

    // Verify lot ownership
    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const [result] = await conn.execute(
      "UPDATE storage_lot_units SET removed_at = NOW() WHERE lot_id = ? AND unit_id = ? AND removed_at IS NULL",
      [lotId, unitId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Assignment not found" });
    return res.json({ success: true });
  } catch (err) {
    console.error("[Storage] removeUnitFromLot error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const reorderUnits = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const lotId = req.params.id;
    const { unit_ids } = req.body || {};
    if (!Array.isArray(unit_ids)) return res.status(400).json({ success: false, error: "unit_ids array required" });

    conn = await connect();

    // Verify lot ownership
    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    for (let i = 0; i < unit_ids.length; i++) {
      await conn.execute(
        "UPDATE storage_lot_units SET position = ? WHERE lot_id = ? AND unit_id = ? AND removed_at IS NULL",
        [i, lotId, unit_ids[i]]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[Storage] reorderUnits error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════
// ITEMS
// ════════════════════════════════════════════════════════════

const addItem = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const lotId = req.params.id;
    const { name, description, quantity, unit_id, condition_in } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: "Name is required" });

    conn = await connect();

    // Verify lot ownership
    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const validConditions = ["excellent", "good", "fair", "damaged"];
    const cond = validConditions.includes(condition_in) ? condition_in : "good";

    const [result] = await conn.execute(
      `INSERT INTO storage_items (lot_id, unit_id, name, description, quantity, condition_in)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lotId, unit_id || null, name.trim(), description || null, parseInt(quantity) || 1, cond]
    );

    const [created] = await conn.execute("SELECT * FROM storage_items WHERE id = ?", [result.insertId]);
    return res.json({ success: true, item: created[0] });
  } catch (err) {
    console.error("[Storage] addItem error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const updateItem = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { id } = req.params;
    const { name, description, quantity, unit_id, condition_in } = req.body || {};

    conn = await connect();

    // Verify item belongs to company via lot
    const [item] = await conn.execute(
      `SELECT si.id FROM storage_items si
       JOIN storage_lots sl ON sl.id = si.lot_id
       WHERE si.id = ? AND sl.company_id = ?`,
      [id, companyId]
    );
    if (!item.length) return res.status(404).json({ success: false, error: "Item not found" });

    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name.trim()); }
    if (description !== undefined) { sets.push("description = ?"); params.push(description); }
    if (quantity !== undefined) { sets.push("quantity = ?"); params.push(parseInt(quantity) || 1); }
    if (unit_id !== undefined) { sets.push("unit_id = ?"); params.push(unit_id); }
    if (condition_in !== undefined) { sets.push("condition_in = ?"); params.push(condition_in); }

    if (sets.length === 0) return res.status(400).json({ success: false, error: "Nothing to update" });
    params.push(id);

    await conn.execute(`UPDATE storage_items SET ${sets.join(", ")} WHERE id = ?`, params);

    const [updated] = await conn.execute("SELECT * FROM storage_items WHERE id = ?", [id]);
    return res.json({ success: true, item: updated[0] });
  } catch (err) {
    console.error("[Storage] updateItem error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const deleteItem = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { id } = req.params;
    conn = await connect();

    const [item] = await conn.execute(
      `SELECT si.id FROM storage_items si
       JOIN storage_lots sl ON sl.id = si.lot_id
       WHERE si.id = ? AND sl.company_id = ?`,
      [id, companyId]
    );
    if (!item.length) return res.status(404).json({ success: false, error: "Item not found" });

    await conn.execute("DELETE FROM storage_items WHERE id = ?", [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Storage] deleteItem error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const checkoutItem = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { id } = req.params;
    const { condition_out } = req.body || {};

    conn = await connect();

    const [item] = await conn.execute(
      `SELECT si.id FROM storage_items si
       JOIN storage_lots sl ON sl.id = si.lot_id
       WHERE si.id = ? AND sl.company_id = ? AND si.checked_out_at IS NULL`,
      [id, companyId]
    );
    if (!item.length) return res.status(404).json({ success: false, error: "Item not found or already checked out" });

    const validConditions = ["excellent", "good", "fair", "damaged"];
    const cond = validConditions.includes(condition_out) ? condition_out : null;

    await conn.execute(
      "UPDATE storage_items SET checked_out_at = NOW(), condition_out = ? WHERE id = ?",
      [cond, id]
    );

    const [updated] = await conn.execute("SELECT * FROM storage_items WHERE id = ?", [id]);
    return res.json({ success: true, item: updated[0] });
  } catch (err) {
    console.error("[Storage] checkoutItem error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════
// PHOTOS
// ════════════════════════════════════════════════════════════

const listPhotos = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const lotId = req.params.id;
    conn = await connect();

    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const [photos] = await conn.execute(
      "SELECT * FROM storage_photos WHERE lot_id = ? AND company_id = ? ORDER BY created_at DESC",
      [lotId, companyId]
    );

    // Generate signed URLs
    if (gcs) {
      const bucket = gcs.bucket(BUCKET_NAME);
      for (const photo of photos) {
        try {
          const [url] = await bucket.file(photo.file_path).getSignedUrl({
            action: "read",
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });
          photo.url = url;
        } catch {
          photo.url = null;
        }
      }
    }

    return res.json({ success: true, photos });
  } catch (err) {
    console.error("[Storage] listPhotos error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const uploadPhoto = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const lotId = req.params.id;
    if (!req.file) return res.status(400).json({ success: false, error: "No file provided" });

    conn = await connect();

    // Verify lot ownership
    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const { item_id, unit_id, description, photo_type } = req.body || {};
    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = `storage/${companyId}/${lotId}/${uniqueName}`;

    // Upload to GCS
    if (gcs) {
      const bucket = gcs.bucket(BUCKET_NAME);
      const blob = bucket.file(filePath);
      await blob.save(req.file.buffer, { contentType: req.file.mimetype });
    }

    const validTypes = ["checkin", "checkout", "damage", "inventory", "other"];
    const pType = validTypes.includes(photo_type) ? photo_type : "inventory";

    const [result] = await conn.execute(
      `INSERT INTO storage_photos (company_id, lot_id, unit_id, item_id, user_id, filename, file_path, original_name, mime_type, file_size, description, photo_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, lotId, unit_id || null, item_id || null, req.user?.id || null, uniqueName, filePath, req.file.originalname, req.file.mimetype, req.file.size, description || null, pType]
    );

    const [created] = await conn.execute("SELECT * FROM storage_photos WHERE id = ?", [result.insertId]);
    const photo = created[0];

    // Get signed URL
    if (gcs) {
      try {
        const [url] = await gcs.bucket(BUCKET_NAME).file(filePath).getSignedUrl({
          action: "read",
          expires: Date.now() + 60 * 60 * 1000,
        });
        photo.url = url;
      } catch {
        photo.url = null;
      }
    }

    return res.json({ success: true, photo });
  } catch (err) {
    console.error("[Storage] uploadPhoto error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const deletePhoto = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { id } = req.params;
    conn = await connect();

    const [photo] = await conn.execute(
      "SELECT * FROM storage_photos WHERE id = ? AND company_id = ?",
      [id, companyId]
    );
    if (!photo.length) return res.status(404).json({ success: false, error: "Photo not found" });

    // Delete from GCS
    if (gcs && photo[0].file_path) {
      try {
        await gcs.bucket(BUCKET_NAME).file(photo[0].file_path).delete();
      } catch { /* ignore if already deleted */ }
    }

    await conn.execute("DELETE FROM storage_photos WHERE id = ?", [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Storage] deletePhoto error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════
// BILLING
// ════════════════════════════════════════════════════════════

const getBillingHistory = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const lotId = req.params.id;
    conn = await connect();

    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const [rows] = await conn.execute(
      "SELECT * FROM storage_billing_history WHERE lot_id = ? ORDER BY period_start DESC",
      [lotId]
    );
    return res.json({ success: true, billing: rows });
  } catch (err) {
    console.error("[Storage] getBillingHistory error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const recordPayment = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const lotId = req.params.id;
    const { amount, period_start, period_end, status, notes } = req.body || {};
    if (!amount || !period_start || !period_end) {
      return res.status(400).json({ success: false, error: "amount, period_start, period_end required" });
    }

    conn = await connect();

    const [lot] = await conn.execute(
      "SELECT id FROM storage_lots WHERE id = ? AND company_id = ? AND deleted_at IS NULL",
      [lotId, companyId]
    );
    if (!lot.length) return res.status(404).json({ success: false, error: "Lot not found" });

    const validStatuses = ["pending", "paid", "overdue", "waived"];
    const bStatus = validStatuses.includes(status) ? status : "pending";

    const [result] = await conn.execute(
      `INSERT INTO storage_billing_history (lot_id, company_id, amount, period_start, period_end, status, paid_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [lotId, companyId, parseFloat(amount), period_start, period_end, bStatus, bStatus === "paid" ? new Date() : null, notes || null]
    );

    const [created] = await conn.execute("SELECT * FROM storage_billing_history WHERE id = ?", [result.insertId]);
    return res.json({ success: true, record: created[0] });
  } catch (err) {
    console.error("[Storage] recordPayment error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const updateBillingRecord = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    const { id } = req.params;
    const { status, notes } = req.body || {};

    conn = await connect();

    const [existing] = await conn.execute(
      "SELECT * FROM storage_billing_history WHERE id = ? AND company_id = ?",
      [id, companyId]
    );
    if (!existing.length) return res.status(404).json({ success: false, error: "Billing record not found" });

    const validStatuses = ["pending", "paid", "overdue", "waived"];
    const sets = [];
    const params = [];

    if (status !== undefined && validStatuses.includes(status)) {
      sets.push("status = ?");
      params.push(status);
      if (status === "paid") {
        sets.push("paid_at = NOW()");
      }
    }
    if (notes !== undefined) {
      sets.push("notes = ?");
      params.push(notes);
    }

    if (sets.length === 0) return res.status(400).json({ success: false, error: "Nothing to update" });
    params.push(id, companyId);

    await conn.execute(
      `UPDATE storage_billing_history SET ${sets.join(", ")} WHERE id = ? AND company_id = ?`,
      params
    );

    const [updated] = await conn.execute("SELECT * FROM storage_billing_history WHERE id = ?", [id]);
    return res.json({ success: true, record: updated[0] });
  } catch (err) {
    console.error("[Storage] updateBillingRecord error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const generateBilling = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    conn = await connect();
    const today = new Date().toISOString().split("T")[0];

    // Find active lots where billing_next_due <= today
    const [dueLots] = await conn.execute(
      `SELECT * FROM storage_lots
       WHERE company_id = ? AND status = 'active' AND deleted_at IS NULL
         AND billing_next_due IS NOT NULL AND billing_next_due <= ?
         AND billing_amount > 0`,
      [companyId, today]
    );

    const generated = [];
    for (const lot of dueLots) {
      const periodStart = lot.billing_next_due;
      let periodEnd;
      let nextDue;

      if (lot.billing_type === "weekly") {
        const d = new Date(periodStart);
        d.setDate(d.getDate() + 7);
        periodEnd = d.toISOString().split("T")[0];
        nextDue = periodEnd;
      } else if (lot.billing_type === "monthly") {
        const d = new Date(periodStart);
        d.setMonth(d.getMonth() + 1);
        periodEnd = d.toISOString().split("T")[0];
        nextDue = periodEnd;
      } else {
        // fixed — one-time, don't recur
        periodEnd = periodStart;
        nextDue = null;
      }

      // Create billing record
      const [result] = await conn.execute(
        `INSERT INTO storage_billing_history (lot_id, company_id, amount, period_start, period_end, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [lot.id, companyId, lot.billing_amount, periodStart, periodEnd]
      );

      // Advance next_due
      if (nextDue) {
        await conn.execute(
          "UPDATE storage_lots SET billing_next_due = ? WHERE id = ?",
          [nextDue, lot.id]
        );
      } else {
        await conn.execute(
          "UPDATE storage_lots SET billing_next_due = NULL WHERE id = ?",
          [lot.id]
        );
      }

      generated.push({ lot_id: lot.id, billing_id: result.insertId, amount: lot.billing_amount, period_start: periodStart, period_end: periodEnd });
    }

    // Mark overdue: billing records that are pending and period_end < today
    const [overdueResult] = await conn.execute(
      `UPDATE storage_billing_history
       SET status = 'overdue'
       WHERE company_id = ? AND status = 'pending' AND period_end < ?`,
      [companyId, today]
    );

    // Mark lots with overdue billing as overdue
    await conn.execute(
      `UPDATE storage_lots sl
       SET sl.status = 'overdue'
       WHERE sl.company_id = ? AND sl.status = 'active' AND sl.deleted_at IS NULL
         AND EXISTS (
           SELECT 1 FROM storage_billing_history sbh
           WHERE sbh.lot_id = sl.id AND sbh.status = 'overdue'
         )`,
      [companyId]
    );

    return res.json({
      success: true,
      generated: generated.length,
      records: generated,
      overdue_updated: overdueResult.affectedRows || 0,
    });
  } catch (err) {
    console.error("[Storage] generateBilling error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

const getBillingSummary = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    conn = await connect();

    const [summary] = await conn.execute(
      `SELECT
         COUNT(DISTINCT sl.id) as total_lots,
         SUM(CASE WHEN sl.status = 'active' THEN 1 ELSE 0 END) as active_lots,
         SUM(CASE WHEN sl.status = 'active' THEN sl.billing_amount ELSE 0 END) as monthly_revenue,
         SUM(CASE WHEN sl.status = 'overdue' THEN 1 ELSE 0 END) as overdue_lots
       FROM storage_lots sl
       WHERE sl.company_id = ? AND sl.deleted_at IS NULL`,
      [companyId]
    );

    const [pending] = await conn.execute(
      `SELECT COALESCE(SUM(amount), 0) as pending_amount
       FROM storage_billing_history
       WHERE company_id = ? AND status = 'pending'`,
      [companyId]
    );

    const [overdue] = await conn.execute(
      `SELECT COALESCE(SUM(amount), 0) as overdue_amount
       FROM storage_billing_history
       WHERE company_id = ? AND status = 'overdue'`,
      [companyId]
    );

    return res.json({
      success: true,
      summary: {
        ...summary[0],
        pending_amount: pending[0].pending_amount,
        overdue_amount: overdue[0].overdue_amount,
      },
    });
  } catch (err) {
    console.error("[Storage] getBillingSummary error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

// ════════════════════════════════════════════════════════════
// STATS (Dashboard)
// ════════════════════════════════════════════════════════════

const getStorageStats = async (req, res) => {
  let conn;
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: "Unauthorized" });

    conn = await connect();

    const [units] = await conn.execute(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
         SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as in_use,
         SUM(CASE WHEN status = 'full' THEN 1 ELSE 0 END) as full_units
       FROM storage_units WHERE company_id = ? AND deleted_at IS NULL`,
      [companyId]
    );

    const [lots] = await conn.execute(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue
       FROM storage_lots WHERE company_id = ? AND deleted_at IS NULL`,
      [companyId]
    );

    const [items] = await conn.execute(
      `SELECT COUNT(*) as total FROM storage_items si
       JOIN storage_lots sl ON sl.id = si.lot_id
       WHERE sl.company_id = ? AND si.checked_out_at IS NULL AND sl.deleted_at IS NULL`,
      [companyId]
    );

    return res.json({
      success: true,
      stats: {
        units: units[0],
        lots: lots[0],
        items_in_storage: items[0].total,
      },
    });
  } catch (err) {
    console.error("[Storage] getStorageStats error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  listUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  searchClients,
  listLots,
  getLot,
  createLot,
  updateLot,
  deleteLot,
  assignUnit,
  removeUnitFromLot,
  reorderUnits,
  addItem,
  updateItem,
  deleteItem,
  checkoutItem,
  listPhotos,
  uploadPhoto,
  deletePhoto,
  getBillingHistory,
  recordPayment,
  updateBillingRecord,
  generateBilling,
  getBillingSummary,
  getStorageStats,
  upload, // multer middleware
};

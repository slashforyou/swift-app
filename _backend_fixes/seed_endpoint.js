// Temporary admin seed endpoint - REMOVE AFTER USE
const express = require("express");
const router = express.Router();
const { getPool } = require("./swiftDb");

const SEED_TOKEN = "swift-seed-tmp-2026";

const SCENARIOS = [
  {
    drivers: 1,
    offsiders: 0,
    pricing_amount: 120,
    pricing_type: "hourly",
    resource_note: "1 chauffeur + camion requis",
  },
  {
    drivers: 2,
    offsiders: 1,
    pricing_amount: 850,
    pricing_type: "flat",
    resource_note: "2 chauffeurs + 1 offsider",
  },
  {
    drivers: 1,
    offsiders: 2,
    pricing_amount: 95,
    pricing_type: "hourly",
    resource_note: "Demenagement complet",
  },
  {
    drivers: 0,
    offsiders: 2,
    pricing_amount: 1200,
    pricing_type: "flat",
    resource_note: "Equipe manutention (2 packers)",
  },
  {
    drivers: 1,
    offsiders: 1,
    pricing_amount: 680,
    pricing_type: "daily",
    resource_note: "Livraison standard",
  },
  {
    drivers: 2,
    offsiders: 0,
    pricing_amount: 110,
    pricing_type: "hourly",
    resource_note: "2 chauffeurs + 1 packer",
  },
  {
    drivers: 1,
    offsiders: 3,
    pricing_amount: 1500,
    pricing_type: "flat",
    resource_note: "Equipe offsider requise (3)",
  },
  {
    drivers: 0,
    offsiders: 1,
    pricing_amount: 750,
    pricing_type: "daily",
    resource_note: "Emballage prioritaire (3 packers)",
  },
];

router.post("/swift-app/admin/seed-transfers-tmp", async (req, res) => {
  if (req.headers["x-admin-token"] !== SEED_TOKEN) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const pool = getPool();

    // Get all job_transfer IDs
    const [transfers] = await pool.query(
      "SELECT id FROM job_transfers ORDER BY id",
    );

    // Get first truck ID for each company
    const [trucks] = await pool.query(
      "SELECT id FROM trucks ORDER BY id LIMIT 5",
    );
    const truckIds = trucks.map((t) => t.id);
    console.log(
      "[SEED] Found transfers:",
      transfers.map((t) => t.id),
    );
    console.log("[SEED] Found trucks:", truckIds);

    const results = [];
    for (let i = 0; i < transfers.length; i++) {
      const sc = SCENARIOS[i % SCENARIOS.length];
      const truckId =
        (sc.drivers > 0 || sc.offsiders > 0) && truckIds.length > 0
          ? truckIds[i % truckIds.length]
          : null;

      await pool.query(
        `UPDATE job_transfers 
         SET requested_drivers = ?, 
             requested_offsiders = ?, 
             preferred_truck_id = ?,
             resource_note = ?,
             pricing_amount = ?,
             pricing_type = ?
         WHERE id = ?`,
        [
          sc.drivers,
          sc.offsiders,
          truckId,
          sc.resource_note,
          sc.pricing_amount,
          sc.pricing_type,
          transfers[i].id,
        ],
      );
      results.push({ id: transfers[i].id, ...sc, truckId });
    }

    console.log("[SEED] Done! Updated", results.length, "transfers");
    res.json({ ok: true, updated: results.length, details: results });
  } catch (err) {
    console.error("[SEED] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

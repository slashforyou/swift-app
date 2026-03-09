/**
 * Seed job_transfers with varied resource requests.
 * Run with: node /tmp/seed_resources.js
 */
require("dotenv").config({ path: "/srv/www/htdocs/swiftapp/server/.env" });
const mysql = require("/srv/www/htdocs/swiftapp/server/node_modules/mysql2/promise");

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "swiftapp_user",
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE || "swiftapp",
  socketPath: "/run/mysql/mysql.sock",
};

async function main() {
  const conn = await mysql.createConnection(poolConfig);
  console.log("Connected to DB");

  // Check trucks
  const [trucks] = await conn.query("SELECT id FROM trucks LIMIT 10");
  const truckIds = trucks.map((r) => r.id);
  console.log("Trucks:", truckIds);

  // Check transfers
  const [transfers] = await conn.query(
    "SELECT id, job_id, status FROM job_transfers",
  );
  console.log(
    "Transfers found:",
    transfers.length,
    transfers.map((t) => t.id),
  );

  // Scenarios cycling over all transfers
  const scenarios = [
    {
      drivers: 1,
      offsiders: 0,
      useTruck: true,
      note: "1 chauffeur + camion requis",
    },
    {
      drivers: 2,
      offsiders: 1,
      useTruck: true,
      note: "2 chauffeurs + 1 offsider",
    },
    {
      drivers: 1,
      offsiders: 2,
      useTruck: true,
      note: "Demenagement complet - equipe complete",
    },
    {
      drivers: 0,
      offsiders: 2,
      useTruck: false,
      note: "Equipe manutention (2 packers)",
    },
    { drivers: 1, offsiders: 1, useTruck: true, note: "Livraison standard" },
    {
      drivers: 2,
      offsiders: 0,
      useTruck: true,
      note: "2 chauffeurs + 1 packer",
    },
    {
      drivers: 1,
      offsiders: 3,
      useTruck: true,
      note: "Equipe offsider requise (3)",
    },
    {
      drivers: 0,
      offsiders: 1,
      useTruck: false,
      note: "Emballage prioritaire (3 packers)",
    },
  ];
  const pricingOptions = [
    { amount: 120, type: "hourly" },
    { amount: 850, type: "flat" },
    { amount: 95, type: "hourly" },
    { amount: 1200, type: "flat" },
    { amount: 680, type: "daily" },
    { amount: 110, type: "hourly" },
    { amount: 1500, type: "flat" },
    { amount: 750, type: "daily" },
  ];

  for (let i = 0; i < transfers.length; i++) {
    const t = transfers[i];
    const sc = scenarios[i % scenarios.length];
    const pr = pricingOptions[i % pricingOptions.length];
    const truckId =
      sc.useTruck && truckIds.length > 0 ? truckIds[i % truckIds.length] : null;

    await conn.query(
      `UPDATE job_transfers SET
        requested_drivers = ?,
        requested_offsiders = ?,
        pricing_amount = ?,
        pricing_type = ?,
        preferred_truck_id = ?,
        resource_note = ?
       WHERE id = ?`,
      [sc.drivers, sc.offsiders, pr.amount, pr.type, truckId, sc.note, t.id],
    );
    console.log(
      `Transfer ${t.id}: drivers=${sc.drivers} offsiders=${sc.offsiders} truck=${truckId} price=${pr.amount} ${pr.type} => OK`,
    );
  }

  // Final state
  const [final] = await conn.query(
    "SELECT id, requested_drivers, requested_offsiders, pricing_amount, pricing_type, preferred_truck_id, resource_note FROM job_transfers",
  );
  console.log("\n=== FINAL STATE ===");
  final.forEach((r) => console.log(r));

  await conn.end();
  console.log("\nDONE");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});

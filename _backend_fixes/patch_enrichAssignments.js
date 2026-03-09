/**
 * Patch: enrichAssignments — add company_name for staff + vehicles
 * Run: node patch_enrichAssignments.js
 */
const fs = require("fs");
const path = "/srv/www/htdocs/swiftapp/server/endPoints/v1/assignments.js";

const src = fs.readFileSync(path, "utf8");

const OLD = `/** Enrichit une liste d'assignments avec les infos de la ressource */
async function enrichAssignments(connection, assignments) {
  const enriched = [];
  for (const a of assignments) {
    let resource = null;
    if (a.resource_type === "vehicle") {
      const [rows] = await connection.execute(
        "SELECT id, name, license_plate, capacity FROM trucks WHERE id = ?",
        [a.resource_id],
      );
      resource = rows[0] || null;
    } else {
      const [rows] = await connection.execute(
        "SELECT u.id, u.firstName, u.lastName, u.email, u.phone FROM users u WHERE u.id = ?",
        [a.resource_id],
      );
      resource = rows[0] || null;
    }
    enriched.push({ ...a, resource });
  }
  return enriched;
}`;

const NEW = `/** Enrichit une liste d'assignments avec les infos de la ressource + company_name */
async function enrichAssignments(connection, assignments) {
  const enriched = [];
  for (const a of assignments) {
    let resource = null;
    if (a.resource_type === "vehicle") {
      const [rows] = await connection.execute(
        \`SELECT t.id, t.name, t.license_plate, t.capacity,
                c.id AS company_id, c.name AS company_name
         FROM trucks t
         LEFT JOIN companies c ON c.id = t.company_id
         WHERE t.id = ?\`,
        [a.resource_id],
      );
      resource = rows[0] || null;
    } else {
      const [rows] = await connection.execute(
        \`SELECT u.id, u.firstName, u.lastName, u.email, u.phone,
                u.company_id, c.name AS company_name
         FROM users u
         LEFT JOIN companies c ON c.id = u.company_id
         WHERE u.id = ?\`,
        [a.resource_id],
      );
      resource = rows[0] || null;
    }
    enriched.push({ ...a, resource });
  }
  return enriched;
}`;

if (
  !src.includes(
    "SELECT id, name, license_plate, capacity FROM trucks WHERE id = ?",
  )
) {
  console.log("❌ Original pattern not found — aborting");
  process.exit(1);
}

const patched = src.replace(OLD, NEW);
if (patched === src) {
  console.log("❌ Replace had no effect — check whitespace");
  process.exit(1);
}

fs.writeFileSync(path, patched, "utf8");
console.log("✅ enrichAssignments patched with company_name");

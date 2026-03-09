/**
 * register_staff_requests_route.js
 *
 * Script de déploiement pour enregistrer la route POST /v1/jobs/:jobId/staff-requests
 * à exécuter sur le serveur : node register_staff_requests_route.js
 *
 * Ce script :
 *   1. Crée la table staff_requests si elle n'existe pas
 *   2. Affiche les instructions pour enregistrer la route dans index.js
 */

const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

// Load credentials from server .env
function loadEnv(envPath) {
  const vals = {};
  try {
    fs.readFileSync(envPath, "utf8")
      .split("\n")
      .forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith("#") && line.includes("=")) {
          const [k, ...rest] = line.split("=");
          vals[k.trim()] = rest.join("=").trim();
        }
      });
  } catch (_) {}
  return vals;
}

const envFile = path.join(__dirname, "..", ".env");
const env = loadEnv(envFile);

async function run() {
  const connection = await mysql.createConnection({
    socketPath: env.DB_SOCKET || "/run/mysql/mysql.sock",
    user: env.DB_USER || "root",
    password: env.DB_PASS || "",
    database: env.DB_DATABASE || "swiftapp",
  });

  console.log("✅ Connected to DB");

  // 1. Créer la table staff_requests
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS staff_requests (
      id                    INT AUTO_INCREMENT PRIMARY KEY,
      job_id                INT NOT NULL,
      company_id            INT NOT NULL,
      requested_by_user_id  INT NOT NULL,
      offsider_count        TINYINT UNSIGNED NOT NULL DEFAULT 1,
      note                  TEXT,
      status                ENUM('pending','fulfilled','cancelled') NOT NULL DEFAULT 'pending',
      created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_job_id      (job_id),
      INDEX idx_company_id  (company_id),
      INDEX idx_status      (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✅ Table staff_requests created (or already exists)");

  await connection.end();

  console.log(`
=======================================================
ÉTAPE SUIVANTE : Enregistrer la route dans index.js
=======================================================

Ajouter dans le fichier index.js du serveur :

  const { staffRequestsEndpoint } = require('./endPoints/v1/jobs/staffRequests');
  ...
  app.post('/swift-app/v1/jobs/:jobId/staff-requests', authenticateToken, staffRequestsEndpoint);

Puis redémarrer : pm2 restart swiftapp
=======================================================
  `);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

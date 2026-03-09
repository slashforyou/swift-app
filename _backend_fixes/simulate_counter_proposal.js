/**
 * Simulation d'une contre-proposition B2B
 *
 * Ce script :
 * 1. Insère un token de session valide pour user 24 (admin contractor, company_id=1)
 * 2. Récupère les détails du job TST-MAR-007
 * 3. Soumet une contre-proposition : +1 offsider + prix original +500$
 * 4. Vérifie les données sauvegardées en DB
 *
 * Usage: node simulate_counter_proposal.js
 */

const http = require("http");
const mysql = require("/srv/www/htdocs/swiftapp/server/node_modules/mysql2/promise");

const SIM_TOKEN = "SIM_TOKEN_COUNTER_PROPOSAL_2026";
const JOB_CODE = "TST-MAR-007";
const API_PORT = 3021;

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "localhost",
      port: API_PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let buf = "";
      res.on("data", (d) => (buf += d));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // ─── STEP 0 : Insérer token de session valide ──────────────────────────────
  console.log(
    "=== STEP 0: Inject session token for user 24 (Admin contractor) ===",
  );
  const conn = await mysql.createConnection({
    socketPath: "/run/mysql/mysql.sock",
    user: "swiftapp_user",
    password: "U%Xgxvc54EKUD39PcwNAYvuS",
    database: "swiftapp",
  });

  await conn.execute("DELETE FROM devices WHERE session_token = ?", [
    SIM_TOKEN,
  ]);
  await conn.execute(
    `INSERT INTO devices
       (id, user_id, name, platform, refresh_hash, refresh_expires,
        session_token, session_expires, disabled)
     VALUES
       (UUID(), 24, 'SimulatorDevice', 'ios', 'sim',
        DATE_ADD(NOW(), INTERVAL 2 HOUR),
        ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), 0)`,
    [SIM_TOKEN],
  );
  console.log("Session token injected:", SIM_TOKEN);

  // ─── STEP 1 : Récupérer le job ─────────────────────────────────────────────
  console.log("\n=== STEP 1: GET job " + JOB_CODE + " ===");
  const jobResp = await request(
    "GET",
    "/swift-app/v1/job/" + JOB_CODE + "/full",
    null,
    SIM_TOKEN,
  );
  if (jobResp.status !== 200) {
    console.error(
      "Failed to fetch job:",
      jobResp.status,
      JSON.stringify(jobResp.body, null, 2),
    );
    process.exit(1);
  }

  const job = jobResp.body?.data?.job;
  const crew = jobResp.body?.data?.crew || [];
  console.log("Job code         :", job?.code);
  console.log("Status           :", job?.assignment_status);
  console.log("Prix original    : $" + job?.amount_total);
  console.log("Date début       :", job?.start_window_start);
  console.log("Date fin         :", job?.end_window_end);

  const drivers = crew.filter((c) => c.role === "driver").length;
  const offsiders = crew.filter((c) => c.role === "offsider").length;
  const packers = crew.filter((c) => c.role === "packer").length;
  console.log(
    "Crew actuel      : drivers=" +
      drivers +
      " offsiders=" +
      offsiders +
      " packers=" +
      packers,
  );

  // ─── Calcul de la contre-proposition ──────────────────────────────────────
  const originalPrice = parseFloat(job?.amount_total || 0);
  const counterPrice = originalPrice + 500;
  const counterDrivers = drivers > 0 ? drivers : 1;
  const counterOffsiders = offsiders + 1;

  console.log("\n--- Contre-proposition calculée ---");
  console.log(
    "Prix             : $" + originalPrice + " → $" + counterPrice + " (+500)",
  );
  console.log(
    "Offsiders        : " + offsiders + " → " + counterOffsiders + " (+1)",
  );
  console.log("Drivers          : " + counterDrivers + " (inchangé)");

  // ─── STEP 2 : POST counter_proposal ───────────────────────────────────────
  console.log("\n=== STEP 2: POST counter_proposal ===");
  const payload = {
    proposed_start: job?.start_window_start,
    proposed_end: job?.end_window_end,
    proposed_price: counterPrice,
    price_type: "fixed",
    note: "Simulation: +1 offsider et prix augmenté de 500$ par rapport à la proposition originale",
    proposed_drivers: counterDrivers,
    proposed_offsiders: counterOffsiders,
    proposed_packers: packers,
  };
  console.log("Payload envoyé:", JSON.stringify(payload, null, 2));

  const cpResp = await request(
    "POST",
    "/swift-app/v1/jobs/" + JOB_CODE + "/counter_proposal",
    payload,
    SIM_TOKEN,
  );
  console.log("\nRéponse HTTP :", cpResp.status);
  console.log(JSON.stringify(cpResp.body, null, 2));

  // ─── STEP 3 : Vérification en DB ──────────────────────────────────────────
  if (cpResp.status === 200 || cpResp.status === 201) {
    console.log("\n=== STEP 3: Verify saved data in DB ===");
    const verifyResp = await request(
      "GET",
      "/swift-app/v1/job/" + JOB_CODE + "/full",
      null,
      SIM_TOKEN,
    );
    const updatedJob = verifyResp.body?.data?.job;
    console.log("counter_proposed_price :", updatedJob?.counter_proposed_price);
    console.log("counter_proposed_start :", updatedJob?.counter_proposed_start);
    console.log("counter_proposed_end   :", updatedJob?.counter_proposed_end);
    console.log("counter_proposal_note  :", updatedJob?.counter_proposal_note);
    if (updatedJob?.counter_proposal_note) {
      try {
        const parsed = JSON.parse(updatedJob.counter_proposal_note);
        console.log("\ncounter_proposal_note (parsé):");
        console.log(JSON.stringify(parsed, null, 2));
        console.log("\n--- Vérification des valeurs ---");
        console.log(
          "proposed_price    :",
          parsed.proposed_price,
          "(attendu:",
          counterPrice,
          ")",
        );
        console.log(
          "proposed_offsiders:",
          parsed.proposed_offsiders,
          "(attendu:",
          counterOffsiders,
          ")",
        );
        console.log(
          "proposed_drivers  :",
          parsed.proposed_drivers,
          "(attendu:",
          counterDrivers,
          ")",
        );
        console.log("text              :", parsed.text);
        const ok =
          parsed.proposed_price === counterPrice &&
          parsed.proposed_offsiders === counterOffsiders;
        console.log(
          "\n" +
            (ok
              ? "✅ SUCCÈS — Les données sont correctement sauvegardées!"
              : "❌ PROBLÈME — Valeurs incorrectes"),
        );
      } catch (e) {
        console.log("❌ counter_proposal_note invalide (pas du JSON valide)");
      }
    } else {
      console.log(
        "❌ counter_proposal_note est NULL — la sauvegarde a échoué!",
      );
    }
  }

  await conn.end();
}

main().catch((err) => {
  console.error("FATAL:", err.message || err);
  process.exit(1);
});

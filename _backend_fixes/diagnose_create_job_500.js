/**
 * diagnose_create_job_500.js
 * ──────────────────────────────────────────────────────────────────────────
 * Diagnostique l'HTTP 500 sur POST /v1/job.
 *
 * Run on server:
 *   node /tmp/diagnose_create_job_500.js
 * ou depuis le dossier server :
 *   node diagnose_create_job_500.js
 * ──────────────────────────────────────────────────────────────────────────
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SERVER = "/srv/www/htdocs/swiftapp/server";
const EP = path.join(SERVER, "endPoints/v1");

// ── Lecture des credentials DB depuis .env ────────────────────────────────
function readEnv() {
  const envPath = path.join(SERVER, ".env");
  const vars = {};
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8")
      .split("\n")
      .forEach((line) => {
        line = line.trim();
        if (!line || line.startsWith("#") || !line.includes("=")) return;
        const [k, ...rest] = line.split("=");
        vars[k.trim()] = rest
          .join("=")
          .trim()
          .replace(/^['"]|['"]$/g, "");
      });
  }
  return vars;
}

function mysql(sql, env) {
  const host = env.DB_HOST || "localhost";
  const user = env.DB_USER || "swiftapp_user";
  const pass = env.DB_PASS || "U%Xgxvc54EKUD39PcwNAYvuS";
  const db = env.DB_DATABASE || "swiftapp";
  try {
    const out = execSync(`mysql -h${host} -u${user} -p${pass} ${db}`, {
      input: sql,
      encoding: "utf8",
    });
    return out;
  } catch (e) {
    return "ERROR: " + (e.stdout || "") + " | " + (e.stderr || "");
  }
}

const SEP = "═".repeat(60);

console.log("\n" + SEP);
console.log("  DIAGNOSTIC: POST /v1/job → 500");
console.log(SEP);

// ── 1. Contenu de createJob.js ────────────────────────────────────────────
console.log("\n[1/5] Contenu de createJob.js");
console.log("─".repeat(60));
const createJobPath = path.join(EP, "createJob.js");
if (!fs.existsSync(createJobPath)) {
  console.log("❌ Fichier introuvable:", createJobPath);
} else {
  const src = fs.readFileSync(createJobPath, "utf8");
  console.log(
    `Taille: ${src.length} octets, ${src.split("\n").length} lignes\n`,
  );

  // Extraire la section INSERT
  const insertIdx = src.indexOf("INSERT INTO jobs");
  if (insertIdx >= 0) {
    const insertEnd = src.indexOf(";", insertIdx);
    console.log(">>> Section INSERT INTO jobs:");
    console.log(src.substring(Math.max(0, insertIdx - 50), insertEnd + 10));
  } else {
    console.log(
      "⚠️  Pas de INSERT INTO jobs trouvé (peut-être utilise une ORM ou helper)",
    );
  }

  // Chercher la ligne assignment_status
  const lines = src.split("\n");
  console.log('\n>>> Lignes contenant "assignment_status":');
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes("assignment_status")) {
      console.log(`  L${i + 1}: ${l.trim()}`);
    }
  });

  // Chercher la ligne staffing_status
  console.log('\n>>> Lignes contenant "staffing_status":');
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes("staffing_status")) {
      console.log(`  L${i + 1}: ${l.trim()}`);
    }
  });

  // Chercher les lignes avec contractee_company_id
  console.log('\n>>> Lignes contenant "contractee_company_id":');
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes("contractee_company_id")) {
      console.log(`  L${i + 1}: ${l.trim()}`);
    }
  });

  // Chercher les lignes avec "client_id" pour voir la validation
  console.log('\n>>> Lignes contenant "client_id":');
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes("client_id")) {
      console.log(`  L${i + 1}: ${l.trim()}`);
    }
  });

  // Chercher les lignes avec "timezone"
  console.log('\n>>> Lignes contenant "timezone":');
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes("timezone")) {
      console.log(`  L${i + 1}: ${l.trim()}`);
    }
  });

  // Chercher logJobAction
  console.log('\n>>> Lignes contenant "logJobAction":');
  lines.forEach((l, i) => {
    if (l.includes("logJobAction")) {
      console.log(`  L${i + 1}: ${l.trim()}`);
    }
  });

  // Chercher les blocs catch/error
  console.log("\n>>> Lignes catch/error:");
  lines.forEach((l, i) => {
    if (/catch\s*\(|\.catch\(|console\.error/.test(l)) {
      console.log(`  L${i + 1}: ${l.trim()}`);
    }
  });

  // Dump complet si petit
  if (src.length < 8000) {
    console.log("\n>>> DUMP COMPLET (fichier < 8 Ko):");
    console.log(src);
  } else {
    console.log("\n>>> Premières 150 lignes:");
    lines
      .slice(0, 150)
      .forEach((l, i) => console.log(`${String(i + 1).padStart(4)}: ${l}`));
  }
}

// ── 2. Schéma de la table jobs ────────────────────────────────────────────
console.log("\n" + SEP);
console.log("[2/5] DESCRIBE jobs (colonnes NOT NULL sans défaut)");
console.log("─".repeat(60));
const env = readEnv();
if (!env.DB_USER) {
  console.log("⚠️  .env non chargé — credentials DB manquants");
} else {
  const schema = mysql("DESCRIBE jobs", env);
  console.log(schema);
}

// ── 3. Utilisateur admin.test ──────────────────────────────────────────────
console.log("\n" + SEP);
console.log("[3/5] Utilisateur admin.test@nerd-test.com");
console.log("─".repeat(60));
if (env.DB_USER) {
  const user = mysql(
    `SELECT id, email, role, company_id FROM users WHERE email = 'admin.test@nerd-test.com' LIMIT 1`,
    // Note: backtick string to avoid escaping
    env,
  );
  console.log(user);
}

// ── 4. Table clients (ou companies utilisée comme client) ─────────────────
console.log("\n" + SEP);
console.log("[4/5] Client id=30 existe ?");
console.log("─".repeat(60));
if (env.DB_USER) {
  // Try clients table first, then companies
  const clientsExist = mysql("SHOW TABLES LIKE 'clients'", env);
  console.log(
    "Table clients:",
    clientsExist.includes("clients") ? "EXISTS" : "NOT FOUND",
  );

  if (clientsExist.includes("clients")) {
    const c30 = mysql(
      "SELECT id, name, company_id FROM clients WHERE id = 30 LIMIT 1",
      env,
    );
    console.log("clients id=30:", c30);
  }

  const c30co = mysql(
    "SELECT id, name FROM companies WHERE id = 30 LIMIT 1",
    env,
  );
  console.log("companies id=30:", c30co);
}

// ── 5. PM2 logs récents ───────────────────────────────────────────────────
console.log("\n" + SEP);
console.log("[5/5] PM2 logs récents (erreurs, dernières 60 lignes)");
console.log("─".repeat(60));
try {
  const logs = execSync(
    "pm2 logs swiftapp --lines 60 --nostream --no-color 2>&1",
    { encoding: "utf8", timeout: 10000 },
  );
  // Filter for error lines to reduce noise
  const errorLines = logs
    .split("\n")
    .filter(
      (l) =>
        l.includes("Error") ||
        l.includes("error") ||
        l.includes("ERR") ||
        l.includes("createJob") ||
        l.includes("v1/job") ||
        l.includes("500") ||
        l.includes("Cannot") ||
        l.includes("SQLSTATE") ||
        l.includes("ER_"),
    );
  if (errorLines.length > 0) {
    console.log("=== Lignes filtrées (erreurs/job) ===");
    console.log(errorLines.join("\n"));
    console.log("\n=== Log complet ===");
  }
  console.log(logs);
} catch (e) {
  console.log("pm2 logs:", e.stdout || e.message);
}

// ── 6. Dump createJob.js complet dans /tmp ────────────────────────────────
console.log("\n" + SEP);
console.log("[6/6] Dump createJob.js → /tmp/createJob_dump.js");
console.log("─".repeat(60));
if (fs.existsSync(createJobPath)) {
  const content = fs.readFileSync(createJobPath, "utf8");
  fs.writeFileSync("/tmp/createJob_dump.js", content, "utf8");
  console.log(`✅ Copié ${content.length} octets → /tmp/createJob_dump.js`);
  console.log("   Pour afficher: cat /tmp/createJob_dump.js");
}

console.log("\n" + SEP);
console.log("  FIN DU DIAGNOSTIC");
console.log(SEP + "\n");

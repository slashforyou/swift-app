#!/usr/bin/env node
/**
 * patch_counter_proposal_fix.js
 *
 * Fix 1: getJobById.js - Add counter_proposed_* fields to response
 * Fix 2: counterProposal.js - Store JSON payload + fix proposed_by_user_id in INSERT
 */

const fs = require("fs");
const path = require("path");

const SERVER_DIR = "/srv/www/htdocs/swiftapp/server";

// ──────────────────────────────────────────────────────────────────────
// FIX 1: getJobById.js - Add counter proposal fields to response
// ──────────────────────────────────────────────────────────────────────
const getJobByIdPath = path.join(SERVER_DIR, "endPoints/v1/getJobById.js");
let getJobById = fs.readFileSync(getJobByIdPath, "utf8");

const OLD_TIMESTAMPS = `          // Timestamps
          createdAt: job.created_at,
          updatedAt: job.updated_at
        },`;

const NEW_TIMESTAMPS = `          // Timestamps
          createdAt: job.created_at,
          updatedAt: job.updated_at,

          // Counter proposal (négociation B2B)
          counter_proposed_start: job.counter_proposed_start || null,
          counter_proposed_end: job.counter_proposed_end || null,
          counter_proposed_at: job.counter_proposed_at || null,
          counter_proposal_note: job.counter_proposal_note || null,
        },`;

if (!getJobById.includes(OLD_TIMESTAMPS)) {
  console.error(
    "❌ PATCH 1 FAILED: Could not find target string in getJobById.js",
  );
  console.error("Looking for:", OLD_TIMESTAMPS);
  process.exit(1);
}

// Backup + patch
fs.writeFileSync(getJobByIdPath + ".bak_counter_fix_" + Date.now(), getJobById);
getJobById = getJobById.replace(OLD_TIMESTAMPS, NEW_TIMESTAMPS);
fs.writeFileSync(getJobByIdPath, getJobById);
console.log(
  "✅ FIX 1: getJobById.js patched - counter_proposed_* fields added to response",
);

// ──────────────────────────────────────────────────────────────────────
// FIX 2: counterProposal.js - Store JSON payload in counter_proposal_note
//         and fix proposed_by_user_id in INSERT
// ──────────────────────────────────────────────────────────────────────
const counterProposalPath = path.join(
  SERVER_DIR,
  "endPoints/v1/jobs/counterProposal.js",
);
let counterProposal = fs.readFileSync(counterProposalPath, "utf8");

// 2a. Fix the INSERT to include proposed_by_user_id
const OLD_INSERT = `      const [insertResult] = await connection.execute(
        \`INSERT INTO job_counter_proposals
           (job_id, proposed_by_company_id, proposed_start, proposed_end, note, 
            proposed_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())\`,
        [
          jobId,
          companyId,
          startMysql,
          endMysql,
          note || null,
          proposed_price != null ? Number(proposed_price) : null,
        ],
      );`;

const NEW_INSERT = `      const [insertResult] = await connection.execute(
        \`INSERT INTO job_counter_proposals
           (job_id, proposed_by_company_id, proposed_by_user_id, proposed_start, proposed_end, note, 
            proposed_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())\`,
        [
          jobId,
          companyId,
          userId,
          startMysql,
          endMysql,
          note || null,
          proposed_price != null ? Number(proposed_price) : null,
        ],
      );`;

if (!counterProposal.includes(OLD_INSERT)) {
  console.warn(
    "⚠️  FIX 2a (INSERT fix) skipped - pattern not found (may already be patched)",
  );
} else {
  counterProposal = counterProposal.replace(OLD_INSERT, NEW_INSERT);
  console.log("✅ FIX 2a: INSERT proposed_by_user_id added");
}

// 2b. Store JSON note payload in jobs.counter_proposal_note
const OLD_UPDATE = `    // Mettre à jour assignment_status → negotiating
    await connection.execute(
      \`UPDATE jobs
       SET assignment_status        = 'negotiating',
           counter_proposed_start   = ?,
           counter_proposed_end     = ?,
           counter_proposal_note    = ?,
           counter_proposed_at      = NOW(),
           counter_proposed_by      = ?
       WHERE id = ?\`,
      [startMysql, endMysql, note || null, userId, jobId],
    );`;

const NEW_UPDATE = `    // Construire le payload JSON complet pour counter_proposal_note
    const noteJson = JSON.stringify({
      text: note || null,
      proposed_price: proposed_price != null ? Number(proposed_price) : null,
      price_type: resolvedPriceType || null,
      vehicle_id: vehicle_id ? String(vehicle_id) : null,
      proposed_drivers: req.body.proposed_drivers != null ? Number(req.body.proposed_drivers) : null,
      proposed_offsiders: req.body.proposed_offsiders != null ? Number(req.body.proposed_offsiders) : null,
      proposed_packers: req.body.proposed_packers != null ? Number(req.body.proposed_packers) : null,
    });

    // Mettre à jour assignment_status → negotiating
    await connection.execute(
      \`UPDATE jobs
       SET assignment_status        = 'negotiating',
           counter_proposed_start   = ?,
           counter_proposed_end     = ?,
           counter_proposal_note    = ?,
           counter_proposed_at      = NOW(),
           counter_proposed_by      = ?
       WHERE id = ?\`,
      [startMysql, endMysql, noteJson, userId, jobId],
    );`;

if (!counterProposal.includes(OLD_UPDATE)) {
  console.warn(
    "⚠️  FIX 2b (JSON note payload) skipped - pattern not found (may already be patched)",
  );
} else {
  counterProposal = counterProposal.replace(OLD_UPDATE, NEW_UPDATE);
  console.log(
    "✅ FIX 2b: counterProposal.js now stores JSON payload in counter_proposal_note",
  );
}

// Backup + write
fs.writeFileSync(
  counterProposalPath + ".bak_counter_fix_" + Date.now(),
  fs.readFileSync(counterProposalPath, "utf8"),
);
fs.writeFileSync(counterProposalPath, counterProposal);
console.log(
  "\n✅ All patches applied. Restart the swiftapp process to take effect.",
);

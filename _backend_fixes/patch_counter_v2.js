#!/usr/bin/env node
/**
 * patch_counter_v2.js - Patch counterProposal.js on server
 * Fix 2a: Add proposed_by_user_id to INSERT
 * Fix 2b: Store JSON note payload instead of plain text
 */

const fs = require("fs");
const path = require("path");

const filePath =
  "/srv/www/htdocs/swiftapp/server/endPoints/v1/jobs/counterProposal.js";
let content = fs.readFileSync(filePath, "utf8");

// ── FIX 2a: Add proposed_by_user_id to INSERT ──────────────────────
// We replace the INSERT columns list and VALUES array
content = content.replace(
  /`INSERT INTO job_counter_proposals\s+\(job_id, proposed_by_company_id, proposed_start, proposed_end, note,\s+proposed_price, status, created_at\)\s+VALUES \(\?, \?, \?, \?, \?, \?, 'pending', NOW\(\)\)`/,
  "`INSERT INTO job_counter_proposals\n           (job_id, proposed_by_company_id, proposed_by_user_id, proposed_start, proposed_end, note, \n            proposed_price, status, created_at)\n         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`",
);

// Fix the corresponding VALUES array - add userId after companyId
content = content.replace(
  /\[\s*jobId,\s*companyId,\s*startMysql,\s*endMysql,\s*note \|\| null,\s*proposed_price != null \? Number\(proposed_price\) : null,\s*\]/,
  `[
          jobId,
          companyId,
          userId,
          startMysql,
          endMysql,
          note || null,
          proposed_price != null ? Number(proposed_price) : null,
        ]`,
);

console.log("✅ FIX 2a: proposed_by_user_id added to INSERT");

// ── FIX 2b: Store JSON payload in counter_proposal_note ──────────────
// Find the UPDATE jobs block and replace the note|| null with noteJson
const updateMatch = content.match(
  /\/\/ Mettre à jour assignment_status.*?negotiating[\s\S]*?\[startMysql, endMysql, note \|\| null, userId, jobId\]/,
);
if (!updateMatch) {
  console.warn(
    "⚠️  FIX 2b: Could not find exact UPDATE pattern, trying alternate...",
  );
  // Try a simpler replacement: replace just the values array param
  if (content.includes("[startMysql, endMysql, note || null, userId, jobId]")) {
    content = content.replace(
      "[startMysql, endMysql, note || null, userId, jobId]",
      `[startMysql, endMysql, JSON.stringify({\n        text: note || null,\n        proposed_price: proposed_price != null ? Number(proposed_price) : null,\n        price_type: resolvedPriceType || null,\n        vehicle_id: vehicle_id ? String(vehicle_id) : null,\n        proposed_drivers: req.body.proposed_drivers != null ? Number(req.body.proposed_drivers) : null,\n        proposed_offsiders: req.body.proposed_offsiders != null ? Number(req.body.proposed_offsiders) : null,\n        proposed_packers: req.body.proposed_packers != null ? Number(req.body.proposed_packers) : null,\n      }), userId, jobId]`,
    );
    console.log("✅ FIX 2b: JSON note payload stored in counter_proposal_note");
  } else {
    console.error("❌ FIX 2b FAILED: Could not find the values array to patch");
  }
} else {
  console.log("✅ FIX 2b: Found UPDATE block, patching...");
  content = content.replace(
    "[startMysql, endMysql, note || null, userId, jobId]",
    `[startMysql, endMysql, JSON.stringify({\n        text: note || null,\n        proposed_price: proposed_price != null ? Number(proposed_price) : null,\n        price_type: resolvedPriceType || null,\n        vehicle_id: vehicle_id ? String(vehicle_id) : null,\n        proposed_drivers: req.body.proposed_drivers != null ? Number(req.body.proposed_drivers) : null,\n        proposed_offsiders: req.body.proposed_offsiders != null ? Number(req.body.proposed_offsiders) : null,\n        proposed_packers: req.body.proposed_packers != null ? Number(req.body.proposed_packers) : null,\n      }), userId, jobId]`,
  );
}

// Backup
fs.writeFileSync(
  filePath + ".bak_counterfix_" + Date.now(),
  fs.readFileSync(filePath, "utf8"),
);
fs.writeFileSync(filePath, content);
console.log("\n✅ counterProposal.js patched successfully.");

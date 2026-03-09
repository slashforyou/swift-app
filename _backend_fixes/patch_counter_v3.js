#!/usr/bin/env node
/**
 * patch_counter_v3.js
 * Fix: Also update counter_proposed_price in the jobs table UPDATE
 */

const fs = require("fs");
const filePath =
  "/srv/www/htdocs/swiftapp/server/endPoints/v1/jobs/counterProposal.js";
let content = fs.readFileSync(filePath, "utf8");

// Find the UPDATE SET block and add counter_proposed_price
if (
  content.includes(
    "counter_proposed_start   = ?,\n           counter_proposed_end     = ?,\n           counter_proposal_note    = ?,\n           counter_proposed_at      = NOW(),",
  )
) {
  content = content.replace(
    "counter_proposed_start   = ?,\n           counter_proposed_end     = ?,\n           counter_proposal_note    = ?,\n           counter_proposed_at      = NOW(),",
    "counter_proposed_start   = ?,\n           counter_proposed_end     = ?,\n           counter_proposal_note    = ?,\n           counter_proposed_price   = ?,\n           counter_proposed_at      = NOW(),",
  );
  // Update values array to add proposed_price
  content = content.replace(
    "}), userId, jobId],",
    "}), proposed_price != null ? Number(proposed_price) : null, userId, jobId],",
  );
  fs.writeFileSync(
    filePath + ".bak_v3_" + Date.now(),
    fs.readFileSync(filePath, "utf8"),
  );
  fs.writeFileSync(filePath, content);
  console.log("OK counter_proposed_price added to UPDATE");
} else {
  console.log("SKIP - pattern not found, may already done");
  const idx = content.indexOf("counter_proposed_start");
  if (idx >= 0) console.log("Context:", content.substring(idx - 20, idx + 500));
}

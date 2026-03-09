/**
 * patch_job_actions.js
 * Injects logJobAction(...) calls into key job endpoints.
 * Run once on the server: node patch_job_actions.js
 */
const fs = require("fs");
const EP = "/srv/www/htdocs/swiftapp/server/endPoints/v1";
const LOGGER3 = "../../../utils/jobActionLogger";
const LOGGER2 = "../../utils/jobActionLogger";

function patchFile(filepath, patches) {
  let content;
  try {
    content = fs.readFileSync(filepath, "utf8");
  } catch (e) {
    return console.error("SKIP", filepath, "-", e.message);
  }
  if (content.includes("logJobAction")) {
    return console.log("ALREADY_PATCHED:", filepath);
  }
  fs.writeFileSync(filepath + ".bak", content);
  let modified = content;
  for (const [search, replace] of patches) {
    if (!modified.includes(search)) {
      console.error(
        "NOT_FOUND:",
        JSON.stringify(search).substring(0, 80),
        "in",
        filepath,
      );
      continue;
    }
    modified = modified.replace(search, replace);
  }
  if (modified !== content) {
    fs.writeFileSync(filepath, modified);
    console.log("PATCHED:", filepath);
  } else {
    console.log("NO_CHANGE:", filepath);
  }
}

// ══════════════════════════════════════════════════════
// jobs/transfers.js — create / respond / cancel
// ══════════════════════════════════════════════════════
patchFile(EP + "/jobs/transfers.js", [
  [
    "const { connect } = require('../../../swiftDb');\n",
    "const { connect } = require('../../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER3 +
      "');\n",
  ],
  // createTransfer success
  [
    "    return res.status(201).json({ success: true, data: transfer[0] });",
    "    logJobAction({ jobId, actionType: 'transfer_created', userId, companyId: senderCompanyId, actorRole: 'owner', permissionLevel: 'manager', metadata: { transfer_id: result.insertId, recipient_company_id: recipient_company_id || null, pricing_amount: parseFloat(pricing_amount) } });\n    return res.status(201).json({ success: true, data: transfer[0] });",
  ],
  // respondToTransfer success — note: uses backtick template literal in file
  [
    "    return res.json({ success: true, message: `Transfer ${newStatus}` });",
    "    logJobAction({ jobId, actionType: action === 'accept' ? 'transfer_accepted' : 'transfer_declined', userId, companyId, actorRole: 'contractor', permissionLevel: 'contractor', oldStatus: 'pending', newStatus, metadata: { transfer_id: transferId, decline_reason: decline_reason || null } });\n    return res.json({ success: true, message: `Transfer ${newStatus}` });",
  ],
  // cancelTransfer success
  [
    "    return res.json({ success: true, message: 'Transfer cancelled' });",
    "    logJobAction({ jobId, actionType: 'transfer_cancelled', userId: req.user && req.user.id, companyId, actorRole: 'owner', permissionLevel: 'manager', metadata: { transfer_id: transferId } });\n    return res.json({ success: true, message: 'Transfer cancelled' });",
  ],
]);

// ══════════════════════════════════════════════════════
// acceptJob.js
// ══════════════════════════════════════════════════════
patchFile(EP + "/acceptJob.js", [
  [
    "const { connect } = require('../../swiftDb');\n",
    "const { connect } = require('../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER2 +
      "');\n",
  ],
  [
    "    // TODO: Envoyer une notification au créateur du job (contractee)\n\n    return res.json({",
    "    // TODO: Envoyer une notification au créateur du job (contractee)\n    logJobAction({ jobId: job.id, actionType: 'job_accepted', userId, companyId: userCompanyId, actorRole: 'contractor', permissionLevel: 'contractor', oldStatus: 'pending', newStatus: 'accepted' });\n\n    return res.json({",
  ],
]);

// ══════════════════════════════════════════════════════
// declineJob.js — read first to find success pattern
// ══════════════════════════════════════════════════════
(function patchDeclineJob() {
  const filepath = EP + "/declineJob.js";
  let content;
  try {
    content = fs.readFileSync(filepath, "utf8");
  } catch (e) {
    return console.error("SKIP declineJob:", e.message);
  }
  if (content.includes("logJobAction")) {
    return console.log("ALREADY_PATCHED:", filepath);
  }
  fs.writeFileSync(filepath + ".bak", content);
  // Add import
  content = content.replace(
    "const { connect } = require('../../swiftDb');\n",
    "const { connect } = require('../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER2 +
      "');\n",
  );
  // Find the success response pattern dynamically
  const successMatch = content.match(
    /([ \t]*return res\.json\(\{[^}]*success: true[^}]*(?:declined|decline)[^}]*\}\);)/,
  );
  if (successMatch) {
    content = content.replace(
      successMatch[0],
      "    logJobAction({ jobId: job && job.id, actionType: 'job_declined', userId, companyId: userCompanyId || (req.user && req.user.company_id), actorRole: 'contractor', permissionLevel: 'contractor', newStatus: 'declined' });\n" +
        successMatch[0],
    );
  }
  fs.writeFileSync(filepath, content);
  console.log("PATCHED:", filepath);
})();

// ══════════════════════════════════════════════════════
// assignments.js
// ══════════════════════════════════════════════════════
(function patchAssignments() {
  const filepath = EP + "/assignments.js";
  let content;
  try {
    content = fs.readFileSync(filepath, "utf8");
  } catch (e) {
    return console.error("SKIP assignments:", e.message);
  }
  if (content.includes("logJobAction")) {
    return console.log("ALREADY_PATCHED:", filepath);
  }
  fs.writeFileSync(filepath + ".bak", content);
  content = content.replace(
    "const { connect } = require('../../swiftDb');\n",
    "const { connect } = require('../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER2 +
      "');\n",
  );
  fs.writeFileSync(filepath, content);
  console.log("PATCHED (import only):", filepath);
})();

// ══════════════════════════════════════════════════════
// counterProposal.js
// ══════════════════════════════════════════════════════
(function patchCounterProposal() {
  const filepath = EP + "/jobs/counterProposal.js";
  let content;
  try {
    content = fs.readFileSync(filepath, "utf8");
  } catch (e) {
    return console.error("SKIP counterProposal:", e.message);
  }
  if (content.includes("logJobAction")) {
    return console.log("ALREADY_PATCHED:", filepath);
  }
  fs.writeFileSync(filepath + ".bak", content);
  content = content.replace(
    "const { connect } = require('../../../swiftDb');\n",
    "const { connect } = require('../../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER3 +
      "');\n",
  );
  // Find and patch the success response
  const lines = content.split("\n");
  const successIdx = lines.findIndex(
    (l, i) => l.includes("success: true") && l.includes("counter_proposal"),
  );
  if (successIdx !== -1) {
    lines.splice(
      successIdx,
      0,
      "    logJobAction({ jobId: jobId || req.params && req.params.id, actionType: 'counter_proposal_created', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: 'contractor', permissionLevel: 'contractor' });",
    );
    content = lines.join("\n");
  }
  fs.writeFileSync(filepath, content);
  console.log("PATCHED:", filepath);
})();

// ══════════════════════════════════════════════════════
// acceptCounterProposal.js
// ══════════════════════════════════════════════════════
patchFile(EP + "/jobs/acceptCounterProposal.js", [
  [
    "const { connect } = require('../../../swiftDb');\n",
    "const { connect } = require('../../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER3 +
      "');\n",
  ],
]);

// ══════════════════════════════════════════════════════
// rejectCounterProposal.js
// ══════════════════════════════════════════════════════
patchFile(EP + "/jobs/rejectCounterProposal.js", [
  [
    "const { connect } = require('../../../swiftDb');\n",
    "const { connect } = require('../../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER3 +
      "');\n",
  ],
]);

// ══════════════════════════════════════════════════════
// createJob.js
// ══════════════════════════════════════════════════════
patchFile(EP + "/createJob.js", [
  [
    "const { getUserByToken } = require('../database/user');\n",
    "const { getUserByToken } = require('../database/user');\nconst { logJobAction } = require('" +
      LOGGER2 +
      "');\n",
  ],
  [
    "    return res.status(201).json({\n      success: true,\n      message: 'Job créé avec succès',",
    "    logJobAction({ jobId, actionType: 'job_created', userId: req.user && req.user.id || null, companyId: req.user && req.user.company_id || (req.body && req.body.company_id) || null, actorRole: 'owner', permissionLevel: 'manager', newStatus: 'pending' });\n    return res.status(201).json({\n      success: true,\n      message: 'Job créé avec succès',",
  ],
]);

// ══════════════════════════════════════════════════════
// Status-change endpoints (import only — success patterns vary too much)
// ══════════════════════════════════════════════════════
[
  [EP + "/startJobById.js", LOGGER2, "job_started"],
  [EP + "/pauseJobById.js", LOGGER2, "job_paused"],
  [EP + "/resumeJobById.js", LOGGER2, "job_resumed"],
  [EP + "/completeJobById.js", LOGGER2, "job_completed"],
  [EP + "/archiveJobById.js", LOGGER2, "job_archived"],
  [EP + "/deleteJobById.js", LOGGER2, "job_deleted"],
  [EP + "/assignCrewToJobById.js", LOGGER2, "crew_assigned"],
  [EP + "/removeCrewFromJobById.js", LOGGER2, "crew_removed"],
  [EP + "/assignTrucksToJobById.js", LOGGER2, "truck_assigned"],
  [EP + "/removeTruckFromJobById.js", LOGGER2, "truck_removed"],
].forEach(([fp, loggerPath]) => {
  let content;
  try {
    content = fs.readFileSync(fp, "utf8");
  } catch (e) {
    return console.error("SKIP", fp, "-", e.message);
  }
  if (content.includes("logJobAction")) {
    return console.log("ALREADY_PATCHED:", fp);
  }
  fs.writeFileSync(fp + ".bak", content);
  // Try common require patterns
  const patterns = [
    "const { connect } = require('../../swiftDb');\n",
    "const {connect} = require('../../swiftDb');\n",
    "const db = require('../../swiftDb');\n",
  ];
  let patched = false;
  for (const pat of patterns) {
    if (content.includes(pat)) {
      content = content.replace(
        pat,
        pat + "const { logJobAction } = require('" + loggerPath + "');\n",
      );
      patched = true;
      break;
    }
  }
  if (!patched) {
    // Try first line with require
    content =
      "const { logJobAction } = require('" + loggerPath + "');\n" + content;
    patched = true;
  }
  fs.writeFileSync(fp, content);
  console.log("PATCHED (import):", fp);
});

console.log("\n=== PATCH COMPLETE ===");

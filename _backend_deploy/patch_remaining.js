/**
 * patch_remaining.js — Patch the 3 files with different require patterns
 */
const fs = require("fs");
const EP = "/srv/www/htdocs/swiftapp/server/endPoints/v1";
const LOGGER2 = "../../utils/jobActionLogger";
const LOGGER3 = "../../../utils/jobActionLogger";

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
  fs.writeFileSync(filepath + ".bak2", content);
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

// acceptJob.js — single quotes, no trailing newline
patchFile(EP + "/acceptJob.js", [
  [
    "const { connect } = require('../../swiftDb');",
    "const { connect } = require('../../swiftDb');\nconst { logJobAction } = require('" +
      LOGGER2 +
      "');",
  ],
  // The success response block has unique TODO comment before it
  [
    "// TODO: Envoyer une notification",
    "logJobAction({ jobId: job.id, actionType: 'job_accepted', userId, companyId: userCompanyId, actorRole: 'contractor', permissionLevel: 'contractor', oldStatus: 'pending', newStatus: 'accepted' });\n    // TODO: Envoyer une notification",
  ],
]);

// acceptCounterProposal.js — double quotes
patchFile(EP + "/jobs/acceptCounterProposal.js", [
  [
    'const { connect } = require("../../../swiftDb");',
    'const { connect } = require("../../../swiftDb");\nconst { logJobAction } = require(\'' +
      LOGGER3 +
      "');",
  ],
]);

// rejectCounterProposal.js — double quotes
patchFile(EP + "/jobs/rejectCounterProposal.js", [
  [
    'const { connect } = require("../../../swiftDb");',
    'const { connect } = require("../../../swiftDb");\nconst { logJobAction } = require(\'' +
      LOGGER3 +
      "');",
  ],
]);

console.log("=== REMAINING PATCHES DONE ===");

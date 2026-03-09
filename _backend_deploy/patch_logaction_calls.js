/**
 * patch_logaction_calls.js
 *
 * Injects the actual logJobAction(...) call into endpoints that only have
 * the import but no call yet. Skips files that already have 2+ occurrences.
 *
 * Run on server: node /tmp/patch_logaction_calls.js
 */
const fs = require("fs");
const path = require("path");

const BASE = "/srv/www/htdocs/swiftapp/server/endPoints/v1";

// -----------------------------------------------------------------
// Each entry describes ONE injection:
//   file:    path relative to BASE
//   search:  the exact string to search for (must appear exactly once in the success path)
//   inject:  the logJobAction call to insert BEFORE that string
// -----------------------------------------------------------------
const patches = [
  // ── startJobById.js ──────────────────────────────────────────
  {
    file: "startJobById.js",
    search: `    res.json({
      success: true,
      message: 'Job started successfully',`,
    inject: `    // Log job action
    logJobAction({ jobId, actionType: 'job_started', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: (req.user && req.user.role) || 'employee', permissionLevel: 'manager', oldStatus: currentStatus, newStatus: 'started' });
`,
  },

  // ── archiveJobById.js ────────────────────────────────────────
  {
    file: "archiveJobById.js",
    search: `    return res.json({
      success: true,
      message: 'Job archived successfully',`,
    inject: `    // Log job action
    logJobAction({ jobId: parseInt(jobId), actionType: 'job_archived', userId: user.id, companyId: user.company_id, actorRole: (['admin','manager'].includes(userRole) ? userRole : 'employee'), permissionLevel: (['admin','manager'].includes(userRole) ? userRole : 'employee'), oldStatus: job.status, newStatus: 'archived' });
`,
  },

  // ── completeJobById.js ───────────────────────────────────────
  {
    file: "completeJobById.js",
    search: `    return res.json({
      success: true,
      message: 'Job completed successfully',`,
    inject: `    // Log job action
    logJobAction({ jobId: numericJobId || job.id, actionType: 'job_completed', userId: user && (user.id || user.user_id), companyId: user && user.company_id, actorRole: (user && user.role) || 'employee', permissionLevel: 'manager', oldStatus: job.status, newStatus: 'completed' });
`,
  },

  // ── deleteJobById.js ─────────────────────────────────────────
  {
    file: "deleteJobById.js",
    search: `    return res.json({
      success: true,
      message: 'Job deleted successfully',`,
    inject: `    // Log job action
    logJobAction({ jobId: parseInt(jobId), actionType: 'job_deleted', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: (req.user && req.user.role) || 'admin', permissionLevel: 'admin', oldStatus: undefined, newStatus: 'deleted' });
`,
  },

  // ── assignCrewToJobById.js ───────────────────────────────────
  {
    file: "assignCrewToJobById.js",
    search: `    return res.json({
      success: true,
      message: 'Crew assigned successfully',`,
    inject: `    // Log job action
    logJobAction({ jobId: numericJobId || jobId, actionType: 'crew_assigned', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: (req.user && req.user.role) || 'manager', permissionLevel: 'manager' });
`,
  },

  // ── assignTrucksToJobById.js ─────────────────────────────────
  {
    file: "assignTrucksToJobById.js",
    search: `    return res.json({
      success: true,
      message: 'Trucks assigned successfully',`,
    inject: `    // Log job action
    logJobAction({ jobId: numericJobId || jobId, actionType: 'truck_assigned', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: (req.user && req.user.role) || 'manager', permissionLevel: 'manager' });
`,
  },
];

// Try alternate success messages if primary doesn't match
const ALTERNATES = {
  "completeJobById.js": [
    `    res.json({
      success: true,
      message: 'Job completed successfully',`,
    `    return res.status(200).json({
      success: true,`,
  ],
  "deleteJobById.js": [
    `    res.json({
      success: true,
      message: 'Job deleted successfully',`,
    `    return res.status(200).json({
      success: true,`,
    `      success: true,\n      message: 'Job deleted',`,
  ],
  "assignCrewToJobById.js": [
    `    res.json({
      success: true,
      message: 'Crew assigned successfully',`,
    `      success: true,`,
  ],
  "assignTrucksToJobById.js": [
    `    res.json({
      success: true,
      message: 'Trucks assigned successfully',`,
    `      success: true,`,
  ],
};

let patched = 0;
let skipped = 0;
let failed = 0;

for (const p of patches) {
  const filePath = path.join(BASE, p.file);

  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${p.file}`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");

  // Count existing calls
  const occurrences = (content.match(/logJobAction\s*\(/g) || []).length;
  if (occurrences >= 2) {
    console.log(
      `SKIP (already has ${occurrences} logJobAction calls): ${p.file}`,
    );
    skipped++;
    continue;
  }

  // Try the primary search string
  let searchStr = p.search;
  let found = content.includes(searchStr);

  // Try alternates if primary didn't match
  if (!found && ALTERNATES[p.file]) {
    for (const alt of ALTERNATES[p.file]) {
      if (content.includes(alt)) {
        searchStr = alt;
        found = true;
        break;
      }
    }
  }

  if (!found) {
    // Dump first few res.json occurrences for debugging
    const matches = [];
    const re = /res\.(?:status\(\d+\)\.)?json\(\{[^}]{0,60}/g;
    let m;
    while ((m = re.exec(content)) !== null && matches.length < 5) {
      matches.push(JSON.stringify(m[0]));
    }
    console.log(`FAILED (search string not found): ${p.file}`);
    console.log(`  Available res.json patterns:`, matches.join("\n  "));
    failed++;
    continue;
  }

  // Make backup
  fs.writeFileSync(filePath + ".bak2", content);

  // Inject BEFORE the found string
  const newContent = content.replace(searchStr, p.inject + searchStr);
  fs.writeFileSync(filePath, newContent);

  console.log(`PATCHED: ${p.file}`);
  patched++;
}

console.log(
  `\n=== SUMMARY: ${patched} patched, ${skipped} skipped, ${failed} failed ===`,
);

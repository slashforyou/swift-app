const fs = require("fs");
const filePath = "/srv/www/htdocs/swiftapp/server/endPoints/v1/startJobById.js";
let content = fs.readFileSync(filePath, "utf8");

// Check if already patched
const count = (content.match(/logJobAction\s*\(/g) || []).length;
if (count >= 2) {
  console.log("ALREADY PATCHED:", count, "calls found");
  process.exit(0);
}

// The search string with 6-space indentation (as found in the file)
const search = `      res.json({
        success: true,
        message: 'Job started successfully',`;

const inject = `      // Log job action
      logJobAction({ jobId, actionType: 'job_started', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: (req.user && req.user.role) || 'employee', permissionLevel: 'manager', oldStatus: currentStatus, newStatus: 'started' });
`;

if (!content.includes(search)) {
  // Try 4-space indent
  const search2 = `    res.json({
      success: true,
      message: 'Job started successfully',`;
  const inject2 = `    // Log job action
    logJobAction({ jobId, actionType: 'job_started', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: (req.user && req.user.role) || 'employee', permissionLevel: 'manager', oldStatus: currentStatus, newStatus: 'started' });
`;
  if (content.includes(search2)) {
    fs.writeFileSync(filePath + ".bak2", content);
    fs.writeFileSync(filePath, content.replace(search2, inject2 + search2));
    console.log("PATCHED with 4-space indent");
  } else {
    // Fuzzy: find 'Job started successfully' and inject before the res.json above it
    const idx = content.indexOf("'Job started successfully'");
    if (idx < 0) {
      console.log("FAILED: cannot locate success message");
      process.exit(1);
    }
    // Find the nearest res.json before this position
    const before = content.lastIndexOf("res.json({", idx);
    if (before < 0) {
      console.log("FAILED: cannot locate res.json before success message");
      process.exit(1);
    }
    // Get the indentation of that line
    const lineStart = content.lastIndexOf("\n", before) + 1;
    const indent = content.substring(lineStart, before);
    const callLine = `${indent}// Log job action\n${indent}logJobAction({ jobId, actionType: 'job_started', userId: req.user && req.user.id, companyId: req.user && req.user.company_id, actorRole: (req.user && req.user.role) || 'employee', permissionLevel: 'manager', oldStatus: currentStatus, newStatus: 'started' });\n`;
    fs.writeFileSync(filePath + ".bak2", content);
    fs.writeFileSync(
      filePath,
      content.slice(0, lineStart) + callLine + content.slice(lineStart),
    );
    console.log("PATCHED with fuzzy method, indent:", JSON.stringify(indent));
  }
} else {
  fs.writeFileSync(filePath + ".bak2", content);
  fs.writeFileSync(filePath, content.replace(search, inject + search));
  console.log("PATCHED with 6-space indent");
}

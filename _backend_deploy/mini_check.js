const fs = require("fs");
[
  "acceptJob.js",
  "jobs/acceptCounterProposal.js",
  "jobs/rejectCounterProposal.js",
].forEach(function (f) {
  const full = "/srv/www/htdocs/swiftapp/server/endPoints/v1/" + f;
  try {
    const c = fs.readFileSync(full, "utf8");
    // Find swiftDb require line
    const m = c.match(/const \{[^}]+\} = require\(["'][^"']+swiftDb["']\);/);
    if (m) console.log(f + ":", JSON.stringify(m[0]));
    else console.log(f + ": NO_MATCH");
    // Check if already patched
    console.log("  hasLogJobAction:", c.includes("logJobAction"));
  } catch (e) {
    console.log(f + ": ERROR", e.message);
  }
});

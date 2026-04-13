#!/usr/bin/env node
/**
 * fix_company_doc_target.js
 * 
 * Patches the /document endpoint to accept a `target=company` parameter.
 * When target=company, skip person lookup and keep targetType='account'.
 * This allows uploading company verification documents.
 */
const fs = require('fs');

const filePath = process.argv[2] || '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';
console.log(`📄 Reading: ${filePath}`);

let code = fs.readFileSync(filePath, 'utf8');

// First, undo the partial sed that added explicitTarget but broke the if block
// Check if the explicitTarget line was already added
if (code.includes('const explicitTarget = req.body.target;')) {
  console.log('⚠️  Previous partial patch detected (explicitTarget line). Cleaning up...');
  // Remove the duplicated lines added by the failed sed
  code = code.replace(
    /    \/\/ If client explicitly requests company-level \(target=company\), skip person lookup\n    const explicitTarget = req\.body\.target;\n/g,
    ''
  );
}

// Find the target section
const marker = "    // 3. Determine target: Person-level OR Account-level verification";
const markerIdx = code.indexOf(marker);

if (markerIdx === -1) {
  console.error('❌ Could not find target determination section');
  process.exit(1);
}

// Find the "if (businessType === 'company') {" after the marker
const afterMarker = code.substring(markerIdx);
const oldIfMatch = afterMarker.match(/    if \(businessType === 'company'\) \{/);

if (!oldIfMatch) {
  // Check if already patched
  if (afterMarker.includes("explicitTarget === 'company'")) {
    console.log('✅ Already patched! Nothing to do.');
    process.exit(0);
  }
  console.error('❌ Could not find businessType company check');
  process.exit(1);
}

const oldIf = "    if (businessType === 'company') {";
const newCode = `    // If client explicitly requests company-level (target=company), skip person lookup
    const explicitTarget = req.body.target;

    if (explicitTarget === 'company') {
      // Client explicitly targets company-level verification (e.g. company.verification.document)
      console.log('📄 [Stripe Onboarding] Explicit target=company, skipping person lookup');
      targetType = 'account';
      targetPersonId = null;
    } else if (businessType === 'company') {`;

// Replace only the first occurrence after the marker
const beforeMarker = code.substring(0, markerIdx);
const afterMarkerStr = code.substring(markerIdx);
const replaced = afterMarkerStr.replace(oldIf, newCode);

if (replaced === afterMarkerStr) {
  console.error('❌ Replacement failed - string not found');
  process.exit(1);
}

code = beforeMarker + replaced;

// Write back
fs.writeFileSync(filePath, code, 'utf8');
console.log('✅ Patched successfully!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
const verifyLines = verify.split('\n');
const targetLine = verifyLines.findIndex(l => l.includes('explicitTarget'));
if (targetLine !== -1) {
  console.log(`\n📋 Lines ${targetLine - 1} to ${targetLine + 10}:`);
  for (let i = Math.max(0, targetLine - 1); i <= Math.min(verifyLines.length - 1, targetLine + 10); i++) {
    console.log(`  ${i + 1}: ${verifyLines[i]}`);
  }
}

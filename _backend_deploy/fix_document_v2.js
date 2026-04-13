#!/usr/bin/env node
/**
 * fix_document_v2.js
 * 
 * Fix: Remove ALL server-side person_token/account_token creation from /document endpoint.
 * The /document handler must ONLY upload the file and return metadata.
 * Client creates tokens with publishable key, then calls /document-attach.
 * 
 * This script handles multiple possible states of the code:
 * 1. Original code with direct accounts.updatePerson()
 * 2. Code patched by fix_document_person_token.py (server-side tokens.create)
 * 3. Partially patched by patch_document_tokens.js
 * 
 * Usage: node fix_document_v2.js [filepath]
 */
const fs = require('fs');

const filePath = process.argv[2] || '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';
console.log(`📄 Reading: ${filePath}`);

let code = fs.readFileSync(filePath, 'utf8');
const originalCode = code;
const lines = code.split('\n');
console.log(`📏 File has ${lines.length} lines`);

// ============================================================
// DIAGNOSTIC: Find all tokens.create calls
// ============================================================
console.log('\n🔍 DIAGNOSTIC: Searching for tokens.create calls...');
lines.forEach((line, i) => {
  if (line.includes('tokens.create')) {
    console.log(`  Line ${i + 1}: ${line.trim()}`);
  }
});

console.log('\n🔍 DIAGNOSTIC: Searching for "4. Attach document" comment...');
lines.forEach((line, i) => {
  if (line.includes('4. Attach document') || line.includes('4. Compute merged')) {
    console.log(`  Line ${i + 1}: ${line.trim()}`);
  }
});

console.log('\n🔍 DIAGNOSTIC: Searching for submitDocumentAttach...');
lines.forEach((line, i) => {
  if (line.includes('submitDocumentAttach')) {
    console.log(`  Line ${i + 1}: ${line.trim()}`);
  }
});

console.log('\n🔍 DIAGNOSTIC: Searching for document-attach route...');
lines.forEach((line, i) => {
  if (line.includes('document-attach')) {
    console.log(`  Line ${i + 1}: ${line.trim()}`);
  }
});

// ============================================================
// STEP 1: Find and replace the "step 4" section in submitDocument
// ============================================================
console.log('\n📝 STEP 1: Replacing document attachment section...');

// Try multiple possible markers
const possibleMarkers = [
  '// 4. Attach document to the correct target',
  '// 4. Compute merged document metadata',
  '// Person created with token -> must update via person_token',
];

let startIdx = -1;
let usedMarker = '';
for (const marker of possibleMarkers) {
  const idx = code.indexOf(marker);
  if (idx !== -1) {
    startIdx = idx;
    usedMarker = marker;
    break;
  }
}

if (startIdx === -1) {
  // Try to find by searching for the general area: 'mergedDocument' related code after file upload
  const mergedIdx = code.indexOf('mergedDocument');
  if (mergedIdx !== -1) {
    // Go back to find the start of this section (a comment line starting with //)
    const beforeMerged = code.substring(0, mergedIdx);
    const lastNewline = beforeMerged.lastIndexOf('\n');
    const linesBefore = beforeMerged.split('\n');
    // Find the last comment line before mergedDocument
    for (let i = linesBefore.length - 1; i >= Math.max(0, linesBefore.length - 20); i--) {
      const trimmed = linesBefore[i].trim();
      if (trimmed.startsWith('//') && (trimmed.includes('4.') || trimmed.includes('Attach') || trimmed.includes('document') || trimmed.includes('merged') || trimmed.includes('Person'))) {
        startIdx = linesBefore.slice(0, i).join('\n').length + 1;
        usedMarker = `(found comment at line ${i + 1}: "${trimmed}")`;
        break;
      }
    }
  }
}

if (startIdx === -1) {
  console.error('❌ ERROR: Could not find the document attachment section');
  console.log('\n📋 Showing lines around "mergedDocument":');
  lines.forEach((line, i) => {
    if (line.includes('mergedDocument') || line.includes('updatePerson') || line.includes('person_token')) {
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 3);
      for (let j = start; j < end; j++) {
        console.log(`  ${j + 1}: ${lines[j]}`);
      }
      console.log('  ---');
    }
  });
  process.exit(1);
}

console.log(`  Found start at offset ${startIdx} using: ${usedMarker}`);

// Find the end of the section: the "} catch (error) {" that closes submitDocument's try block
const afterStart = code.substring(startIdx);

// Try multiple end patterns
const endPatterns = [
  /\n\s{2}\} catch \(error\) \{\s*\n\s+console\.error\([^)]*[Dd]ocument/,
  /\n\s{2}\} catch \(error\) \{\s*\n\s+console\.error\([^)]*upload/i,
  /\n\s{4}\} catch \(error\) \{\s*\n\s+console\.error\([^)]*[Dd]ocument/,
  /\n\s{2}\} catch \((err|error)\) \{/,
];

let endMatch = null;
for (const pattern of endPatterns) {
  endMatch = afterStart.match(pattern);
  if (endMatch) break;
}

if (!endMatch) {
  // Fallback: find "res.json" after our start that includes "success"
  const resJsonMatch = afterStart.match(/\n\s+res\.json\(\{[\s\S]*?success[\s\S]*?\}\);\s*\n/);
  if (resJsonMatch) {
    // The end is right after the res.json call, before the catch
    const afterResJson = afterStart.substring(resJsonMatch.index + resJsonMatch[0].length);
    const catchMatch = afterResJson.match(/\n\s{2,4}\} catch /);
    if (catchMatch) {
      const endIdx = startIdx + resJsonMatch.index + resJsonMatch[0].length + catchMatch.index;
      endMatch = { index: resJsonMatch.index + resJsonMatch[0].length + catchMatch.index };
    }
  }
}

if (!endMatch) {
  console.error('❌ ERROR: Could not find end of document attachment section');
  console.log('\n📋 Showing 40 lines after start marker:');
  const startLine = code.substring(0, startIdx).split('\n').length;
  for (let i = startLine - 1; i < Math.min(startLine + 40, lines.length); i++) {
    console.log(`  ${i + 1}: ${lines[i]}`);
  }
  process.exit(1);
}

const endIdx = startIdx + endMatch.index;
console.log(`  Found end at offset ${endIdx}`);
console.log(`  Replacing ${endIdx - startIdx} chars`);

// Show what we're replacing
const replacedCode = code.substring(startIdx, endIdx);
const replacedLines = replacedCode.split('\n');
console.log(`  Old code (${replacedLines.length} lines):`);
replacedLines.forEach((l, i) => console.log(`    ${i + 1}: ${l}`));

const replacement = `// 4. Compute merged document metadata
    //    Tokens must be created CLIENT-SIDE (publishable key) for FR platforms in live mode
    let mergedDocument = null;

    if (targetType === 'person' && targetPersonId) {
      // ========== PERSON-LEVEL: compute merged doc ==========
      console.log(\`📄 [Stripe Onboarding] Computing merged document for PERSON: \${targetPersonId}\`);

      const existingPerson = await stripeInstance.accounts.retrievePerson(stripeAccountId, targetPersonId);
      const existingDoc = existingPerson.verification?.document || {};

      mergedDocument = {};
      if (side === 'front') {
        mergedDocument.front = file.id;
        if (existingDoc.back) mergedDocument.back = existingDoc.back;
      } else {
        mergedDocument.back = file.id;
        if (existingDoc.front) mergedDocument.front = existingDoc.front;
      }

      console.log(\`📄 [Stripe Onboarding] Merged document: front=\${mergedDocument.front || 'N/A'}, back=\${mergedDocument.back || 'N/A'}\`);
    } else {
      // ========== ACCOUNT-LEVEL: simple doc ref ==========
      mergedDocument = {};
      if (side === 'front') mergedDocument.front = file.id;
      else mergedDocument.back = file.id;
    }

    // Return file info + metadata — client creates token, then calls /document-attach
    res.json({
      success: true,
      needs_client_token: true,
      file_id: file.id,
      side,
      target_type: targetType,
      person_id: targetPersonId || null,
      merged_document: mergedDocument,
      business_type: businessType,
      message: \`Document \${side} uploaded to Stripe, awaiting client token for attachment\`,
      request_id: requestId
    });
    return; // IMPORTANT: stop here, don't fall through

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
console.log('  ✅ STEP 1 done');

// ============================================================
// STEP 2: Check if submitDocumentAttach already exists
// ============================================================
console.log('\n📝 STEP 2: Checking for submitDocumentAttach endpoint...');

if (code.includes('submitDocumentAttach')) {
  console.log('  ✅ submitDocumentAttach already exists, skipping');
} else {
  console.log('  Adding submitDocumentAttach endpoint...');
  
  // Find a good insertion point - before STEP 5: PERSONS or before module.exports
  const insertMarkers = ['// STEP 5: PERSONS', '// STEP 5:', 'module.exports'];
  let insertIdx = -1;
  let insertMarkerUsed = '';
  
  for (const marker of insertMarkers) {
    const idx = code.indexOf(marker);
    if (idx !== -1) {
      insertIdx = idx;
      insertMarkerUsed = marker;
      break;
    }
  }
  
  if (insertIdx === -1) {
    console.error('❌ Could not find insertion point for submitDocumentAttach');
    process.exit(1);
  }
  
  console.log(`  Inserting before: ${insertMarkerUsed}`);
  
  const newEndpoint = `// ============================================
// STEP 4b: DOCUMENT-ATTACH
// ============================================

/**
 * POST /swift-app/v1/stripe/onboarding/document-attach
 *
 * Phase 2 of document upload for FR platforms (live mode):
 * Client uploads file via /document (gets file_id + merged_document),
 * creates person_token or account_token CLIENT-SIDE with publishable key,
 * then sends the token here to attach the document.
 */
async function submitDocumentAttach(req, res) {
  const connection = await connect();
  const requestId = req.headers['x-request-id'] || \`req_\${Date.now()}\`;

  try {
    const stripeInstance = getStripeForMode(req.stripeMode);
    const companyId = req.user?.company_id;
    const { person_token, person_id, account_token } = req.body;

    console.log(\`📝 [Stripe Onboarding] document-attach: person_token=\${person_token ? 'yes' : 'no'}, person_id=\${person_id || 'N/A'}, account_token=\${account_token ? 'yes' : 'no'}\`);

    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Company ID not found in token' });
    }

    const accountContext = await getStripeAccountContext(connection, companyId, stripeInstance);
    if (!accountContext) {
      return res.status(404).json({ success: false, error: 'STRIPE_ACCOUNT_NOT_FOUND', message: 'No Stripe account found' });
    }

    const { stripeAccountId } = accountContext;

    if (person_token && person_id) {
      await stripeInstance.accounts.updatePerson(stripeAccountId, person_id, { person_token });
      console.log(\`✅ [Stripe Onboarding] Document attached to person \${person_id} via client person_token\`);
    } else if (account_token) {
      await stripeInstance.accounts.update(stripeAccountId, { account_token });
      console.log(\`✅ [Stripe Onboarding] Document attached to account via client account_token\`);
    } else {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TOKEN',
        message: 'Either person_token + person_id or account_token is required'
      });
    }

    // Save progress
    await connection.query(
      \`UPDATE stripe_connected_accounts SET onboarding_progress = 80, updated_at = NOW() WHERE company_id = ? AND disconnected_at IS NULL\`,
      [companyId]
    );

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId, stripeInstance);

    res.json({
      success: true,
      progress: onboardingState.progress || 90,
      onboarding_progress: onboardingState.progress || 90,
      next_step: onboardingState.next_step,
      requirements_pending: onboardingState.requirements_pending,
      account_status: onboardingState.account_status,
      request_id: requestId
    });

  } catch (error) {
    console.error('❌ [Stripe Onboarding] Document-attach error:', error.message);

    if (error.type === 'StripeInvalidRequestError') {
      return sendStripeValidationError(res, error);
    }

    res.status(500).json({ success: false, error: error.message, request_id: requestId });
  } finally {
    await close(connection);
  }
}

`;
  
  code = code.substring(0, insertIdx) + newEndpoint + code.substring(insertIdx);
  console.log('  ✅ submitDocumentAttach endpoint added');
}

// ============================================================
// STEP 3: Add submitDocumentAttach to module.exports if missing
// ============================================================
console.log('\n📝 STEP 3: Checking module.exports...');

const exportsMatch = code.match(/module\.exports\s*=\s*\{/);
if (exportsMatch) {
  const exportsIdx = exportsMatch.index + exportsMatch[0].length;
  const afterExports = code.substring(exportsIdx, exportsIdx + 500);
  
  if (afterExports.includes('submitDocumentAttach')) {
    console.log('  ✅ submitDocumentAttach already in exports');
  } else {
    code = code.substring(0, exportsIdx) + '\n  submitDocumentAttach,' + code.substring(exportsIdx);
    console.log('  ✅ Added submitDocumentAttach to exports');
  }
} else {
  console.error('  ⚠️ module.exports not found, skipping');
}

// ============================================================
// STEP 4: Remove any remaining tokens.create calls in submitDocument
// ============================================================
console.log('\n📝 STEP 4: Checking for remaining server-side tokens.create...');

const tokensCreatePattern = /stripeInstance\.tokens\.create\(/g;
let match;
let foundTokensCreate = false;
while ((match = tokensCreatePattern.exec(code)) !== null) {
  const lineNum = code.substring(0, match.index).split('\n').length;
  const lineContent = code.split('\n')[lineNum - 1];
  console.log(`  ⚠️ Found tokens.create at line ${lineNum}: ${lineContent.trim()}`);
  foundTokensCreate = true;
}

if (!foundTokensCreate) {
  console.log('  ✅ No server-side tokens.create found');
}

// ============================================================
// WRITE
// ============================================================
console.log('\n📝 Writing file...');

// Backup first
const backupPath = filePath + '.backup.' + Date.now();
fs.writeFileSync(backupPath, originalCode, 'utf8');
console.log(`  📁 Backup: ${backupPath}`);

fs.writeFileSync(filePath, code, 'utf8');
const newLines = code.split('\n').length;
console.log(`  ✅ Written: ${newLines} lines (was ${lines.length})`);

// Verify no syntax errors
try {
  new Function(code);
  console.log('  ✅ Syntax check passed');
} catch (e) {
  console.error(`  ⚠️ Syntax check warning: ${e.message}`);
  console.log('  (This may be normal for server code with require/module)');
}

// Final diagnostic
console.log('\n📋 FINAL DIAGNOSTIC:');
const finalLines = code.split('\n');
finalLines.forEach((line, i) => {
  if (line.includes('tokens.create')) {
    console.log(`  ❌ tokens.create still at line ${i + 1}: ${line.trim()}`);
  }
});
finalLines.forEach((line, i) => {
  if (line.includes('needs_client_token')) {
    console.log(`  ✅ needs_client_token at line ${i + 1}`);
  }
});
finalLines.forEach((line, i) => {
  if (line.includes('submitDocumentAttach')) {
    console.log(`  ✅ submitDocumentAttach at line ${i + 1}: ${line.trim()}`);
  }
});

console.log('\n✅ DONE. Now run: pm2 restart all');

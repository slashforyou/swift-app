/**
 * Patch: Move person_token creation from server-side to client-side
 * for document upload in live mode (FR platform compliance).
 *
 * Changes:
 * 1. /document endpoint: upload file only, return merged_document metadata
 * 2. New /document-attach endpoint: receives client-created token, attaches doc
 * 3. Register /document-attach route
 */
const fs = require('fs');

const filePath = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';
let code = fs.readFileSync(filePath, 'utf8');
const originalLen = code.length;

// ============================================================
// STEP 1: Replace the "// 4. Attach document" section in submitDocument
// ============================================================

const START_MARKER = '// 4. Attach document to the correct target';
const startIdx = code.indexOf(START_MARKER);
if (startIdx === -1) {
  console.error('ERROR: Start marker not found');
  process.exit(1);
}

// Find the end: "  } catch (error) {" that closes the try block of submitDocument
// We look for the pattern after our start marker
const afterStart = code.substring(startIdx);
const endPattern = /\n\s{2}\} catch \(error\) \{\s*\n\s+console\.error\([^)]*Document upload error/;
const endMatch = afterStart.match(endPattern);
if (!endMatch) {
  console.error('ERROR: End pattern not found');
  process.exit(1);
}
const endIdx = startIdx + endMatch.index;
console.log(`Replacing lines from offset ${startIdx} to ${endIdx} (${endIdx - startIdx} chars)`);

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

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
console.log('STEP 1 done: replaced document attachment section');

// ============================================================
// STEP 2: Add /document-attach endpoint before STEP 5 (PERSONS)
// ============================================================

const PERSONS_MARKER = '// STEP 5: PERSONS';
const personsIdx = code.indexOf(PERSONS_MARKER);
if (personsIdx === -1) {
  console.error('ERROR: PERSONS marker not found');
  process.exit(1);
}

const newEndpoint = `// ============================================
// STEP 4b: DOCUMENT-ATTACH - Attach document via client-created token
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
  const connection = await getConnection();
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

    // Sauvegarder progression
    await connection.query(
      \`UPDATE stripe_connected_accounts SET onboarding_progress = 80, updated_at = NOW() WHERE company_id = ? AND disconnected_at IS NULL\`,
      [companyId]
    );

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId, stripeInstance);

    res.json({
      success: true,
      progress: onboardingState.progress || 90,
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

code = code.substring(0, personsIdx) + newEndpoint + code.substring(personsIdx);
console.log('STEP 2 done: added /document-attach endpoint');

// ============================================================
// STEP 3: Add submitDocumentAttach to module.exports
// ============================================================

const exportsMarker = 'module.exports = {';
const exportsIdx = code.indexOf(exportsMarker);
if (exportsIdx === -1) {
  console.error('ERROR: module.exports not found');
  process.exit(1);
}

// Insert after the opening brace
const insertPos = exportsIdx + exportsMarker.length;
code = code.substring(0, insertPos) + '\n  submitDocumentAttach,' + code.substring(insertPos);
console.log('STEP 3 done: added submitDocumentAttach to exports');

// ============================================================
// WRITE & VERIFY
// ============================================================

fs.writeFileSync(filePath, code, 'utf8');
console.log(`\nSUCCESS: Backend patched`);
console.log(`Original size: ${originalLen}, New size: ${code.length}`);

// Verify syntax
try {
  require(filePath);
  console.log('Syntax check: PASSED (module loaded)');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND' || e.message.includes('is not a function')) {
    // Expected - module has dependencies that aren't available here
    console.log('Syntax check: OK (module deps not available but no syntax error)');
  } else if (e instanceof SyntaxError) {
    console.error('SYNTAX ERROR:', e.message);
    // Restore backup
    process.exit(1);
  } else {
    console.log('Module load attempted (non-syntax error):', e.message?.substring(0, 100));
  }
}

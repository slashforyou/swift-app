#!/usr/bin/env node
/**
 * fix_document_route.js
 * 
 * Ensures /document-attach route is registered in the server's index.js
 * 
 * Usage: node fix_document_route.js [filepath]
 */
const fs = require('fs');

const filePath = process.argv[2] || '/srv/www/htdocs/swiftapp/server/index.js';
console.log(`📄 Reading: ${filePath}`);

let code = fs.readFileSync(filePath, 'utf8');
const originalCode = code;

// Check if route already exists
if (code.includes('document-attach')) {
  console.log('✅ /document-attach route already registered');
  
  // Show the line
  const lines = code.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('document-attach')) {
      console.log(`  Line ${i + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('⚠️ /document-attach route NOT found, adding it...');
  
  // Find the /document route to add /document-attach next to it
  const documentRoutePattern = /router\.post\([^)]*\/document['"]/;
  const documentMatch = code.match(documentRoutePattern);
  
  if (documentMatch) {
    // Find the end of this line
    const matchIdx = documentMatch.index;
    const afterMatch = code.substring(matchIdx);
    const lineEnd = afterMatch.indexOf('\n');
    const insertPoint = matchIdx + lineEnd + 1;
    
    const existingLine = code.substring(matchIdx, matchIdx + lineEnd);
    console.log(`  Found document route: ${existingLine.trim()}`);
    
    // Extract patterns from the existing route to maintain consistency
    // Try to find the auth middleware pattern
    const authPattern = existingLine.match(/(auth\w*|authenticate\w*|verifyToken\w*)/);
    const authMiddleware = authPattern ? authPattern[1] : 'authenticateToken';
    
    // Try to find the stripe mode middleware
    const stripeModePattern = existingLine.match(/(setStripeMode|stripeMode\w*)/);
    const stripeMiddleware = stripeModePattern ? stripeModePattern[1] : 'setStripeMode';
    
    // Check if there's a multer middleware on the document route
    const hasMulter = existingLine.includes('upload') || existingLine.includes('multer');
    
    // Create the new route line (NO multer since document-attach receives JSON, not files)
    let newRoute;
    if (existingLine.includes('onboarding.')) {
      // Pattern: router.post('/path', middleware, onboarding.handler)
      newRoute = existingLine
        .replace(/\/document['"]/, "/document-attach'")
        .replace(/\/document"/, '/document-attach"')
        .replace(/onboarding\.\w+/, 'onboarding.submitDocumentAttach');
      
      // Remove multer middleware if present (document-attach doesn't handle files)
      newRoute = newRoute.replace(/,?\s*upload\.\w+\([^)]*\)\s*,?/, ',');
      // Clean up double commas
      newRoute = newRoute.replace(/,\s*,/g, ',');
    } else {
      newRoute = `router.post('/onboarding/document-attach', ${authMiddleware}, ${stripeMiddleware}, onboarding.submitDocumentAttach);`;
    }
    
    console.log(`  Adding route: ${newRoute.trim()}`);
    code = code.substring(0, insertPoint) + newRoute + '\n' + code.substring(insertPoint);
  } else {
    // Fallback: find any stripe onboarding route section
    const onboardingSection = code.indexOf("'/onboarding/");
    if (onboardingSection === -1) {
      console.error('❌ Could not find onboarding routes section');
      
      // Show all router.post lines
      const lines = code.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('router.post') && line.includes('stripe')) {
          console.log(`  Line ${i + 1}: ${line.trim()}`);
        }
      });
      process.exit(1);
    }
    
    // Find end of line after the onboarding route
    const afterSection = code.substring(onboardingSection);
    const lineEnd = afterSection.indexOf('\n');
    const insertPoint = onboardingSection + lineEnd + 1;
    
    const newRoute = `router.post('/onboarding/document-attach', authenticateToken, setStripeMode, onboarding.submitDocumentAttach);\n`;
    code = code.substring(0, insertPoint) + newRoute + code.substring(insertPoint);
    console.log(`  Added generic route`);
  }
  
  // Write
  const backupPath = filePath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, originalCode, 'utf8');
  console.log(`  📁 Backup: ${backupPath}`);
  
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('  ✅ Route added');
}

// Also verify the onboarding require
if (code.includes('submitDocumentAttach')) {
  console.log('✅ submitDocumentAttach reference found in routes');
} else {
  console.log('⚠️ submitDocumentAttach not found - will be available after fix_document_v2.js adds it to exports');
}

console.log('\n✅ DONE');

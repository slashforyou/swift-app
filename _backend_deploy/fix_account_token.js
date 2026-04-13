/**
 * Fix: Update startOnboarding to use account_token from client
 * 
 * FR-based platforms MUST create Custom accounts via account tokens.
 * The token is created client-side with the publishable key and sent to the server.
 */
const fs = require('fs');
const FILE = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';

let content = fs.readFileSync(FILE, 'utf8');
const original = content;

// Find the custom account config section and replace it to use account_token
const oldPattern = `if (accountType === 'custom') {
      // Mode Custom: direct fields (no account_token - tokens can only be created client-side in live mode)
      stripeAccountConfig.type = 'custom';
      stripeAccountConfig.business_type = businessType;
      stripeAccountConfig.tos_acceptance = {
        date: Math.floor(Date.now() / 1000),
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1'
      };

      console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account: business_type=" + businessType + ", tos accepted");`;

const newPattern = `if (accountType === 'custom') {
      stripeAccountConfig.type = 'custom';
      // FR-based platforms require account tokens for Custom accounts.
      // Token is created client-side with publishable key and contains business_type + tos_acceptance.
      if (req.body.account_token) {
        stripeAccountConfig.account_token = req.body.account_token;
        console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account with account_token from client");
      } else {
        // Fallback: direct fields (may fail for FR-based platforms)
        stripeAccountConfig.business_type = businessType;
        stripeAccountConfig.tos_acceptance = {
          date: Math.floor(Date.now() / 1000),
          ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1'
        };
        console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account: business_type=" + businessType + ", tos accepted (no token)");
      }`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(FILE, content, 'utf8');
  console.log('✅ Fix applied: startOnboarding now uses account_token from client');
} else {
  // Try to find approximate match
  const lines = content.split('\n');
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("if (accountType === 'custom')") && i > 280) {
      console.log(`Found custom block at line ${i + 1}: ${lines[i].trim()}`);
      // Show context
      for (let j = i; j < Math.min(i + 15, lines.length); j++) {
        console.log(`  ${j + 1}: ${lines[j]}`);
      }
      found = true;
      break;
    }
  }
  if (!found) {
    console.log('❌ Could not find custom account block');
  } else {
    console.log('❌ Pattern found but exact match failed. Trying line-by-line replacement...');
    
    // Find the exact line range and replace
    let startIdx = -1;
    let endIdx = -1;
    for (let i = 280; i < lines.length; i++) {
      if (lines[i].includes("if (accountType === 'custom')")) {
        startIdx = i;
      }
      if (startIdx >= 0 && lines[i].includes('console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account:')) {
        endIdx = i;
        break;
      }
      if (startIdx >= 0 && lines[i].includes('console.log') && lines[i].includes('Custom account') && lines[i].includes('business_type')) {
        endIdx = i;
        break;
      }
    }
    
    if (startIdx >= 0 && endIdx >= 0) {
      console.log(`Replacing lines ${startIdx + 1} to ${endIdx + 1}`);
      const newLines = [
        `    if (accountType === 'custom') {`,
        `      stripeAccountConfig.type = 'custom';`,
        `      // FR-based platforms require account tokens for Custom accounts.`,
        `      // Token is created client-side with publishable key and contains business_type + tos_acceptance.`,
        `      if (req.body.account_token) {`,
        `        stripeAccountConfig.account_token = req.body.account_token;`,
        `        console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account with account_token from client");`,
        `      } else {`,
        `        // Fallback: direct fields (may fail for FR-based platforms)`,
        `        stripeAccountConfig.business_type = businessType;`,
        `        stripeAccountConfig.tos_acceptance = {`,
        `          date: Math.floor(Date.now() / 1000),`,
        `          ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1'`,
        `        };`,
        `        console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account: business_type=" + businessType + ", tos accepted (no token)");`,
        `      }`
      ];
      lines.splice(startIdx, endIdx - startIdx + 1, ...newLines);
      fs.writeFileSync(FILE, lines.join('\n'), 'utf8');
      console.log('✅ Fix applied via line-by-line replacement');
    } else {
      console.log(`❌ Could not determine line range: start=${startIdx + 1}, end=${endIdx + 1}`);
    }
  }
}

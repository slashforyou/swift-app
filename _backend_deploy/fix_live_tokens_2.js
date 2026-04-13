const fs = require('fs');
const file = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';
let c = fs.readFileSync(file, 'utf8');

const lines = c.split('\n');
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("if (accountType === 'custom')") && startIdx === -1) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && lines[i].trim() === '} else {') {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log('ERROR: Could not find custom block. start=' + startIdx + ' end=' + endIdx);
  process.exit(1);
}

console.log('Found custom block at lines ' + (startIdx+1) + '-' + (endIdx+1));
console.log('Original:');
for (let i = startIdx; i <= endIdx; i++) console.log('  ' + lines[i]);

const newBlock = [
  "    if (accountType === 'custom') {",
  "      // Mode Custom: direct fields (no account_token - tokens can only be created client-side in live mode)",
  "      stripeAccountConfig.type = 'custom';",
  "      stripeAccountConfig.business_type = businessType;",
  "      stripeAccountConfig.tos_acceptance = {",
  "        date: Math.floor(Date.now() / 1000),",
  "        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1'",
  "      };",
  "",
  '      console.log("\\ud83d\\udcdd [Stripe Onboarding] Custom account: business_type=" + businessType + ", tos accepted");',
  "    } else {"
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newBlock);
fs.writeFileSync(file, lines.join('\n'));
console.log('\n✅ FIX 2 applied: startOnboarding now uses direct business_type + tos_acceptance');

const fs = require('fs');
const path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/connect.js';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find the line with onboardingCompleted
let targetLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const onboardingCompleted = account.charges_enabled')) {
    targetLine = i;
    break;
  }
}

if (targetLine === -1) {
  console.error('Could not find onboardingCompleted line');
  process.exit(1);
}

console.log('Found onboardingCompleted at line', targetLine + 1);
console.log('Before:', lines[targetLine]);
console.log('Before:', lines[targetLine + 1]);
console.log('Before:', lines[targetLine + 2]);

// Replace the 3-line expression with single-line
lines[targetLine] = '    // details_submitted = true means user finished the wizard';
lines[targetLine + 1] = '    // charges/payouts can be false during Stripe verification';
lines[targetLine + 2] = '    const onboardingCompleted = account.details_submitted === true;';

// Now find the response block and add status field
let responseLine = -1;
for (let i = targetLine; i < lines.length; i++) {
  if (lines[i].trim() === 'res.json({') {
    responseLine = i;
    break;
  }
}

if (responseLine === -1) {
  console.error('Could not find response block');
  process.exit(1);
}

console.log('\nFound response at line', responseLine + 1);

// Insert status computation and status field before res.json
const statusBlock = [
  '    // Determine proper status',
  '    const currentlyDue = account.requirements?.currently_due || [];',
  '    const pastDue = account.requirements?.past_due || [];',
  '    const disabledReason = account.requirements?.disabled_reason || null;',
  '    let accountStatus = "not_connected";',
  '    if (!account.details_submitted) {',
  '      accountStatus = "incomplete";',
  '    } else if (disabledReason) {',
  '      accountStatus = "restricted";',
  '    } else if (account.charges_enabled && account.payouts_enabled) {',
  '      accountStatus = "active";',
  '    } else {',
  '      accountStatus = "pending_verification";',
  '    }',
  ''
];

// Insert status block before res.json
lines.splice(responseLine, 0, ...statusBlock);

// Now find the stripe_account_id line (shifted by statusBlock.length)
const shiftedResponseLine = responseLine + statusBlock.length;
// Find the line with stripe_account_id in the response
for (let i = shiftedResponseLine; i < shiftedResponseLine + 5; i++) {
  if (lines[i].trim().startsWith('stripe_account_id:')) {
    // Insert status field after this line
    const indent = '        ';
    lines.splice(i + 1, 0, indent + 'status: accountStatus,');
    console.log('Added status field after line', i + 1);
    break;
  }
}

content = lines.join('\n');
fs.writeFileSync(path, content, 'utf8');
console.log('\n✅ Backend connect.js patched successfully');

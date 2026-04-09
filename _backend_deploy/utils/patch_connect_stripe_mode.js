// Patch connect.js to add stripe_mode to INSERT
const fs = require('fs');
const path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/connect.js';

let content = fs.readFileSync(path, 'utf8');

// Find and patch the INSERT statement
const oldInsert = `(company_id, stripe_account_id, account_type, charges_enabled,
        payouts_enabled, details_submitted, requirements_currently_due,
        requirements_eventually_due, requirements_past_due, capabilities,
        country, currency, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AU', 'AUD', ?)`;

const newInsert = `(company_id, stripe_account_id, stripe_mode, account_type, charges_enabled,
        payouts_enabled, details_submitted, requirements_currently_due,
        requirements_eventually_due, requirements_past_due, capabilities,
        country, currency, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AU', 'AUD', ?)`;

if (content.includes(oldInsert)) {
  content = content.replace(oldInsert, newInsert);
  console.log('✅ INSERT columns patched');
} else {
  console.log('⚠️ Could not find exact INSERT pattern — checking if already patched');
  if (content.includes('stripe_mode, account_type')) {
    console.log('ℹ️ Already patched');
    process.exit(0);
  } else {
    console.log('❌ INSERT pattern not found - manual patch needed');
    process.exit(1);
  }
}

// Now patch the values array to add the mode
const oldValues = `[
        company_id,
        account.id,
        account.type || accountType,`;

const newValues = `[
        company_id,
        account.id,
        (req.stripeMode || req.headers['x-stripe-mode'] || 'live'),
        account.type || accountType,`;

if (content.includes(oldValues)) {
  content = content.replace(oldValues, newValues);
  console.log('✅ VALUES array patched');
} else {
  console.log('⚠️ VALUES array pattern not matched — may need manual fix');
}

fs.writeFileSync(path, content);
console.log('✅ connect.js saved');

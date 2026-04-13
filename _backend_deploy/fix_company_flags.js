/**
 * Fix: Update company flags using account_token (FR-platform constraint)
 * 
 * Problem: After creating/updating persons in the /persons endpoint,
 * the backend tries to set company.directors_provided, executives_provided,
 * owners_provided directly — but FR-platform accounts require an account_token
 * for ALL company.* updates.
 * 
 * Solution: Accept account_token from client and use it for flag updates.
 */

const fs = require('fs');
const path = require('path');

const ONBOARDING_PATH = path.join(__dirname, 'endPoints', 'v1', 'stripe', 'onboarding.js');

let content = fs.readFileSync(ONBOARDING_PATH, 'utf8');

// Fix 1: The persons endpoint destructures req.body but doesn't include account_token
// Find: const { representative, owners, directors, executives, no_owners, single_person_mode, person_token } = req.body;
// Replace with: const { representative, owners, directors, executives, no_owners, single_person_mode, person_token, account_token } = req.body;

const oldDestructure = `const { representative, owners, directors, executives, no_owners, single_person_mode, person_token } = req.body;`;
const newDestructure = `const { representative, owners, directors, executives, no_owners, single_person_mode, person_token, account_token } = req.body;`;

if (content.includes(oldDestructure)) {
  content = content.replace(oldDestructure, newDestructure);
  console.log('✅ Fix 1: Added account_token to destructure');
} else if (content.includes(newDestructure)) {
  console.log('⏭️  Fix 1: Already applied');
} else {
  console.error('❌ Fix 1: Could not find destructure pattern');
}

// Fix 2: Replace the company flags update to use account_token when available
const oldFlagUpdate = `    try {
      await updateStripeAccount(connection, companyId, stripeAccountId, { company: companyFlags });
      console.log(\`✅ [Persons] Updated company flags:\`, companyFlags);
    } catch (flagError) {
      console.error(\`⚠️ [Persons] Error updating flags:\`, flagError.message);`;

const newFlagUpdate = `    try {
      if (account_token) {
        // FR-platform: use client-provided account_token (direct company.* updates are forbidden)
        await stripe.accounts.update(stripeAccountId, { account_token });
        console.log(\`✅ [Persons] Updated company flags via account_token\`);
      } else {
        await updateStripeAccount(connection, companyId, stripeAccountId, { company: companyFlags });
        console.log(\`✅ [Persons] Updated company flags directly:\`, companyFlags);
      }
    } catch (flagError) {
      console.error(\`⚠️ [Persons] Error updating flags:\`, flagError.message);`;

if (content.includes(oldFlagUpdate)) {
  content = content.replace(oldFlagUpdate, newFlagUpdate);
  console.log('✅ Fix 2: Updated flag update to use account_token');
} else if (content.includes('account_token') && content.includes('Updated company flags via account_token')) {
  console.log('⏭️  Fix 2: Already applied');
} else {
  console.error('❌ Fix 2: Could not find flag update pattern');
  // Dump nearby context for debugging
  const idx = content.indexOf('Updated company flags');
  if (idx > -1) {
    console.log('Context around "Updated company flags":');
    console.log(content.substring(Math.max(0, idx - 200), idx + 200));
  }
}

fs.writeFileSync(ONBOARDING_PATH, content, 'utf8');
console.log('\n✅ Patch applied. Restart PM2 to take effect.');

/**
 * Fix: Update server endpoints to use account_token and person_token from client.
 * 
 * For FR-based platforms, accounts created with account tokens can ONLY be
 * updated using account tokens. Person data also needs person tokens.
 */
const fs = require('fs');
const FILE = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';

let content = fs.readFileSync(FILE, 'utf8');
let changeCount = 0;

// ===== FIX 1: Modify updateStripeAccount to accept optional accountToken =====
const oldUpdateStripeAccount = `async function updateStripeAccount(connection, companyId, stripeAccountId, accountData, stripeInst) {`;
const newUpdateStripeAccount = `async function updateStripeAccount(connection, companyId, stripeAccountId, accountData, stripeInst, accountToken) {`;
if (content.includes(oldUpdateStripeAccount)) {
  content = content.replace(oldUpdateStripeAccount, newUpdateStripeAccount);
  changeCount++;
  console.log('✅ Fix 1a: Added accountToken param to updateStripeAccount');
} else if (content.includes(newUpdateStripeAccount)) {
  console.log('ℹ️ Fix 1a: Already applied');
} else {
  console.log('❌ Fix 1a: Could not find updateStripeAccount signature');
}

// Add account_token shortcut at the beginning of the function body
const oldIsCustomCheck = `  const isCustom = accountType === 'custom' ||
                   normalizeAccountType(process.env.STRIPE_CONNECT_ACCOUNT_TYPE) === 'custom';

  if (!isCustom) {
    // Express/Standard : mise à jour directe
    return (stripeInst || stripe).accounts.update(stripeAccountId, accountData);  }`;

const newIsCustomCheck = `  // If account_token is provided (FR platform), use it for the Stripe API call
  if (accountToken) {
    return (stripeInst || stripe).accounts.update(stripeAccountId, { account_token: accountToken });
  }

  const isCustom = accountType === 'custom' ||
                   normalizeAccountType(process.env.STRIPE_CONNECT_ACCOUNT_TYPE) === 'custom';

  if (!isCustom) {
    // Express/Standard : mise à jour directe
    return (stripeInst || stripe).accounts.update(stripeAccountId, accountData);  }`;

if (content.includes(oldIsCustomCheck)) {
  content = content.replace(oldIsCustomCheck, newIsCustomCheck);
  changeCount++;
  console.log('✅ Fix 1b: Added account_token shortcut in updateStripeAccount');
} else {
  console.log('⚠️ Fix 1b: Could not find isCustom check pattern');
  // Try alternative pattern
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const isCustom = accountType ===') && i > 60 && i < 100) {
      console.log(`  Found isCustom at line ${i + 1}`);
      for (let j = i - 2; j < i + 10; j++) {
        console.log(`  ${j+1}: ${lines[j]}`);
      }
      break;
    }
  }
}

// ===== FIX 2: submitPersonalInfo - use tokens =====
// For individual accounts: use account_token
// For company accounts: use person_token for representative, account_token for company data

// Fix 2a: Company path - updatePerson/createPerson to use person_token
const oldRepresentativeUpdate = `      if (representative) {
        console.log(\`\u{1f4dd} [Stripe Onboarding] Updating existing representative person: \${representative.id}\`);
        await stripe.accounts.updatePerson(stripeAccountId, representative.id, {          ...personData,
          relationship: { representative: true }
        });
      } else {
        console.log(\`\u{2795} [Stripe Onboarding] Creating new representative person\`);
        await stripe.accounts.createPerson(stripeAccountId, {
          ...personData,
          relationship: { representative: true }
        });
      }`;

const newRepresentativeUpdate = `      if (representative) {
        console.log(\`\u{1f4dd} [Stripe Onboarding] Updating existing representative person: \${representative.id}\`);
        if (req.body.person_token) {
          await stripe.accounts.updatePerson(stripeAccountId, representative.id, { person_token: req.body.person_token });
        } else {
          await stripe.accounts.updatePerson(stripeAccountId, representative.id, {
            ...personData,
            relationship: { representative: true }
          });
        }
      } else {
        console.log(\`\u{2795} [Stripe Onboarding] Creating new representative person\`);
        if (req.body.person_token) {
          await stripe.accounts.createPerson(stripeAccountId, { person_token: req.body.person_token });
        } else {
          await stripe.accounts.createPerson(stripeAccountId, {
            ...personData,
            relationship: { representative: true }
          });
        }
      }`;

if (content.includes(oldRepresentativeUpdate)) {
  content = content.replace(oldRepresentativeUpdate, newRepresentativeUpdate);
  changeCount++;
  console.log('✅ Fix 2a: Representative create/update now uses person_token');
} else {
  console.log('⚠️ Fix 2a: Could not find representative update pattern');
  // Check what's there
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('representative.id') && lines[i].includes('updatePerson') && i > 500 && i < 650) {
      console.log(`  Found updatePerson at line ${i + 1}: ${lines[i].trim()}`);
      break;
    }
  }
}

// Fix 2b: Company path - pass account_token to updateStripeAccount for company data
const oldCompanyUpdate1 = `      if (updatePayload) {
        await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);
      }
    } else {
      // Individual accounts: use individual on account update as normal`;
const newCompanyUpdate1 = `      if (updatePayload) {
        await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload, null, req.body.account_token);
      }
    } else {
      // Individual accounts: use individual on account update as normal`;

if (content.includes(oldCompanyUpdate1)) {
  content = content.replace(oldCompanyUpdate1, newCompanyUpdate1);
  changeCount++;
  console.log('✅ Fix 2b: Company updateStripeAccount passes account_token');
} else {
  console.log('⚠️ Fix 2b: Could not find company update pattern');
}

// Fix 2c: Individual path - pass account_token to updateStripeAccount
const oldIndividualUpdate = `      const individualPayload = {
        individual: personData
      };
      await updateStripeAccount(connection, companyId, stripeAccountId, individualPayload);`;
const newIndividualUpdate = `      const individualPayload = {
        individual: personData
      };
      await updateStripeAccount(connection, companyId, stripeAccountId, individualPayload, null, req.body.account_token);`;

if (content.includes(oldIndividualUpdate)) {
  content = content.replace(oldIndividualUpdate, newIndividualUpdate);
  changeCount++;
  console.log('✅ Fix 2c: Individual updateStripeAccount passes account_token');
} else {
  console.log('⚠️ Fix 2c: Could not find individual update pattern');
}

// ===== FIX 3: submitAddress - pass account_token =====
const oldAddressUpdate = `    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);

    console.log(\`✅ [Stripe Onboarding] Address submitted\`);`;
const newAddressUpdate = `    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload, null, req.body.account_token);

    console.log(\`✅ [Stripe Onboarding] Address submitted\`);`;

if (content.includes(oldAddressUpdate)) {
  content = content.replace(oldAddressUpdate, newAddressUpdate);
  changeCount++;
  console.log('✅ Fix 3: submitAddress passes account_token');
} else {
  console.log('⚠️ Fix 3: Could not find address update pattern');
}

// ===== FIX 4: submitCompanyDetails - pass account_token =====
const oldCompanyDetailsUpdate = `    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);
    console.log('✅ [Stripe Onboarding] Company details submitted');`;
const newCompanyDetailsUpdate = `    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload, null, req.body.account_token);
    console.log('✅ [Stripe Onboarding] Company details submitted');`;

if (content.includes(oldCompanyDetailsUpdate)) {
  content = content.replace(oldCompanyDetailsUpdate, newCompanyDetailsUpdate);
  changeCount++;
  console.log('✅ Fix 4: submitCompanyDetails passes account_token');
} else {
  console.log('⚠️ Fix 4: Could not find company details update pattern');
}

// Write the modified file
if (changeCount > 0) {
  fs.writeFileSync(FILE, content, 'utf8');
  console.log(`\n✅ All done. ${changeCount} changes applied.`);
} else {
  console.log('\n❌ No changes applied - check patterns above.');
}

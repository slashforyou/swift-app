/**
 * Fix: Address endpoint must handle person_token for company accounts.
 * 
 * For individual accounts: uses account_token (existing behavior)
 * For company accounts: uses person_token to update representative's address
 * 
 * Run on server: node fix_address_company_token.js
 */

const fs = require('fs');

const FILE = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';

let content = fs.readFileSync(FILE, 'utf8');
let changeCount = 0;

// The exact string to find - note trailing spaces on blank lines
const oldBlock = '    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload, null, req.body.account_token);\n    \n    console.log(`\u2705 [Stripe Onboarding] Address submitted`);\n    ';

const newBlock = [
  '    // For company accounts: address goes to representative via person_token',
  '    if (req.body.person_token && businessType === \'company\') {',
  '      const stripeInst = getStripeForMode(req.stripeMode) || stripe;',
  '      const persons = await stripeInst.accounts.listPersons(stripeAccountId, { limit: 10 });',
  '      const representative = persons.data.find(p => p.relationship && p.relationship.representative);',
  '      if (representative) {',
  '        console.log(`\\uD83D\\uDCDD [Stripe Onboarding] Updating representative address via person_token: ` + representative.id);',
  '        await stripeInst.accounts.updatePerson(stripeAccountId, representative.id, { person_token: req.body.person_token });',
  '      } else {',
  '        console.log(`\\u2795 [Stripe Onboarding] Creating representative with address via person_token`);',
  '        await stripeInst.accounts.createPerson(stripeAccountId, { person_token: req.body.person_token });',
  '      }',
  '    } else if (req.body.account_token) {',
  '      await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload, null, req.body.account_token);',
  '    } else {',
  '      await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);',
  '    }',
  '',
  '    console.log(`\\u2705 [Stripe Onboarding] Address submitted`);',
].join('\n');

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  changeCount++;
  console.log('OK: Address endpoint patched for company person_token');
} else {
  console.log('FAIL: Exact block not found. Trying line-by-line...');
  // Show context
  const idx = content.indexOf('Address submitted');
  if (idx !== -1) {
    const start = Math.max(0, idx - 300);
    console.log('Context around "Address submitted":');
    console.log(JSON.stringify(content.substring(start, idx + 50)));
  }
}

if (changeCount > 0) {
  fs.writeFileSync(FILE, content, 'utf8');
  console.log('Done. ' + changeCount + ' change(s) applied.');
} else {
  console.log('No changes applied.');
}

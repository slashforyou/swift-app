/**
 * Targeted fixes for remaining token issues:
 * 1. Add account_token shortcut in updateStripeAccount
 * 2. Use person_token in representative create/update
 * 3. Pass account_token in submitAddress
 */
const fs = require('fs');
const FILE = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js';

let content = fs.readFileSync(FILE, 'utf8');
const lines = content.split('\n');
let changeCount = 0;

// ===== FIX 1: Add account_token shortcut at start of updateStripeAccount =====
// Find the function and add the shortcut after the accountType line
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function updateStripeAccount(') && lines[i].includes('accountToken')) {
    // Find the line with getAccountType
    for (let j = i + 1; j < i + 5; j++) {
      if (lines[j].includes('const accountType = await getAccountType')) {
        // Check if shortcut already exists
        if (lines[j - 1].includes('account_token') || (j > i + 1 && lines[j - 1].includes('accountToken'))) {
          console.log('ℹ️ Fix 1: account_token shortcut already present');
          break;
        }
        // Insert before the accountType line
        const insertLines = [
          '  // If account_token is provided (FR platform), use it directly',
          '  if (accountToken) {',
          '    return (stripeInst || stripe).accounts.update(stripeAccountId, { account_token: accountToken });',
          '  }',
          ''
        ];
        lines.splice(j, 0, ...insertLines);
        changeCount++;
        console.log('✅ Fix 1: Added account_token shortcut in updateStripeAccount');
        break;
      }
    }
    break;
  }
}

// ===== FIX 2: Use person_token for representative =====
// Find the updatePerson call for representative
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Updating existing representative person') && i < 700) {
    // Check if next lines already have person_token
    const nextFewLines = lines.slice(i, i + 15).join('\n');
    if (nextFewLines.includes('person_token')) {
      console.log('ℹ️ Fix 2: person_token already present for representative');
      break;
    }
    
    // Find the updatePerson line
    for (let j = i + 1; j < i + 5; j++) {
      if (lines[j].includes('await stripe.accounts.updatePerson(stripeAccountId, representative.id')) {
        // Find the end of this call (closing parenthesis)
        let endLine = j;
        let braceCount = 0;
        for (let k = j; k < j + 10; k++) {
          braceCount += (lines[k].match(/{/g) || []).length;
          braceCount -= (lines[k].match(/}/g) || []).length;
          if (braceCount <= 0 && k > j) {
            endLine = k;
            break;
          }
        }
        
        // Replace the updatePerson block with token-aware version
        const indent = '        ';
        const newLines = [
          `${indent}if (req.body.person_token) {`,
          `${indent}  await stripe.accounts.updatePerson(stripeAccountId, representative.id, { person_token: req.body.person_token });`,
          `${indent}} else {`,
          `${indent}  await stripe.accounts.updatePerson(stripeAccountId, representative.id, {`,
          `${indent}    ...personData,`,
          `${indent}    relationship: { representative: true }`,
          `${indent}  });`,
          `${indent}}`
        ];
        
        lines.splice(j, endLine - j + 1, ...newLines);
        changeCount++;
        console.log('✅ Fix 2a: updatePerson uses person_token');
        break;
      }
    }
    break;
  }
}

// Find the createPerson call for representative  
content = lines.join('\n');
const linesAfter = content.split('\n');
for (let i = 0; i < linesAfter.length; i++) {
  if (linesAfter[i].includes('Creating new representative person') && i < 700) {
    const nextFewLines = linesAfter.slice(i, i + 15).join('\n');
    if (nextFewLines.includes('person_token')) {
      console.log('ℹ️ Fix 2b: person_token already present for createPerson');
      break;
    }
    
    for (let j = i + 1; j < i + 5; j++) {
      if (linesAfter[j].includes('await stripe.accounts.createPerson(stripeAccountId')) {
        let endLine = j;
        let braceCount = 0;
        for (let k = j; k < j + 10; k++) {
          braceCount += (linesAfter[k].match(/{/g) || []).length;
          braceCount -= (linesAfter[k].match(/}/g) || []).length;
          if (braceCount <= 0 && k > j) {
            endLine = k;
            break;
          }
        }
        
        const indent = '        ';
        const newLines = [
          `${indent}if (req.body.person_token) {`,
          `${indent}  await stripe.accounts.createPerson(stripeAccountId, { person_token: req.body.person_token });`,
          `${indent}} else {`,
          `${indent}  await stripe.accounts.createPerson(stripeAccountId, {`,
          `${indent}    ...personData,`,
          `${indent}    relationship: { representative: true }`,
          `${indent}  });`,
          `${indent}}`
        ];
        
        linesAfter.splice(j, endLine - j + 1, ...newLines);
        changeCount++;
        console.log('✅ Fix 2b: createPerson uses person_token');
        break;
      }
    }
    break;
  }
}

// ===== FIX 3: Pass account_token in submitAddress =====
content = linesAfter.join('\n');
const linesAddr = content.split('\n');
for (let i = 0; i < linesAddr.length; i++) {
  if (linesAddr[i].includes('await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload)') && i > 800 && i < 900) {
    // Check this is in submitAddress context
    let isAddress = false;
    for (let j = Math.max(0, i - 30); j < i; j++) {
      if (linesAddr[j].includes('submitAddress') || linesAddr[j].includes('ADDRESS ===')) {
        isAddress = true;
        break;
      }
    }
    if (isAddress) {
      linesAddr[i] = linesAddr[i].replace(
        'await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload)',
        'await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload, null, req.body.account_token)'
      );
      changeCount++;
      console.log('✅ Fix 3: submitAddress passes account_token');
      break;
    }
  }
}

if (changeCount > 0) {
  fs.writeFileSync(FILE, linesAddr.join('\n'), 'utf8');
  console.log('\n✅ All done. ' + changeCount + ' changes applied.');
} else {
  console.log('\n⚠️ No changes applied.');
}

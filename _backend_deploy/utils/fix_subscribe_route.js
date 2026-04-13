const fs = require('fs');
const filePath = '/srv/www/htdocs/swiftapp/server/index.js';
let code = fs.readFileSync(filePath, 'utf8');

// Fix 1: Make companyName optional, add accountType support
const oldValidation = [
  "  const { mail, firstName, lastName, password, companyName } = req.body;",
  "  if (!mail || !firstName || !lastName || !password || !companyName)",
  "    return res.status(400).json({ error: 'Mail, firstName, lastName, password, and companyName are required' });"
].join('\n');

const newValidation = [
  "  const { mail, firstName, lastName, password, companyName, accountType } = req.body;",
  "  const isBusinessOwner = accountType !== 'employee';",
  "  if (!mail || !firstName || !lastName || !password || (isBusinessOwner && !companyName))",
  "    return res.status(400).json({ error: 'Required fields missing' });"
].join('\n');

if (code.includes(oldValidation)) {
  code = code.replace(oldValidation, newValidation);
  console.log('Fix 1 applied: companyName now optional for employees');
} else {
  console.log('Fix 1 SKIPPED: old validation not found');
  // Debug: find the actual line
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('companyName') && lines[i].includes('req.body')) {
      console.log('  Found at line ' + (i+1) + ': ' + lines[i].trim());
    }
  }
}

// Fix 2: Replace the sécurité ultime block
const oldSecurityLines = [
  "  // sécurité ultime",
  "  if (!response || typeof response !== 'object' || !response.success || typeof response.user !== 'object') {",
  "    return res.status(400).json({ error: 'Subscription failed', details: response });",
  "  }",
  "  if (!response.user.id || !response.user.mail || !response.user.firstName || !response.user.lastName) {",
  "    return res.status(400).json({ error: 'Invalid user data returned', details: response.user });",
  "  }",
  "",
  "  return res.json({",
  "    message: 'Subscription successful',",
  "    success: true,",
  "    user: response.user",
  "  });"
].join('\n');

const newSecurity = "  // Return response as-is (subscribeEndpoint handles all error cases)\n  return res.json(response);";

if (code.includes(oldSecurityLines)) {
  code = code.replace(oldSecurityLines, newSecurity);
  console.log('Fix 2 applied: response forwarded properly');
} else {
  console.log('Fix 2 SKIPPED: old security block not found');
  // Debug
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('curit') || lines[i].includes('Subscription failed')) {
      console.log('  Found at line ' + (i+1) + ': ' + lines[i].trim());
    }
  }
}

// Fix 3: companyName quote check conditional
const oldQuoteCheck = "mail.includes(\"'\") || firstName.includes(\"'\") || lastName.includes(\"'\") || password.includes(\"'\") || companyName.includes(\"'\")";
const newQuoteCheck = "mail.includes(\"'\") || firstName.includes(\"'\") || lastName.includes(\"'\") || password.includes(\"'\") || (companyName && companyName.includes(\"'\"))";

if (code.includes(oldQuoteCheck)) {
  code = code.replace(oldQuoteCheck, newQuoteCheck);
  console.log('Fix 3 applied: quote check conditional on companyName');
} else {
  console.log('Fix 3 SKIPPED: old quote check not found');
}

fs.writeFileSync(filePath, code);
console.log('File saved successfully');

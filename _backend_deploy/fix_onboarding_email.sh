#!/bin/bash
# Add email validation in startOnboarding before sending to Stripe

FILE="/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js"

python3 -c "
with open('$FILE', 'r') as f:
    content = f.read()

# Add email validation after company fetch
old = '''    if (company.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }'''

new = '''    if (company.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Validate company email before sending to Stripe
    if (!company[0].email || !company[0].email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.log('[Stripe Onboarding] Company has no valid email, attempting to backfill from owner...');
      // Try to backfill from owner user
      const [owner] = await connection.query(
        \"SELECT email FROM users WHERE company_id = ? AND company_role = 'patron' AND email IS NOT NULL LIMIT 1\",
        [companyId]
      );
      if (owner.length > 0 && owner[0].email) {
        company[0].email = owner[0].email;
        await connection.query('UPDATE companies SET email = ? WHERE id = ?', [owner[0].email, companyId]);
        console.log('[Stripe Onboarding] Backfilled company email from owner:', owner[0].email);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address: ' + (company[0].email || '(empty)') + '. Please update your company email in settings.'
        });
      }
    }'''

if old in content:
    content = content.replace(old, new, 1)
    with open('$FILE', 'w') as f:
        f.write(content)
    print('✅ onboarding.js patched - email validation + auto-backfill added')
else:
    print('❌ Pattern not found')
    import subprocess
    subprocess.run(['grep', '-n', 'Company not found', '$FILE'])
"

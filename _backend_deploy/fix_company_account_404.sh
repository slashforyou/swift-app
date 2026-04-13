#!/bin/bash
# Fix: company account endpoint returns 200 with stripe:null instead of 404
# This is expected behavior for new companies without Stripe

FILE="/srv/www/htdocs/swiftapp/server/index.js"

# Replace the 404 block for missing Stripe account with a 200 response
# The old code returns: res.status(404).json({ success: false, error: 'No active Stripe account...' })
# New code returns: res.json({ success: true, stripe: null, company: {...} })

python3 -c "
import re
with open('$FILE', 'r') as f:
    content = f.read()

old = '''      // Si pas de compte Stripe actif, renvoyer 404
      if (!hasStripe) {
        return res.status(404).json({
          success: false,
          error: 'No active Stripe account found for this company',
          message: 'Please complete onboarding to create a Stripe account'
        });
      }'''

new = '''      // Si pas de compte Stripe actif, renvoyer 200 avec stripe: null (état normal pour nouveaux inscrits)
      if (!hasStripe) {
        return res.json({
          success: true,
          stripe: null,
          has_stripe_account: false,
          company: {
            id: company[0].id,
            name: company[0].name,
            email: company[0].email,
            abn: company[0].abn
          },
          message: 'No Stripe account yet. Complete onboarding to create one.'
        });
      }'''

if old in content:
    content = content.replace(old, new)
    with open('$FILE', 'w') as f:
        f.write(content)
    print('✅ Company account endpoint patched: 404 → 200 for missing Stripe')
else:
    print('❌ Pattern not found - checking current content...')
    # show the relevant section
    import subprocess
    subprocess.run(['grep', '-n', '-A5', 'Si pas de compte Stripe actif', '$FILE'])
"

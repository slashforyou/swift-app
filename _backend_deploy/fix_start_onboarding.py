"""
Fix: Make startOnboarding endpoint idempotent
Instead of returning 400 when Stripe account already exists,
return 200 with the existing account info.
"""

filepath = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'

with open(filepath, 'r') as f:
    content = f.read()

old = """    if (existing.length > 0) {
      console.log(`\u26a0\ufe0f [Stripe Onboarding] Account already exists: ${existing[0].stripe_account_id}`);
      return res.status(400).json({
        success: false,
        error: 'Stripe account already exists for this company',
        stripe_account_id: existing[0].stripe_account_id,
        progress: existing[0].onboarding_progress || 0
      });
    }"""

new = """    if (existing.length > 0) {
      console.log(`\u2705 [Stripe Onboarding] Account already exists, returning it: ${existing[0].stripe_account_id}`);
      // Idempotent: return existing account instead of error
      try {
        const stripeAcct = await stripe.accounts.retrieve(existing[0].stripe_account_id);
        return res.status(200).json({
          success: true,
          stripe_account_id: existing[0].stripe_account_id,
          onboarding_progress: existing[0].onboarding_progress || 0,
          next_step: 'CompanyDetails',
          requirements: stripeAcct.requirements || {},
          charges_enabled: stripeAcct.charges_enabled,
          payouts_enabled: stripeAcct.payouts_enabled
        });
      } catch (stripeErr) {
        console.error('Error retrieving existing Stripe account:', stripeErr.message);
        return res.status(200).json({
          success: true,
          stripe_account_id: existing[0].stripe_account_id,
          onboarding_progress: existing[0].onboarding_progress || 0,
          next_step: 'CompanyDetails'
        });
      }
    }"""

if old in content:
    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)
    print('FIXED: startOnboarding is now idempotent')
else:
    print('NOT FOUND - showing context around line 323:')
    lines = content.split('\n')
    for i in range(320, min(340, len(lines))):
        print(f'{i+1}: {lines[i]}')

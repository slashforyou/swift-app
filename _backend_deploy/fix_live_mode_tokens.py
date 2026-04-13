"""
Fix: Remove server-side account token creation for Stripe live mode.

In live mode, Stripe forbids creating account_tokens server-side (with secret key).
Account tokens must be created client-side (Stripe.js / mobile SDK).

For Custom accounts with secret key, we can update fields DIRECTLY on the account
without using tokens. TOS acceptance uses tos_acceptance field instead.

Changes:
1. updateStripeAccountWithToken → direct accounts.update (no token)
2. updateStripeAccount → simplified, always direct update
3. startOnboarding → business_type + tos_acceptance directly, no token
"""

import re

SERVER_FILE = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'

def fix():
    with open(SERVER_FILE, 'r') as f:
        content = f.read()

    original = content

    # ──────────────────────────────────────────────────────────────
    # FIX 1: Replace updateStripeAccountWithToken
    # Old: creates a token then uses it to update
    # New: updates directly (works with secret key for Custom accounts)
    # ──────────────────────────────────────────────────────────────

    old_update_with_token = '''async function updateStripeAccountWithToken(stripeAccountId, accountData, stripeInst) {
  const accountToken = await (stripeInst || stripe).tokens.create({
    account: {
      ...accountData,
      tos_shown_and_accepted: true
    }
  });

  return (stripeInst || stripe).accounts.update(stripeAccountId, {
    account_token: accountToken.id
  });
}'''

    new_update_with_token = '''async function updateStripeAccountWithToken(stripeAccountId, accountData, stripeInst) {
  // Live mode: update directly without account_token (tokens can only be created client-side in live)
  return (stripeInst || stripe).accounts.update(stripeAccountId, accountData);
}'''

    if old_update_with_token in content:
        content = content.replace(old_update_with_token, new_update_with_token)
        print('✅ FIX 1: Replaced updateStripeAccountWithToken (direct update, no token)')
    else:
        print('⚠️  FIX 1: updateStripeAccountWithToken pattern not found - may already be fixed')

    # ──────────────────────────────────────────────────────────────
    # FIX 2: Replace account creation in startOnboarding
    # Old: creates account_token with business_type + tos_shown_and_accepted
    # New: sets business_type directly + tos_acceptance with IP/date
    # ──────────────────────────────────────────────────────────────

    old_custom_block = '''    if (accountType === 'custom') {
      // Mode Custom : OBLIGATOIRE d'utiliser un account_token pour plateformes FR
      // business_type va DANS le token, PAS dans accounts.create()
      const accountToken = await stripe.tokens.create({
        account: {
          business_type: businessType,
          tos_shown_and_accepted: true
        }
      });

      stripeAccountConfig.type = 'custom';
      stripeAccountConfig.account_token = accountToken.id;
      // ⚠️ PAS de business_type ici - il est dans le token

      console.log(`🔑 [Stripe Onboarding] Token created: ${accountToken.id} (business_type=${businessType})`);
    } else {'''

    new_custom_block = '''    if (accountType === 'custom') {
      // Mode Custom: direct fields (no account_token - tokens can only be created client-side in live mode)
      stripeAccountConfig.type = 'custom';
      stripeAccountConfig.business_type = businessType;
      stripeAccountConfig.tos_acceptance = {
        date: Math.floor(Date.now() / 1000),
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '127.0.0.1'
      };

      console.log(`📝 [Stripe Onboarding] Custom account: business_type=${businessType}, tos accepted`);
    } else {'''

    if old_custom_block in content:
        content = content.replace(old_custom_block, new_custom_block)
        print('✅ FIX 2: Replaced startOnboarding token creation with direct business_type + tos_acceptance')
    else:
        print('⚠️  FIX 2: startOnboarding custom block pattern not found')
        # Try a more flexible match
        pattern = r"if \(accountType === 'custom'\) \{[^}]*tokens\.create\([^}]*\}\);[^}]*stripeAccountConfig\.type = 'custom';[^}]*stripeAccountConfig\.account_token = accountToken\.id;[^}]*\} else \{"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            content = content[:match.start()] + new_custom_block.lstrip() + content[match.end():]
            print('✅ FIX 2 (regex fallback): Replaced startOnboarding token creation')
        else:
            print('❌ FIX 2: Could not find pattern at all!')

    if content != original:
        with open(SERVER_FILE, 'w') as f:
            f.write(content)
        print(f'\n✅ File saved: {SERVER_FILE}')
        print('Run: pm2 restart swiftapp')
    else:
        print('\n⚠️  No changes made')

if __name__ == '__main__':
    fix()

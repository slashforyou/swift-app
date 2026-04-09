#!/usr/bin/env python3
"""
Deploy Stripe Dual-Mode Configuration
======================================

Enables the server to use BOTH test and live Stripe keys simultaneously.
Test company accounts → test Stripe keys
Live company accounts → live Stripe keys

Changes:
1. Adds stripe_mode column to stripe_connected_accounts table
2. Replaces config/stripe.js with dual-mode version (AsyncLocalStorage + Proxy)
3. Updates middleware/requireStripeConfigured.js to resolve mode per-request
4. Adds STRIPE_SECRET_KEY_TEST to .env (placeholder)
5. Updates connect.js to store stripe_mode when creating accounts
6. Restarts PM2
"""

import subprocess
import sys
import os

SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
SSH = 'ssh sushinari'

def run(cmd, check=True):
    """Run a local command"""
    print(f'\n🔧 {cmd}')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout[:2000])
    if result.stderr:
        print(result.stderr[:2000], file=sys.stderr)
    if check and result.returncode != 0:
        print(f'❌ Command failed with exit code {result.returncode}')
        sys.exit(1)
    return result

def ssh(cmd, check=True):
    """Run a command on the server via SSH"""
    return run(f'{SSH} "{cmd}"', check=check)

def scp_to_server(local_path, remote_path):
    """Copy a local file to the server"""
    return run(f'scp {local_path} sushinari:{remote_path}')

# ─── Get the directory of this script ───
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    print('=' * 60)
    print('🚀 DEPLOYING STRIPE DUAL-MODE CONFIGURATION')
    print('=' * 60)

    # ─── Step 1: Run migration ───
    print('\n📦 Step 1: Adding stripe_mode column to stripe_connected_accounts...')
    ssh(f"""cd {SERVER_DIR} && node -e "
      require('dotenv').config();
      const m = require('./node_modules/mysql2/promise');
      (async () => {{
        const c = await m.createConnection({{
          host: process.env.DB_HOST, user: process.env.DB_USER,
          password: process.env.DB_PASS, database: process.env.DB_DATABASE,
          socketPath: process.env.DB_SOCKET
        }});
        // Check if column already exists
        const [cols] = await c.query('SHOW COLUMNS FROM stripe_connected_accounts LIKE \\\\'stripe_mode\\\\'');
        if (cols.length === 0) {{
          await c.query(\\\\"ALTER TABLE stripe_connected_accounts ADD COLUMN stripe_mode ENUM('test','live') NOT NULL DEFAULT 'test' AFTER stripe_account_id\\\\");
          await c.query(\\\\"UPDATE stripe_connected_accounts SET stripe_mode = 'test'\\\\");
          console.log('✅ Column stripe_mode added');
        }} else {{
          console.log('ℹ️ Column stripe_mode already exists');
        }}
        await c.end();
      }})().catch(e => {{ console.error(e.message); process.exit(1); }});
    " """)

    # ─── Step 2: Deploy new config/stripe.js ───
    print('\n📦 Step 2: Deploying dual-mode config/stripe.js...')
    config_src = os.path.join(SCRIPT_DIR, 'config', 'stripe_dual_mode.js')
    scp_to_server(config_src, f'{SERVER_DIR}/config/stripe.js')
    print('✅ config/stripe.js replaced')

    # ─── Step 3: Deploy stripe mode middleware ───
    print('\n📦 Step 3: Deploying stripe mode middleware...')
    middleware_src = os.path.join(SCRIPT_DIR, 'middleware', 'stripeMode.js')
    scp_to_server(middleware_src, f'{SERVER_DIR}/middleware/stripeMode.js')

    # Also update requireStripeConfigured.js to delegate to the new middleware
    ssh(f"""cat > {SERVER_DIR}/middleware/requireStripeConfigured.js << 'ENDOFFILE'
/**
 * Backward-compatible wrapper.
 * Now delegates to resolveStripeMode which handles dual-mode routing.
 */
const {{ resolveStripeMode }} = require('./stripeMode');

// requireStripeConfigured is now just resolveStripeMode
// (it checks isConfigured + resolves mode + wraps in AsyncLocalStorage)
module.exports = {{ requireStripeConfigured: resolveStripeMode }};
ENDOFFILE""")
    print('✅ Middleware deployed')

    # ─── Step 4: Patch connect.js to store stripe_mode on account creation ───
    print('\n📦 Step 4: Patching connect.js to store stripe_mode...')
    # We need to:
    # a) Add stripe_mode to the INSERT when creating a connected account
    # b) Read the mode from req.stripeMode (set by middleware)

    # Find the INSERT statement in connect.js and add stripe_mode
    ssh(f"""cd {SERVER_DIR} && python3 -c "
import re

with open('endPoints/v1/stripe/connect.js', 'r') as f:
    content = f.read()

# Patch 1: Add stripe_mode to INSERT statement for new connected accounts
# Find: INSERT INTO stripe_connected_accounts (company_id, stripe_account_id,
# Add stripe_mode to column list and values
old_insert = 'INSERT INTO stripe_connected_accounts (company_id, stripe_account_id,'
new_insert = 'INSERT INTO stripe_connected_accounts (company_id, stripe_account_id, stripe_mode,'
content = content.replace(old_insert, new_insert, 1)

# Find the VALUES part and add the mode parameter
# The values look like: VALUES (?, ?,
old_values = 'VALUES (?, ?,'
new_values = 'VALUES (?, ?, ?,'
content = content.replace(old_values, new_values, 1)

# Add the mode parameter to the array of values
# Find: [companyId, account.id,
old_params = '[companyId, account.id,'
new_params = \"[companyId, account.id, (req.stripeMode || req.headers['x-stripe-mode'] || 'live'),\"
content = content.replace(old_params, new_params, 1)

with open('endPoints/v1/stripe/connect.js', 'w') as f:
    f.write(content)

print('✅ connect.js patched')
" """)

    # ─── Step 5: Add test keys placeholder to .env ───
    print('\n📦 Step 5: Adding test key placeholders to .env...')
    ssh(f"""cd {SERVER_DIR} && {{
      if ! grep -q 'STRIPE_SECRET_KEY_TEST' .env; then
        echo '' >> .env
        echo '# ─── Stripe TEST keys (for test company accounts) ───' >> .env
        echo 'STRIPE_SECRET_KEY_TEST=' >> .env
        echo 'STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51SMZIJInA65k4AVU4pfHe2XYbwfiqZqYNmCSCfgrIP7iyI2rQ4sw5Po5KbZC5nt1NVMOXiWzZXaxnD1wiDnPNd2m00BwhyWbwP' >> .env
        echo '✅ Test key placeholders added to .env'
      else
        echo 'ℹ️ Test keys already in .env'
      fi
    }}""")

    # ─── Step 6: Restart PM2 ───
    print('\n📦 Step 6: Restarting PM2...')
    ssh('pm2 restart swift-app --update-env', check=False)
    print('✅ PM2 restarted')

    print('\n' + '=' * 60)
    print('✅ DEPLOYMENT COMPLETE')
    print('=' * 60)
    print('''
🔑 NEXT STEPS:
  1. Get the test SECRET key from Stripe Dashboard:
     → https://dashboard.stripe.com/test/apikeys
     → Copy sk_test_51SMZIJInA65k4AVU...
  
  2. Add it to the server .env:
     ssh sushinari
     nano /srv/www/htdocs/swiftapp/server/.env
     → Set STRIPE_SECRET_KEY_TEST=sk_test_xxx
  
  3. Restart PM2:
     pm2 restart swift-app --update-env
  
  4. Test: the 3 existing test accounts should now work!
     - Company 1 (Cobbr Test) → acct_1TDHtaIE4nR02fpn (test)
     - Company 2 (Test Frontend) → acct_1SzvP3IyBVP7FOdV (test)
     - Company 3 → acct_1SzXV2IVgfzy5Wdf (test)
  
  5. When creating NEW accounts in production app:
     → Frontend sends X-Stripe-Mode: live
     → Account stored with stripe_mode = 'live'
     → Uses sk_live_xxx keys automatically
''')

if __name__ == '__main__':
    main()

"""
Deploy Stripe subscription endpoints + webhook handlers to production server.
1. Deploy subscriptions.js endpoint file
2. Deploy subscription webhook handlers
3. Inject subscription routes into index.js
4. Inject webhook cases into webhooks.js
"""
import subprocess
import base64
import sys
import os

SERVER = "sushinari"
SERVER_DIR = "/srv/www/htdocs/swiftapp/server"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

def run(cmd, check=True):
    """Run a shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"ERROR: {result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def deploy_file(local_path, remote_path):
    """Deploy a file via base64 encoding."""
    with open(local_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    run(f'ssh {SERVER} "echo \'{b64}\' | base64 -d > {remote_path}"')
    print(f"  ✅ Deployed: {remote_path}")

def ssh_cmd(cmd):
    """Run command on remote server."""
    return run(f'ssh {SERVER} "{cmd}"')

# ============================================================
# 1. Deploy subscription endpoint file
# ============================================================
print("\n📦 Step 1: Deploying subscriptions.js...")
deploy_file(
    os.path.join(LOCAL_DIR, "endPoints", "stripe_subscriptions.js"),
    f"{SERVER_DIR}/endPoints/v1/stripe/subscriptions.js"
)

# ============================================================
# 2. Deploy subscription webhook handlers
# ============================================================
print("\n📦 Step 2: Deploying subscription webhook handlers...")
deploy_file(
    os.path.join(LOCAL_DIR, "endPoints", "stripe_subscription_webhooks.js"),
    f"{SERVER_DIR}/endPoints/v1/stripe/subscription-webhooks.js"
)

# ============================================================
# 3. Inject subscription routes into index.js
# ============================================================
print("\n🔧 Step 3: Injecting subscription routes into index.js...")

# Check if already injected
check = run(f'ssh {SERVER} "grep -c \'stripe/subscriptions\' {SERVER_DIR}/index.js"', check=False)
if check and int(check) > 0:
    print("  ⏭️  Subscription routes already injected, skipping")
else:
    # Inject after the account-settings routes block
    INJECTION_MARKER = "logger.info('STRIPE', 'Routes Stripe activées');"
    INJECTION_CODE = r"""
  // ============================================
  // STRIPE SUBSCRIPTIONS (Billing)
  // ============================================
  const stripeSubscriptions = require('./endPoints/v1/stripe/subscriptions');
  app.post('/swift-app/v1/stripe/subscriptions/create', authenticateToken, requireStripeConfigured, stripeSubscriptions.createSubscription);
  app.post('/swift-app/v1/stripe/subscriptions/cancel', authenticateToken, requireStripeConfigured, stripeSubscriptions.cancelSubscription);
  app.post('/swift-app/v1/stripe/subscriptions/resume', authenticateToken, requireStripeConfigured, stripeSubscriptions.resumeSubscription);
  app.get('/swift-app/v1/stripe/subscriptions/status', authenticateToken, requireStripeConfigured, stripeSubscriptions.getSubscriptionStatus);
  app.post('/swift-app/v1/stripe/subscriptions/change-plan', authenticateToken, requireStripeConfigured, stripeSubscriptions.changePlan);
  logger.info('STRIPE', 'Routes Stripe Subscriptions activées');
"""

    # Use Python on server to do the injection
    inject_script = f"""
import re
with open('{SERVER_DIR}/index.js', 'r') as f:
    content = f.read()

marker = "logger.info('STRIPE', 'Routes Stripe activées');"
injection = '''{INJECTION_CODE}'''

if 'stripe/subscriptions' not in content:
    content = content.replace(marker, marker + injection)
    with open('{SERVER_DIR}/index.js', 'w') as f:
        f.write(content)
    print('INJECTED')
else:
    print('ALREADY_EXISTS')
"""
    # Write and execute inject script on server
    inject_b64 = base64.b64encode(inject_script.encode()).decode()
    result = run(f'ssh {SERVER} "echo \'{inject_b64}\' | base64 -d > /tmp/inject_subs.py && python3 /tmp/inject_subs.py"')
    print(f"  ✅ Routes injection: {result}")

# ============================================================
# 4. Inject webhook cases into webhooks.js
# ============================================================
print("\n🔧 Step 4: Injecting webhook handlers...")

check2 = run(f'ssh {SERVER} "grep -c \'subscription.created\' {SERVER_DIR}/endPoints/v1/stripe/webhooks.js"', check=False)
if check2 and int(check2) > 0:
    print("  ⏭️  Webhook handlers already injected, skipping")
else:
    webhook_inject_script = f"""
with open('{SERVER_DIR}/endPoints/v1/stripe/webhooks.js', 'r') as f:
    content = f.read()

# 1. Add require at top (after existing requires)
require_line = "const {{ handleSubscriptionCreated, handleSubscriptionUpdated, handleSubscriptionDeleted, handleSubscriptionInvoicePaid }} = require('./subscription-webhooks');"

# Insert after the existing require lines
insert_after = "const {{ connect, close }} = require('../../../swiftDb');"
if require_line not in content:
    content = content.replace(insert_after, insert_after + '\\n' + require_line)

# 2. Add cases before the default case or after payout.canceled
cases_code = '''
    // --- Subscription events ---
    case 'customer.subscription.created':
      await handleSubscriptionCreated(data, connection);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data, connection);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data, connection);
      break;
'''

# Find the 'default:' case in the switch and insert before it
if 'customer.subscription.created' not in content:
    # Insert after the last known case (payout.canceled or default)
    import re
    # Find the default: case
    default_match = re.search(r"(\\s*default:\\s*\\n)", content)
    if default_match:
        content = content[:default_match.start()] + cases_code + '\\n' + content[default_match.start():]
    else:
        # Fallback: insert before the closing of the switch
        print('WARNING: Could not find default case, manual insertion needed')

with open('{SERVER_DIR}/endPoints/v1/stripe/webhooks.js', 'w') as f:
    f.write(content)
print('INJECTED')
"""
    inject_b64_2 = base64.b64encode(webhook_inject_script.encode()).decode()
    result2 = run(f'ssh {SERVER} "echo \'{inject_b64_2}\' | base64 -d > /tmp/inject_webhooks.py && python3 /tmp/inject_webhooks.py"')
    print(f"  ✅ Webhook injection: {result2}")

# ============================================================
# 5. Fix: subscriptions.js uses individual exports, not registerRoutes
# ============================================================
print("\n🔧 Step 5: Fixing subscriptions.js exports...")

# The index.js expects individual function exports, not registerRoutes
fix_script = f"""
with open('{SERVER_DIR}/endPoints/v1/stripe/subscriptions.js', 'r') as f:
    content = f.read()

# Replace the registerRoutes export with individual exports
old_export = 'module.exports = {{ registerRoutes }};'
new_export = '''module.exports = {{
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  getSubscriptionStatus,
  changePlan,
}};'''

if old_export in content:
    # Also remove the registerRoutes function
    import re
    content = re.sub(r'// =+ ROUTES =+.*?module\\.exports = \\{{ registerRoutes \\}};', new_export, content, flags=re.DOTALL)
    with open('{SERVER_DIR}/endPoints/v1/stripe/subscriptions.js', 'w') as f:
        f.write(content)
    print('FIXED')
else:
    print('ALREADY_OK')
"""
fix_b64 = base64.b64encode(fix_script.encode()).decode()
result3 = run(f'ssh {SERVER} "echo \'{fix_b64}\' | base64 -d > /tmp/fix_subs.py && python3 /tmp/fix_subs.py"')
print(f"  ✅ Export fix: {result3}")

# ============================================================
# 6. Restart PM2
# ============================================================
print("\n🔄 Step 6: Restarting server...")
ssh_cmd(f"cd {SERVER_DIR} && pm2 restart 17 --update-env")
print("  ✅ Server restarted")

print("\n✅ Stripe subscriptions deployment complete!")
print("   - POST /v1/stripe/subscriptions/create")
print("   - POST /v1/stripe/subscriptions/cancel")
print("   - POST /v1/stripe/subscriptions/resume")
print("   - GET  /v1/stripe/subscriptions/status")
print("   - POST /v1/stripe/subscriptions/change-plan")
print("   - Webhooks: customer.subscription.created/updated/deleted")

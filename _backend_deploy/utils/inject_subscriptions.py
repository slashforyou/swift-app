import re

# Fix exports
path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/subscriptions.js'
with open(path, 'r') as f:
    content = f.read()

content = re.sub(
    r'// =+ ROUTES =+.*?module\.exports = \{ registerRoutes \};',
    'module.exports = {\n  createSubscription,\n  cancelSubscription,\n  resumeSubscription,\n  getSubscriptionStatus,\n  changePlan,\n};',
    content,
    flags=re.DOTALL
)

with open(path, 'w') as f:
    f.write(content)
print('EXPORTS_FIXED')

# Inject routes into index.js
idx_path = '/srv/www/htdocs/swiftapp/server/index.js'
with open(idx_path, 'r') as f:
    idx = f.read()

if 'stripe/subscriptions' not in idx:
    marker = "logger.info('STRIPE', 'Routes Stripe activées');"
    injection = """

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
    idx = idx.replace(marker, marker + injection)
    with open(idx_path, 'w') as f:
        f.write(idx)
    print('ROUTES_INJECTED')
else:
    print('ROUTES_ALREADY_EXIST')

# Inject webhook cases
wh_path = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/webhooks.js'
with open(wh_path, 'r') as f:
    wh = f.read()

if 'customer.subscription.created' not in wh:
    # Add require
    req_line = "const { handleSubscriptionCreated, handleSubscriptionUpdated, handleSubscriptionDeleted, handleSubscriptionInvoicePaid, handleTrialWillEnd } = require('./subscription-webhooks');"
    insert_after = "const { connect, close } = require('../../../swiftDb');"
    wh = wh.replace(insert_after, insert_after + '\n' + req_line)

    # Add cases before default:
    cases = """
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

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(data, connection);
      break;

"""
    default_match = re.search(r'(\s*default:\s*\n)', wh)
    if default_match:
        wh = wh[:default_match.start()] + cases + wh[default_match.start():]
        print('WEBHOOKS_INJECTED')
    else:
        print('WARNING: default case not found')

    with open(wh_path, 'w') as f:
        f.write(wh)
else:
    print('WEBHOOKS_ALREADY_EXIST')

/**
 * Stripe Configuration Module — Dual Mode (Test + Live)
 * 
 * Uses AsyncLocalStorage + Proxy so that all existing endpoint code
 * using `const { stripe } = require('./config/stripe')` automatically
 * routes to the correct Stripe instance (test or live) based on the
 * request context set by the middleware.
 * 
 * ZERO changes needed in endpoint files!
 * 
 * .env keys (backward compatible):
 *   STRIPE_SECRET_KEY=sk_live_xxx          ← mapped to _LIVE
 *   STRIPE_PUBLISHABLE_KEY=pk_live_xxx     ← mapped to _LIVE  
 *   STRIPE_WEBHOOK_SECRET=whsec_xxx        ← mapped to _LIVE
 *   STRIPE_SECRET_KEY_TEST=sk_test_xxx
 *   STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxx
 *   STRIPE_WEBHOOK_SECRET_TEST=whsec_xxx   (optional)
 */

require('dotenv').config();
const { AsyncLocalStorage } = require('async_hooks');

// ─── Async context for per-request Stripe mode ───
const stripeStorage = new AsyncLocalStorage();

// ─── Read keys (support both old and new env var naming) ───
const LIVE_SECRET = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
const LIVE_PUBLISHABLE = process.env.STRIPE_PUBLISHABLE_KEY_LIVE || process.env.STRIPE_PUBLISHABLE_KEY;
const LIVE_WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET;

const TEST_SECRET = process.env.STRIPE_SECRET_KEY_TEST;
const TEST_PUBLISHABLE = process.env.STRIPE_PUBLISHABLE_KEY_TEST;
const TEST_WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET_TEST;

// ─── Check what's available ───
const hasLive = !!(LIVE_SECRET && LIVE_PUBLISHABLE);
const hasTest = !!(TEST_SECRET && TEST_PUBLISHABLE);

if (!hasLive && !hasTest) {
  console.warn('⚠️  No Stripe keys configured — Stripe features disabled');
  module.exports = {
    stripe: null, stripeLive: null, stripeTest: null,
    config: null, isConfigured: false,
    stripeStorage,
    getStripeForMode: () => null,
    validateConfiguration: () => console.warn('⚠️  Stripe not configured')
  };
  return;
}

// ─── Stripe API options ───
const STRIPE_OPTIONS = {
  apiVersion: '2023-10-16',
  typescript: false,
  maxNetworkRetries: 3,
  timeout: 30000
};

// ─── Create real Stripe instances ───
const stripeLib = require('stripe');

const stripeLive = hasLive ? stripeLib(LIVE_SECRET, STRIPE_OPTIONS) : null;
const stripeTest = hasTest ? stripeLib(TEST_SECRET, STRIPE_OPTIONS) : null;

// ─── Helper: get the right instance for a mode ───
function getStripeForMode(mode) {
  if (mode === 'test') return stripeTest || stripeLive;
  return stripeLive || stripeTest;
}

// ─── Helper: get the active instance from async context ───
function getActiveStripe() {
  const store = stripeStorage.getStore();
  const mode = store?.mode || 'live';
  return getStripeForMode(mode);
}

// ─── The magic: a Proxy that auto-routes to the right Stripe instance ───
// All existing code doing `stripe.accounts.create()` etc. just works.
const stripe = new Proxy({}, {
  get(_target, prop) {
    const instance = getActiveStripe();
    if (!instance) return undefined;
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

// ─── Config object ───
const stripeConfig = {
  live: {
    secretKey: LIVE_SECRET,
    publishableKey: LIVE_PUBLISHABLE,
    webhookSecret: LIVE_WEBHOOK
  },
  test: {
    secretKey: TEST_SECRET,
    publishableKey: TEST_PUBLISHABLE,
    webhookSecret: TEST_WEBHOOK
  },
  connect: {
    clientId: process.env.STRIPE_CLIENT_ID || null,
    accountType: process.env.STRIPE_CONNECT_ACCOUNT_TYPE || 'standard'
  },
  platform: {
    feePercentage: parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || '2.5'),
    currency: 'AUD',
    country: 'AU'
  },
  features: {
    paymentReminders: process.env.ENABLE_PAYMENT_REMINDERS === 'true',
    recurringInvoices: process.env.ENABLE_RECURRING_INVOICES === 'true',
    subscriptions: process.env.ENABLE_SUBSCRIPTIONS === 'true'
  },
  webhook: {
    secret: LIVE_WEBHOOK, // backward compat
    url: `${process.env.API_BASE_URL || 'https://cobbr-app.com'}/swift-app/v1/stripe/webhooks`
  }
};

// ─── Validation ───
function validateConfiguration() {
  const modes = [];
  if (hasLive) modes.push('LIVE');
  if (hasTest) modes.push('TEST');
  
  console.log(`✅ Stripe dual-mode: [${modes.join(' + ')}]`);
  if (hasLive && !LIVE_SECRET.startsWith('sk_live_')) {
    console.error('❌ STRIPE_SECRET_KEY_LIVE does not start with sk_live_');
  }
  if (hasTest && !TEST_SECRET.startsWith('sk_test_')) {
    console.error('❌ STRIPE_SECRET_KEY_TEST does not start with sk_test_');
  }
  if (hasLive) console.log('   ✅ Live keys OK');
  if (hasTest) console.log('   ✅ Test keys OK');
  if (!hasTest) console.warn('   ⚠️  No test keys — test accounts will fail');
  if (!hasLive) console.warn('   ⚠️  No live keys — live accounts will fail');
}

module.exports = {
  // ✅ Backward compatible — this Proxy auto-routes per request context
  stripe,
  config: stripeConfig,
  isConfigured: true,
  
  // AsyncLocalStorage for middleware
  stripeStorage,
  
  // Direct access to real instances (for special cases)
  stripeLive,
  stripeTest,
  getStripeForMode,
  getActiveStripe,
  
  // Helpers
  hasLive,
  hasTest,
  validateConfiguration
};

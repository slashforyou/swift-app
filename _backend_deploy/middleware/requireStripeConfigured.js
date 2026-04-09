/**
 * Backward-compatible wrapper.
 * Now delegates to resolveStripeMode which handles dual-mode routing.
 * All routes using requireStripeConfigured now automatically get the
 * correct Stripe instance (test or live) via AsyncLocalStorage.
 */
const { resolveStripeMode } = require('./stripeMode');

module.exports = { requireStripeConfigured: resolveStripeMode };

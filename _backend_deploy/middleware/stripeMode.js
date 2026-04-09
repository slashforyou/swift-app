/**
 * Stripe Mode Middleware
 * 
 * Replaces the old `requireStripeConfigured` middleware.
 * Detects the Stripe mode (test/live) for the requesting company,
 * then wraps the downstream handler chain in an AsyncLocalStorage context
 * so that `const { stripe } = require('./config/stripe')` auto-routes
 * to the correct Stripe instance. ZERO changes needed in endpoints.
 * 
 * Detection order:
 * 1. Company's connected account stripe_mode from DB
 * 2. X-Stripe-Mode header from frontend
 * 3. Default to 'live'
 */

const { stripeStorage, isConfigured, getStripeForMode } = require('../config/stripe');
const { connect, close } = require('../swiftDb');

/**
 * Middleware: resolves Stripe mode and wraps request in AsyncLocalStorage context.
 * Drop-in replacement for requireStripeConfigured.
 */
function resolveStripeMode(req, res, next) {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      error: 'Stripe not configured',
      message: 'Stripe features are not available. Please configure Stripe API keys.'
    });
  }

  const companyId = req.user?.company_id || req.body?.company_id || req.query?.company_id;

  // Fast path: if no company, use header or default
  if (!companyId) {
    const mode = _getModeFromHeader(req) || 'live';
    req.stripeMode = mode;
    stripeStorage.run({ mode }, () => next());
    return;
  }

  // Look up company's connected account mode
  _resolveCompanyMode(companyId)
    .then(dbMode => {
      const mode = dbMode || _getModeFromHeader(req) || 'live';
      req.stripeMode = mode;
      stripeStorage.run({ mode }, () => next());
    })
    .catch(err => {
      console.error('⚠️ [resolveStripeMode] DB error, falling back to live:', err.message);
      const mode = _getModeFromHeader(req) || 'live';
      req.stripeMode = mode;
      stripeStorage.run({ mode }, () => next());
    });
}

/**
 * Same as resolveStripeMode but also verifies the company has a connected account
 */
function requireStripeConnected(req, res, next) {
  if (!isConfigured) {
    return res.status(503).json({ success: false, error: 'Stripe not configured' });
  }

  const companyId = req.user?.company_id || req.body?.company_id || req.query?.company_id;
  if (!companyId) {
    return res.status(401).json({ success: false, error: 'No company found for user' });
  }

  _resolveCompanyAccount(companyId)
    .then(account => {
      if (!account) {
        return res.status(400).json({
          success: false,
          error: 'Stripe account not connected',
          action_required: 'connect_stripe'
        });
      }

      const mode = account.stripe_mode || _getModeFromHeader(req) || 'live';
      req.stripeMode = mode;
      req.stripeAccountId = account.stripe_account_id;
      stripeStorage.run({ mode }, () => next());
    })
    .catch(err => {
      console.error('❌ [requireStripeConnected] Error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to check Stripe status' });
    });
}

// ─── Private helpers ───

function _getModeFromHeader(req) {
  const h = req.headers['x-stripe-mode'];
  return (h === 'test' || h === 'live') ? h : null;
}

async function _resolveCompanyMode(companyId) {
  const connection = await connect();
  try {
    const [rows] = await connection.query(
      'SELECT stripe_mode FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL LIMIT 1',
      [companyId]
    );
    return rows.length > 0 ? rows[0].stripe_mode : null;
  } finally {
    close(connection);
  }
}

async function _resolveCompanyAccount(companyId) {
  const connection = await connect();
  try {
    const [rows] = await connection.query(
      'SELECT stripe_account_id, stripe_mode FROM stripe_connected_accounts WHERE company_id = ? AND disconnected_at IS NULL LIMIT 1',
      [companyId]
    );
    return rows.length > 0 ? rows[0] : null;
  } finally {
    close(connection);
  }
}

module.exports = {
  resolveStripeMode,
  requireStripeConnected
};

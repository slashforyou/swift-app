"""
Patch: Add submitCompanyDetails endpoint to onboarding.js
Creates /v1/stripe/onboarding/company-details that sends company data to Stripe
via stripe.accounts.update({ company: { ... } })
"""
import sys

FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js"

NEW_FUNCTION = r'''
/**
 * POST /v1/stripe/onboarding/company-details
 * Submit company name, tax_id, registration_number, phone, and company address.
 * Calls stripe.accounts.update with company payload.
 */
async function submitCompanyDetails(req, res) {
  const connection = await connect();

  try {
    console.log('🏢 [Stripe Onboarding] === COMPANY DETAILS ===');

    const companyId = req.user?.company_id;
    const { name, tax_id, registration_number, phone, address } = req.body;

    if (!companyId) {
      return sendValidationError(res, 'Company ID not found in token', ['company_id'], { source: 'jwt' });
    }

    if (!name) {
      return sendValidationError(res, 'Company name is required', ['name']);
    }

    const accountContext = await getStripeAccountContext(connection, companyId);
    if (!accountContext) {
      return res.status(404).json({
        success: false,
        error: 'STRIPE_ACCOUNT_NOT_FOUND',
        code: 'STRIPE_ACCOUNT_NOT_FOUND',
        message: 'No Stripe account found'
      });
    }

    const { stripeAccountId, businessType } = accountContext;
    console.log(`🧭 [Stripe Onboarding] endpoint=company-details account_id=${stripeAccountId} business_type=${businessType}`);

    // Build company payload for Stripe
    const companyPayload = {
      name: name,
      tax_id: tax_id || undefined,
      phone: phone || undefined,
      registration_number: registration_number || undefined
    };

    // Include company address if provided
    if (address && address.line1) {
      companyPayload.address = {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: (address.state || '').toUpperCase(),
        postal_code: address.postal_code,
        country: 'AU'
      };
    }

    const updatePayload = { company: companyPayload };

    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);
    console.log('✅ [Stripe Onboarding] Company details submitted');

    // Sync to companies table
    try {
      const syncFields = [];
      const syncValues = [];
      if (name) { syncFields.push('name = ?'); syncValues.push(name); }
      if (tax_id) { syncFields.push('abn = ?'); syncValues.push(tax_id); }
      if (registration_number) { syncFields.push('acn = ?'); syncValues.push(registration_number); }
      if (phone) { syncFields.push('phone = ?'); syncValues.push(phone); }
      if (address) {
        if (address.line1) { syncFields.push('street_address = ?'); syncValues.push(address.line1); }
        if (address.city) { syncFields.push('suburb = ?'); syncValues.push(address.city); }
        if (address.state) { syncFields.push('state = ?'); syncValues.push(address.state.toUpperCase()); }
        if (address.postal_code) { syncFields.push('postcode = ?'); syncValues.push(address.postal_code); }
      }
      if (syncFields.length > 0) {
        syncFields.push('updated_at = NOW()');
        await connection.query(
          `UPDATE companies SET ${syncFields.join(', ')} WHERE id = ?`,
          [...syncValues, companyId]
        );
        console.log('[Stripe->Company] Synced company details for company ' + companyId);
      }
    } catch (syncErr) {
      console.warn('[Stripe->Company] Company details sync failed (non-critical):', syncErr.message);
    }

    // Update onboarding progress
    await connection.query(
      `UPDATE stripe_connected_accounts
       SET onboarding_progress = 50,
           updated_at = NOW()
       WHERE company_id = ? AND disconnected_at IS NULL`,
      [companyId]
    );

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);

    res.json({
      success: true,
      message: 'Company details saved',
      progress: 50,
      next_step: onboardingState.next_step,
      requirements_pending: onboardingState.requirements_pending,
      account_status: onboardingState.account_status
    });

  } catch (error) {
    console.error('❌ [Stripe Onboarding] Company details error:', error.message);

    if (error.type === 'StripeInvalidRequestError') {
      return sendStripeValidationError(res, error);
    }

    res.status(500).json({ success: false, error: error.message });
  } finally {
    await close(connection);
  }
}

'''

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Check if already patched
if "async function submitCompanyDetails" in content:
    print("SKIP: submitCompanyDetails already exists in file")
    sys.exit(0)

# 2. Insert function BEFORE module.exports
EXPORT_LINE = "module.exports = {"
if EXPORT_LINE not in content:
    print("FAIL: Could not find module.exports")
    sys.exit(1)

content = content.replace(EXPORT_LINE, NEW_FUNCTION + EXPORT_LINE, 1)

# 3. Add to exports
OLD_EXPORTS = "  submitAddress,"
NEW_EXPORTS = "  submitAddress,\n  submitCompanyDetails,"
if OLD_EXPORTS not in content:
    print("FAIL: Could not find submitAddress in exports")
    sys.exit(1)

content = content.replace(OLD_EXPORTS, NEW_EXPORTS, 1)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: Added submitCompanyDetails endpoint to onboarding.js")

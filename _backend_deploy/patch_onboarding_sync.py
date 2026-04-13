#!/usr/bin/env python3
"""Patch onboarding.js to sync Stripe data -> companies table"""
import sys

f = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'
with open(f, 'r') as fh:
    c = fh.read()

patched = 0

# ======== PATCH 1: personal-info sync ========
old1 = "    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);\n\n    res.json({\n      success: true, \n      message: 'Personal information saved',"

new1 = """    // Sync Stripe data to companies table (bidirectional sync)
    try {
      if (businessType === 'company' && company) {
        const syncFields = {};
        if (company.name) syncFields.name = company.name;
        if (company.tax_id) syncFields.abn = company.tax_id;
        if (company.registration_number) syncFields.acn = company.registration_number;
        if (company.phone) {
          const cleanPhone = (company.phone || '').replace(/^\\+61/, '0');
          syncFields.phone = cleanPhone;
        }
        const keys = Object.keys(syncFields);
        if (keys.length > 0) {
          const setClauses = keys.map(k => k + ' = ?').join(', ');
          const values = keys.map(k => syncFields[k]);
          values.push(companyId);
          await connection.query(
            'UPDATE companies SET ' + setClauses + ', updated_at = NOW() WHERE id = ?',
            values
          );
          console.log('[Stripe->Company] Synced ' + keys.join(', ') + ' for company ' + companyId);
        }
      }
    } catch (syncErr) {
      console.warn('[Stripe->Company] Sync failed (non-critical):', syncErr.message);
    }

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);

    res.json({
      success: true, 
      message: 'Personal information saved',"""

if old1 in c:
    c = c.replace(old1, new1, 1)
    patched += 1
    print('PATCH1_OK')
else:
    print('PATCH1_FAIL - anchor not found')

# ======== PATCH 2: business-profile sync ========
old2 = "    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);\n\n    res.json({\n      success: true,\n      message: 'Business profile saved',"

new2 = """    // Sync Stripe data to companies table (bidirectional sync)
    try {
      const syncFields = {};
      if (url) syncFields.website = url;
      const keys = Object.keys(syncFields);
      if (keys.length > 0) {
        const setClauses = keys.map(k => k + ' = ?').join(', ');
        const values = keys.map(k => syncFields[k]);
        values.push(companyId);
        await connection.query(
          'UPDATE companies SET ' + setClauses + ', updated_at = NOW() WHERE id = ?',
          values
        );
        console.log('[Stripe->Company] Synced ' + keys.join(', ') + ' for company ' + companyId);
      }
    } catch (syncErr) {
      console.warn('[Stripe->Company] Sync failed (non-critical):', syncErr.message);
    }

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);

    res.json({
      success: true,
      message: 'Business profile saved',"""

if old2 in c:
    c = c.replace(old2, new2, 1)
    patched += 1
    print('PATCH2_OK')
else:
    print('PATCH2_FAIL - anchor not found')

# ======== PATCH 3: address sync ========
old3 = "    console.log(`\\u2705 [Stripe Onboarding] Address submitted`);\n\n    // Sauvegarder progression"

new3 = """    console.log(`\\u2705 [Stripe Onboarding] Address submitted`);

    // Sync Stripe address to companies table (bidirectional sync)
    try {
      await connection.query(
        'UPDATE companies SET street_address = ?, suburb = ?, state = ?, postcode = ?, updated_at = NOW() WHERE id = ?',
        [line1, city, state.toUpperCase(), postal_code, companyId]
      );
      console.log('[Stripe->Company] Synced address for company ' + companyId);
    } catch (syncErr) {
      console.warn('[Stripe->Company] Address sync failed (non-critical):', syncErr.message);
    }

    // Sauvegarder progression"""

if old3 in c:
    c = c.replace(old3, new3, 1)
    patched += 1
    print('PATCH3_OK')
else:
    print('PATCH3_FAIL - anchor not found')

# Write result
with open(f, 'w') as fh:
    fh.write(c)

print(f'TOTAL_PATCHED={patched}')

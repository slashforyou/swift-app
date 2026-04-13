#!/usr/bin/env python3
"""Debug and apply remaining patches for onboarding.js sync"""

f = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'
with open(f, 'r') as fh:
    c = fh.read()

patched = 0

# ======= PATCH 1: personal-info sync =======
# Use a more robust anchor
anchor1 = "const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);\n\n    res.json({\n      success: true,\n      message: 'Personal information saved',"
anchor1b = "const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);\n\n    res.json({\n      success: true, \n      message: 'Personal information saved',"

# Find which one matches
if anchor1 in c:
    use1 = anchor1
    print("ANCHOR1: no-trailing-space")
elif anchor1b in c:
    use1 = anchor1b
    print("ANCHOR1: trailing-space")
else:
    use1 = None
    print("ANCHOR1: NOT FOUND")
    # Try to find the line manually
    lines = c.split('\n')
    for i, line in enumerate(lines):
        if "Personal information saved" in line:
            print(f"  Found at line {i+1}: {repr(line)}")
            # Show context
            for j in range(max(0, i-3), min(len(lines), i+3)):
                print(f"  L{j+1}: {repr(lines[j])}")

if use1:
    sync_code = """    // Sync Stripe data to companies table (bidirectional sync)
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

    """ + use1
    c = c.replace(use1, sync_code, 1)
    patched += 1
    print("PATCH1_APPLIED")


# ======= PATCH 3: address sync =======
anchor3 = "Address submitted`);\n\n    // Sauvegarder progression"
anchor3b = "Address submitted`);\n    // Sauvegarder progression"

if anchor3 in c:
    use3 = anchor3
    print("ANCHOR3: double-newline")
elif anchor3b in c:
    use3 = anchor3b
    print("ANCHOR3: single-newline")
else:
    use3 = None
    print("ANCHOR3: NOT FOUND")
    lines = c.split('\n')
    for i, line in enumerate(lines):
        if "Address submitted" in line:
            print(f"  Found at line {i+1}: {repr(line)}")
            for j in range(max(0, i-1), min(len(lines), i+4)):
                print(f"  L{j+1}: {repr(lines[j])}")

if use3:
    addr_sync = use3.replace(
        "// Sauvegarder progression",
        """// Sync Stripe address to companies table (bidirectional sync)
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
    )
    c = c.replace(use3, addr_sync, 1)
    patched += 1
    print("PATCH3_APPLIED")


with open(f, 'w') as fh:
    fh.write(c)

print(f"TOTAL_PATCHED={patched}")

#!/usr/bin/env python3
"""Apply remaining patches for onboarding.js sync using line-based approach"""
import re

f = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'
with open(f, 'r') as fh:
    lines = fh.readlines()

patched = 0

# ======= PATCH 1: Insert sync code before personal-info res.json =======
# Find the line "message: 'Personal information saved'"
# Insert sync code BEFORE the refreshStripeRequirements call
for i, line in enumerate(lines):
    if "message: 'Personal information saved'" in line:
        # Go back to find refreshStripeRequirements line
        insert_idx = None
        for j in range(i-1, max(i-10, 0), -1):
            if 'refreshStripeRequirements' in lines[j]:
                insert_idx = j
                break
        if insert_idx is not None:
            sync_block = """
    // Sync Stripe data to companies table (bidirectional sync)
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

"""
            lines.insert(insert_idx, sync_block)
            patched += 1
            print(f"PATCH1_APPLIED at line {insert_idx}")
        else:
            print("PATCH1_FAIL: could not find refreshStripeRequirements before personal-info res.json")
        break
else:
    print("PATCH1_FAIL: Personal information saved line not found")


# ======= PATCH 3: Insert sync code before address Sauvegarder progression =======
# Re-scan since we may have shifted lines
for i, line in enumerate(lines):
    if 'Address submitted' in line:
        # Find the "Sauvegarder progression" comment after this line
        for j in range(i+1, min(i+6, len(lines))):
            if 'Sauvegarder progression' in lines[j]:
                addr_sync = """
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

"""
                lines.insert(j, addr_sync)
                patched += 1
                print(f"PATCH3_APPLIED at line {j}")
                break
        else:
            print("PATCH3_FAIL: Sauvegarder progression not found after Address submitted")
        break
else:
    print("PATCH3_FAIL: Address submitted line not found")


with open(f, 'w') as fh:
    fh.writelines(lines)

print(f"TOTAL_PATCHED={patched}")

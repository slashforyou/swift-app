#!/usr/bin/env python3
"""Patch onboarding.js to sync bank account data -> companies table"""

f = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'
with open(f, 'r') as fh:
    lines = fh.readlines()

patched = 0

# Find "Bank account added" line and insert sync before "Sauvegarder progression"
for i, line in enumerate(lines):
    if 'Bank account added' in line:
        for j in range(i+1, min(i+6, len(lines))):
            if 'Sauvegarder progression' in lines[j]:
                bank_sync = """
    // Sync bank holder name + BSB to companies table (bidirectional sync)
    try {
      await connection.query(
        'UPDATE companies SET bank_account_name = ?, bsb = ?, updated_at = NOW() WHERE id = ?',
        [account_holder_name, bsbClean, companyId]
      );
      console.log('[Stripe->Company] Synced bank info for company ' + companyId);
    } catch (syncErr) {
      console.warn('[Stripe->Company] Bank sync failed (non-critical):', syncErr.message);
    }

"""
                lines.insert(j, bank_sync)
                patched += 1
                print(f"PATCH_BANK_APPLIED at line {j}")
                break
        break

with open(f, 'w') as fh:
    fh.writelines(lines)

print(f"TOTAL_PATCHED={patched}")

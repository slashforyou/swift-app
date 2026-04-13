#!/usr/bin/env python3
"""Remove duplicate business-profile sync block from onboarding.js"""

f = '/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js'
with open(f, 'r') as fh:
    c = fh.read()

# The duplicate: two consecutive sync blocks for business-profile
dup = """    // Sync Stripe data to companies table (bidirectional sync)
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

    // Sync Stripe data to companies table (bidirectional sync)
    try {
      const syncFields = {};
      if (url) syncFields.website = url;"""

single = """    // Sync Stripe data to companies table (bidirectional sync)
    try {
      const syncFields = {};
      if (url) syncFields.website = url;"""

if dup in c:
    c = c.replace(dup, single, 1)
    print("DEDUP_OK")
else:
    print("DEDUP_NOT_FOUND")

with open(f, 'w') as fh:
    fh.write(c)

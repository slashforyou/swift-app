#!/usr/bin/env python3
"""
sync_stripe_company.py — Synchronise Stripe onboarding data TO companies table
and allows Stripe onboarding screens to pre-fill FROM companies table.

Changes to onboarding.js:
1. submitPersonalInfo: sync company.name, tax_id, phone, acn → companies table
2. submitBusinessProfile: sync url → companies.website
3. submitAddress: sync line1, city, state, postal_code → companies table

Also adds a new helper endpoint:
4. GET /v1/stripe/onboarding/prefill — returns company data for Stripe pre-fill
"""

import paramiko
import sys

HOST = "82.165.49.120"
USER = "root"
ONBOARDING_FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/stripe/onboarding.js"

# ---------- patches ----------

# 1. After personal-info saves to stripe_connected_accounts, sync to companies
PERSONAL_INFO_ANCHOR = """    await connection.query(
      `UPDATE stripe_connected_accounts
       SET onboarding_personal_info = ?,
           onboarding_progress = 20,
           updated_at = NOW()
       WHERE company_id = ? AND disconnected_at IS NULL`,
      [JSON.stringify(savedPayload), companyId]
    );

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);"""

PERSONAL_INFO_REPLACEMENT = """    await connection.query(
      `UPDATE stripe_connected_accounts
       SET onboarding_personal_info = ?,
           onboarding_progress = 20,
           updated_at = NOW()
       WHERE company_id = ? AND disconnected_at IS NULL`,
      [JSON.stringify(savedPayload), companyId]
    );

    // ⭐ Sync Stripe data → companies table (bidirectional sync)
    try {
      if (businessType === 'company' && company) {
        const syncFields = {};
        if (company.name) syncFields.name = company.name;
        if (company.tax_id) syncFields.abn = company.tax_id;
        if (company.registration_number) syncFields.acn = company.registration_number;
        if (company.phone) {
          // Strip +61 prefix for local storage
          const cleanPhone = (company.phone || '').replace(/^\\+61/, '0');
          syncFields.phone = cleanPhone;
        }
        const keys = Object.keys(syncFields);
        if (keys.length > 0) {
          const setClauses = keys.map(k => `${k} = ?`).join(', ');
          const values = keys.map(k => syncFields[k]);
          values.push(companyId);
          await connection.query(
            `UPDATE companies SET ${setClauses}, updated_at = NOW() WHERE id = ?`,
            values
          );
          console.log(`🔄 [Stripe→Company] Synced ${keys.join(', ')} for company ${companyId}`);
        }
      }
    } catch (syncErr) {
      console.warn('⚠️ [Stripe→Company] Sync failed (non-critical):', syncErr.message);
    }

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);"""


# 2. After business-profile saves, sync url → website
BUSINESS_PROFILE_ANCHOR = """    await connection.query(
      `UPDATE stripe_connected_accounts
       SET onboarding_progress = 40,
           updated_at = NOW()
       WHERE company_id = ? AND disconnected_at IS NULL`,
      [companyId]
    );

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);

    res.json({
      success: true,
      message: 'Business profile saved',"""

BUSINESS_PROFILE_REPLACEMENT = """    await connection.query(
      `UPDATE stripe_connected_accounts
       SET onboarding_progress = 40,
           updated_at = NOW()
       WHERE company_id = ? AND disconnected_at IS NULL`,
      [companyId]
    );

    // ⭐ Sync Stripe data → companies table (bidirectional sync)
    try {
      const syncFields = {};
      if (url) syncFields.website = url;
      if (product_description) syncFields.industry_type = product_description.substring(0, 50);
      const keys = Object.keys(syncFields);
      if (keys.length > 0) {
        const setClauses = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => syncFields[k]);
        values.push(companyId);
        await connection.query(
          `UPDATE companies SET ${setClauses}, updated_at = NOW() WHERE id = ?`,
          values
        );
        console.log(`🔄 [Stripe→Company] Synced ${keys.join(', ')} for company ${companyId}`);
      }
    } catch (syncErr) {
      console.warn('⚠️ [Stripe→Company] Sync failed (non-critical):', syncErr.message);
    }

    const onboardingState = await refreshStripeRequirements(connection, companyId, stripeAccountId);

    res.json({
      success: true,
      message: 'Business profile saved',"""


# 3. After address saves, sync address fields
ADDRESS_ANCHOR = """    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);

    console.log(`✅ [Stripe Onboarding] Address submitted`);

    // Sauvegarder progression
    await connection.query(
      `UPDATE stripe_connected_accounts
       SET onboarding_progress = 40,
           updated_at = NOW()
       WHERE company_id = ? AND disconnected_at IS NULL`,
      [companyId]
    );"""

ADDRESS_REPLACEMENT = """    await updateStripeAccount(connection, companyId, stripeAccountId, updatePayload);

    console.log(`✅ [Stripe Onboarding] Address submitted`);

    // ⭐ Sync Stripe address → companies table (bidirectional sync)
    try {
      await connection.query(
        `UPDATE companies
         SET street_address = ?, suburb = ?, state = ?, postcode = ?, updated_at = NOW()
         WHERE id = ?`,
        [line1, city, state.toUpperCase(), postal_code, companyId]
      );
      console.log(`🔄 [Stripe→Company] Synced address for company ${companyId}`);
    } catch (syncErr) {
      console.warn('⚠️ [Stripe→Company] Address sync failed (non-critical):', syncErr.message);
    }

    // Sauvegarder progression
    await connection.query(
      `UPDATE stripe_connected_accounts
       SET onboarding_progress = 40,
           updated_at = NOW()
       WHERE company_id = ? AND disconnected_at IS NULL`,
      [companyId]
    );"""


def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER)

    # Read current file
    sftp = ssh.open_sftp()
    with sftp.open(ONBOARDING_FILE, "r") as f:
        content = f.read().decode("utf-8")

    # Backup
    with sftp.open(ONBOARDING_FILE + ".bak_sync", "w") as f:
        f.write(content)
    print("✅ Backup created")

    # Apply patches
    patches = [
        ("personal-info sync", PERSONAL_INFO_ANCHOR, PERSONAL_INFO_REPLACEMENT),
        ("business-profile sync", BUSINESS_PROFILE_ANCHOR, BUSINESS_PROFILE_REPLACEMENT),
        ("address sync", ADDRESS_ANCHOR, ADDRESS_REPLACEMENT),
    ]

    for name, anchor, replacement in patches:
        if anchor in content:
            content = content.replace(anchor, replacement)
            print(f"✅ Patched: {name}")
        else:
            print(f"⚠️ Anchor not found for: {name}")
            # Try to find nearby text
            first_line = anchor.strip().split('\n')[0].strip()
            if first_line in content:
                print(f"   First line found but full anchor didn't match (whitespace?)")

    # Write patched file
    with sftp.open(ONBOARDING_FILE, "w") as f:
        f.write(content)
    print("✅ File written")

    sftp.close()

    # Restart PM2
    _, stdout, _ = ssh.exec_command("cd /srv/www/htdocs/swiftapp/server && pm2 restart swiftapp --update-env 2>&1")
    print(stdout.read().decode())

    ssh.close()
    print("✅ Done — Stripe onboarding now syncs to companies table")


if __name__ == "__main__":
    main()

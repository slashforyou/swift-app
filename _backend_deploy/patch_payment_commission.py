#!/usr/bin/env python3
"""
patch_payment_commission.py
────────────────────────────────
Patches the Stripe payment endpoint to use plan-based commission rates.
Replaces the hardcoded stripe_platform_fee_percentage with a lookup
from the companies.plan_type field and the PLAN_COMMISSION_RATE table.

Target: /srv/www/htdocs/swiftapp/server/endPoints/v1/jobs/payments.js

Run on server:
  python3 /srv/www/htdocs/swiftapp/server/_deploy/patch_payment_commission.py
"""
import os, shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/jobs/payments.js"

if not os.path.exists(FILE):
    print("ERROR: payments.js not found at: " + FILE)
    exit(1)

with open(FILE, "r") as f:
    content = f.read()

MARKER = "// [PATCH] commission_v1"
if MARKER in content:
    print("Already patched — skipping.")
    exit(0)

# ── Find the old hardcoded fee line and replace with plan-based lookup ────────
OLD_FEE_BLOCK = """    // Calculer Application Fee (commission plateforme)
    const platformFeePercent = job.stripe_platform_fee_percentage || 2.5;
    const applicationFeeAmount = Math.round(amountCents * (platformFeePercent / 100));"""

NEW_FEE_BLOCK = """    // [PATCH] commission_v1 — plan-based platform fee
    const PLAN_COMMISSION_RATES = { free: 0.03, pro: 0.015, enterprise: 0.005 };
    const PLAN_MIN_FEE_CENTS    = { free: 50,   pro: 25,    enterprise: 0     };
    let planType = 'free';
    try {
      const companyId = job.contractor_company_id || req.user.company_id;
      const [planRows] = await connection.execute(
        'SELECT plan_type FROM companies WHERE id = ?', [companyId]
      );
      planType = planRows[0]?.plan_type || 'free';
    } catch (_planErr) {
      // fallback to free plan on error
    }
    const planRate   = PLAN_COMMISSION_RATES[planType] ?? 0.03;
    const planMinFee = PLAN_MIN_FEE_CENTS[planType]    ?? 50;
    const applicationFeeAmount = Math.max(planMinFee, Math.round(amountCents * planRate));
    // Record commission in job_commissions (non-blocking)
    connection.execute(
      `INSERT IGNORE INTO job_commissions
         (job_id, company_id, plan_type, job_amount_aud, commission_rate, commission_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [jobId, job.contractor_company_id || 0, planType,
       amount, planRate, applicationFeeAmount / 100]
    ).catch((e) => console.warn('[commission] insert failed (non-blocking):', e.message));"""

if OLD_FEE_BLOCK not in content:
    print("ERROR: could not find fee calculation block in payments.js")
    print("Looking for:")
    print(OLD_FEE_BLOCK)
    exit(1)

content = content.replace(OLD_FEE_BLOCK, NEW_FEE_BLOCK, 1)

# ── Write back with backup ────────────────────────────────────────────────────
ts = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + ".bak_" + ts)
with open(FILE, "w") as f:
    f.write(content)

print("OK — plan-based commission patched in payments.js (backup: " + FILE + ".bak_" + ts + ")")

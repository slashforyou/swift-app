#!/usr/bin/env python3
"""
patch_accept_job_notification.py
────────────────────────────────
Adds push notification to the contractee company when a contractor accepts a job.
Replaces the existing TODO comment in acceptJob.js with the real sendPushToCompany call.

Target: /srv/www/htdocs/swiftapp/server/endPoints/v1/acceptJob.js

Run on server:
  python3 /srv/www/htdocs/swiftapp/server/_deploy/patch_accept_job_notification.py
"""
import os, shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/acceptJob.js"

with open(FILE, "r") as f:
    content = f.read()

MARKER = "// [PATCH] push_notif_on_accept"
if MARKER in content:
    print("Already patched — skipping.")
    exit(0)

# ─── Step 1: inject sendPushToCompany helper after the require line ───────────
REQUIRE_LINE = "const { connect } = require('../../swiftDb');"
if REQUIRE_LINE not in content:
    # fallback — double-quote variant
    REQUIRE_LINE = 'const { connect } = require("../../swiftDb");'

if REQUIRE_LINE not in content:
    print("ERROR: could not find require('../../swiftDb') in acceptJob.js")
    exit(1)

PUSH_HELPER = """
// [PATCH] push_notif_on_accept — sendPushToCompany helper
async function sendPushToCompany(connection, companyId, title, body, data = {}) {
  try {
    const [tokenRows] = await connection.execute(
      `SELECT ut.push_token
       FROM user_push_tokens ut
       JOIN users u ON u.id = ut.user_id
       WHERE u.company_id = ? AND ut.push_token IS NOT NULL AND ut.is_active = 1`,
      [companyId]
    );
    if (!tokenRows.length) return;
    const messages = tokenRows.map((r) => ({
      to: r.push_token,
      title,
      body,
      data: { ...data, screen: 'Calendar' },
      sound: 'default',
    }));
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn('[acceptJob] Push non-blocking error:', err.message);
  }
}
"""

content = content.replace(REQUIRE_LINE, REQUIRE_LINE + PUSH_HELPER, 1)

# ─── Step 2: replace TODO comment with real push call ────────────────────────
OLD_TODO = "    // TODO: Envoyer une notification au créateur du job (contractee)"
if OLD_TODO not in content:
    print("ERROR: could not find TODO comment anchor in acceptJob.js")
    exit(1)

PUSH_CALL = """    // [PATCH] push_notif_on_accept — notify contractee that their job was accepted
    if (job.contractee_company_id) {
      try {
        const [contractorInfo] = await connection.execute(
          'SELECT name FROM companies WHERE id = ?', [userCompanyId]
        );
        const contractorName = contractorInfo[0]?.name || 'Un transporteur';
        const jobCode = job.code || job.id;
        await sendPushToCompany(
          connection,
          job.contractee_company_id,
          '\\u2705 Job accepté',
          `${contractorName} a accepté le job #${jobCode}`,
          {
            type: 'job_accepted',
            job_id: String(job.id),
            job_code: String(jobCode),
          }
        );
      } catch (pushErr) {
        console.warn('[acceptJob] Push failed (non-blocking):', pushErr.message);
      }
    }"""

content = content.replace(OLD_TODO, PUSH_CALL, 1)

# ─── Step 3: write back with backup ──────────────────────────────────────────
ts = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_{ts}")
with open(FILE, "w") as f:
    f.write(content)

print(f"OK — push notification injected in acceptJob.js (backup: {FILE}.bak_{ts})")

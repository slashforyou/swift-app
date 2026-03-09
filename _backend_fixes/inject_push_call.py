#!/usr/bin/env python3
"""
Patch transfers.js: insérer l'appel sendPushToCompany juste avant le return 201
"""
import os, shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/jobs/transfers.js"

with open(FILE, "r") as f:
    content = f.read()

MARKER = "// [PATCH] push_notif_call"
if MARKER in content:
    print("Already patched, skipping.")
    exit(0)

ANCHOR = "    return res.status(201).json({ success: true, data: transfer[0] });"
if ANCHOR not in content:
    print("ERROR: anchor not found:", repr(ANCHOR[:50]))
    exit(1)

PUSH_CALL = """    // [PATCH] push_notif_call — notify contractor company of new assignment
    if (recipient_company_id) {
      try {
        const [jobInfo] = await connection.execute(
          'SELECT start_window_start FROM jobs WHERE id = ?', [jobId]
        );
        const jobDate = jobInfo[0]?.start_window_start
          ? new Date(jobInfo[0].start_window_start).toISOString().split('T')[0]
          : null;
        await sendPushToCompany(connection, recipient_company_id,
          '\\u{1F4E6} Nouvelle mission',
          'Un job vous a \\u00e9t\\u00e9 attribu\\u00e9' + (jobDate ? ' pour le ' + jobDate : ''),
          { screen: 'Calendar', date: jobDate, job_id: jobId, type: 'job_assigned_contractor' }
        );
      } catch (pushErr) {
        console.error('[push] sendPush error (non-blocking):', pushErr.message);
      }
    }

"""

ts = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_{ts}")
content = content.replace(ANCHOR, PUSH_CALL + ANCHOR, 1)
with open(FILE, "w") as f:
    f.write(content)
print("OK — push notif call injected in createTransferEndpoint")

#!/usr/bin/env python3
"""Fix deleteJobById.js: add company_id to user SELECT + ownership check."""
import os, shutil
from datetime import datetime

FILE = "/srv/www/htdocs/swiftapp/server/endPoints/v1/deleteJobById.js"
MARKER = "// [PATCH] company_ownership_v1"

with open(FILE, "r") as f:
    content = f.read()

if MARKER in content:
    print("Already patched — skipping.")
    exit(0)

changes = 0

# 1. Add company_id to test-mode SELECT
old = "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?"
new = "SELECT id, first_name, last_name, email, role, company_id FROM users WHERE id = ?"
if old in content:
    content = content.replace(old, new, 1)
    changes += 1
    print("  test-select: patched")
else:
    print("  WARN: test-select anchor not found")

# 2. Inject ownership check before the existing status === 'deleted' check
anchor = "    if (job.status === 'deleted') {"
ownership_block = (
    "    // [PATCH] company_ownership_v1 — cross-company guard\n"
    "    if (user.company_id) {\n"
    "      const jobContractee = job.contractee_company_id;\n"
    "      const jobContractor = job.contractor_company_id;\n"
    "      if (user.company_id !== jobContractee && user.company_id !== jobContractor) {\n"
    "        return res.status(403).json({\n"
    "          success: false,\n"
    "          error: 'Acces refuse : ce job appartient a une autre entreprise'\n"
    "        });\n"
    "      }\n"
    "    }\n\n"
)

# Only inject at the FIRST occurrence of the anchor
idx = content.find(anchor)
if idx != -1:
    content = content[:idx] + ownership_block + content[idx:]
    changes += 1
    print("  ownership check: injected")
else:
    print("  WARN: status=deleted anchor not found")

if changes > 0:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(FILE, FILE + ".bak_ownership2_" + ts)
    with open(FILE, "w") as f:
        f.write(content)
    print("OK — deleteJobById.js patched (" + str(changes) + " changes)")
else:
    print("No changes applied.")

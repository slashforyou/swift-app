#!/usr/bin/env python3
"""
patch_job_company_ownership.py
──────────────────────────────────────────────────────
Fixes Broken Access Control (OWASP #1) in critical job endpoints:
missing cross-company ownership check.

Before this patch, any authenticated admin/manager from ANY company
could delete or complete jobs belonging to another company.

Affected files:
  1. endPoints/v1/deleteJobById.js   — adds company_id to user SELECT + check
  2. endPoints/v1/completeJobById.js — adds contractee/contractor to job query + check

Run on server:
  python3 /srv/www/htdocs/swiftapp/server/_deploy/patch_job_company_ownership.py
"""
import os, shutil
from datetime import datetime

BASE = "/srv/www/htdocs/swiftapp/server/endPoints/v1"
MARKER = "// [PATCH] company_ownership_v1"

def backup(path):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = path + ".bak_ownership_" + ts
    shutil.copy2(path, dest)
    return dest

# ─────────────────────────────────────────────────────────────────────────────
# 1. deleteJobById.js
# ─────────────────────────────────────────────────────────────────────────────
DELETE_FILE = BASE + "/deleteJobById.js"

if not os.path.exists(DELETE_FILE):
    print("SKIP: deleteJobById.js not found")
else:
    with open(DELETE_FILE, "r") as f:
        content = f.read()

    if MARKER in content:
        print("deleteJobById.js — already patched, skipping.")
    else:
        # Fix 1a: add company_id to user SELECT (test-mode branch)
        OLD_SELECT_TEST = "        'SELECT id, first_name, last_name, email, role FROM users WHERE id = ?',"
        NEW_SELECT_TEST = "        'SELECT id, first_name, last_name, email, role, company_id FROM users WHERE id = ?',"

        # Fix 1b: add company_id to user SELECT (prod session token branch)
        OLD_SELECT_PROD = ("        `SELECT u.id, u.first_name, u.last_name, u.email, u.role, d.session_expires\n"
                           "         FROM users u\n"
                           "         JOIN devices d ON d.user_id = u.id\n"
                           "         WHERE d.session_token = ? AND d.session_expires > NOW() AND d.disabled = 0`")
        NEW_SELECT_PROD = ("        `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.company_id, d.session_expires\n"
                           "         FROM users u\n"
                           "         JOIN devices d ON d.user_id = u.id\n"
                           "         WHERE d.session_token = ? AND d.session_expires > NOW() AND d.disabled = 0`")

        # Fix 1c: add job query with company columns
        OLD_JOB_QUERY = ("      'SELECT id, code, client_id, status, contractor_company_id, contractee_company_id, created_at, updated_at FROM jobs WHERE id = ?'")
        # (used twice — only the FIRST occurrence needs patching, the others are already after deletion)

        # Fix 1d: inject ownership check AFTER the role check and BEFORE the deletion
        # The existing role check ends with:
        OLD_ROLE_BLOCK = (
            "    // 🛡️ Vérification des autorisations de suppression\n"
            "    const allowedRoles = ['admin', 'manager'];\n"
            "    if (!allowedRoles.includes(user.role)) {\n"
            "      return res.status(403).json({\n"
            "        success: false,\n"
            "        error: `Droits insuffisants. Seuls les rôles ${allowedRoles.join(', ')} peuvent supprimer des jobs`\n"
            "      });\n"
            "    }"
        )

        # We need to find the job fetch and add ownership check after it
        # The pattern is: job is fetched, then status check, then dependency check
        OLD_JOB_FETCH_STATUS = (
            "    if (job.status === 'deleted') {\n"
            "      return res.status(400).json({\n"
            "        success: false,\n"
            "        error: 'Ce job est déjà marqué comme supprimé',"
        )
        NEW_JOB_FETCH_STATUS = (
            "    // [PATCH] company_ownership_v1 — cross-company guard\n"
            "    if (user.company_id) {\n"
            "      const jobContractee = job.contractee_company_id;\n"
            "      const jobContractor = job.contractor_company_id;\n"
            "      if (user.company_id !== jobContractee && user.company_id !== jobContractor) {\n"
            "        return res.status(403).json({\n"
            "          success: false,\n"
            "          error: 'Accès refusé : ce job appartient à une autre entreprise'\n"
            "        });\n"
            "      }\n"
            "    }\n"
            "\n"
            "    if (job.status === 'deleted') {\n"
            "      return res.status(400).json({\n"
            "        success: false,\n"
            "        error: 'Ce job est déjà marqué comme supprimé',"
        )

        missing = []
        if OLD_SELECT_TEST not in content:
            missing.append("SELECT test-mode")
        if OLD_SELECT_PROD not in content:
            missing.append("SELECT prod-mode")
        if OLD_JOB_FETCH_STATUS not in content:
            missing.append("job status check anchor")

        if missing:
            print("ERROR: deleteJobById.js — could not find anchor(s): " + ", ".join(missing))
            print("Manual review required.")
        else:
            content = content.replace(OLD_SELECT_TEST, NEW_SELECT_TEST, 1)
            content = content.replace(OLD_SELECT_PROD, NEW_SELECT_PROD, 1)
            content = content.replace(OLD_JOB_FETCH_STATUS, NEW_JOB_FETCH_STATUS, 1)

            bk = backup(DELETE_FILE)
            with open(DELETE_FILE, "w") as f:
                f.write(content)
            print("OK — deleteJobById.js patched (company ownership check added, backup: " + bk + ")")


# ─────────────────────────────────────────────────────────────────────────────
# 2. completeJobById.js
# ─────────────────────────────────────────────────────────────────────────────
COMPLETE_FILE = BASE + "/completeJobById.js"

if not os.path.exists(COMPLETE_FILE):
    print("SKIP: completeJobById.js not found")
else:
    with open(COMPLETE_FILE, "r") as f:
        content = f.read()

    if MARKER in content:
        print("completeJobById.js — already patched, skipping.")
    else:
        # The job query does NOT include contractor/contractee company ids — add them
        OLD_JOB_QUERY_NUMERIC = (
            "      jobQuery = `SELECT id, code, status, current_step, contact_first_name, contact_last_name,\n"
            "                        contractor_name, contractee_name, created_at, updated_at\n"
            "                 FROM jobs WHERE id = ?`;"
        )
        NEW_JOB_QUERY_NUMERIC = (
            "      jobQuery = `SELECT id, code, status, current_step, contact_first_name, contact_last_name,\n"
            "                        contractor_name, contractee_name, contractee_company_id, contractor_company_id, created_at, updated_at\n"
            "                 FROM jobs WHERE id = ?`;"
        )
        OLD_JOB_QUERY_CODE = (
            "      jobQuery = `SELECT id, code, status, current_step, contact_first_name, contact_last_name,\n"
            "                        contractor_name, contractee_name, created_at, updated_at\n"
            "                 FROM jobs WHERE code = ?`;"
        )
        NEW_JOB_QUERY_CODE = (
            "      jobQuery = `SELECT id, code, status, current_step, contact_first_name, contact_last_name,\n"
            "                        contractor_name, contractee_name, contractee_company_id, contractor_company_id, created_at, updated_at\n"
            "                 FROM jobs WHERE code = ?`;"
        )

        # Inject ownership check right after hasPermission is granted for admin/manager
        # Find the block where permission is set and inject ownership check before the final execute
        OLD_PERM_CHECK = (
            "    if (!hasPermission) {\n"
            "      consoleStyle.error('AUTH', 'Permission denied for job completion', {\n"
            "        userId: user.id,\n"
            "        userRole,\n"
            "        jobId\n"
            "      });\n"
            "      return res.status(403).json({\n"
            "        success: false,\n"
            "        message: 'Insufficient permissions to complete this job'\n"
            "      });\n"
            "    }"
        )
        NEW_PERM_CHECK = (
            "    if (!hasPermission) {\n"
            "      consoleStyle.error('AUTH', 'Permission denied for job completion', {\n"
            "        userId: user.id,\n"
            "        userRole,\n"
            "        jobId\n"
            "      });\n"
            "      return res.status(403).json({\n"
            "        success: false,\n"
            "        message: 'Insufficient permissions to complete this job'\n"
            "      });\n"
            "    }\n"
            "\n"
            "    // [PATCH] company_ownership_v1 — cross-company guard\n"
            "    if (user.company_id && job.contractee_company_id) {\n"
            "      const allowed = user.company_id === job.contractee_company_id ||\n"
            "                      user.company_id === job.contractor_company_id;\n"
            "      if (!allowed) {\n"
            "        return res.status(403).json({\n"
            "          success: false,\n"
            "          message: 'Access denied: this job belongs to another company'\n"
            "        });\n"
            "      }\n"
            "    }"
        )

        missing = []
        if OLD_JOB_QUERY_NUMERIC not in content:
            missing.append("job query numeric")
        if OLD_JOB_QUERY_CODE not in content:
            missing.append("job query code")
        if OLD_PERM_CHECK not in content:
            missing.append("permission check anchor")

        if missing:
            print("ERROR: completeJobById.js — could not find anchor(s): " + ", ".join(missing))
            print("Manual review required.")
        else:
            content = content.replace(OLD_JOB_QUERY_NUMERIC, NEW_JOB_QUERY_NUMERIC, 1)
            content = content.replace(OLD_JOB_QUERY_CODE, NEW_JOB_QUERY_CODE, 1)
            content = content.replace(OLD_PERM_CHECK, NEW_PERM_CHECK, 1)

            bk = backup(COMPLETE_FILE)
            with open(COMPLETE_FILE, "w") as f:
                f.write(content)
            print("OK — completeJobById.js patched (company ownership check added, backup: " + bk + ")")

print("\nDone. Restart pm2 to apply: pm2 restart swiftapp")

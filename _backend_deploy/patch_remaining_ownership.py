#!/usr/bin/env python3
"""
Patch ownership checks for archiveJobById.js and assignCrewToJobById.js
Fixes Broken Access Control: admin/manager from any company could act on any job.
"""

import shutil
import sys

SERVER_ROOT = '/srv/www/htdocs/swiftapp/server/endPoints/v1/'

files = {
    'archiveJobById.js': SERVER_ROOT + 'archiveJobById.js',
    'assignCrewToJobById.js': SERVER_ROOT + 'assignCrewToJobById.js',
}

PATCHES = [
    # ─── archiveJobById.js ───────────────────────────────────────────────────
    {
        'file': 'archiveJobById.js',
        'label': 'archive: extend user SELECT to include company_id',
        'old': "      'SELECT role FROM users WHERE id = ?',",
        'new': "      'SELECT role, company_id FROM users WHERE id = ?',",
    },
    {
        'file': 'archiveJobById.js',
        'label': 'archive: extract userCompanyId variable',
        'old': "    const userRole = userRows[0].role;\n    logger.debug('AUTH', 'User role retrieved', { userId: user.id, role: userRole });",
        'new': "    const userRole = userRows[0].role;\n    const userCompanyId = userRows[0].company_id;\n    logger.debug('AUTH', 'User role retrieved', { userId: user.id, role: userRole });",
    },
    {
        'file': 'archiveJobById.js',
        'label': 'archive: inject cross-company ownership guard',
        'old': "    logger.debug('AUTH', 'Permission granted for job archiving', {",
        'new': (
            "    // [PATCH] company_ownership_v1 — cross-company guard for archive\n"
            "    if (userCompanyId) {\n"
            "      if (userCompanyId !== job.contractee_company_id && userCompanyId !== job.contractor_company_id) {\n"
            "        logger.warning('SECURITY', 'Cross-company archive attempt blocked', {\n"
            "          userId: user.id, userCompanyId, jobId,\n"
            "          jobContractee: job.contractee_company_id,\n"
            "          jobContractor: job.contractor_company_id\n"
            "        });\n"
            "        await connection.release();\n"
            "        return res.status(403).json({ success: false, message: 'Access denied: this job belongs to another company' });\n"
            "      }\n"
            "    }\n"
            "\n"
            "    logger.debug('AUTH', 'Permission granted for job archiving', {"
        ),
    },
    # ─── assignCrewToJobById.js ──────────────────────────────────────────────
    {
        'file': 'assignCrewToJobById.js',
        'label': 'assign: add contractee_company_id to job SELECT',
        'old': (
            "      `SELECT j.id, j.code, j.status, j.client_id, j.contractor_company_id,\n"
            "              c.first_name as client_first_name, c.last_name as client_last_name"
        ),
        'new': (
            "      `SELECT j.id, j.code, j.status, j.client_id, j.contractor_company_id, j.contractee_company_id,\n"
            "              c.first_name as client_first_name, c.last_name as client_last_name"
        ),
    },
    {
        'file': 'assignCrewToJobById.js',
        'label': 'assign: inject cross-company ownership guard',
        'old': "    logger.debug('AUTH', 'Permission granted for crew assignment', {",
        'new': (
            "    // [PATCH] company_ownership_v1 — cross-company guard for assign crew\n"
            "    const userCompanyId = userRows[0].company_id;\n"
            "    if (userCompanyId) {\n"
            "      if (userCompanyId !== job.contractee_company_id && userCompanyId !== job.contractor_company_id) {\n"
            "        logger.warning('SECURITY', 'Cross-company crew assignment attempt blocked', {\n"
            "          userId: user.id, userCompanyId, jobId,\n"
            "          jobContractee: job.contractee_company_id,\n"
            "          jobContractor: job.contractor_company_id\n"
            "        });\n"
            "        await connection.release();\n"
            "        return res.status(403).json({ success: false, message: 'Access denied: this job belongs to another company' });\n"
            "      }\n"
            "    }\n"
            "\n"
            "    logger.debug('AUTH', 'Permission granted for crew assignment', {"
        ),
    },
]

def patch_file(path, label, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    count = content.count(old)
    if count == 0:
        print(f'  [SKIP] {label}: anchor not found')
        return False
    if count > 1:
        print(f'  [WARN] {label}: anchor matches {count} times — skipping to be safe')
        return False
    if new in content:
        print(f'  [SKIP] {label}: already patched')
        return True
    new_content = content.replace(old, new, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'  [OK]   {label}')
    return True

patched = set()
for patch in PATCHES:
    fname = patch['file']
    fpath = files[fname]
    if fname not in patched:
        backup = fpath + '.bak_ownership_v1'
        try:
            shutil.copy2(fpath, backup)
            print(f'Backup: {backup}')
        except Exception as e:
            print(f'Backup failed for {fname}: {e}')
        patched.add(fname)
    patch_file(fpath, patch['label'], patch['old'], patch['new'])

print('\nDone. Verify with:')
for fname, fpath in files.items():
    print(f"  grep -c 'company_ownership_v1' {fpath}")

#!/usr/bin/env python3
"""
Deploy archiveJobById endpoint to the server:
  1. Copy endPoints/v1/archiveJobById.js to the server
  2. Inject DELETE /swift-app/v1/job/:id route into server/index.js
  3. Patch getJobById.js to add can_delete permission

Run on server via: python3 deploy_archive_job.py
"""
import shutil
import datetime
import os

SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
INDEX_PATH = f'{SERVER_DIR}/index.js'
ENDPOINT_DST = f'{SERVER_DIR}/endPoints/v1/archiveJobById.js'
GETJOB_PATH = f'{SERVER_DIR}/endPoints/v1/getJobById.js'

# ──────────────────────────────────────────────
# 1. Copy endpoint file
# ──────────────────────────────────────────────
ENDPOINT_SRC = os.path.join(os.path.dirname(__file__), 'endPoints', 'v1', 'archiveJobById.js')
if not os.path.exists(ENDPOINT_SRC):
    print(f'ERROR: Source file not found: {ENDPOINT_SRC}')
    exit(1)

shutil.copy2(ENDPOINT_SRC, ENDPOINT_DST)
print(f'OK - Copied archiveJobById.js to {ENDPOINT_DST}')

# ──────────────────────────────────────────────
# 2. Inject route into index.js
# ──────────────────────────────────────────────
backup = INDEX_PATH + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(INDEX_PATH, backup)

with open(INDEX_PATH, 'r') as f:
    content = f.read()

# Idempotent check
if 'archiveJobByIdEndpoint' in content:
    print('Route already present in index.js, skipping injection')
else:
    anchor = '// 404 HANDLER'
    if anchor not in content:
        # Fallback anchor: pause route
        anchor = "v1/job/:id/pause"
        if anchor not in content:
            print('ERROR: Could not find injection anchor in index.js')
            exit(1)

    new_route = """// 🗂️ [DELETE] /swift-app/v1/job/:id — Archive job (soft-delete)
app.delete('/swift-app/v1/job/:id', require('./middleware/authenticateToken').authenticateToken, (req, res) => {
  const { archiveJobByIdEndpoint } = require('./endPoints/v1/archiveJobById');
  archiveJobByIdEndpoint(req, res);
});

"""
    content = content.replace(anchor, new_route + anchor, 1)

    with open(INDEX_PATH, 'w') as f:
        f.write(content)

    print(f'OK - Route injected into index.js (backup: {backup})')

# ──────────────────────────────────────────────
# 3. Patch getJobById.js — add can_delete permission
# ──────────────────────────────────────────────
with open(GETJOB_PATH, 'r') as f:
    job_content = f.read()

if 'can_delete' in job_content:
    print('can_delete already present in getJobById.js, skipping')
else:
    old = "can_reassign: isOwner && ['pending', 'declined'].includes(jobStatus),"
    new = (
        "can_reassign: isOwner && ['pending', 'declined'].includes(jobStatus),\n"
        "      can_delete: isOwner && ['pending', 'draft', 'declined'].includes(jobStatus),"
    )
    if old not in job_content:
        print('WARNING: could not find can_reassign anchor in getJobById.js — skipping can_delete patch')
    else:
        job_backup = GETJOB_PATH + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        shutil.copy2(GETJOB_PATH, job_backup)
        job_content = job_content.replace(old, new, 1)
        with open(GETJOB_PATH, 'w') as f:
            f.write(job_content)
        print(f'OK - can_delete added to getJobById.js (backup: {job_backup})')

print('')
print('✅ Deploy complete. Restart PM2 with: pm2 restart 17')

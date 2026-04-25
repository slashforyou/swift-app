"""
Inject /v1/users/lookup-by-phones route into SwiftApp backend (index.js)
matching the existing inline-require style.

Run on server: python3 /tmp/inject_users_lookup.py
"""
import os
import shutil
import subprocess
import sys

INDEX = '/srv/www/htdocs/swiftapp/server/index.js'
SRC = '/tmp/usersLookup.js'
DST = '/srv/www/htdocs/swiftapp/server/endPoints/v1/usersLookup.js'
MIG = '/tmp/034_add_users_phone_digits.sql'

shutil.copy(SRC, DST)
print(f'[1/3] Copied endpoint to {DST}')

with open(INDEX) as f:
    content = f.read()

if 'usersLookup.lookupUsersByPhones' in content or '/swift-app/v1/users/lookup-by-phones' in content:
    print('[2/3] Route already present, skipping')
else:
    block = (
        "\n// [POST] Lookup Cobbr users by phone numbers (contacts import)\n"
        "app.post('/swift-app/v1/users/lookup-by-phones', "
        "require('./middleware/authenticateToken').authenticateToken, (req, res) => {\n"
        "  const { lookupUsersByPhones } = require('./endPoints/v1/usersLookup');\n"
        "  lookupUsersByPhones(req, res);\n"
        "});\n"
    )
    anchor = "[GET] List Clients"
    idx = content.find(anchor)
    if idx != -1:
        # back up to start of preceding comment line
        line_start = content.rfind('\n', 0, idx) + 1
        # actually insert right BEFORE the comment block — find prev non-comment newline
        idx = line_start - 1 if line_start > 0 else 0
    else:
        idx = content.find("app.get('/swift-app/v1/clients'")
    if idx == -1:
        print('ERROR: no anchor found')
        sys.exit(1)
    # Insert at start of line containing idx
    line_start = content.rfind('\n', 0, idx) + 1
    content = content[:line_start] + block + content[line_start:]
    with open(INDEX, 'w') as f:
        f.write(content)
    print('[2/3] Route injected')

if os.path.exists(MIG):
    print('[3a/3] Running migration 034...')
    candidates = [
        ['mysql', '--defaults-file=/root/.my.cnf', 'swiftapp'],
        ['mysql', '--defaults-file=/etc/mysql/swiftapp.cnf', 'swiftapp'],
        ['mysql', '-u', 'swiftapp_user', 'swiftapp'],
    ]
    ok = False
    for cmd in candidates:
        try:
            with open(MIG) as mf:
                r = subprocess.run(cmd, stdin=mf, capture_output=True, text=True, timeout=60)
            if r.returncode == 0:
                print(f'  Migration applied via: {" ".join(cmd)}')
                if r.stdout.strip():
                    print('  stdout:', r.stdout.strip())
                ok = True
                break
            else:
                print(f'  Failed via {" ".join(cmd)}: {r.stderr.strip()[:200]}')
        except FileNotFoundError:
            continue
        except Exception as e:
            print(f'  Error: {e}')
    if not ok:
        print('  WARNING: migration could not run automatically -- apply manually')
else:
    print('[3a/3] Migration file not found, skipping')

print('[3b/3] Restarting PM2...')
r = subprocess.run(['pm2', 'restart', 'swiftapp'], capture_output=True, text=True)
print(r.stdout)
if r.returncode != 0:
    print('PM2 stderr:', r.stderr)

print('=== DONE ===')

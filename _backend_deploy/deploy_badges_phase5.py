#!/usr/bin/env python3
"""
deploy_badges_phase5.py
Déploie la Phase 5 (Badges) sur le serveur swiftapp.

Étapes :
  1. SQL migration (notified_at sur user_badges)
  2. Copier badgeChecker.js sur le serveur
  3. Exécuter inject_badges_phase5.py sur le serveur
  4. Vérifier la syntaxe Node.js
  5. Redémarrer PM2
"""

import subprocess
import sys
import os
import tempfile

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
HOST = 'sushinari'
SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
PM2_ID = '17'

DB_USER = 'swiftapp_user'
DB_PASS = 'U%Xgxvc54EKUD39PcwNAYvuS'
DB_NAME = 'swiftapp'

def run(cmd, check=True):
    print(f'  $ {" ".join(cmd)}')
    r = subprocess.run(cmd)
    if r.returncode != 0 and check:
        print(f'  ❌ Échec (code {r.returncode})')
        sys.exit(1)
    return r

def scp(local, remote):
    run(['scp', local, f'{HOST}:{remote}'])

def ssh(command):
    return run(['ssh', HOST, command])

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — SQL migration
# ═══════════════════════════════════════════════════════════════════════════════
print('\n[Step 1] SQL migration badges_phase5_migration.sql …')
sql_file = os.path.join(THIS_DIR, 'badges_phase5_migration.sql')
scp(sql_file, '/tmp/badges_phase5_migration.sql')

# Write MySQL cnf locally, scp to server (avoids % escaping issues in shell)
cnf = tempfile.NamedTemporaryFile(mode='w', suffix='.cnf', delete=False)
cnf.write(f'[client]\nuser={DB_USER}\npassword={DB_PASS}\ndatabase={DB_NAME}\n')
cnf.close()
scp(cnf.name, '/tmp/phase5_db.cnf')
os.unlink(cnf.name)

ssh("mysql --defaults-file=/tmp/phase5_db.cnf < /tmp/badges_phase5_migration.sql && echo 'Migration OK' && rm /tmp/phase5_db.cnf")
print('  ✅ Migration SQL terminée')

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Copier badgeChecker.js sur le serveur
# ═══════════════════════════════════════════════════════════════════════════════
print('\n[Step 2] Copier badgeChecker.js …')
badge_checker = os.path.join(THIS_DIR, 'utils', 'badgeChecker.js')
scp(badge_checker, '/tmp/badgeChecker.js')
print('  ✅ badgeChecker.js envoyé via /tmp/')

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — Exécuter inject_badges_phase5.py sur le serveur
# ═══════════════════════════════════════════════════════════════════════════════
print('\n[Step 3] Injection des routes & hooks …')
inject_script = os.path.join(THIS_DIR, 'inject_badges_phase5.py')
scp(inject_script, '/tmp/inject_badges_phase5.py')
ssh('python3 /tmp/inject_badges_phase5.py')

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Vérifier la syntaxe Node.js
# ═══════════════════════════════════════════════════════════════════════════════
print('\n[Step 4] Vérification syntaxe Node.js …')
ssh(f'node --check {SERVER_DIR}/index.js 2>&1 && '
    f'node --check {SERVER_DIR}/endPoints/v1/gamificationV2.js 2>&1 && '
    f'node --check {SERVER_DIR}/utils/gamificationEngine.js 2>&1 && '
    f'node --check {SERVER_DIR}/utils/badgeChecker.js 2>&1 && '
    f'echo "Syntaxe OK"')

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Redémarrer PM2
# ═══════════════════════════════════════════════════════════════════════════════
print('\n[Step 5] Redémarrage PM2 …')
ssh(f'pm2 restart {PM2_ID} && sleep 2 && pm2 list')

print('\n✅ Phase 5 (Badges) déployée avec succès !')

#!/usr/bin/env python3
"""
deploy_scorecard_phase4.py
Déploie Phase 4 — Scorecard & Reviews
"""

import subprocess
import sys
import os

SERVER   = 'sushinari'
SRV_DIR  = '/srv/www/htdocs/swiftapp/server'
DB_USER  = 'swiftapp_user'
DB_PASS  = "U%Xgxvc54EKUD39PcwNAYvuS"
DB_NAME  = 'swiftapp'
LOCAL    = os.path.dirname(os.path.abspath(__file__))

def run(cmd, capture=True):
    r = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if r.returncode != 0:
        print(f'❌ ERREUR: {r.stderr or r.stdout}')
        sys.exit(1)
    return r.stdout.strip() if capture else None

def ssh(cmd):
    return run(f'ssh {SERVER} "{cmd}"')

def scp(local, remote):
    run(f'scp "{local}" {SERVER}:{remote}')

print('=' * 60)
print('Phase 4 — Scorecard & Reviews — DÉPLOIEMENT')
print('=' * 60)

# ── Étape 1 — Migration SQL ───────────────────────────────────────
print('\n[1/5] Migration SQL...')
scp(f'{LOCAL}/scorecard_phase4_migration.sql', '/tmp/scorecard_phase4_migration.sql')
out = ssh(f"mysql -u {DB_USER} -p'{DB_PASS}' {DB_NAME} < /tmp/scorecard_phase4_migration.sql 2>&1")
if out:
    print(f'   {out}')
print('✅ Migration SQL OK')

# ── Étape 2 — scoreEngine.js ──────────────────────────────────────
print('\n[2/5] Déploiement scoreEngine.js...')
scp(f'{LOCAL}/utils/scoreEngine.js', f'{SRV_DIR}/utils/scoreEngine.js')
syntax = ssh(f'node --check {SRV_DIR}/utils/scoreEngine.js 2>&1')
if syntax:
    print(f'❌ Syntaxe: {syntax}')
    sys.exit(1)
print('✅ scoreEngine.js OK')

# ── Étape 3 — Endpoints scorecard + review ────────────────────────
print('\n[3/5] Déploiement endpoints...')
scp(f'{LOCAL}/endPoints/v1/jobScorecard.js',  f'{SRV_DIR}/endPoints/v1/jobScorecard.js')
scp(f'{LOCAL}/endPoints/v1/clientReview.js',  f'{SRV_DIR}/endPoints/v1/clientReview.js')
for ep in ['jobScorecard', 'clientReview']:
    s = ssh(f'node --check {SRV_DIR}/endPoints/v1/{ep}.js 2>&1')
    if s:
        print(f'❌ Syntaxe {ep}: {s}')
        sys.exit(1)
print('✅ Endpoints OK')

# ── Étape 4 — Injection routes + hook completeJobById ────────────
print('\n[4/5] Injection routes dans index.js + hook completeJobById.js...')
scp(f'{LOCAL}/inject_scorecard_route.py', '/tmp/inject_scorecard_route.py')
out = ssh('python3 /tmp/inject_scorecard_route.py 2>&1')
print(f'   {out}')
# Vérif syntaxe index.js
s = ssh(f'node --check {SRV_DIR}/index.js 2>&1')
if s:
    print(f'❌ Syntaxe index.js: {s}')
    sys.exit(1)
print('✅ Injection OK')

# ── Étape 5 — Redémarrage PM2 ─────────────────────────────────────
print('\n[5/5] Redémarrage PM2...')
ssh('pm2 restart 17 2>&1')
import time; time.sleep(3)
status = ssh('pm2 show 17 2>&1 | grep status')
print(f'   PM2 status: {status}')
print('✅ PM2 redémarré')

print()
print('=' * 60)
print('✅ Phase 4 déployée avec succès !')
print()
print('Routes disponibles:')
print('  GET  /swift-app/v1/jobs/:id/scorecard')
print('  POST /swift-app/v1/jobs/:id/review-request')
print('  GET  /swift-app/v1/review/:token        (page HTML publique)')
print('  POST /swift-app/v1/review/:token        (soumettre avis)')
print('=' * 60)

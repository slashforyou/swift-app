#!/usr/bin/env python3
"""
deploy_trophies_phase3.py
Phase 3 — Trophées saisonniers : migration DB + moteur + cron + endpoint

Opérations :
  1. Exécuter trophy_season_migration.sql
     (tables : trophy_events, trophy_ledgers, trophy_season_archives)
  2. Pousser gamificationEngine.js (awardTrophies + hooks processJob/processReview)
  3. Pousser trophySeasonCron.js (archivage saison Jan 1 / Jul 1)
  4. Pousser gamificationV2_quests.js → gamificationV2.js
     (ajoute getV2TrophiesEndpoint + export)
  5. Redémarrer PM2 (id 17 - swiftapp)
"""
import subprocess
import sys
import os

SERVER   = 'sushinari'
DB_USER  = 'swiftapp_user'
DB_PASS  = 'U%Xgxvc54EKUD39PcwNAYvuS'
DB_NAME  = 'swiftapp'
APP_PATH = '/srv/www/htdocs/swiftapp/server'
PM2_ID   = '17'

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def run(cmd, label=''):
    """Exécute une commande, affiche le résultat, retourne le code de sortie."""
    label = label or ' '.join(cmd[:3])
    print(f'\n[{label}] $ {" ".join(cmd)}')
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if result.stdout.strip():
        print(result.stdout.strip()[:800])
    if result.stderr.strip():
        lines = [l for l in result.stderr.splitlines() if 'password' not in l.lower()]
        if lines:
            print('STDERR:', '\n'.join(lines[:15]))
    print(f'  -> exit {result.returncode}')
    return result.returncode


def abort(msg):
    print(f'\n!! ABORT : {msg}')
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# Verification des fichiers sources
# ─────────────────────────────────────────────────────────────────────────────
REQUIRED = [
    'trophy_season_migration.sql',
    'gamificationEngine.js',
    'cron/trophySeasonCron.js',
    'gamificationV2_quests.js',
    'inject_trophy_route.py',
]
print('Verification des fichiers sources...')
for f in REQUIRED:
    if not os.path.exists(f):
        abort(f'Fichier introuvable : {f}')
    print(f'  OK  {f}')


# ─────────────────────────────────────────────────────────────────────────────
# Etape 1 — Migration SQL
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ETAPE 1 -- Migration SQL (phase 3 trophees)')
print('=' * 60)

sql_file = 'trophy_season_migration.sql'
rc = run(['scp', sql_file, f'{SERVER}:/tmp/{sql_file}'], 'scp SQL')
if rc != 0:
    abort('SCP du fichier SQL echoue')

rc = run(
    ['ssh', SERVER, f"mysql -u{DB_USER} -p'{DB_PASS}' {DB_NAME} < /tmp/{sql_file}"],
    'mysql migrate'
)
if rc != 0:
    abort('Migration SQL echouee')
print('\n=> Migration SQL reussie')


# ─────────────────────────────────────────────────────────────────────────────
# Etape 2 — Pousser gamificationEngine.js
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ETAPE 2 -- Deploiement gamificationEngine.js')
print('=' * 60)

engine_dest = f'{APP_PATH}/utils/gamificationEngine.js'
run(['ssh', SERVER, f'cp {engine_dest} {engine_dest}.bak'], 'backup engine')

rc = run(['scp', 'gamificationEngine.js', f'{SERVER}:{engine_dest}'], 'scp engine')
if rc != 0:
    abort('Deploiement gamificationEngine.js echoue')
print('=> gamificationEngine.js deploye')


# ─────────────────────────────────────────────────────────────────────────────
# Etape 3 — Pousser trophySeasonCron.js
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ETAPE 3 -- Deploiement trophySeasonCron.js')
print('=' * 60)

cron_dest = f'{APP_PATH}/cron/trophySeasonCron.js'
run(['ssh', SERVER, f'cp {cron_dest} {cron_dest}.bak 2>/dev/null || true'], 'backup cron')

rc = run(['scp', 'cron/trophySeasonCron.js', f'{SERVER}:{cron_dest}'], 'scp cron')
if rc != 0:
    abort('Deploiement trophySeasonCron.js echoue')
print('=> trophySeasonCron.js deploye')

# Rappel manuel : ajouter dans index.js si pas encore fait
print()
print('[INFO] Verifier que index.js contient :')
print("         require('./cron/trophySeasonCron');")


# ─────────────────────────────────────────────────────────────────────────────
# Etape 4 — Pousser gamificationV2.js (endpoint /v2/trophies)
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ETAPE 4 -- Deploiement gamificationV2.js')
print('=' * 60)

gamif_dest = f'{APP_PATH}/endPoints/v1/gamificationV2.js'
run(['ssh', SERVER, f'cp {gamif_dest} {gamif_dest}.bak'], 'backup gamifV2')

rc = run(['scp', 'gamificationV2_quests.js', f'{SERVER}:{gamif_dest}'], 'scp gamifV2')
if rc != 0:
    abort('Deploiement gamificationV2.js echoue')
print('=> gamificationV2.js deploye')


# ─────────────────────────────────────────────────────────────────────────────
# Etape 5 — Injection route /v2/trophies + cron dans index.js
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ETAPE 5 -- Injection route trophies + cron dans index.js')
print('=' * 60)

inject_src  = 'inject_trophy_route.py'
inject_dest = f'/tmp/inject_trophy_route.py'

rc = run(['scp', inject_src, f'{SERVER}:{inject_dest}'], 'scp inject script')
if rc != 0:
    abort('SCP du script inject_trophy_route.py echoue')

rc = run(['ssh', SERVER, f'python3 {inject_dest}'], 'inject trophy route')
if rc != 0:
    abort('Injection route/cron dans index.js echouee')
print('=> Route /v2/trophies et cron injectes dans index.js')

# Verifier syntaxe des fichiers deployes
run(['ssh', SERVER, f'node -c {APP_PATH}/utils/gamificationEngine.js && echo "engine syntax OK"'], 'syntax engine')
run(['ssh', SERVER, f'node -c {APP_PATH}/endPoints/v1/gamificationV2.js && echo "gamifV2 syntax OK"'], 'syntax gamifV2')
run(['ssh', SERVER, f'node -c {APP_PATH}/cron/trophySeasonCron.js && echo "cron syntax OK"'], 'syntax cron')


# ─────────────────────────────────────────────────────────────────────────────
# Etape 6 — Redemarrer PM2
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ETAPE 6 -- Redemarrage PM2')
print('=' * 60)

rc = run(['ssh', SERVER, f'pm2 restart {PM2_ID}'], 'pm2 restart')
if rc != 0:
    abort('Redemarrage PM2 echoue')

run(['ssh', SERVER, f'pm2 show {PM2_ID} | grep -E "status|restarts|uptime"'], 'pm2 status')
print('=> PM2 redemarré')


# ─────────────────────────────────────────────────────────────────────────────
# Resume
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('Phase 3 (Trophees saisonniers) deployee avec succes !')
print()
print('Changements deployes :')
print('  * tables trophy_events, trophy_ledgers, trophy_season_archives creees')
print('  * gamificationEngine.js : getCurrentSeason(), awardTrophies()')
print('  * processJobCompleted -> +1 trophee utilisateur + company')
print('  * processReviewSubmitted -> +1 ou +2 trophees si note >= 4 etoiles')
print('  * trophySeasonCron.js : archivage Jan 1 + Jul 1 + push notification')
print('  * GET /v1/user/gamification/v2/trophies -> saison courante + archives')
print()
print('Actions manuelles si necessaire :')
print("  1. Ajouter dans index.js: require('./cron/trophySeasonCron');")
print("  2. Enregistrer la route getV2TrophiesEndpoint dans index.js")
print('=' * 60)

#!/usr/bin/env python3
"""
inject_trophy_route.py — Ajoute dans index.js :
  1. GET /swift-app/v1/user/gamification/v2/trophies → getV2TrophiesEndpoint
  2. require('./cron/trophySeasonCron')

Ce script s'exécute sur le serveur (copié via SCP puis run via SSH).
"""
import shutil
import datetime

INDEX = '/srv/www/htdocs/swiftapp/server/index.js'
backup = INDEX + '.bak_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(INDEX, backup)
print('Backup:', backup)

with open(INDEX, 'r', encoding='utf-8') as f:
    content = f.read()

changed = False

# ── 1. Route GET /v2/trophies ───────────────────────────────────────────────
ROUTE_ANCHOR = "app.get('/swift-app/v1/user/gamification/v2/daily-recap'"
TROPHY_ROUTE = """app.get('/swift-app/v1/user/gamification/v2/trophies', (req, res) => {
  const { getV2TrophiesEndpoint } = require('./endPoints/v1/gamificationV2');
  getV2TrophiesEndpoint(req, res);
});

"""

if 'getV2TrophiesEndpoint' in content:
    print('SKIP: route trophies deja presente dans index.js')
elif ROUTE_ANCHOR not in content:
    print('ERROR: ancre daily-recap introuvable dans index.js')
    exit(1)
else:
    content = content.replace(ROUTE_ANCHOR, TROPHY_ROUTE + ROUTE_ANCHOR, 1)
    print('OK: route /v2/trophies injectee')
    changed = True

# ── 2. Cron trophySeasonCron ────────────────────────────────────────────────
CRON_ANCHOR = "require('./cron/dailyRecapCron');"
TROPHY_CRON = "require('./cron/trophySeasonCron');\n\n  "

if 'trophySeasonCron' in content:
    print('SKIP: trophySeasonCron deja present dans index.js')
elif CRON_ANCHOR not in content:
    print('ERROR: ancre dailyRecapCron introuvable dans index.js')
    exit(1)
else:
    content = content.replace(CRON_ANCHOR, TROPHY_CRON + CRON_ANCHOR, 1)
    print('OK: require trophySeasonCron injecte')
    changed = True

if changed:
    with open(INDEX, 'w', encoding='utf-8') as f:
        f.write(content)
    print('index.js mis a jour avec succes')
else:
    print('Aucune modification necessaire')

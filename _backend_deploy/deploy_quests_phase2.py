#!/usr/bin/env python3
"""
deploy_quests_phase2.py
Phase 2.2 — Migration DB + mise à jour moteur de quêtes + endpoint

Opérations :
  1. Exécuter migrate_quests_phase2.sql (création gamification_quest_events,
     colonnes category/end_date/trophy_count/event_id, migration des données)
  2. Pousser le questEngine.js mis à jour (support intro/event + bonus XP)
  3. Pousser le gamificationV2.js mis à jour (endpoint quests avec category/event_info)
  4. Redémarrer PM2 (id 17 - swiftapp)
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
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout.strip():
        print(result.stdout.strip()[:800])
    if result.stderr.strip():
        lines = [l for l in result.stderr.splitlines() if 'password' not in l.lower()]
        if lines:
            print('STDERR:', '\n'.join(lines[:15]))
    print(f'  → exit {result.returncode}')
    return result.returncode


def abort(msg):
    print(f'\n❌ ABORT : {msg}')
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# Étape 1 — Migration SQL
# ─────────────────────────────────────────────────────────────────────────────
print('=' * 60)
print('ÉTAPE 1 — Migration SQL (phase 2)')
print('=' * 60)

sql_file = 'migrate_quests_phase2.sql'
if not os.path.exists(sql_file):
    abort(f'Fichier SQL introuvable : {sql_file}')

# Copier le fichier SQL vers le serveur
rc = run(['scp', sql_file, f'{SERVER}:/tmp/{sql_file}'], 'scp SQL')
if rc != 0:
    abort('SCP du fichier SQL échoué')

# Exécuter sur le serveur
rc = run(
    ['ssh', SERVER, f'mysql -u {DB_USER} -p\'{DB_PASS}\' {DB_NAME} < /tmp/{sql_file}'],
    'mysql migrate'
)
if rc != 0:
    abort('Migration SQL échouée')
print('\n✅ Migration SQL réussie')


# ─────────────────────────────────────────────────────────────────────────────
# Étape 2 — Pousser questEngine.js
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ÉTAPE 2 — Déploiement questEngine.js')
print('=' * 60)

quest_engine_src  = 'questEngine.js'
quest_engine_dest = f'{APP_PATH}/utils/questEngine.js'

if not os.path.exists(quest_engine_src):
    abort(f'Fichier introuvable : {quest_engine_src}')

# Sauvegarde
run(['ssh', SERVER, f'cp {quest_engine_dest} {quest_engine_dest}.bak'], 'backup questEngine')

# Déploiement
rc = run(['scp', quest_engine_src, f'{SERVER}:{quest_engine_dest}'], 'scp questEngine')
if rc != 0:
    abort('Déploiement questEngine.js échoué')
print('✅ questEngine.js déployé')


# ─────────────────────────────────────────────────────────────────────────────
# Étape 3 — Pousser gamificationV2_quests.js → gamificationV2.js
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ÉTAPE 3 — Déploiement gamificationV2.js (endpoint quests)')
print('=' * 60)

gamif_src  = 'gamificationV2_quests.js'
gamif_dest = f'{APP_PATH}/endPoints/v1/gamificationV2.js'

if not os.path.exists(gamif_src):
    abort(f'Fichier introuvable : {gamif_src}')

# Sauvegarde
run(['ssh', SERVER, f'cp {gamif_dest} {gamif_dest}.bak'], 'backup gamifV2')

# Déploiement
rc = run(['scp', gamif_src, f'{SERVER}:{gamif_dest}'], 'scp gamifV2')
if rc != 0:
    abort('Déploiement gamificationV2.js échoué')
print('✅ gamificationV2.js déployé')


# ─────────────────────────────────────────────────────────────────────────────
# Étape 4 — Redémarrer PM2
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('ÉTAPE 4 — Redémarrage PM2')
print('=' * 60)

rc = run(['ssh', SERVER, f'pm2 restart {PM2_ID}'], 'pm2 restart')
if rc != 0:
    abort('Redémarrage PM2 échoué')

# Vérifier le statut
run(['ssh', SERVER, f'pm2 show {PM2_ID} | grep -E "status|restarts|uptime"'], 'pm2 status')
print('✅ PM2 redémarré')


# ─────────────────────────────────────────────────────────────────────────────
# Résumé
# ─────────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 60)
print('✅ Phase 2.2 déployée avec succès !')
print()
print('Changements déployés :')
print('  • gamification_quest_events table créée')
print('  • quests.category (intro/daily/weekly/monthly/event)')
print('  • quests.end_date, trophy_count, event_id colonnes ajoutées')
print('  • quests general/onboarding migrées → category = intro')
print('  • questEngine.getPeriodKey() supporte intro + event')
print('  • questEngine.claimQuestReward() applique xp_bonus_multiplier')
print('  • GET /v2/quests retourne category, end_date, trophy_count, event_info')
print('  • POST /v2/quests/:code/claim valide period_key event_<id>')
print('=' * 60)

#!/usr/bin/env python3
"""
deploy_reviews_gamification.py — Script de déploiement complet pour :
  - Système de notation client post-job (multi-critères)
  - Gamification : XP + trophées saisonniers

ÉTAPES :
  1. Copier les fichiers backend sur le serveur (SCP)
  2. Appliquer les migrations SQL 051 et 052
  3. Injecter les routes dans index.js
  4. Redémarrer PM2

USAGE (depuis la machine locale) :
  python deploy_reviews_gamification.py

PRÉREQUIS :
  - SSH alias "sushinari" configuré dans ~/.ssh/config
  - Variables DB définies ci-dessous ou en variables d'env
"""

import subprocess
import sys

# ── Config ──────────────────────────────────────────────────────────────────
SSH_HOST = 'sushinari'
SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
PM2_ID = '17'

DB_USER = 'swiftapp_user'
DB_NAME = 'swiftapp'
# Le mot de passe DB doit être dans ~/.my.cnf sur le serveur ou passé via env
# Ne JAMAIS hardcoder un mot de passe ici

# ── Fichiers à déployer ──────────────────────────────────────────────────────
FILES = [
    # (source locale, destination sur serveur)
    ('_backend_deploy/endPoints/v1/completeJobById.js',  f'{SERVER_DIR}/endPoints/v1/completeJobById.js'),
    ('_backend_deploy/endPoints/v1/jobReviews.js',       f'{SERVER_DIR}/endPoints/v1/jobReviews.js'),
    ('_backend_deploy/utils/reviewGamification.js',      f'{SERVER_DIR}/utils/reviewGamification.js'),
    ('_backend_deploy/inject_complete_job_route.py',     f'{SERVER_DIR}/inject_complete_job_route.py'),
]

MIGRATIONS = [
    '_backend_deploy/migrations/051_extend_job_reviews_multicriteria.sql',
    '_backend_deploy/migrations/052_gamification_levels_trophies.sql',
]

def run(cmd, description):
    print(f'\n▶ {description}')
    print(f'  $ {cmd}')
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f'  ✗ ERREUR (code {result.returncode})')
        sys.exit(result.returncode)
    print(f'  ✓ OK')

def main():
    print('=' * 60)
    print('DÉPLOIEMENT : reviews gamification multi-critères')
    print('=' * 60)

    # 1. Copier les fichiers JS
    for src, dst in FILES:
        run(f'scp {src} {SSH_HOST}:{dst}', f'SCP {src}')

    # 2. Copier les migrations
    for mig in MIGRATIONS:
        filename = mig.split('/')[-1]
        run(f'scp {mig} {SSH_HOST}:/tmp/{filename}', f'SCP migration {filename}')

    # 3. Appliquer les migrations (utilise ~/.my.cnf sur le serveur pour le mot de passe)
    for mig in MIGRATIONS:
        filename = mig.split('/')[-1]
        run(
            f'ssh {SSH_HOST} "mysql -u {DB_USER} {DB_NAME} < /tmp/{filename}"',
            f'Appliquer migration {filename}'
        )

    # 4. Injecter les routes dans index.js
    run(
        f'ssh {SSH_HOST} "python3 {SERVER_DIR}/inject_complete_job_route.py"',
        'Injecter les routes dans index.js'
    )

    # 5. Redémarrer PM2
    run(
        f'ssh {SSH_HOST} "pm2 restart {PM2_ID}"',
        f'Redémarrer PM2 (id {PM2_ID})'
    )

    print('\n' + '=' * 60)
    print('✓ DÉPLOIEMENT TERMINÉ')
    print('  Routes disponibles :')
    print('  POST /swift-app/v1/jobs/:id/complete')
    print('  POST /swift-app/v1/jobs/:jobId/review-request')
    print('  POST /swift-app/v1/reviews/submit  (public)')
    print('  GET  /swift-app/v1/reviews')
    print('  GET  /swift-app/v1/jobs/:jobId/review')
    print('=' * 60)

if __name__ == '__main__':
    main()

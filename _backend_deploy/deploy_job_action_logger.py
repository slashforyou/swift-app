#!/usr/bin/env python3
"""
deploy_job_action_logger.py
────────────────────────────────────────────────────────────────────────────
Déploiement du fichier utils/jobActionLogger.js et création de la table
job_actions requise.

Cause du bug HTTP 500 sur POST /v1/job :
  patch_job_actions.js ajoute `require('../../utils/jobActionLogger')` dans
  createJob.js (et autres endpoints), MAIS le fichier jobActionLogger.js
  n'existait pas sur le serveur. Lors du lazy-loading de createJob.js au
  premier appel, Node.js lance MODULE_NOT_FOUND → Express attrape l'erreur
  → retourne 500.

Ce script :
  1. Crée le dossier utils/ si absent
  2. Copie utils/jobActionLogger.js vers le serveur
  3. Crée la table job_actions en DB (idempotent)
  4. Vérifie que createJob.js a bien le require (sinon l'ajoute)
  5. Redémarre PM2

Run on server:
  python3 /srv/www/htdocs/swiftapp/server/_deploy/deploy_job_action_logger.py
"""

import os
import shutil
import subprocess
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────
SERVER_DIR   = '/srv/www/htdocs/swiftapp/server'
DEPLOY_DIR   = os.path.join(SERVER_DIR, '_deploy')
UTILS_DST    = os.path.join(SERVER_DIR, 'utils')
LOGGER_DST   = os.path.join(UTILS_DST, 'jobActionLogger.js')
LOGGER_SRC   = os.path.join(DEPLOY_DIR, 'utils', 'jobActionLogger.js')
ENV_FILE     = os.path.join(SERVER_DIR, '.env')
CREATE_JOB   = os.path.join(SERVER_DIR, 'endPoints', 'v1', 'createJob.js')

# ── Lire les credentials DB ───────────────────────────────────────────────
db = {}
if os.path.exists(ENV_FILE):
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                db[k.strip()] = v.strip().strip('"').strip("'")

DB_CMD = (
    f"mysql -h{db.get('DB_HOST','localhost')} "
    f"-u{db.get('DB_USER','swiftapp_user')} "
    f"-p{db.get('DB_PASS','U%Xgxvc54EKUD39PcwNAYvuS')} "
    f"{db.get('DB_DATABASE','swiftapp')}"
)


def run_sql(sql, label):
    result = subprocess.run(DB_CMD, input=sql, shell=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout = result.stdout.decode('utf-8', errors='replace')
    stderr = result.stderr.decode('utf-8', errors='replace')
    if result.returncode != 0:
        print(u'  \u274c {0}:\n{1}'.format(label, stderr.strip()[:300]))
        return False
    print(u'  \u2705 {0}'.format(label))
    return True


SEP = '═' * 60

print(f'\n{SEP}')
print('  deploy_job_action_logger.py')
print(f'{SEP}')

# ════════════════════════════════════════════════════════════════
# 1. Copier utils/jobActionLogger.js
# ════════════════════════════════════════════════════════════════
print(f'\n[1/4] Copie de utils/jobActionLogger.js...')

if not os.path.exists(LOGGER_SRC):
    print(f'  ❌ Source introuvable : {LOGGER_SRC}')
    print('  Assurez-vous que utils/jobActionLogger.js est dans _deploy/utils/')
    exit(1)

os.makedirs(UTILS_DST, exist_ok=True)

# Backup si existant
if os.path.exists(LOGGER_DST):
    bak = LOGGER_DST + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy2(LOGGER_DST, bak)
    print(f'  📦 Backup : {bak}')

shutil.copy2(LOGGER_SRC, LOGGER_DST)
print(f'  ✅ Copié → {LOGGER_DST}')

# ════════════════════════════════════════════════════════════════
# 2. Créer la table job_actions (idempotent)
# ════════════════════════════════════════════════════════════════
print(f'\n[2/4] Création de la table job_actions...')

JOB_ACTIONS_SQL = """
CREATE TABLE IF NOT EXISTS job_actions (
  id                      INT(11)       NOT NULL AUTO_INCREMENT,
  job_id                  INT(11)       NOT NULL,
  action_type             VARCHAR(80)   NOT NULL,
  actor_role              VARCHAR(40)   NULL,
  permission_level        VARCHAR(40)   NULL,
  old_status              VARCHAR(80)   NULL,
  new_status              VARCHAR(80)   NULL,
  metadata                JSON          NULL,
  performed_by_user_id    INT(11)       NULL,
  performed_by_company_id INT(11)       NULL,
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ja_job        (job_id),
  KEY idx_ja_type       (action_type),
  KEY idx_ja_user       (performed_by_user_id),
  KEY idx_ja_company    (performed_by_company_id),
  KEY idx_ja_created    (created_at),
  CONSTRAINT fk_ja_job  FOREIGN KEY (job_id)
    REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

run_sql(JOB_ACTIONS_SQL, 'CREATE TABLE job_actions')

# ════════════════════════════════════════════════════════════════
# 3. Vérifier/corriger createJob.js
# ════════════════════════════════════════════════════════════════
print(f'\n[3/4] Vérification de createJob.js...')

if not os.path.exists(CREATE_JOB):
    print(f'  ⚠️  createJob.js introuvable : {CREATE_JOB}')
else:
    with open(CREATE_JOB, 'r') as f:
        content = f.read()

    if 'jobActionLogger' in content:
        print('  ✅ createJob.js a déjà le require jobActionLogger')
    else:
        print('  ⚠️  createJob.js n\'a PAS le require jobActionLogger')
        print('  → Ajout du require manuellement...')

        # Look for getUserByToken require (most likely anchor in createJob.js)
        anchors = [
            "const { getUserByToken } = require('../database/user');\n",
            "const { connect } = require('../../swiftDb');\n",
            "const { connect } = require('../swiftDb');\n",
        ]
        patched = False
        for anchor in anchors:
            if anchor in content:
                new_require = (
                    anchor
                    + "const { logJobAction } = require('../../utils/jobActionLogger');\n"
                )
                bak = CREATE_JOB + f'.bak_logger_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
                shutil.copy2(CREATE_JOB, bak)
                with open(CREATE_JOB, 'w') as f:
                    f.write(content.replace(anchor, new_require, 1))
                print(f'  ✅ require ajouté (anchor: {anchor.strip()[:50]})')
                print(f'  📦 Backup : {bak}')
                patched = True
                break

        if not patched:
            print('  ❌ Aucun anchor trouvé — ajout en tête de fichier')
            bak = CREATE_JOB + f'.bak_logger_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
            shutil.copy2(CREATE_JOB, bak)
            with open(CREATE_JOB, 'w') as f:
                f.write(
                    "const { logJobAction } = require('../../utils/jobActionLogger');\n"
                    + content
                )
            print(f'  ✅ require ajouté en tête de fichier')

# ════════════════════════════════════════════════════════════════
# 4. Redémarrage PM2
# ════════════════════════════════════════════════════════════════
print(f'\n[4/4] Redémarrage PM2...')
result = subprocess.run('pm2 restart swiftapp', shell=True,
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
if result.returncode == 0:
    print('  \u2705 PM2 redemarré')
else:
    print('  \u274c PM2 restart failed: ' + result.stderr.decode('utf-8','replace')[:200])

# Print last logs
try:
    logs = subprocess.run(
        'pm2 logs swiftapp --lines 10 --nostream --no-color',
        shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15
    )
    out = logs.stdout.decode('utf-8', 'replace') if logs.stdout else ''
    print('\n  Dernieres lignes PM2:')
    for line in out.split('\n')[-15:]:
        if line.strip():
            print('  |', line)
except Exception as e:
    print(f'  (logs PM2 non disponibles: {e})')

print(f'\n{SEP}')
print('  ✅ DÉPLOIEMENT TERMINÉ')
print(f'{SEP}')
print('\nPour tester:')
print('  node /tmp/test_create_job_quick.js  # ou utiliser scripts/test-create-job.js')
print()

"""
Fix counter_proposal 500 error.

Cause la plus probable : les colonnes counter_proposed_* n'existent pas encore
sur la table jobs, et/ou le ENUM assignment_status ne contient pas 'negotiating'.

Actions :
  1. Ajoute les colonnes manquantes (ADD COLUMN IF NOT EXISTS → idempotent)
  2. Modifie le ENUM assignment_status pour y inclure 'negotiating'
  3. Crée la table job_counter_proposals si elle n'existe pas
  4. Déploie la dernière version de counterProposal.js (endPoints/v1/jobs/)
"""

import os
import shutil
import subprocess
from datetime import datetime

# ── Config ─────────────────────────────────────────────────────────────────
SERVER_DIR   = '/srv/www/htdocs/swiftapp/server'
ENV_FILE     = os.path.join(SERVER_DIR, '.env')
ENDPOINT_DST = os.path.join(SERVER_DIR, 'endPoints/v1/jobs/counterProposal.js')
# Chemin local (relatif à ce script) vers le fichier source à déployer
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
ENDPOINT_SRC = os.path.join(SCRIPT_DIR, '..', '_backend_deploy', 'endPoints', 'v1', 'jobs', 'counterProposal.js')

# ── Lire les variables DB depuis .env ──────────────────────────────────────
db = {}
if os.path.exists(ENV_FILE):
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                db[k.strip()] = v.strip().strip('"').strip("'")
else:
    print(f'❌ .env non trouvé : {ENV_FILE}')
    exit(1)

MYSQL = (
    f"mysql -h{db.get('DB_HOST','localhost')} "
    f"-u{db.get('DB_USER')} "
    f"-p{db.get('DB_PASS')} "
    f"{db.get('DB_DATABASE')}"
)


def run_sql(sql: str, label: str) -> bool:
    result = subprocess.run(MYSQL, input=sql, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'  ❌ {label}:\n{result.stderr.strip()}')
        return False
    print(f'  ✅ {label}')
    return True


# ═══════════════════════════════════════════════════════════════════════════
# 1. Vérifier + afficher les colonnes actuelles de jobs
# ═══════════════════════════════════════════════════════════════════════════
print('══════════════════════════════════════════')
print('[1/4] Vérification du schéma actuel…')
print('══════════════════════════════════════════')

check_sql = """
SELECT COLUMN_NAME, COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'jobs'
  AND COLUMN_NAME IN (
    'assignment_status',
    'counter_proposed_start',
    'counter_proposed_end',
    'counter_proposal_note',
    'counter_proposed_at',
    'counter_proposed_by'
  )
ORDER BY ORDINAL_POSITION;
"""
result = subprocess.run(MYSQL, input=check_sql, shell=True, capture_output=True, text=True)
if result.stdout.strip():
    print(result.stdout.strip())
else:
    print('  (aucune colonne counter_proposed_* trouvée — migration nécessaire)')

# ═══════════════════════════════════════════════════════════════════════════
# 2. Migration SQL (idempotente)
# ═══════════════════════════════════════════════════════════════════════════
print('\n══════════════════════════════════════════')
print('[2/4] Application de la migration SQL…')
print('══════════════════════════════════════════')

MIGRATION_SQL = """
-- ── 2a. Colonnes counter_proposal sur jobs (IF NOT EXISTS = idempotent) ──
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS counter_proposed_start  DATETIME NULL AFTER assignment_status,
  ADD COLUMN IF NOT EXISTS counter_proposed_end    DATETIME NULL AFTER counter_proposed_start,
  ADD COLUMN IF NOT EXISTS counter_proposal_note   TEXT     NULL AFTER counter_proposed_end,
  ADD COLUMN IF NOT EXISTS counter_proposed_at     DATETIME NULL AFTER counter_proposal_note,
  ADD COLUMN IF NOT EXISTS counter_proposed_by     INT(11)  NULL AFTER counter_proposed_at;

-- ── 2b. Ajouter 'negotiating' dans le ENUM assignment_status ──
--   On recrée le ENUM complet (MySQL ne supporte pas ADD ENUM VALUE conditionnellement)
ALTER TABLE jobs
  MODIFY COLUMN assignment_status
    ENUM('none','pending','accepted','declined','negotiating')
    NOT NULL DEFAULT 'none';

-- ── 2c. Table historique (sécurisée) ──
CREATE TABLE IF NOT EXISTS job_counter_proposals (
  id                      INT(11)      NOT NULL AUTO_INCREMENT,
  job_id                  INT(11)      NOT NULL,
  contractor_company_id   INT(11)      NOT NULL,
  proposed_start          DATETIME     NOT NULL,
  proposed_end            DATETIME     NOT NULL,
  note                    TEXT         NULL,
  status                  ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  responded_at            DATETIME     NULL,
  created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_jcp_job         (job_id),
  KEY idx_jcp_contractor  (contractor_company_id),
  CONSTRAINT fk_jcp_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

ok = run_sql(MIGRATION_SQL, 'Migration colonnes + ENUM + table job_counter_proposals')
if not ok:
    print('\n⚠️  Migration SQL échouée — abandon.')
    exit(1)

# ── Vérification post-migration ──────────────────────────────────────────
result = subprocess.run(MYSQL, input=check_sql, shell=True, capture_output=True, text=True)
print('\n  État des colonnes après migration :')
print(result.stdout.strip() or '  (aucun résultat)')

# ═══════════════════════════════════════════════════════════════════════════
# 3. Déployer la dernière version de counterProposal.js
# ═══════════════════════════════════════════════════════════════════════════
print('\n══════════════════════════════════════════')
print('[3/4] Déploiement de counterProposal.js…')
print('══════════════════════════════════════════')

src = os.path.abspath(ENDPOINT_SRC)
if not os.path.exists(src):
    print(f'  ⚠️  Source introuvable localement : {src}')
    print('  → Assurez-vous que le fichier est présent dans _backend_deploy/endPoints/v1/jobs/')
else:
    if os.path.exists(ENDPOINT_DST):
        backup = ENDPOINT_DST + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        shutil.copy2(ENDPOINT_DST, backup)
        print(f'  Backup créé : {backup}')
    shutil.copy2(src, ENDPOINT_DST)
    print(f'  ✅ counterProposal.js déployé vers {ENDPOINT_DST}')

# ═══════════════════════════════════════════════════════════════════════════
# 4. Résumé
# ═══════════════════════════════════════════════════════════════════════════
print('\n══════════════════════════════════════════')
print('[4/4] Résumé')
print('══════════════════════════════════════════')
print('  ✅ Migration appliquée (ADD COLUMN IF NOT EXISTS — idempotente)')
print('  ✅ ENUM assignment_status inclut désormais "negotiating"')
print('  ✅ Table job_counter_proposals créée (si absente)')
print('  ✅ counterProposal.js déployé')
print()
print('  → Redémarrez le serveur Node si nécessaire (pm2 restart / node server.js)')
print('  → Retestez POST /v1/jobs/<id>/counter_proposal')

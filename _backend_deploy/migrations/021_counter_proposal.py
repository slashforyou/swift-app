"""
Migration + registration pour le endpoint counter_proposal.

1. Ajoute les colonnes counter_proposal sur la table jobs
2. Crée la table job_counter_proposals (historique)
3. Enregistre la route POST /v1/jobs/:jobId/counter_proposal dans le router
"""

import os
import subprocess
import shutil
from datetime import datetime

# ── Config ───────────────────────────────────────────────────────────────────
SERVER_DIR = '/srv/www/htdocs/swiftapp/server'
ENV_FILE   = os.path.join(SERVER_DIR, '.env')

ROUTER_CANDIDATES = [
    os.path.join(SERVER_DIR, 'router.js'),
    os.path.join(SERVER_DIR, 'app.js'),
    os.path.join(SERVER_DIR, 'index.js'),
    os.path.join(SERVER_DIR, 'routes.js'),
]

# ── Lire les variables DB depuis .env ────────────────────────────────────────
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

DB_CMD = f"mysql -h{db.get('DB_HOST','localhost')} -u{db.get('DB_USER')} -p{db.get('DB_PASS')} {db.get('DB_DATABASE')}"

# ── Migration SQL ─────────────────────────────────────────────────────────────
MIGRATION_SQL = """
-- Colonnes counter_proposal sur jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS counter_proposed_start  DATETIME NULL AFTER assignment_status,
  ADD COLUMN IF NOT EXISTS counter_proposed_end    DATETIME NULL AFTER counter_proposed_start,
  ADD COLUMN IF NOT EXISTS counter_proposal_note   TEXT     NULL AFTER counter_proposed_end,
  ADD COLUMN IF NOT EXISTS counter_proposed_at     DATETIME NULL AFTER counter_proposal_note,
  ADD COLUMN IF NOT EXISTS counter_proposed_by     INT(11)  NULL AFTER counter_proposed_at;

-- Mise à jour du type ENUM assignment_status pour inclure negotiating
ALTER TABLE jobs
  MODIFY COLUMN assignment_status
    ENUM('none','pending','accepted','declined','negotiating')
    NOT NULL DEFAULT 'none';

-- Historique des contre-propositions
CREATE TABLE IF NOT EXISTS job_counter_proposals (
  id                      INT(11) NOT NULL AUTO_INCREMENT,
  job_id                  INT(11) NOT NULL,
  contractor_company_id   INT(11) NOT NULL,
  proposed_start          DATETIME NOT NULL,
  proposed_end            DATETIME NOT NULL,
  note                    TEXT NULL,
  status                  ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  responded_at            DATETIME NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_jcp_job (job_id),
  KEY idx_jcp_contractor (contractor_company_id),
  CONSTRAINT fk_jcp_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

print('===== [1/2] Migration SQL =====')
result = subprocess.run(DB_CMD, input=MIGRATION_SQL, shell=True, capture_output=True, text=True)
if result.returncode != 0:
    print(f'❌ Migration échouée:\n{result.stderr}')
    exit(1)
print('✅ Migration OK')

# ── Enregistrement de la route ──────────────────────────────────────────────
print('\n===== [2/2] Enregistrement de la route =====')
ENDPOINT_PATH = os.path.join(SERVER_DIR, 'endPoints/v1/jobs/counterProposal.js')

router_path = None
for c in ROUTER_CANDIDATES:
    if os.path.exists(c):
        router_path = c
        break

if not router_path:
    print('⚠️  Router non trouvé — ajoutez manuellement dans votre fichier de routes :')
    print("    const { counterProposalEndpoint } = require('./endPoints/v1/jobs/counterProposal');")
    print("    router.post('/v1/jobs/:jobId/counter_proposal', auth, counterProposalEndpoint);")
else:
    with open(router_path, 'r') as f:
        router_content = f.read()

    if 'counterProposalEndpoint' in router_content:
        print('✅ Route déjà enregistrée — skip')
    else:
        backup = router_path + f'.bak_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        shutil.copy2(router_path, backup)

        # Trouver la ligne decline pour insérer après
        ANCHOR = "'/v1/jobs/:jobId/decline'"
        alt_anchor = '"/v1/jobs/:jobId/decline"'

        inject = "\nconst { counterProposalEndpoint } = require('./endPoints/v1/jobs/counterProposal');"
        route  = "\nrouter.post('/v1/jobs/:jobId/counter_proposal', auth, counterProposalEndpoint);\n"

        anchor = ANCHOR if ANCHOR in router_content else (alt_anchor if alt_anchor in router_content else None)

        if anchor:
            idx = router_content.find(anchor)
            eol = router_content.find('\n', idx) + 1
            router_content = router_content[:eol] + route + router_content[eol:]
        else:
            router_content += route

        # Injecter le require en haut (après les autres requires de jobs)
        require_anchor = "require('./endPoints/v1/jobs/transfers')"
        if require_anchor in router_content:
            router_content = router_content.replace(
                require_anchor, require_anchor + inject
            )
        else:
            router_content = inject + '\n' + router_content

        with open(router_path, 'w') as f:
            f.write(router_content)

        print(f'✅ Route enregistrée dans {router_path}')
        print(f'📦 Backup : {backup}')

print('\n✅ Migration terminée. Lance: pm2 restart all')

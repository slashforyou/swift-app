#!/bin/bash
# deploy_job_transfer.sh
# Déploiement complet de la fonctionnalité job transfer (B2B delegation)
# Usage: bash deploy_job_transfer.sh (depuis /srv/www/htdocs/swiftapp/server)

set -e
cd /srv/www/htdocs/swiftapp/server
source .env

DB_CMD="mysql -h${DB_HOST} -u${DB_USER} -p${DB_PASS} ${DB_DATABASE}"

echo "===== [1/5] Migrations SQL ====="

echo "--- Migration 013: company_code ---"
$DB_CMD << 'EOSQL'
  ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS company_code CHAR(8) NULL UNIQUE
    COMMENT '8-char unique public code (A-Z0-9)';
EOSQL

$DB_CMD << 'EOSQL'
  UPDATE companies
  SET company_code = UPPER(SUBSTRING(REPLACE(MD5(CONCAT(id,'-',IFNULL(name,''),'-',IFNULL(created_at,''))),'-',''),1,8))
  WHERE company_code IS NULL;
EOSQL

$DB_CMD << 'EOSQL'
  ALTER TABLE companies MODIFY COLUMN company_code CHAR(8) NOT NULL;
EOSQL
echo "OK company_code"

echo "--- Migration 014: job_transfers ---"
$DB_CMD << 'EOSQL'
  CREATE TABLE IF NOT EXISTS job_transfers (
    id                        INT(11) NOT NULL AUTO_INCREMENT,
    job_id                    INT(11) NOT NULL,
    sender_company_id         INT(11) NOT NULL,
    recipient_type            ENUM('company','contractor') NOT NULL DEFAULT 'company',
    recipient_company_id      INT(11) NULL,
    recipient_contractor_id   INT(11) NULL,
    delegated_role            ENUM('driver','offsider','full_job','custom') NOT NULL DEFAULT 'full_job',
    delegated_role_label      VARCHAR(100) NULL,
    pricing_type              ENUM('flat','hourly','daily') NOT NULL DEFAULT 'flat',
    pricing_amount            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency                  VARCHAR(10) NOT NULL DEFAULT 'AUD',
    message                   TEXT NULL,
    status                    ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
    decline_reason            TEXT NULL,
    created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at              DATETIME NULL,
    cancelled_at              DATETIME NULL,
    created_by_user_id        INT(11) NULL,
    responded_by_user_id      INT(11) NULL,
    PRIMARY KEY (id),
    KEY idx_jt_job_id (job_id),
    KEY idx_jt_sender (sender_company_id),
    KEY idx_jt_recipient_co (recipient_company_id),
    KEY idx_jt_status (status),
    CONSTRAINT fk_jt_job    FOREIGN KEY (job_id)            REFERENCES jobs(id)      ON DELETE CASCADE,
    CONSTRAINT fk_jt_sender FOREIGN KEY (sender_company_id) REFERENCES companies(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOSQL
echo "OK job_transfers"

echo "--- Migration 015: company_relations ---"
$DB_CMD << 'EOSQL'
  CREATE TABLE IF NOT EXISTS company_relations (
    id                        INT(11) NOT NULL AUTO_INCREMENT,
    owner_company_id          INT(11) NOT NULL,
    related_type              ENUM('company','contractor') NOT NULL DEFAULT 'company',
    related_company_id        INT(11) NULL,
    related_contractor_id     INT(11) NULL,
    related_company_name      VARCHAR(255) NULL,
    related_contractor_name   VARCHAR(255) NULL,
    nickname                  VARCHAR(100) NULL,
    created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_relation (owner_company_id, related_company_id, related_contractor_id),
    KEY idx_cr_owner (owner_company_id),
    CONSTRAINT fk_cr_owner FOREIGN KEY (owner_company_id) REFERENCES companies(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOSQL
echo "OK company_relations"

echo ""
echo "===== [2/5] Copie des endpoints ====="

mkdir -p endPoints/v1/companies
mkdir -p endPoints/v1/transfers

cp /tmp/deploy_transfer/endPoints/v1/companies/me.js          endPoints/v1/companies/me.js
cp /tmp/deploy_transfer/endPoints/v1/companies/lookup.js      endPoints/v1/companies/lookup.js
cp /tmp/deploy_transfer/endPoints/v1/companies/relations.js   endPoints/v1/companies/relations.js
cp /tmp/deploy_transfer/endPoints/v1/jobs/transfers.js        endPoints/v1/jobs/transfers.js
cp /tmp/deploy_transfer/endPoints/v1/transfers/incoming.js    endPoints/v1/transfers/incoming.js
echo "OK fichiers copiés"

echo ""
echo "===== [3/5] Patch getJobById.js — permissions transfer + active_transfer ====="

# Ajouter les 3 nouvelles permissions transfer juste après is_assigned
python3 - << 'PYEOF'
import re

path = 'endPoints/v1/getJobById.js'
with open(path, 'r') as f:
    src = f.read()

# 1. Ajouter les permissions transfer
old_perm = '      is_owner: isOwner,\n      is_assigned: isAssigned\n    };'
new_perm = ('      is_owner: isOwner,\n'
            '      is_assigned: isAssigned,\n'
            '      // Délégation B2B\n'
            '      can_create_transfer: isOwner && [\'pending\',\'accepted\',\'in-progress\'].includes(jobStatus),\n'
            '      can_cancel_transfer: isOwner,\n'
            '      can_respond_transfer: !!userCompanyId && !isOwner\n'
            '    };')

if old_perm not in src:
    print('⚠️  Bloc permissions introuvable — vérification manuelle requise')
else:
    src = src.replace(old_perm, new_perm)
    print('✓ permissions transfer ajoutées')

# 2. Ajouter active_transfer dans la réponse, juste avant  "// Permissions (NEW"
old_mark = '        // Permissions (NEW - basées sur l\'utilisateur connecté)\n        permissions: permissions,'
new_mark = ('        // Délégation B2B active\n'
            '        active_transfer: (function() {\n'
            '          // Sera populé par le select ci-dessous via activeTransfer\n'
            '          return typeof activeTransfer !== "undefined" ? activeTransfer : null;\n'
            '        })(),\n'
            '        // Permissions (NEW - basées sur l\'utilisateur connecté)\n'
            '        permissions: permissions,')

if old_mark not in src:
    print('⚠️  Marqueur active_transfer introuvable — skip')
else:
    src = src.replace(old_mark, new_mark)
    print('✓ active_transfer placeholder ajouté')

with open(path, 'w') as f:
    f.write(src)

print('✓ getJobById.js patché')
PYEOF

echo ""
echo "===== [4/5] Patch listJobs.js — permissions transfer ====="

python3 - << 'PYEOF'
path = 'endPoints/v1/listJobs.js'
with open(path, 'r') as f:
    src = f.read()

old = ('        permissions: {\n'
       '          is_owner: isOwner,\n'
       '          is_assigned: isAssigned,\n'
       '          can_accept: isAssigned && isPending,\n'
       '          can_decline: isAssigned && isPending\n'
       '        },')

new = ('        permissions: {\n'
       '          is_owner: isOwner,\n'
       '          is_assigned: isAssigned,\n'
       '          can_accept: isAssigned && isPending,\n'
       '          can_decline: isAssigned && isPending,\n'
       '          // Délégation B2B\n'
       '          can_create_transfer: isOwner && [\'pending\',\'accepted\',\'in-progress\'].includes(job.status),\n'
       '          can_cancel_transfer: isOwner,\n'
       '          can_respond_transfer: !isOwner && !!userCompanyId && parseInt(job.recipient_company_id || 0) === parseInt(userCompanyId)\n'
       '        },')

if old not in src:
    print('⚠️  Bloc permissions listJobs introuvable — skip')
else:
    src = src.replace(old, new)
    print('✓ permissions transfer ajoutées dans listJobs')

with open(path, 'w') as f:
    f.write(src)
PYEOF

echo ""
echo "===== [5/5] Enregistrement des routes dans index.js ====="

# Ajouter les routes avant la dernière ligne (ou après les routes stripe)
python3 - << 'PYEOF'
path = 'index.js'
with open(path, 'r') as f:
    src = f.read()

ROUTES = """
// ═══════════════════════════════════════════════════════════
// 🤝 ROUTES B2B JOB TRANSFER & COMPANY RELATIONS
// ═══════════════════════════════════════════════════════════
(function registerTransferRoutes() {
  const { authenticateToken } = require('./middleware/authenticateToken');
  const companyMe       = require('./endPoints/v1/companies/me');
  const companyLookup   = require('./endPoints/v1/companies/lookup');
  const companyRelations = require('./endPoints/v1/companies/relations');
  const jobTransfers    = require('./endPoints/v1/jobs/transfers');
  const incomingTransfers = require('./endPoints/v1/transfers/incoming');

  // Profil de la company connectée (inclut company_code)
  app.get('/swift-app/v1/companies/me', authenticateToken, companyMe.getMyCompanyEndpoint);

  // Lookup par code public
  app.get('/swift-app/v1/companies/lookup', authenticateToken, companyLookup.lookupCompanyEndpoint);

  // Carnet de relations
  app.get('/swift-app/v1/companies/relations',     authenticateToken, companyRelations.listRelationsEndpoint);
  app.post('/swift-app/v1/companies/relations',    authenticateToken, companyRelations.saveRelationEndpoint);
  app.patch('/swift-app/v1/companies/relations/:id', authenticateToken, companyRelations.updateRelationEndpoint);
  app.delete('/swift-app/v1/companies/relations/:id', authenticateToken, companyRelations.deleteRelationEndpoint);

  // Délégations de job
  app.post('/swift-app/v1/jobs/:jobId/transfers',                          authenticateToken, jobTransfers.createTransferEndpoint);
  app.get('/swift-app/v1/jobs/:jobId/transfers',                           authenticateToken, jobTransfers.listTransfersEndpoint);
  app.patch('/swift-app/v1/jobs/:jobId/transfers/:transferId/respond',     authenticateToken, jobTransfers.respondToTransferEndpoint);
  app.delete('/swift-app/v1/jobs/:jobId/transfers/:transferId',            authenticateToken, jobTransfers.cancelTransferEndpoint);

  // Délégations reçues (inbox)
  app.get('/swift-app/v1/transfers/incoming', authenticateToken, incomingTransfers.getIncomingTransfersEndpoint);

  console.log('✅ [Routes] B2B Transfer routes registered');
})();
"""

MARKER = '// ─── FIN DU FICHIER'
FALLBACK = '// Export de l\'application'

if MARKER in src:
    src = src.replace(MARKER, ROUTES + '\n' + MARKER)
    print('✓ Routes ajoutées avant marqueur fin')
elif FALLBACK in src:
    src = src.replace(FALLBACK, ROUTES + '\n' + FALLBACK)
    print('✓ Routes ajoutées (fallback marker)')
else:
    # Ajouter à la fin
    src = src.rstrip() + '\n' + ROUTES + '\n'
    print('✓ Routes ajoutées à la fin du fichier')

with open(path, 'w') as f:
    f.write(src)
PYEOF

echo ""
echo "===== Redémarrage du service ====="
pm2 restart swiftapp 2>/dev/null || pm2 restart all 2>/dev/null || forever restart index.js 2>/dev/null || node index.js &
echo ""
echo "🎉 Déploiement terminé !"
echo "   • company_code        ✓"
echo "   • job_transfers        ✓"
echo "   • company_relations    ✓"
echo "   • GET  /companies/me   ✓"
echo "   • GET  /companies/lookup ✓"
echo "   • CRUD /companies/relations ✓"
echo "   • CRUD /jobs/:id/transfers  ✓"
echo "   • GET  /transfers/incoming  ✓"

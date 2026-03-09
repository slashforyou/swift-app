#!/bin/bash
# run_all_deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
# Script maître — déploiement complet MVP Cobbr
# À exécuter sur le serveur sushinari depuis le dossier _deploy/:
#
#   cd /srv/www/htdocs/swiftapp/server/_deploy
#   bash run_all_deploy.sh
#
# Ce script :
#   1. Copie les fichiers endPoints vers le bon dossier server
#   2. Exécute la migration DB (plans + job_commissions + staff_requests)
#   3. Patch le endpoint payment/create pour les commissions
#   4. Patch acceptJob.js pour les push notifications
#   5. Enregistre la route staff-requests dans index.js
#   6. Redémarre le serveur via pm2
# ─────────────────────────────────────────────────────────────────────────────

set -e

SERVER_ROOT="/srv/www/htdocs/swiftapp/server"
DEPLOY_DIR="$SERVER_ROOT/_deploy"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Cobbr MVP — Deploy All"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$DEPLOY_DIR"

# ── 1. Copier les endpoints vers server/endPoints ─────────────────────────────
echo "[ 1/6 ] Copie des endpoints..."

cp -v "$DEPLOY_DIR/endPoints/v1/jobs/staffRequests.js"        "$SERVER_ROOT/endPoints/v1/jobs/staffRequests.js"
cp -v "$DEPLOY_DIR/endPoints/v1/jobs/counterProposal.js"      "$SERVER_ROOT/endPoints/v1/jobs/counterProposal.js"         2>/dev/null || true
cp -v "$DEPLOY_DIR/endPoints/v1/jobs/acceptCounterProposal.js" "$SERVER_ROOT/endPoints/v1/jobs/acceptCounterProposal.js"  2>/dev/null || true
cp -v "$DEPLOY_DIR/endPoints/v1/jobs/rejectCounterProposal.js" "$SERVER_ROOT/endPoints/v1/jobs/rejectCounterProposal.js"  2>/dev/null || true
cp -v "$DEPLOY_DIR/endPoints/v1/jobs/transfers.js"            "$SERVER_ROOT/endPoints/v1/jobs/transfers.js"               2>/dev/null || true

echo "   ✓ Endpoints copiés"
echo ""

# ── 2. Migration DB — plans + job_commissions ─────────────────────────────────
echo "[ 2/6 ] Migration DB — plans & job_commissions..."
python3 "$DEPLOY_DIR/migrate_plans_commission.py"
echo ""

# ── 3. Migration DB — staff_requests table ───────────────────────────────────
echo "[ 3/6 ] Migration DB — staff_requests table..."
node "$DEPLOY_DIR/register_staff_requests_route.js"
echo ""

# ── 4. Patch payment/create — commission Stripe ───────────────────────────────
echo "[ 4/6 ] Patch payment create — application_fee_amount..."
python3 "$DEPLOY_DIR/patch_payment_commission.py"
echo ""

# ── 5. Patch acceptJob.js — push notification ─────────────────────────────────
echo "[ 5/6 ] Patch acceptJob — push notification on accept..."
python3 "$DEPLOY_DIR/patch_accept_job_notification.py"
echo ""

# ── 6. Patch index.js — route staff-requests ─────────────────────────────────
echo "[ 6/6 ] Enregistrement route staff-requests dans index.js..."
python3 "$DEPLOY_DIR/patch_index_staff_requests.py"
echo ""

# ── Redémarrage pm2 ───────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  Redémarrage pm2..."
echo "═══════════════════════════════════════════════════════════"
pm2 restart swiftapp
pm2 logs swiftapp --lines 20 --nostream

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Déploiement terminé"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Vérifications à faire :"
echo "  - pm2 logs swiftapp       → pas d'erreur au démarrage"
echo "  - POST /v1/jobs/:id/staff-requests  → 200"
echo "  - POST /v1/jobs/:id/payment/create  → application_fee_amount dans Stripe"
echo "  - Accepter un job → push reçu sur le device du contractee"
echo ""

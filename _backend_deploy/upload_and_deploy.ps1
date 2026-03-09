# upload_and_deploy.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Depuis Windows : envoie les fichiers _deploy sur le serveur puis lance deploy
#
# Usage :
#   .\upload_and_deploy.ps1 -User root -Host sushinari
#   .\upload_and_deploy.ps1 -User admin -Host 12.34.56.78
#
# Prérequis : OpenSSH installé (inclus dans Windows 10/11)
# ─────────────────────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory=$true)]
    [string]$User,

    [Parameter(Mandatory=$true)]
    [string]$Host
)

$LocalDeploy = "$PSScriptRoot"
$RemoteRoot  = "/srv/www/htdocs/swiftapp/server"
$RemoteDeploy = "$RemoteRoot/_deploy"
$SshTarget   = "${User}@${Host}"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Upload & Deploy — sushinari" -ForegroundColor Cyan
Write-Host "  Target : $SshTarget" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Créer le dossier _deploy sur le serveur ────────────────────────────────
Write-Host "[ 1/3 ] Création du dossier _deploy sur le serveur..." -ForegroundColor Yellow
ssh "${SshTarget}" "mkdir -p ${RemoteDeploy}/endPoints/v1/jobs ${RemoteDeploy}/endPoints/v1/companies ${RemoteDeploy}/endPoints/v1/transfers"
Write-Host "   ✓ Dossiers créés"

# ── 2. Upload de tous les fichiers _deploy/ ────────────────────────────────── 
Write-Host ""
Write-Host "[ 2/3 ] Upload des fichiers..." -ForegroundColor Yellow

# Scripts Python principaux
scp "${LocalDeploy}\migrate_plans_commission.py"       "${SshTarget}:${RemoteDeploy}/"
scp "${LocalDeploy}\patch_payment_commission.py"       "${SshTarget}:${RemoteDeploy}/"
scp "${LocalDeploy}\patch_accept_job_notification.py"  "${SshTarget}:${RemoteDeploy}/"
scp "${LocalDeploy}\register_staff_requests_route.js"  "${SshTarget}:${RemoteDeploy}/"
scp "${LocalDeploy}\patch_index_staff_requests.py"     "${SshTarget}:${RemoteDeploy}/"
scp "${LocalDeploy}\run_all_deploy.sh"                 "${SshTarget}:${RemoteDeploy}/"

# Endpoints
scp "${LocalDeploy}\endPoints\v1\jobs\staffRequests.js"         "${SshTarget}:${RemoteDeploy}/endPoints/v1/jobs/"
scp "${LocalDeploy}\endPoints\v1\jobs\counterProposal.js"       "${SshTarget}:${RemoteDeploy}/endPoints/v1/jobs/"
scp "${LocalDeploy}\endPoints\v1\jobs\acceptCounterProposal.js" "${SshTarget}:${RemoteDeploy}/endPoints/v1/jobs/"
scp "${LocalDeploy}\endPoints\v1\jobs\rejectCounterProposal.js" "${SshTarget}:${RemoteDeploy}/endPoints/v1/jobs/"
scp "${LocalDeploy}\endPoints\v1\jobs\transfers.js"             "${SshTarget}:${RemoteDeploy}/endPoints/v1/jobs/"

Write-Host "   ✓ Fichiers uploadés"

# ── 3. Exécuter le script de déploiement ──────────────────────────────────────
Write-Host ""
Write-Host "[ 3/3 ] Exécution run_all_deploy.sh sur le serveur..." -ForegroundColor Yellow
Write-Host ""
ssh "${SshTarget}" "chmod +x ${RemoteDeploy}/run_all_deploy.sh ; bash ${RemoteDeploy}/run_all_deploy.sh"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Déploiement terminé" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

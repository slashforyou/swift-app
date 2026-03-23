# upload_and_fix_create_job.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Corrige l'HTTP 500 sur POST /v1/job causé par le fichier manquant
# utils/jobActionLogger.js (requis par createJob.js après patch_job_actions.js)
#
# Usage :
#   .\upload_and_fix_create_job.ps1 -User root -Server sushinari
#   .\upload_and_fix_create_job.ps1 -User admin -Server 12.34.56.78
#
# Prérequis : OpenSSH installé (inclus dans Windows 10/11)
# ─────────────────────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory=$true)]
    [string]$User,

    [Parameter(Mandatory=$true)]
    [string]$Server
)

$LocalDeploy  = "$PSScriptRoot"
$RemoteRoot   = "/srv/www/htdocs/swiftapp/server"
$RemoteDeploy = "$RemoteRoot/_deploy"
$SshTarget    = "${User}@${Server}"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Fix HTTP 500 createJob — deploy jobActionLogger.js" -ForegroundColor Cyan
Write-Host "  Target : $SshTarget" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Créer les dossiers requis ─────────────────────────────────────────────
Write-Host "[ 1/3 ] Création des dossiers sur le serveur..." -ForegroundColor Yellow
ssh "${SshTarget}" "mkdir -p ${RemoteDeploy}/utils"
Write-Host "   ✓ Dossiers créés"

# ── 2. Upload des fichiers ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 2/3 ] Upload des fichiers..." -ForegroundColor Yellow

scp "${LocalDeploy}\utils\jobActionLogger.js"        "${SshTarget}:${RemoteDeploy}/utils/"
scp "${LocalDeploy}\deploy_job_action_logger.py"     "${SshTarget}:${RemoteDeploy}/"

Write-Host "   ✓ Fichiers uploadés"
Write-Host "      • _deploy/utils/jobActionLogger.js"
Write-Host "      • _deploy/deploy_job_action_logger.py"

# ── 3. Exécuter le script de déploiement ──────────────────────────────────────
Write-Host ""
Write-Host "[ 3/3 ] Exécution du déploiement sur le serveur..." -ForegroundColor Yellow
Write-Host ""
ssh "${SshTarget}" "cd ${RemoteDeploy} ; python3 deploy_job_action_logger.py"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Déploiement terminé" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Pour tester :" -ForegroundColor Cyan
Write-Host "  node scripts/test-create-job.js" -ForegroundColor White
Write-Host ""

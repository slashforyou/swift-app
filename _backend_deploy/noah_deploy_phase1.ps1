#!/usr/bin/env pwsh
<#
.SYNOPSIS
    noah_deploy_phase1.ps1 — Deploiement Phase 1 (01 mai 2026)
    Migrations 055-062 + backfill + 8 modules backend + middlewares Phase 1

.DESCRIPTION
    1. Backup DB avant toute migration
    2. Migrations 055 a 062 + backfill 056b
    3. Copie des 8 modules backend + 2 middlewares
    4. Backup index.js
    5. Injection des routes Phase 1 via inject_phase1_routes.py
    6. Copie utils
    7. PM2 restart
    8. Verification post-deploy

.USAGE
    .\noah_deploy_phase1.ps1
    .\noah_deploy_phase1.ps1 -DryRun       # Affiche les commandes sans executer
    .\noah_deploy_phase1.ps1 -BackupOnly   # Backup uniquement, sans deploiement
#>

param(
    [switch]$DryRun,
    [switch]$BackupOnly
)

$SSH_HOST    = "sushinari"
$SERVER_DIR  = "/srv/www/htdocs/swiftapp/server"
$PM2_ID      = "17"
$DB_NAME     = "swiftapp"
$DB_USER     = "swiftapp_user"
$TIMESTAMP   = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "/tmp/cobbr_backup_phase1_$TIMESTAMP.sql"
$ROOT_DIR    = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$ErrorActionPreference = "Stop"

function Run-Step {
    param([string]$Description, [string]$Command)
    Write-Host "`n  => $Description" -ForegroundColor Cyan
    Write-Host "     $ $Command" -ForegroundColor DarkGray
    if ($DryRun) { Write-Host "     [DRY-RUN] Skipped" -ForegroundColor Yellow; return }
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  X ERREUR (code $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "  OK" -ForegroundColor Green
}

function Run-SSH {
    param([string]$Description, [string]$RemoteCommand)
    Run-Step -Description $Description -Command "ssh $SSH_HOST `"$RemoteCommand`""
}

function Deploy-Migration {
    param([string]$Num, [string]$Filename, [string]$Description)
    $localPath = Join-Path $ROOT_DIR "_backend_deploy/migrations/$Filename"
    if (-not (Test-Path $localPath)) {
        Write-Host "  ! SKIP : $localPath introuvable" -ForegroundColor Yellow
        return
    }
    $remoteTmp = "/tmp/$Filename"
    Run-Step -Description "SCP migration $Num — $Description" `
        -Command "scp `"$localPath`" ${SSH_HOST}:$remoteTmp"
    Run-SSH -Description "Appliquer migration $Num" `
        -RemoteCommand "mysql --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME < $remoteTmp && echo 'Migration $Num OK'"
}

# ─── Header ──────────────────────────────────────────────────────────────────
Write-Host ("=" * 65) -ForegroundColor Magenta
Write-Host "  COBBR — PHASE 1 DEPLOY · $TIMESTAMP" -ForegroundColor Magenta
if ($DryRun) { Write-Host "  [MODE DRY-RUN — aucune commande executee]" -ForegroundColor Yellow }
Write-Host ("=" * 65) -ForegroundColor Magenta

# ─── Verification SSH ────────────────────────────────────────────────────────
if (-not $DryRun) {
    Write-Host "`n[0] Verification SSH..." -ForegroundColor White
    $sshTest = ssh -o ConnectTimeout=10 $SSH_HOST "echo SSHOK" 2>&1
    if ($sshTest -notmatch "SSHOK") {
        Write-Host "  X SSH $SSH_HOST inaccessible : $sshTest" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK SSH" -ForegroundColor Green
}

# ─── ETAPE 1 — Backup DB ─────────────────────────────────────────────────────
Write-Host "`n[1/8] BACKUP DB → $BACKUP_FILE" -ForegroundColor White
Run-SSH -Description "mysqldump Phase1 backup" `
    -RemoteCommand "mysqldump --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME > $BACKUP_FILE && echo 'Backup OK'"
if ($BackupOnly) {
    Write-Host "`nBackup seul termine. Fichier : $BACKUP_FILE" -ForegroundColor Green
    exit 0
}

# ─── ETAPE 2 — Migrations 055-062 + backfill ─────────────────────────────────
Write-Host "`n[2/8] Migrations 055-062 + backfill 056b..." -ForegroundColor White
Deploy-Migration "055"  "055_add_account_type.sql"                  "account_type sur users"
Deploy-Migration "056"  "056_create_company_memberships.sql"        "company_memberships"
Deploy-Migration "056b" "056b_backfill_company_memberships.sql"     "backfill owners existants"
Deploy-Migration "057"  "057_create_contractor_profiles.sql"        "contractor_profiles ABN"
Deploy-Migration "058"  "058_create_company_contractors.sql"        "company_contractors reseau"
Deploy-Migration "059"  "059_create_job_contractor_assignments.sql" "job_contractor_assignments"
Deploy-Migration "060"  "060_create_client_invoices.sql"            "client_invoices flux entrant"
Deploy-Migration "061"  "061_create_contractor_payables.sql"        "contractor_payables flux sortant"
Deploy-Migration "062"  "062_create_job_events.sql"                 "job_events audit log"

# ─── ETAPE 3 — Middlewares ───────────────────────────────────────────────────
Write-Host "`n[3/8] Copie des 2 middlewares Phase 1..." -ForegroundColor White
Run-SSH -Description "mkdir middleware" -RemoteCommand "mkdir -p $SERVER_DIR/middleware"
foreach ($mw in @("loadUserContext.js", "requirePermission.js")) {
    $src = Join-Path $ROOT_DIR "_backend_deploy/middleware/$mw"
    Run-Step -Description "SCP middleware/$mw" `
        -Command "scp `"$src`" ${SSH_HOST}:$SERVER_DIR/middleware/$mw"
}

# ─── ETAPE 4 — Modules endpoints ────────────────────────────────────────────
Write-Host "`n[4/8] Copie des 6 modules endpoints Phase 1..." -ForegroundColor White
$modules = @(
    "memberships",
    "contractors",
    "contractorProfile",
    "jobContractors",
    "clientInvoices",
    "contractorPayables"
)
foreach ($mod in $modules) {
    $src = Join-Path $ROOT_DIR "_backend_deploy/endPoints/v1/$mod/index.js"
    Run-SSH -Description "mkdir endPoints/v1/$mod" `
        -RemoteCommand "mkdir -p $SERVER_DIR/endPoints/v1/$mod"
    Run-Step -Description "SCP endPoints/v1/$mod/index.js" `
        -Command "scp `"$src`" ${SSH_HOST}:$SERVER_DIR/endPoints/v1/$mod/index.js"
}

# ─── ETAPE 5 — Utils ─────────────────────────────────────────────────────────
Write-Host "`n[5/8] Copie utils (inputValidator, rateLimiter, reviewGamification)..." -ForegroundColor White
Run-SSH -Description "mkdir utils" -RemoteCommand "mkdir -p $SERVER_DIR/utils"
foreach ($u in @("inputValidator.js", "rateLimiter.js", "reviewGamification.js")) {
    $src = Join-Path $ROOT_DIR "_backend_deploy/utils/$u"
    if (Test-Path $src) {
        Run-Step -Description "SCP utils/$u" `
            -Command "scp `"$src`" ${SSH_HOST}:$SERVER_DIR/utils/$u"
    } else {
        Write-Host "  ! SKIP : utils/$u introuvable" -ForegroundColor Yellow
    }
}

# ─── ETAPE 6 — Backup index.js ───────────────────────────────────────────────
Write-Host "`n[6/8] Backup index.js avant injection routes..." -ForegroundColor White
Run-SSH -Description "Backup index.js" `
    -RemoteCommand "cp $SERVER_DIR/index.js $SERVER_DIR/index.js.bak_$TIMESTAMP && echo 'Backup index.js OK'"

# ─── ETAPE 7 — Injection routes Phase 1 ─────────────────────────────────────
Write-Host "`n[7/8] Injection des routes Phase 1 dans index.js..." -ForegroundColor White
$injectScript = Join-Path $ROOT_DIR "_backend_deploy/inject_phase1_routes.py"
if (Test-Path $injectScript) {
    Run-Step -Description "SCP inject_phase1_routes.py" `
        -Command "scp `"$injectScript`" ${SSH_HOST}:$SERVER_DIR/inject_phase1_routes.py"
    Run-SSH -Description "Executer inject_phase1_routes.py" `
        -RemoteCommand "cd $SERVER_DIR && python3 inject_phase1_routes.py && echo 'Injection OK'"
} else {
    Write-Host "  ! inject_phase1_routes.py introuvable — wiring a faire manuellement" -ForegroundColor Yellow
    Write-Host "    Chemin attendu : $injectScript" -ForegroundColor DarkGray
}

# ─── ETAPE 8 — PM2 restart + verification ────────────────────────────────────
Write-Host "`n[8/8] Redemarrage PM2 (id $PM2_ID)..." -ForegroundColor White
Run-SSH -Description "pm2 restart $PM2_ID" `
    -RemoteCommand "pm2 restart $PM2_ID && sleep 3 && pm2 show $PM2_ID | grep -E 'status|restarts|memory'"
Run-SSH -Description "Derniers logs PM2" `
    -RemoteCommand "pm2 logs $PM2_ID --nostream --lines 30"

# ─── Resume final ────────────────────────────────────────────────────────────
Write-Host "`n$("=" * 65)" -ForegroundColor Green
Write-Host "  PHASE 1 DEPLOYEE — $TIMESTAMP" -ForegroundColor Green
Write-Host ""
Write-Host "  Backup DB    : $BACKUP_FILE" -ForegroundColor DarkGray
Write-Host "  Backup index : $SERVER_DIR/index.js.bak_$TIMESTAMP" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Routes maintenant disponibles :" -ForegroundColor White
@(
    "GET    /swift-app/v1/users/me              (account_type + membership inclus)",
    "GET    /swift-app/v1/memberships",
    "POST   /swift-app/v1/memberships/invite",
    "PATCH  /swift-app/v1/memberships/:id/permissions",
    "DELETE /swift-app/v1/memberships/:id",
    "GET    /swift-app/v1/contractors",
    "POST   /swift-app/v1/contractors/invite",
    "PATCH  /swift-app/v1/contractors/:id/status",
    "GET    /swift-app/v1/contractor-profile",
    "PUT    /swift-app/v1/contractor-profile",
    "POST   /swift-app/v1/jobs/:jobId/contractors",
    "POST   /swift-app/v1/jobs/:jobId/contractors/:id/respond",
    "GET    /swift-app/v1/jobs/:jobId/contractors",
    "GET    /swift-app/v1/client-invoices",
    "POST   /swift-app/v1/client-invoices",
    "PATCH  /swift-app/v1/client-invoices/:id",
    "GET    /swift-app/v1/contractor-payables",
    "POST   /swift-app/v1/contractor-payables",
    "PATCH  /swift-app/v1/contractor-payables/:id/paid"
) | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
Write-Host ""
Write-Host "  -> Marc : lancer les 5 scenarios de validation." -ForegroundColor Yellow
Write-Host ("=" * 65) -ForegroundColor Green

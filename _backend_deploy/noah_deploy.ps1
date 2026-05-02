#!/usr/bin/env pwsh
<#
.SYNOPSIS
    noah_deploy.ps1 — Déploiement autorisé (D1 - 29 avril 2026)
    Migrations 051 + 052 + nouveaux fichiers backend Cobbr

.DESCRIPTION
    1. Backup DB avant toute migration
    2. SCP des fichiers backend
    3. Migration 051 (multi-criteria reviews)
    4. Migration 052 (15 niveaux, saisons, trophées)
    5. Injection routes index.js
    6. pm2 restart 17

.USAGE
    .\noah_deploy.ps1
    .\noah_deploy.ps1 -DryRun   # Affiche les commandes sans les exécuter
    .\noah_deploy.ps1 -BackupOnly  # Backup uniquement, sans déploiement
#>

param(
    [switch]$DryRun,
    [switch]$BackupOnly
)

$SSH_HOST   = "sushinari"
$SERVER_DIR = "/srv/www/htdocs/swiftapp/server"
$PM2_ID     = "17"
$DB_NAME    = "swiftapp"
$DB_USER    = "swiftapp_user"
$TIMESTAMP  = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "/tmp/cobbr_backup_$TIMESTAMP.sql"
$ROOT_DIR   = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

function Run-Step {
    param([string]$Description, [string]$Command)
    Write-Host "`n▶ $Description" -ForegroundColor Cyan
    Write-Host "  $ $Command" -ForegroundColor DarkGray
    if ($DryRun) {
        Write-Host "  [DRY-RUN] Skipped" -ForegroundColor Yellow
        return
    }
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ ERREUR (code $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "  ✓ OK" -ForegroundColor Green
}

function Run-SSH {
    param([string]$Description, [string]$RemoteCommand)
    Run-Step -Description $Description -Command "ssh $SSH_HOST `"$RemoteCommand`""
}

# ─────────────────────────────────────────────────────────────────────────────
# Vérification SSH
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "=" * 60 -ForegroundColor Magenta
Write-Host "COBBR — DÉPLOIEMENT AUTORISÉ D1 · $TIMESTAMP" -ForegroundColor Magenta
if ($DryRun) { Write-Host "[MODE DRY-RUN — aucune action réelle]" -ForegroundColor Yellow }
Write-Host "=" * 60 -ForegroundColor Magenta

# Test connexion SSH
Write-Host "`n[0/6] Test connexion SSH..." -ForegroundColor White
if (-not $DryRun) {
    $sshTest = ssh -o ConnectTimeout=10 $SSH_HOST "echo OK" 2>&1
    if ($sshTest -ne "OK") {
        Write-Host "✗ Impossible de se connecter à $SSH_HOST" -ForegroundColor Red
        Write-Host "  Vérifiez ~/.ssh/config et que le serveur est accessible" -ForegroundColor DarkGray
        exit 1
    }
    Write-Host "✓ SSH OK" -ForegroundColor Green
}

if ($BackupOnly) {
    Write-Host "`n[MODE BACKUP ONLY]" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 1 — Backup DB (OBLIGATOIRE avant toute migration)
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[1/6] BACKUP DB — $DB_NAME → $BACKUP_FILE" -ForegroundColor White
Run-SSH -Description "mysqldump vers /tmp" `
    -RemoteCommand "mysqldump --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME > $BACKUP_FILE && echo 'Backup OK: $BACKUP_FILE'"

if ($BackupOnly) {
    Write-Host "`n✓ Backup terminé. Fichier sur le serveur : $BACKUP_FILE" -ForegroundColor Green
    exit 0
}

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 2 — SCP des fichiers backend
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[2/6] Copie des fichiers backend..." -ForegroundColor White

$files = @(
    @{ src = "_backend_deploy/endPoints/v1/completeJobById.js";  dst = "$SERVER_DIR/endPoints/v1/completeJobById.js" },
    @{ src = "_backend_deploy/endPoints/v1/jobReviews.js";        dst = "$SERVER_DIR/endPoints/v1/jobReviews.js" },
    @{ src = "_backend_deploy/utils/reviewGamification.js";       dst = "$SERVER_DIR/utils/reviewGamification.js" },
    @{ src = "_backend_deploy/inject_complete_job_route.py";      dst = "$SERVER_DIR/inject_complete_job_route.py" }
)

foreach ($f in $files) {
    $srcFull = Join-Path $ROOT_DIR $f.src
    Run-Step -Description "SCP $($f.src)" -Command "scp `"$srcFull`" ${SSH_HOST}:$($f.dst)"
}

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 3 — Copie et application migration 051
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[3/6] Migration 051 — multi-criteria reviews..." -ForegroundColor White
$mig051 = Join-Path $ROOT_DIR "_backend_deploy/migrations/051_extend_job_reviews_multicriteria.sql"
Run-Step -Description "SCP migration 051" -Command "scp `"$mig051`" ${SSH_HOST}:/tmp/051_extend_job_reviews_multicriteria.sql"
Run-SSH -Description "Appliquer migration 051" `
    -RemoteCommand "mysql --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME < /tmp/051_extend_job_reviews_multicriteria.sql && echo 'Mig 051 OK'"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 4 — Copie et application migration 052
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[4/6] Migration 052 — niveaux, saisons, trophées..." -ForegroundColor White
$mig052 = Join-Path $ROOT_DIR "_backend_deploy/migrations/052_gamification_levels_trophies.sql"
Run-Step -Description "SCP migration 052" -Command "scp `"$mig052`" ${SSH_HOST}:/tmp/052_gamification_levels_trophies.sql"
Run-SSH -Description "Appliquer migration 052" `
    -RemoteCommand "mysql --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME < /tmp/052_gamification_levels_trophies.sql && echo 'Mig 052 OK'"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 5 — Injection des routes dans index.js
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[5/6] Injection des routes dans index.js..." -ForegroundColor White
Run-SSH -Description "Backup index.js avant injection" `
    -RemoteCommand "cp $SERVER_DIR/index.js $SERVER_DIR/index.js.bak_$TIMESTAMP"
Run-SSH -Description "Exécuter inject_complete_job_route.py" `
    -RemoteCommand "cd $SERVER_DIR && python3 inject_complete_job_route.py"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 6 — Redémarrage PM2
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[6/6] Redémarrage PM2 (id $PM2_ID)..." -ForegroundColor White
Run-SSH -Description "pm2 restart $PM2_ID" -RemoteCommand "pm2 restart $PM2_ID && pm2 status $PM2_ID"

# ─────────────────────────────────────────────────────────────────────────────
# RÉSUMÉ
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "✓ DÉPLOIEMENT TERMINÉ — $TIMESTAMP" -ForegroundColor Green
Write-Host ""
Write-Host "  Backup DB    : $BACKUP_FILE (sur serveur)" -ForegroundColor DarkGray
Write-Host "  Backup index : $SERVER_DIR/index.js.bak_$TIMESTAMP" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Routes maintenant disponibles :" -ForegroundColor White
Write-Host "  POST /swift-app/v1/jobs/:id/complete" -ForegroundColor Cyan
Write-Host "  POST /swift-app/v1/jobs/:jobId/review-request" -ForegroundColor Cyan
Write-Host "  POST /swift-app/v1/reviews/submit  (public)" -ForegroundColor Cyan
Write-Host "  GET  /swift-app/v1/reviews" -ForegroundColor Cyan
Write-Host "  GET  /swift-app/v1/jobs/:jobId/review" -ForegroundColor Cyan
Write-Host "  GET  /swift-app/v1/user/gamification/v2/profile" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Green
Write-Host ""
Write-Host "→ Marc peut lancer les tests maintenant." -ForegroundColor Yellow

#!/usr/bin/env pwsh
<#
.SYNOPSIS
    noah_deploy_mvp.ps1 — Déploiement de stabilisation avant test MVP
    5 corrections critiques identifiées lors de la réunion d'équipe du 01/05/2026

.DESCRIPTION
    Corrections déployées :
    1. payments.js           — Fix 'connection' → 'db' (Julien bug #2)
    2. webhooks.js           — Add payment_intent.succeeded (Julien bug #1)
    3. gamificationV2_fix.js — Fix query sent_at crash → 1454 restarts PM2 (Marc P0)
    4. dailyRecapCron.js     — Fix CREATE TABLE schema (colonnes manquantes)
    5. Migration 066         — Normalise account_type 'abn_contractor'→'contractor' (Nora)
    6. Routes jobReviews     — Injection dans index.js via script existant (Thomas)

.USAGE
    .\noah_deploy_mvp.ps1
    .\noah_deploy_mvp.ps1 -DryRun      # Affiche les commandes sans les exécuter
    .\noah_deploy_mvp.ps1 -BackupOnly  # Backup uniquement
    .\noah_deploy_mvp.ps1 -SkipStripe  # Skip le déploiement des fichiers paiements
#>

param(
    [switch]$DryRun,
    [switch]$BackupOnly,
    [switch]$SkipStripe
)

$SSH_HOST    = "sushinari"
$SERVER_DIR  = "/srv/www/htdocs/swiftapp/server"
$PM2_ID      = "17"
$DB_NAME     = "swiftapp"
$DB_USER     = "swiftapp_user"
$TIMESTAMP   = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "/tmp/cobbr_mvp_backup_$TIMESTAMP.sql"
$ROOT_DIR    = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────────────────
# Helpers (identiques à noah_deploy.ps1)
# ─────────────────────────────────────────────────────────────────────────────

function Run-Step {
    param([string]$Description, [string]$Command)
    Write-Host "`n  ▶ $Description" -ForegroundColor Cyan
    if ($DryRun) {
        Write-Host "    $ $Command" -ForegroundColor DarkGray
        Write-Host "    [DRY-RUN] Skipped" -ForegroundColor Yellow
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

function SCP-File {
    param([string]$LocalRelPath, [string]$RemotePath)
    $localFull = Join-Path $ROOT_DIR $LocalRelPath
    Run-Step -Description "SCP $LocalRelPath" -Command "scp `"$localFull`" ${SSH_HOST}:$RemotePath"
}

# ─────────────────────────────────────────────────────────────────────────────
# Header
# ─────────────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host ("=" * 65) -ForegroundColor Magenta
Write-Host "  COBBR — DÉPLOIEMENT STABILISATION MVP · $TIMESTAMP" -ForegroundColor Magenta
Write-Host ("=" * 65) -ForegroundColor Magenta
if ($DryRun)    { Write-Host "  [MODE DRY-RUN — aucune action réelle]" -ForegroundColor Yellow }
if ($SkipStripe){ Write-Host "  [MODE SKIP-STRIPE — fichiers paiements ignorés]" -ForegroundColor Yellow }

# Vérification SSH
Write-Host "`n[0] Test connexion SSH..." -ForegroundColor White
if (-not $DryRun) {
    $sshTest = ssh -o ConnectTimeout=10 $SSH_HOST "echo OK" 2>&1
    if ($sshTest -ne "OK") {
        Write-Host "✗ Impossible de se connecter à $SSH_HOST" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ SSH OK" -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 1 — Backup DB (OBLIGATOIRE)
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[1/6] BACKUP DB avant toute modification..." -ForegroundColor White
Run-SSH -Description "mysqldump → $BACKUP_FILE" `
    -RemoteCommand "mysqldump --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME > $BACKUP_FILE && echo 'Backup OK'"

if ($BackupOnly) {
    Write-Host "`n✓ Backup seul terminé : $BACKUP_FILE" -ForegroundColor Green
    exit 0
}

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 2 — Backup index.js (avant injection de routes)
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[2/6] Backup index.js..." -ForegroundColor White
Run-SSH -Description "Copie index.js.bak_$TIMESTAMP" `
    -RemoteCommand "cp $SERVER_DIR/index.js $SERVER_DIR/index.js.bak_$TIMESTAMP && echo 'Index backup OK'"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 3 — SCP des fichiers corrigés
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[3/6] Copie des fichiers corrigés vers le serveur..." -ForegroundColor White

# Fix 3 & 4 : DailyRecap endpoint + cron (bug sent_at → 1454 restarts)
SCP-File "_backend_deploy/gamificationV2_fix.js"  "$SERVER_DIR/endPoints/v1/gamificationV2.js"
SCP-File "_backend_deploy/dailyRecapCron.js"       "$SERVER_DIR/utils/dailyRecapCron.js"

# Fix 1 & 2 : Paiements (sauf si SkipStripe)
if (-not $SkipStripe) {
    SCP-File "_backend_deploy/endPoints/v1/jobs/payments.js"    "$SERVER_DIR/endPoints/v1/jobs/payments.js"
    SCP-File "_backend_deploy/endPoints/v1/stripe/webhooks.js"  "$SERVER_DIR/endPoints/v1/stripe/webhooks.js"
    Write-Host "  ✓ Fichiers paiements copiés (sandbox uniquement pour le test MVP)" -ForegroundColor DarkGray
} else {
    Write-Host "  ⏭ Fichiers paiements ignorés (--SkipStripe actif)" -ForegroundColor Yellow
}

# Fix 6 : jobReviews (pour injection de routes)
SCP-File "_backend_deploy/endPoints/v1/jobReviews.js"           "$SERVER_DIR/endPoints/v1/jobReviews.js"
SCP-File "_backend_deploy/inject_complete_job_route.py"         "$SERVER_DIR/inject_complete_job_route.py"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 4 — Migration 066 : normaliser account_type
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[4/6] Migration 066 — normalisation account_type..." -ForegroundColor White
$mig066 = Join-Path $ROOT_DIR "_backend_deploy/migrations/066_fix_account_type_enum.sql"
Run-Step -Description "SCP migration 066" `
    -Command "scp `"$mig066`" ${SSH_HOST}:/tmp/066_fix_account_type_enum.sql"
Run-SSH -Description "Appliquer migration 066" `
    -RemoteCommand "mysql --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME < /tmp/066_fix_account_type_enum.sql && echo 'Migration 066 OK'"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 5 — Injection des routes jobReviews dans index.js
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "`n[5/6] Injection routes jobReviews dans index.js..." -ForegroundColor White
Run-SSH -Description "Exécuter inject_complete_job_route.py" `
    -RemoteCommand "cd $SERVER_DIR && python3 inject_complete_job_route.py && echo 'Routes injectées'"

# ─────────────────────────────────────────────────────────────────────────────
# ÉTAPE 6 — Redémarrage PM2 + vérification heap
# ─────────────────────────────────────────────────────────────────────="────

Write-Host "`n[6/6] Redémarrage PM2 + vérification..." -ForegroundColor White
Run-SSH -Description "pm2 restart $PM2_ID" `
    -RemoteCommand "pm2 restart $PM2_ID && sleep 5 && pm2 show $PM2_ID | grep -E 'memory|restart|status'"

# ─────────────────────────────────────────────────────────────────────────────
# RÉSUMÉ FINAL
# ─────────────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host ("=" * 65) -ForegroundColor Green
Write-Host "  ✓ DÉPLOIEMENT MVP TERMINÉ — $TIMESTAMP" -ForegroundColor Green
Write-Host ("=" * 65) -ForegroundColor Green
Write-Host ""
Write-Host "  Backup DB     : $BACKUP_FILE" -ForegroundColor DarkGray
Write-Host "  Backup index  : $SERVER_DIR/index.js.bak_$TIMESTAMP" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Corrections appliquées :" -ForegroundColor White
Write-Host "  ✓ Fix heap PM2 : sent_at bug dans getV2DailyRecapEndpoint" -ForegroundColor Green
Write-Host "  ✓ Fix cron     : colonnes level_up/breakdown/sent_at ajoutées" -ForegroundColor Green
if (-not $SkipStripe) {
Write-Host "  ✓ Fix paiements: connection → db + payment_intent.succeeded webhook" -ForegroundColor Green
}
Write-Host "  ✓ Migration 066: account_type abn_contractor → contractor" -ForegroundColor Green
Write-Host "  ✓ Routes       : jobReviews injectées dans index.js" -ForegroundColor Green
Write-Host ""
Write-Host "  PÉRIMÈTRE TEST MVP VALIDÉ :" -ForegroundColor Yellow
Write-Host "  ✅ Flow job complet (business owner)" -ForegroundColor Cyan
Write-Host "  ✅ Authentification + navigation" -ForegroundColor Cyan
Write-Host "  ✅ Daily Recap (heap normalisé)" -ForegroundColor Cyan
if (-not $SkipStripe) {
Write-Host "  ✅ Paiements (SANDBOX — confirmer avec Romain avant live)" -ForegroundColor Cyan
}
Write-Host "  ❌ Flow ABN contractor (à tester après)" -ForegroundColor DarkGray
Write-Host "  ❌ Gamification avancée (Arcade, Scorecard)" -ForegroundColor DarkGray
Write-Host ""
Write-Host ("=" * 65) -ForegroundColor Green
Write-Host ""
Write-Host "→ Marc : tu peux lancer les tests." -ForegroundColor Yellow

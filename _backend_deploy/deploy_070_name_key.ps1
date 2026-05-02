#!/usr/bin/env pwsh
<#
.SYNOPSIS
    deploy_070_name_key.ps1 — Fix traduction types de job (nameKey)
    Migration 070 + modularTemplates.js + git push
#>

$SSH_HOST   = "sushinari"
$SERVER_DIR = "/srv/www/htdocs/swiftapp/server"
$PM2_ID     = "17"
$DB_NAME    = "swiftapp"
$DB_USER    = "swiftapp_user"
$TIMESTAMP  = Get-Date -Format "yyyyMMdd_HHmmss"
$ROOT_DIR   = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

$ErrorActionPreference = "Stop"

function Run-Step {
    param([string]$Description, [string]$Command)
    Write-Host "`n▶ $Description" -ForegroundColor Cyan
    Write-Host "  $ $Command" -ForegroundColor DarkGray
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

Write-Host "=" * 60 -ForegroundColor Magenta
Write-Host "COBBR — DEPLOY 070 name_key templates · $TIMESTAMP" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Magenta

# [0] Test SSH
Write-Host "`n[0/4] Test connexion SSH..." -ForegroundColor White
$sshTest = ssh -o ConnectTimeout=10 $SSH_HOST "echo OK" 2>&1
if ($sshTest -ne "OK") {
    Write-Host "✗ Impossible de se connecter à $SSH_HOST" -ForegroundColor Red
    exit 1
}
Write-Host "✓ SSH OK" -ForegroundColor Green

# [1] SCP modularTemplates.js
Write-Host "`n[1/4] Copie modularTemplates.js..." -ForegroundColor White
$srcTemplates = Join-Path $ROOT_DIR "_backend_deploy/endPoints/v1/modularTemplates.js"
Run-Step -Description "SCP modularTemplates.js" -Command "scp `"$srcTemplates`" ${SSH_HOST}:$SERVER_DIR/endPoints/v1/modularTemplates.js"

# [2] SCP + apply migration 070
Write-Host "`n[2/4] Migration 070 — name_key column..." -ForegroundColor White
$mig070 = Join-Path $ROOT_DIR "_backend_deploy/migrations/070_add_name_key_to_templates.sql"
Run-Step -Description "SCP migration 070" -Command "scp `"$mig070`" ${SSH_HOST}:/tmp/070_add_name_key_to_templates.sql"
Run-SSH -Description "Appliquer migration 070" `
    -RemoteCommand "mysql --defaults-file=~/.my.cnf -u $DB_USER $DB_NAME < /tmp/070_add_name_key_to_templates.sql && echo 'Migration 070 OK'"

# [3] PM2 restart
Write-Host "`n[3/4] Redémarrage PM2 (id $PM2_ID)..." -ForegroundColor White
Run-SSH -Description "pm2 restart $PM2_ID" -RemoteCommand "pm2 restart $PM2_ID && pm2 status $PM2_ID"

# [4] Git push
Write-Host "`n[4/4] Git push origin main..." -ForegroundColor White
Set-Location $ROOT_DIR
Run-Step -Description "git add + commit + push" -Command "git add -A && git commit -m 'fix: job type translation using nameKey slug instead of numeric ID' && git push origin main"

Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "✓ DÉPLOIEMENT 070 TERMINÉ — $TIMESTAMP" -ForegroundColor Green
Write-Host "  Les types de job sont maintenant traduits correctement dans le wizard." -ForegroundColor DarkGray
Write-Host ("=" * 60) -ForegroundColor Green

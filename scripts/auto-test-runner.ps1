# ============================================================
# 🔄 AUTO TEST RUNNER - Swift App
# ============================================================
# Script de test automatisé avec surveillance des crashes
# Récupère les logs, détecte les erreurs et relance l'app
# ============================================================

param(
    [switch]$WatchOnly,      # Mode surveillance uniquement (pas de lancement)
    [switch]$Mirror,         # Lancer scrcpy pour mirroring
    [int]$MaxRetries = 10,   # Nombre max de relances
    [switch]$Verbose         # Logs détaillés
)

# Configuration
$ADB = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$APP_PACKAGE = "com.slash4u.swiftapp"
$LOG_DIR = "$PSScriptRoot\..\logs\crash-reports"
$EXPO_PORT = 8081

# Couleurs
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n🔹 $msg" -ForegroundColor Magenta }

# Créer le dossier de logs
if (-not (Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null
}

# ============================================================
# FONCTIONS UTILITAIRES
# ============================================================

function Test-DeviceConnected {
    $devices = & $ADB devices 2>$null | Select-String "device$"
    return $devices.Count -gt 0
}

function Get-DeviceName {
    $model = & $ADB shell getprop ro.product.model 2>$null
    return $model.Trim()
}

function Get-AppLogs {
    param([int]$Lines = 100)
    # Récupérer les logs React Native / Expo
    $logs = & $ADB logcat -d -t $Lines *:E ReactNative:V ReactNativeJS:V expo:V 2>$null
    return $logs
}

function Get-CrashLogs {
    # Récupérer spécifiquement les crashes
    $crashes = & $ADB logcat -d -t 200 AndroidRuntime:E *:S 2>$null
    return $crashes
}

function Clear-Logs {
    & $ADB logcat -c 2>$null
}

function Save-CrashReport {
    param($logs, $reason)
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $filename = "$LOG_DIR\crash_${timestamp}.log"
    
    $report = @"
============================================================
CRASH REPORT - Swift App
============================================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Device: $(Get-DeviceName)
Reason: $reason
============================================================

$logs
"@
    
    $report | Out-File -FilePath $filename -Encoding UTF8
    Write-Info "Rapport sauvegardé: $filename"
    return $filename
}

function Restart-ExpoApp {
    Write-Step "Rechargement de l'app Expo..."
    
    # Méthode 1: Via ADB (simuler shake + reload)
    # & $ADB shell input keyevent 82  # Menu key
    
    # Méthode 2: Via Expo CLI (si Metro est lancé)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$EXPO_PORT/reload" -Method POST -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Success "Reload envoyé via Expo"
    } catch {
        # Méthode alternative: double R via input
        & $ADB shell input text "rr"
        Write-Info "Reload envoyé via input (rr)"
    }
}

function Start-ExpoApp {
    Write-Step "Lancement de l'app..."
    
    # Lancer l'activité principale
    & $ADB shell am start -n "${APP_PACKAGE}/.MainActivity" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "App lancée"
    } else {
        # Alternative: via Expo
        Write-Warning "Lancement direct échoué, tentative via intent générique..."
        & $ADB shell monkey -p $APP_PACKAGE -c android.intent.category.LAUNCHER 1 2>$null
    }
}

function Stop-ExpoApp {
    Write-Step "Arrêt de l'app..."
    & $ADB shell am force-stop $APP_PACKAGE 2>$null
    Write-Info "App arrêtée"
}

function Test-AppCrashed {
    $logs = Get-CrashLogs
    
    # Patterns de crash
    $crashPatterns = @(
        "FATAL EXCEPTION",
        "java.lang.RuntimeException",
        "React Native crashed",
        "TypeError:",
        "ReferenceError:",
        "SyntaxError:",
        "Invariant Violation",
        "undefined is not an object",
        "null is not an object",
        "Cannot read property",
        "Network request failed",
        "Unhandled promise rejection"
    )
    
    foreach ($pattern in $crashPatterns) {
        if ($logs -match $pattern) {
            return @{
                Crashed = $true
                Pattern = $pattern
                Logs = $logs
            }
        }
    }
    
    return @{ Crashed = $false }
}

function Analyze-Error {
    param($logs)
    
    Write-Step "Analyse de l'erreur..."
    
    # Extraire les lignes pertinentes
    $errorLines = $logs | Where-Object { 
        $_ -match "Error|Exception|TypeError|undefined|null" 
    } | Select-Object -First 20
    
    Write-Host "`n--- ERREUR DÉTECTÉE ---" -ForegroundColor Red
    $errorLines | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
    Write-Host "--- FIN ERREUR ---`n" -ForegroundColor Red
    
    return $errorLines -join "`n"
}

function Start-LogMonitor {
    Write-Step "Démarrage de la surveillance des logs..."
    
    # Lancer logcat en continu dans un job background
    $job = Start-Job -ScriptBlock {
        param($adb)
        & $adb logcat ReactNative:V ReactNativeJS:V expo:V AndroidRuntime:E *:S
    } -ArgumentList $ADB
    
    return $job
}

# ============================================================
# BOUCLE PRINCIPALE
# ============================================================

function Start-TestSession {
    Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║           🔄 AUTO TEST RUNNER - Swift App                    ║
║                                                              ║
║  Ce script surveille l'app, récupère les logs en cas de     ║
║  crash et relance automatiquement.                          ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

    # Vérifier la connexion device
    Write-Step "Vérification du device..."
    
    if (-not (Test-DeviceConnected)) {
        Write-Error "Aucun device Android connecté!"
        Write-Host "`nAssurez-vous que:"
        Write-Host "  1. Le téléphone est connecté en USB"
        Write-Host "  2. Le débogage USB est activé"
        Write-Host "  3. Vous avez autorisé le PC sur le téléphone"
        return
    }
    
    $deviceName = Get-DeviceName
    Write-Success "Device connecté: $deviceName"
    
    # Lancer scrcpy si demandé
    if ($Mirror) {
        Write-Step "Lancement de scrcpy (mirroring)..."
        Start-Process "scrcpy" -ErrorAction SilentlyContinue
    }
    
    # Nettoyer les logs
    Clear-Logs
    Write-Info "Logs nettoyés"
    
    # Variables de session
    $retryCount = 0
    $crashCount = 0
    $startTime = Get-Date
    
    if (-not $WatchOnly) {
        Start-ExpoApp
    }
    
    Write-Host "`n" -NoNewline
    Write-Success "Surveillance active - Appuyez sur Ctrl+C pour arrêter"
    Write-Host "═══════════════════════════════════════════════════════════════`n"
    
    # Boucle de surveillance
    while ($retryCount -lt $MaxRetries) {
        Start-Sleep -Seconds 2
        
        $crashResult = Test-AppCrashed
        
        if ($crashResult.Crashed) {
            $crashCount++
            Write-Error "CRASH DÉTECTÉ! (Pattern: $($crashResult.Pattern))"
            
            # Analyser l'erreur
            $errorAnalysis = Analyze-Error -logs $crashResult.Logs
            
            # Sauvegarder le rapport
            $reportFile = Save-CrashReport -logs $crashResult.Logs -reason $crashResult.Pattern
            
            # Afficher les infos pour debug
            Write-Host "`n📋 Rapport de crash #$crashCount" -ForegroundColor Yellow
            Write-Host "   Pattern: $($crashResult.Pattern)"
            Write-Host "   Fichier: $reportFile"
            
            # Relancer l'app
            $retryCount++
            Write-Warning "Tentative de relance ($retryCount/$MaxRetries)..."
            
            Stop-ExpoApp
            Start-Sleep -Seconds 1
            Clear-Logs
            Start-ExpoApp
            
            Write-Success "App relancée - En attente de stabilisation..."
            Start-Sleep -Seconds 3
        }
        else {
            # Afficher un indicateur de vie toutes les 10 secondes
            if ((Get-Date).Second % 10 -eq 0) {
                $elapsed = (Get-Date) - $startTime
                Write-Host "." -NoNewline -ForegroundColor Green
            }
        }
    }
    
    # Résumé final
    Write-Host "`n"
    Write-Host "═══════════════════════════════════════════════════════════════"
    Write-Host "📊 RÉSUMÉ DE SESSION" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════"
    Write-Host "   Durée: $((Get-Date) - $startTime)"
    Write-Host "   Crashes détectés: $crashCount"
    Write-Host "   Relances: $retryCount"
    Write-Host "   Rapports: $LOG_DIR"
    Write-Host "═══════════════════════════════════════════════════════════════`n"
}

# ============================================================
# COMMANDES INDIVIDUELLES
# ============================================================

function Show-Help {
    Write-Host @"

📖 AUTO TEST RUNNER - Commandes

Usage: .\auto-test-runner.ps1 [options]

Options:
  -WatchOnly    Mode surveillance uniquement (pas de lancement auto)
  -Mirror       Lancer scrcpy pour voir l'écran du téléphone
  -MaxRetries   Nombre max de relances (défaut: 10)
  -Verbose      Logs détaillés

Exemples:
  .\auto-test-runner.ps1                    # Lancer et surveiller
  .\auto-test-runner.ps1 -WatchOnly         # Surveiller seulement
  .\auto-test-runner.ps1 -Mirror            # Avec mirroring écran
  .\auto-test-runner.ps1 -MaxRetries 5      # Max 5 relances

"@ -ForegroundColor Cyan
}

# Lancer la session
Start-TestSession

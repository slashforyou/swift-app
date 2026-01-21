# ============================================================
# 📋 CRASH LOG ANALYZER - Swift App
# ============================================================
# Analyse les logs de crash et propose des corrections
# ============================================================

param(
    [string]$LogFile,           # Fichier de log spécifique
    [switch]$Latest,            # Analyser le dernier crash
    [switch]$All,               # Lister tous les crashes
    [switch]$Watch              # Surveiller en temps réel
)

$LOG_DIR = "$PSScriptRoot\..\logs\crash-reports"
$ADB = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# Couleurs
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

# ============================================================
# PATTERNS D'ERREURS CONNUS ET SOLUTIONS
# ============================================================

$ERROR_PATTERNS = @{
    "TypeError: undefined is not an object" = @{
        Cause = "Accès à une propriété d'un objet undefined"
        Solution = "Vérifier les optional chaining (?.) et les valeurs par défaut"
        Files = @("hooks/", "components/", "screens/")
    }
    "TypeError: null is not an object" = @{
        Cause = "Accès à une propriété d'un objet null"
        Solution = "Ajouter des null checks ou utiliser ?."
        Files = @("hooks/", "components/")
    }
    "Cannot read property" = @{
        Cause = "Propriété inaccessible sur undefined/null"
        Solution = "Vérifier l'initialisation des objets"
        Files = @("*")
    }
    "Network request failed" = @{
        Cause = "Problème de connexion réseau ou serveur"
        Solution = "Vérifier l'URL du backend et la connexion"
        Files = @("services/", "config/")
    }
    "Invariant Violation" = @{
        Cause = "Violation des règles React/React Native"
        Solution = "Vérifier les hooks (ordre d'appel), rendering conditionnel"
        Files = @("components/", "screens/", "hooks/")
    }
    "ReferenceError" = @{
        Cause = "Variable non définie"
        Solution = "Vérifier les imports et déclarations"
        Files = @("*")
    }
    "SyntaxError" = @{
        Cause = "Erreur de syntaxe JavaScript/TypeScript"
        Solution = "Vérifier la syntaxe du fichier indiqué"
        Files = @("*")
    }
    "Module not found" = @{
        Cause = "Import d'un module inexistant"
        Solution = "Vérifier le chemin d'import et npm install"
        Files = @("*")
    }
    "Maximum call stack size exceeded" = @{
        Cause = "Récursion infinie ou boucle de rendu"
        Solution = "Vérifier les useEffect et les dépendances"
        Files = @("hooks/", "components/")
    }
    "Unhandled promise rejection" = @{
        Cause = "Promise rejetée sans catch"
        Solution = "Ajouter try/catch ou .catch()"
        Files = @("services/", "hooks/")
    }
    "Text strings must be rendered" = @{
        Cause = "Texte en dehors d'un composant <Text>"
        Solution = "Envelopper le texte dans <Text>"
        Files = @("components/", "screens/")
    }
    "Invalid hook call" = @{
        Cause = "Hook appelé en dehors d'un composant React"
        Solution = "Vérifier que les hooks sont au top-level du composant"
        Files = @("hooks/", "components/")
    }
}

# ============================================================
# FONCTIONS D'ANALYSE
# ============================================================

function Get-LatestCrashLog {
    $logs = Get-ChildItem -Path $LOG_DIR -Filter "crash_*.log" -ErrorAction SilentlyContinue | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
    return $logs
}

function Get-AllCrashLogs {
    return Get-ChildItem -Path $LOG_DIR -Filter "crash_*.log" -ErrorAction SilentlyContinue | 
           Sort-Object LastWriteTime -Descending
}

function Analyze-CrashLog {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Err "Fichier non trouvé: $FilePath"
        return
    }
    
    $content = Get-Content $FilePath -Raw
    
    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║              📋 ANALYSE DU CRASH                             ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    Write-Info "Fichier: $FilePath"
    Write-Host ""
    
    # Chercher les patterns connus
    $matchedPatterns = @()
    
    foreach ($pattern in $ERROR_PATTERNS.Keys) {
        if ($content -match [regex]::Escape($pattern)) {
            $matchedPatterns += @{
                Pattern = $pattern
                Info = $ERROR_PATTERNS[$pattern]
            }
        }
    }
    
    if ($matchedPatterns.Count -eq 0) {
        Write-Warning "Aucun pattern connu détecté"
        Write-Host "`nContenu brut du log:`n" -ForegroundColor Yellow
        Write-Host $content
        return
    }
    
    # Afficher les analyses
    foreach ($match in $matchedPatterns) {
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Err "ERREUR: $($match.Pattern)"
        Write-Host ""
        Write-Host "   🔍 Cause probable:" -ForegroundColor Yellow
        Write-Host "      $($match.Info.Cause)" -ForegroundColor White
        Write-Host ""
        Write-Host "   💡 Solution:" -ForegroundColor Green
        Write-Host "      $($match.Info.Solution)" -ForegroundColor White
        Write-Host ""
        Write-Host "   📁 Fichiers à vérifier:" -ForegroundColor Cyan
        $match.Info.Files | ForEach-Object { Write-Host "      - src/$_" -ForegroundColor White }
        Write-Host ""
    }
    
    # Extraire les fichiers/lignes mentionnés dans le log
    $fileMatches = [regex]::Matches($content, '(src[\\/][^\s:]+\.tsx?):?(\d+)?')
    
    if ($fileMatches.Count -gt 0) {
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "📍 FICHIERS MENTIONNÉS DANS LE CRASH:" -ForegroundColor Magenta
        $fileMatches | ForEach-Object {
            $file = $_.Groups[1].Value
            $line = $_.Groups[2].Value
            if ($line) {
                Write-Host "   → $file (ligne $line)" -ForegroundColor White
            } else {
                Write-Host "   → $file" -ForegroundColor White
            }
        }
        Write-Host ""
    }
    
    # Retourner les infos pour le script principal
    return @{
        Patterns = $matchedPatterns
        Files = $fileMatches
        Content = $content
    }
}

function Watch-LiveLogs {
    Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║           📺 SURVEILLANCE LOGS EN TEMPS RÉEL                 ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

    Write-Info "Appuyez sur Ctrl+C pour arrêter"
    Write-Host ""
    
    # Lancer logcat avec filtre
    & $ADB logcat -v time ReactNative:V ReactNativeJS:V expo:V AndroidRuntime:E *:S 2>&1 | ForEach-Object {
        $line = $_
        
        # Colorer selon le niveau
        if ($line -match "Error|Exception|FATAL") {
            Write-Host $line -ForegroundColor Red
        }
        elseif ($line -match "Warning|WARN") {
            Write-Host $line -ForegroundColor Yellow
        }
        elseif ($line -match "LOG|DEBUG|INFO") {
            Write-Host $line -ForegroundColor Gray
        }
        else {
            Write-Host $line -ForegroundColor White
        }
    }
}

function Show-CrashList {
    $logs = Get-AllCrashLogs
    
    if ($logs.Count -eq 0) {
        Write-Info "Aucun rapport de crash trouvé"
        return
    }
    
    Write-Host "`n📋 RAPPORTS DE CRASH ($($logs.Count) fichiers)`n" -ForegroundColor Cyan
    
    $i = 1
    foreach ($log in $logs) {
        $size = [math]::Round($log.Length / 1024, 1)
        $date = $log.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
        Write-Host "  [$i] $($log.Name) ($size KB) - $date" -ForegroundColor White
        $i++
    }
    
    Write-Host "`nUtilisez: .\analyze-crash.ps1 -Latest pour analyser le dernier`n" -ForegroundColor Gray
}

# ============================================================
# POINT D'ENTRÉE
# ============================================================

if ($Watch) {
    Watch-LiveLogs
}
elseif ($All) {
    Show-CrashList
}
elseif ($Latest) {
    $latestLog = Get-LatestCrashLog
    if ($latestLog) {
        Analyze-CrashLog -FilePath $latestLog.FullName
    } else {
        Write-Warning "Aucun rapport de crash trouvé dans $LOG_DIR"
    }
}
elseif ($LogFile) {
    Analyze-CrashLog -FilePath $LogFile
}
else {
    Write-Host @"

📖 CRASH LOG ANALYZER - Swift App

Usage:
  .\analyze-crash.ps1 -Latest          Analyser le dernier crash
  .\analyze-crash.ps1 -All             Lister tous les crashes
  .\analyze-crash.ps1 -Watch           Logs en temps réel
  .\analyze-crash.ps1 -LogFile <path>  Analyser un fichier spécifique

"@ -ForegroundColor Cyan
    
    # Afficher la liste par défaut
    Show-CrashList
}

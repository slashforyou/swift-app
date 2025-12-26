# Script PowerShell pour lire les logs console de l'application Swift App
# Usage: .\read-console-logs.ps1 [options]

param(
    [switch]$Tail,           # Afficher en temps réel (comme tail -f)
    [int]$Lines = 100,       # Nombre de dernières lignes à afficher
    [string]$Filter = "",    # Filtrer par contenu
    [string]$Level = "",     # Filtrer par niveau (ERROR, WARN, INFO, LOG, DEBUG)
    [switch]$Clear,          # Effacer le fichier de logs
    [switch]$Help            # Afficher l'aide
)

# Couleurs pour différents niveaux de log
$colors = @{
    'ERROR' = 'Red'
    'WARN'  = 'Yellow'
    'INFO'  = 'Cyan'
    'LOG'   = 'White'
    'DEBUG' = 'Gray'
}

# Fonction d'aide
function Show-Help {
    Write-Host "Usage: .\read-console-logs.ps1 [options]" -ForegroundColor Green
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Tail            Afficher les logs en temps réel (CTRL+C pour arrêter)" -ForegroundColor Gray
    Write-Host "  -Lines <number>  Nombre de dernières lignes à afficher (défaut: 100)" -ForegroundColor Gray
    Write-Host "  -Filter <text>   Filtrer les logs contenant ce texte" -ForegroundColor Gray
    Write-Host "  -Level <level>   Filtrer par niveau: ERROR, WARN, INFO, LOG, DEBUG" -ForegroundColor Gray
    Write-Host "  -Clear           Effacer le fichier de logs" -ForegroundColor Gray
    Write-Host "  -Help            Afficher cette aide" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor Yellow
    Write-Host "  .\read-console-logs.ps1                    # Afficher les 100 dernières lignes"
    Write-Host "  .\read-console-logs.ps1 -Tail              # Mode temps réel"
    Write-Host "  .\read-console-logs.ps1 -Lines 50          # 50 dernières lignes"
    Write-Host "  .\read-console-logs.ps1 -Filter 'Error'    # Filtrer les erreurs"
    Write-Host "  .\read-console-logs.ps1 -Level ERROR       # Seulement les ERRORs"
    Write-Host "  .\read-console-logs.ps1 -Clear             # Effacer les logs"
    exit 0
}

if ($Help) {
    Show-Help
}

# Chemin du fichier de logs (simulé - sera dans le répertoire Documents de l'app Expo)
# Note: Le vrai chemin sera dans le File System de l'app Expo
$LogPath = ".\app-console-logs.txt"

# Fonction pour obtenir le vrai chemin du fichier depuis l'app
function Get-AppLogPath {
    # Tenter de récupérer le chemin depuis l'API Copilot si disponible
    $jsScript = @"
if (typeof global !== 'undefined' && global.copilotAPI && global.copilotAPI.consoleLogger) {
    console.log('LOG_PATH:' + global.copilotAPI.consoleLogger.getLogFilePath());
}
"@
    
    # Si on ne peut pas récupérer le chemin, utiliser le chemin local par défaut
    return $LogPath
}

# Fonction pour coloriser une ligne de log
function Write-ColorizedLog {
    param([string]$Line)
    
    if ($Line -match '\[([^\]]+)\] \[([^\]]+)\] (.+)') {
        $timestamp = $matches[1]
        $level = $matches[2]
        $message = $matches[3]
        
        $color = $colors[$level]
        if (-not $color) { $color = 'White' }
        
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "[$level] " -NoNewline -ForegroundColor $color
        Write-Host $message -ForegroundColor White
    } else {
        Write-Host $Line -ForegroundColor Gray
    }
}

# Fonction pour filtrer les lignes
function Test-LineFilter {
    param([string]$Line)
    
    # Filtrer par contenu si spécifié
    if ($Filter -and $Line -notmatch [regex]::Escape($Filter)) {
        return $false
    }
    
    # Filtrer par niveau si spécifié
    if ($Level -and $Line -notmatch "\[$Level\]") {
        return $false
    }
    
    return $true
}

# Fonction principale
try {
    $actualLogPath = Get-AppLogPath
    
    if ($Clear) {
        if (Test-Path $actualLogPath) {
            Remove-Item $actualLogPath
            Write-Host "Fichier de logs effacé: $actualLogPath" -ForegroundColor Green
        } else {
            Write-Host "Aucun fichier de logs à effacer." -ForegroundColor Yellow
        }
        exit 0
    }
    
    if (-not (Test-Path $actualLogPath)) {
        Write-Host "Fichier de logs introuvable: $actualLogPath" -ForegroundColor Red
        Write-Host "Assurez-vous que l'application est démarrée et génère des logs." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Note: Le fichier de logs sera créé dans le répertoire Documents de l'application Expo." -ForegroundColor Cyan
        Write-Host "Chemin approximatif: ExpoApp/Documents/app-console-logs.txt" -ForegroundColor Cyan
        exit 1
    }
    
    Write-Host "=== Swift App Console Logs ===" -ForegroundColor Green
    Write-Host "Fichier: $actualLogPath" -ForegroundColor Cyan
    
    if ($Filter) {
        Write-Host "Filtre de contenu: $Filter" -ForegroundColor Yellow
    }
    
    if ($Level) {
        Write-Host "Filtre de niveau: $Level" -ForegroundColor Yellow
    }
    
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    if ($Tail) {
        Write-Host "Mode temps réel activé (CTRL+C pour arrêter)..." -ForegroundColor Yellow
        Write-Host ""
        
        # Afficher d'abord les dernières lignes existantes
        if (Test-Path $actualLogPath) {
            $content = Get-Content $actualLogPath -Tail $Lines
            foreach ($line in $content) {
                if (Test-LineFilter $line) {
                    Write-ColorizedLog $line
                }
            }
        }
        
        # Puis surveiller les nouvelles lignes
        Get-Content $actualLogPath -Wait -Tail 0 | ForEach-Object {
            if (Test-LineFilter $_) {
                Write-ColorizedLog $_
            }
        }
    } else {
        # Affichage statique
        $content = Get-Content $actualLogPath -Tail $Lines
        
        $filteredLines = $content | Where-Object { Test-LineFilter $_ }
        
        if ($filteredLines.Count -eq 0) {
            Write-Host "Aucune ligne trouvée avec les filtres spécifiés." -ForegroundColor Yellow
        } else {
            foreach ($line in $filteredLines) {
                Write-ColorizedLog $line
            }
            
            Write-Host "----------------------------------------" -ForegroundColor Gray
            Write-Host "Affichées: $($filteredLines.Count) lignes sur $($content.Count) total" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "Erreur lors de la lecture des logs: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
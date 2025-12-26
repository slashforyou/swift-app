# read-logs.ps1
# Script PowerShell pour lire les logs de SwiftApp

param(
    [int]$Lines = 50,
    [string]$Filter = "",
    [switch]$Follow
)

$LogPath = "$env:USERPROFILE\Documents\ExpoProjects\swift-app\swiftapp-logs.txt"

# Chercher le fichier de logs dans les emplacements possibles
$PossiblePaths = @(
    "$env:USERPROFILE\Documents\ExpoProjects\swift-app\swiftapp-logs.txt",
    "C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\swiftapp-logs.txt",
    "$pwd\swiftapp-logs.txt",
    "$env:TEMP\swiftapp-logs.txt"
)

$LogFile = $null
foreach ($Path in $PossiblePaths) {
    if (Test-Path $Path) {
        $LogFile = $Path
        break
    }
}

if (-not $LogFile) {
    Write-Host "❌ Fichier de logs non trouvé dans les emplacements suivants:" -ForegroundColor Red
    foreach ($Path in $PossiblePaths) {
        Write-Host "   $Path" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "💡 Assurez-vous que l'application SwiftApp est en cours d'exécution." -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Lecture des logs depuis: $LogFile" -ForegroundColor Green
Write-Host ""

if ($Follow) {
    Write-Host "👀 Mode suivi activé (Ctrl+C pour arrêter)" -ForegroundColor Cyan
    Get-Content $LogFile -Wait -Tail $Lines | ForEach-Object {
        if ($Filter -eq "" -or $_ -like "*$Filter*") {
            # Coloriser les logs selon le niveau
            if ($_ -like "*[ERROR]*") {
                Write-Host $_ -ForegroundColor Red
            } elseif ($_ -like "*[WARN ]*") {
                Write-Host $_ -ForegroundColor Yellow
            } elseif ($_ -like "*[INFO ]*") {
                Write-Host $_ -ForegroundColor White
            } elseif ($_ -like "*[DEBUG]*") {
                Write-Host $_ -ForegroundColor Gray
            } else {
                Write-Host $_
            }
        }
    }
} else {
    $Content = Get-Content $LogFile -Tail $Lines
    if ($Filter -ne "") {
        $Content = $Content | Where-Object { $_ -like "*$Filter*" }
    }
    
    foreach ($Line in $Content) {
        if ($Line -like "*[ERROR]*") {
            Write-Host $Line -ForegroundColor Red
        } elseif ($Line -like "*[WARN ]*") {
            Write-Host $Line -ForegroundColor Yellow
        } elseif ($Line -like "*[INFO ]*") {
            Write-Host $Line -ForegroundColor White
        } elseif ($Line -like "*[DEBUG]*") {
            Write-Host $Line -ForegroundColor Gray
        } else {
            Write-Host $Line
        }
    }
}

Write-Host ""
Write-Host "📊 Utilisation:" -ForegroundColor Cyan
Write-Host "  .\read-logs.ps1                    # 50 dernières lignes"
Write-Host "  .\read-logs.ps1 -Lines 100        # 100 dernières lignes"
Write-Host "  .\read-logs.ps1 -Filter 'ERROR'   # Filtrer les erreurs"
Write-Host "  .\read-logs.ps1 -Follow           # Suivi en temps réel"
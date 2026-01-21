# =============================================================================
# TEST DU MODULE UI-DETECTOR
# =============================================================================

# Charger le module
. "$PSScriptRoot\lib\ui-detector.ps1"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST UI-DETECTOR" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Detection de l'ecran actuel
Write-Host "[TEST 1] Detection de l'ecran actuel..." -ForegroundColor Yellow
$screen = Get-CurrentScreen
Write-Host "  Ecran detecte: $screen" -ForegroundColor $(if ($screen -ne "unknown" -and $screen -ne "error") { "Green" } else { "Red" })

# Test 2: Trouver un element par texte
Write-Host "`n[TEST 2] Recherche d'elements..." -ForegroundColor Yellow

if ($screen -eq "day") {
    # Sur la page Day, chercher "No jobs scheduled" ou "Refresh"
    $element = Find-UIElement -TextContains "No jobs"
    if ($element.Found) {
        Write-Host "  'No jobs...' trouve a ($($element.CenterX), $($element.CenterY))" -ForegroundColor Green
    } else {
        Write-Host "  'No jobs...' non trouve" -ForegroundColor Red
    }
    
    $refresh = Find-UIElement -Text "Refresh"
    if ($refresh.Found) {
        Write-Host "  'Refresh' trouve a ($($refresh.CenterX), $($refresh.CenterY))" -ForegroundColor Green
    }
    
    # Chercher le FAB (bouton +)
    # Le FAB dans React Native a souvent un content-desc ou est un ViewGroup clickable
    $xml = Get-CurrentUI
    
    # Chercher tous les elements clickables en bas de l'ecran
    Write-Host "`n[TEST 3] Recherche du FAB..." -ForegroundColor Yellow
    
    # Methode 1: Chercher par position (element clickable avec Y > 1500)
    $fabPattern = 'clickable="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
    $matches = [regex]::Matches($xml, $fabPattern)
    
    $bestFab = $null
    $maxY = 0
    
    foreach ($match in $matches) {
        $fullMatch = $match.Value
        if ($fullMatch -match 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
            $y1 = [int]$Matches[2]
            $y2 = [int]$Matches[4]
            $centerY = ($y1 + $y2) / 2
            
            # FAB est generalement en bas a droite
            if ($y1 -gt 1500 -and $centerY -gt $maxY) {
                $maxY = $centerY
                $x1 = [int]$Matches[1]
                $x2 = [int]$Matches[3]
                $bestFab = @{
                    X1 = $x1; Y1 = $y1; X2 = $x2; Y2 = $y2
                    CenterX = [int](($x1 + $x2) / 2)
                    CenterY = [int](($y1 + $y2) / 2)
                    Element = $fullMatch
                }
            }
        }
    }
    
    if ($bestFab) {
        Write-Host "  FAB potentiel trouve a ($($bestFab.CenterX), $($bestFab.CenterY))" -ForegroundColor Green
        Write-Host "  Bounds: [$($bestFab.X1),$($bestFab.Y1)][$($bestFab.X2),$($bestFab.Y2)]" -ForegroundColor Gray
        
        # Test de clic sur le FAB
        Write-Host "`n[TEST 4] Clic sur le FAB..." -ForegroundColor Yellow
        & $script:ADB -s $script:DEVICE shell "input tap $($bestFab.CenterX) $($bestFab.CenterY)"
        Start-Sleep -Seconds 2
        
        # Verifier si le wizard s'est ouvert
        $newScreen = Get-CurrentScreen
        Write-Host "  Nouvel ecran: $newScreen" -ForegroundColor $(if ($newScreen -like "wizard*") { "Green" } else { "Red" })
        
        if ($newScreen -like "wizard*") {
            Write-Host "`n  [OK] Le wizard s'est ouvert!" -ForegroundColor Green
        } else {
            Write-Host "`n  [FAIL] Le wizard ne s'est pas ouvert" -ForegroundColor Red
            Write-Host "  Essayons avec un long press..." -ForegroundColor Yellow
            
            & $script:ADB -s $script:DEVICE shell "input swipe $($bestFab.CenterX) $($bestFab.CenterY) $($bestFab.CenterX) $($bestFab.CenterY) 200"
            Start-Sleep -Seconds 2
            
            $newScreen2 = Get-CurrentScreen
            Write-Host "  Apres long press: $newScreen2" -ForegroundColor $(if ($newScreen2 -like "wizard*") { "Green" } else { "Red" })
        }
    } else {
        Write-Host "  FAB non trouve" -ForegroundColor Red
    }
}
elseif ($screen -eq "expo-home") {
    Write-Host "  Sur Expo Home - cherchons Swift App..." -ForegroundColor Yellow
    $swiftApp = Find-UIElement -Text "Swift App"
    if ($swiftApp.Found) {
        Write-Host "  'Swift App' trouve a ($($swiftApp.CenterX), $($swiftApp.CenterY))" -ForegroundColor Green
    }
}
else {
    Write-Host "  Ecran: $screen - adaptation necessaire" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FIN DES TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

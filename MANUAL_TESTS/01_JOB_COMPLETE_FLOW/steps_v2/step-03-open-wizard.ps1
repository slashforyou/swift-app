# Step 03: Ouvrir Wizard - Clic FAB et verification
# Clic sur le bouton + (FAB) et verifie que le wizard s'ouvre

param([switch]$Debug)

. "$PSScriptRoot\..\..\shared\config.ps1"
. "$PSScriptRoot\..\..\shared\utils.ps1"

Write-Step "03" "Ouverture du Wizard (FAB)"

# Capturer l'ecran
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'ecran"
    exit 1
}

# Verifier qu'on est sur Day
$textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }
$isOnDay = $textsRaw -match "No jobs scheduled|Jobs.*Filters" -or 
           ($textsRaw -match "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday" -and $textsRaw -match "2026")

if (-not $isOnDay) {
    Write-FAIL "Pas sur la page Day - impossible d'ouvrir le wizard"
    exit 1
}

# Trouver le FAB (bouton +)
# Le FAB a souvent un content-desc special ou est le bouton clickable le plus bas
$xmlContent = (Get-Content "C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\logs\ui_current.xml" -Raw)

# Chercher le FAB par ses caracteristiques (bouton clickable en bas de l'ecran)
$fabPattern = 'clickable="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
$fabMatches = [regex]::Matches($xmlContent, $fabPattern)

$bestFab = $null
$maxY = 0

foreach ($match in $fabMatches) {
    $y1 = [int]$match.Groups[2].Value
    $y2 = [int]$match.Groups[4].Value
    $centerY = ($y1 + $y2) / 2
    
    # Le FAB est generalement en bas (Y > 1700) et a une taille raisonnable
    $height = $y2 - $y1
    if ($centerY -gt 1700 -and $centerY -lt 2100 -and $height -gt 100 -and $height -lt 250) {
        if ($centerY -gt $maxY) {
            $maxY = $centerY
            $x1 = [int]$match.Groups[1].Value
            $x2 = [int]$match.Groups[3].Value
            $bestFab = @{
                CenterX = [math]::Floor(($x1 + $x2) / 2)
                CenterY = [math]::Floor(($y1 + $y2) / 2)
                Bounds = "[$x1,$y1][$x2,$y2]"
            }
        }
    }
}

if (-not $bestFab) {
    Write-FAIL "FAB non trouve"
    exit 1
}

Write-Info "FAB trouve a ($($bestFab.CenterX), $($bestFab.CenterY))"

# Cliquer sur le FAB
Invoke-Tap $bestFab.CenterX $bestFab.CenterY -Delay 2000

# Verifier que le wizard s'est ouvert
$ui = Get-Screen
$textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }

$wizardOpened = $textsRaw -match "Select Client|Create New Client|Create New Job"

if ($wizardOpened) {
    Write-OK "Wizard ouvert - Page Select Client"
    exit 0
}

if ($Debug) {
    Write-Debug "Textes apres clic FAB:" -Verbose
    $textsRaw | ForEach-Object { Write-Debug "  - $_" -Verbose }
}

Write-FAIL "Wizard non ouvert apres clic FAB"
exit 1

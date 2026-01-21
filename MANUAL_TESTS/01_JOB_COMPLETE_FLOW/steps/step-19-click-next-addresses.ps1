# Step 19: Cliquer sur Next (Addresses -> Schedule)
# Cette etape passe de l'ecran Addresses a Schedule

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 19 "Next vers Schedule"

# Scroll vers le bas pour voir le bouton Next
Write-Info "Scroll vers le bouton Next..."
Invoke-Swipe -X1 540 -Y1 1800 -X2 540 -Y2 1300 -Duration 300 -Delay 1000

$ui = Get-Screen

# Chercher le bouton Next
$nextBtn = Find-Element -Ui $ui -Text "Next"
if (-not $nextBtn) {
    Write-FAIL "Bouton Next non trouve"
    return @{ Success = $false; Error = "Next button not found" }
}

# Verifier que le bouton est actif (si le node existe)
if ($nextBtn.Node -and $nextBtn.Node.enabled -eq "false") {
    Write-FAIL "Bouton Next desactive - verifier les adresses"
    return @{ Success = $false; Error = "Next button disabled" }
}

# Cliquer sur Next
Write-Info "Clic sur Next..."
Invoke-Tap -X $nextBtn.CenterX -Y $nextBtn.CenterY -Delay 2000

# Verifier qu'on est sur l'ecran Schedule
$ui = Get-Screen
$onSchedule = (Test-ElementExists -Ui $ui -Text "Schedule") -or
              (Test-ElementExists -Ui $ui -Text "Start Time")

if ($onSchedule) {
    Write-OK "Navigation vers Schedule reussie"
    return @{ Success = $true }
} else {
    Write-FAIL "Pas sur l'ecran Schedule"
    return @{ Success = $false; Error = "Not on Schedule screen" }
}

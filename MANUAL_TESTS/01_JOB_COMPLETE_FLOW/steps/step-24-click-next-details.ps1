# Step 24: Cliquer sur Next (Details -> Confirmation)
# Cette etape passe de l'ecran Details a Confirmation

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 24 "Next vers Confirmation"

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

# Cliquer sur Next
Write-Info "Clic sur Next..."
Invoke-Tap -X $nextBtn.CenterX -Y $nextBtn.CenterY -Delay 2000

# Verifier qu'on est sur l'ecran Confirmation
$ui = Get-Screen
$onConfirmation = (Test-ElementExists -Ui $ui -Text "Confirm") -or
                  (Test-ElementExists -Ui $ui -Text "Create Job") -or
                  (Test-ElementExists -Ui $ui -Text "Summary")

if ($onConfirmation) {
    Write-OK "Navigation vers Confirmation reussie"
    return @{ Success = $true }
} else {
    Write-FAIL "Pas sur l'ecran Confirmation"
    return @{ Success = $false; Error = "Not on Confirmation screen" }
}

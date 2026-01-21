# Step 21: Cliquer sur Next (Schedule -> Details)
# Cette etape passe de l'ecran Schedule a Details

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 21 "Next vers Details"

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

# Verifier qu'on est sur l'ecran Details
$ui = Get-Screen
$onDetails = (Test-ElementExists -Ui $ui -Text "Priority") -or
             (Test-ElementExists -Ui $ui -Text "Notes") -or
             (Test-ElementExists -Ui $ui -Text "Low") -or
             (Test-ElementExists -Ui $ui -Text "Medium")

if ($onDetails) {
    Write-OK "Navigation vers Details reussie"
    return @{ Success = $true }
} else {
    Write-FAIL "Pas sur l'ecran Details"
    return @{ Success = $false; Error = "Not on Details screen" }
}

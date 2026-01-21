# Step 24: Passer a la confirmation
# Clique sur Next pour voir le recapitulatif

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 24 "Passage a la confirmation"

# Pas de fermeture de clavier - on clique directement sur le bouton Next

# Scroll down pour voir le bouton Next
Write-Info "Scroll vers le bouton Next..."
Invoke-Swipe -StartX 540 -StartY 1500 -EndX 540 -EndY 800 -Duration 300
Start-Sleep -Milliseconds 500

$ui = Get-Screen

# Chercher le bouton Next par text ou content-desc
$nextBtn = $ui.SelectSingleNode("//node[@text='Next' or @content-desc='Next']")
if (-not $nextBtn) {
    Write-FAIL "Bouton Next non trouve"
    return @{ Success = $false; Error = "Next button not found" }
}

# Extraire les coordonnees
if ($nextBtn.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Next..."
    Invoke-Tap -X $cx -Y $cy -Delay 2000
    
    # Verifier qu'on est sur la confirmation
    $ui = Get-Screen
    $confirmFound = $ui.SelectSingleNode("//node[contains(@text,'Confirm') or contains(@text,'Create Job') or contains(@text,'Review')]")
    if ($confirmFound) {
        Write-OK "Etape Confirmation atteinte"
        return @{ Success = $true }
    } else {
        Write-FAIL "Etape Confirmation non detectee"
        return @{ Success = $false; Error = "Confirmation step not reached" }
    }
}

Write-FAIL "Bounds invalides pour Next"
return @{ Success = $false; Error = "Invalid bounds" }

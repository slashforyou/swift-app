# Step 14: Scroll vers Delivery Address
# Cette etape scroll pour afficher l'adresse de livraison

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 14 "Scroll vers Delivery"

# Scroll vers le bas
Write-Info "Scroll down..."
Invoke-Swipe -X1 540 -Y1 1700 -X2 540 -Y2 1200 -Duration 300 -Delay 1000

# Verifier que Delivery Address est visible
$ui = Get-Screen
if (Test-ElementExists -Ui $ui -Text "Delivery Address") {
    Write-OK "Delivery Address visible"
    return @{ Success = $true }
} else {
    # Essayer un deuxieme scroll
    Write-Info "Deuxieme scroll..."
    Invoke-Swipe -X1 540 -Y1 1700 -X2 540 -Y2 1200 -Duration 300 -Delay 1000
    
    $ui = Get-Screen
    if (Test-ElementExists -Ui $ui -Text "Delivery Address") {
        Write-OK "Delivery Address visible"
        return @{ Success = $true }
    } else {
        Write-FAIL "Delivery Address non visible"
        return @{ Success = $false; Error = "Delivery Address not visible" }
    }
}

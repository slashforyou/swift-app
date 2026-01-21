# Step 12: Remplir Pickup State
# Cette etape remplit le champ state de l'adresse de pickup

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 12 "Remplir Pickup State"

$ui = Get-Screen

# Chercher le premier champ state (pickup)
$field = Find-FieldByHint -Ui $ui -Hint "address.state" -Index 0
if (-not $field) {
    $field = Find-FieldByHint -Ui $ui -Hint "State" -Index 0
}

if (-not $field) {
    Write-FAIL "Champ Pickup State non trouve"
    return @{ Success = $false; Error = "Pickup State field not found" }
}

# Taper sur le champ
Write-Info "Tap sur Pickup State..."
Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 500

# Entrer l'etat
Write-Info "Saisie: $($Context.PickupAddress.State)"
Invoke-Input -Text $Context.PickupAddress.State -Delay 500

Write-OK "Pickup State saisi"
return @{ Success = $true }

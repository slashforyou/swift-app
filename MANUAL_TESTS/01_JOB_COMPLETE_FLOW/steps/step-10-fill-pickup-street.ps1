# Step 10: Remplir Pickup Street
# Cette etape remplit le champ street de l'adresse de pickup

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 10 "Remplir Pickup Street"

$ui = Get-Screen

# Chercher le premier champ street (pickup)
$field = Find-FieldByHint -Ui $ui -Hint "address.street" -Index 0
if (-not $field) {
    $field = Find-FieldByHint -Ui $ui -Hint "Street address" -Index 0
}

if (-not $field) {
    Write-FAIL "Champ Pickup Street non trouve"
    return @{ Success = $false; Error = "Pickup Street field not found" }
}

# Taper sur le champ
Write-Info "Tap sur Pickup Street..."
Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 500

# Entrer l'adresse
$street = $Context.PickupAddress.Street -replace '%s', ' '
Write-Info "Saisie: $street"
Invoke-Input -Text $Context.PickupAddress.Street -Delay 500

Write-OK "Pickup Street saisi"
return @{ Success = $true }

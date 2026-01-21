# Step 11: Remplir Pickup City
# Cette etape remplit le champ city de l'adresse de pickup

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 11 "Remplir Pickup City"

$ui = Get-Screen

# Chercher le premier champ city (pickup)
$field = Find-FieldByHint -Ui $ui -Hint "address.city" -Index 0
if (-not $field) {
    $field = Find-FieldByHint -Ui $ui -Hint "City" -Index 0
}

if (-not $field) {
    Write-FAIL "Champ Pickup City non trouve"
    return @{ Success = $false; Error = "Pickup City field not found" }
}

# Taper sur le champ
Write-Info "Tap sur Pickup City..."
Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 500

# Entrer la ville
Write-Info "Saisie: $($Context.PickupAddress.City)"
Invoke-Input -Text $Context.PickupAddress.City -Delay 500

Write-OK "Pickup City saisi"
return @{ Success = $true }

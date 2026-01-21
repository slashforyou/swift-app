# Step 13: Remplir Pickup Zip
# Cette etape remplit le champ zip de l'adresse de pickup

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 13 "Remplir Pickup Zip"

$ui = Get-Screen

# Chercher le premier champ zip (pickup)
$field = Find-FieldByHint -Ui $ui -Hint "address.zip" -Index 0
if (-not $field) {
    $field = Find-FieldByHint -Ui $ui -Hint "Postal code" -Index 0
}

if (-not $field) {
    Write-FAIL "Champ Pickup Zip non trouve"
    return @{ Success = $false; Error = "Pickup Zip field not found" }
}

# Taper sur le champ
Write-Info "Tap sur Pickup Zip..."
Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 500

# Entrer le code postal
Write-Info "Saisie: $($Context.PickupAddress.Zip)"
Invoke-Input -Text $Context.PickupAddress.Zip -Delay 500

Write-OK "Pickup Zip saisi"
return @{ Success = $true }

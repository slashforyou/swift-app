# Step 6: Remplir le nom du client
# Cette etape remplit le champ Last Name

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 6 "Remplir Last Name"

$ui = Get-Screen

# Chercher le champ Last Name
$field = Find-FieldByHint -Ui $ui -Hint "Last Name" -Index 0
if (-not $field) {
    $field = Find-Element -Ui $ui -Text "Last Name"
}

if (-not $field) {
    Write-FAIL "Champ Last Name non trouve"
    return @{ Success = $false; Error = "Last Name field not found" }
}

# Taper sur le champ
Write-Info "Tap sur Last Name..."
Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 500

# Entrer le nom
Write-Info "Saisie: $($Context.TestClient.LastName)"
Invoke-Input -Text $Context.TestClient.LastName -Delay 500

Write-OK "Nom saisi"
return @{ Success = $true }

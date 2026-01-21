# Step 11: Remplir la rue du pickup
# Remplit le champ Street pour l'adresse de pickup

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 11 "Remplissage rue pickup"

# Ne pas fermer le clavier ici - on vient d'arriver sur l'écran Addresses
# Le clavier n'est pas encore ouvert

$ui = Get-Screen
$pickup = $Context.TestData.PickupAddress

# Verifier qu'on est sur l'ecran Addresses
$onAddresses = (Test-ElementExists -Ui $ui -Text "Enter Addresses") -or 
               (Test-ElementExists -Ui $ui -Text "Pickup Address")

if (-not $onAddresses) {
    Write-FAIL "Pas sur l'ecran Addresses"
    return @{ Success = $false; Error = "Not on Addresses screen" }
}

Write-Info "Ecran Addresses detecte"

# Chercher le premier champ Street (pickup) - index 0
$fields = $ui.SelectNodes("//node[@hint='Street address']")
if ($fields.Count -eq 0) {
    Write-FAIL "Champ Street non trouve"
    return @{ Success = $false; Error = "Street field not found" }
}

$field = $fields[0]
if ($field.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Pickup Street..."
    Invoke-Tap -X $cx -Y $cy -Delay 800
    
    # Vider et saisir
    & $global:ADB shell input keyevent KEYCODE_MOVE_END
    Start-Sleep -Milliseconds 100
    for ($i = 0; $i -lt 50; $i++) { & $global:ADB shell input keyevent KEYCODE_DEL 2>$null }
    Start-Sleep -Milliseconds 200
    
    Write-Info "Saisie: $($pickup.Street)"
    Invoke-Input -Value $pickup.Street
    Start-Sleep -Milliseconds 500
    
    Write-OK "Rue pickup saisie"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour Street"
return @{ Success = $false; Error = "Invalid bounds" }

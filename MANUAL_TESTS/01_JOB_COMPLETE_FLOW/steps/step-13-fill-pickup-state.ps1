# Step 13: Remplir l'etat du pickup
# Remplit le champ State pour l'adresse de pickup

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 13 "Remplissage etat pickup"

# Pas de fermeture de clavier - on clique directement sur le prochain champ

$ui = Get-Screen
$pickup = $Context.TestData.PickupAddress

# Chercher le premier champ State (pickup) - index 0
$fields = $ui.SelectNodes("//node[@hint='State']")
if ($fields.Count -eq 0) {
    Write-FAIL "Champ State non trouve"
    return @{ Success = $false; Error = "State field not found" }
}

$field = $fields[0]
if ($field.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Pickup State..."
    Invoke-Tap -X $cx -Y $cy -Delay 800
    
    # Vider et saisir
    & $global:ADB shell input keyevent KEYCODE_MOVE_END
    Start-Sleep -Milliseconds 100
    for ($i = 0; $i -lt 30; $i++) { & $global:ADB shell input keyevent KEYCODE_DEL 2>$null }
    Start-Sleep -Milliseconds 200
    
    Write-Info "Saisie: $($pickup.State)"
    Invoke-Input -Value $pickup.State
    Start-Sleep -Milliseconds 500
    
    Write-OK "Etat pickup saisi"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour State"
return @{ Success = $false; Error = "Invalid bounds" }

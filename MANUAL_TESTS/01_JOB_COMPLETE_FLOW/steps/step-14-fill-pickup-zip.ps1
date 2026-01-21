# Step 14: Remplir le code postal du pickup
# Remplit le champ Postal code pour l'adresse de pickup

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 14 "Remplissage code postal pickup"

# Pas de fermeture de clavier - on clique directement sur le prochain champ

$ui = Get-Screen
$pickup = $Context.TestData.PickupAddress

# Chercher le premier champ Postal code (pickup) - index 0
$fields = $ui.SelectNodes("//node[@hint='Postal code']")
if ($fields.Count -eq 0) {
    Write-FAIL "Champ Postal code non trouve"
    return @{ Success = $false; Error = "Postal code field not found" }
}

$field = $fields[0]
if ($field.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Pickup Postal code..."
    Invoke-Tap -X $cx -Y $cy -Delay 800
    
    # Vider et saisir
    & $global:ADB shell input keyevent KEYCODE_MOVE_END
    Start-Sleep -Milliseconds 100
    for ($i = 0; $i -lt 30; $i++) { & $global:ADB shell input keyevent KEYCODE_DEL 2>$null }
    Start-Sleep -Milliseconds 200
    
    Write-Info "Saisie: $($pickup.Zip)"
    Invoke-Input -Value $pickup.Zip
    Start-Sleep -Milliseconds 500
    
    Write-OK "Code postal pickup saisi"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour Postal code"
return @{ Success = $false; Error = "Invalid bounds" }

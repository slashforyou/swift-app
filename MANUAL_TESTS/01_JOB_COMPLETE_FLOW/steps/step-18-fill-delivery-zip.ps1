# Step 18: Remplir Delivery Zip
# Cette etape remplit le champ zip de l'adresse de livraison

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 18 "Remplir Delivery Zip"

# Pas de fermeture de clavier - on clique directement sur le prochain champ

$ui = Get-Screen
$delivery = $Context.TestData.DeliveryAddress

# Chercher le deuxieme champ Postal code (delivery) - index 1
$fields = $ui.SelectNodes("//node[@hint='Postal code']")
if ($fields.Count -lt 2) {
    Write-FAIL "Champ Delivery Postal code non trouve (need 2 Postal code fields)"
    return @{ Success = $false; Error = "Delivery Postal code field not found" }
}

$field = $fields[1]
if ($field.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Delivery Postal code..."
    Invoke-Tap -X $cx -Y $cy -Delay 800
    
    # Vider et saisir
    & $global:ADB shell input keyevent KEYCODE_MOVE_END
    Start-Sleep -Milliseconds 100
    for ($i = 0; $i -lt 30; $i++) { & $global:ADB shell input keyevent KEYCODE_DEL 2>$null }
    Start-Sleep -Milliseconds 200
    
    Write-Info "Saisie: $($delivery.Zip)"
    Invoke-Input -Value $delivery.Zip
    Start-Sleep -Milliseconds 500
    
    Write-OK "Delivery Zip saisi"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour Delivery Postal code"
return @{ Success = $false; Error = "Invalid bounds" }

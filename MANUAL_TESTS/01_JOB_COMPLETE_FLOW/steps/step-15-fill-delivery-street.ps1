# Step 15: Remplir Delivery Street
# Cette etape remplit le champ street de l'adresse de livraison

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 15 "Remplir Delivery Street"

# Pas de fermeture de clavier - on clique directement sur le prochain champ

$ui = Get-Screen
$delivery = $Context.TestData.DeliveryAddress

# Chercher le deuxieme champ Street address (delivery) - index 1
$fields = $ui.SelectNodes("//node[@hint='Street address']")
if ($fields.Count -lt 2) {
    Write-FAIL "Champ Delivery Street non trouve (need 2 Street fields)"
    return @{ Success = $false; Error = "Delivery Street field not found" }
}

$field = $fields[1]
if ($field.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Delivery Street..."
    Invoke-Tap -X $cx -Y $cy -Delay 800
    
    # Vider et saisir
    & $global:ADB shell input keyevent KEYCODE_MOVE_END
    Start-Sleep -Milliseconds 100
    for ($i = 0; $i -lt 50; $i++) { & $global:ADB shell input keyevent KEYCODE_DEL 2>$null }
    Start-Sleep -Milliseconds 200
    
    Write-Info "Saisie: $($delivery.Street)"
    Invoke-Input -Value $delivery.Street
    Start-Sleep -Milliseconds 500
    
    Write-OK "Delivery Street saisi"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour Delivery Street"
return @{ Success = $false; Error = "Invalid bounds" }

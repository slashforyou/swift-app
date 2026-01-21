# Step 16: Remplir Delivery City
# Cette etape remplit le champ city de l'adresse de livraison

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 16 "Remplir Delivery City"

# Pas de fermeture de clavier - on clique directement sur le prochain champ

$ui = Get-Screen
$delivery = $Context.TestData.DeliveryAddress

# Chercher le deuxieme champ City (delivery) - index 1
$fields = $ui.SelectNodes("//node[@hint='City']")
if ($fields.Count -lt 2) {
    Write-FAIL "Champ Delivery City non trouve (need 2 City fields)"
    return @{ Success = $false; Error = "Delivery City field not found" }
}

$field = $fields[1]
if ($field.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Delivery City..."
    Invoke-Tap -X $cx -Y $cy -Delay 800
    
    # Vider et saisir
    & $global:ADB shell input keyevent KEYCODE_MOVE_END
    Start-Sleep -Milliseconds 100
    for ($i = 0; $i -lt 30; $i++) { & $global:ADB shell input keyevent KEYCODE_DEL 2>$null }
    Start-Sleep -Milliseconds 200
    
    Write-Info "Saisie: $($delivery.City)"
    Invoke-Input -Value $delivery.City
    Start-Sleep -Milliseconds 500
    
    Write-OK "Delivery City saisi"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour Delivery City"
return @{ Success = $false; Error = "Invalid bounds" }

# Step 6: Remplir le nom du client  
# Cette etape remplit le champ Last Name

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 6 "Remplir Last Name"

# Fermer le clavier si ouvert (pour avoir des bounds valides)
Write-Info "Fermeture du clavier..."
& $global:ADB shell input keyevent KEYCODE_BACK
Start-Sleep -Milliseconds 500

# Vérifier qu'on est sur le formulaire client
Write-Info "Vérification de l'écran actuel..."
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'écran"
    return @{ Success = $false; Error = "Screen capture failed" }
}

# Chercher le champ Last Name par son hint
$lastNameField = Find-FieldByHint -Ui $ui -Hint "Enter last name"
if (-not $lastNameField) {
    Write-FAIL "Champ Last Name non trouve"
    return @{ Success = $false; Error = "Last Name field not found" }
}

Write-Info "✅ Formulaire client détecté"

$expectedHint = "Enter last name"
$maxRetries = 3

for ($retry = 0; $retry -lt $maxRetries; $retry++) {
    # Clic sur le champ Last Name
    Write-Info "Clic sur le champ Last Name (Y=$($lastNameField.CenterY))..."
    Invoke-Tap -X $lastNameField.CenterX -Y $lastNameField.CenterY -Delay 800
    
    # Vérifier qu'on est dans le bon champ
    $ui = Get-Screen
    $focused = Get-FocusedField -Ui $ui
    
    if ($focused -and $focused.Hint -eq $expectedHint) {
        Write-Info "✅ Champ Last Name actif"
        
        # Vider le champ
        Write-Info "Vidage du champ..."
        & $global:ADB shell input keyevent KEYCODE_MOVE_END
        Start-Sleep -Milliseconds 100
        for ($i = 0; $i -lt 30; $i++) {
            & $global:ADB shell input keyevent KEYCODE_DEL 2>$null
        }
        Start-Sleep -Milliseconds 300
        
        Write-Info "Saisie du nom: $($Context.TestData.Client.LastName)"
        Invoke-Input $Context.TestData.Client.LastName
        
        Start-Sleep -Milliseconds 500
        
        Write-Info "[OK] Champ Last Name rempli: $($Context.TestData.Client.LastName)"
        return @{ Success = $true; Error = $null }
    } else {
        $currentHint = if ($focused) { $focused.Hint } else { "aucun" }
        Write-Info "Champ actuel: $currentHint - retry $($retry+1)/$maxRetries"
        
        # Fermer le clavier et re-chercher le champ
        & $global:ADB shell input keyevent KEYCODE_BACK
        Start-Sleep -Milliseconds 300
        $ui = Get-Screen
        $lastNameField = Find-FieldByHint -Ui $ui -Hint "Enter last name"
    }
}

Write-FAIL "Impossible d'activer le champ Last Name"
return @{ Success = $false; Error = "Could not activate Last Name field" }

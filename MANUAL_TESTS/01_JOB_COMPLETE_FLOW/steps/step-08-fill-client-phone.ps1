# Step 8: Remplir le telephone du client
# Remplit le champ Phone dans le formulaire Add Client

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 8 "Remplissage telephone client"

# Fermer le clavier si ouvert (pour avoir des bounds valides)
Write-Info "Fermeture du clavier..."
& $global:ADB shell input keyevent KEYCODE_BACK
Start-Sleep -Milliseconds 500

# Verification de l'ecran
Write-Info "Verification de l'ecran actuel..."
$ui = Get-Screen

# Verifier qu'on est sur le formulaire client
$hasClientForm = (Test-ElementExists -Ui $ui -Text "First Name") -or 
                 (Test-ElementExists -Ui $ui -Text "Create Client") -or
                 (Test-ElementExists -Ui $ui -Text "Fill in the client")

if (-not $hasClientForm) {
    Write-FAIL "Pas sur le formulaire client"
    return @{ Success = $false; Error = "Not on client form" }
}

Write-Info "Formulaire client detecte"

$client = $Context.TestData.Client
$expectedHint = "Enter phone number"
$maxRetries = 3

# Chercher le champ Phone par son hint
$field = Find-FieldByHint -Ui $ui -Hint $expectedHint
if (-not $field) {
    $field = Find-FieldByHint -Ui $ui -Hint "phone"
}

if (-not $field) {
    # Essayer de scroller vers le bas pour voir le champ Phone
    Write-Info "Champ non visible, scroll vers le bas..."
    Invoke-Swipe -X1 540 -Y1 1100 -X2 540 -Y2 800 -Duration 300 -Delay 500
    $ui = Get-Screen
    $field = Find-FieldByHint -Ui $ui -Hint $expectedHint
    if (-not $field) {
        $field = Find-FieldByHint -Ui $ui -Hint "phone"
    }
}

if (-not $field) {
    Write-Info "[SKIP] Champ Phone non visible"
    return @{ Success = $true; Skipped = $true }
}

for ($retry = 0; $retry -lt $maxRetries; $retry++) {
    # Cliquer sur le champ pour l'activer
    Write-Info "Clic sur Phone..."
    Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 800
    
    # Vérifier qu'on est dans le bon champ
    $ui = Get-Screen
    $focused = Get-FocusedField -Ui $ui
    
    if ($focused -and $focused.Hint -eq $expectedHint) {
        Write-Info "✅ Champ Phone actif"
        
        # Vider le champ
        Write-Info "Vidage du champ..."
        & $global:ADB shell input keyevent KEYCODE_MOVE_END
        Start-Sleep -Milliseconds 100
        for ($i = 0; $i -lt 20; $i++) {
            & $global:ADB shell input keyevent KEYCODE_DEL 2>$null
        }
        Start-Sleep -Milliseconds 300

        # Remplir le champ
        Write-Info "Saisie: $($client.Phone)"
        Invoke-Input -Value $client.Phone
        Start-Sleep -Milliseconds 500
        
        Write-OK "Telephone saisi"
        return @{ Success = $true }
    } else {
        $currentHint = if ($focused) { $focused.Hint } else { "aucun" }
        Write-Info "Champ actuel: $currentHint - retry $($retry+1)/$maxRetries"
        
        # Re-chercher le champ
        $ui = Get-Screen
        $field = Find-FieldByHint -Ui $ui -Hint $expectedHint
    }
}

Write-FAIL "Impossible d'activer le champ Phone"
return @{ Success = $false; Error = "Could not activate Phone field" }

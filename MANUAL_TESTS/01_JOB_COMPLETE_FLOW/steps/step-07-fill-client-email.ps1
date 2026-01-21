# Step 7: Remplir l'email du client
# Remplit le champ Email dans le formulaire Add Client

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 7 "Remplissage email client"

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
$expectedHint = "Enter email address"
$maxRetries = 4

# Scroller vers le bas pour voir le champ Email
Write-Info "Scroll vers le bas pour voir Email..."
Invoke-Swipe -X1 540 -Y1 1100 -X2 540 -Y2 700 -Duration 300 -Delay 500

for ($retry = 0; $retry -lt $maxRetries; $retry++) {
    # Chercher le champ après scroll
    $ui = Get-Screen
    $field = Find-FieldByHint -Ui $ui -Hint $expectedHint
    
    if (-not $field) {
        Write-Info "Champ non visible, scroll..."
        Invoke-Swipe -X1 540 -Y1 1100 -X2 540 -Y2 700 -Duration 300 -Delay 500
        continue
    }
    
    # Vérifier que les bounds sont valides (Y1 < Y2)
    if ($field.Bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
        $y1 = [int]$matches[2]
        $y2 = [int]$matches[4]
        if ($y1 -gt $y2) {
            Write-Info "Champ hors vue (Y1=$y1 > Y2=$y2), scroll..."
            Invoke-Swipe -X1 540 -Y1 1100 -X2 540 -Y2 700 -Duration 300 -Delay 500
            continue
        }
    }
    
    # Cliquer sur le champ pour l'activer
    Write-Info "Clic sur Email..."
    Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 800
    
    # Vérifier qu'on est dans le bon champ
    $ui = Get-Screen
    $focused = Get-FocusedField -Ui $ui
    
    if ($focused -and $focused.Hint -eq $expectedHint) {
        Write-Info "✅ Champ Email actif"
        
        # Vider le champ
        Write-Info "Vidage du champ..."
        & $global:ADB shell input keyevent KEYCODE_MOVE_END
        Start-Sleep -Milliseconds 100
        for ($i = 0; $i -lt 60; $i++) {
            & $global:ADB shell input keyevent KEYCODE_DEL 2>$null
        }
        Start-Sleep -Milliseconds 300

        # Remplir le champ
        Write-Info "Saisie: $($client.Email)"
        Invoke-Input -Value $client.Email
        Start-Sleep -Milliseconds 500
        
        Write-OK "Email saisi"
        return @{ Success = $true }
    } else {
        $currentHint = if ($focused) { $focused.Hint } else { "aucun" }
        Write-Info "Champ actuel: $currentHint - retry $($retry+1)/$maxRetries"
        
        # Re-chercher le champ
        $ui = Get-Screen
        $field = Find-FieldByHint -Ui $ui -Hint $expectedHint
    }
}

Write-FAIL "Impossible d'activer le champ Email"
return @{ Success = $false; Error = "Could not activate Email field" }

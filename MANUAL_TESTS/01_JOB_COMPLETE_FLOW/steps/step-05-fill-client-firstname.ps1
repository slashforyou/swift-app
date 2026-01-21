# Step 5: Remplir le prenom du client
# Cette etape remplit le champ First Name

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 5 "Remplir First Name"

$expectedHint = "Enter first name"
$maxRetries = 3

# Vérifier qu'on est sur le formulaire client
Write-Info "Vérification de l'écran actuel..."

# D'abord scroller vers le haut pour s'assurer que First Name est visible
Write-Info "Scroll vers le haut pour voir First Name..."
Invoke-Swipe -X1 540 -Y1 800 -X2 540 -Y2 1200 -Duration 300 -Delay 500

$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'écran"
    return @{ Success = $false; Error = "Screen capture failed" }
}

Write-Info "✅ Formulaire client détecté"

for ($retry = 0; $retry -lt $maxRetries; $retry++) {
    # Re-chercher le champ à chaque retry
    $ui = Get-Screen
    $firstNameField = Find-FieldByHint -Ui $ui -Hint $expectedHint
    
    if (-not $firstNameField) {
        Write-Info "Champ First Name non trouvé, scroll..."
        Invoke-Swipe -X1 540 -Y1 800 -X2 540 -Y2 1200 -Duration 300 -Delay 500
        continue
    }
    
    # Vérifier que les bounds sont valides (Y1 < Y2)
    if ($firstNameField.Bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
        $y1 = [int]$matches[2]
        $y2 = [int]$matches[4]
        if ($y1 -gt $y2) {
            Write-Info "Champ hors vue (bounds invalides), scroll vers le haut..."
            Invoke-Swipe -X1 540 -Y1 800 -X2 540 -Y2 1200 -Duration 300 -Delay 500
            continue
        }
    }
    # Clic sur le champ First Name
    Write-Info "Clic sur le champ First Name..."
    Invoke-Tap -X $firstNameField.CenterX -Y $firstNameField.CenterY -Delay 800
    
    # Vérifier qu'on est dans le bon champ
    $ui = Get-Screen
    $focused = Get-FocusedField -Ui $ui
    
    if ($focused -and $focused.Hint -eq $expectedHint) {
        Write-Info "✅ Champ First Name actif"
        
        # Vider le champ avec MOVE_END + DEL répétés
        Write-Info "Vidage du champ..."
        & $global:ADB shell input keyevent KEYCODE_MOVE_END
        Start-Sleep -Milliseconds 100
        for ($i = 0; $i -lt 30; $i++) {
            & $global:ADB shell input keyevent KEYCODE_DEL 2>$null
        }
        Start-Sleep -Milliseconds 300
        
        Write-Info "Saisie du prenom: $($Context.TestData.Client.FirstName)"
        Invoke-Input $Context.TestData.Client.FirstName
        
        Start-Sleep -Milliseconds 500
        
        Write-Info "[OK] Champ First Name rempli: $($Context.TestData.Client.FirstName)"
        return @{ Success = $true; Error = $null }
    } else {
        $currentHint = if ($focused) { $focused.Hint } else { "aucun" }
        Write-Info "Champ actuel: $currentHint - retry $($retry+1)/$maxRetries"
    }
}

Write-FAIL "Impossible d'activer le champ First Name"
return @{ Success = $false; Error = "Could not activate First Name field" }

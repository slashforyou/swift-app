# Step 9: Creer le client
# Cette etape clique sur le bouton Create Client

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 9 "Creation du client"

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

# Fermer le clavier si ouvert
Write-Info "Fermeture du clavier..."
& $global:ADB shell input keyevent KEYCODE_BACK
Start-Sleep -Milliseconds 500
$ui = Get-Screen

# Chercher le bouton Create Client
$createBtn = Find-Element -Ui $ui -Text "Create Client"

if (-not $createBtn) {
    # Scroll vers le bas pour voir le bouton
    Write-Info "Scroll vers le bouton..."
    Invoke-Swipe -X1 540 -Y1 1800 -X2 540 -Y2 1300 -Duration 300 -Delay 1000
    
    $ui = Get-Screen
    $createBtn = Find-Element -Ui $ui -Text "Create Client"
}

if (-not $createBtn) {
    Write-FAIL "Bouton Create Client non trouve"
    return @{ Success = $false; Error = "Create Client button not found" }
}

# Cliquer sur le bouton
Write-Info "Clic sur Create Client..."
Invoke-Tap -X $createBtn.CenterX -Y $createBtn.CenterY -Delay 2000

# Attendre que le resultat apparaisse
Start-Sleep -Milliseconds 2000

# Verifier le resultat (plusieurs tentatives)
for ($attempt = 0; $attempt -lt 3; $attempt++) {
    $ui = Get-Screen
    
    # Verifier s'il y a un message de succes
    $hasSuccess = (Test-ElementExists -Ui $ui -Text "Success") -or 
                  (Test-ElementExists -Ui $ui -Text "successfully") -or
                  (Test-ElementExists -Ui $ui -Text "created")

    if ($hasSuccess) {
        Write-OK "Client cree avec succes"
        
        # Attendre un peu puis fermer le modal de succès
        Start-Sleep -Milliseconds 1000
        $ui = Get-Screen
        
        # Cliquer sur OK pour fermer le modal et continuer vers Addresses
        $okBtn = Find-Element -Ui $ui -Text "OK"
        if ($okBtn) {
            Write-Info "Clic sur OK pour continuer vers Addresses..."
            Invoke-Tap -X $okBtn.CenterX -Y $okBtn.CenterY -Delay 1500
        } else {
            # Si pas de OK visible, attendre un peu plus
            Start-Sleep -Milliseconds 2000
        }
        return @{ Success = $true }
    }
    
    Start-Sleep -Milliseconds 1000
}

# Verifier s'il y a une erreur
$hasError = Test-ElementExists -Ui $ui -Text "Error"
if ($hasError) {
    $errorMsg = Find-Element -Ui $ui -Text "required"
    if ($errorMsg) {
        Write-FAIL "Erreur: champs requis manquants"
        return @{ Success = $false; Error = "Required fields missing" }
    }
}

# Verifier qu'on est sur l'ecran Addresses ou qu'on a progresse
$onAddresses = (Test-ElementExists -Ui $ui -Text "Pickup Address") -or 
               (Test-ElementExists -Ui $ui -Text "Enter Addresses") -or
               (Test-ElementExists -Ui $ui -Text "Pickup") -or
               (Test-ElementExists -Ui $ui -Text "Dropoff") -or
               (Test-ElementExists -Ui $ui -Text "Address")

if ($onAddresses) {
    Write-OK "Client cree avec succes"
    return @{ Success = $true }
}

# Verifier si on est toujours sur le wizard mais page suivante
$stillOnWizard = Test-ElementExists -Ui $ui -Text "Create New Job"
if ($stillOnWizard) {
    # On est peut-etre passe a l'etape suivante
    $noMoreClient = -not (Test-ElementExists -Ui $ui -Text "Fill in the client")
    if ($noMoreClient) {
        Write-OK "Client cree, page suivante du wizard"
        return @{ Success = $true }
    }
}

Write-FAIL "Pas sur l'ecran Addresses"
return @{ Success = $false; Error = "Not on Addresses screen" }

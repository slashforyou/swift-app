# Step 10: Selectionner le client cree
# Selectionne le client nouvellement cree dans la liste
# OU skip si on est deja sur Enter Addresses

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 10 "Selection du client cree"

$ui = Get-Screen
$client = $Context.TestData.Client
$clientName = "$($client.FirstName) $($client.LastName)"

# Verifier si on est deja sur Enter Addresses (apres creation client directe)
$onAddresses = (Test-ElementExists -Ui $ui -Text "Enter Addresses") -or 
               (Test-ElementExists -Ui $ui -Text "Pickup Address") -or
               (Test-ElementExists -Ui $ui -Text "Pickup and delivery") -or
               (Test-ElementExists -Ui $ui -Text "Street address") -or
               (Test-ElementExists -Ui $ui -Text "Delivery Address")

if ($onAddresses) {
    Write-OK "Deja sur l'ecran Addresses - client auto-selectionne"
    return @{ Success = $true; Skipped = $true }
}

# Chercher le client dans la liste (avec scroll si nécessaire)
$clientItem = Find-Element -Ui $ui -Text $clientName

# Si pas trouvé, essayer de faire défiler la liste
if (-not $clientItem) {
    Write-Info "Client non visible, scroll dans la liste..."
    
    # Scroll vers le haut pour voir les clients récents
    for ($i = 0; $i -lt 3; $i++) {
        Invoke-Swipe -X1 540 -Y1 800 -X2 540 -Y2 1500 -Duration 300 -Delay 500
        $ui = Get-Screen
        $clientItem = Find-Element -Ui $ui -Text $clientName
        if ($clientItem) { break }
    }
}

# Si toujours pas trouvé, essayer la recherche
if (-not $clientItem) {
    $searchField = Find-Element -Ui $ui -Text "Search"
    if ($searchField) {
        Write-Info "Utilisation de la recherche..."
        Invoke-Tap -X $searchField.CenterX -Y $searchField.CenterY -Delay 800
        Start-Sleep -Milliseconds 500
        
        # Saisir le nom du client
        Invoke-Input -Value $client.LastName
        Start-Sleep -Milliseconds 1500
        
        # Fermer le clavier et vérifier
        & $global:ADB -s $global:DEVICE shell "cmd input method hide"
        Start-Sleep -Milliseconds 500
        
        $ui = Get-Screen
        $clientItem = Find-Element -Ui $ui -Text $clientName
    }
}

if (-not $clientItem) {
    Write-FAIL "Client '$clientName' non trouve dans la liste"
    return @{ Success = $false; Error = "Client not found in list" }
}

# Cliquer sur le client
Write-Info "Selection de $clientName..."
Invoke-Tap -X $clientItem.CenterX -Y $clientItem.CenterY -Delay 2000

# Verifier qu'on passe a l'etape suivante (Enter Addresses)
$ui = Get-Screen
if ((Test-ElementExists -Ui $ui -Text "Enter Addresses") -or (Test-ElementExists -Ui $ui -Text "Pickup Address")) {
    Write-OK "Client selectionne - Etape addresses"
    return @{ Success = $true }
} else {
    Write-FAIL "Etape addresses non atteinte"
    return @{ Success = $false; Error = "Addresses step not reached" }
}

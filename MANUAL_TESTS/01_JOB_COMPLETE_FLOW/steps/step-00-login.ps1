# Step 0: Login
# Cette etape se connecte a l'application si necessaire
# Peut etre reutilisee dans toutes les suites de tests

param(
    [hashtable]$Context
)

# Importer les utilitaires si pas deja fait
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}
if (-not $global:TEST_AUTH) {
    . "$PSScriptRoot\..\..\shared\config.ps1"
}

Write-Step 0 "Connexion"

# Verifier si deja connecte (detecter plusieurs ecrans possibles)
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'ecran"
    return @{ Success = $false; Error = "Screen capture failed" }
}

$isLoggedIn = (Test-ElementExists -Ui $ui -Text "Today") -or
              (Test-ElementExists -Ui $ui -Text "Jobs") -or  
              (Test-ElementExists -Ui $ui -Text "Calendar") -or
              (Test-ElementExists -Ui $ui -Text "Create New Job") -or
              (Test-ElementExists -Ui $ui -Text "Pickup Address")

if ($isLoggedIn) {
    Write-Skip "Deja connecte - etape ignoree"
    return @{ Success = $true; Skipped = $true }
}

# Chercher le champ email
Write-Info "Recherche du champ email..."
$emailField = Find-FieldByHint -Ui $ui -Hint "Email" -Index 0
if (-not $emailField) {
    Write-FAIL "Champ email non trouve"
    return @{ Success = $false; Error = "Email field not found" }
}

# Taper sur le champ email
Write-Info "Tap sur email field..."
Invoke-Tap -X $emailField.CenterX -Y $emailField.CenterY -Delay 500

# Entrer l'email
Write-Info "Saisie de l'email..."
Invoke-Input -Text $global:TEST_AUTH.Email -Delay 500

# Chercher le champ password
$ui = Get-Screen
$passwordField = Find-FieldByHint -Ui $ui -Hint "Password" -Index 0
if (-not $passwordField) {
    Write-FAIL "Champ password non trouve"
    return @{ Success = $false; Error = "Password field not found" }
}

# Taper sur le champ password
Write-Info "Tap sur password field..."
Invoke-Tap -X $passwordField.CenterX -Y $passwordField.CenterY -Delay 500

# Entrer le password
Write-Info "Saisie du password..."
Invoke-Input -Text $global:TEST_AUTH.Password -Delay 500

# Chercher le bouton de connexion
$ui = Get-Screen
$loginBtn = Find-Element -Ui $ui -Text "Log In"
if (-not $loginBtn) {
    $loginBtn = Find-Element -Ui $ui -Text "Sign In"
}
if (-not $loginBtn) {
    Write-FAIL "Bouton de connexion non trouve"
    return @{ Success = $false; Error = "Login button not found" }
}

# Cliquer sur le bouton
Write-Info "Clic sur le bouton de connexion..."
Invoke-Tap -X $loginBtn.CenterX -Y $loginBtn.CenterY -Delay 3000

# Verifier la connexion
$ui = Get-Screen
if (Test-ElementExists -Ui $ui -Text "Today") {
    Write-OK "Connexion reussie"
    return @{ Success = $true }
} else {
    Write-FAIL "Echec de la connexion"
    return @{ Success = $false; Error = "Login failed - Home not found" }
}

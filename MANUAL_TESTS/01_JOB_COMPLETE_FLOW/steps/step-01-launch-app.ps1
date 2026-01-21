# Step 1: Lancement de l'application
# Cette etape lance l'app via Expo
# Peut etre reutilisee dans toutes les suites de tests

param(
    [hashtable]$Context
)

# Importer les utilitaires si pas deja fait
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}
if (-not $global:EXPO_URL) {
    . "$PSScriptRoot\..\..\shared\config.ps1"
}

Write-Step 1 "Lancement de l'app"

# Connexion ADB
Write-Info "Connexion a $($global:DEVICE)..."
if (-not (Connect-ADB)) {
    Write-FAIL "ADB non connecte"
    return @{ Success = $false; Error = "ADB connection failed" }
}
Write-OK "ADB connecte"

# Verifier si l'app est deja lancee
$ui = Get-Screen
if ($ui -and (Test-ElementExists -Ui $ui -Text "Today")) {
    Write-Skip "App deja lancee - Home visible"
    return @{ Success = $true; Skipped = $true }
}

# Lancer l'app via Expo
Write-Info "Lancement via Expo..."
& $global:ADB shell am start -a android.intent.action.VIEW -d $global:EXPO_URL | Out-Null
Start-Sleep -Seconds 8

# Verifier que l'app est chargee
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'ecran"
    return @{ Success = $false; Error = "Screen capture failed" }
}

$appLoaded = (Test-ElementExists -Ui $ui -Text "Today") -or 
             (Test-ElementExists -Ui $ui -Text "Jobs") -or 
             (Test-ElementExists -Ui $ui -Text "Email")

if ($appLoaded) {
    Write-OK "App chargee avec succes"
    return @{ Success = $true }
} else {
    Write-FAIL "App non chargee"
    return @{ Success = $false; Error = "App not loaded" }
}

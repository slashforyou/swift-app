# Step 04: Aller a New Client - Clic sur Create New Client
# Sur la page Select Client, cliquer sur "Create New Client"

param([switch]$Debug)

. "$PSScriptRoot\..\..\shared\config.ps1"
. "$PSScriptRoot\..\..\shared\utils.ps1"

Write-Step "04" "Navigation vers New Client"

# Capturer l'ecran
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'ecran"
    exit 1
}

$textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }

# Verifier si on est deja sur le formulaire New Client
$isOnNewClient = $textsRaw -match "First Name" -and $textsRaw -match "Last Name" -and $textsRaw -match "Email"
if ($isOnNewClient) {
    Write-OK "Deja sur le formulaire New Client"
    exit 0
}

# Verifier qu'on est sur Select Client
$isOnSelectClient = $textsRaw -match "Select Client|Create New Client"
if (-not $isOnSelectClient) {
    Write-FAIL "Pas sur la page Select Client"
    if ($Debug) {
        Write-Debug "Textes: $($textsRaw -join ', ')" -Verbose
    }
    exit 1
}

# Trouver le bouton "Create New Client"
$createBtn = Find-Element -Ui $ui -Text "Create New Client"
if (-not $createBtn) {
    # Essayer avec "Add Client"
    $createBtn = Find-Element -Ui $ui -Text "Add Client"
}

if (-not $createBtn) {
    Write-FAIL "Bouton Create New Client non trouve"
    exit 1
}

Write-Info "Bouton trouve a ($($createBtn.CenterX), $($createBtn.CenterY))"

# Cliquer sur le bouton
Invoke-Tap $createBtn.CenterX $createBtn.CenterY -Delay 1500

# Verifier qu'on est sur le formulaire New Client
$ui = Get-Screen
$textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }

$isOnNewClient = $textsRaw -match "First Name" -and $textsRaw -match "Last Name"

if ($isOnNewClient) {
    Write-OK "Formulaire New Client affiche"
    exit 0
}

if ($Debug) {
    Write-Debug "Textes apres clic:" -Verbose
    $textsRaw | ForEach-Object { Write-Debug "  - $_" -Verbose }
}

Write-FAIL "Formulaire New Client non affiche"
exit 1

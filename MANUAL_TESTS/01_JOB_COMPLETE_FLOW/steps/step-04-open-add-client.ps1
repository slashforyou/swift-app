# Step 4: Ouverture du formulaire Add Client
# Cette etape clique sur "Add Client"

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 4 "Ouverture Add Client"

# Vérifier qu'on est sur le wizard de création
Write-Info "Vérification de l'écran actuel..."
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'écran"
    return @{ Success = $false; Error = "Screen capture failed" }
}

# Vérifier qu'on est sur le wizard (présence de "Create New Job" et "Add Client")
$hasCreateJob = Test-ElementExists -Ui $ui -Text "Create New Job"
$hasAddClient = Test-ElementExists -Ui $ui -Text "Add Client"

if (-not $hasCreateJob -or -not $hasAddClient) {
    Write-FAIL "Wizard de création non détecté"
    Write-Info "Create New Job: $hasCreateJob, Add Client: $hasAddClient"
    return @{ Success = $false; Error = "Create Job wizard not found" }
}

Write-Info "✅ Wizard de création détecté"

# Chercher le bouton "Add Client"
$addClientBtn = Find-Element -Ui $ui -Text "Add Client"
if (-not $addClientBtn) {
    Write-FAIL "Bouton Add Client non trouve"
    return @{ Success = $false; Error = "Add Client button not found" }
}

# Cliquer sur Add Client
Write-Info "Clic sur Add Client..."
Invoke-Tap -X $addClientBtn.CenterX -Y $addClientBtn.CenterY -Delay 2000

# Verifier que le formulaire est ouvert
$ui = Get-Screen
$formOpen = (Test-ElementExists -Ui $ui -Text "First Name") -or 
            (Test-ElementExists -Ui $ui -Text "Create Client")

if ($formOpen) {
    Write-OK "Formulaire client ouvert"
    return @{ Success = $true }
} else {
    Write-FAIL "Formulaire non ouvert"
    return @{ Success = $false; Error = "Client form not opened" }
}

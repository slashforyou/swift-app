# Diagnostic simplifié pour identifier l'écran actuel
. "$PSScriptRoot\..\shared\utils.ps1"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC ECRAN ACTUEL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Initialiser ADB
$global:ADB = "adb"

# Capturer l'état actuel
Write-Info "Capture de l'écran actuel..."
$ui = Get-Screen
if (-not $ui) {
    Write-Error "Impossible de capturer l'UI"
    exit 1
}

Write-Host "`n=== RECHERCHE D'ELEMENTS CLES ===" -ForegroundColor Yellow

# Rechercher des éléments clés
$elements = @(
    "Today",
    "Calendar", 
    "Business",
    "Create New Job",
    "Add Client",
    "First Name",
    "Last Name",
    "Enter first name",
    "Enter last name",
    "No clients found"
)

$foundElements = @()
foreach ($element in $elements) {
    if (Test-ElementExists -Ui $ui -Text $element) {
        $foundElements += $element
        Write-Host "✅ Trouvé: $element" -ForegroundColor Green
    }
}

Write-Host "`n=== DETERMINATION DE L'ECRAN ===" -ForegroundColor Yellow

$screenType = "INCONNU"
$suggestedStep = 0

if ($foundElements -contains "Today" -and $foundElements -contains "Calendar") {
    $screenType = "HOME"
    $suggestedStep = 2
    Write-Host "📱 ECRAN: Accueil (Home)" -ForegroundColor Green
    Write-Info "   → Peut commencer à l'étape 2 (Navigation Today) ou 3 (Clic FAB)"
}
elseif ($foundElements -contains "Create New Job" -and $foundElements -contains "Add Client") {
    $screenType = "WIZARD_JOB"
    $suggestedStep = 4
    Write-Host "📱 ECRAN: Wizard création de job" -ForegroundColor Green
    Write-Info "   → Peut commencer à l'étape 4 (Clic Add Client)"
}
elseif ($foundElements -contains "First Name" -and $foundElements -contains "Last Name") {
    $screenType = "FORM_CLIENT"
    Write-Host "📱 ECRAN: Formulaire création client" -ForegroundColor Green
    
    # Vérifier l'état des champs
    $firstNameField = $ui.SelectSingleNode("//node[@hint='Enter first name']")
    $lastNameField = $ui.SelectSingleNode("//node[@hint='Enter last name']")
    
    $firstNameValue = ""
    $lastNameValue = ""
    
    if ($firstNameField) {
        $firstNameValue = $firstNameField.GetAttribute("text")
        Write-Info "   - Champ First Name: '$firstNameValue'"
    }
    
    if ($lastNameField) {
        $lastNameValue = $lastNameField.GetAttribute("text")
        Write-Info "   - Champ Last Name: '$lastNameValue'"
    }
    
    # Déterminer l'étape
    if (-not $firstNameValue -or $firstNameValue -eq "Enter first name" -or $firstNameValue -eq "") {
        $suggestedStep = 5
        Write-Info "   → Peut commencer à l'étape 5 (Remplir First Name)"
    }
    elseif (-not $lastNameValue -or $lastNameValue -eq "Enter last name" -or $lastNameValue -eq "") {
        $suggestedStep = 6
        Write-Info "   → Peut commencer à l'étape 6 (Remplir Last Name)"
    }
    else {
        $suggestedStep = 7
        Write-Info "   → Peut commencer à l'étape 7 (Email ou suite)"
    }
}
else {
    Write-Host "📱 ECRAN: Non identifié" -ForegroundColor Yellow
    Write-Info "   → Essayer l'étape 0 ou 1"
}

Write-Host "`n=== RECOMMANDATION ===" -ForegroundColor Cyan
Write-Host "🎯 Commencer à l'étape: $suggestedStep" -ForegroundColor Green

switch ($suggestedStep) {
    0 { Write-Info "Commande: .\suite.ps1 -StartFromStep 0 -StopAtStep 3" }
    2 { Write-Info "Commande: .\suite.ps1 -StartFromStep 2 -StopAtStep 5" }
    3 { Write-Info "Commande: .\suite.ps1 -StartFromStep 3 -StopAtStep 6" }
    4 { Write-Info "Commande: .\suite.ps1 -StartFromStep 4 -StopAtStep 7" }
    5 { Write-Info "Commande: .\suite.ps1 -StartFromStep 5 -StopAtStep 8" }
    6 { Write-Info "Commande: .\suite.ps1 -StartFromStep 6 -StopAtStep 9" }
    7 { Write-Info "Commande: .\suite.ps1 -StartFromStep 7 -StopAtStep 10" }
    default { Write-Info "Commande: .\suite.ps1 -StartFromStep 0 -StopAtStep 3" }
}

Write-Host "============================================" -ForegroundColor Cyan
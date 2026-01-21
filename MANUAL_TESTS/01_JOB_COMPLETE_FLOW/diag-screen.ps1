# Script de diagnostic pour identifier l'écran actuel
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

Write-Host "`n=== ANALYSE DE L'ECRAN ===" -ForegroundColor Yellow

# Vérifier les différents écrans possibles
$screenType = "INCONNU"
$suggestedStep = 0

# Vérifier si on est sur l'écran de connexion/login
if ((Test-ElementExists -Ui $ui -Text "Log in") -or (Test-ElementExists -Ui $ui -Text "Sign in")) {
    $screenType = "CONNEXION"
    $suggestedStep = 0
    Write-Host "📱 ECRAN: Connexion/Login" -ForegroundColor Green
}
# Vérifier si on est sur l'écran d'accueil (Home)
elseif ((Test-ElementExists -Ui $ui -Text "Today") -and (Test-ElementExists -Ui $ui -Text "Calendar") -and (Test-ElementExists -Ui $ui -Text "Business")) {
    $screenType = "HOME"
    $suggestedStep = 1
    Write-Host "📱 ECRAN: Accueil (Home)" -ForegroundColor Green
    
    # Vérifier si le FAB est présent pour création de job
    $fabElements = $ui.SelectNodes("//node[@clickable='true' and @bounds]")
    $fabCount = $fabElements.Count
    Write-Info "   - $fabCount éléments clickables détectés"
    Write-Info "   - Carte Today présente: OUI"
    Write-Info "   - Navigation disponible: Calendar, Business, Settings"
}
# Vérifier si on est dans le wizard de création de job
elseif ((Test-ElementExists -Ui $ui -Text "Create New Job") -or (Test-ElementExists -Ui $ui -Text "Select Client")) {
    $screenType = "WIZARD_JOB"
    Write-Host "📱 ECRAN: Wizard création de job" -ForegroundColor Green
    
    # Déterminer à quelle étape du wizard
    if ((Test-ElementExists -Ui $ui -Text "Add Client") -and (Test-ElementExists -Ui $ui -Text "No clients found")) {
        $suggestedStep = 4
        Write-Info "   - Phase: Sélection client (avant Add Client)"
    }
    elseif ((Test-ElementExists -Ui $ui -Text "First Name") -and (Test-ElementExists -Ui $ui -Text "Last Name")) {
        $screenType = "FORM_CLIENT"
        $suggestedStep = 5
        Write-Host "📱 ECRAN: Formulaire création client" -ForegroundColor Green
        
        # Vérifier l'état des champs
        $firstNameField = $ui.SelectSingleNode("//node[@hint='Enter first name']")
        $lastNameField = $ui.SelectSingleNode("//node[@hint='Enter last name']")
        
        if ($firstNameField) {
            $firstNameValue = $firstNameField.GetAttribute("text")
            Write-Info "   - Champ First Name: '$firstNameValue'"
            if ($firstNameValue -and ($firstNameValue -ne "Enter first name")) {
                $suggestedStep = 6  # FirstName rempli, passer au LastName
            }
        }
        
        if ($lastNameField) {
            $lastNameValue = $lastNameField.GetAttribute("text")
            Write-Info "   - Champ Last Name: '$lastNameValue'"
            if ($lastNameValue -and ($lastNameValue -ne "Enter last name")) {
                $suggestedStep = 7  # Les deux champs remplis
            }
        }
    }
}
# Écran Expo ou loading
elseif ((Test-ElementExists -Ui $ui -Text "Expo") -or ($ui.OuterXml.Contains("host.exp.exponent"))) {
    if ($ui.OuterXml.Length -lt 5000) {  # XML très petit = écran vide/loading
        $screenType = "LOADING"
        $suggestedStep = 1
        Write-Host "📱 ECRAN: Chargement/Expo" -ForegroundColor Yellow
        Write-Info "   - App en cours de chargement..."
    } else {
        $screenType = "EXPO_HOME"
        $suggestedStep = 1
        Write-Host "📱 ECRAN: Home Expo (contenu chargé)" -ForegroundColor Green
    }
}
else {
    Write-Host "📱 ECRAN: Non identifié" -ForegroundColor Red
    Write-Info "   - Recherche d'indices dans l'XML..."
    
    # Extraire quelques textes pour diagnostic
    $textElements = $ui.SelectNodes("//node[@text != '']") | Select-Object -First 5
    foreach ($elem in $textElements) {
        $text = $elem.GetAttribute("text")
        if ($text -and $text.Trim() -ne "") {
            Write-Info "   - Texte trouvé: '$text'"
        }
    }
}

Write-Host "`n=== RECOMMANDATIONS ===" -ForegroundColor Yellow
Write-Host "🎯 Étape suggérée pour commencer: $suggestedStep" -ForegroundColor Cyan

switch ($suggestedStep) {
    0 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 0  # Connexion" }
    1 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 1  # Lancement app" }
    2 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 2  # Navigation Today" }
    3 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 3  # Ouverture modal" }
    4 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 4  # Add Client" }
    5 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 5  # Remplir First Name" }
    6 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 6  # Remplir Last Name" }
    7 { Write-Info "   → Lancer: .\suite.ps1 -StartFromStep 7  # Email/suite" }
    default { Write-Warning "   → Diagnostic manuel nécessaire" }
}

Write-Host "`n=== ETAT TECHNIQUE ===" -ForegroundColor Yellow
Write-Info "📊 Taille XML: $($ui.OuterXml.Length) caractères"
Write-Info "🔧 Package: $(if ($ui.OuterXml.Contains('host.exp.exponent')) { 'Expo' } else { 'Autre' })"

# Sauvegarder le diagnostic
$logPath = "$PSScriptRoot\..\logs\diagnostic_$(Get-Date -Format 'yyyyMMdd_HHmmss').xml"
$ui.Save($logPath)
Write-Info "💾 UI sauvegardée: $logPath"

Write-Host "============================================" -ForegroundColor Cyan
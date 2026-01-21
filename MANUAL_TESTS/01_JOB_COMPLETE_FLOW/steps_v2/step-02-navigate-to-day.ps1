# Step 02: Navigation - Aller a la page Day
# Si on n'est pas sur Day, naviguer vers cette page

param([switch]$Debug)

. "$PSScriptRoot\..\..\shared\config.ps1"
. "$PSScriptRoot\..\..\shared\utils.ps1"

Write-Step "02" "Navigation vers page Day"

# Capturer l'ecran
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'ecran"
    exit 1
}

# Detecter la page actuelle
$textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }

# Verifier si on est deja sur Day
$isOnDay = $textsRaw -match "No jobs scheduled|Jobs.*Filters" -or 
           ($textsRaw -match "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday" -and $textsRaw -match "January|February|March|April|May|June|July|August|September|October|November|December")

if ($isOnDay) {
    Write-OK "Deja sur la page Day"
    exit 0
}

# Verifier si on est sur Expo Go Home
$isOnExpoHome = $textsRaw -match "Expo Go|Development servers|Recently opened|Swift App"
if ($isOnExpoHome) {
    Write-Info "Sur Expo Go Home - Ouverture de Swift App..."
    
    # Chercher le bouton Swift App
    $swiftAppBtn = Find-Element -Ui $ui -Text "Swift App"
    if ($swiftAppBtn) {
        Invoke-Tap $swiftAppBtn.CenterX $swiftAppBtn.CenterY -Delay 3000
        
        # Verifier que l'app s'est ouverte
        $ui = Get-Screen
        $textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }
        
        if ($textsRaw -match "No jobs scheduled|Jobs.*Filters|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday") {
            Write-OK "Swift App ouverte - Page Day"
            exit 0
        }
    }
    
    Write-FAIL "Impossible d'ouvrir Swift App"
    exit 1
}

# Verifier si on est dans le wizard - fermer avec Back
$isInWizard = $textsRaw -match "Select Client|Enter Addresses|Schedule|Job Details|Confirm Job|Create New Client|First Name"
if ($isInWizard) {
    Write-Info "Dans le wizard - Fermeture..."
    
    # Chercher le bouton X ou Back
    $closeBtn = Find-Element -Ui $ui -Text "×" -ContentDesc
    if (-not $closeBtn) {
        # Utiliser le bouton hardware back
        & $global:ADB shell input keyevent KEYCODE_BACK
        Start-Sleep -Seconds 1
    } else {
        Invoke-Tap $closeBtn.CenterX $closeBtn.CenterY -Delay 1000
    }
    
    # Verifier
    $ui = Get-Screen
    $textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }
    
    if ($textsRaw -match "No jobs scheduled|Jobs.*Filters") {
        Write-OK "Wizard ferme - Page Day"
        exit 0
    }
}

# Chercher le tab "Today" pour naviguer
$todayTab = Find-Element -Ui $ui -Text "Today"
if ($todayTab) {
    Write-Info "Clic sur Today..."
    Invoke-Tap $todayTab.CenterX $todayTab.CenterY -Delay 2000
    
    $ui = Get-Screen
    $textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }
    
    if ($textsRaw -match "No jobs scheduled|Jobs.*Filters") {
        Write-OK "Navigation vers Day reussie"
        exit 0
    }
}

Write-FAIL "Impossible de naviguer vers la page Day"
if ($Debug) {
    Write-Debug "Textes detectes: $($textsRaw -join ', ')" -Verbose
}
exit 1

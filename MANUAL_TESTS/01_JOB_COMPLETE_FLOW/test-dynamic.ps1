# =============================================================================
# TEST COMPLET - Job Creation Flow avec detection dynamique
# =============================================================================

# Charger le module
. "$PSScriptRoot\lib\ui-detector.ps1"

# Donnees de test
$timestamp = Get-Date -Format "HHmmss"
$TestData = @{
    Client = @{
        FirstName = "Jean"
        LastName = "Dupont"
        Email = "jean.dupont.${timestamp}@test.com"
        Phone = "0612345678"
    }
    Pickup = @{
        Street = "123 Main Street"
        City = "Sydney"
        State = "NSW"
        Zip = "2000"
    }
    Delivery = @{
        Street = "456 Oak Avenue"
        City = "Melbourne"
        State = "VIC"
        Zip = "3000"
    }
}

Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SWIFT APP - JOB CREATION TEST" -ForegroundColor Cyan
Write-Host "  Detection dynamique des elements" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Client: $($TestData.Client.FirstName) $($TestData.Client.LastName)"
Write-Host "Email: $($TestData.Client.Email)`n"

$success = $true
$stepNum = 0

# =============================================================================
# STEP 1: Ouvrir Swift App
# =============================================================================
$stepNum++
Write-Host "[$stepNum] Ouverture de Swift App..." -ForegroundColor Yellow

$screen = Get-CurrentScreen
Write-Host "  Ecran actuel: $screen" -ForegroundColor Gray

if ($screen -ne "day") {
    $opened = Open-SwiftApp
    if ($opened) {
        Write-Host "  [OK] Swift App ouverte" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Impossible d'ouvrir Swift App" -ForegroundColor Red
        $success = $false
    }
} else {
    Write-Host "  [OK] Deja sur la page Day" -ForegroundColor Green
}

if (-not $success) { exit 1 }

# =============================================================================
# STEP 2: Ouvrir le wizard
# =============================================================================
$stepNum++
Write-Host "`n[$stepNum] Ouverture du wizard..." -ForegroundColor Yellow

$screen = Get-CurrentScreen
if ($screen -like "wizard*") {
    Write-Host "  [OK] Deja dans le wizard ($screen)" -ForegroundColor Green
} else {
    $wizardOpened = Open-CreateJobWizard
    if ($wizardOpened) {
        $screen = Get-CurrentScreen
        Write-Host "  [OK] Wizard ouvert ($screen)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Impossible d'ouvrir le wizard" -ForegroundColor Red
        $success = $false
    }
}

if (-not $success) { exit 1 }

# =============================================================================
# STEP 3: Aller a "Create New Client"
# =============================================================================
$stepNum++
Write-Host "`n[$stepNum] Navigation vers formulaire client..." -ForegroundColor Yellow

$screen = Get-CurrentScreen
if ($screen -eq "wizard-new-client") {
    Write-Host "  [OK] Deja sur le formulaire client" -ForegroundColor Green
} elseif ($screen -eq "wizard-client") {
    # Chercher et cliquer sur "Create New Client"
    $createBtn = Click-UIElement -TextContains "Create New Client" -WaitAfter 1000
    if ($createBtn.Success) {
        Write-Host "  [OK] Bouton 'Create New Client' clique" -ForegroundColor Green
        $screen = Get-CurrentScreen
        Write-Host "  Ecran: $screen" -ForegroundColor Gray
    } else {
        # Essayer avec "Add Client"
        $addBtn = Click-UIElement -TextContains "Add Client" -WaitAfter 1000
        if ($addBtn.Success) {
            Write-Host "  [OK] Bouton 'Add Client' clique" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Bouton de creation non trouve" -ForegroundColor Red
            $success = $false
        }
    }
} else {
    Write-Host "  [WARN] Ecran inattendu: $screen" -ForegroundColor Yellow
}

if (-not $success) { exit 1 }

# =============================================================================
# STEP 4: Remplir le formulaire client
# =============================================================================
$stepNum++
Write-Host "`n[$stepNum] Remplissage du formulaire client..." -ForegroundColor Yellow

$screen = Get-CurrentScreen
if ($screen -eq "wizard-new-client" -or (Test-UIElement -TextContains "First Name")) {
    
    # First Name - chercher le champ EditText apres le label
    Write-Host "  Saisie First Name..." -ForegroundColor Gray
    $firstNameField = Find-UIElement -TextContains "Enter first name"
    if (-not $firstNameField.Found) {
        $firstNameField = Find-UIElement -TextContains "First Name" -ClassName "android.widget.EditText"
    }
    if ($firstNameField.Found) {
        & $script:ADB -s $script:DEVICE shell "input tap $($firstNameField.CenterX) $($firstNameField.CenterY)"
        Start-Sleep -Milliseconds 300
        $escapedText = $TestData.Client.FirstName -replace ' ', '%s'
        & $script:ADB -s $script:DEVICE shell "input text '$escapedText'"
        Write-Host "    [OK] First Name saisi" -ForegroundColor Green
    } else {
        Write-Host "    [FAIL] Champ First Name non trouve" -ForegroundColor Red
    }
    
    # Last Name
    Write-Host "  Saisie Last Name..." -ForegroundColor Gray
    $lastNameField = Find-UIElement -TextContains "Enter last name"
    if (-not $lastNameField.Found) {
        $lastNameField = Find-UIElement -TextContains "Last Name" -ClassName "android.widget.EditText"
    }
    if ($lastNameField.Found) {
        & $script:ADB -s $script:DEVICE shell "input tap $($lastNameField.CenterX) $($lastNameField.CenterY)"
        Start-Sleep -Milliseconds 300
        $escapedText = $TestData.Client.LastName -replace ' ', '%s'
        & $script:ADB -s $script:DEVICE shell "input text '$escapedText'"
        Write-Host "    [OK] Last Name saisi" -ForegroundColor Green
    }
    
    # Email
    Write-Host "  Saisie Email..." -ForegroundColor Gray
    $emailField = Find-UIElement -TextContains "Enter email"
    if (-not $emailField.Found) {
        $emailField = Find-UIElement -TextContains "Email" -ClassName "android.widget.EditText"
    }
    if ($emailField.Found) {
        & $script:ADB -s $script:DEVICE shell "input tap $($emailField.CenterX) $($emailField.CenterY)"
        Start-Sleep -Milliseconds 300
        $escapedText = $TestData.Client.Email -replace ' ', '%s'
        & $script:ADB -s $script:DEVICE shell "input text '$escapedText'"
        Write-Host "    [OK] Email saisi" -ForegroundColor Green
    }
    
    # Phone - peut necessiter un scroll
    Write-Host "  Saisie Phone..." -ForegroundColor Gray
    $phoneField = Find-UIElement -TextContains "Enter phone"
    if (-not $phoneField.Found) {
        # Scroll down
        & $script:ADB -s $script:DEVICE shell "input swipe 540 1500 540 800 300"
        Start-Sleep -Milliseconds 500
        $phoneField = Find-UIElement -TextContains "Enter phone"
    }
    if ($phoneField.Found) {
        & $script:ADB -s $script:DEVICE shell "input tap $($phoneField.CenterX) $($phoneField.CenterY)"
        Start-Sleep -Milliseconds 300
        & $script:ADB -s $script:DEVICE shell "input text '$($TestData.Client.Phone)'"
        Write-Host "    [OK] Phone saisi" -ForegroundColor Green
    }
    
    Write-Host "  [OK] Formulaire client rempli" -ForegroundColor Green
    
} else {
    Write-Host "  [FAIL] Pas sur le formulaire client (ecran: $screen)" -ForegroundColor Red
    $success = $false
}

if (-not $success) { exit 1 }

# =============================================================================
# STEP 5: Creer le client
# =============================================================================
$stepNum++
Write-Host "`n[$stepNum] Creation du client..." -ForegroundColor Yellow

# Scroll down pour voir le bouton Create
& $script:ADB -s $script:DEVICE shell "input swipe 540 1500 540 800 300"
Start-Sleep -Milliseconds 500

# Chercher le bouton Create Client
$createClientBtn = Find-UIElement -Text "Create Client"
if (-not $createClientBtn.Found) {
    $createClientBtn = Find-UIElement -TextContains "Create"
}

if ($createClientBtn.Found) {
    Write-Host "  Bouton trouve a ($($createClientBtn.CenterX), $($createClientBtn.CenterY))" -ForegroundColor Gray
    & $script:ADB -s $script:DEVICE shell "input tap $($createClientBtn.CenterX) $($createClientBtn.CenterY)"
    Start-Sleep -Seconds 3
    
    # Verifier si on est passe a l'ecran Address ou si une alerte est apparue
    $screen = Get-CurrentScreen
    Write-Host "  Ecran apres creation: $screen" -ForegroundColor Gray
    
    # Chercher un bouton OK (alerte de succes)
    $okBtn = Find-UIElement -Text "OK"
    if ($okBtn.Found) {
        Write-Host "  Alerte detectee, clic sur OK..." -ForegroundColor Gray
        & $script:ADB -s $script:DEVICE shell "input tap $($okBtn.CenterX) $($okBtn.CenterY)"
        Start-Sleep -Seconds 1
    }
    
    $screen = Get-CurrentScreen
    if ($screen -eq "wizard-address") {
        Write-Host "  [OK] Client cree, passage aux adresses" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Ecran apres creation: $screen" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] Bouton Create Client non trouve" -ForegroundColor Red
    $success = $false
}

# =============================================================================
# RESUME
# =============================================================================
Write-Host "`n============================================" -ForegroundColor Cyan
if ($success) {
    Write-Host "  [SUCCESS] Test passe jusqu'a l'etape $stepNum" -ForegroundColor Green
} else {
    Write-Host "  [FAILED] Test echoue a l'etape $stepNum" -ForegroundColor Red
}
Write-Host "============================================`n" -ForegroundColor Cyan

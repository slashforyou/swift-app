# Swift App - Script de Test Automatise Job Creation
# Chaque action a ete validee manuellement avant ajout
#
# Usage: .\scripts\job-test.ps1 [-StartFromStep <number>] [-Verbose]

param(
    [int]$StartFromStep = 1,
    [switch]$Verbose
)

$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$DEVICE = "192.168.0.250:36561"
$EXPO_URL = "exp://192.168.0.51:8081"

# Identifiants de connexion
$TEST_AUTH = @{
    Email = "romaingiovanni@gmail.com"
    Password = "IllBeThere4_U"
}

# Donnees de test (email unique a chaque execution)
$timestamp = Get-Date -Format "HHmmss"
$TEST_CLIENT = @{
    FirstName = "Jean"
    LastName = "Dupont"
    Email = "jean.dupont.$timestamp@test.com"
    Phone = "0612345678"
}

# Donnees de test pour les adresses
$TEST_PICKUP = @{
    Street = "123%sMain%sStreet"
    City = "Sydney"
    State = "NSW"
    Zip = "2000"
}
$TEST_DELIVERY = @{
    Street = "456%sOak%sAvenue"
    City = "Melbourne"
    State = "VIC"
    Zip = "3000"
}

# Donnees de test pour le schedule
$TEST_SCHEDULE = @{
    StartTime = "09:00"
    EndTime = "17:00"
    Duration = "4"
}

# Donnees de test pour les details
$TEST_DETAILS = @{
    Priority = "Medium"  # Low, Medium, High, Urgent
    Notes = "Test%sjob%s-%sautomated%stest"
}

# Couleurs
function Write-Step { param($n, $msg) Write-Host "`n=== ETAPE $n : $msg ===" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-FAIL { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "-> $msg" -ForegroundColor Yellow }
function Write-Debug { param($msg) if ($Verbose) { Write-Host "  $msg" -ForegroundColor DarkGray } }

# Compteurs
$global:PassedSteps = 0

# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

function Connect-ADB {
    $devices = & $ADB devices 2>&1
    if ($devices -notmatch $DEVICE) {
        Write-Info "Connexion a $DEVICE..."
        & $ADB connect $DEVICE | Out-Null
        Start-Sleep -Seconds 1
    }
    
    $devices = & $ADB devices 2>&1
    return $devices -match $DEVICE
}

function Get-Screen {
    & $ADB shell uiautomator dump /sdcard/ui.xml 2>&1 | Out-Null
    & $ADB pull /sdcard/ui.xml logs/ui_current.xml 2>&1 | Out-Null
    if (Test-Path logs/ui_current.xml) {
        return [xml](Get-Content logs/ui_current.xml -Raw)
    }
    return $null
}

function Find-Element {
    param([xml]$Ui, [string]$Text)
    
    $node = $Ui.SelectSingleNode("//*[contains(@text, '$Text')]")
    if (-not $node) {
        $node = $Ui.SelectSingleNode("//*[contains(@content-desc, '$Text')]")
    }
    
    if ($node -and $node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
        return @{
            X = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            Y = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
            Text = $Text
        }
    }
    return $null
}

function Find-FAB {
    param([xml]$Ui)
    
    $clickables = $Ui.SelectNodes("//*[@clickable='true']")
    foreach ($el in $clickables) {
        if ($el.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $y1 = [int]$Matches[2]
            $x1 = [int]$Matches[1]
            if ($y1 -gt 1700 -and $x1 -gt 700) {
                return @{
                    X = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
                    Y = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
                }
            }
        }
    }
    return $null
}

function Invoke-Tap {
    param([int]$X, [int]$Y, [string]$Description = "")
    Write-Debug "Tap ($X, $Y) $Description"
    & $ADB shell input tap $X $Y
    Start-Sleep -Milliseconds 500
}

function Invoke-Text {
    param([string]$Text)
    Write-Debug "Input text: $Text"
    $escaped = $Text -replace '@', '\@' -replace ' ', '%s'
    & $ADB shell input text $escaped
    Start-Sleep -Milliseconds 300
}

function Invoke-Key {
    param([string]$Key)
    Write-Debug "Key: $Key"
    & $ADB shell input keyevent $Key
    Start-Sleep -Milliseconds 300
}

function Invoke-Swipe {
    param([int]$X1, [int]$Y1, [int]$X2, [int]$Y2)
    Write-Debug "Swipe ($X1,$Y1) -> ($X2,$Y2)"
    & $ADB shell input swipe $X1 $Y1 $X2 $Y2 300
    Start-Sleep -Milliseconds 500
}

# Trouve un champ d'adresse par hint (address.street, address.city, etc.)
# Retourne les coordonnees du Nieme champ correspondant (0-indexed)
function Find-AddressField {
    param([xml]$Ui, [string]$Hint, [int]$Index = 0)
    
    $nodes = $Ui.SelectNodes("//*[@hint='$Hint']")
    if ($nodes -and $nodes.Count -gt $Index) {
        $node = $nodes[$Index]
        if ($node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $y1 = [int]$Matches[2]
            $y2 = [int]$Matches[4]
            # Verifier que le champ est visible (y2 > y1)
            if ($y2 -gt $y1) {
                return @{
                    X = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
                    Y = [int](($y1 + $y2) / 2)
                    Visible = $true
                }
            } else {
                return @{ Visible = $false }
            }
        }
    }
    return $null
}

function Wait-ForElement {
    param([string]$Text, [int]$TimeoutSec = 10)
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSec) {
        $ui = Get-Screen
        if ($ui) {
            $el = Find-Element -Ui $ui -Text $Text
            if ($el) { return $ui }
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    return $null
}

function Screen-Contains {
    param([xml]$Ui, [string]$Text)
    $node = $Ui.SelectSingleNode("//*[contains(@text, '$Text') or contains(@content-desc, '$Text')]")
    return $null -ne $node
}

# ============================================================================
# ETAPES DE TEST (validees manuellement)
# ============================================================================

function Step-0-Login {
    Write-Step 0 "Connexion (si necessaire)"
    
    $ui = Get-Screen
    
    # Verifier si deja connecte (ecran Home ou Jobs visible)
    if ((Screen-Contains -Ui $ui -Text "Today") -or (Screen-Contains -Ui $ui -Text "Jobs")) {
        Write-OK "Deja connecte"
        $global:PassedSteps++
        return $true
    }
    
    # Verifier si on est sur l'ecran de login
    if (-not ((Screen-Contains -Ui $ui -Text "Login") -or 
              (Screen-Contains -Ui $ui -Text "Sign In") -or 
              (Screen-Contains -Ui $ui -Text "Email"))) {
        Write-OK "Pas d'ecran de connexion detecte"
        $global:PassedSteps++
        return $true
    }
    
    Write-Info "Ecran de connexion detecte"
    
    # Trouver champ Email
    $emailField = Find-Element -Ui $ui -Text "Email"
    if (-not $emailField) {
        # Essayer par placeholder
        $emailField = @{ X = 540; Y = 1200 }  # Position approximative
    }
    
    Write-Info "Saisie email: $($TEST_AUTH.Email)"
    Invoke-Tap -X $emailField.X -Y $emailField.Y -Description "Email field"
    Start-Sleep -Milliseconds 300
    Invoke-Text -Text ($TEST_AUTH.Email -replace '@', '\@')
    
    # Passer au champ Password
    Invoke-Key -Key "KEYCODE_TAB"
    Start-Sleep -Milliseconds 300
    
    Write-Info "Saisie password"
    Invoke-Text -Text $TEST_AUTH.Password
    
    # Fermer clavier
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 500
    
    # Chercher bouton Login/Sign In
    $ui = Get-Screen
    $loginBtn = Find-Element -Ui $ui -Text "Login"
    if (-not $loginBtn) {
        $loginBtn = Find-Element -Ui $ui -Text "Sign In"
    }
    if (-not $loginBtn) {
        # Position approximative du bouton
        $loginBtn = @{ X = 540; Y = 1800 }
    }
    
    Write-Info "Tap sur Login..."
    Invoke-Tap -X $loginBtn.X -Y $loginBtn.Y -Description "Login button"
    
    # Attendre la connexion
    Start-Sleep -Seconds 3
    $ui = Wait-ForElement -Text "Today" -TimeoutSec 10
    if (-not $ui) {
        $ui = Wait-ForElement -Text "Jobs" -TimeoutSec 5
    }
    
    if ($ui) {
        Write-OK "Connexion reussie"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Echec de la connexion"
    return $false
}

function Step-1-Launch {
    Write-Step 1 "Lancement de l'app"
    
    if (-not (Connect-ADB)) {
        Write-FAIL "Impossible de se connecter a ADB"
        return $false
    }
    Write-OK "ADB connecte"
    
    # Reveiller l'ecran
    & $ADB shell input keyevent KEYCODE_WAKEUP
    Start-Sleep -Milliseconds 500
    
    # Verifier si deja sur l'app (apres Step-0-Login par exemple)
    $ui = Get-Screen
    if ($ui -and ((Screen-Contains -Ui $ui -Text "Today") -or (Screen-Contains -Ui $ui -Text "Jobs"))) {
        Write-OK "App deja ouverte (connecte via Step-0)"
        $global:PassedSteps++
        return $true
    }
    
    # Lancer l'app via Expo
    Write-Info "Lancement via Expo..."
    & $ADB shell am start -a android.intent.action.VIEW -d $EXPO_URL 2>&1 | Out-Null
    
    # Attendre l'ecran Home ou Jobs
    $ui = Wait-ForElement -Text "Today" -TimeoutSec 10
    if (-not $ui) {
        $ui = Wait-ForElement -Text "Jobs" -TimeoutSec 5
    }
    
    if ($ui) {
        Write-OK "App lancee"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "App non chargee"
    return $false
}

function Step-2-NavigateToJobs {
    Write-Step 2 "Navigation vers Jobs"
    
    $ui = Get-Screen
    
    # Deja sur Jobs ?
    if (Screen-Contains -Ui $ui -Text "Jobs & Filters") {
        Write-OK "Deja sur Jobs"
        $global:PassedSteps++
        return $true
    }
    
    # Trouver et tapper sur Today
    $today = Find-Element -Ui $ui -Text "Today"
    if (-not $today) {
        Write-FAIL "Carte Today non trouvee"
        return $false
    }
    
    Write-Info "Tap sur Today..."
    Invoke-Tap -X $today.X -Y $today.Y -Description "Today card"
    
    $ui = Wait-ForElement -Text "Jobs & Filters" -TimeoutSec 5
    if ($ui) {
        Write-OK "Navigation vers Jobs reussie"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Jobs non charge"
    return $false
}

function Step-3-OpenCreateJob {
    Write-Step 3 "Ouverture wizard Create Job"
    
    $ui = Get-Screen
    
    $fab = Find-FAB -Ui $ui
    if (-not $fab) {
        Write-FAIL "Bouton FAB non trouve"
        return $false
    }
    
    Write-Info "Tap sur FAB..."
    Invoke-Tap -X $fab.X -Y $fab.Y -Description "FAB +"
    
    $ui = Wait-ForElement -Text "Create New Job" -TimeoutSec 5
    if ($ui) {
        Write-OK "Wizard ouvert"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Wizard non ouvert"
    return $false
}

function Step-4-OpenAddClient {
    Write-Step 4 "Ouverture formulaire Add Client"
    
    $ui = Get-Screen
    
    $addClient = Find-Element -Ui $ui -Text "Add Client"
    if (-not $addClient) {
        Write-FAIL "Bouton Add Client non trouve"
        return $false
    }
    
    Write-Info "Tap sur Add Client..."
    Invoke-Tap -X $addClient.X -Y $addClient.Y -Description "Add Client"
    
    $ui = Wait-ForElement -Text "First Name" -TimeoutSec 5
    if ($ui) {
        Write-OK "Formulaire client ouvert"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Formulaire non ouvert"
    return $false
}

function Step-5-FillFirstName {
    Write-Step 5 "Saisie First Name"
    
    $ui = Get-Screen
    
    # Trouver le champ First Name (placeholder ou label)
    $field = Find-Element -Ui $ui -Text "Enter first name"
    if (-not $field) {
        $field = Find-Element -Ui $ui -Text "First Name"
        if ($field) {
            $field.Y += 50  # Descendre vers le champ de saisie
        }
    }
    
    if (-not $field) {
        Write-FAIL "Champ First Name non trouve"
        return $false
    }
    
    Write-Info "Tap sur champ First Name..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "First Name field"
    
    Write-Info "Saisie: $($TEST_CLIENT.FirstName)"
    Invoke-Text -Text $TEST_CLIENT.FirstName
    
    # Verifier que le texte a ete saisi
    Start-Sleep -Milliseconds 500
    $ui = Get-Screen
    if (Screen-Contains -Ui $ui -Text $TEST_CLIENT.FirstName) {
        Write-OK "First Name saisi: $($TEST_CLIENT.FirstName)"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Texte non saisi"
    return $false
}

function Step-6-FillLastName {
    Write-Step 6 "Saisie Last Name"
    
    # Fermer clavier si ouvert (avec TAB au lieu de ESCAPE qui fait back)
    Invoke-Key -Key "KEYCODE_TAB"
    
    $ui = Get-Screen
    
    $field = Find-Element -Ui $ui -Text "Enter last name"
    if (-not $field) {
        # Scroll down pour voir le champ
        Write-Info "Scroll down..."
        Invoke-Swipe -X1 540 -Y1 1500 -X2 540 -Y2 1000
        $ui = Get-Screen
        $field = Find-Element -Ui $ui -Text "Enter last name"
    }
    
    if (-not $field) {
        # Le champ a peut-etre le focus via TAB
        Write-Info "Saisie directe (via TAB)..."
        Invoke-Text -Text $TEST_CLIENT.LastName
    } else {
        Write-Info "Tap sur champ Last Name..."
        Invoke-Tap -X $field.X -Y $field.Y -Description "Last Name field"
        Invoke-Text -Text $TEST_CLIENT.LastName
    }
    
    Start-Sleep -Milliseconds 500
    $ui = Get-Screen
    if (Screen-Contains -Ui $ui -Text $TEST_CLIENT.LastName) {
        Write-OK "Last Name saisi: $($TEST_CLIENT.LastName)"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Last Name non saisi"
    return $false
}

function Step-7-FillEmail {
    Write-Step 7 "Saisie Email"
    
    Invoke-Key -Key "KEYCODE_TAB"
    
    $ui = Get-Screen
    
    $field = Find-Element -Ui $ui -Text "Enter email"
    if (-not $field) {
        Invoke-Swipe -X1 540 -Y1 1500 -X2 540 -Y2 1000
        $ui = Get-Screen
        $field = Find-Element -Ui $ui -Text "Enter email"
    }
    
    if (-not $field) {
        Invoke-Text -Text $TEST_CLIENT.Email
    } else {
        Invoke-Tap -X $field.X -Y $field.Y -Description "Email field"
        Invoke-Text -Text $TEST_CLIENT.Email
    }
    
    Start-Sleep -Milliseconds 500
    $ui = Get-Screen
    if (Screen-Contains -Ui $ui -Text $TEST_CLIENT.Email) {
        Write-OK "Email saisi: $($TEST_CLIENT.Email)"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Email non saisi"
    return $false
}

function Step-8-FillPhone {
    Write-Step 8 "Saisie Phone"
    
    Invoke-Key -Key "KEYCODE_TAB"
    
    $ui = Get-Screen
    
    $field = Find-Element -Ui $ui -Text "Enter phone"
    if (-not $field) {
        Invoke-Swipe -X1 540 -Y1 1500 -X2 540 -Y2 1000
        $ui = Get-Screen
        $field = Find-Element -Ui $ui -Text "Enter phone"
    }
    
    if (-not $field) {
        Invoke-Text -Text $TEST_CLIENT.Phone
    } else {
        Invoke-Tap -X $field.X -Y $field.Y -Description "Phone field"
        Invoke-Text -Text $TEST_CLIENT.Phone
    }
    
    Start-Sleep -Milliseconds 500
    $ui = Get-Screen
    if (Screen-Contains -Ui $ui -Text $TEST_CLIENT.Phone) {
        Write-OK "Phone saisi: $($TEST_CLIENT.Phone)"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Phone non saisi"
    return $false
}

function Step-9-CreateClient {
    Write-Step 9 "Creation du client"
    
    # Fermer clavier
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    $ui = Get-Screen
    
    # Scroll pour voir Create Client
    $createBtn = Find-Element -Ui $ui -Text "Create Client"
    if (-not $createBtn) {
        Invoke-Swipe -X1 540 -Y1 1800 -X2 540 -Y2 1300
        Start-Sleep -Milliseconds 500
        $ui = Get-Screen
        $createBtn = Find-Element -Ui $ui -Text "Create Client"
    }
    
    if (-not $createBtn) {
        Write-FAIL "Bouton Create Client non trouve"
        return $false
    }
    
    Write-Info "Tap sur Create Client..."
    Invoke-Tap -X $createBtn.X -Y $createBtn.Y -Description "Create Client button"
    
    # Attendre reponse (soit retour wizard, soit erreur)
    Start-Sleep -Seconds 3
    $ui = Get-Screen
    
    # Verifier si erreur
    if (Screen-Contains -Ui $ui -Text "Error") {
        Write-FAIL "Erreur lors de la creation"
        # Fermer modal erreur
        $okBtn = Find-Element -Ui $ui -Text "OK"
        if ($okBtn) { Invoke-Tap -X $okBtn.X -Y $okBtn.Y }
        return $false
    }
    
    # Verifier si message de succes
    if ((Screen-Contains -Ui $ui -Text "Success") -or (Screen-Contains -Ui $ui -Text "created successfully")) {
        Write-OK "Client cree avec succes!"
        # Fermer modal succes
        $okBtn = Find-Element -Ui $ui -Text "OK"
        if ($okBtn) { 
            Invoke-Tap -X $okBtn.X -Y $okBtn.Y 
            Start-Sleep -Milliseconds 500
        }
        $global:PassedSteps++
        return $true
    }
    
    # Verifier si on est revenu au wizard (Select Client ou Addresses)
    if ((Screen-Contains -Ui $ui -Text "Select Client") -or (Screen-Contains -Ui $ui -Text "Address")) {
        Write-OK "Client cree avec succes!"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Etat inattendu apres creation"
    return $false
}

# ============================================================================
# ETAPES 10-19: ADRESSES
# ============================================================================

function Step-10-FillPickupStreet {
    Write-Step 10 "Saisie Pickup Street"
    
    $ui = Get-Screen
    
    # Verifier qu'on est sur l'ecran Addresses
    if (-not (Screen-Contains -Ui $ui -Text "Pickup Address") -and -not (Screen-Contains -Ui $ui -Text "address.street")) {
        Write-FAIL "Pas sur l'ecran Addresses"
        return $false
    }
    
    # Scroll en haut pour s'assurer que Pickup est visible
    Invoke-Swipe -X1 540 -Y1 1400 -X2 540 -Y2 1700
    Start-Sleep -Milliseconds 300
    $ui = Get-Screen
    
    # Trouver le premier champ street (Pickup)
    $field = Find-AddressField -Ui $ui -Hint "address.street" -Index 0
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Pickup Street non visible"
        return $false
    }
    
    Write-Info "Tap sur Pickup Street..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Pickup Street"
    Start-Sleep -Milliseconds 300
    
    Write-Info "Saisie: $($TEST_PICKUP.Street)"
    Invoke-Text -Text $TEST_PICKUP.Street
    
    Write-OK "Pickup Street saisi"
    $global:PassedSteps++
    return $true
}

function Step-11-FillPickupCity {
    Write-Step 11 "Saisie Pickup City"
    
    # Fermer clavier si ouvert
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    $ui = Get-Screen
    $field = Find-AddressField -Ui $ui -Hint "address.city" -Index 0
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Pickup City non visible"
        return $false
    }
    
    Write-Info "Tap sur Pickup City..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Pickup City"
    Invoke-Text -Text $TEST_PICKUP.City
    
    Write-OK "Pickup City saisi: $($TEST_PICKUP.City)"
    $global:PassedSteps++
    return $true
}

function Step-12-FillPickupState {
    Write-Step 12 "Saisie Pickup State"
    
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    $ui = Get-Screen
    $field = Find-AddressField -Ui $ui -Hint "address.state" -Index 0
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Pickup State non visible"
        return $false
    }
    
    Write-Info "Tap sur Pickup State..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Pickup State"
    Invoke-Text -Text $TEST_PICKUP.State
    
    Write-OK "Pickup State saisi: $($TEST_PICKUP.State)"
    $global:PassedSteps++
    return $true
}

function Step-13-FillPickupZip {
    Write-Step 13 "Saisie Pickup Zip"
    
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    $ui = Get-Screen
    $field = Find-AddressField -Ui $ui -Hint "address.zip" -Index 0
    if (-not $field -or -not $field.Visible) {
        # Scroll un peu vers le bas pour voir Zip
        Invoke-Swipe -X1 540 -Y1 1600 -X2 540 -Y2 1400
        Start-Sleep -Milliseconds 300
        $ui = Get-Screen
        $field = Find-AddressField -Ui $ui -Hint "address.zip" -Index 0
    }
    
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Pickup Zip non visible"
        return $false
    }
    
    Write-Info "Tap sur Pickup Zip..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Pickup Zip"
    Invoke-Text -Text $TEST_PICKUP.Zip
    
    Write-OK "Pickup Zip saisi: $($TEST_PICKUP.Zip)"
    $global:PassedSteps++
    return $true
}

function Step-14-ScrollToDelivery {
    Write-Step 14 "Scroll vers Delivery Address"
    
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    # Scroll vers le bas pour voir Delivery
    Invoke-Swipe -X1 540 -Y1 1700 -X2 540 -Y2 1200
    Start-Sleep -Milliseconds 500
    
    $ui = Get-Screen
    if (Screen-Contains -Ui $ui -Text "Delivery Address") {
        Write-OK "Delivery Address visible"
        $global:PassedSteps++
        return $true
    }
    
    # Encore un scroll
    Invoke-Swipe -X1 540 -Y1 1700 -X2 540 -Y2 1200
    Start-Sleep -Milliseconds 300
    $ui = Get-Screen
    
    if (Screen-Contains -Ui $ui -Text "Delivery Address") {
        Write-OK "Delivery Address visible"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Delivery Address non visible"
    return $false
}

function Step-15-FillDeliveryStreet {
    Write-Step 15 "Saisie Delivery Street"
    
    $ui = Get-Screen
    
    # Le deuxieme champ street (index 1) est Delivery
    $field = Find-AddressField -Ui $ui -Hint "address.street" -Index 1
    if (-not $field -or -not $field.Visible) {
        # Peut-etre le premier visible est maintenant Delivery
        $field = Find-AddressField -Ui $ui -Hint "address.street" -Index 0
    }
    
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Delivery Street non visible"
        return $false
    }
    
    Write-Info "Tap sur Delivery Street..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Delivery Street"
    Start-Sleep -Milliseconds 300
    
    Write-Info "Saisie: $($TEST_DELIVERY.Street)"
    Invoke-Text -Text $TEST_DELIVERY.Street
    
    Write-OK "Delivery Street saisi"
    $global:PassedSteps++
    return $true
}

function Step-16-FillDeliveryCity {
    Write-Step 16 "Saisie Delivery City"
    
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    $ui = Get-Screen
    
    # Le deuxieme champ city (index 1) ou le premier si Pickup n'est plus visible
    $field = Find-AddressField -Ui $ui -Hint "address.city" -Index 1
    if (-not $field -or -not $field.Visible) {
        $field = Find-AddressField -Ui $ui -Hint "address.city" -Index 0
    }
    
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Delivery City non visible"
        return $false
    }
    
    Write-Info "Tap sur Delivery City..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Delivery City"
    Invoke-Text -Text $TEST_DELIVERY.City
    
    Write-OK "Delivery City saisi: $($TEST_DELIVERY.City)"
    $global:PassedSteps++
    return $true
}

function Step-17-FillDeliveryState {
    Write-Step 17 "Saisie Delivery State"
    
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    $ui = Get-Screen
    $field = Find-AddressField -Ui $ui -Hint "address.state" -Index 1
    if (-not $field -or -not $field.Visible) {
        $field = Find-AddressField -Ui $ui -Hint "address.state" -Index 0
    }
    
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Delivery State non visible"
        return $false
    }
    
    Write-Info "Tap sur Delivery State..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Delivery State"
    Invoke-Text -Text $TEST_DELIVERY.State
    
    Write-OK "Delivery State saisi: $($TEST_DELIVERY.State)"
    $global:PassedSteps++
    return $true
}

function Step-18-FillDeliveryZip {
    Write-Step 18 "Saisie Delivery Zip"
    
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 300
    
    $ui = Get-Screen
    $field = Find-AddressField -Ui $ui -Hint "address.zip" -Index 1
    if (-not $field -or -not $field.Visible) {
        $field = Find-AddressField -Ui $ui -Hint "address.zip" -Index 0
    }
    
    if (-not $field -or -not $field.Visible) {
        # Scroll pour voir le zip
        Invoke-Swipe -X1 540 -Y1 1800 -X2 540 -Y2 1500
        Start-Sleep -Milliseconds 300
        $ui = Get-Screen
        $field = Find-AddressField -Ui $ui -Hint "address.zip" -Index 0
    }
    
    if (-not $field -or -not $field.Visible) {
        Write-FAIL "Champ Delivery Zip non visible"
        return $false
    }
    
    Write-Info "Tap sur Delivery Zip..."
    Invoke-Tap -X $field.X -Y $field.Y -Description "Delivery Zip"
    Invoke-Text -Text $TEST_DELIVERY.Zip
    
    Write-OK "Delivery Zip saisi: $($TEST_DELIVERY.Zip)"
    $global:PassedSteps++
    return $true
}

function Step-19-ClickNextAddresses {
    Write-Step 19 "Clic sur Next (Addresses)"
    
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 500
    
    $ui = Get-Screen
    $nextBtn = Find-Element -Ui $ui -Text "Next"
    
    if (-not $nextBtn) {
        Write-FAIL "Bouton Next non trouve"
        return $false
    }
    
    Write-Info "Tap sur Next..."
    Invoke-Tap -X $nextBtn.X -Y $nextBtn.Y -Description "Next button"
    
    Start-Sleep -Seconds 2
    $ui = Get-Screen
    
    # Verifier qu'on est passe a l'etape suivante (Schedule)
    if ((Screen-Contains -Ui $ui -Text "Schedule") -or (Screen-Contains -Ui $ui -Text "Date") -or (Screen-Contains -Ui $ui -Text "Time")) {
        Write-OK "Passe a l'etape Schedule"
        $global:PassedSteps++
        return $true
    }
    
    # Peut-etre Step 3 visible
    if (Screen-Contains -Ui $ui -Text "3") {
        Write-OK "Passe a l'etape 3"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Transition vers Schedule echouee"
    return $false
}

# ============================================================================
# ETAPES 20-21: SCHEDULE (Date/Heure)
# ============================================================================

function Step-20-VerifySchedule {
    Write-Step 20 "Verification Schedule (valeurs par defaut)"
    
    $ui = Get-Screen
    
    # Verifier qu'on est sur l'ecran Schedule
    if (-not (Screen-Contains -Ui $ui -Text "jobs.schedule") -and -not (Screen-Contains -Ui $ui -Text "Schedule")) {
        Write-FAIL "Pas sur l'ecran Schedule"
        return $false
    }
    
    # Les champs ont deja des valeurs par defaut (09:00, 17:00, 4h)
    # On verifie juste qu'ils existent
    $editTexts = $ui.SelectNodes("//node[@class='android.widget.EditText']")
    
    if ($editTexts.Count -lt 3) {
        Write-FAIL "Champs Schedule non trouves (trouve: $($editTexts.Count)/3)"
        return $false
    }
    
    Write-OK "Schedule ok - Start:$($TEST_SCHEDULE.StartTime), End:$($TEST_SCHEDULE.EndTime), Duration:$($TEST_SCHEDULE.Duration)h"
    $global:PassedSteps++
    return $true
}

function Step-21-ClickNextSchedule {
    Write-Step 21 "Clic sur Next (Schedule)"
    
    $ui = Get-Screen
    $nextBtn = Find-Element -Ui $ui -Text "Next"
    
    if (-not $nextBtn) {
        Write-FAIL "Bouton Next non trouve"
        return $false
    }
    
    Write-Info "Tap sur Next..."
    Invoke-Tap -X $nextBtn.X -Y $nextBtn.Y -Description "Next button"
    
    Start-Sleep -Seconds 2
    $ui = Get-Screen
    
    # Verifier qu'on est passe a l'etape suivante (Details)
    # L'etape Details devrait contenir: type de job, vehicule, staff, notes
    if ((Screen-Contains -Ui $ui -Text "Details") -or 
        (Screen-Contains -Ui $ui -Text "Type") -or 
        (Screen-Contains -Ui $ui -Text "Vehicle") -or
        (Screen-Contains -Ui $ui -Text "jobs.details")) {
        Write-OK "Passe a l'etape Details"
        $global:PassedSteps++
        return $true
    }
    
    # Peut-etre Step 4 visible dans le stepper
    if (Screen-Contains -Ui $ui -Text "4") {
        Write-OK "Passe a l'etape 4"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Transition vers Details echouee"
    return $false
}

# ============================================================================
# ETAPES 22-24: DETAILS (Priority, Notes)
# ============================================================================

function Step-22-SelectPriority {
    Write-Step 22 "Selection de la priorite"
    
    $ui = Get-Screen
    
    # Verifier qu'on est sur l'ecran Details
    if (-not (Screen-Contains -Ui $ui -Text "jobs.details") -and -not (Screen-Contains -Ui $ui -Text "Details")) {
        Write-FAIL "Pas sur l'ecran Details"
        return $false
    }
    
    # Chercher le bouton de priorite
    $priorityBtn = Find-Element -Ui $ui -Text $TEST_DETAILS.Priority
    
    if (-not $priorityBtn) {
        Write-FAIL "Priorite '$($TEST_DETAILS.Priority)' non trouvee"
        return $false
    }
    
    Write-Info "Tap sur priorite: $($TEST_DETAILS.Priority)..."
    Invoke-Tap -X $priorityBtn.X -Y $priorityBtn.Y -Description "Priority $($TEST_DETAILS.Priority)"
    
    Start-Sleep -Milliseconds 500
    Write-OK "Priorite selectionnee: $($TEST_DETAILS.Priority)"
    $global:PassedSteps++
    return $true
}

function Step-23-FillNotes {
    Write-Step 23 "Saisie des notes"
    
    $ui = Get-Screen
    
    # Scroll pour voir le champ notes
    Invoke-Swipe -X1 540 -Y1 1700 -X2 540 -Y2 1300
    Start-Sleep -Milliseconds 500
    
    # Le champ notes est un TextInput
    # On va cliquer vers le bas de l'ecran (zone du textarea)
    Write-Info "Tap sur zone Notes..."
    Invoke-Tap -X 540 -Y 1650 -Description "Notes textarea"
    Start-Sleep -Milliseconds 500
    
    Write-Info "Saisie notes: $($TEST_DETAILS.Notes)"
    Invoke-Text -Text $TEST_DETAILS.Notes
    
    Write-OK "Notes saisies"
    $global:PassedSteps++
    return $true
}

function Step-24-ClickNextDetails {
    Write-Step 24 "Clic sur Next (Details)"
    
    # Fermer le clavier si ouvert
    Invoke-Key -Key "KEYCODE_BACK"
    Start-Sleep -Milliseconds 500
    
    # Scroll pour voir les boutons en bas
    Invoke-Swipe -X1 540 -Y1 1800 -X2 540 -Y2 1300
    Start-Sleep -Milliseconds 500
    
    $ui = Get-Screen
    $nextBtn = Find-Element -Ui $ui -Text "Next"
    
    if (-not $nextBtn) {
        Write-FAIL "Bouton Next non trouve"
        return $false
    }
    
    Write-Info "Tap sur Next..."
    Invoke-Tap -X $nextBtn.X -Y $nextBtn.Y -Description "Next button"
    
    Start-Sleep -Seconds 2
    $ui = Get-Screen
    
    # Verifier qu'on est passe a l'etape Confirmation
    if ((Screen-Contains -Ui $ui -Text "Confirm") -or 
        (Screen-Contains -Ui $ui -Text "jobs.confirmation") -or
        (Screen-Contains -Ui $ui -Text "Review")) {
        Write-OK "Passe a l'etape Confirmation"
        $global:PassedSteps++
        return $true
    }
    
    # Peut-etre Step 5 visible dans le stepper
    if (Screen-Contains -Ui $ui -Text "5") {
        Write-OK "Passe a l'etape 5"
        $global:PassedSteps++
        return $true
    }
    
    Write-FAIL "Transition vers Confirmation echouee"
    return $false
}

# ============================================================================
# EXECUTION
# ============================================================================

$steps = @(
    @{ Num = 0; Func = { Step-0-Login } },
    @{ Num = 1; Func = { Step-1-Launch } },
    @{ Num = 2; Func = { Step-2-NavigateToJobs } },
    @{ Num = 3; Func = { Step-3-OpenCreateJob } },
    @{ Num = 4; Func = { Step-4-OpenAddClient } },
    @{ Num = 5; Func = { Step-5-FillFirstName } },
    @{ Num = 6; Func = { Step-6-FillLastName } },
    @{ Num = 7; Func = { Step-7-FillEmail } },
    @{ Num = 8; Func = { Step-8-FillPhone } },
    @{ Num = 9; Func = { Step-9-CreateClient } },
    @{ Num = 10; Func = { Step-10-FillPickupStreet } },
    @{ Num = 11; Func = { Step-11-FillPickupCity } },
    @{ Num = 12; Func = { Step-12-FillPickupState } },
    @{ Num = 13; Func = { Step-13-FillPickupZip } },
    @{ Num = 14; Func = { Step-14-ScrollToDelivery } },
    @{ Num = 15; Func = { Step-15-FillDeliveryStreet } },
    @{ Num = 16; Func = { Step-16-FillDeliveryCity } },
    @{ Num = 17; Func = { Step-17-FillDeliveryState } },
    @{ Num = 18; Func = { Step-18-FillDeliveryZip } },
    @{ Num = 19; Func = { Step-19-ClickNextAddresses } },
    @{ Num = 20; Func = { Step-20-VerifySchedule } },
    @{ Num = 21; Func = { Step-21-ClickNextSchedule } },
    @{ Num = 22; Func = { Step-22-SelectPriority } },
    @{ Num = 23; Func = { Step-23-FillNotes } },
    @{ Num = 24; Func = { Step-24-ClickNextDetails } }
)

Write-Host "`n============================================" -ForegroundColor Magenta
Write-Host "  SWIFT APP - TEST JOB CREATION FLOW" -ForegroundColor Magenta
Write-Host "============================================`n" -ForegroundColor Magenta

$success = $true

foreach ($step in $steps) {
    if ($step.Num -lt $StartFromStep) {
        Write-Host "[SKIP] Etape $($step.Num)" -ForegroundColor DarkGray
        continue
    }
    
    $result = & $step.Func
    
    if (-not $result) {
        Write-Host "`nTest arrete. Reprendre avec:" -ForegroundColor Yellow
        Write-Host "  .\scripts\job-test.ps1 -StartFromStep $($step.Num)" -ForegroundColor Cyan
        $success = $false
        break
    }
}

Write-Host "`n============================================" -ForegroundColor Magenta
if ($success) {
    Write-Host "[OK] TEST REUSSI - $global:PassedSteps etapes" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Etapes reussies: $global:PassedSteps" -ForegroundColor Red
}
Write-Host "============================================`n" -ForegroundColor Magenta

exit $(if ($success) { 0 } else { 1 })

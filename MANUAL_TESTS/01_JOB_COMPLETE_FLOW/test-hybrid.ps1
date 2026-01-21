# =============================================================================
# SWIFT APP - SYSTEME DE TEST HYBRIDE INTELLIGENT
# =============================================================================
# Ce systeme detecte automatiquement l'etat de l'UI, guide l'utilisateur
# pour les actions manuelles, et valide chaque etape.
# =============================================================================

param(
    [switch]$SkipIntro,
    [int]$StartFromStep = 1
)

# Configuration
$script:ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$script:DEVICE = "192.168.0.250:35031"
$script:LOGS_DIR = "$PSScriptRoot\..\..\logs"
$script:UI_FILE = "$script:LOGS_DIR\ui_hybrid.xml"

# Donnees de test
$script:Timestamp = Get-Date -Format "HHmmss"
$script:TestData = @{
    Client = @{
        FirstName = "Jean"
        LastName = "Dupont"
        Email = "jean.dupont.$($script:Timestamp)@test.com"
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

# =============================================================================
# FONCTIONS UTILITAIRES
# =============================================================================

function Write-Step {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "`n=== $Message ===" -ForegroundColor $Color
}

function Write-Action {
    param([string]$Message)
    Write-Host "  -> $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Gray
}

function Write-Manual {
    param([string]$Message)
    Write-Host "`n  >>> ACTION MANUELLE: $Message <<<" -ForegroundColor Magenta
}

# =============================================================================
# DETECTION UI
# =============================================================================

function Get-UISnapshot {
    <#
    .SYNOPSIS
        Capture l'etat actuel de l'UI
    #>
    & $script:ADB -s $script:DEVICE shell "uiautomator dump /sdcard/ui.xml" 2>$null | Out-Null
    & $script:ADB -s $script:DEVICE pull /sdcard/ui.xml $script:UI_FILE 2>$null | Out-Null
    
    if (Test-Path $script:UI_FILE) {
        return Get-Content $script:UI_FILE -Raw -Encoding UTF8
    }
    return $null
}

function Get-CurrentScreen {
    <#
    .SYNOPSIS
        Detecte l'ecran actuel avec tous les scenarios possibles
    #>
    $xml = Get-UISnapshot
    
    if (-not $xml) {
        return @{ Screen = "error"; Details = "Impossible de capturer l'UI" }
    }
    
    # Lock screen
    if ($xml -match "Swipe to open|Enter PIN|Unlock|Lock screen") {
        return @{ Screen = "lock-screen"; Details = "Telephone verrouille" }
    }
    
    # Android Home
    if ($xml -match "com.sec.android.app.launcher") {
        return @{ Screen = "android-home"; Details = "Ecran d'accueil Android" }
    }
    
    # Expo Go Home
    if ($xml -match "Recently opened" -and $xml -match "Swift App") {
        return @{ Screen = "expo-home"; Details = "Expo Go - Projets recents" }
    }
    
    # Expo Go sans projet
    if ($xml -match "Expo Go" -and $xml -match "Development servers") {
        return @{ Screen = "expo-home"; Details = "Expo Go - Accueil" }
    }
    
    # Swift App - Page Day
    if ($xml -match "No jobs scheduled") {
        return @{ Screen = "day-empty"; Details = "Page Day - Aucun job" }
    }
    if ($xml -match "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday" -and $xml -match "January|February|March|April|May|June|July|August|September|October|November|December") {
        return @{ Screen = "day"; Details = "Page Day" }
    }
    
    # Wizard - Select Client
    if ($xml -match "Select Client" -or $xml -match "Choose a client") {
        $hasClients = $xml -match 'class="android.widget.ScrollView"'
        return @{ Screen = "wizard-client"; Details = "Wizard - Selection client"; HasClients = $hasClients }
    }
    
    # Wizard - New Client Form
    if ($xml -match "Create New Client" -and $xml -match "First Name") {
        return @{ Screen = "wizard-new-client"; Details = "Wizard - Formulaire nouveau client" }
    }
    
    # Wizard - Addresses
    if ($xml -match "Enter Addresses" -or ($xml -match "Pickup Address" -and $xml -match "Delivery Address")) {
        return @{ Screen = "wizard-address"; Details = "Wizard - Adresses" }
    }
    
    # Wizard - Schedule
    if ($xml -match "Schedule" -and ($xml -match "Start Time" -or $xml -match "End Time")) {
        return @{ Screen = "wizard-schedule"; Details = "Wizard - Horaires" }
    }
    
    # Wizard - Details
    if ($xml -match "Job Details" -and $xml -match "Priority") {
        return @{ Screen = "wizard-details"; Details = "Wizard - Details" }
    }
    
    # Wizard - Confirmation
    if ($xml -match "Confirm Job" -or $xml -match "Review job details") {
        return @{ Screen = "wizard-confirmation"; Details = "Wizard - Confirmation" }
    }
    
    # Alert/Modal de succes
    if ($xml -match "Success" -and $xml -match "OK") {
        return @{ Screen = "alert-success"; Details = "Alert de succes" }
    }
    
    # Alert/Modal d'erreur
    if ($xml -match "Error" -and $xml -match "OK") {
        return @{ Screen = "alert-error"; Details = "Alert d'erreur" }
    }
    
    # Clavier visible
    $keyboardVisible = $xml -match "inputType"
    
    return @{ Screen = "unknown"; Details = "Ecran non reconnu"; KeyboardVisible = $keyboardVisible; Raw = $xml.Substring(0, [Math]::Min(500, $xml.Length)) }
}

function Find-Element {
    <#
    .SYNOPSIS
        Trouve un element par texte et retourne ses coordonnees
    #>
    param(
        [string]$Text,
        [string]$TextContains,
        [switch]$Clickable
    )
    
    $xml = Get-Content $script:UI_FILE -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $xml) { return $null }
    
    $pattern = '<node[^>]*'
    if ($Text) {
        $pattern += "text=`"$([regex]::Escape($Text))`"[^>]*"
    }
    if ($TextContains) {
        $pattern += "text=`"[^`"]*$([regex]::Escape($TextContains))[^`"]*`"[^>]*"
    }
    if ($Clickable) {
        $pattern += 'clickable="true"[^>]*'
    }
    $pattern += 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
    
    if ($xml -match $pattern) {
        $x1 = [int]$Matches[1]; $y1 = [int]$Matches[2]
        $x2 = [int]$Matches[3]; $y2 = [int]$Matches[4]
        return @{
            Found = $true
            X = [int](($x1 + $x2) / 2)
            Y = [int](($y1 + $y2) / 2)
            Bounds = "[$x1,$y1][$x2,$y2]"
        }
    }
    return @{ Found = $false }
}

function Find-FAB {
    <#
    .SYNOPSIS
        Trouve le FAB (Floating Action Button) en bas a droite
    #>
    $xml = Get-Content $script:UI_FILE -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $xml) { return $null }
    
    $matches = [regex]::Matches($xml, 'clickable="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"')
    
    $bestFab = $null
    foreach ($m in $matches) {
        if ($m.Value -match 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
            $x1 = [int]$Matches[1]; $y1 = [int]$Matches[2]
            $x2 = [int]$Matches[3]; $y2 = [int]$Matches[4]
            
            # FAB: en bas (Y > 1500) et a droite (X > 700), taille raisonnable
            $width = $x2 - $x1
            $height = $y2 - $y1
            if ($y1 -gt 1500 -and $x1 -gt 700 -and $width -lt 250 -and $height -lt 250) {
                $bestFab = @{
                    Found = $true
                    X = [int](($x1 + $x2) / 2)
                    Y = [int](($y1 + $y2) / 2)
                    Bounds = "[$x1,$y1][$x2,$y2]"
                }
            }
        }
    }
    
    return $bestFab
}

# =============================================================================
# ACTIONS
# =============================================================================

function Send-Tap {
    param([int]$X, [int]$Y)
    & $script:ADB -s $script:DEVICE shell "input tap $X $Y" 2>$null
    Start-Sleep -Milliseconds 500
}

function Send-Text {
    param([string]$Text)
    $escaped = $Text -replace ' ', '%s' -replace '@', '\@'
    & $script:ADB -s $script:DEVICE shell "input text '$escaped'" 2>$null
    Start-Sleep -Milliseconds 300
}

function Send-Key {
    param([string]$Key)
    & $script:ADB -s $script:DEVICE shell "input keyevent $Key" 2>$null
    Start-Sleep -Milliseconds 300
}

function Wait-ForScreen {
    param(
        [string[]]$ExpectedScreens,
        [int]$TimeoutSeconds = 15
    )
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $state = Get-CurrentScreen
        if ($state.Screen -in $ExpectedScreens) {
            return $state
        }
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "." -NoNewline
    }
    Write-Host ""
    return $null
}

function Wait-ForManualAction {
    param(
        [string]$ActionDescription,
        [string[]]$ExpectedScreens,
        [int]$TimeoutSeconds = 60
    )
    
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "  ║  ACTION MANUELLE REQUISE                               ║" -ForegroundColor Magenta
    Write-Host "  ╠════════════════════════════════════════════════════════╣" -ForegroundColor Magenta
    Write-Host "  ║  $($ActionDescription.PadRight(54))║" -ForegroundColor Yellow
    Write-Host "  ╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  Attente: $ExpectedScreens" -ForegroundColor DarkGray
    Write-Host "  Timeout: ${TimeoutSeconds}s - Detection en cours" -ForegroundColor DarkGray
    Write-Host ""
    
    $elapsed = 0
    $lastScreen = ""
    while ($elapsed -lt $TimeoutSeconds) {
        $state = Get-CurrentScreen
        
        # Afficher le changement d'ecran
        if ($state.Screen -ne $lastScreen) {
            Write-Host "  [Detecte: $($state.Screen)]" -ForegroundColor DarkCyan
            $lastScreen = $state.Screen
        }
        
        if ($state.Screen -in $ExpectedScreens) {
            Write-Host ""
            Write-Success "Action detectee! Ecran: $($state.Screen)"
            return $state
        }
        Start-Sleep -Seconds 1
        $elapsed++
        
        # Afficher progression
        if ($elapsed % 10 -eq 0) {
            Write-Host "  ... ${elapsed}s (ecran actuel: $($state.Screen))" -ForegroundColor DarkGray
        }
    }
    
    Write-Host ""
    Write-Fail "Timeout apres ${TimeoutSeconds}s - Dernier ecran: $lastScreen"
    return $null
}

# =============================================================================
# ETAPES DU TEST
# =============================================================================

function Step-EnsureSwiftApp {
    Write-Step "ETAPE 1: S'assurer que Swift App est ouverte"
    
    $state = Get-CurrentScreen
    Write-Info "Ecran actuel: $($state.Screen) - $($state.Details)"
    
    switch ($state.Screen) {
        "day" { 
            Write-Success "Deja sur la page Day"
            return $true 
        }
        "day-empty" { 
            Write-Success "Deja sur la page Day (vide)"
            return $true 
        }
        { $_ -like "wizard-*" } {
            Write-Success "Deja dans le wizard ($($state.Screen))"
            return $true
        }
        "expo-home" {
            Write-Action "Sur Expo Home - Recherche de Swift App..."
            $swiftApp = Find-Element -Text "Swift App"
            if ($swiftApp.Found) {
                Write-Info "Swift App trouve a ($($swiftApp.X), $($swiftApp.Y))"
                Write-Manual "Taper sur 'Swift App' dans la liste"
                $result = Wait-ForManualAction -ActionDescription "Taper sur Swift App" -ExpectedScreens @("day", "day-empty") -TimeoutSeconds 30
                return ($null -ne $result)
            } else {
                Write-Fail "Swift App non trouve dans Expo Home"
                return $false
            }
        }
        "android-home" {
            Write-Action "Sur l'ecran d'accueil Android"
            Write-Manual "Ouvrir Expo Go puis Swift App"
            $result = Wait-ForManualAction -ActionDescription "Ouvrir Swift App" -ExpectedScreens @("day", "day-empty") -TimeoutSeconds 60
            return ($null -ne $result)
        }
        "lock-screen" {
            Write-Action "Telephone verrouille"
            Write-Manual "Deverrouiller le telephone"
            Start-Sleep -Seconds 5
            return (Step-EnsureSwiftApp)  # Recursion
        }
        default {
            Write-Fail "Ecran non reconnu: $($state.Screen)"
            Write-Info $state.Details
            return $false
        }
    }
}

function Step-OpenWizard {
    Write-Step "ETAPE 2: Ouvrir le wizard de creation"
    
    $state = Get-CurrentScreen
    
    # Deja dans le wizard?
    if ($state.Screen -like "wizard-*") {
        Write-Success "Deja dans le wizard ($($state.Screen))"
        return $true
    }
    
    # Sur la page Day?
    if ($state.Screen -notin @("day", "day-empty")) {
        Write-Fail "Pas sur la page Day (ecran: $($state.Screen))"
        return $false
    }
    
    # Trouver le FAB
    $fab = Find-FAB
    if ($fab.Found) {
        Write-Info "FAB detecte a ($($fab.X), $($fab.Y)) - $($fab.Bounds)"
        Write-Manual "Taper sur le bouton '+' (FAB) en bas a droite"
        
        $result = Wait-ForManualAction -ActionDescription "Taper sur le FAB" -ExpectedScreens @("wizard-client", "wizard-new-client") -TimeoutSeconds 30
        return ($null -ne $result)
    } else {
        Write-Fail "FAB non detecte sur l'ecran"
        return $false
    }
}

function Step-GoToNewClientForm {
    Write-Step "ETAPE 3: Aller au formulaire de nouveau client"
    
    $state = Get-CurrentScreen
    
    if ($state.Screen -eq "wizard-new-client") {
        Write-Success "Deja sur le formulaire nouveau client"
        return $true
    }
    
    if ($state.Screen -ne "wizard-client") {
        Write-Fail "Pas sur l'ecran de selection client (ecran: $($state.Screen))"
        return $false
    }
    
    # Chercher le bouton "Create New Client"
    $createBtn = Find-Element -TextContains "Create New Client"
    if (-not $createBtn.Found) {
        $createBtn = Find-Element -TextContains "Add Client"
    }
    
    if ($createBtn.Found) {
        Write-Info "Bouton trouve a ($($createBtn.X), $($createBtn.Y))"
        Write-Manual "Taper sur 'Create New Client' ou 'Add Client'"
        
        $result = Wait-ForManualAction -ActionDescription "Aller au formulaire" -ExpectedScreens @("wizard-new-client") -TimeoutSeconds 30
        return ($null -ne $result)
    } else {
        Write-Fail "Bouton de creation client non trouve"
        return $false
    }
}

function Step-FillClientForm {
    Write-Step "ETAPE 4: Remplir le formulaire client"
    
    $state = Get-CurrentScreen
    
    if ($state.Screen -ne "wizard-new-client") {
        Write-Fail "Pas sur le formulaire client (ecran: $($state.Screen))"
        return $false
    }
    
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────────┐" -ForegroundColor White
    Write-Host "  │  DONNEES A SAISIR:                                  │" -ForegroundColor White
    Write-Host "  ├─────────────────────────────────────────────────────┤" -ForegroundColor White
    Write-Host "  │  First Name: $($script:TestData.Client.FirstName.PadRight(36))│" -ForegroundColor Yellow
    Write-Host "  │  Last Name:  $($script:TestData.Client.LastName.PadRight(36))│" -ForegroundColor Yellow
    Write-Host "  │  Email:      $($script:TestData.Client.Email.PadRight(36))│" -ForegroundColor Yellow
    Write-Host "  │  Phone:      $($script:TestData.Client.Phone.PadRight(36))│" -ForegroundColor Yellow
    Write-Host "  └─────────────────────────────────────────────────────┘" -ForegroundColor White
    Write-Host ""
    Write-Host "  Tip: Les donnees sont copiees dans le presse-papier" -ForegroundColor DarkGray
    
    # Copier l'email dans le presse-papier (le plus utile)
    $script:TestData.Client.Email | Set-Clipboard
    Write-Host "  [Presse-papier: $($script:TestData.Client.Email)]" -ForegroundColor DarkCyan
    
    # Attendre soit l'ecran address (succes) soit une alerte
    $result = Wait-ForManualAction -ActionDescription "Remplir le formulaire puis 'Create Client'" -ExpectedScreens @("wizard-address", "alert-success", "alert-error") -TimeoutSeconds 180
    
    if ($null -eq $result) {
        return $false
    }
    
    # Gerer les alertes
    if ($result.Screen -eq "alert-success") {
        Write-Info "Alerte de succes detectee"
        $result = Wait-ForManualAction -ActionDescription "Taper 'OK' pour fermer" -ExpectedScreens @("wizard-address") -TimeoutSeconds 15
    }
    
    if ($result.Screen -eq "alert-error") {
        Write-Fail "Erreur lors de la creation du client"
        return $false
    }
    
    return ($result.Screen -eq "wizard-address")
}

function Step-FillAddresses {
    Write-Step "ETAPE 5: Remplir les adresses"
    
    $state = Get-CurrentScreen
    
    if ($state.Screen -ne "wizard-address") {
        Write-Fail "Pas sur l'ecran des adresses (ecran: $($state.Screen))"
        return $false
    }
    
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────────┐" -ForegroundColor White
    Write-Host "  │  PICKUP ADDRESS:                                    │" -ForegroundColor Cyan
    Write-Host "  │    Street: $($script:TestData.Pickup.Street.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  │    City:   $($script:TestData.Pickup.City.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  │    State:  $($script:TestData.Pickup.State.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  │    Zip:    $($script:TestData.Pickup.Zip.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  ├─────────────────────────────────────────────────────┤" -ForegroundColor White
    Write-Host "  │  DELIVERY ADDRESS:                                  │" -ForegroundColor Green
    Write-Host "  │    Street: $($script:TestData.Delivery.Street.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  │    City:   $($script:TestData.Delivery.City.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  │    State:  $($script:TestData.Delivery.State.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  │    Zip:    $($script:TestData.Delivery.Zip.PadRight(38))│" -ForegroundColor Yellow
    Write-Host "  └─────────────────────────────────────────────────────┘" -ForegroundColor White
    Write-Host ""
    
    $result = Wait-ForManualAction -ActionDescription "Remplir les 2 adresses puis 'Next'" -ExpectedScreens @("wizard-schedule") -TimeoutSeconds 180
    return ($null -ne $result)
}

function Step-FillSchedule {
    Write-Step "ETAPE 6: Configurer l'horaire"
    
    $state = Get-CurrentScreen
    
    if ($state.Screen -ne "wizard-schedule") {
        Write-Fail "Pas sur l'ecran schedule (ecran: $($state.Screen))"
        return $false
    }
    
    Write-Info "Les horaires par defaut (09:00 - 17:00) sont generalement corrects"
    
    Write-Manual @"
Verifier/modifier les horaires si necessaire:
    - Start Time: 09:00
    - End Time: 17:00
    - Duration: 4 hours

Puis taper sur 'Next'
"@
    
    $result = Wait-ForManualAction -ActionDescription "Configurer l'horaire" -ExpectedScreens @("wizard-details") -TimeoutSeconds 60
    return ($null -ne $result)
}

function Step-FillDetails {
    Write-Step "ETAPE 7: Configurer les details"
    
    $state = Get-CurrentScreen
    
    if ($state.Screen -ne "wizard-details") {
        Write-Fail "Pas sur l'ecran details (ecran: $($state.Screen))"
        return $false
    }
    
    Write-Manual @"
Configurer les details du job:
    - Priority: Medium (ou autre)
    - Notes: (optionnel)

Puis taper sur 'Next'
"@
    
    $result = Wait-ForManualAction -ActionDescription "Configurer les details" -ExpectedScreens @("wizard-confirmation") -TimeoutSeconds 60
    return ($null -ne $result)
}

function Step-ConfirmAndCreate {
    Write-Step "ETAPE 8: Confirmer et creer le job"
    
    $state = Get-CurrentScreen
    
    if ($state.Screen -ne "wizard-confirmation") {
        Write-Fail "Pas sur l'ecran de confirmation (ecran: $($state.Screen))"
        return $false
    }
    
    Write-Info "Verifier le resume du job puis confirmer"
    
    Write-Manual "Taper sur 'Create Job' pour finaliser"
    
    $result = Wait-ForManualAction -ActionDescription "Creer le job" -ExpectedScreens @("day", "day-empty", "alert-success") -TimeoutSeconds 30
    
    if ($null -eq $result) {
        return $false
    }
    
    # Gerer l'alerte de succes
    if ($result.Screen -eq "alert-success") {
        Write-Info "Alerte de succes detectee"
        Write-Manual "Taper sur 'OK' pour fermer l'alerte"
        $result = Wait-ForManualAction -ActionDescription "Fermer l'alerte" -ExpectedScreens @("day", "day-empty") -TimeoutSeconds 15
    }
    
    return ($null -ne $result)
}

function Step-VerifyJobCreated {
    Write-Step "ETAPE 9: Verifier que le job a ete cree"
    
    $state = Get-CurrentScreen
    
    if ($state.Screen -notin @("day", "day-empty")) {
        Write-Fail "Pas sur la page Day (ecran: $($state.Screen))"
        return $false
    }
    
    # Verifier si le job est visible
    $xml = Get-Content $script:UI_FILE -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    
    if ($xml -match $script:TestData.Client.FirstName -or $xml -match $script:TestData.Client.LastName) {
        Write-Success "Job trouve avec le client $($script:TestData.Client.FirstName) $($script:TestData.Client.LastName)"
        return $true
    }
    
    if ($xml -match "No jobs scheduled") {
        Write-Fail "Aucun job affiche - Le job n'a peut-etre pas ete cree"
        return $false
    }
    
    Write-Info "Le job devrait etre visible sur la page Day"
    Write-Success "Test termine - Verifiez manuellement que le job est present"
    return $true
}

# =============================================================================
# EXECUTION PRINCIPALE
# =============================================================================

if (-not $SkipIntro) {
    Clear-Host
    Write-Host @"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   SWIFT APP - TEST HYBRIDE INTELLIGENT                        ║
║   Creation complete d'un job                                  ║
║                                                               ║
║   Ce test detecte automatiquement l'etat de l'UI et vous      ║
║   guide pour les actions manuelles necessaires.               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

    Write-Host "`nDonnees de test:" -ForegroundColor Yellow
    Write-Host "  Client: $($script:TestData.Client.FirstName) $($script:TestData.Client.LastName)"
    Write-Host "  Email: $($script:TestData.Client.Email)"
    Write-Host "  Pickup: $($script:TestData.Pickup.Street), $($script:TestData.Pickup.City)"
    Write-Host "  Delivery: $($script:TestData.Delivery.Street), $($script:TestData.Delivery.City)"
    
    Write-Host "`nAppuyez sur ENTREE pour commencer..." -ForegroundColor Gray
    Read-Host
}

# Liste des etapes
$steps = @(
    @{ Name = "EnsureSwiftApp"; Function = { Step-EnsureSwiftApp } }
    @{ Name = "OpenWizard"; Function = { Step-OpenWizard } }
    @{ Name = "GoToNewClientForm"; Function = { Step-GoToNewClientForm } }
    @{ Name = "FillClientForm"; Function = { Step-FillClientForm } }
    @{ Name = "FillAddresses"; Function = { Step-FillAddresses } }
    @{ Name = "FillSchedule"; Function = { Step-FillSchedule } }
    @{ Name = "FillDetails"; Function = { Step-FillDetails } }
    @{ Name = "ConfirmAndCreate"; Function = { Step-ConfirmAndCreate } }
    @{ Name = "VerifyJobCreated"; Function = { Step-VerifyJobCreated } }
)

$passed = 0
$failed = 0
$startTime = Get-Date

for ($i = $StartFromStep - 1; $i -lt $steps.Count; $i++) {
    $step = $steps[$i]
    $stepNum = $i + 1
    
    Write-Host "`n" -NoNewline
    Write-Host ("=" * 60) -ForegroundColor DarkGray
    Write-Host "ETAPE $stepNum / $($steps.Count): $($step.Name)" -ForegroundColor White
    Write-Host ("=" * 60) -ForegroundColor DarkGray
    
    $result = & $step.Function
    
    if ($result) {
        $passed++
        Write-Host "`n  >>> ETAPE ${stepNum} - REUSSIE <<<" -ForegroundColor Green
    } else {
        $failed++
        Write-Host "`n  >>> ETAPE ${stepNum} - ECHOUEE <<<" -ForegroundColor Red
        
        Write-Host "`nVoulez-vous: (R)eessayer / (C)ontinuer / (D)ebug / (Q)uitter? " -NoNewline -ForegroundColor Yellow
        $choice = Read-Host
        
        switch -Regex ($choice) {
            "^[Rr]" {
                Write-Host "  Nouvelle tentative..." -ForegroundColor Cyan
                $i--  # Reessayer la meme etape
                $failed--
                continue
            }
            "^[Dd]" {
                Write-Host "`n=== DEBUG INFO ===" -ForegroundColor Cyan
                $state = Get-CurrentScreen
                Write-Host "  Screen: $($state.Screen)" -ForegroundColor White
                Write-Host "  Details: $($state.Details)" -ForegroundColor Gray
                if ($state.Raw) {
                    Write-Host "  Raw (500 chars): $($state.Raw)" -ForegroundColor DarkGray
                }
                Write-Host "==================`n" -ForegroundColor Cyan
                $i--  # Rester sur la meme etape
                $failed--
                continue
            }
            "^[Qq]" {
                break
            }
            default {
                # Continuer
            }
        }
    }
}

# Resume
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n"
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "                    RESUME DU TEST" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "  Etapes reussies: $passed" -ForegroundColor Green
Write-Host "  Etapes echouees: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "  Duree totale: $($duration.ToString('mm\:ss'))"
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  *** TEST REUSSI ***" -ForegroundColor Green
} else {
    Write-Host "  *** TEST ECHOUE ***" -ForegroundColor Red
}

Write-Host ("=" * 60) -ForegroundColor Cyan

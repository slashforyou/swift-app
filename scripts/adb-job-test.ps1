# Swift App - Script de Test Automatise ADB
# Ce script teste le flow complet de creation d'un job
# 
# Usage: .\scripts\adb-job-test.ps1 [-StartFromStep <number>] [-Port <port>]

param(
    [int]$StartFromStep = 1,
    [string]$Port = "36561",
    [string]$IP = "192.168.0.250",
    [switch]$DryRun,
    [switch]$Verbose
)

# Configuration
$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$DEVICE = "${IP}:${Port}"
$EXPO_URL = "exp://192.168.0.51:8081"
$LOGS_DIR = "logs"
$UI_DUMP_FILE = "/sdcard/ui.xml"

# Couleurs pour l'output
function Write-Step { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "-> $msg" -ForegroundColor Yellow }
function Write-Debug { param($msg) if ($Verbose) { Write-Host "  [DEBUG] $msg" -ForegroundColor DarkGray } }

# Compteur d'etapes reussies
$global:StepsPassed = 0
$global:CurrentStep = 0

# ============================================================================
# FONCTIONS UTILITAIRES ADB
# ============================================================================

function Test-AdbConnection {
    $result = & $ADB devices 2>&1
    return $result -match $DEVICE
}

function Connect-Adb {
    Write-Info "Connexion ADB a $DEVICE..."
    $result = & $ADB connect $DEVICE 2>&1
    if ($result -match "connected|already connected") {
        Write-Success "Connecte a $DEVICE"
        return $true
    }
    Write-Fail "Echec connexion: $result"
    return $false
}

function Get-UiDump {
    param([string]$LocalFile = "logs/ui_current.xml")
    
    & $ADB shell uiautomator dump $UI_DUMP_FILE 2>&1 | Out-Null
    & $ADB pull $UI_DUMP_FILE $LocalFile 2>&1 | Out-Null
    
    if (Test-Path $LocalFile) {
        return [xml](Get-Content $LocalFile -Raw)
    }
    return $null
}

function Get-ScreenTexts {
    param([xml]$Ui)
    $texts = @()
    $Ui.SelectNodes("//*[@text!='']") | ForEach-Object {
        $texts += @{
            text = $_.text
            bounds = $_.bounds
        }
    }
    return $texts
}

function Get-BoundsCenter {
    param([string]$Bounds)
    if ($Bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
        $x = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
        $y = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
        return @{ x = $x; y = $y }
    }
    return $null
}

function Invoke-Tap {
    param([int]$X, [int]$Y, [string]$Description = "")
    
    Write-Debug "Tap ($X, $Y) $Description"
    if (-not $DryRun) {
        & $ADB shell input tap $X $Y
    }
}

function Invoke-Swipe {
    param([int]$X1, [int]$Y1, [int]$X2, [int]$Y2, [int]$Duration = 300)
    
    Write-Debug "Swipe ($X1,$Y1) -> ($X2,$Y2)"
    if (-not $DryRun) {
        & $ADB shell input swipe $X1 $Y1 $X2 $Y2 $Duration
    }
}

function Invoke-KeyEvent {
    param([string]$Key)
    
    Write-Debug "KeyEvent: $Key"
    if (-not $DryRun) {
        & $ADB shell input keyevent $Key
    }
}

function Invoke-InputText {
    param(
        [string]$Text,
        [switch]$ClearFirst
    )
    
    Write-Debug "InputText: '$Text'"
    
    if ($DryRun) { return }
    
    if ($ClearFirst) {
        & $ADB shell input keyevent KEYCODE_MOVE_END
        1..50 | ForEach-Object {
            & $ADB shell input keyevent KEYCODE_DEL
        }
        Start-Sleep -Milliseconds 200
    }
    
    # Echapper les caracteres speciaux pour ADB shell
    $escapedText = $Text -replace '@', '\@' -replace ' ', '%s' -replace '\(', '\(' -replace '\)', '\)' -replace '&', '\&' -replace '<', '\<' -replace '>', '\>' -replace ';', '\;'
    
    & $ADB shell input text $escapedText
}

function Wait-ForScreen {
    param(
        [string]$ContainsText,
        [int]$TimeoutSeconds = 10,
        [int]$PollIntervalMs = 500
    )
    
    Write-Debug "Attente de '$ContainsText' (timeout: ${TimeoutSeconds}s)"
    
    $elapsed = 0
    while ($elapsed -lt ($TimeoutSeconds * 1000)) {
        $ui = Get-UiDump
        if ($ui) {
            $texts = Get-ScreenTexts -Ui $ui
            foreach ($t in $texts) {
                if ($t.text -like "*$ContainsText*") {
                    Write-Debug "Trouve: $($t.text)"
                    return $ui
                }
            }
        }
        Start-Sleep -Milliseconds $PollIntervalMs
        $elapsed += $PollIntervalMs
    }
    
    Write-Fail "Timeout: '$ContainsText' non trouve apres ${TimeoutSeconds}s"
    return $null
}

function Find-ElementByText {
    param(
        [xml]$Ui,
        [string]$Text,
        [switch]$Clickable
    )
    
    $xpath = if ($Clickable) {
        "//*[@clickable='true' and contains(@text, '$Text')]"
    } else {
        "//*[contains(@text, '$Text')]"
    }
    
    $node = $Ui.SelectSingleNode($xpath)
    if ($node) {
        return @{
            text = $node.text
            bounds = $node.bounds
            center = Get-BoundsCenter -Bounds $node.bounds
        }
    }
    
    $xpath2 = "//*[contains(@content-desc, '$Text')]"
    $node2 = $Ui.SelectSingleNode($xpath2)
    if ($node2) {
        return @{
            text = $node2.'content-desc'
            bounds = $node2.bounds
            center = Get-BoundsCenter -Bounds $node2.bounds
        }
    }
    
    return $null
}

function Find-ElementInBottomRight {
    param([xml]$Ui, [int]$MinY = 1800)
    
    $elements = $Ui.SelectNodes("//*[@clickable='true']")
    foreach ($el in $elements) {
        if ($el.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $y1 = [int]$Matches[2]
            $x1 = [int]$Matches[1]
            if ($y1 -gt $MinY -and $x1 -gt 700) {
                return @{
                    bounds = $el.bounds
                    center = Get-BoundsCenter -Bounds $el.bounds
                }
            }
        }
    }
    return $null
}

# ============================================================================
# ETAPES DE TEST
# ============================================================================

function Step-ConnectAndLaunch {
    $global:CurrentStep = 1
    Write-Step "ETAPE 1: Connexion ADB et lancement de l'app"
    
    if (-not (Test-AdbConnection)) {
        if (-not (Connect-Adb)) {
            return $false
        }
    } else {
        Write-Success "Deja connecte a $DEVICE"
    }
    
    # Deverrouiller l'ecran si necessaire
    Write-Info "Reveil de l'ecran..."
    & $ADB shell input keyevent KEYCODE_WAKEUP 2>&1 | Out-Null
    Start-Sleep -Milliseconds 500
    & $ADB shell input swipe 540 1800 540 500 300 2>&1 | Out-Null
    Start-Sleep -Milliseconds 500
    
    Write-Info "Lancement de Swift App via Expo..."
    & $ADB shell am start -a android.intent.action.VIEW -d $EXPO_URL 2>&1 | Out-Null
    
    # Attendre soit Home (Today) soit Jobs
    Start-Sleep -Seconds 3
    $ui = Get-UiDump
    
    if (-not $ui) {
        Write-Fail "Impossible de lire l'UI"
        return $false
    }
    
    # Verifier si on est sur Home ou Jobs
    $todayElement = Find-ElementByText -Ui $ui -Text "Today"
    $jobsElement = Find-ElementByText -Ui $ui -Text "Jobs"
    
    if ($todayElement -or $jobsElement) {
        Write-Success "App lancee - Ecran detecte"
        $global:StepsPassed++
        return $true
    }
    
    # Attendre encore un peu
    $ui = Wait-ForScreen -ContainsText "Today" -TimeoutSeconds 10
    if ($ui) {
        Write-Success "App lancee - Ecran Home detecte"
        $global:StepsPassed++
        return $true
    }
    
    $ui = Wait-ForScreen -ContainsText "Jobs" -TimeoutSeconds 5
    if ($ui) {
        Write-Success "App lancee - Ecran Jobs detecte"
        $global:StepsPassed++
        return $true
    }
    
    Write-Fail "L'app n'a pas charge"
    return $false
}

function Step-NavigateToJobs {
    $global:CurrentStep = 2
    Write-Step "ETAPE 2: Navigation vers Jobs"
    
    Start-Sleep -Milliseconds 500
    $ui = Get-UiDump
    
    # Verifier si on est deja sur Jobs
    $jobsFilter = Find-ElementByText -Ui $ui -Text "Jobs & Filters"
    if ($jobsFilter) {
        Write-Success "Deja sur l'ecran Jobs"
        $global:StepsPassed++
        return $true
    }
    
    $todayCard = Find-ElementByText -Ui $ui -Text "Today"
    if (-not $todayCard) {
        Write-Fail "Carte 'Today' non trouvee et pas sur Jobs"
        return $false
    }
    
    Write-Info "Tap sur carte Today..."
    Invoke-Tap -X $todayCard.center.x -Y $todayCard.center.y -Description "Today card"
    
    $ui = Wait-ForScreen -ContainsText "Jobs" -TimeoutSeconds 5
    if (-not $ui) {
        Write-Fail "Ecran Jobs non charge"
        return $false
    }
    
    Write-Success "Navigation vers Jobs reussie"
    $global:StepsPassed++
    return $true
}

function Step-OpenCreateJobWizard {
    $global:CurrentStep = 3
    Write-Step "ETAPE 3: Ouverture du wizard Create Job"
    
    Start-Sleep -Milliseconds 500
    $ui = Get-UiDump
    
    $fab = Find-ElementInBottomRight -Ui $ui -MinY 1700
    if (-not $fab) {
        Write-Fail "Bouton FAB '+' non trouve"
        return $false
    }
    
    Write-Info "Tap sur FAB '+'..."
    Invoke-Tap -X $fab.center.x -Y $fab.center.y -Description "FAB +"
    
    $ui = Wait-ForScreen -ContainsText "Create New Job" -TimeoutSeconds 5
    if (-not $ui) {
        Write-Fail "Wizard Create Job non ouvert"
        return $false
    }
    
    Write-Success "Wizard Create Job ouvert"
    $global:StepsPassed++
    return $true
}

function Step-OpenAddClientForm {
    $global:CurrentStep = 4
    Write-Step "ETAPE 4: Ouverture du formulaire Add Client"
    
    Start-Sleep -Milliseconds 500
    $ui = Get-UiDump
    
    $addClient = Find-ElementByText -Ui $ui -Text "Add Client"
    if (-not $addClient) {
        Write-Fail "Bouton 'Add Client' non trouve"
        return $false
    }
    
    Write-Info "Tap sur 'Add Client'..."
    Invoke-Tap -X $addClient.center.x -Y $addClient.center.y -Description "Add Client"
    
    $ui = Wait-ForScreen -ContainsText "First Name" -TimeoutSeconds 5
    if (-not $ui) {
        Write-Fail "Formulaire Add Client non ouvert"
        return $false
    }
    
    Write-Success "Formulaire Add Client ouvert"
    $global:StepsPassed++
    return $true
}

function Step-FillClientForm {
    $global:CurrentStep = 5
    Write-Step "ETAPE 5: Remplissage du formulaire client"
    
    $firstName = "Jean"
    $lastName = "Dupont"
    $email = "jean.dupont@test.com"
    $phone = "0612345678"
    
    Start-Sleep -Milliseconds 500
    $ui = Get-UiDump
    
    Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
    Start-Sleep -Milliseconds 300
    
    # FIRST NAME
    Write-Info "Saisie First Name: $firstName"
    $firstNameField = Find-ElementByText -Ui $ui -Text "Enter first name"
    if (-not $firstNameField) {
        $firstNameField = Find-ElementByText -Ui $ui -Text "First Name"
    }
    
    if ($firstNameField) {
        Invoke-Tap -X $firstNameField.center.x -Y ($firstNameField.center.y + 50) -Description "First Name field"
        Start-Sleep -Milliseconds 500
        Invoke-InputText -Text $firstName -ClearFirst
        Start-Sleep -Milliseconds 300
        Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
        Start-Sleep -Milliseconds 300
    }
    
    $ui = Get-UiDump
    
    # LAST NAME
    Write-Info "Saisie Last Name: $lastName"
    $lastNameField = Find-ElementByText -Ui $ui -Text "Enter last name"
    if ($lastNameField) {
        Invoke-Tap -X $lastNameField.center.x -Y $lastNameField.center.y -Description "Last Name field"
        Start-Sleep -Milliseconds 500
        Invoke-InputText -Text $lastName
        Start-Sleep -Milliseconds 300
        Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
        Start-Sleep -Milliseconds 300
    }
    
    $ui = Get-UiDump
    
    # EMAIL
    Write-Info "Saisie Email: $email"
    $emailField = Find-ElementByText -Ui $ui -Text "Enter email"
    if ($emailField) {
        Invoke-Tap -X $emailField.center.x -Y $emailField.center.y -Description "Email field"
        Start-Sleep -Milliseconds 500
        Invoke-InputText -Text $email
        Start-Sleep -Milliseconds 300
        Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
        Start-Sleep -Milliseconds 300
    }
    
    Write-Info "Scroll pour voir Phone..."
    Invoke-Swipe -X1 540 -Y1 1800 -X2 540 -Y2 1300 -Duration 300
    Start-Sleep -Milliseconds 500
    
    $ui = Get-UiDump
    
    # PHONE
    Write-Info "Saisie Phone: $phone"
    $phoneField = Find-ElementByText -Ui $ui -Text "Enter phone"
    if ($phoneField) {
        Invoke-Tap -X $phoneField.center.x -Y $phoneField.center.y -Description "Phone field"
        Start-Sleep -Milliseconds 500
        Invoke-InputText -Text $phone
        Start-Sleep -Milliseconds 300
        Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
        Start-Sleep -Milliseconds 300
    }
    
    Write-Success "Formulaire client rempli"
    $global:StepsPassed++
    return $true
}

function Step-CreateClient {
    $global:CurrentStep = 6
    Write-Step "ETAPE 6: Creation du client"
    
    Start-Sleep -Milliseconds 500
    
    Invoke-Swipe -X1 540 -Y1 1900 -X2 540 -Y2 1400 -Duration 300
    Start-Sleep -Milliseconds 500
    
    $ui = Get-UiDump
    
    $createBtn = Find-ElementByText -Ui $ui -Text "Create Client"
    if (-not $createBtn) {
        Write-Fail "Bouton 'Create Client' non trouve"
        return $false
    }
    
    Write-Info "Tap sur 'Create Client'..."
    Invoke-Tap -X $createBtn.center.x -Y $createBtn.center.y -Description "Create Client"
    
    Start-Sleep -Seconds 3
    $ui = Get-UiDump
    
    $error = Find-ElementByText -Ui $ui -Text "Error"
    if ($error) {
        $errorMsg = Find-ElementByText -Ui $ui -Text "Failed"
        Write-Fail "Erreur de creation: $($errorMsg.text)"
        
        $okBtn = Find-ElementByText -Ui $ui -Text "OK" -Clickable
        if ($okBtn) {
            Invoke-Tap -X $okBtn.center.x -Y $okBtn.center.y
        }
        return $false
    }
    
    $selectClient = Find-ElementByText -Ui $ui -Text "Select Client"
    if ($selectClient) {
        Write-Success "Client cree avec succes!"
        $global:StepsPassed++
        return $true
    }
    
    $step2 = Find-ElementByText -Ui $ui -Text "Address"
    if ($step2) {
        Write-Success "Client cree - Passage a l'etape Addresses"
        $global:StepsPassed++
        return $true
    }
    
    Write-Fail "Etat inattendu apres creation du client"
    return $false
}

# ============================================================================
# EXECUTION PRINCIPALE
# ============================================================================

function Run-AllSteps {
    Write-Host "`n================================================================" -ForegroundColor Magenta
    Write-Host "       SWIFT APP - TEST AUTOMATISE DE CREATION JOB             " -ForegroundColor Magenta
    Write-Host "================================================================`n" -ForegroundColor Magenta
    
    Write-Host "Configuration:" -ForegroundColor White
    Write-Host "  Device: $DEVICE"
    Write-Host "  Expo URL: $EXPO_URL"
    Write-Host "  Start from step: $StartFromStep"
    if ($DryRun) { Write-Host "  Mode: DRY RUN (pas d'actions)" -ForegroundColor Yellow }
    Write-Host ""
    
    $steps = @(
        @{ Num = 1; Name = "Connexion et lancement"; Func = { Step-ConnectAndLaunch } },
        @{ Num = 2; Name = "Navigation vers Jobs"; Func = { Step-NavigateToJobs } },
        @{ Num = 3; Name = "Ouverture wizard Create Job"; Func = { Step-OpenCreateJobWizard } },
        @{ Num = 4; Name = "Ouverture formulaire Add Client"; Func = { Step-OpenAddClientForm } },
        @{ Num = 5; Name = "Remplissage formulaire client"; Func = { Step-FillClientForm } },
        @{ Num = 6; Name = "Creation du client"; Func = { Step-CreateClient } }
    )
    
    $success = $true
    
    foreach ($step in $steps) {
        if ($step.Num -lt $StartFromStep) {
            Write-Host "[SKIP] Etape $($step.Num) ignoree: $($step.Name)" -ForegroundColor DarkGray
            continue
        }
        
        $result = & $step.Func
        
        if (-not $result) {
            Write-Host "`n" -NoNewline
            Write-Fail "ECHEC a l'etape $($step.Num): $($step.Name)"
            Write-Host "`nLe test s'arrete ici. Vous pouvez reprendre avec:"
            Write-Host "  .\scripts\adb-job-test.ps1 -StartFromStep $($step.Num)" -ForegroundColor Yellow
            $success = $false
            break
        }
    }
    
    Write-Host "`n================================================================" -ForegroundColor Magenta
    if ($success) {
        Write-Host "[OK] TEST REUSSI! $global:StepsPassed etapes passees" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] TEST ECHOUE a l'etape $global:CurrentStep" -ForegroundColor Red
        Write-Host "  Etapes reussies: $global:StepsPassed" -ForegroundColor Yellow
    }
    Write-Host "================================================================`n" -ForegroundColor Magenta
    
    return $success
}

# Executer le test
$result = Run-AllSteps

# Retourner le code de sortie
exit $(if ($result) { 0 } else { 1 })

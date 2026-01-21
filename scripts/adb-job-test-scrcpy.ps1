# Swift App - Script de Test Automatise via SCRCPY
# Ce script utilise scrcpy pour contourner les restrictions Samsung sur les taps ADB
#
# Prerequis:
#   - scrcpy installe et dans le PATH (ou specifier $SCRCPY_PATH)
#   - ADB connecte au telephone
#
# Usage: .\scripts\adb-job-test-scrcpy.ps1 [-StartFromStep <number>] [-Port <port>]

param(
    [int]$StartFromStep = 1,
    [string]$Port = "36561",
    [string]$IP = "192.168.0.250",
    [switch]$DryRun,
    [switch]$Verbose,
    [switch]$KeepScrcpy
)

# Configuration
$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$SCRCPY = "scrcpy"  # Ou chemin complet: "C:\scrcpy\scrcpy.exe"
$DEVICE = "${IP}:${Port}"
$EXPO_URL = "exp://192.168.0.51:8081"
$LOGS_DIR = "logs"
$UI_DUMP_FILE = "/sdcard/ui.xml"
$SCRCPY_WINDOW_TITLE = "SwiftApp-Test"

# Resolution de l'ecran du telephone
$PHONE_WIDTH = 1080
$PHONE_HEIGHT = 2340

# Taille de la fenetre scrcpy (plus petite pour performance)
$SCRCPY_SCALE = 0.4
$WINDOW_WIDTH = [int]($PHONE_WIDTH * $SCRCPY_SCALE)
$WINDOW_HEIGHT = [int]($PHONE_HEIGHT * $SCRCPY_SCALE)

# Variables globales
$global:ScrcpyProcess = $null
$global:ScrcpyWindowHandle = $null

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
# FONCTIONS WINDOWS API POUR SIMULER LES CLICS
# ============================================================================

# Ajouter des fonctions Win32 supplementaires
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32Scrcpy {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    
    [DllImport("user32.dll")]
    public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);
    
    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);
    
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, int wParam, int lParam);
    
    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_MOVE = 0x0001;
    public const uint MOUSEEVENTF_ABSOLUTE = 0x8000;
    
    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP = 0x0202;
    public const uint WM_MOUSEMOVE = 0x0200;
    
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int X;
        public int Y;
    }
}
"@ -ErrorAction SilentlyContinue

# ============================================================================
# FONCTIONS SCRCPY
# ============================================================================

function Start-Scrcpy {
    Write-Info "Demarrage de scrcpy..."
    
    # Verifier si scrcpy est installe
    $scrcpyPath = Get-Command $SCRCPY -ErrorAction SilentlyContinue
    if (-not $scrcpyPath) {
        Write-Fail "scrcpy n'est pas installe ou pas dans le PATH"
        Write-Host "  Installez scrcpy: https://github.com/Genymobile/scrcpy/releases"
        Write-Host "  Ou: scoop install scrcpy / choco install scrcpy"
        return $false
    }
    
    # Lancer scrcpy avec options specifiques
    # Note: On n'utilise pas --max-size pour garder le bon ratio
    $scrcpyArgs = @(
        "--window-title", $SCRCPY_WINDOW_TITLE,
        "--stay-awake",
        "--no-audio",
        "--serial", $DEVICE
    )
    
    Write-Debug "Commande: $SCRCPY $($scrcpyArgs -join ' ')"
    
    $global:ScrcpyProcess = Start-Process -FilePath $SCRCPY -ArgumentList $scrcpyArgs -PassThru -WindowStyle Normal
    
    # Attendre que la fenetre apparaisse
    $timeout = 15
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        
        # Methode 1: Via Get-Process (plus fiable)
        $proc = Get-Process scrcpy -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq $SCRCPY_WINDOW_TITLE }
        if ($proc) {
            # Obtenir le handle via FindWindow
            $hwnd = [Win32Scrcpy]::FindWindow($null, $SCRCPY_WINDOW_TITLE)
            if ($hwnd -eq [IntPtr]::Zero) {
                # Utiliser le handle du process
                $hwnd = $proc.MainWindowHandle
            }
            if ($hwnd -ne [IntPtr]::Zero) {
                $global:ScrcpyWindowHandle = $hwnd
                Write-Success "Fenetre scrcpy trouvee (handle: $hwnd)"
                return $true
            }
        }
        Write-Debug "Attente de la fenetre scrcpy... ($elapsed/$timeout)"
    }
    
    Write-Fail "Timeout: fenetre scrcpy non trouvee"
    return $false
}

function Stop-Scrcpy {
    if ($global:ScrcpyProcess -and -not $global:ScrcpyProcess.HasExited) {
        Write-Info "Arret de scrcpy..."
        $global:ScrcpyProcess.Kill()
        $global:ScrcpyProcess = $null
    }
}

function Get-ScrcpyWindowRect {
    if ($global:ScrcpyWindowHandle -eq [IntPtr]::Zero) {
        return $null
    }
    
    $rect = New-Object Win32Scrcpy+RECT
    [Win32Scrcpy]::GetWindowRect($global:ScrcpyWindowHandle, [ref]$rect) | Out-Null
    
    return @{
        Left = $rect.Left
        Top = $rect.Top
        Right = $rect.Right
        Bottom = $rect.Bottom
        Width = $rect.Right - $rect.Left
        Height = $rect.Bottom - $rect.Top
    }
}

# ============================================================================
# FONCTIONS DE CLIC VIA SCRCPY
# ============================================================================

function Invoke-ScrcpyTap {
    param(
        [int]$PhoneX,
        [int]$PhoneY,
        [string]$Description = ""
    )
    
    if ($DryRun) {
        Write-Debug "DRY RUN: Tap ($PhoneX, $PhoneY) $Description"
        return
    }
    
    if ($global:ScrcpyWindowHandle -eq [IntPtr]::Zero) {
        Write-Fail "Fenetre scrcpy non trouvee"
        return
    }
    
    # Obtenir la taille client (zone utile sans bordures ni titre)
    $clientRect = New-Object Win32Scrcpy+RECT
    [Win32Scrcpy]::GetClientRect($global:ScrcpyWindowHandle, [ref]$clientRect) | Out-Null
    
    $clientWidth = $clientRect.Right
    $clientHeight = $clientRect.Bottom
    
    # Obtenir l'origine du client en coordonnees ecran
    $clientOrigin = New-Object Win32Scrcpy+POINT
    $clientOrigin.X = 0
    $clientOrigin.Y = 0
    [Win32Scrcpy]::ClientToScreen($global:ScrcpyWindowHandle, [ref]$clientOrigin) | Out-Null
    
    # Calculer l'echelle en tenant compte du ratio d'aspect
    # scrcpy maintient le ratio d'aspect, donc on doit trouver la zone reelle
    $phoneRatio = $PHONE_WIDTH / $PHONE_HEIGHT
    $windowRatio = $clientWidth / $clientHeight
    
    if ($windowRatio -gt $phoneRatio) {
        # La fenetre est plus large que le telephone - barres noires sur les cotes
        $effectiveWidth = [int]($clientHeight * $phoneRatio)
        $effectiveHeight = $clientHeight
        $offsetX = [int](($clientWidth - $effectiveWidth) / 2)
        $offsetY = 0
    } else {
        # La fenetre est plus haute que le telephone - barres noires en haut/bas
        $effectiveWidth = $clientWidth
        $effectiveHeight = [int]($clientWidth / $phoneRatio)
        $offsetX = 0
        $offsetY = [int](($clientHeight - $effectiveHeight) / 2)
    }
    
    $scaleX = $effectiveWidth / $PHONE_WIDTH
    $scaleY = $effectiveHeight / $PHONE_HEIGHT
    
    # Coordonnees ecran finales
    $screenX = $clientOrigin.X + $offsetX + [int]($PhoneX * $scaleX)
    $screenY = $clientOrigin.Y + $offsetY + [int]($PhoneY * $scaleY)
    
    Write-Debug "Client: ${clientWidth}x${clientHeight}, Effective: ${effectiveWidth}x${effectiveHeight}, Scale: $([math]::Round($scaleX,3))x$([math]::Round($scaleY,3))"
    Write-Debug "Tap phone ($PhoneX, $PhoneY) -> screen ($screenX, $screenY) $Description"
    
    # Mettre la fenetre au premier plan
    [Win32Scrcpy]::SetForegroundWindow($global:ScrcpyWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 100
    
    # Deplacer la souris et cliquer
    [Win32Scrcpy]::SetCursorPos($screenX, $screenY) | Out-Null
    Start-Sleep -Milliseconds 50
    
    [Win32Scrcpy]::mouse_event([Win32Scrcpy]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
    [Win32Scrcpy]::mouse_event([Win32Scrcpy]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    
    Start-Sleep -Milliseconds 200
}

function Invoke-ScrcpySwipe {
    param(
        [int]$X1, [int]$Y1,
        [int]$X2, [int]$Y2,
        [int]$DurationMs = 300
    )
    
    if ($DryRun) {
        Write-Debug "DRY RUN: Swipe ($X1,$Y1) -> ($X2,$Y2)"
        return
    }
    
    if ($global:ScrcpyWindowHandle -eq [IntPtr]::Zero) { return }
    
    # Obtenir la taille client
    $clientRect = New-Object Win32Scrcpy+RECT
    [Win32Scrcpy]::GetClientRect($global:ScrcpyWindowHandle, [ref]$clientRect) | Out-Null
    
    $clientWidth = $clientRect.Right
    $clientHeight = $clientRect.Bottom
    
    # Obtenir l'origine du client en coordonnees ecran
    $clientOrigin = New-Object Win32Scrcpy+POINT
    $clientOrigin.X = 0
    $clientOrigin.Y = 0
    [Win32Scrcpy]::ClientToScreen($global:ScrcpyWindowHandle, [ref]$clientOrigin) | Out-Null
    
    # Calculer le ratio
    $phoneRatio = $PHONE_WIDTH / $PHONE_HEIGHT
    $windowRatio = $clientWidth / $clientHeight
    
    if ($windowRatio -gt $phoneRatio) {
        $effectiveWidth = [int]($clientHeight * $phoneRatio)
        $effectiveHeight = $clientHeight
        $offsetX = [int](($clientWidth - $effectiveWidth) / 2)
        $offsetY = 0
    } else {
        $effectiveWidth = $clientWidth
        $effectiveHeight = [int]($clientWidth / $phoneRatio)
        $offsetX = 0
        $offsetY = [int](($clientHeight - $effectiveHeight) / 2)
    }
    
    $scaleX = $effectiveWidth / $PHONE_WIDTH
    $scaleY = $effectiveHeight / $PHONE_HEIGHT
    
    $startX = $clientOrigin.X + $offsetX + [int]($X1 * $scaleX)
    $startY = $clientOrigin.Y + $offsetY + [int]($Y1 * $scaleY)
    $endX = $clientOrigin.X + $offsetX + [int]($X2 * $scaleX)
    $endY = $clientOrigin.Y + $offsetY + [int]($Y2 * $scaleY)
    
    Write-Debug "Swipe ($X1,$Y1)->($X2,$Y2) screen ($startX,$startY)->($endX,$endY)"
    
    [Win32Scrcpy]::SetForegroundWindow($global:ScrcpyWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 100
    
    # Mouse down au point de depart
    [Win32Scrcpy]::SetCursorPos($startX, $startY) | Out-Null
    Start-Sleep -Milliseconds 50
    [Win32Scrcpy]::mouse_event([Win32Scrcpy]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    
    # Mouvement fluide
    $steps = 20
    $stepDelay = $DurationMs / $steps
    for ($i = 1; $i -le $steps; $i++) {
        $progress = $i / $steps
        $currentX = $startX + [int](($endX - $startX) * $progress)
        $currentY = $startY + [int](($endY - $startY) * $progress)
        [Win32Scrcpy]::SetCursorPos($currentX, $currentY) | Out-Null
        Start-Sleep -Milliseconds $stepDelay
    }
    
    # Mouse up
    [Win32Scrcpy]::mouse_event([Win32Scrcpy]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 200
}

function Invoke-ScrcpyText {
    param([string]$Text)
    
    if ($DryRun) {
        Write-Debug "DRY RUN: Text '$Text'"
        return
    }
    
    Write-Debug "InputText via ADB: '$Text'"
    
    # Pour le texte, on utilise toujours ADB car c'est plus fiable
    $escapedText = $Text -replace '@', '\@' -replace ' ', '%s'
    & $ADB shell input text $escapedText
}

# ============================================================================
# FONCTIONS UTILITAIRES ADB (inchangees)
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

function Invoke-KeyEvent {
    param([string]$Key)
    Write-Debug "KeyEvent: $Key"
    if (-not $DryRun) {
        & $ADB shell input keyevent $Key
    }
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
# ETAPES DE TEST (utilisant scrcpy pour les taps)
# ============================================================================

function Step-ConnectAndLaunch {
    $global:CurrentStep = 1
    Write-Step "ETAPE 1: Connexion ADB, scrcpy et lancement de l'app"
    
    # Connexion ADB
    if (-not (Test-AdbConnection)) {
        if (-not (Connect-Adb)) {
            return $false
        }
    } else {
        Write-Success "Deja connecte a $DEVICE"
    }
    
    # Demarrer scrcpy
    if (-not (Start-Scrcpy)) {
        return $false
    }
    
    # Deverrouiller l'ecran
    Write-Info "Reveil de l'ecran..."
    & $ADB shell input keyevent KEYCODE_WAKEUP 2>&1 | Out-Null
    Start-Sleep -Milliseconds 500
    
    # Swipe pour deverrouiller via scrcpy
    Invoke-ScrcpySwipe -X1 540 -Y1 1800 -X2 540 -Y2 500 -DurationMs 300
    Start-Sleep -Milliseconds 500
    
    # Lancer l'app
    Write-Info "Lancement de Swift App via Expo..."
    & $ADB shell am start -a android.intent.action.VIEW -d $EXPO_URL 2>&1 | Out-Null
    
    # Attendre l'ecran
    Start-Sleep -Seconds 3
    $ui = Get-UiDump
    
    if (-not $ui) {
        Write-Fail "Impossible de lire l'UI"
        return $false
    }
    
    $todayElement = Find-ElementByText -Ui $ui -Text "Today"
    $jobsElement = Find-ElementByText -Ui $ui -Text "Jobs"
    
    if ($todayElement -or $jobsElement) {
        Write-Success "App lancee - Ecran detecte"
        $global:StepsPassed++
        return $true
    }
    
    $ui = Wait-ForScreen -ContainsText "Today" -TimeoutSeconds 10
    if ($ui) {
        Write-Success "App lancee - Ecran Home detecte"
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
    
    Write-Info "Tap sur carte Today via scrcpy..."
    Invoke-ScrcpyTap -PhoneX $todayCard.center.x -PhoneY $todayCard.center.y -Description "Today card"
    
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
    
    Write-Info "Tap sur FAB '+' via scrcpy..."
    Invoke-ScrcpyTap -PhoneX $fab.center.x -PhoneY $fab.center.y -Description "FAB +"
    
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
    
    Write-Info "Tap sur 'Add Client' via scrcpy..."
    Invoke-ScrcpyTap -PhoneX $addClient.center.x -PhoneY $addClient.center.y -Description "Add Client"
    
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
    
    # FIRST NAME
    Write-Info "Saisie First Name: $firstName"
    $firstNameField = Find-ElementByText -Ui $ui -Text "Enter first name"
    if (-not $firstNameField) {
        $firstNameField = Find-ElementByText -Ui $ui -Text "First Name"
    }
    
    if ($firstNameField) {
        Invoke-ScrcpyTap -PhoneX $firstNameField.center.x -PhoneY ($firstNameField.center.y + 50) -Description "First Name field"
        Start-Sleep -Milliseconds 500
        Invoke-ScrcpyText -Text $firstName
        Start-Sleep -Milliseconds 300
        Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
        Start-Sleep -Milliseconds 300
    }
    
    $ui = Get-UiDump
    
    # LAST NAME
    Write-Info "Saisie Last Name: $lastName"
    $lastNameField = Find-ElementByText -Ui $ui -Text "Enter last name"
    if ($lastNameField) {
        Invoke-ScrcpyTap -PhoneX $lastNameField.center.x -PhoneY $lastNameField.center.y -Description "Last Name field"
        Start-Sleep -Milliseconds 500
        Invoke-ScrcpyText -Text $lastName
        Start-Sleep -Milliseconds 300
        Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
        Start-Sleep -Milliseconds 300
    }
    
    $ui = Get-UiDump
    
    # EMAIL
    Write-Info "Saisie Email: $email"
    $emailField = Find-ElementByText -Ui $ui -Text "Enter email"
    if ($emailField) {
        Invoke-ScrcpyTap -PhoneX $emailField.center.x -PhoneY $emailField.center.y -Description "Email field"
        Start-Sleep -Milliseconds 500
        Invoke-ScrcpyText -Text $email
        Start-Sleep -Milliseconds 300
        Invoke-KeyEvent -Key "KEYCODE_ESCAPE"
        Start-Sleep -Milliseconds 300
    }
    
    Write-Info "Scroll pour voir Phone..."
    Invoke-ScrcpySwipe -X1 540 -Y1 1800 -X2 540 -Y2 1300 -DurationMs 300
    Start-Sleep -Milliseconds 500
    
    $ui = Get-UiDump
    
    # PHONE
    Write-Info "Saisie Phone: $phone"
    $phoneField = Find-ElementByText -Ui $ui -Text "Enter phone"
    if ($phoneField) {
        Invoke-ScrcpyTap -PhoneX $phoneField.center.x -PhoneY $phoneField.center.y -Description "Phone field"
        Start-Sleep -Milliseconds 500
        Invoke-ScrcpyText -Text $phone
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
    
    Invoke-ScrcpySwipe -X1 540 -Y1 1900 -X2 540 -Y2 1400 -DurationMs 300
    Start-Sleep -Milliseconds 500
    
    $ui = Get-UiDump
    
    $createBtn = Find-ElementByText -Ui $ui -Text "Create Client"
    if (-not $createBtn) {
        Write-Fail "Bouton 'Create Client' non trouve"
        return $false
    }
    
    Write-Info "Tap sur 'Create Client' via scrcpy..."
    Invoke-ScrcpyTap -PhoneX $createBtn.center.x -PhoneY $createBtn.center.y -Description "Create Client"
    
    Start-Sleep -Seconds 3
    $ui = Get-UiDump
    
    $error = Find-ElementByText -Ui $ui -Text "Error"
    if ($error) {
        $errorMsg = Find-ElementByText -Ui $ui -Text "Failed"
        Write-Fail "Erreur de creation: $($errorMsg.text)"
        
        $okBtn = Find-ElementByText -Ui $ui -Text "OK" -Clickable
        if ($okBtn) {
            Invoke-ScrcpyTap -PhoneX $okBtn.center.x -PhoneY $okBtn.center.y
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
    Write-Host "    SWIFT APP - TEST AUTOMATISE (via SCRCPY)                   " -ForegroundColor Magenta
    Write-Host "================================================================`n" -ForegroundColor Magenta
    
    Write-Host "Configuration:" -ForegroundColor White
    Write-Host "  Device: $DEVICE"
    Write-Host "  Expo URL: $EXPO_URL"
    Write-Host "  Start from step: $StartFromStep"
    Write-Host "  Mode: SCRCPY (contourne les restrictions Samsung)"
    if ($DryRun) { Write-Host "  DRY RUN: Pas d'actions reelles" -ForegroundColor Yellow }
    Write-Host ""
    
    $steps = @(
        @{ Num = 1; Name = "Connexion, scrcpy et lancement"; Func = { Step-ConnectAndLaunch } },
        @{ Num = 2; Name = "Navigation vers Jobs"; Func = { Step-NavigateToJobs } },
        @{ Num = 3; Name = "Ouverture wizard Create Job"; Func = { Step-OpenCreateJobWizard } },
        @{ Num = 4; Name = "Ouverture formulaire Add Client"; Func = { Step-OpenAddClientForm } },
        @{ Num = 5; Name = "Remplissage formulaire client"; Func = { Step-FillClientForm } },
        @{ Num = 6; Name = "Creation du client"; Func = { Step-CreateClient } }
    )
    
    $success = $true
    
    try {
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
                Write-Host "  .\scripts\adb-job-test-scrcpy.ps1 -StartFromStep $($step.Num)" -ForegroundColor Yellow
                $success = $false
                break
            }
        }
    }
    finally {
        # Fermer scrcpy sauf si -KeepScrcpy
        if (-not $KeepScrcpy) {
            Stop-Scrcpy
        } else {
            Write-Info "scrcpy reste ouvert (-KeepScrcpy)"
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

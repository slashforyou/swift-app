# Fonctions utilitaires partagees pour tous les tests
# Ces fonctions sont reutilisables dans toutes les suites de tests

# Couleurs et formatage
function Write-Step { 
    param($n, $msg) 
    Write-Host "`n=== ETAPE $n : $msg ===" -ForegroundColor Cyan 
}

function Write-OK { 
    param($msg) 
    Write-Host "[OK] $msg" -ForegroundColor Green 
}

function Write-FAIL { 
    param($msg) 
    Write-Host "[FAIL] $msg" -ForegroundColor Red 
}

function Write-Info { 
    param($msg) 
    Write-Host "-> $msg" -ForegroundColor Yellow 
}

function Write-Debug { 
    param($msg, [switch]$Verbose) 
    if ($Verbose -or $global:VerboseMode) { 
        Write-Host "  $msg" -ForegroundColor DarkGray 
    } 
}

function Write-Skip {
    param($msg)
    Write-Host "[SKIP] $msg" -ForegroundColor DarkYellow
}

# Connexion ADB
function Connect-ADB {
    $devices = & $global:ADB devices 2>&1
    if ($devices -notmatch $global:DEVICE) {
        Write-Info "Connexion a $($global:DEVICE)..."
        & $global:ADB connect $global:DEVICE | Out-Null
        Start-Sleep -Seconds 1
    }
    
    $devices = & $global:ADB devices 2>&1
    return $devices -match $global:DEVICE
}

# Capture d'ecran UI
function Get-Screen {
    & $global:ADB shell uiautomator dump /sdcard/ui.xml 2>&1 | Out-Null
    
    # Determiner le chemin absolu vers logs/ui_current.xml
    $workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
    $logPath = Join-Path $workspaceRoot "logs\ui_current.xml"
    
    # Creer le dossier logs s'il n'existe pas
    $logsDir = Split-Path $logPath -Parent
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    }
    
    & $global:ADB pull /sdcard/ui.xml $logPath 2>&1 | Out-Null
    if (Test-Path $logPath) {
        return [xml](Get-Content $logPath -Raw)
    }
    return $null
}

# Recherche d'elements dans l'UI
function Find-Element {
    param(
        [xml]$Ui, 
        [string]$Text,
        [switch]$ContentDesc
    )
    
    if ($ContentDesc) {
        $node = $Ui.SelectSingleNode("//*[contains(@content-desc, '$Text')]")
    } else {
        $node = $Ui.SelectSingleNode("//*[contains(@text, '$Text')]")
        if (-not $node) {
            $node = $Ui.SelectSingleNode("//*[contains(@content-desc, '$Text')]")
        }
    }
    
    if ($node -and $node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
        return @{
            X1 = [int]$Matches[1]
            Y1 = [int]$Matches[2]
            X2 = [int]$Matches[3]
            Y2 = [int]$Matches[4]
            CenterX = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
            CenterY = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
            Node = $node
        }
    }
    
    return $null
}

# Tap sur un element
function Invoke-Tap {
    param(
        [int]$X,
        [int]$Y,
        [int]$Delay = 1000
    )
    
    & $global:ADB shell input tap $X $Y
    Start-Sleep -Milliseconds $Delay
}

# Saisie de texte
function Invoke-Input {
    param(
        [Parameter(Mandatory=$true, Position=0)]
        [Alias("Text")]
        [string]$Value,
        [int]$Delay = 500
    )
    
    # Ne pas essayer de vider le champ ici - le vidage est fait par les steps
    # Echapper seulement les espaces pour ADB (les autres caracteres passent bien)
    $escapedText = $Value -replace ' ', '%s'
    
    # Utiliser la commande ADB directement
    & $global:ADB shell input text $escapedText
    Start-Sleep -Milliseconds $Delay
}

# Fonction pour obtenir le champ actuellement focus
function Get-FocusedField {
    param(
        [xml]$Ui
    )
    
    $focusedField = $Ui.SelectSingleNode("//node[@focused='true' and @class='android.widget.EditText']")
    if ($focusedField) {
        return @{
            Hint = $focusedField.hint
            Text = $focusedField.text
            Bounds = $focusedField.bounds
        }
    }
    return $null
}

# Fonction pour cliquer sur un champ et attendre qu'il devienne actif
function Invoke-FieldActivation {
    param(
        [int]$X,
        [int]$Y,
        [string]$ExpectedHint,
        [int]$MaxRetries = 3
    )
    
    for ($i = 0; $i -lt $MaxRetries; $i++) {
        # Cliquer sur le champ
        Invoke-Tap $X $Y
        Start-Sleep -Milliseconds 300
        
        # Verifier si le bon champ est maintenant focus
        $ui = Get-Screen
        $focusedField = $ui.SelectSingleNode("//node[@focused='true' and @class='android.widget.EditText']")
        
        if ($focusedField -and $focusedField.hint -eq $ExpectedHint) {
            Write-Info "Champ '$ExpectedHint' active avec succes"
            return $true
        }
        
        Write-Warning "Tentative $(i+1): Champ non actif, retry..."
        Start-Sleep -Milliseconds 200
    }
    
    Write-Error "Impossible d'activer le champ '$ExpectedHint' apres $MaxRetries tentatives"
    return $false
}

# Navigation par Tab vers un champ spécifique
function Invoke-TabNavigation {
    param(
        [string]$TargetHint,
        [int]$MaxTabs = 10,
        [bool]$Forward = $true
    )
    
    $tabKey = if ($Forward) { 61 } else { 15 }  # Tab ou Shift+Tab
    
    for ($i = 0; $i -lt $MaxTabs; $i++) {
        # Verifier le champ actuellement focus
        $ui = Get-Screen
        $focusedField = $ui.SelectSingleNode("//node[@focused='true' and @class='android.widget.EditText']")
        
        if ($focusedField -and $focusedField.hint -eq $TargetHint) {
            Write-Info "Champ cible '$TargetHint' atteint avec succes"
            return $true
        }
        
        # Naviguer vers le champ suivant/précédent
        & $global:ADB shell input keyevent $tabKey
        Start-Sleep -Milliseconds 300
    }
    
    Write-Error "Impossible d'atteindre le champ '$TargetHint' apres $MaxTabs tentatives"
    return $false
}

# Swipe/Scroll
function Invoke-Swipe {
    param(
        [int]$X1,
        [int]$Y1,
        [int]$X2,
        [int]$Y2,
        [int]$Duration = 300,
        [int]$Delay = 1000
    )
    
    & $global:ADB shell input swipe $X1 $Y1 $X2 $Y2 $Duration
    Start-Sleep -Milliseconds $Delay
}

# Recherche de champ avec hint
function Find-FieldByHint {
    param(
        [xml]$Ui,
        [string]$Hint,
        [int]$Index = 0
    )
    
    $fields = $Ui.SelectNodes("//node[@hint='$Hint']")
    if ($fields.Count -gt $Index) {
        $field = $fields[$Index]
        if ($field.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            return @{
                X1 = [int]$Matches[1]
                Y1 = [int]$Matches[2]
                X2 = [int]$Matches[3]
                Y2 = [int]$Matches[4]
                CenterX = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
                CenterY = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
                Node = $field
            }
        }
    }
    
    return $null
}

# Verification de l'existence d'un element
function Test-ElementExists {
    param(
        [xml]$Ui,
        [string]$Text
    )
    
    $node = $Ui.SelectSingleNode("//*[contains(@text, '$Text')]")
    if (-not $node) {
        $node = $Ui.SelectSingleNode("//*[contains(@content-desc, '$Text')]")
    }
    
    return $null -ne $node
}

# Attendre qu'un element apparaisse
function Wait-ForElement {
    param(
        [string]$Text,
        [int]$MaxAttempts = 10,
        [int]$DelayMs = 1000
    )
    
    for ($i = 0; $i -lt $MaxAttempts; $i++) {
        $ui = Get-Screen
        if (Test-ElementExists -Ui $ui -Text $Text) {
            return $true
        }
        Start-Sleep -Milliseconds $DelayMs
    }
    
    return $false
}

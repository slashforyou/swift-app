# =============================================================================
# UI DETECTOR - Detection dynamique des elements UI
# =============================================================================
# Ce module fournit des fonctions pour detecter et interagir avec les elements
# de l'interface utilisateur de maniere dynamique, sans coordonnees en dur.
# =============================================================================

# Configuration
$script:ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$script:DEVICE = "192.168.0.250:35031"
$script:UI_DUMP_PATH = "/sdcard/ui_dump.xml"
$script:LOCAL_UI_PATH = "$PSScriptRoot\..\..\..\logs\ui_dynamic.xml"

# =============================================================================
# FONCTION PRINCIPALE: Capture de l'ecran
# =============================================================================
function Get-CurrentUI {
    <#
    .SYNOPSIS
        Capture l'etat actuel de l'UI et retourne le contenu XML
    .OUTPUTS
        String - Contenu XML de l'UI
    #>
    & $script:ADB -s $script:DEVICE shell "uiautomator dump $script:UI_DUMP_PATH" 2>$null | Out-Null
    & $script:ADB -s $script:DEVICE pull $script:UI_DUMP_PATH $script:LOCAL_UI_PATH 2>$null | Out-Null
    
    if (Test-Path $script:LOCAL_UI_PATH) {
        return Get-Content $script:LOCAL_UI_PATH -Raw -Encoding UTF8
    }
    return $null
}

# =============================================================================
# FONCTION: Trouver un element par criteres
# =============================================================================
function Find-UIElement {
    <#
    .SYNOPSIS
        Trouve un element UI par differents criteres
    .PARAMETER Text
        Texte exact de l'element
    .PARAMETER TextContains
        Texte partiel contenu dans l'element
    .PARAMETER ContentDesc
        Content description de l'element
    .PARAMETER ResourceId
        Resource ID de l'element
    .PARAMETER ClassName
        Classe de l'element (ex: android.widget.Button)
    .PARAMETER Index
        Si plusieurs elements correspondent, prendre celui a cet index (0-based)
    .PARAMETER RefreshUI
        Si true, rafraichit l'UI avant la recherche (defaut: true)
    .OUTPUTS
        Hashtable avec: Found, Bounds, CenterX, CenterY, Text, Element
    #>
    param(
        [string]$Text,
        [string]$TextContains,
        [string]$ContentDesc,
        [string]$ResourceId,
        [string]$ClassName,
        [int]$Index = 0,
        [bool]$RefreshUI = $true
    )
    
    # Resultat par defaut
    $result = @{
        Found = $false
        Bounds = $null
        CenterX = 0
        CenterY = 0
        Text = ""
        Element = ""
        Error = $null
    }
    
    # Capturer l'UI si demande
    if ($RefreshUI) {
        $xml = Get-CurrentUI
    } else {
        if (Test-Path $script:LOCAL_UI_PATH) {
            $xml = Get-Content $script:LOCAL_UI_PATH -Raw -Encoding UTF8
        }
    }
    
    if (-not $xml) {
        $result.Error = "Impossible de capturer l'UI"
        return $result
    }
    
    # Construire le pattern de recherche
    $pattern = '<node[^>]*'
    
    if ($Text) {
        $escapedText = [regex]::Escape($Text)
        $pattern += "text=`"$escapedText`"[^>]*"
    }
    if ($TextContains) {
        $escapedText = [regex]::Escape($TextContains)
        $pattern += "text=`"[^`"]*$escapedText[^`"]*`"[^>]*"
    }
    if ($ContentDesc) {
        $escapedDesc = [regex]::Escape($ContentDesc)
        $pattern += "content-desc=`"$escapedDesc`"[^>]*"
    }
    if ($ResourceId) {
        $escapedId = [regex]::Escape($ResourceId)
        $pattern += "resource-id=`"[^`"]*$escapedId[^`"]*`"[^>]*"
    }
    if ($ClassName) {
        $escapedClass = [regex]::Escape($ClassName)
        $pattern += "class=`"$escapedClass`"[^>]*"
    }
    
    $pattern += 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
    
    # Chercher tous les matches
    $matches = [regex]::Matches($xml, $pattern)
    
    if ($matches.Count -eq 0) {
        $result.Error = "Element non trouve"
        return $result
    }
    
    if ($Index -ge $matches.Count) {
        $result.Error = "Index $Index hors limites (${matches.Count} elements trouves)"
        return $result
    }
    
    $match = $matches[$Index]
    $element = $match.Value
    
    # Extraire les bounds
    if ($element -match 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
        $x1 = [int]$Matches[1]
        $y1 = [int]$Matches[2]
        $x2 = [int]$Matches[3]
        $y2 = [int]$Matches[4]
        
        $result.Found = $true
        $result.Bounds = @{ X1 = $x1; Y1 = $y1; X2 = $x2; Y2 = $y2 }
        $result.CenterX = [int](($x1 + $x2) / 2)
        $result.CenterY = [int](($y1 + $y2) / 2)
        $result.Element = $element
        
        # Extraire le texte si present
        if ($element -match 'text="([^"]*)"') {
            $result.Text = $Matches[1]
        }
    }
    
    return $result
}

# =============================================================================
# FONCTION: Cliquer sur un element trouve
# =============================================================================
function Click-UIElement {
    <#
    .SYNOPSIS
        Trouve un element et clique dessus
    .PARAMETER Text
        Texte exact de l'element
    .PARAMETER TextContains
        Texte partiel
    .PARAMETER ContentDesc
        Content description
    .PARAMETER Index
        Index si plusieurs elements (0-based)
    .PARAMETER WaitAfter
        Millisecondes a attendre apres le clic
    .OUTPUTS
        Hashtable avec: Success, Element, Error
    #>
    param(
        [string]$Text,
        [string]$TextContains,
        [string]$ContentDesc,
        [string]$ResourceId,
        [string]$ClassName,
        [int]$Index = 0,
        [int]$WaitAfter = 500
    )
    
    $result = @{
        Success = $false
        Element = $null
        ClickedAt = $null
        Error = $null
    }
    
    # Trouver l'element
    $element = Find-UIElement -Text $Text -TextContains $TextContains -ContentDesc $ContentDesc -ResourceId $ResourceId -ClassName $ClassName -Index $Index
    
    if (-not $element.Found) {
        $result.Error = $element.Error
        return $result
    }
    
    # Cliquer
    & $script:ADB -s $script:DEVICE shell "input tap $($element.CenterX) $($element.CenterY)" 2>$null
    
    $result.Success = $true
    $result.Element = $element
    $result.ClickedAt = "$($element.CenterX),$($element.CenterY)"
    
    # Attendre
    if ($WaitAfter -gt 0) {
        Start-Sleep -Milliseconds $WaitAfter
    }
    
    return $result
}

# =============================================================================
# FONCTION: Saisir du texte dans un champ
# =============================================================================
function Input-UIText {
    <#
    .SYNOPSIS
        Trouve un champ, clique dessus, et saisit du texte
    .PARAMETER Text
        Texte du label du champ
    .PARAMETER TextContains
        Texte partiel du label
    .PARAMETER InputText
        Texte a saisir
    .PARAMETER ClearFirst
        Effacer le champ avant la saisie
    .OUTPUTS
        Hashtable avec: Success, Error
    #>
    param(
        [string]$Text,
        [string]$TextContains,
        [string]$ContentDesc,
        [int]$Index = 0,
        [string]$InputText,
        [bool]$ClearFirst = $true,
        [int]$WaitAfter = 300
    )
    
    $result = @{
        Success = $false
        Error = $null
    }
    
    # Trouver et cliquer sur le champ
    $click = Click-UIElement -Text $Text -TextContains $TextContains -ContentDesc $ContentDesc -Index $Index -WaitAfter 300
    
    if (-not $click.Success) {
        $result.Error = "Champ non trouve: $($click.Error)"
        return $result
    }
    
    # Effacer si demande
    if ($ClearFirst) {
        # Triple-clic pour tout selectionner puis supprimer
        & $script:ADB -s $script:DEVICE shell "input keyevent KEYCODE_CTRL_LEFT KEYCODE_A" 2>$null
        Start-Sleep -Milliseconds 100
        & $script:ADB -s $script:DEVICE shell "input keyevent KEYCODE_DEL" 2>$null
        Start-Sleep -Milliseconds 100
    }
    
    # Saisir le texte (escape les espaces)
    $escapedText = $InputText -replace ' ', '%s'
    & $script:ADB -s $script:DEVICE shell "input text '$escapedText'" 2>$null
    
    $result.Success = $true
    
    if ($WaitAfter -gt 0) {
        Start-Sleep -Milliseconds $WaitAfter
    }
    
    return $result
}

# =============================================================================
# FONCTION: Verifier la presence d'un element (sans cliquer)
# =============================================================================
function Test-UIElement {
    <#
    .SYNOPSIS
        Verifie si un element est present sur l'ecran
    .OUTPUTS
        Boolean
    #>
    param(
        [string]$Text,
        [string]$TextContains,
        [string]$ContentDesc,
        [bool]$RefreshUI = $true
    )
    
    $element = Find-UIElement -Text $Text -TextContains $TextContains -ContentDesc $ContentDesc -RefreshUI $RefreshUI
    return $element.Found
}

# =============================================================================
# FONCTION: Detecter l'ecran actuel
# =============================================================================
function Get-CurrentScreen {
    <#
    .SYNOPSIS
        Detecte l'ecran actuel de l'application
    .OUTPUTS
        String: "day", "wizard-client", "wizard-new-client", "wizard-address", 
                "wizard-schedule", "wizard-details", "wizard-confirmation",
                "expo-home", "lock-screen", "unknown"
    #>
    $xml = Get-CurrentUI
    
    if (-not $xml) {
        return "error"
    }
    
    # Detection par ordre de priorite
    if ($xml -match "Select Client" -or $xml -match "Choose a client") {
        return "wizard-client"
    }
    if ($xml -match "Create New Client" -and $xml -match "First Name") {
        return "wizard-new-client"
    }
    if ($xml -match "Enter Addresses" -or $xml -match "Pickup Address") {
        return "wizard-address"
    }
    if ($xml -match "Schedule" -and $xml -match "Start Time") {
        return "wizard-schedule"
    }
    if ($xml -match "Job Details" -and $xml -match "Priority") {
        return "wizard-details"
    }
    if ($xml -match "Confirm Job" -or $xml -match "Review job details") {
        return "wizard-confirmation"
    }
    if ($xml -match "No jobs scheduled" -or $xml -match "January.*2026") {
        return "day"
    }
    if ($xml -match "Swift App" -and $xml -match "Recently opened") {
        return "expo-home"
    }
    if ($xml -match "Swipe to open" -or $xml -match "Enter PIN") {
        return "lock-screen"
    }
    if ($xml -match "Expo Go" -and -not ($xml -match "Swift App.*Recently")) {
        # Expo Go icon sur home screen Android
        return "android-home"
    }
    if ($xml -match "Facebook|Instagram|Snapchat|Messenger") {
        return "android-home"
    }
    
    return "unknown"
}

# =============================================================================
# FONCTION: Attendre qu'un ecran apparaisse
# =============================================================================
function Wait-ForScreen {
    <#
    .SYNOPSIS
        Attend qu'un ecran specifique apparaisse
    .PARAMETER Screen
        Nom de l'ecran attendu
    .PARAMETER TimeoutSeconds
        Timeout en secondes
    .OUTPUTS
        Boolean - True si l'ecran est apparu
    #>
    param(
        [string]$Screen,
        [int]$TimeoutSeconds = 10
    )
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $current = Get-CurrentScreen
        if ($current -eq $Screen) {
            return $true
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    
    return $false
}

# =============================================================================
# FONCTION: Attendre qu'un element apparaisse
# =============================================================================
function Wait-ForElement {
    <#
    .SYNOPSIS
        Attend qu'un element apparaisse sur l'ecran
    .OUTPUTS
        Hashtable - Element trouve ou erreur
    #>
    param(
        [string]$Text,
        [string]$TextContains,
        [string]$ContentDesc,
        [int]$TimeoutSeconds = 10
    )
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $element = Find-UIElement -Text $Text -TextContains $TextContains -ContentDesc $ContentDesc
        if ($element.Found) {
            return $element
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    
    return @{ Found = $false; Error = "Timeout: element non trouve apres ${TimeoutSeconds}s" }
}

# =============================================================================
# FONCTION: Scroll jusqu'a trouver un element
# =============================================================================
function Scroll-ToElement {
    <#
    .SYNOPSIS
        Scroll jusqu'a trouver un element
    .OUTPUTS
        Hashtable - Element trouve ou erreur
    #>
    param(
        [string]$Text,
        [string]$TextContains,
        [int]$MaxScrolls = 5,
        [string]$Direction = "down"  # "down" ou "up"
    )
    
    for ($i = 0; $i -lt $MaxScrolls; $i++) {
        $element = Find-UIElement -Text $Text -TextContains $TextContains
        if ($element.Found) {
            return $element
        }
        
        # Scroll
        if ($Direction -eq "down") {
            & $script:ADB -s $script:DEVICE shell "input swipe 540 1500 540 500 300" 2>$null
        } else {
            & $script:ADB -s $script:DEVICE shell "input swipe 540 500 540 1500 300" 2>$null
        }
        Start-Sleep -Milliseconds 500
    }
    
    return @{ Found = $false; Error = "Element non trouve apres $MaxScrolls scrolls" }
}

# =============================================================================
# FONCTION: Ouvrir Expo Go
# =============================================================================
function Open-ExpoGo {
    & $script:ADB -s $script:DEVICE shell "am start -n host.exp.exponent/.experience.HomeActivity" 2>$null
    Start-Sleep -Seconds 2
    return (Get-CurrentScreen) -eq "expo-home"
}

# =============================================================================
# FONCTION: Ouvrir Swift App depuis Expo
# =============================================================================
function Open-SwiftApp {
    $screen = Get-CurrentScreen
    
    # Si deja dans Swift App
    if ($screen -eq "day" -or $screen -like "wizard*") {
        return $true
    }
    
    # Si sur Android home, ouvrir Expo Go
    if ($screen -eq "android-home" -or $screen -eq "lock-screen") {
        Open-ExpoGo | Out-Null
        Start-Sleep -Seconds 2
    }
    
    # Maintenant on devrait etre sur Expo Home
    $swiftApp = Find-UIElement -Text "Swift App"
    if ($swiftApp.Found) {
        & $script:ADB -s $script:DEVICE shell "input tap $($swiftApp.CenterX) $($swiftApp.CenterY)"
        Start-Sleep -Seconds 3
        return (Get-CurrentScreen) -eq "day"
    }
    
    return $false
}

# =============================================================================
# FONCTION: Ouvrir le wizard de creation de job
# =============================================================================
function Open-CreateJobWizard {
    $screen = Get-CurrentScreen
    
    if ($screen -like "wizard*") {
        return $true  # Deja dans le wizard
    }
    
    if ($screen -ne "day") {
        Write-Host "  [WARN] Pas sur la page Day, ecran actuel: $screen" -ForegroundColor Yellow
        return $false
    }
    
    # Chercher le FAB (bouton +) - element clickable en bas a droite
    $xml = Get-CurrentUI
    $fabPattern = 'clickable="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
    $matches = [regex]::Matches($xml, $fabPattern)
    
    $bestFab = $null
    $maxY = 0
    
    foreach ($match in $matches) {
        $fullMatch = $match.Value
        if ($fullMatch -match 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
            $y1 = [int]$Matches[2]
            $x1 = [int]$Matches[1]
            
            # FAB: en bas (Y > 1500) et a droite (X > 700)
            if ($y1 -gt 1500 -and $x1 -gt 700) {
                $x2 = [int]$Matches[3]
                $y2 = [int]$Matches[4]
                $centerY = ($y1 + $y2) / 2
                
                if ($centerY -gt $maxY) {
                    $maxY = $centerY
                    $bestFab = @{
                        CenterX = [int](($x1 + $x2) / 2)
                        CenterY = [int]$centerY
                    }
                }
            }
        }
    }
    
    if (-not $bestFab) {
        Write-Host "  [ERROR] FAB non trouve" -ForegroundColor Red
        return $false
    }
    
    Write-Host "  FAB detecte a ($($bestFab.CenterX), $($bestFab.CenterY))" -ForegroundColor Gray
    & $script:ADB -s $script:DEVICE shell "input tap $($bestFab.CenterX) $($bestFab.CenterY)"
    Start-Sleep -Seconds 2
    
    $newScreen = Get-CurrentScreen
    return ($newScreen -like "wizard*")
}

# =============================================================================
# EXPORT pour usage dans d'autres scripts
# =============================================================================
Write-Host "UI Detector charge - Fonctions disponibles:" -ForegroundColor Cyan
Write-Host "  - Get-CurrentUI          : Capture l'ecran" -ForegroundColor Gray
Write-Host "  - Find-UIElement         : Trouve un element" -ForegroundColor Gray
Write-Host "  - Click-UIElement        : Clique sur un element" -ForegroundColor Gray
Write-Host "  - Input-UIText           : Saisit du texte" -ForegroundColor Gray
Write-Host "  - Test-UIElement         : Verifie presence" -ForegroundColor Gray
Write-Host "  - Get-CurrentScreen      : Detecte l'ecran actuel" -ForegroundColor Gray
Write-Host "  - Wait-ForScreen         : Attend un ecran" -ForegroundColor Gray
Write-Host "  - Wait-ForElement        : Attend un element" -ForegroundColor Gray
Write-Host "  - Scroll-ToElement       : Scroll pour trouver" -ForegroundColor Gray

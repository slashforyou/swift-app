# Script de test incremental
# Usage: .\scripts\test-action.ps1 -Action "tap" -X 540 -Y 884
#        .\scripts\test-action.ps1 -Action "key" -Key "KEYCODE_BACK"
#        .\scripts\test-action.ps1 -Action "text" -Text "Hello"
#        .\scripts\test-action.ps1 -Action "dump"
#        .\scripts\test-action.ps1 -Action "find" -Text "Today"

param(
    [ValidateSet("tap", "key", "text", "swipe", "dump", "find", "launch")]
    [string]$Action = "dump",
    [int]$X = 0,
    [int]$Y = 0,
    [int]$X2 = 0,
    [int]$Y2 = 0,
    [string]$Key = "",
    [string]$Text = ""
)

$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$DEVICE = "192.168.0.250:36561"

# Connexion
$devices = & $ADB devices 2>&1
if ($devices -notmatch $DEVICE) {
    Write-Host "Connexion a $DEVICE..." -ForegroundColor Yellow
    & $ADB connect $DEVICE | Out-Null
}

function Get-Screen {
    & $ADB shell uiautomator dump /sdcard/ui.xml 2>&1 | Out-Null
    & $ADB pull /sdcard/ui.xml logs/ui_test.xml 2>&1 | Out-Null
    return [xml](Get-Content logs/ui_test.xml -Raw)
}

function Show-Screen {
    $ui = Get-Screen
    Write-Host "`n=== ECRAN ACTUEL ===" -ForegroundColor Cyan
    
    $texts = @()
    $ui.SelectNodes("//*[@text!='']") | ForEach-Object {
        $texts += $_.text
    }
    
    # Elements clickables
    $clickables = $ui.SelectNodes("//*[@clickable='true']")
    
    Write-Host "Textes visibles:" -ForegroundColor Green
    $texts | Select-Object -Unique | ForEach-Object { Write-Host "  - $_" }
    
    Write-Host "`nElements clickables:" -ForegroundColor Yellow
    foreach ($el in $clickables) {
        $desc = if ($el.'content-desc') { $el.'content-desc' } else { $el.text }
        if ($desc) {
            Write-Host "  [$($el.bounds)] $desc"
        }
    }
}

function Find-Element {
    param([string]$SearchText)
    $ui = Get-Screen
    
    Write-Host "`nRecherche de '$SearchText'..." -ForegroundColor Cyan
    
    $found = $ui.SelectNodes("//*[contains(@text, '$SearchText') or contains(@content-desc, '$SearchText')]")
    
    if ($found.Count -eq 0) {
        Write-Host "  Pas trouve!" -ForegroundColor Red
        return
    }
    
    foreach ($el in $found) {
        $text = if ($el.text) { $el.text } else { $el.'content-desc' }
        $bounds = $el.bounds
        
        if ($bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
            Write-Host "  TROUVE: '$text'" -ForegroundColor Green
            Write-Host "    Bounds: $bounds" -ForegroundColor Gray
            Write-Host "    Centre: ($cx, $cy)" -ForegroundColor Yellow
            Write-Host "    Commande: .\scripts\test-action.ps1 -Action tap -X $cx -Y $cy" -ForegroundColor Magenta
        }
    }
}

switch ($Action) {
    "tap" {
        Write-Host "TAP sur ($X, $Y)..." -ForegroundColor Yellow
        & $ADB shell input tap $X $Y
        Start-Sleep -Milliseconds 500
        Show-Screen
    }
    
    "key" {
        Write-Host "KEY: $Key..." -ForegroundColor Yellow
        & $ADB shell input keyevent $Key
        Start-Sleep -Milliseconds 500
        Show-Screen
    }
    
    "text" {
        Write-Host "TEXT: $Text..." -ForegroundColor Yellow
        $escaped = $Text -replace '@', '\@' -replace ' ', '%s'
        & $ADB shell input text $escaped
        Start-Sleep -Milliseconds 300
    }
    
    "swipe" {
        if ($X2 -eq 0) { $X2 = $X }
        if ($Y2 -eq 0) { $Y2 = $Y - 500 }
        Write-Host "SWIPE de ($X, $Y) vers ($X2, $Y2)..." -ForegroundColor Yellow
        & $ADB shell input swipe $X $Y $X2 $Y2 300
        Start-Sleep -Milliseconds 500
        Show-Screen
    }
    
    "dump" {
        Show-Screen
    }
    
    "find" {
        Find-Element -SearchText $Text
    }
    
    "launch" {
        Write-Host "Lancement de l'app..." -ForegroundColor Yellow
        & $ADB shell am start -a android.intent.action.VIEW -d "exp://192.168.0.51:8081"
        Start-Sleep -Seconds 2
        Show-Screen
    }
}

# Script pour naviguer et cliquer sur le FAB
param([switch]$Debug)

$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Click {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    
    [DllImport("user32.dll")]
    public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);
    
    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);
    
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
    
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X, Y; }
}
"@

function Get-UI {
    & $ADB shell uiautomator dump /sdcard/ui.xml 2>$null | Out-Null
    & $ADB pull /sdcard/ui.xml logs/ui_nav.xml 2>$null | Out-Null
    return [xml](Get-Content logs/ui_nav.xml -Raw)
}

function Invoke-Tap {
    param([int]$PhoneX, [int]$PhoneY, [string]$Desc = "")
    
    $proc = Get-Process scrcpy -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "SwiftApp-Test" }
    if (-not $proc) {
        Write-Host "ERROR: scrcpy not found" -ForegroundColor Red
        return
    }
    
    $hwnd = $proc.MainWindowHandle
    
    $clientRect = New-Object Click+RECT
    [Click]::GetClientRect($hwnd, [ref]$clientRect) | Out-Null
    
    $origin = New-Object Click+POINT
    $origin.X = 0; $origin.Y = 0
    [Click]::ClientToScreen($hwnd, [ref]$origin) | Out-Null
    
    $scaleX = $clientRect.Right / 1080
    $scaleY = $clientRect.Bottom / 2340
    
    $screenX = $origin.X + [int]($PhoneX * $scaleX)
    $screenY = $origin.Y + [int]($PhoneY * $scaleY)
    
    if ($Debug) { Write-Host "  Tap ($PhoneX, $PhoneY) -> screen ($screenX, $screenY) $Desc" -ForegroundColor DarkGray }
    
    [Click]::SetForegroundWindow($hwnd) | Out-Null
    Start-Sleep -Milliseconds 300
    [Click]::SetCursorPos($screenX, $screenY) | Out-Null
    Start-Sleep -Milliseconds 200
    [Click]::mouse_event([Click]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 100
    [Click]::mouse_event([Click]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 500
}

function Get-ElementBounds {
    param([xml]$UI, [string]$Text)
    $node = $UI.SelectSingleNode("//*[contains(@text, '$Text')]")
    if ($node -and $node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
        return @{
            X = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            Y = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
        }
    }
    return $null
}

Write-Host "=== Navigation Test ===" -ForegroundColor Cyan

# 1. Verifier l'ecran actuel
Write-Host "`n1. Checking current screen..."
$ui = Get-UI

$hasJobs = $ui.SelectSingleNode("//*[contains(@text, 'Jobs & Filters')]")
$hasToday = $ui.SelectSingleNode("//*[contains(@text, 'Today')]")
$hasWizard = $ui.SelectSingleNode("//*[contains(@text, 'Create New Job')]")

if ($hasWizard) {
    Write-Host "   Already on Create Job wizard!" -ForegroundColor Green
    exit 0
}

if ($hasJobs) {
    Write-Host "   On Jobs screen" -ForegroundColor Green
} elseif ($hasToday) {
    Write-Host "   On Home screen, navigating to Jobs..."
    $pos = Get-ElementBounds -UI $ui -Text "Today"
    if ($pos) {
        Invoke-Tap -PhoneX $pos.X -PhoneY $pos.Y -Desc "Today card"
        Start-Sleep -Seconds 2
        $ui = Get-UI
    }
}

# 2. Chercher le FAB
Write-Host "`n2. Looking for FAB button..."
$ui = Get-UI

# Le FAB est en bas a droite, cherchons les elements clickables
$clickables = $ui.SelectNodes("//*[@clickable='true']")
$fab = $null
foreach ($el in $clickables) {
    if ($el.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
        $x1 = [int]$Matches[1]
        $y1 = [int]$Matches[2]
        $x2 = [int]$Matches[3]
        $y2 = [int]$Matches[4]
        # FAB est en bas (y > 1700) et a droite (x > 800)
        if ($y1 -gt 1700 -and $x1 -gt 800) {
            $fab = @{
                X = [int](($x1 + $x2) / 2)
                Y = [int](($y1 + $y2) / 2)
            }
            if ($Debug) { Write-Host "   Found FAB at bounds [$x1,$y1][$x2,$y2]" -ForegroundColor DarkGray }
        }
    }
}

if (-not $fab) {
    Write-Host "   FAB not found!" -ForegroundColor Red
    Write-Host "   Screen contents:" -ForegroundColor Yellow
    $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text } | Select-Object -First 10
    exit 1
}

Write-Host "   FAB found at ($($fab.X), $($fab.Y))" -ForegroundColor Green

# 3. Cliquer sur le FAB
Write-Host "`n3. Clicking FAB..."
Invoke-Tap -PhoneX $fab.X -PhoneY $fab.Y -Desc "FAB button"

Start-Sleep -Seconds 2

# 4. Verifier le resultat
Write-Host "`n4. Checking result..."
$ui = Get-UI

$wizard = $ui.SelectSingleNode("//*[contains(@text, 'Create New Job')]")
if ($wizard) {
    Write-Host "   SUCCESS! Create Job wizard is open!" -ForegroundColor Green
} else {
    Write-Host "   FAILED - Wizard not opened" -ForegroundColor Red
    Write-Host "   Current screen:" -ForegroundColor Yellow
    $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text } | Select-Object -First 10
}

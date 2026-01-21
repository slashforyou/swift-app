# Click on Add Client button
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ClickHelper {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
}
"@

$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"

Write-Host "Dumping UI..."
& $ADB shell uiautomator dump /sdcard/ui.xml 2>$null | Out-Null
& $ADB pull /sdcard/ui.xml logs/ui_add.xml 2>$null | Out-Null
[xml]$ui = Get-Content logs/ui_add.xml -Raw

# Trouver "Add Client"
$node = $ui.SelectSingleNode("//*[contains(@text, 'Add Client')]")
if (-not $node) {
    Write-Host "Add Client not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found Add Client with bounds: $($node.bounds)"

if ($node.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $x = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
    $y = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
    Write-Host "Add Client center at phone coords ($x, $y)"
    
    $proc = Get-Process scrcpy -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "SwiftApp-Test" }
    if (-not $proc) {
        Write-Host "scrcpy not found!" -ForegroundColor Red
        exit 1
    }
    
    $hwnd = $proc.MainWindowHandle
    Write-Host "scrcpy handle: $hwnd"
    
    $clientRect = New-Object ClickHelper+RECT
    [ClickHelper]::GetClientRect($hwnd, [ref]$clientRect) | Out-Null
    Write-Host "Client size: $($clientRect.Right) x $($clientRect.Bottom)"
    
    $origin = New-Object ClickHelper+POINT
    $origin.X = 0; $origin.Y = 0
    [ClickHelper]::ClientToScreen($hwnd, [ref]$origin) | Out-Null
    Write-Host "Client origin: ($($origin.X), $($origin.Y))"
    
    $scaleX = $clientRect.Right / 1080
    $scaleY = $clientRect.Bottom / 2340
    Write-Host "Scale: $scaleX x $scaleY"
    
    $screenX = $origin.X + [int]($x * $scaleX)
    $screenY = $origin.Y + [int]($y * $scaleY)
    Write-Host "Screen coords: ($screenX, $screenY)"
    
    Write-Host "`nBringing window to foreground..."
    [ClickHelper]::SetForegroundWindow($hwnd) | Out-Null
    Start-Sleep -Seconds 1
    
    Write-Host "Moving cursor..."
    [ClickHelper]::SetCursorPos($screenX, $screenY) | Out-Null
    Start-Sleep -Milliseconds 500
    
    Write-Host "Clicking..."
    [ClickHelper]::mouse_event([ClickHelper]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 100
    [ClickHelper]::mouse_event([ClickHelper]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    
    Write-Host "`nDone! Checking result..."
    Start-Sleep -Seconds 2
    
    & $ADB shell uiautomator dump /sdcard/ui.xml 2>$null | Out-Null
    & $ADB pull /sdcard/ui.xml logs/ui_result.xml 2>$null | Out-Null
    [xml]$ui2 = Get-Content logs/ui_result.xml -Raw
    
    $firstName = $ui2.SelectSingleNode("//*[contains(@text, 'First Name')]")
    if ($firstName) {
        Write-Host "SUCCESS! Add Client form opened!" -ForegroundColor Green
    } else {
        Write-Host "Form not opened. Current screen:" -ForegroundColor Red
        $ui2.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text } | Select-Object -First 10
    }
}

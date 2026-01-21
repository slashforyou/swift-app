# Test avec PostMessage au lieu de mouse_event
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinMsg {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP = 0x0202;
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
    
    public static IntPtr MakeLParam(int x, int y) {
        return (IntPtr)((y << 16) | (x & 0xffff));
    }
}
"@

$proc = Get-Process scrcpy -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "SwiftApp-Test" }
if (-not $proc) {
    Write-Host "scrcpy not found!" -ForegroundColor Red
    exit 1
}

$hwnd = $proc.MainWindowHandle
Write-Host "scrcpy handle: $hwnd"

# Coords for Add Client on phone (582, 1382) 
$phoneX = 582
$phoneY = 1382

$clientRect = New-Object WinMsg+RECT
[WinMsg]::GetClientRect($hwnd, [ref]$clientRect) | Out-Null
Write-Host "Client size: $($clientRect.Right) x $($clientRect.Bottom)"

$origin = New-Object WinMsg+POINT
$origin.X = 0; $origin.Y = 0
[WinMsg]::ClientToScreen($hwnd, [ref]$origin) | Out-Null
Write-Host "Client origin: ($($origin.X), $($origin.Y))"

# Convert phone coords to client coords (not screen)
$clientX = [int]($phoneX * $clientRect.Right / 1080)
$clientY = [int]($phoneY * $clientRect.Bottom / 2340)
Write-Host "Client coords for click: ($clientX, $clientY)"

# Also calculate screen coords
$screenX = $origin.X + $clientX
$screenY = $origin.Y + $clientY
Write-Host "Screen coords: ($screenX, $screenY)"

# Activate window
Write-Host "`nActivating window..."
[WinMsg]::ShowWindow($hwnd, 9) | Out-Null  # SW_RESTORE
[WinMsg]::SetForegroundWindow($hwnd) | Out-Null
[WinMsg]::BringWindowToTop($hwnd) | Out-Null
Start-Sleep -Seconds 1

$fg = [WinMsg]::GetForegroundWindow()
Write-Host "Foreground: $fg (target: $hwnd, match: $($fg -eq $hwnd))"

# Method 1: mouse_event (requires cursor at right position)
Write-Host "`nMethod 1: mouse_event..."
[WinMsg]::SetCursorPos($screenX, $screenY) | Out-Null
Start-Sleep -Milliseconds 300
[WinMsg]::mouse_event([WinMsg]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 100
[WinMsg]::mouse_event([WinMsg]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

Write-Host "Click sent via mouse_event"

Start-Sleep -Seconds 2

# Check result
$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
& $ADB shell uiautomator dump /sdcard/ui.xml 2>$null | Out-Null
& $ADB pull /sdcard/ui.xml logs/ui_msg.xml 2>$null | Out-Null
[xml]$ui = Get-Content logs/ui_msg.xml -Raw

$firstName = $ui.SelectSingleNode("//*[contains(@text, 'First Name')]")
if ($firstName) {
    Write-Host "SUCCESS! Form opened!" -ForegroundColor Green
} else {
    Write-Host "Form not opened" -ForegroundColor Red
    $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text } | Select-Object -First 8
    
    # Method 2: PostMessage
    Write-Host "`nMethod 2: PostMessage..."
    $lParam = [WinMsg]::MakeLParam($clientX, $clientY)
    [WinMsg]::PostMessage($hwnd, [WinMsg]::WM_LBUTTONDOWN, [IntPtr]::Zero, $lParam)
    Start-Sleep -Milliseconds 100
    [WinMsg]::PostMessage($hwnd, [WinMsg]::WM_LBUTTONUP, [IntPtr]::Zero, $lParam)
    
    Write-Host "Click sent via PostMessage"
    
    Start-Sleep -Seconds 2
    
    & $ADB shell uiautomator dump /sdcard/ui.xml 2>$null | Out-Null
    & $ADB pull /sdcard/ui.xml logs/ui_msg2.xml 2>$null | Out-Null
    [xml]$ui2 = Get-Content logs/ui_msg2.xml -Raw
    
    $firstName2 = $ui2.SelectSingleNode("//*[contains(@text, 'First Name')]")
    if ($firstName2) {
        Write-Host "SUCCESS with PostMessage!" -ForegroundColor Green
    } else {
        Write-Host "Still not working" -ForegroundColor Red
        $ui2.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text } | Select-Object -First 8
    }
}

# Force focus and click
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class ForceFocus {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const int SW_SHOW = 5;
    public const byte VK_MENU = 0x12;
    public const uint KEYEVENTF_KEYUP = 0x0002;
    
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
    
    public static void ForceBringToFront(IntPtr hWnd) {
        uint foreThread = 0;
        uint appThread = GetCurrentThreadId();
        
        IntPtr foreWnd = GetForegroundWindow();
        uint processId;
        foreThread = GetWindowThreadProcessId(foreWnd, out processId);
        
        if (foreThread != appThread) {
            AttachThreadInput(foreThread, appThread, true);
            BringWindowToTop(hWnd);
            ShowWindow(hWnd, SW_SHOW);
            AttachThreadInput(foreThread, appThread, false);
        } else {
            BringWindowToTop(hWnd);
            ShowWindow(hWnd, SW_SHOW);
        }
        
        // Alt key trick to bypass Windows focus protection
        keybd_event(VK_MENU, 0, 0, 0);
        SetForegroundWindow(hWnd);
        keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0);
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

$clientRect = New-Object ForceFocus+RECT
[ForceFocus]::GetClientRect($hwnd, [ref]$clientRect) | Out-Null

$origin = New-Object ForceFocus+POINT
$origin.X = 0; $origin.Y = 0
[ForceFocus]::ClientToScreen($hwnd, [ref]$origin) | Out-Null

$screenX = $origin.X + [int]($phoneX * $clientRect.Right / 1080)
$screenY = $origin.Y + [int]($phoneY * $clientRect.Bottom / 2340)
Write-Host "Target screen coords: ($screenX, $screenY)"

# Force focus
Write-Host "Forcing focus..."
[ForceFocus]::ForceBringToFront($hwnd)
Start-Sleep -Seconds 1

$fg = [ForceFocus]::GetForegroundWindow()
Write-Host "Foreground now: $fg (target: $hwnd, match: $($fg -eq $hwnd))"

# Click
Write-Host "Moving cursor and clicking..."
[ForceFocus]::SetCursorPos($screenX, $screenY) | Out-Null
Start-Sleep -Milliseconds 300
[ForceFocus]::mouse_event([ForceFocus]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 100
[ForceFocus]::mouse_event([ForceFocus]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

Write-Host "Click sent!"

Start-Sleep -Seconds 2

# Check
$ADB = "C:\Users\romai\AppData\Local\Android\Sdk\platform-tools\adb.exe"
& $ADB shell uiautomator dump /sdcard/ui.xml 2>$null | Out-Null
& $ADB pull /sdcard/ui.xml logs/ui_force.xml 2>$null | Out-Null
[xml]$ui = Get-Content logs/ui_force.xml -Raw

$firstName = $ui.SelectSingleNode("//*[contains(@text, 'First Name')]")
if ($firstName) {
    Write-Host "SUCCESS!" -ForegroundColor Green
} else {
    Write-Host "Form not opened" -ForegroundColor Red
    $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text } | Select-Object -First 8
}

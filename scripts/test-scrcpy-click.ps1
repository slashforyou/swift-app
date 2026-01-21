# Test simple de clic sur scrcpy
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class MouseClick {
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

Write-Host "Searching for scrcpy window..."
$proc = Get-Process scrcpy -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "SwiftApp-Test" }
if (-not $proc) {
    Write-Host "Scrcpy window 'SwiftApp-Test' not found!"
    exit 1
}

$hwnd = $proc.MainWindowHandle
Write-Host "Handle: $hwnd"

# Client rect
$clientRect = New-Object MouseClick+RECT
[MouseClick]::GetClientRect($hwnd, [ref]$clientRect) | Out-Null
Write-Host "Client size: $($clientRect.Right) x $($clientRect.Bottom)"

# Origin
$origin = New-Object MouseClick+POINT
$origin.X = 0
$origin.Y = 0
[MouseClick]::ClientToScreen($hwnd, [ref]$origin) | Out-Null
Write-Host "Client origin: ($($origin.X), $($origin.Y))"

# FAB coords (948, 1896 sur 1080x2340)
$phoneW = 1080
$phoneH = 2340
$fabX = 948
$fabY = 1896

$scaleX = $clientRect.Right / $phoneW
$scaleY = $clientRect.Bottom / $phoneH
Write-Host "Scale: $scaleX x $scaleY"

$screenX = $origin.X + [int]($fabX * $scaleX)
$screenY = $origin.Y + [int]($fabY * $scaleY)
Write-Host "Target screen coords: ($screenX, $screenY)"

# Mettre la fenetre au premier plan
Write-Host "`nBringing window to foreground..."
[MouseClick]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Seconds 1

# Deplacer le curseur
Write-Host "Moving cursor to ($screenX, $screenY)..."
[MouseClick]::SetCursorPos($screenX, $screenY) | Out-Null
Start-Sleep -Milliseconds 500

# Cliquer
Write-Host "Clicking..."
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
Start-Sleep -Milliseconds 100
[MouseClick]::mouse_event([MouseClick]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)

Write-Host "`nDone! Check if the Create Job wizard opened on the phone."

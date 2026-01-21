cd "C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\MANUAL_TESTS\01_JOB_COMPLETE_FLOW"

# Importer les utils
. "..\shared\utils.ps1"

# Initialiser ADB
if (-not $global:ADB) {
    $global:ADB = "adb"
}

Write-Host "=== NAVIGATION MANUELLE VERS FORMULAIRE CLIENT ==="

# Etape 1: Clic sur Today (essayons differentes positions)
Write-Host "1. Clic sur Today..."
adb shell input tap 540 700  # Position approximative
Start-Sleep 2

# Etape 2: Clic sur FAB (bouton +)
Write-Host "2. Clic sur FAB..."  
adb shell input tap 948 1896  # Position connue du FAB
Start-Sleep 2

# Etape 3: Clic sur Add Client
Write-Host "3. Clic sur Add Client..."
adb shell input tap 540 1200  # Position approximative
Start-Sleep 2

Write-Host "Navigation terminee. Verification de l'etat..."

# Capture pour verification
adb shell uiautomator dump /sdcard/ui_manual_nav.xml
adb pull /sdcard/ui_manual_nav.xml logs\ui_manual_nav.xml

Write-Host "Capture sauvegardee dans logs\ui_manual_nav.xml"
cd "C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\MANUAL_TESTS\01_JOB_COMPLETE_FLOW"

# Importer les utils
. "..\shared\utils.ps1"

# Initialiser ADB
if (-not $global:ADB) {
    $global:ADB = "adb"
}

Write-Host "=== TEST DETECTION TODAY ==="

$ui = Get-Screen
if (-not $ui) {
    Write-Host "ERREUR: Impossible de capturer l'ecran"
    exit 1
}

Write-Host "UI capturee, taille: $($ui.Length) caracteres"

$hasToday = Test-ElementExists -Ui $ui -Text "Today"
Write-Host "Test-ElementExists Today: $hasToday"

# Test manuel
if ($ui -match "Today") {
    Write-Host "Recherche manuelle Today: TRUE"
} else {
    Write-Host "Recherche manuelle Today: FALSE"
}
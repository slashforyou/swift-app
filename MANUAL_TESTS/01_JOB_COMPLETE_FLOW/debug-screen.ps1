cd "C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\MANUAL_TESTS\01_JOB_COMPLETE_FLOW"

# Importer les utils
. "..\shared\utils.ps1"

# Initialiser ADB
if (-not $global:ADB) {
    $global:ADB = "adb"
}

Write-Host "=== DEBUG ECRAN ACTUEL ==="

$ui = Get-Screen
if (-not $ui) {
    Write-Host "ERREUR: UI est null ou vide"
    exit 1
}

Write-Host "UI captured, size: $($ui.Length) characters"

# Sauver le XML brut pour analyse
$ui | Out-File -FilePath "logs\debug_ui_raw.xml" -Encoding UTF8
Write-Host "UI sauve dans logs\debug_ui_raw.xml"

# Chercher tous les textes visibles
Write-Host "`n=== RECHERCHE TOUS LES TEXTES ==="
$allTexts = Select-Xml -Xml $ui -XPath "//node[@text != '']" | ForEach-Object { $_.Node.text }
$uniqueTexts = $allTexts | Sort-Object | Get-Unique

if ($uniqueTexts.Count -eq 0) {
    Write-Host "Aucun texte visible trouve"
} else {
    Write-Host "Textes trouves ($($uniqueTexts.Count)):"
    foreach ($text in $uniqueTexts) {
        Write-Host "  - '$text'"
    }
}
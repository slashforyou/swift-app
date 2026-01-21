# Test du step login
. "$PSScriptRoot\..\shared\utils.ps1"
. "$PSScriptRoot\..\shared\config.ps1"

Write-Host "=== TEST LOGIN ===" -ForegroundColor Cyan

# Capturer l'ecran
Write-Host "Capture de l'ecran..." -ForegroundColor Yellow
$ui = Get-Screen

if ($ui) {
    Write-Host "[OK] Ecran capture" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Echec capture" -ForegroundColor Red
    exit 1
}

# Tester detection
Write-Host "`nTests de detection:" -ForegroundColor Yellow
$tests = @(
    "Today",
    "Jobs", 
    "Calendar",
    "Create New Job",
    "Pickup Address"
)

$foundAny = $false
foreach ($text in $tests) {
    $found = Test-ElementExists -Ui $ui -Text $text
    $color = if ($found) { "Green" } else { "Gray" }
    Write-Host "  - '$text': $found" -ForegroundColor $color
    if ($found) { $foundAny = $true }
}

Write-Host "`nResultat: $(if ($foundAny) { 'CONNECTE' } else { 'NON CONNECTE' })" -ForegroundColor $(if ($foundAny) { 'Green' } else { 'Red' })

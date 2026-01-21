# Diagnostic complet du step login
$ErrorActionPreference = "Continue"

Write-Host "=== DIAGNOSTIC LOGIN STEP ===" -ForegroundColor Cyan

# 1. Charger les fonctions
Write-Host ""
Write-Host "1. Chargement des fonctions..." -ForegroundColor Yellow
try {
    . "$PSScriptRoot\..\shared\utils.ps1"
    . "$PSScriptRoot\..\shared\config.ps1"
    Write-Host "[OK] Fonctions chargees" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Erreur chargement: $_" -ForegroundColor Red
    exit 1
}

# 2. Tester Get-Screen
Write-Host ""
Write-Host "2. Test Get-Screen..." -ForegroundColor Yellow
$ui = Get-Screen
if ($ui) {
    Write-Host "[OK] UI capturee" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Get-Screen retourne null" -ForegroundColor Red
    exit 1
}

# 3. Tester la detection d'elements
Write-Host ""
Write-Host "3. Detection elements..." -ForegroundColor Yellow
$elements = @("Today", "Jobs", "Calendar", "Create New Job", "Pickup Address", "Email", "Password")
$found = @()

foreach ($elem in $elements) {
    $result = Test-ElementExists -Ui $ui -Text $elem
    if ($result) {
        Write-Host "  [OK] $elem detecte" -ForegroundColor Green
        $found += $elem
    } else {
        Write-Host "  [ ] $elem non trouve" -ForegroundColor DarkGray
    }
}

# 4. Conclusion
Write-Host ""
Write-Host "4. Conclusion:" -ForegroundColor Yellow
if ($found.Count -gt 0) {
    Write-Host "[OK] Elements detectes: $($found -join ', ')" -ForegroundColor Green
    Write-Host "=> Utilisateur CONNECTE" -ForegroundColor Green
} else {
    Write-Host "[INFO] Aucun element de connexion detecte" -ForegroundColor Yellow
    Write-Host "=> Besoin de se connecter" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== FIN DU DIAGNOSTIC ===" -ForegroundColor Cyan

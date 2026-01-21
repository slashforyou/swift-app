# Suite de tests V2 - Job Complete Flow
# Architecture amelioree avec verification d'etat a chaque etape

param(
    [int]$StartFromStep = 1,
    [int]$StopAtStep = 99,
    [switch]$Debug
)

# Configuration
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\..\shared\config.ps1"
. "$scriptDir\..\shared\utils.ps1"

# Liste des steps
$steps = @(
    @{ Num = 1; Name = "Prerequisites"; Script = "step-01-prerequisites.ps1" }
    @{ Num = 2; Name = "Navigate to Day"; Script = "step-02-navigate-to-day.ps1" }
    @{ Num = 3; Name = "Open Wizard"; Script = "step-03-open-wizard.ps1" }
    @{ Num = 4; Name = "Go to New Client"; Script = "step-04-goto-new-client.ps1" }
    @{ Num = 5; Name = "Fill Client Form"; Script = "step-05-fill-client.ps1" }
    @{ Num = 6; Name = "Fill Pickup Address"; Script = "step-06-fill-pickup.ps1" }
    @{ Num = 7; Name = "Fill Delivery Address"; Script = "step-07-fill-delivery.ps1" }
    @{ Num = 8; Name = "Fill Schedule"; Script = "step-08-fill-schedule.ps1" }
    @{ Num = 9; Name = "Fill Details"; Script = "step-09-fill-details.ps1" }
    @{ Num = 10; Name = "Confirm and Create"; Script = "step-10-confirm-create.ps1" }
    @{ Num = 11; Name = "Validate Job Created"; Script = "step-11-validate.ps1" }
)

# Header
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SWIFT APP - JOB COMPLETE FLOW TEST V2" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Connexion ADB
Write-Host "Connexion ADB..." -ForegroundColor Yellow
$connected = Connect-ADB
if (-not $connected) {
    Write-Host "[FAIL] Device non connecte: $($global:DEVICE)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Device connecte" -ForegroundColor Green

# Stats
$passed = 0
$failed = 0
$skipped = 0
$startTime = Get-Date

# Filtrer les steps
$stepsToRun = $steps | Where-Object { $_.Num -ge $StartFromStep -and $_.Num -le $StopAtStep }

Write-Host ""
Write-Host "Steps a executer: $($stepsToRun.Count)" -ForegroundColor Yellow
Write-Host "De l'etape $StartFromStep a $($stepsToRun[-1].Num)" -ForegroundColor Yellow
Write-Host ""

# Executer les steps
foreach ($step in $stepsToRun) {
    $scriptPath = Join-Path "$scriptDir\steps_v2" $step.Script
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "[SKIP] Step $($step.Num): $($step.Name) - Script non trouve" -ForegroundColor DarkYellow
        $skipped++
        continue
    }
    
    # Executer le step
    $debugParam = if ($Debug) { "-Debug" } else { "" }
    
    try {
        $result = & powershell.exe -ExecutionPolicy Bypass -File $scriptPath $debugParam
        $exitCode = $LASTEXITCODE
    }
    catch {
        Write-Host "[FAIL] Step $($step.Num): $($step.Name) - Exception: $_" -ForegroundColor Red
        $failed++
        break
    }
    
    if ($exitCode -eq 0) {
        $passed++
    }
    else {
        $failed++
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Red
        Write-Host "[FAIL] Test arrete au step $($step.Num): $($step.Name)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Pour reprendre:" -ForegroundColor Yellow
        Write-Host "  .\suite_v2.ps1 -StartFromStep $($step.Num)" -ForegroundColor White
        Write-Host "============================================" -ForegroundColor Red
        break
    }
}

# Resume
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESULTATS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Reussis: $passed" -ForegroundColor Green
Write-Host "  [--] Ignores: $skipped" -ForegroundColor DarkYellow
Write-Host "  [KO] Echoues: $failed" -ForegroundColor Red
Write-Host "  [>>] Duree: $([math]::Round($duration, 2))s" -ForegroundColor Cyan
Write-Host ""

if ($failed -eq 0 -and $passed -gt 0) {
    Write-Host "  *** TOUS LES TESTS PASSES! ***" -ForegroundColor Green
    exit 0
}
else {
    exit 1
}

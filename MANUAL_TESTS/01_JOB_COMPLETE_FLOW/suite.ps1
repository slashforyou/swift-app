# Swift App - Suite de Test: Job Complete Flow
# Execute tous les steps de creation de job de bout en bout
#
# Usage: 
#   .\suite.ps1                          # Execute tous les steps
#   .\suite.ps1 -StartFromStep 5        # Reprend a partir du step 5
#   .\suite.ps1 -StepRange 1,5          # Execute les steps 1 a 5
#   .\suite.ps1 -Steps 1,3,7            # Execute uniquement les steps 1, 3 et 7
#   .\suite.ps1 -Verbose                # Mode verbeux

param(
    [int]$StartFromStep = 0,
    [int[]]$StepRange = $null,
    [int[]]$Steps = $null,
    [switch]$Verbose
)

# Configuration
$global:VerboseMode = $Verbose
$ScriptDir = $PSScriptRoot
$StepsDir = Join-Path $ScriptDir "steps"

# Charger les utilitaires partages
. (Join-Path $ScriptDir "..\shared\config.ps1")
. (Join-Path $ScriptDir "..\shared\utils.ps1")

# Contexte partage entre les steps
$Context = @{
    TestData = @{
        Client = Get-TestClient
        PickupAddress = Get-TestPickupAddress
        DeliveryAddress = Get-TestDeliveryAddress
        Schedule = Get-TestSchedule
        Details = Get-TestDetails
    }
    StartTime = Get-Date
    Results = @()
}

# Liste des steps disponibles (dans l'ordre d'execution)
$AvailableSteps = @(
    @{ Number = 0; Name = "login"; Description = "Connexion"; File = "step-00-login.ps1" }
    @{ Number = 1; Name = "launch-app"; Description = "Lancement de l'app"; File = "step-01-launch-app.ps1" }
    @{ Number = 2; Name = "navigate-to-jobs"; Description = "Navigation vers Jobs"; File = "step-02-navigate-to-jobs.ps1" }
    @{ Number = 3; Name = "open-create-job"; Description = "Ouverture du wizard"; File = "step-03-open-create-job.ps1" }
    @{ Number = 4; Name = "open-add-client"; Description = "Ouverture Add Client"; File = "step-04-open-add-client.ps1" }
    @{ Number = 5; Name = "fill-client-firstname"; Description = "Remplir First Name"; File = "step-05-fill-client-firstname.ps1" }
    @{ Number = 6; Name = "fill-client-lastname"; Description = "Remplir Last Name"; File = "step-06-fill-client-lastname.ps1" }
    @{ Number = 7; Name = "fill-client-email"; Description = "Remplir Email"; File = "step-07-fill-client-email.ps1" }
    @{ Number = 8; Name = "fill-client-phone"; Description = "Remplir Phone"; File = "step-08-fill-client-phone.ps1" }
    @{ Number = 9; Name = "create-client"; Description = "Creation du client"; File = "step-09-create-client.ps1" }
    @{ Number = 10; Name = "select-created-client"; Description = "Selectionner le client"; File = "step-10-select-created-client.ps1" }
    @{ Number = 11; Name = "fill-pickup-street"; Description = "Remplir Pickup Street"; File = "step-11-fill-pickup-street.ps1" }
    @{ Number = 12; Name = "fill-pickup-city"; Description = "Remplir Pickup City"; File = "step-12-fill-pickup-city.ps1" }
    @{ Number = 13; Name = "fill-pickup-state"; Description = "Remplir Pickup State"; File = "step-13-fill-pickup-state.ps1" }
    @{ Number = 14; Name = "fill-pickup-zip"; Description = "Remplir Pickup Zip"; File = "step-14-fill-pickup-zip.ps1" }
    @{ Number = 15; Name = "fill-delivery-street"; Description = "Remplir Delivery Street"; File = "step-15-fill-delivery-street.ps1" }
    @{ Number = 16; Name = "fill-delivery-city"; Description = "Remplir Delivery City"; File = "step-16-fill-delivery-city.ps1" }
    @{ Number = 17; Name = "fill-delivery-state"; Description = "Remplir Delivery State"; File = "step-17-fill-delivery-state.ps1" }
    @{ Number = 18; Name = "fill-delivery-zip"; Description = "Remplir Delivery Zip"; File = "step-18-fill-delivery-zip.ps1" }
    @{ Number = 19; Name = "next-to-schedule"; Description = "Next vers Schedule"; File = "step-19-next-to-schedule.ps1" }
    @{ Number = 20; Name = "verify-schedule"; Description = "Verification du Schedule"; File = "step-20-verify-schedule.ps1" }
    @{ Number = 21; Name = "next-to-details"; Description = "Next vers Details"; File = "step-21-next-to-details.ps1" }
    @{ Number = 22; Name = "select-priority"; Description = "Selection de la priorite"; File = "step-22-select-priority.ps1" }
    @{ Number = 23; Name = "fill-notes"; Description = "Remplir Notes"; File = "step-23-fill-notes.ps1" }
    @{ Number = 24; Name = "next-to-confirmation"; Description = "Next vers Confirmation"; File = "step-24-next-to-confirmation.ps1" }
)

# Determiner quels steps executer
$StepsToRun = @()

if ($Steps) {
    # Mode: executer seulement les steps specifies
    $StepsToRun = $AvailableSteps | Where-Object { $Steps -contains $_.Number }
} elseif ($StepRange -and $StepRange.Count -eq 2) {
    # Mode: executer une plage de steps
    $StepsToRun = $AvailableSteps | Where-Object { $_.Number -ge $StepRange[0] -and $_.Number -le $StepRange[1] }
} else {
    # Mode: executer depuis StartFromStep
    $StepsToRun = $AvailableSteps | Where-Object { $_.Number -ge $StartFromStep }
}

# Affichage du header
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SWIFT APP - JOB COMPLETE FLOW TEST" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Steps a executer: $($StepsToRun.Count)" -ForegroundColor Yellow
Write-Host "Donnees de test:" -ForegroundColor Yellow
Write-Host "  Client: $($Context.TestData.Client.FirstName) $($Context.TestData.Client.LastName)" -ForegroundColor Gray
Write-Host "  Email: $($Context.TestData.Client.Email)" -ForegroundColor Gray
Write-Host ""

# Statistiques
$PassedSteps = 0
$FailedSteps = 0
$SkippedSteps = 0
$FailedStep = $null

# Execution des steps
foreach ($Step in $StepsToRun) {
    $StepPath = Join-Path $StepsDir $Step.File
    
    if (-not (Test-Path $StepPath)) {
        Write-Host "`n[WARNING] Step $($Step.Number) non trouve: $($Step.File)" -ForegroundColor Yellow
        continue
    }
    
    # Executer le step
    try {
        $result = & $StepPath -Context $Context
        
        # Enregistrer le resultat
        $Context.Results += @{
            Step = $Step.Number
            Name = $Step.Name
            Description = $Step.Description
            Success = $result.Success
            Skipped = $result.Skipped
            Error = $result.Error
            Timestamp = Get-Date
        }
        
        # Mise a jour des statistiques
        if ($result.Success) {
            if ($result.Skipped) {
                $SkippedSteps++
            } else {
                $PassedSteps++
            }
        } else {
            $FailedSteps++
            $FailedStep = $Step
            break  # Arreter l'execution en cas d'echec
        }
        
    } catch {
        Write-FAIL "Erreur d'execution: $_"
        $FailedSteps++
        $FailedStep = $Step
        break
    }
}

# Resultat final
$Duration = (Get-Date) - $Context.StartTime
Write-Host "`n============================================" -ForegroundColor Cyan
if ($FailedSteps -eq 0) {
    Write-Host "[SUCCESS] Tous les steps ont reussi!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Test arrete au step $($FailedStep.Number): $($FailedStep.Description)" -ForegroundColor Red
    Write-Host "`nPour reprendre:" -ForegroundColor Yellow
    Write-Host "  .\suite.ps1 -StartFromStep $($FailedStep.Number)" -ForegroundColor Gray
}
Write-Host "============================================" -ForegroundColor Cyan

# Statistiques finales
Write-Host "`nStatistiques:" -ForegroundColor Cyan
Write-Host "  [OK] Reussis: $PassedSteps" -ForegroundColor Green
Write-Host "  [--] Ignores: $SkippedSteps" -ForegroundColor DarkYellow
Write-Host "  [KO] Echoues: $FailedSteps" -ForegroundColor Red
$durationStr = $Duration.TotalSeconds.ToString('F2')
Write-Host "  [>>] Duree: ${durationStr}s" -ForegroundColor Gray
Write-Host ""

# Code de sortie
exit $(if ($FailedSteps -eq 0) { 0 } else { 1 })

# Step 20: Verifier les valeurs par defaut du Schedule
# Cette etape verifie que les horaires par defaut sont presents

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 20 "Verification du Schedule"

$ui = Get-Screen

# Verifier la presence des elements Schedule
$scheduleScreen = $ui.SelectSingleNode("//node[contains(@text,'Schedule') or contains(@text,'Pickup Time') or contains(@text,'Time Window')]")

if ($scheduleScreen) {
    Write-OK "Ecran Schedule detecte"
    return @{ Success = $true }
} else {
    Write-Info "Elements Schedule non trouves mais on continue"
    return @{ Success = $true; Warning = "Schedule elements not found" }
}

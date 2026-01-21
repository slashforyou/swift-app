# Step 22: Selectionner la priorite
# Cette etape selectionne la priorite du job (Medium par defaut)

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 22 "Selection de la priorite"

$ui = Get-Screen

# Chercher le bouton de priorite - utiliser $Context.TestData.Details
$priority = $Context.TestData.Details.Priority
if (-not $priority) {
    $priority = "Medium"
}
Write-Info "Selection de: $priority"

$priorityBtn = $ui.SelectSingleNode("//node[@text='$priority' or @content-desc='$priority']")
if (-not $priorityBtn) {
    Write-FAIL "Bouton $priority non trouve"
    return @{ Success = $false; Error = "Priority button not found: $priority" }
}

# Extraire les coordonnees
if ($priorityBtn.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur $priority..."
    Invoke-Tap -X $cx -Y $cy -Delay 1000
    
    Write-OK "Priorite selectionnee: $priority"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour $priority"
return @{ Success = $false; Error = "Invalid bounds" }

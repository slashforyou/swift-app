# Step 23: Remplir les notes
# Cette etape remplit le champ Notes

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 23 "Remplir Notes"

# Pas de fermeture de clavier - on clique directement sur le champ

$ui = Get-Screen

# Chercher le champ Notes par hint
$fields = $ui.SelectNodes("//node[@hint='Notes' or contains(@hint,'notes') or @hint='Add notes']")
if ($fields.Count -eq 0) {
    # Essayer de trouver un EditText apres le texte "Notes"
    $notesLabel = $ui.SelectSingleNode("//node[@text='Notes']")
    if ($notesLabel) {
        # Le champ est generalement juste en dessous - on scroll
        Write-Info "Label Notes trouve, recherche du champ..."
    }
    Write-FAIL "Champ Notes non trouve"
    return @{ Success = $false; Error = "Notes field not found" }
}

$field = $fields[0]
if ($field.bounds -match "\[(\d+),(\d+)\]\[(\d+),(\d+)\]") {
    $cx = ([int]$matches[1] + [int]$matches[3]) / 2
    $cy = ([int]$matches[2] + [int]$matches[4]) / 2
    
    Write-Info "Clic sur Notes..."
    Invoke-Tap -X $cx -Y $cy -Delay 800
    
    # Vider et saisir
    & $global:ADB shell input keyevent KEYCODE_MOVE_END
    Start-Sleep -Milliseconds 100
    for ($i = 0; $i -lt 50; $i++) { & $global:ADB shell input keyevent KEYCODE_DEL 2>$null }
    Start-Sleep -Milliseconds 200
    
    $notes = $Context.TestData.Details.Notes
    if (-not $notes) {
        $notes = "Test job notes"
    }
    Write-Info "Saisie: $notes"
    Invoke-Input -Value $notes
    Start-Sleep -Milliseconds 500
    
    Write-OK "Notes saisies"
    return @{ Success = $true }
}

Write-FAIL "Bounds invalides pour Notes"
return @{ Success = $false; Error = "Invalid bounds" }

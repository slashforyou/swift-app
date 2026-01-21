# Step 8: Remplir le telephone du client (OPTIONNEL)
# Cette etape remplit le champ Phone si present sur le formulaire

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 8 "Remplir Phone"

# Verification de l'ecran
Write-Info "Verification de l'ecran actuel..."
$ui = Get-Screen

# Verifier qu'on est sur le formulaire client
$hasClientForm = (Test-ElementExists -Ui $ui -Text "First Name") -or 
                 (Test-ElementExists -Ui $ui -Text "Create Client") -or
                 (Test-ElementExists -Ui $ui -Text "Fill in the client")

if (-not $hasClientForm) {
    Write-FAIL "Pas sur le formulaire client"
    return @{ Success = $false; Error = "Not on client form" }
}

Write-Info "Formulaire client detecte"

# Chercher le champ Phone
$field = Find-FieldByHint -Ui $ui -Hint "Phone" -Index 0
if (-not $field) {
    # Essayer avec le 4eme EditText ou label Phone
    $phoneLabel = Find-Element -Ui $ui -Text "Phone"
    if ($phoneLabel) {
        $phoneFields = $ui.SelectNodes("//node[@class='android.widget.EditText']")
        if ($phoneFields.Count -ge 4) {
            $node = $phoneFields[3]
            if ($node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
                $field = @{
                    CenterX = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
                    CenterY = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
                }
            }
        }
    }
}

if (-not $field) {
    # Champ Phone non present sur ce formulaire - c'est OK, on skip
    Write-Info "[SKIP] Champ Phone non present sur ce formulaire"
    return @{ Success = $true; Skipped = $true }
}

# Taper sur le champ
Write-Info "Tap sur Phone..."
Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 500

# Entrer le telephone
Write-Info "Saisie: $($Context.TestClient.Phone)"
Invoke-Input -Text $Context.TestClient.Phone -Delay 500

Write-OK "Telephone saisi"
return @{ Success = $true }

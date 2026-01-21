# Step 7: Remplir l'email du client (OPTIONNEL)
# Cette etape remplit le champ Email si present sur le formulaire

param(
    [hashtable]$Context
)

if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 7 "Remplir Email"

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

# Chercher le champ Email
$field = Find-FieldByHint -Ui $ui -Hint "Email" -Index 0
if (-not $field) {
    # Essayer avec le texte "Email"
    $emailLabel = Find-Element -Ui $ui -Text "Email"
    if ($emailLabel) {
        # Chercher un EditText proche
        $emailFields = $ui.SelectNodes("//node[@class='android.widget.EditText']")
        if ($emailFields.Count -ge 3) {
            $node = $emailFields[2]
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
    # Champ Email non present sur ce formulaire - c'est OK, on skip
    Write-Info "[SKIP] Champ Email non present sur ce formulaire"
    return @{ Success = $true; Skipped = $true }
}

# Taper sur le champ
Write-Info "Tap sur Email..."
Invoke-Tap -X $field.CenterX -Y $field.CenterY -Delay 500

# Entrer l'email
Write-Info "Saisie: $($Context.TestClient.Email)"
Invoke-Input -Text $Context.TestClient.Email -Delay 500

Write-OK "Email saisi"
return @{ Success = $true }

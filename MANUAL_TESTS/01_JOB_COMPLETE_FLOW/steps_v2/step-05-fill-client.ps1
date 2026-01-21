# Step 05: Remplir Client - Saisie des 4 champs + Create
# Remplit firstName, lastName, email, phone et clique sur Create Client

param([switch]$Debug)

. "$PSScriptRoot\..\..\shared\config.ps1"
. "$PSScriptRoot\..\..\shared\utils.ps1"

Write-Step "05" "Remplissage formulaire Client"

# Generer les donnees de test
$timestamp = Get-Date -Format "HHmmss"
$clientData = @{
    FirstName = "Jean"
    LastName = "Dupont"
    Email = "jean.dupont.$timestamp@test.com"
    Phone = "0612345678"
}

Write-Info "Client: $($clientData.FirstName) $($clientData.LastName)"
Write-Info "Email: $($clientData.Email)"

# Capturer l'ecran
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'ecran"
    exit 1
}

# Fonction pour trouver et remplir un champ par son label/hint
function Fill-Field {
    param(
        [string]$FieldName,
        [string]$Value,
        [string]$Hint
    )
    
    Write-Info "Remplissage: $FieldName = $Value"
    
    # Chercher le champ EditText avec le hint correspondant
    $ui = Get-Screen
    $xmlContent = (Get-Content "C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\logs\ui_current.xml" -Raw)
    
    # Chercher le champ par hint
    $pattern = 'class="android.widget.EditText"[^>]*hint="[^"]*' + [regex]::Escape($Hint) + '[^"]*"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
    $match = [regex]::Match($xmlContent, $pattern)
    
    if (-not $match.Success) {
        # Essayer avec le pattern inverse (bounds avant hint)
        $pattern = 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*hint="[^"]*' + [regex]::Escape($Hint) + '[^"]*"[^>]*class="android.widget.EditText"'
        $match = [regex]::Match($xmlContent, $pattern)
    }
    
    if (-not $match.Success) {
        # Chercher par le label au-dessus du champ
        $labelNode = $ui.SelectSingleNode("//*[contains(@text, '$FieldName')]")
        if ($labelNode -and $labelNode.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $labelY = [int]$Matches[4]  # Y bas du label
            
            # Chercher le EditText juste en dessous du label
            $editFields = $ui.SelectNodes("//node[@class='android.widget.EditText']")
            foreach ($field in $editFields) {
                if ($field.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
                    $fieldY = [int]$Matches[2]  # Y haut du champ
                    if ($fieldY -gt $labelY -and ($fieldY - $labelY) -lt 200) {
                        $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
                        $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
                        
                        # Cliquer sur le champ
                        Invoke-Tap $x $y -Delay 300
                        
                        # Vider le champ si necessaire
                        & $global:ADB shell input keyevent KEYCODE_CTRL_A
                        Start-Sleep -Milliseconds 100
                        & $global:ADB shell input keyevent KEYCODE_DEL
                        Start-Sleep -Milliseconds 100
                        
                        # Saisir la valeur
                        Invoke-Input $Value
                        return $true
                    }
                }
            }
        }
        
        Write-Warning "Champ '$FieldName' non trouve par label, tentative par ordre"
        return $false
    }
    
    # Calculer le centre du champ
    $x1 = [int]$match.Groups[1].Value
    $y1 = [int]$match.Groups[2].Value
    $x2 = [int]$match.Groups[3].Value
    $y2 = [int]$match.Groups[4].Value
    $centerX = [math]::Floor(($x1 + $x2) / 2)
    $centerY = [math]::Floor(($y1 + $y2) / 2)
    
    # Cliquer sur le champ
    Invoke-Tap $centerX $centerY -Delay 300
    
    # Vider le champ
    & $global:ADB shell input keyevent KEYCODE_CTRL_A
    Start-Sleep -Milliseconds 100
    & $global:ADB shell input keyevent KEYCODE_DEL
    Start-Sleep -Milliseconds 100
    
    # Saisir la valeur
    Invoke-Input $Value
    return $true
}

# Remplir les 4 champs en sequence
# On clique sur chaque champ, ce qui ferme automatiquement le clavier du precedent

$success = $true

# First Name
if (-not (Fill-Field -FieldName "First Name" -Value $clientData.FirstName -Hint "first name")) {
    # Fallback: chercher le premier EditText
    $ui = Get-Screen
    $editFields = $ui.SelectNodes("//node[@class='android.widget.EditText']")
    if ($editFields.Count -gt 0) {
        $field = $editFields[0]
        if ($field.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
            $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
            Invoke-Tap $x $y -Delay 300
            Invoke-Input $clientData.FirstName
        }
    }
}

# Last Name
if (-not (Fill-Field -FieldName "Last Name" -Value $clientData.LastName -Hint "last name")) {
    $ui = Get-Screen
    $editFields = $ui.SelectNodes("//node[@class='android.widget.EditText']")
    if ($editFields.Count -gt 1) {
        $field = $editFields[1]
        if ($field.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
            $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
            Invoke-Tap $x $y -Delay 300
            Invoke-Input $clientData.LastName
        }
    }
}

# Email
if (-not (Fill-Field -FieldName "Email" -Value $clientData.Email -Hint "email")) {
    $ui = Get-Screen
    $editFields = $ui.SelectNodes("//node[@class='android.widget.EditText']")
    if ($editFields.Count -gt 2) {
        $field = $editFields[2]
        if ($field.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
            $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
            Invoke-Tap $x $y -Delay 300
            Invoke-Input $clientData.Email
        }
    }
}

# Phone
if (-not (Fill-Field -FieldName "Phone" -Value $clientData.Phone -Hint "phone")) {
    $ui = Get-Screen
    $editFields = $ui.SelectNodes("//node[@class='android.widget.EditText']")
    if ($editFields.Count -gt 3) {
        $field = $editFields[3]
        if ($field.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $x = [math]::Floor(([int]$Matches[1] + [int]$Matches[3]) / 2)
            $y = [math]::Floor(([int]$Matches[2] + [int]$Matches[4]) / 2)
            Invoke-Tap $x $y -Delay 300
            Invoke-Input $clientData.Phone
        }
    }
}

Start-Sleep -Seconds 1

# Chercher et cliquer sur le bouton "Create Client"
$ui = Get-Screen
$createBtn = Find-Element -Ui $ui -Text "Create Client"
if (-not $createBtn) {
    $createBtn = Find-Element -Ui $ui -Text "Create"
}

if (-not $createBtn) {
    # Scroller pour voir le bouton
    Write-Info "Scroll pour voir le bouton Create..."
    & $global:ADB shell input swipe 540 1500 540 800 300
    Start-Sleep -Seconds 1
    
    $ui = Get-Screen
    $createBtn = Find-Element -Ui $ui -Text "Create Client"
    if (-not $createBtn) {
        $createBtn = Find-Element -Ui $ui -Text "Create"
    }
}

if (-not $createBtn) {
    Write-FAIL "Bouton Create Client non trouve"
    exit 1
}

Write-Info "Clic sur Create Client..."
Invoke-Tap $createBtn.CenterX $createBtn.CenterY -Delay 3000

# Verifier le resultat
$ui = Get-Screen
$textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }

# Chercher le modal de succes
$hasSuccess = $textsRaw -match "Success|Client created|successfully"
$hasError = $textsRaw -match "Error|Failed|failed"

if ($hasSuccess) {
    Write-OK "Client cree avec succes!"
    
    # Cliquer sur OK pour fermer le modal
    $okBtn = Find-Element -Ui $ui -Text "OK"
    if ($okBtn) {
        Write-Info "Fermeture du modal de succes..."
        Invoke-Tap $okBtn.CenterX $okBtn.CenterY -Delay 1500
    }
    
    exit 0
}

if ($hasError) {
    Write-FAIL "Erreur lors de la creation du client"
    if ($Debug) {
        Write-Debug "Textes: $($textsRaw -join ', ')" -Verbose
    }
    exit 1
}

# Verifier si on est passe a l'ecran Addresses (succes sans modal)
$isOnAddresses = $textsRaw -match "Enter Addresses|Pickup Address|Delivery Address"
if ($isOnAddresses) {
    Write-OK "Client cree - Passage a l'ecran Addresses"
    exit 0
}

if ($Debug) {
    Write-Debug "Textes finaux:" -Verbose
    $textsRaw | ForEach-Object { Write-Debug "  - $_" -Verbose }
}

Write-FAIL "Etat inconnu apres creation client"
exit 1

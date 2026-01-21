# Step 3: Ouverture du modal de creation de job
# Cette etape ouvre le wizard de creation

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 3 "Ouverture du modal de creation"

# Vérifier qu'on est sur la page Today/Day
Write-Info "Vérification de l'écran actuel..."
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'écran"
    return @{ Success = $false; Error = "Screen capture failed" }
}

# Vérifier qu'on est sur l'écran Day (présence du FAB ou "No jobs scheduled")
$hasNoJobs = Test-ElementExists -Ui $ui -Text "No jobs scheduled"
$hasJobsList = Test-ElementExists -Ui $ui -Text "Today" # Page Today affichée

if (-not $hasNoJobs -and -not $hasJobsList) {
    Write-FAIL "Page Today/Day non détectée"
    Write-Info "Écran actuel non compatible avec cette étape"
    return @{ Success = $false; Error = "Today/Day screen not found" }
}

Write-Info "✅ Page Today/Day détectée"

# Chercher le bouton FAB avec content-desc contenant "+" ou l'icône emoji
$fabBtn = $null

# Méthode 1: Chercher par content-desc (icône +)
$fabCandidates = $ui.SelectNodes("//node[@clickable='true' and @content-desc!='']")
foreach ($btn in $fabCandidates) {
    $desc = $btn.GetAttribute("content-desc")
    $bounds = $btn.bounds
    # Le FAB est généralement en bas à droite, avec un content-desc d'icône
    if ($bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
        $x1 = [int]$Matches[1]
        $y1 = [int]$Matches[2]
        # FAB = en bas (Y > 1500) et à droite (X > 700)
        if ($y1 -gt 1500 -and $x1 -gt 700) {
            $fabBtn = $btn
            Write-Info "FAB trouve via content-desc: $desc at bounds=$bounds"
            break
        }
    }
}

# Méthode 2: Si pas trouvé, chercher le dernier bouton en bas à droite
if (-not $fabBtn) {
    $allButtons = $ui.SelectNodes("//node[@clickable='true']")
    Write-Info "Boutons trouves: $($allButtons.Count)"
    
    $maxY = 0
    foreach ($btn in $allButtons) {
        if ($btn.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
            $x1 = [int]$Matches[1]
            $y1 = [int]$Matches[2]
            # FAB = en bas (Y > 1500) et à droite (X > 700)
            if ($y1 -gt 1500 -and $x1 -gt 700 -and $y1 -gt $maxY) {
                $maxY = $y1
                $fabBtn = $btn
            }
        }
    }
}

if (-not $fabBtn) {
    Write-FAIL "Bouton de creation (FAB +) non trouve"
    return @{ Success = $false; Error = "Create FAB button not found" }
}

# Extraire les coordonnees
if ($fabBtn.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    $centerX = ([int]$Matches[1] + [int]$Matches[3]) / 2
    $centerY = ([int]$Matches[2] + [int]$Matches[4]) / 2
    
    Write-Info "Clic sur FAB a ($centerX, $centerY)..."
    Invoke-Tap -X $centerX -Y $centerY -Delay 2000
} else {
    Write-FAIL "Impossible d'extraire les coordonnees"
    return @{ Success = $false }
}

# Verifier que le wizard est ouvert
$ui = Get-Screen
$wizardOpen = (Test-ElementExists -Ui $ui -Text "Add Client") -or 
              (Test-ElementExists -Ui $ui -Text "Select Client")

if ($wizardOpen) {
    Write-OK "Wizard ouvert"
    return @{ Success = $true }
} else {
    Write-FAIL "Wizard non ouvert"
    return @{ Success = $false; Error = "Wizard not opened" }
}

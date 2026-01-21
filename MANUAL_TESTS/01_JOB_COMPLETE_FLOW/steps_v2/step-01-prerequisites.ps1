# Step 01: Prerequisites - Connexion ADB et verification device
# Verifie que le device est connecte et l'app est ouverte

param([switch]$Debug)

. "$PSScriptRoot\..\..\shared\config.ps1"
. "$PSScriptRoot\..\..\shared\utils.ps1"

Write-Step "01" "Prerequisites - Connexion et verification"

# 1. Verifier connexion ADB
Write-Info "Verification connexion ADB..."
$connected = Connect-ADB
if (-not $connected) {
    Write-FAIL "Device non connecte: $($global:DEVICE)"
    exit 1
}
Write-OK "Device connecte: $($global:DEVICE)"

# 2. Capturer l'ecran actuel
Write-Info "Capture de l'ecran..."
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'ecran"
    exit 1
}

# 3. Detecter l'etat actuel
$textsRaw = $ui.SelectNodes("//*[@text!='']") | ForEach-Object { $_.text }
$texts = $textsRaw | Where-Object { $_.Length -gt 1 } | Select-Object -Unique

if ($Debug) {
    Write-Debug "Textes detectes:" -Verbose
    $texts | ForEach-Object { Write-Debug "  - $_" -Verbose }
}

# Determiner la page actuelle
$currentPage = "unknown"

if ($texts -match "No jobs scheduled|Jobs.*Filters|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday") {
    $currentPage = "day"
    Write-OK "Page detectee: Day (calendrier jour)"
}
elseif ($texts -match "Expo Go|Development servers|Recently opened") {
    $currentPage = "expo-home"
    Write-OK "Page detectee: Expo Go Home"
}
elseif ($texts -match "Select Client|Create New Client") {
    $currentPage = "wizard-client"
    Write-OK "Page detectee: Wizard - Select Client"
}
elseif ($texts -match "Enter Addresses|Pickup Address|Delivery Address") {
    $currentPage = "wizard-address"
    Write-OK "Page detectee: Wizard - Addresses"
}
elseif ($texts -match "Schedule|Start Time|End Time") {
    $currentPage = "wizard-schedule"
    Write-OK "Page detectee: Wizard - Schedule"
}
elseif ($texts -match "Job Details|Priority") {
    $currentPage = "wizard-details"
    Write-OK "Page detectee: Wizard - Details"
}
elseif ($texts -match "Confirm Job|Create Job") {
    $currentPage = "wizard-confirmation"
    Write-OK "Page detectee: Wizard - Confirmation"
}
elseif ($texts -match "First Name|Last Name|Email|Phone") {
    $currentPage = "wizard-new-client"
    Write-OK "Page detectee: Wizard - New Client Form"
}
else {
    Write-Info "Page inconnue - textes: $($texts -join ', ')"
}

# Stocker dans le contexte
$global:Context = @{
    CurrentPage = $currentPage
    Timestamp = Get-Date -Format "HHmmss"
    TestData = @{
        Client = @{
            FirstName = "Jean"
            LastName = "Dupont"
            Email = "jean.dupont.$(Get-Date -Format 'HHmmss')@test.com"
            Phone = "0612345678"
        }
        Pickup = @{
            Street = "123 Main Street"
            City = "Sydney"
            State = "NSW"
            Zip = "2000"
        }
        Delivery = @{
            Street = "456 Oak Avenue"
            City = "Melbourne"
            State = "VIC"
            Zip = "3000"
        }
        Schedule = @{
            StartTime = "09:00"
            EndTime = "17:00"
            Duration = "4"
        }
        Details = @{
            Priority = "medium"
            Notes = "Test automatise"
        }
    }
}

Write-OK "Contexte initialise - Page: $currentPage"
exit 0

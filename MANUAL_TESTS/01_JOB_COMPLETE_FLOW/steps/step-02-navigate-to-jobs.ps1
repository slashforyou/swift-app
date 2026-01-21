# Step 2: Navigation vers Today (Day Screen)
# Clique sur la carte "Today" depuis Home pour acceder a la page Day

param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step 2 "Navigation vers Today (Day Screen)"

# Vérifier qu'on est sur l'écran d'accueil Swift
Write-Info "Vérification de l'écran actuel..."
$ui = Get-Screen
if (-not $ui) {
    Write-FAIL "Impossible de capturer l'écran"
    return @{ Success = $false; Error = "Screen capture failed" }
}

# Verifier si on est deja sur l'ecran Day (Jobs & Filters, date du jour, No jobs scheduled)
$hasJobsFilters = Test-ElementExists -Ui $ui -Text "Jobs"
$hasNoJobs = Test-ElementExists -Ui $ui -Text "No jobs scheduled"
$hasDate = $ui -match "(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December)"

if ($hasJobsFilters -or $hasNoJobs -or $hasDate) {
    Write-OK "Deja sur l'ecran Day - navigation ignoree"
    return @{ Success = $true; Skipped = $true }
}

# Vérifier qu'on est sur l'écran d'accueil (Today, Calendar, Business doivent être présents)
$hasToday = Test-ElementExists -Ui $ui -Text "Today"
$hasCalendar = Test-ElementExists -Ui $ui -Text "Calendar"  
$hasBusiness = Test-ElementExists -Ui $ui -Text "Business"

if (-not $hasToday -or -not $hasCalendar -or -not $hasBusiness) {
    Write-FAIL "Écran d'accueil Swift non détecté"
    Write-Info "Today: $hasToday, Calendar: $hasCalendar, Business: $hasBusiness"
    return @{ Success = $false; Error = "Swift home screen not found" }
}

Write-Info "✅ Écran d'accueil Swift détecté"

# Chercher la carte "Today" (cliquable)
$todayCard = Find-Element -Ui $ui -Text "Today"
if (-not $todayCard) {
    Write-FAIL "Carte Today non trouvee"
    return @{ Success = $false; Error = "Today card not found" }
}

# Cliquer sur Today
Write-Info "Clic sur Today..."
Invoke-Tap -X $todayCard.CenterX -Y $todayCard.CenterY -Delay 2000

# Verifier qu'on est sur l'ecran Day (affiche la date complète et "No jobs scheduled")
$ui = Get-Screen
# Utiliser un pattern pour la date (Monday, January 19, 2026 etc.) ou "Jobs & Filters"
$hasDate = $ui -match "(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 2026"
$hasJobsFilters = Test-ElementExists -Ui $ui -Text "Jobs"
$hasNoJobs = Test-ElementExists -Ui $ui -Text "No jobs scheduled"

if ($hasDate -or $hasJobsFilters -or $hasNoJobs) {
    Write-OK "Navigation vers Today reussie - Page Day affichee"
    return @{ Success = $true }
} else {
    Write-FAIL "Ecran Day non detecte"
    return @{ Success = $false; Error = "Day screen not reached" }
}

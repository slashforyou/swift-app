# Script pour diagnostiquer et relancer l'app Swift
. "$PSScriptRoot\..\shared\utils.ps1"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC ET LANCEMENT APP SWIFT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$global:ADB = "adb"

Write-Info "1. Vérification de la connexion ADB"
$devices = & adb devices
Write-Host $devices

Write-Info "`n2. Vérification des apps installées"
$expoInstalled = & adb shell pm list packages | Select-String "exp.exponent"
if ($expoInstalled) {
    Write-Host "✅ Expo installé: $expoInstalled" -ForegroundColor Green
} else {
    Write-Host "❌ Expo non trouvé" -ForegroundColor Red
}

Write-Info "`n3. Tentative de lancement Expo"
& adb shell am start -n host.exp.exponent/host.exp.exponent.LauncherActivity
Start-Sleep -Seconds 3

Write-Info "`n4. Vérification de l'état actuel"
$ui = Get-Screen
if (-not $ui) {
    Write-Error "Impossible de capturer l'UI"
    exit 1
}

Write-Info "Analyse de l'XML..."
$xmlSize = $ui.OuterXml.Length
Write-Info "Taille XML: $xmlSize caractères"

if ($ui.OuterXml.Contains("host.exp.exponent")) {
    Write-Host "✅ App Expo détectée dans l'UI" -ForegroundColor Green
    
    # Chercher des éléments spécifiques
    $elements = @("Today", "Calendar", "Business", "Create New Job", "Home")
    $found = @()
    foreach ($element in $elements) {
        if (Test-ElementExists -Ui $ui -Text $element) {
            $found += $element
        }
    }
    
    if ($found.Count -gt 0) {
        Write-Host "🎯 Éléments trouvés: $($found -join ', ')" -ForegroundColor Green
        Write-Host "🚀 L'app semble fonctionnelle !" -ForegroundColor Green
    } else {
        Write-Host "⚠️ App Expo lancée mais contenu non chargé" -ForegroundColor Yellow
        Write-Info "Tentative de connexion au serveur de développement..."
        & adb shell am start -a android.intent.action.VIEW -d "exp://192.168.0.51:8081"
        Start-Sleep -Seconds 5
        
        $ui2 = Get-Screen
        if (Test-ElementExists -Ui $ui2 -Text "Today") {
            Write-Host "✅ Connexion réussie après reload !" -ForegroundColor Green
        } else {
            Write-Host "❌ Problème de connexion au serveur" -ForegroundColor Red
            Write-Info "Vérifiez que le serveur Metro est bien démarré sur 192.168.0.51:8081"
        }
    }
} else {
    Write-Host "❌ App Expo non détectée" -ForegroundColor Red
    Write-Info "Tentative de lancement forcé..."
    
    # Essayer plusieurs méthodes de lancement
    $commands = @(
        "adb shell am start -n host.exp.exponent/.experience.HomeActivity",
        "adb shell am start -n host.exp.exponent/.LauncherActivity", 
        "adb shell am start host.exp.exponent"
    )
    
    foreach ($cmd in $commands) {
        Write-Info "Test: $cmd"
        Invoke-Expression $cmd
        Start-Sleep -Seconds 2
        
        $ui3 = Get-Screen
        if ($ui3.OuterXml.Contains("host.exp.exponent")) {
            Write-Host "✅ Lancement réussi avec: $cmd" -ForegroundColor Green
            break
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC TERMINÉ" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
# Script pour lancer un build EAS Android
# Version: 1.0.0
# Date: 28 janvier 2026

Write-Host "🚀 Lancement du build EAS Android..." -ForegroundColor Cyan
Write-Host ""

# Vérifier la connexion EAS
Write-Host "✓ Vérification de la connexion EAS..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur: Vous n'êtes pas connecté à EAS" -ForegroundColor Red
    Write-Host "   Exécutez: eas login" -ForegroundColor Yellow
    exit 1
}
Write-Host "   Connecté en tant que: $whoami" -ForegroundColor Green
Write-Host ""

# Afficher les profils disponibles
Write-Host "📋 Profils de build disponibles:" -ForegroundColor Yellow
Write-Host "   1. development - Build de développement (nécessite expo-dev-client)" -ForegroundColor Gray
Write-Host "   2. preview     - Build de test interne (APK)" -ForegroundColor Green
Write-Host "   3. production  - Build de production (AAB pour Play Store)" -ForegroundColor Cyan
Write-Host ""

# Demander le profil
$profile = Read-Host "Choisissez un profil (1-3) [défaut: 2]"
if ([string]::IsNullOrEmpty($profile)) {
    $profile = "2"
}

$profileName = switch ($profile) {
    "1" { "development" }
    "2" { "preview" }
    "3" { "production" }
    default { "preview" }
}

Write-Host ""
Write-Host "✓ Profil sélectionné: $profileName" -ForegroundColor Green
Write-Host ""

# Demander un message de build
$message = Read-Host "Message du build (optionnel)"
Write-Host ""

# Construire la commande
$command = "eas build --platform android --profile $profileName"
if (![string]::IsNullOrEmpty($message)) {
    $command += " --message `"$message`""
}

Write-Host "🔨 Commande à exécuter:" -ForegroundColor Cyan
Write-Host "   $command" -ForegroundColor White
Write-Host ""

# Demander confirmation
$confirm = Read-Host "Lancer le build? (o/n) [défaut: o]"
if ([string]::IsNullOrEmpty($confirm)) {
    $confirm = "o"
}

if ($confirm -ne "o" -and $confirm -ne "O") {
    Write-Host "❌ Build annulé" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Lancement du build..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Exécuter la commande
Invoke-Expression $command

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build lancé avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Suivez l'avancement sur: https://expo.dev/accounts/slash4u/projects/swiftapp/builds" -ForegroundColor White
    Write-Host "   2. Une fois terminé, téléchargez l'APK depuis le dashboard" -ForegroundColor White
    Write-Host "   3. Installez sur votre téléphone Android" -ForegroundColor White
} else {
    Write-Host "❌ Erreur lors du lancement du build" -ForegroundColor Red
    Write-Host "   Code d'erreur: $LASTEXITCODE" -ForegroundColor Yellow
}

Write-Host ""

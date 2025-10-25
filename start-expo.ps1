# Script pour démarrer Expo avec le fix du bug "Body has already been read"

# Nettoyer les processus Node existants (optionnel)
# Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Nettoyer les caches
Write-Host "🧹 Nettoyage des caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .metro -ErrorAction SilentlyContinue

# Définir les variables d'environnement
$env:NODE_OPTIONS = "--no-experimental-fetch"
$env:EXPO_NO_DOCTOR = "1"  # Skip dependency validation

Write-Host "✅ Caches nettoyés" -ForegroundColor Green
Write-Host "🚀 Démarrage d'Expo (skip validation)..." -ForegroundColor Cyan
Write-Host ""

# Démarrer Expo
npx expo start --clear --no-dev

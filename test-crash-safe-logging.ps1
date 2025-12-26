# Script pour tester le système de logging anti-crash
# Usage: .\test-crash-safe-logging.ps1

Write-Host "🧪 === TEST DU SYSTÈME DE LOGGING ANTI-CRASH ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Compilation et exécution du test..." -ForegroundColor Yellow
try {
    # Compiler et exécuter le fichier de test TypeScript
    npx ts-node test-crash-safe-logging.ts
    
    Write-Host ""
    Write-Host "✅ Test terminé avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 === RECHERCHE DU FICHIER DE LOG ===" -ForegroundColor Cyan

# Chercher les fichiers de log récents
$logPatterns = @("*swift-app-session*", "*app-console-logs*", "*.log")
$searchPaths = @(
    $env:USERPROFILE,
    "C:\Users\$env:USERNAME\AppData\Local\Temp",
    (Get-Location).Path
)

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        foreach ($pattern in $logPatterns) {
            $files = Get-ChildItem -Path $path -Filter $pattern -Recurse -ErrorAction SilentlyContinue | 
                     Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-2) }
            
            if ($files) {
                Write-Host "📄 Fichiers de log trouvés dans ${path}:" -ForegroundColor Green
                foreach ($file in $files) {
                    Write-Host "   📄 $($file.FullName) (Modifié: $($file.LastWriteTime))" -ForegroundColor White
                    Write-Host "   📏 Taille: $([math]::Round($file.Length/1KB, 2)) KB" -ForegroundColor Gray
                }
                Write-Host ""
            }
        }
    }
}

Write-Host "💡 === INFORMATIONS POUR DEBUG ===" -ForegroundColor Cyan
Write-Host "Si l'app React Native/Expo est en cours d'exécution:" -ForegroundColor Yellow
Write-Host "1. Le fichier swift-app-session.log sera dans le dossier Documents de l'app"
Write-Host "2. Utilisez le LogViewer dans DevTools pour voir les logs"
Write-Host "3. Les logs de crash seront préservés même après plantage"
Write-Host ""
Write-Host "🔍 Pour tester avec l'app réelle:" -ForegroundColor Yellow
Write-Host "1. Lancez l'app React Native"
Write-Host "2. Déclenchez useStripeConnection"
Write-Host "3. Vérifiez les logs dans le fichier même si l'app plante"
Write-Host ""
Write-Host "🚀 Système de logging robuste activé!" -ForegroundColor Green
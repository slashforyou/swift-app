# Script de test des endpoints backend Swift-App (PowerShell)
# À exécuter localement ou sur le serveur

# Configuration
$baseUrl = "https://altivo.fr/swift-app/v1"
$jobId = "2"
$token = "YOUR_AUTH_TOKEN_HERE"  # À remplacer par un vrai token

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔍 TESTS ENDPOINTS BACKEND SWIFT-APP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $baseUrl"
Write-Host "Job ID: $jobId"
Write-Host ""

# Test 1: Timer Start
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST 1: POST /job/$jobId/start" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected: 200 OK with job started"
Write-Host "Actual:"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/job/$jobId/start" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($response.Content)"
    Write-Host ""
    Write-Host "✅ TEST 1 PASSED" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "Status: $statusCode" -ForegroundColor Red
    Write-Host "Body: $errorBody"
    Write-Host ""
    Write-Host "❌ TEST 1 FAILED" -ForegroundColor Red
    
    if ($errorBody -match "pool\.execute is not a function") {
        Write-Host "🔍 DIAGNOSTIC: pool.execute error détecté" -ForegroundColor Yellow
        Write-Host "Solution: Vérifier si mysql2 est installé ou remplacer execute() par query()" -ForegroundColor Yellow
    }
}
Write-Host ""
Write-Host ""

# Test 2: Step Update to 3
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST 2: POST /job/$jobId/advance-step (step 3)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected: 200 OK with current_step=3"
Write-Host "Actual:"
Write-Host ""

$body2 = @{
    current_step = 3
    notes = "Test step 3"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/job/$jobId/advance-step" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -Body $body2 `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($response.Content)"
    Write-Host ""
    Write-Host "✅ TEST 2 PASSED" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "Status: $statusCode" -ForegroundColor Red
    Write-Host "Body: $errorBody"
    Write-Host ""
    Write-Host "❌ TEST 2 FAILED" -ForegroundColor Red
    
    if ($errorBody -match "Invalid step number") {
        Write-Host "🔍 DIAGNOSTIC: Validation step incorrecte" -ForegroundColor Yellow
        Write-Host "Le step 3 est dans le range 1-5 mais le backend le refuse" -ForegroundColor Yellow
        Write-Host "Solution: Vérifier la validation dans le handler advance-step" -ForegroundColor Yellow
    }
}
Write-Host ""
Write-Host ""

# Test 3: Step Update to 4
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST 3: POST /job/$jobId/advance-step (step 4)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected: 200 OK with current_step=4"
Write-Host "Actual:"
Write-Host ""

$body3 = @{
    current_step = 4
    notes = "Test step 4"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/job/$jobId/advance-step" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -Body $body3 `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($response.Content)"
    Write-Host ""
    Write-Host "✅ TEST 3 PASSED" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "Status: $statusCode" -ForegroundColor Red
    Write-Host "Body: $errorBody"
    Write-Host ""
    Write-Host "❌ TEST 3 FAILED" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 4: Complete Job
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST 4: POST /job/$jobId/complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected: 200 OK with current_step preserved (should be 4 or 5, NOT 99)"
Write-Host "Actual:"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/job/$jobId/complete" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($response.Content)"
    Write-Host ""
    
    if ($response.Content -match '"current_step":99') {
        Write-Host "⚠️  TEST 4 PARTIALLY PASSED" -ForegroundColor Yellow
        Write-Host "Status 200 OK but current_step is 99 instead of preserving real step" -ForegroundColor Yellow
        Write-Host "🔍 DIAGNOSTIC: Backend écrase current_step avec 99" -ForegroundColor Yellow
        Write-Host "Solution: Ne pas modifier current_step lors de la completion" -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ TEST 4 PASSED" -ForegroundColor Green
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host "Status: $statusCode" -ForegroundColor Red
    Write-Host "Body: $errorBody"
    Write-Host ""
    Write-Host "❌ TEST 4 FAILED" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 5: Get Job to verify state
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST 5: GET /job/$jobId (verify state)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/job/$jobId" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $token"
        } `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Current state:"
    
    $job = $response.Content | ConvertFrom-Json
    Write-Host "current_step: $($job.current_step)"
    Write-Host "status: $($job.status)"
    Write-Host "timer_started_at: $($job.timer_started_at)"
}
catch {
    Write-Host "Failed to get job state" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Problèmes détectés:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. POST /job/:id/start → Erreur 500 'pool.execute is not a function'"
Write-Host "   Fix: Installer mysql2 OU remplacer pool.execute() par pool.query()"
Write-Host ""
Write-Host "2. POST /job/:id/advance-step → Erreur 400 'Invalid step number' pour step 3"
Write-Host "   Fix: Vérifier validation, accepter current_step entre 1 et 5"
Write-Host ""
Write-Host "3. POST /job/:id/complete → Retourne 200 mais current_step = 99"
Write-Host "   Fix: Préserver current_step réel, ne pas le remplacer par 99"
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📋 PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Vérifier les logs backend: pm2 logs swift-app"
Write-Host "2. Vérifier la config DB: cat backend/config/database.js"
Write-Host "3. Chercher pool.execute: grep -rn 'pool.execute' backend/"
Write-Host "4. Chercher advance-step handler: grep -rn 'advance-step' backend/routes/"
Write-Host "5. Vérifier l'état en DB: SELECT * FROM jobs WHERE id = $jobId;"
Write-Host ""

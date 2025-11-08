# 🧪 Script de test automatique des endpoints API
# Usage: .\test-api-endpoints.ps1 -Token "VOTRE_TOKEN_ICI"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$JobId = "6",
    
    [Parameter(Mandatory=$false)]
    [string]$JobCode = "JOB-NERD-URGENT-006",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://altivo.fr/swift-app"
)

Write-Host "`n🧪 ========================================" -ForegroundColor Cyan
Write-Host "🧪 TEST AUTOMATIQUE DES ENDPOINTS API" -ForegroundColor Cyan
Write-Host "🧪 ========================================`n" -ForegroundColor Cyan

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   - Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "   - Job ID: $JobId" -ForegroundColor Gray
Write-Host "   - Job Code: $JobCode" -ForegroundColor Gray
Write-Host "   - Token: $($Token.Substring(0, 20))...`n" -ForegroundColor Gray

# Headers communs
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
    "x-client" = "mobile"
}

# Liste des endpoints à tester
$endpoints = @(
    @{ Name = "Test 1"; Url = "$BaseUrl/job/$JobCode/full"; Description = "CODE + /job/.../full" },
    @{ Name = "Test 2"; Url = "$BaseUrl/job/$JobId/full"; Description = "ID + /job/.../full" },
    @{ Name = "Test 3"; Url = "$BaseUrl/v1/job/$JobCode/full"; Description = "CODE + /v1/job/.../full" },
    @{ Name = "Test 4"; Url = "$BaseUrl/v1/job/$JobId/full"; Description = "ID + /v1/job/.../full" },
    @{ Name = "Test 5"; Url = "$BaseUrl/jobs/$JobCode"; Description = "CODE + /jobs/..." },
    @{ Name = "Test 6"; Url = "$BaseUrl/jobs/$JobId"; Description = "ID + /jobs/..." },
    @{ Name = "Test 7"; Url = "$BaseUrl/api/job/$JobCode/full"; Description = "CODE + /api/job/.../full" },
    @{ Name = "Test 8"; Url = "$BaseUrl/api/job/$JobId/full"; Description = "ID + /api/job/.../full" },
    @{ Name = "Test 9"; Url = "$BaseUrl/v1/jobs/$JobCode"; Description = "CODE + /v1/jobs/..." },
    @{ Name = "Test 10"; Url = "$BaseUrl/v1/jobs/$JobId"; Description = "ID + /v1/jobs/..." }
)

$results = @()

foreach ($endpoint in $endpoints) {
    Write-Host "`n$($endpoint.Name): $($endpoint.Description)" -ForegroundColor Cyan
    Write-Host "   URL: $($endpoint.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Headers $headers -Method Get -ErrorAction Stop
        
        $statusCode = $response.StatusCode
        $statusColor = "Green"
        $statusEmoji = "✅"
        
        Write-Host "   $statusEmoji Status: $statusCode" -ForegroundColor $statusColor
        Write-Host "   Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
        Write-Host "   Body Length: $($response.Content.Length) bytes" -ForegroundColor Gray
        
        # Essayer de parser le JSON
        try {
            $json = $response.Content | ConvertFrom-Json
            Write-Host "   JSON Valid: ✅ Yes" -ForegroundColor Green
            
            # Afficher quelques infos clés si disponibles
            if ($json.success) {
                Write-Host "   Success: $($json.success)" -ForegroundColor Green
            }
            if ($json.data) {
                Write-Host "   Has Data: ✅ Yes" -ForegroundColor Green
            }
        } catch {
            Write-Host "   JSON Valid: ❌ No" -ForegroundColor Red
        }
        
        $results += @{
            Test = $endpoint.Name
            Url = $endpoint.Url
            Status = $statusCode
            Success = $true
            Error = $null
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        $statusColor = "Red"
        $statusEmoji = "❌"
        
        if ($statusCode -eq 404) {
            $statusEmoji = "❌"
        } elseif ($statusCode -eq 401) {
            $statusEmoji = "🔐"
        } elseif ($statusCode -eq 500) {
            $statusEmoji = "💥"
        }
        
        Write-Host "   $statusEmoji Status: $statusCode" -ForegroundColor $statusColor
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            Test = $endpoint.Name
            Url = $endpoint.Url
            Status = $statusCode
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Résumé final
Write-Host "`n`n📊 ========================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DES RÉSULTATS" -ForegroundColor Cyan
Write-Host "📊 ========================================`n" -ForegroundColor Cyan

Write-Host "| Test | Status | Result |" -ForegroundColor White
Write-Host "|------|--------|--------|" -ForegroundColor White

foreach ($result in $results) {
    $emoji = if ($result.Success) { "✅" } else { "❌" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    
    Write-Host "| $($result.Test) | $($result.Status) | $emoji |" -ForegroundColor $color
}

# Afficher le(s) endpoint(s) qui fonctionne(nt)
$working = $results | Where-Object { $_.Success -eq $true }

if ($working.Count -gt 0) {
    Write-Host "`n🎉 ENDPOINTS QUI FONCTIONNENT:" -ForegroundColor Green
    foreach ($w in $working) {
        Write-Host "   ✅ $($w.Url)" -ForegroundColor Green
    }
    
    Write-Host "`n💡 SOLUTION:" -ForegroundColor Yellow
    Write-Host "   Utiliser cette URL dans src/services/jobs.ts:" -ForegroundColor Gray
    $firstWorking = $working[0].Url
    $relativeUrl = $firstWorking -replace "https://altivo.fr/swift-app/", ""
    Write-Host "   const fullUrl = `"`${API}$relativeUrl`";" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ AUCUN ENDPOINT NE FONCTIONNE" -ForegroundColor Red
    Write-Host "   Vérifiez:" -ForegroundColor Yellow
    Write-Host "   1. Le token est-il valide?" -ForegroundColor Gray
    Write-Host "   2. Le job ID/Code existe-t-il?" -ForegroundColor Gray
    Write-Host "   3. Le backend expose-t-il cet endpoint?" -ForegroundColor Gray
}

Write-Host "`n"

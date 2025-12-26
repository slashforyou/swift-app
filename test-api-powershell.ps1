# Test PowerShell pour l'API updateJobStep
# Test des différents endpoints et payloads

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer b4a2c90f4affe339a2e1..." # Token depuis les logs
}

$endpoints = @(
    "https://altivo.fr/swift-app/v1/job/123/step",
    "https://altivo.fr/swift-app/v1/jobs/123/step", 
    "https://altivo.fr/swift-app/api/v1/jobs/123/step",
    "https://altivo.fr/swift-app/job/123/step"
)

$payloads = @(
    '{"current_step": 2}',
    '{"step": 2, "timestamp": "2025-12-11T12:00:00.000Z", "notes": "Test PowerShell"}',
    '{"step": 2}'
)

foreach ($endpoint in $endpoints) {
    foreach ($payload in $payloads) {
        Write-Host "🧪 Testing: $endpoint" -ForegroundColor Yellow
        Write-Host "📋 Payload: $payload" -ForegroundColor Cyan
        
        try {
            $response = Invoke-RestMethod -Uri $endpoint -Method PATCH -Headers $headers -Body $payload
            Write-Host "✅ SUCCESS: $endpoint" -ForegroundColor Green
            Write-Host "📄 Response: $($response | ConvertTo-Json)" -ForegroundColor Green
            break
        } catch {
            Write-Host "❌ FAILED: $($_.Exception.Response.StatusCode) $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        }
        Write-Host "---"
    }
}
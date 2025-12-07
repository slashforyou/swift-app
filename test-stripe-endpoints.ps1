# Script pour tester les endpoints Stripe disponibles
param(
    [string]$token = "4b40ce7b7b72b630ad6c3e9c6b6d2d93bba15b7f5c85e491e1fb7b3e8b073b6e7cf5e8f1a6d9c5e3f8b2a1d4e7c9b3a2d5e8f1c6b9e2d5a8f1c4b7e0a3d6f9c2b5e8a1d4f7"
)

$baseUrl = "https://altivo.fr/swift-app/"
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

Write-Host "Testing Stripe endpoints..." -ForegroundColor Green

# Test endpoints with v1
$endpoints = @(
    "v1/stripe/balance?company_id=15",
    "v1/stripe/payouts?company_id=15",
    "v1/payments/history?limit=10",
    "stripe/balance?company_id=15",
    "stripe/payouts?company_id=15", 
    "payments/history?limit=10"
)

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$endpoint"
    Write-Host "`nTesting: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Headers $headers -ErrorAction Stop
        Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Response: $($content | ConvertTo-Json -Depth 2 -Compress)" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errorContent = $reader.ReadToEnd()
            Write-Host "Error details: $errorContent" -ForegroundColor Magenta
        }
    }
}
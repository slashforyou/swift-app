# Test direct du XML
. "$PSScriptRoot\..\shared\config.ps1"

Write-Host "Test direct XML" -ForegroundColor Cyan

# Charger le XML directement
$workspaceRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$xmlPath = Join-Path $workspaceRoot "logs\ui_current.xml"

if (Test-Path $xmlPath) {
    Write-Host "[OK] Fichier trouve: $xmlPath" -ForegroundColor Green
    
    $xml = [xml](Get-Content $xmlPath -Raw)
    Write-Host "[OK] XML parse" -ForegroundColor Green
    
    # Test direct
    $node1 = $xml.SelectSingleNode("//*[contains(@text, 'Pickup')]")
    $node2 = $xml.SelectSingleNode("//*[contains(@text, 'Address')]")
    $node3 = $xml.SelectSingleNode("//*[contains(@text, 'Back')]")
    
    Write-Host "Nodes trouves:" -ForegroundColor Yellow
    Write-Host "  Pickup: $($node1 -ne $null)" -ForegroundColor $(if ($node1) { "Green" } else { "Red" })
    Write-Host "  Address: $($node2 -ne $null)" -ForegroundColor $(if ($node2) { "Green" } else { "Red" })
    Write-Host "  Back: $($node3 -ne $null)" -ForegroundColor $(if ($node3) { "Green" } else { "Red" })
    
    if ($node1) {
        Write-Host "  Pickup text: '$($node1.text)'" -ForegroundColor Gray
    }
} else {
    Write-Host "[FAIL] Fichier introuvable" -ForegroundColor Red
}

# PowerShell script to start Expo with console logging to file
# This captures all console output including Expo's own logs and React Native app logs

Write-Host "🚀 Starting Expo with console logging..." -ForegroundColor Green

# Create logs directory if it doesn't exist
$logsDir = Join-Path $PWD "logs"
if (!(Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir
    Write-Host "📁 Created logs directory: $logsDir" -ForegroundColor Yellow
}

# Generate timestamp for log file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path $logsDir "expo-logs-$timestamp.log"

Write-Host "📝 Console logs will be saved to: $logFile" -ForegroundColor Cyan
Write-Host "🔄 Starting Expo server..." -ForegroundColor Green

# Start Expo and capture output to both console and file
npx expo start | Tee-Object -FilePath $logFile

Write-Host "`n🛑 Expo stopped. Logs saved to: $logFile" -ForegroundColor Yellow
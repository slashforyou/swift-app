#!/usr/bin/env pwsh
# e2e/run-test.ps1
# Usage: .\e2e\run-test.ps1 050-job-workflow-single-company
#        .\e2e\run-test.ps1 050            (suffixe automatique)
#        .\e2e\run-test.ps1                (tous les flows)

param(
    [string]$Flow = ""
)

$maestro = "$env:USERPROFILE\scoop\shims\maestro.cmd"
$credFile = "$PSScriptRoot\config\credentials.yaml"
$flowsDir = "$PSScriptRoot\flows"

# Lire credentials.yaml et construire les flags -e KEY=VALUE
$envFlags = @()
Get-Content $credFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^([A-Z_]+):\s*"?(.+?)"?\s*$') {
        $envFlags += "-e"
        $envFlags += "$($Matches[1])=$($Matches[2])"
    }
}

# Résoudre le(s) fichier(s) de flow
if ($Flow -eq "") {
    $flowFiles = Get-ChildItem "$flowsDir\*.yaml" | Where-Object { $_.Name -notmatch "^sub-" } | Sort-Object Name
} elseif ($Flow -match '\.yaml$') {
    $flowFiles = @(Get-Item "$flowsDir\$Flow")
} else {
    # Chercher par préfixe ou nom partiel
    $flowFiles = @(Get-ChildItem "$flowsDir\${Flow}*.yaml" | Sort-Object Name)
    if ($flowFiles.Count -eq 0) {
        Write-Error "Aucun flow trouvé pour : $Flow"
        exit 1
    }
}

foreach ($file in $flowFiles) {
    Write-Host "`n>> $($file.Name)" -ForegroundColor Cyan
    # Build env string: -e "KEY=VALUE" (quotes handle values with spaces)
    $envPairs = for ($i = 0; $i -lt $envFlags.Count; $i += 2) {
        "-e `"$($envFlags[$i+1])`""
    }
    $envStr = $envPairs -join " "
    # Call via cmd /c to avoid PS "Terminate batch job?" prompt
    & cmd /c "`"$maestro`" test $envStr `"$($file.FullName)`""
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL: $($file.Name)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "OK: $($file.Name)" -ForegroundColor Green
}

#!/usr/bin/env pwsh
param(
    [Parameter(Mandatory=$true)]
    [string]$Flow,
    [int]$MaxRetries = 5
)

$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path $PSScriptRoot -Parent
$maestro = "$env:USERPROFILE\scoop\shims\maestro.cmd"
$credFile = Join-Path $PSScriptRoot 'config\credentials.yaml'
$flowsDir = Join-Path $PSScriptRoot 'flows'
$resumeFlowPath = Join-Path $flowsDir "_resume-$Flow.yaml"
$failureLogPath = Join-Path $workspaceRoot 'logs\e2e-failures.log'

function Get-EnvFlags {
    param([string]$YamlPath)
    $flags = @()
    Get-Content $YamlPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^([A-Z_]+):\s*"?(.+?)"?\s*$') {
            $flags += '-e'
            $flags += "$($Matches[1])=$($Matches[2])"
        }
    }
    return $flags
}

function Resolve-FlowPath {
    param([string]$FlowArg)
    if ($FlowArg -match '\.yaml$') {
        return (Join-Path $flowsDir $FlowArg)
    }

    $matches = Get-ChildItem "$flowsDir\${FlowArg}*.yaml" | Sort-Object Name
    if (-not $matches -or $matches.Count -eq 0) {
        throw "Aucun flow trouvé pour: $FlowArg"
    }
    return $matches[0].FullName
}

function Get-LatestMaestroRunDir {
    $dir = Get-ChildItem "$env:USERPROFILE\.maestro\tests" -Directory |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $dir) {
        throw "Impossible de trouver le dossier de run Maestro"
    }
    return $dir.FullName
}

function Get-FirstFailedEntry {
    param([string]$CommandsJsonPath)
    $json = Get-Content $CommandsJsonPath -Raw | ConvertFrom-Json
    foreach ($entry in $json) {
        if ($entry.metadata.status -eq 'FAILED') {
            return $entry
        }
    }
    return $null
}

function Get-FailureSelector {
    param($failedEntry)

    $eval = $failedEntry.metadata.evaluatedCommand
    if (-not $eval) { return @{} }

    if ($eval.tapOnElement -and $eval.tapOnElement.selector) {
        $sel = $eval.tapOnElement.selector
        return @{
            commandType = 'tapOn'
            idRegex = $sel.idRegex
            textRegex = $sel.textRegex
        }
    }

    if ($eval.assertConditionCommand -and $eval.assertConditionCommand.condition) {
        $cond = $eval.assertConditionCommand.condition
        if ($cond.visible) {
            return @{
                commandType = 'assertVisible'
                idRegex = $cond.visible.idRegex
                textRegex = $cond.visible.textRegex
            }
        }
        if ($cond.notVisible) {
            return @{
                commandType = 'assertNotVisible'
                idRegex = $cond.notVisible.idRegex
                textRegex = $cond.notVisible.textRegex
            }
        }
    }

    return @{
        commandType = (($failedEntry.command.PSObject.Properties.Name -join ','))
    }
}

function Find-CommandStartLine {
    param(
        [string[]]$Lines,
        [hashtable]$FailureSelector
    )

    $needleId = $FailureSelector.idRegex
    $needleText = $FailureSelector.textRegex

    $candidateLines = @()

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $line = $Lines[$i]
        if ($needleId -and $line -match ('id:\s*"' + [regex]::Escape($needleId) + '"')) {
            $candidateLines += $i
        }
        if ($needleText -and $line -match ('text:\s*"' + [regex]::Escape($needleText) + '"')) {
            $candidateLines += $i
        }
    }

    if ($candidateLines.Count -eq 0) {
        # Fallback: first command in file
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            if ($Lines[$i] -match '^-\s') { return $i }
        }
        return -1
    }

    # Use last candidate to maximize chance of resuming near latest failure occurrence.
    $lineIndex = $candidateLines[-1]

    for ($j = $lineIndex; $j -ge 0; $j--) {
        if ($Lines[$j] -match '^-\s') {
            return $j
        }
    }

    return -1
}

function Write-ResumeFlow {
    param(
        [string]$SourceFlowPath,
        [string]$TargetFlowPath,
        [hashtable]$FailureSelector
    )

    $lines = Get-Content $SourceFlowPath

    # Preserve YAML header
    $header = @()
    $cmdStartSearchFrom = 0
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $header += $lines[$i]
        if ($lines[$i].Trim() -eq '---') {
            $cmdStartSearchFrom = $i + 1
            break
        }
    }

    $body = $lines[$cmdStartSearchFrom..($lines.Count - 1)]
    $relativeStart = Find-CommandStartLine -Lines $body -FailureSelector $FailureSelector
    if ($relativeStart -lt 0) {
        throw "Impossible de déterminer le point de reprise dans $SourceFlowPath"
    }

    if ($FailureSelector.commandType -in @('assertVisible', 'assertNotVisible')) {
        $starts = @()
        for ($k = 0; $k -lt $body.Count; $k++) {
            if ($body[$k] -match '^-\s') { $starts += $k }
        }

        if ($starts.Count -gt 1) {
            $idx = [Array]::IndexOf($starts, $relativeStart)
            if ($idx -gt 0) {
                $relativeStart = $starts[$idx - 1]
            }
        }
    }

    $resumeBody = $body[$relativeStart..($body.Count - 1)]
    $out = @()
    $out += $header
    $out += '# AUTO-GENERATED resume flow from latest Maestro failure'
    $out += '- openLink: "${EXPO_URL}"'
    $out += '- waitForAnimationToEnd'
    $out += $resumeBody

    Set-Content -Path $TargetFlowPath -Value $out -Encoding UTF8
    return ($cmdStartSearchFrom + $relativeStart + 1)
}

function Run-MaestroFlow {
    param(
        [string]$FlowPath,
        [string[]]$EnvFlags
    )

    $envPairs = for ($i = 0; $i -lt $EnvFlags.Count; $i += 2) {
        "-e `"$($EnvFlags[$i+1])`""
    }
    $envStr = $envPairs -join ' '

    & cmd /c "`"$maestro`" test $envStr `"$FlowPath`""
    return $LASTEXITCODE
}

$envFlags = Get-EnvFlags -YamlPath $credFile
$currentFlowPath = Resolve-FlowPath -FlowArg $Flow

for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
    Write-Host "`n[Attempt $attempt/$MaxRetries] Running: $currentFlowPath" -ForegroundColor Cyan
    $code = Run-MaestroFlow -FlowPath $currentFlowPath -EnvFlags $envFlags
    if ($code -eq 0) {
        Write-Host "PASS: $currentFlowPath" -ForegroundColor Green
        exit 0
    }

    $runDir = Get-LatestMaestroRunDir
    $commandsJson = Get-ChildItem $runDir -Filter 'commands-*.json' | Select-Object -First 1
    $aiJson = Get-ChildItem $runDir -Filter 'ai-*.json' | Where-Object { $_.Name -notlike 'ai-report-*' } | Select-Object -First 1

    if (-not $commandsJson -or -not $aiJson) {
        throw "Artefacts Maestro incomplets dans $runDir"
    }

    $failed = Get-FirstFailedEntry -CommandsJsonPath $commandsJson.FullName
    if (-not $failed) {
        throw "Echec détecté mais aucune commande FAILED trouvée"
    }

    $failureSelector = Get-FailureSelector -failedEntry $failed
    $errorMsg = $failed.metadata.error.message
    $sequence = $failed.metadata.sequenceNumber

    $flowInfo = Get-Content $aiJson.FullName -Raw | ConvertFrom-Json
    $sourceFlowPath = $flowInfo.flow_file_path
    if (-not (Test-Path $sourceFlowPath)) {
        $sourceFlowPath = $currentFlowPath
    }

    if (-not (Test-Path (Split-Path $failureLogPath -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path $failureLogPath -Parent) -Force | Out-Null
    }

    $logLine = "{0} | flow={1} | sequence={2} | type={3} | id={4} | text={5} | error={6}" -f `
        (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),
        (Split-Path $sourceFlowPath -Leaf),
        $sequence,
        $failureSelector.commandType,
        $failureSelector.idRegex,
        $failureSelector.textRegex,
        $errorMsg

    Add-Content -Path $failureLogPath -Value $logLine

    Write-Host "FAILED at sequence $sequence" -ForegroundColor Yellow
    Write-Host "Type: $($failureSelector.commandType) | id=$($failureSelector.idRegex) | text=$($failureSelector.textRegex)" -ForegroundColor Yellow
    Write-Host "Error: $errorMsg" -ForegroundColor Yellow

    $resumeLine = Write-ResumeFlow -SourceFlowPath $sourceFlowPath -TargetFlowPath $resumeFlowPath -FailureSelector $failureSelector
    Write-Host "Resume flow generated: $resumeFlowPath (starting near line $resumeLine of source)" -ForegroundColor Yellow

    $currentFlowPath = $resumeFlowPath
}

Write-Host "FAIL: reached max retries ($MaxRetries)" -ForegroundColor Red
exit 1

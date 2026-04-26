# reverb installer — Windows (Task Scheduler).
# Run from PowerShell (no admin required):
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#   .\scripts\install.ps1

$ErrorActionPreference = "Stop"

$repoDir  = Split-Path -Parent $PSScriptRoot
$nodeBin  = (Get-Command node -ErrorAction SilentlyContinue).Source
$taskName = "Reverb"
$logFile  = "$env:TEMP\reverb.log"

Write-Host "==> reverb installer"
Write-Host "    REPO_DIR : $repoDir"
Write-Host "    NODE_BIN : $nodeBin"
Write-Host "    USER     : $env:USERNAME"
Write-Host ""

# ── Pre-flight checks ────────────────────────────────────────────────────────

if (-not $nodeBin) {
    Write-Error "node not found on PATH. Install Node 18+ from https://nodejs.org first."
    exit 1
}

if (-not (Test-Path "$repoDir\dist\bot.js")) {
    Write-Host "==> Building (dist\bot.js not found)..."
    try {
        Push-Location $repoDir
        npm install
        npm run build
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path "$repoDir\.env")) {
    Write-Host "==> Creating .env from .env.example"
    Copy-Item "$repoDir\.env.example" "$repoDir\.env"
    Write-Host "    Edit $repoDir\.env before pairing."
}

# ── Write launcher wrapper (captures stdout/stderr to log) ───────────────────

$wrapperPath = "$repoDir\reverb-start.cmd"
@"
@echo off
"$nodeBin" "$repoDir\dist\bot.js" >> "$logFile" 2>&1
"@ | Set-Content -Encoding ASCII $wrapperPath

# ── Register Task Scheduler job ──────────────────────────────────────────────

$action = New-ScheduledTaskAction `
    -Execute  "cmd.exe" `
    -Argument "/c `"$wrapperPath`"" `
    -WorkingDirectory $repoDir

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 10 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $taskName `
    -Action   $action `
    -Trigger  $trigger `
    -Settings $settings `
    -Force | Out-Null

Write-Host "==> Task Scheduler job '$taskName' registered."
Write-Host "    Logs will be written to: $logFile"
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host "  1. Pair your WhatsApp (shows QR code):"
Write-Host "       cd $repoDir; npm run pair"
Write-Host ""
Write-Host "  2. Scan QR in WhatsApp > Settings > Linked Devices > Link a Device"
Write-Host ""
Write-Host "  3. Start the daemon:"
Write-Host "       Start-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "  4. Verify:"
Write-Host "       Get-ScheduledTask -TaskName '$taskName' | Select-Object State"
Write-Host "       Get-Content '$logFile' -Wait"

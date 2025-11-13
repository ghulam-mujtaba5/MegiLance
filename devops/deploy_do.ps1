<#
.SYNOPSIS
  Deploys MegiLance frontend to DigitalOcean App Platform.

.DESCRIPTION
  Reads DigitalOcean API token from environment or prompts securely.
  Uses bash script to deploy and poll status.

.EXAMPLE
  $env:DO_API_TOKEN = 'dop_v1_...'
  .\devops\deploy_do.ps1
#>

param(
    [string]$Token = $env:DO_API_TOKEN,
    [int]$Timeout = 600
)

# Ensure bash is available
$bashPath = (Get-Command bash -ErrorAction SilentlyContinue).Source
if (-not $bashPath) {
    Write-Error "bash not found. Ensure WSL or Git Bash is installed."
    exit 1
}

# Prompt for token if not provided
if (-not $Token) {
    Write-Host "DigitalOcean API token:" -ForegroundColor Yellow
    $secureToken = Read-Host -AsSecureString
    $Token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    )
}

if (-not $Token) {
    Write-Error "Token required"
    exit 1
}

$scriptPath = Join-Path $PSScriptRoot "scripts/deploy_do_app.sh"
if (-not (Test-Path $scriptPath)) {
    Write-Error "deploy_do_app.sh not found at $scriptPath"
    exit 1
}

Write-Host "Starting DigitalOcean frontend deployment..." -ForegroundColor Green
$env:DO_API_TOKEN = $Token

# Call bash script
& bash $scriptPath $Token
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed with exit code $exitCode" -ForegroundColor Red
}

exit $exitCode

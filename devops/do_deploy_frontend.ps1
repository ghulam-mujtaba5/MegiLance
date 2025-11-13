<#
.do_deploy_frontend.ps1
Automates DigitalOcean App Platform deployment for the `frontend` directory using `doctl`.

Usage (run locally):
  1. Set env var DO_API_TOKEN or let script prompt for it.
  2. Run in repo root: `pwsh .\devops\do_deploy_frontend.ps1`

What it does:
- Authenticates `doctl` using token
- Creates or updates an App named `megilance-frontend` using `devops/do-app-spec.yaml`
- Polls deployment status until success or failure
- On failure, fetches logs and attempts automated fixes:
    * Ensure run_command uses port (`next start -p $PORT`)
    * If logs show OOM, update instance size to `professional-2` and redeploy
- Repeats a small number of retries

Security: Keep tokens secret. The script does not store the token on disk.
#>

param(
    [string]$Token = $env:DO_API_TOKEN
)

function Prompt-Token {
    param($prompt = "DigitalOcean API token:")
    Write-Host $prompt -ForegroundColor Yellow
    $t = Read-Host -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($t))
}

if (-not $Token) {
    $Token = Prompt-Token
}

# Auth doctl in the current environment using the token
Write-Host "Authenticating doctl..."
$authInit = & doctl auth init --access-token $Token 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "doctl auth init failed: $authInit"
    exit 1
}

$appName = 'megilance-frontend'
$specPath = 'devops/do-app-spec.yaml'

# Helper to get app by name
function Get-AppByName($name) {
    $json = doctl apps list --output json | ConvertFrom-Json
    foreach ($app in $json) {
        if ($app.spec.name -eq $name) { return $app }
    }
    return $null
}

$app = Get-AppByName $appName
if ($app -ne $null) {
    $appId = $app.id
    Write-Host "Found existing app: $appName (ID: $appId). Updating with spec..."
    doctl apps update $appId --spec $specPath | Out-Null
} else {
    Write-Host "Creating new App from spec..."
    $createOut = doctl apps create --spec $specPath --output json | ConvertFrom-Json
    $appId = $createOut.id
    Write-Host "Created App ID: $appId"
}

function Get-LatestDeployment($appId) {
    $deps = doctl apps deployments list $appId --output json | ConvertFrom-Json
    if (-not $deps) { return $null }
    return $deps[0]
}

function Poll-Deployment($appId) {
    $maxWait = 40 # number of 15s intervals ~ 10 minutes
    $i = 0
    while ($i -lt $maxWait) {
        $dep = Get-LatestDeployment $appId
        if ($dep -eq $null) { Start-Sleep -Seconds 5; $i++; continue }
        $status = $dep.phase
        Write-Host "Deployment status: $status"
        if ($status -eq 'ACTIVE') { return @{ success = $true; deployment = $dep } }
        if ($status -eq 'ERROR') { return @{ success = $false; deployment = $dep } }
        Start-Sleep -Seconds 15
        $i++
    }
    return @{ success = $false; reason = 'timeout' }
}

# Start initial polling
Write-Host "Polling deployment status..."
$poll = Poll-Deployment $appId
if ($poll.success) {
    Write-Host "Deployment succeeded." -ForegroundColor Green
    exit 0
}

# On failure, gather logs
if ($poll.deployment -ne $null) {
    $depId = $poll.deployment.id
    $logFile = "do_deploy_logs_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    Write-Host "Deployment failed. Fetching logs to $logFile"
    doctl apps logs get --app-id $appId --deployment-id $depId --output json > $logFile
    $logs = Get-Content $logFile -Raw
    Write-Host "==== Deployment logs ===="
    Write-Host $logs
} else {
    Write-Error "No deployment information available"
    exit 1
}

# Simple heuristics to attempt automatic fixes
$attemptedFix = $false

# Fix 1: Ensure run_command uses $PORT (fix by updating spec locally then doctl apps update)
if ($logs -match 'Missing script: "start"' -or $logs -match 'Missing script: "start"') {
    Write-Host "Detected missing start script in logs. Updating run_command in spec to 'next start -p $PORT' and redeploying..."
    $spec = Get-Content $specPath -Raw
    $spec = $spec -replace 'run_command: "[^"]+"', 'run_command: "npx next start -p $PORT"'
    Set-Content -Path $specPath -Value $spec -Force
    doctl apps update $appId --spec $specPath | Out-Null
    $attemptedFix = $true
}

# Fix 2: Increase instance size if OOM / memory errors
if ($logs -match 'JavaScript heap out of memory' -or $logs -match 'out of memory' -or $logs -match 'ENOMEM') {
    Write-Host "Detected OOM in logs. Increasing instance size to professional-2 and redeploying..."
    $spec = Get-Content $specPath -Raw
    # naive replace of instance_size_slug
    $spec = $spec -replace 'instance_size_slug: professional-1', 'instance_size_slug: professional-2'
    Set-Content -Path $specPath -Value $spec -Force
    doctl apps update $appId --spec $specPath | Out-Null
    $attemptedFix = $true
}

if (-not $attemptedFix) {
    Write-Error "No automated fix matched logs. Please review $logFile and share the error output."
    exit 1
}

# Poll again after automated fix
Write-Host "Polling deployment after automated fix..."
$poll2 = Poll-Deployment $appId
if ($poll2.success) {
    Write-Host "Deployment succeeded after automated fix." -ForegroundColor Green
    exit 0
} else {
    Write-Error "Deployment still failed after automated fix. Saved logs to $logFile. Please share logs for manual investigation."
    exit 1
}

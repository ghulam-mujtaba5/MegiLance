# @AI-HINT: DigitalOcean CLI deployment script for frontend (PowerShell version)
# Deploys Next.js frontend to DigitalOcean App Platform with Git auto-deployment

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 MegiLance DigitalOcean Frontend Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if doctl is installed
try {
    $null = doctl version 2>&1
    Write-Host "✅ doctl CLI installed" -ForegroundColor Green
} catch {
    Write-Host "❌ doctl CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Installation Instructions:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://github.com/digitalocean/doctl/releases" -ForegroundColor White
    Write-Host "  2. Extract and add to PATH" -ForegroundColor White
    Write-Host "  3. Run: doctl auth init" -ForegroundColor White
    Write-Host "  4. Get API token from: https://cloud.digitalocean.com/account/api/tokens" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check authentication
try {
    $null = doctl account get 2>&1
    Write-Host "✅ Authenticated with DigitalOcean" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with DigitalOcean" -ForegroundColor Red
    Write-Host "📋 Run: doctl auth init" -ForegroundColor Yellow
    Write-Host "Get your API token from: https://cloud.digitalocean.com/account/api/tokens" -ForegroundColor White
    exit 1
}

# Get backend URL from Oracle VM
$BACKEND_URL = "https://api.megilance.com"  # Default
if (Test-Path "oracle-vm-details.json") {
    $vmDetails = Get-Content "oracle-vm-details.json" | ConvertFrom-Json
    $backendIP = $vmDetails.public_ip
    $BACKEND_URL = "https://$backendIP"
    Write-Host "✅ Backend URL from Oracle VM: $BACKEND_URL" -ForegroundColor Green
} else {
    Write-Host "⚠️  oracle-vm-details.json not found" -ForegroundColor Yellow
    $backendIP = Read-Host "Enter your Oracle VM public IP (or press Enter for $BACKEND_URL)"
    if ($backendIP) {
        $BACKEND_URL = "https://$backendIP"
    }
}

Write-Host ""
Write-Host "📋 Creating DigitalOcean App Platform spec..." -ForegroundColor Cyan

# Create App Platform specification
$appSpec = @"
name: megilance-frontend
region: nyc
services:
  - name: frontend
    github:
      repo: ghulam-mujtaba5/MegiLance
      branch: main
      deploy_on_push: true
    source_dir: /frontend
    build_command: npm install && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /
    envs:
      - key: NODE_ENV
        value: production
        scope: RUN_AND_BUILD_TIME
      - key: NEXT_PUBLIC_API_URL
        value: $BACKEND_URL/api
        scope: RUN_AND_BUILD_TIME
      - key: NEXT_TELEMETRY_DISABLED
        value: "1"
        scope: RUN_AND_BUILD_TIME
    health_check:
      http_path: /
      initial_delay_seconds: 60
      period_seconds: 30
      timeout_seconds: 10
      success_threshold: 1
      failure_threshold: 3
"@

$appSpec | Out-File -FilePath "app-spec.yaml" -Encoding UTF8
Write-Host "✅ App spec created: app-spec.yaml" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Deploying to DigitalOcean App Platform..." -ForegroundColor Cyan

# Check if app already exists
$existingApps = doctl apps list --format ID,Spec.Name --no-header 2>&1
$appId = $null

foreach ($line in $existingApps) {
    if ($line -match "megilance-frontend") {
        $appId = ($line -split '\s+')[0]
        break
    }
}

if ($appId) {
    Write-Host "  ℹ️  Updating existing app: $appId" -ForegroundColor Yellow
    doctl apps update $appId --spec app-spec.yaml
    $appUrl = (doctl apps get $appId --format LiveURL --no-header) -replace '\s',''
    Write-Host "  ✅ App updated successfully" -ForegroundColor Green
} else {
    Write-Host "  Creating new app..." -ForegroundColor White
    $createResult = doctl apps create --spec app-spec.yaml --format ID,LiveURL --no-header
    $parts = $createResult -split '\s+'
    $appId = $parts[0]
    $appUrl = $parts[1]
    Write-Host "  ✅ App created: $appId" -ForegroundColor Green
}

# Wait for deployment
Write-Host ""
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray

$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 20
    $appStatus = doctl apps get $appId --format ActiveDeployment.Phase --no-header
    
    Write-Host "   Attempt $($attempt + 1)/$maxAttempts - Status: $appStatus" -ForegroundColor Gray
    
    if ($appStatus -match "ACTIVE") {
        Write-Host "  ✅ Deployment successful!" -ForegroundColor Green
        break
    } elseif ($appStatus -match "ERROR|FAILED") {
        Write-Host "  ❌ Deployment failed!" -ForegroundColor Red
        Write-Host "  Check logs: doctl apps logs $appId" -ForegroundColor Yellow
        exit 1
    }
    
    $attempt++
}

if ($attempt -ge $maxAttempts) {
    Write-Host "  ⏱️  Deployment taking longer than expected" -ForegroundColor Yellow
    Write-Host "  Check status: doctl apps get $appId" -ForegroundColor White
}

# Get final URL
$appUrl = (doctl apps get $appId --format LiveURL --no-header) -replace '\s',''

# Save deployment details
@{
    app_id = $appId
    app_url = $appUrl
    backend_url = $BACKEND_URL
    deployed_at = (Get-Date -Format "o")
    region = "nyc"
    auto_deploy = $true
} | ConvertTo-Json | Out-File -FilePath "digitalocean-app-details.json" -Encoding UTF8

Write-Host ""
Write-Host "✅ ================================================" -ForegroundColor Green
Write-Host "✅ DigitalOcean Frontend Deployed!" -ForegroundColor Green
Write-Host "✅ ================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Application Details:" -ForegroundColor Yellow
Write-Host "  App ID: $appId" -ForegroundColor White
Write-Host "  Live URL: $appUrl" -ForegroundColor White
Write-Host "  Backend: $BACKEND_URL" -ForegroundColor White
Write-Host ""
Write-Host "📋 Auto-Deployment:" -ForegroundColor Yellow
Write-Host "  ✅ Git integration: Enabled" -ForegroundColor Green
Write-Host "  ✅ Branch: main" -ForegroundColor Green
Write-Host "  ✅ Deploy on push: Enabled" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Management Commands:" -ForegroundColor Yellow
Write-Host "  View app: doctl apps get $appId" -ForegroundColor Gray
Write-Host "  View logs: doctl apps logs $appId" -ForegroundColor Gray
Write-Host "  List deployments: doctl apps list-deployments $appId" -ForegroundColor Gray
Write-Host "  Update spec: doctl apps update $appId --spec app-spec.yaml" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Dashboard:" -ForegroundColor Yellow
Write-Host "  https://cloud.digitalocean.com/apps/$appId" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your app will auto-deploy on every push to main branch!" -ForegroundColor Green
Write-Host ""

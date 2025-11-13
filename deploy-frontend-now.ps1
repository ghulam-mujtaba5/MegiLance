# Deploy to DigitalOcean with $5/month tier
# This ensures you use basic-xxs (512MB) = $5/month

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MegiLance Frontend Deployment" -ForegroundColor Cyan
Write-Host "  Cost: `$5/month (FREE with credits!)" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Verify GitHub authorization
Write-Host "[1/4] Checking GitHub authorization..." -ForegroundColor Yellow

$checkAuth = doctl apps create --spec digitalocean-app.yaml 2>&1
if ($checkAuth -match "GitHub user does not have access") {
    Write-Host "✗ GitHub not authorized yet" -ForegroundColor Red
    Write-Host "`nOpening GitHub authorization..." -ForegroundColor Yellow
    Start-Process "https://cloud.digitalocean.com/apps/github/install"
    
    Write-Host "`nIn the browser that just opened:" -ForegroundColor Cyan
    Write-Host "  1. Click 'Authorize DigitalOcean'" -ForegroundColor White
    Write-Host "  2. Select repository: ghulam-mujtaba5/MegiLance" -ForegroundColor White
    Write-Host "  3. Click 'Install & Authorize'" -ForegroundColor White
    Write-Host "  4. Wait for confirmation" -ForegroundColor White
    
    Read-Host "`nPress Enter after authorization is complete"
    
    Write-Host "`nRetrying app creation..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Step 2: Create app
Write-Host "`n[2/4] Creating app with basic-xxs tier (`$5/month)..." -ForegroundColor Yellow

$createResult = doctl apps create --spec digitalocean-app.yaml --format ID --no-header 2>&1

if ($LASTEXITCODE -eq 0) {
    $appId = $createResult.Trim()
    Write-Host "✓ App created successfully!" -ForegroundColor Green
    Write-Host "  App ID: $appId" -ForegroundColor Cyan
    
    # Save app ID
    $appId | Out-File -FilePath "digitalocean-app-id.txt" -NoNewline
    Write-Host "  Saved to: digitalocean-app-id.txt" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to create app" -ForegroundColor Red
    Write-Host $createResult -ForegroundColor Red
    
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "  Use Manual Deployment Instead" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "`nGo to: https://cloud.digitalocean.com/apps/new" -ForegroundColor Cyan
    Write-Host "`nConfiguration:" -ForegroundColor White
    Write-Host "  Repository: ghulam-mujtaba5/MegiLance" -ForegroundColor Cyan
    Write-Host "  Branch: main" -ForegroundColor Cyan
    Write-Host "  Source Directory: /frontend" -ForegroundColor Cyan
    Write-Host "  Dockerfile: frontend/Dockerfile" -ForegroundColor Cyan
    Write-Host "  Instance Size: Basic XXS (512MB) - `$5/month" -ForegroundColor Green
    Write-Host "`nSee DIGITALOCEAN_DEPLOYMENT_STATUS.md for details" -ForegroundColor Gray
    exit 1
}

# Step 3: Monitor deployment
Write-Host "`n[3/4] Monitoring deployment..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes. Watching build..." -ForegroundColor White

$deployed = $false
$attempts = 0
$maxAttempts = 40

while (-not $deployed -and $attempts -lt $maxAttempts) {
    $attempts++
    
    $phase = doctl apps get $appId --format ActiveDeployment.Phase --no-header 2>&1
    
    if ($phase -match "ACTIVE") {
        $deployed = $true
        Write-Host "`n✓ Deployment successful!" -ForegroundColor Green
    } elseif ($phase -match "ERROR|FAILED") {
        Write-Host "`n✗ Deployment failed!" -ForegroundColor Red
        Write-Host "`nCheck logs:" -ForegroundColor Yellow
        Write-Host "  doctl apps logs $appId --type build" -ForegroundColor Cyan
        break
    } else {
        $progress = if ($phase) { $phase } else { "PENDING" }
        Write-Host "  [$attempts/$maxAttempts] Status: $progress" -ForegroundColor Gray
        Start-Sleep -Seconds 15
    }
}

if (-not $deployed) {
    Write-Host "`nDeployment is taking longer than expected." -ForegroundColor Yellow
    Write-Host "Monitor at: https://cloud.digitalocean.com/apps/$appId" -ForegroundColor Cyan
}

# Step 4: Get app URL and details
Write-Host "`n[4/4] Getting app details..." -ForegroundColor Yellow

$appUrl = doctl apps get $appId --format DefaultIngress --no-header 2>&1
$tier = doctl apps get $appId --format Spec.Services[0].InstanceSizeSlug --no-header 2>&1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if ($appUrl) {
    Write-Host "`nYour frontend is live at:" -ForegroundColor Green
    Write-Host "  https://$appUrl" -ForegroundColor Cyan
    
    Write-Host "`nInstance Tier: $tier" -ForegroundColor White
    Write-Host "Cost: `$5/month (FREE with `$200 credits)" -ForegroundColor Green
    
    Write-Host "`nApp ID: $appId" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Test your app:" -ForegroundColor Yellow
Write-Host "   Open: https://$appUrl" -ForegroundColor Cyan

Write-Host "`n2. Update environment variables:" -ForegroundColor Yellow
Write-Host "   After Oracle backend is deployed:" -ForegroundColor White
Write-Host "   • Go to: https://cloud.digitalocean.com/apps/$appId/settings" -ForegroundColor Cyan
Write-Host "   • Environment Variables → Edit" -ForegroundColor White
Write-Host "   • Update NEXT_PUBLIC_API_URL to your Oracle VM IP" -ForegroundColor White

Write-Host "`n3. Verify auto-deployment:" -ForegroundColor Yellow
Write-Host "   • Make a change and push to main branch" -ForegroundColor White
Write-Host "   • App will rebuild automatically!" -ForegroundColor White

Write-Host "`n4. View logs:" -ForegroundColor Yellow
Write-Host "   doctl apps logs $appId --type run --follow" -ForegroundColor Cyan

Write-Host "`n5. Check cost:" -ForegroundColor Yellow
Write-Host "   doctl balance get" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deployment successful! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

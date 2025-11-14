#!/usr/bin/env pwsh
# MegiLance Backend - Complete Automated Deployment to DigitalOcean

$ErrorActionPreference = "Stop"

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║     MegiLance - DigitalOcean Auto Deployment               ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Configuration
$DO_TOKEN = $env:DIGITALOCEAN_API_TOKEN
$env:DIGITALOCEAN_ACCESS_TOKEN = "YOUR_DIGITALOCEAN_TOKEN_HERE"
$DROPLET_NAME = "megilance-backend"
$REGION = "nyc1"
$SIZE = "s-1vcpu-1gb"  # $6/month
$IMAGE = "docker-20-04"

Write-Host "🗑️  Step 1: Cleaning up old droplets..." -ForegroundColor Yellow
$droplets = curl -H "Authorization: Bearer $DO_TOKEN" "https://api.digitalocean.com/v2/droplets" | ConvertFrom-Json
foreach ($droplet in $droplets.droplets) {
    if ($droplet.name -eq $DROPLET_NAME) {
        Write-Host "   Deleting: $($droplet.name) ($($droplet.networks.v4[0].ip_address))" -ForegroundColor Gray
        curl -X DELETE -H "Authorization: Bearer $DO_TOKEN" "https://api.digitalocean.com/v2/droplets/$($droplet.id)" | Out-Null
        Start-Sleep -Seconds 5
    }
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

Write-Host "📦 Step 2: Creating deployment script..." -ForegroundColor Cyan

# Create user-data script that will run on first boot
$userData = @"
#!/bin/bash
set -e

# Wait for Docker to be ready
sleep 10

# Install git
apt-get update
apt-get install -y git curl

# Clone repository
cd /root
git clone https://github.com/ghulam-mujtaba5/MegiLance.git
cd MegiLance

# Create environment file (WITHOUT wallet for now - will fail DB connection)
cat > backend/.env << 'ENVEOF'
DATABASE_URL=oracle://admin:Admin123456@megilancedb_high?wallet_location=/root/oracle-wallet-23ai
SECRET_KEY=supersecretkey32charsminimumforjwt1234567890abc
CORS_ORIGINS=http://localhost:3000
ENVEOF

# Build backend Docker image
cd backend
docker build -t megilance-backend .

# Run backend container
docker run -d \
  --name megilance-api \
  -p 8000:8000 \
  --restart unless-stopped \
  megilance-backend

# Log completion
echo "Backend deployment complete!" > /root/deployment-done.txt
date >> /root/deployment-done.txt

"@

Write-Host "✅ Script created!" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Step 3: Creating droplet..." -ForegroundColor Cyan

$dropletPayload = @{
    name = $DROPLET_NAME
    region = $REGION
    size = $SIZE
    image = $IMAGE
    user_data = $userData
    tags = @("backend", "megilance")
} | ConvertTo-Json -Depth 10

$response = curl -X POST `
    -H "Content-Type: application/json" `
    -H "Authorization: Bearer $DO_TOKEN" `
    --data-raw $dropletPayload `
    "https://api.digitalocean.com/v2/droplets" | ConvertFrom-Json

$dropletId = $response.droplet.id
Write-Host "   Droplet ID: $dropletId" -ForegroundColor Gray
Write-Host "✅ Droplet created!" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Step 4: Waiting for droplet to boot (60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host "🔍 Step 5: Getting droplet IP..." -ForegroundColor Cyan
$dropletInfo = curl -H "Authorization: Bearer $DO_TOKEN" `
    "https://api.digitalocean.com/v2/droplets/$dropletId" | ConvertFrom-Json

$ip = $dropletInfo.droplet.networks.v4[0].ip_address
Write-Host "   IP Address: $ip" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Step 6: Waiting for deployment to complete (60 more seconds)..." -ForegroundColor Yellow
Write-Host "   (Docker building backend image...)" -ForegroundColor Gray
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "🎯 Step 7: Testing API..." -ForegroundColor Cyan

$maxRetries = 5
$retryCount = 0
$success = $false

while ($retryCount -lt $maxRetries -and -not $success) {
    try {
        $response = curl -s "http://${ip}:8000/api/health/live"
        if ($response) {
            Write-Host "   ✅ API Response: $response" -ForegroundColor Green
            $success = $true
        }
    } catch {
        $retryCount++
        Write-Host "   ⏳ Attempt $retryCount/$maxRetries - waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
    }
}

Write-Host ""
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                 DEPLOYMENT COMPLETE!                        ║
╚══════════════════════════════════════════════════════════════╝

📍 Droplet IP:    $ip
🌐 API Docs:      http://${ip}:8000/api/docs
💚 Health Check:  http://${ip}:8000/api/health/live

⚠️  IMPORTANT: Backend is running but DB connection will FAIL!
   
   Why? Oracle wallet is NOT uploaded yet (too large for user-data)

🔧 TO FIX DATABASE CONNECTION:

   Option 1: Use DigitalOcean Console (EASIEST)
   -----------------------------------------
   1. Go to: https://cloud.digitalocean.com/droplets
   2. Click on "megilance-backend"
   3. Click "Access" → "Launch Droplet Console"
   4. Login as root (password will be shown)
   5. Run this command to get wallet upload instructions:
      cat /root/MegiLance/backend/.env
   
   Option 2: If you can SSH (requires key setup)
   -------------------------------------------
   From your PC, upload wallet:
   scp -r oracle-wallet-23ai root@${ip}:/root/
   
   Then restart backend:
   ssh root@${ip} "docker restart megilance-api"

💰 COST: `$6/month (1GB RAM)
   To stop billing: Delete droplet when not in use

📊 USEFUL COMMANDS (via Console):
   docker ps                      # Check status
   docker logs -f megilance-api   # View logs
   docker restart megilance-api   # Restart
   curl localhost:8000/api/health/live  # Test API

"@ -ForegroundColor Cyan

Write-Host "🎉 Script complete! Backend is deployed but needs wallet upload." -ForegroundColor Green
Write-Host ""

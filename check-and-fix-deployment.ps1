#!/usr/bin/env pwsh
# Check and fix DigitalOcean deployment without SSH password

$env:DIGITALOCEAN_ACCESS_TOKEN = "YOUR_DIGITALOCEAN_TOKEN_HERE"
$DROPLET_IP = '159.89.90.152'

Write-Host "`n🔍 CHECKING DEPLOYMENT STATUS...`n" -ForegroundColor Cyan

# Test backend
Write-Host "1️⃣ Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${DROPLET_IP}:8000/api/health/live" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Backend is RUNNING!" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend NOT responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test frontend
Write-Host "`n2️⃣ Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${DROPLET_IP}:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Frontend is RUNNING!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend NOT responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Test Docker port
Write-Host "`n3️⃣ Testing Docker Daemon..." -ForegroundColor Yellow
try {
    $test = Test-NetConnection -ComputerName $DROPLET_IP -Port 2375 -WarningAction SilentlyContinue
    if ($test.TcpTestSucceeded) {
        Write-Host "   ✅ Docker port accessible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Docker port not exposed (normal for security)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Cannot test Docker port" -ForegroundColor Yellow
}

# Get droplet info
Write-Host "`n4️⃣ Droplet Information..." -ForegroundColor Yellow
$dropletInfo = curl -s -X GET `
    -H "Authorization: Bearer $TOKEN" `
    "https://api.digitalocean.com/v2/droplets?name=megilance-backend" | ConvertFrom-Json

$droplet = $dropletInfo.droplets[0]
Write-Host "   ID: $($droplet.id)" -ForegroundColor Gray
Write-Host "   Status: $($droplet.status)" -ForegroundColor Gray
Write-Host "   IP: $($droplet.networks.v4[0].ip_address)" -ForegroundColor Gray
Write-Host "   Created: $($droplet.created_at)" -ForegroundColor Gray
Write-Host "   Memory: $($droplet.memory)MB" -ForegroundColor Gray
Write-Host "   Disk: $($droplet.disk)GB" -ForegroundColor Gray

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 DIAGNOSIS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n❌ PROBLEM: Backend deployment script likely failed or incomplete`n" -ForegroundColor Red

Write-Host "🔧 SOLUTION: Use DigitalOcean Console to fix it`n" -ForegroundColor Yellow

Write-Host "OPTION 1: Use DigitalOcean Web Console (EASIEST)" -ForegroundColor Green
Write-Host "1. Go to: https://cloud.digitalocean.com/droplets/$($droplet.id)/console" -ForegroundColor White
Write-Host "2. Login as: root" -ForegroundColor White
Write-Host "3. Run these commands:" -ForegroundColor White
Write-Host @"

# Check what's running
docker ps -a

# Check if MegiLance was cloned
ls -la /root/MegiLance

# If not cloned, run the deployment
cd /root
git clone https://github.com/ghulam-mujtaba5/MegiLance.git
cd MegiLance

# Create backend env
cat > backend/.env << 'EOF'
DATABASE_URL=oracle://admin:Admin123456@megilancedb_high?wallet_location=/root/oracle-wallet-23ai
SECRET_KEY=supersecretkey32charsminimumforjwt1234567890abc
CORS_ORIGINS=http://159.89.90.152:3000,http://localhost:3000
ENVIRONMENT=production
EOF

# Deploy backend
docker-compose -f docker-compose.prod.yml up -d backend

# Wait 2 minutes, then check
sleep 120
docker ps
curl http://localhost:8000/api/health/live

"@ -ForegroundColor Cyan

Write-Host "`nOPTION 2: Rebuild Droplet with Fixed Script" -ForegroundColor Green
Write-Host "Run: .\deploy-backend-digitalocean-fixed.ps1" -ForegroundColor White

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

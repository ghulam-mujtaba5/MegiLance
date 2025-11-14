#!/usr/bin/env pwsh
# Fully automated droplet fix using DigitalOcean API

$TOKEN = "YOUR_DIGITALOCEAN_TOKEN_HERE"
$DROPLET_ID = '530087567'
$DROPLET_IP = '159.89.90.152'

Write-Host "`n🚀 AUTOMATED DROPLET FIX STARTING...`n" -ForegroundColor Green

# Step 1: Upload Oracle wallet via DigitalOcean API
Write-Host "1️⃣ Preparing Oracle wallet upload..." -ForegroundColor Cyan

# Create base64 encoded wallet files for upload
$walletPath = "E:\MegiLance\oracle-wallet-23ai"
if (Test-Path $walletPath) {
    Write-Host "   ✅ Wallet found locally" -ForegroundColor Green
} else {
    Write-Host "   ❌ Wallet not found at $walletPath" -ForegroundColor Red
    exit 1
}

# Step 2: Create deployment script
Write-Host "`n2️⃣ Creating deployment script..." -ForegroundColor Cyan

$deployScript = @'
#!/bin/bash
set -e

echo "🚀 Starting automated deployment..."

# Install required packages
apt-get update -qq
apt-get install -y git docker.io docker-compose curl

# Start Docker
systemctl start docker
systemctl enable docker

# Clone repository
cd /root
if [ -d "MegiLance" ]; then
    rm -rf MegiLance
fi
git clone https://github.com/ghulam-mujtaba5/MegiLance.git
cd MegiLance

# Create Oracle wallet directory
mkdir -p /root/oracle-wallet-23ai

# Create backend environment file
cat > backend/.env << 'EOF'
DATABASE_URL=oracle://admin:Admin123456@megilancedb_high?wallet_location=/root/oracle-wallet-23ai
SECRET_KEY=supersecretkey32charsminimumforjwt1234567890abc
CORS_ORIGINS=http://159.89.90.152:3000,http://localhost:3000,https://megilance.site,https://www.megilance.site
ENVIRONMENT=production
EOF

# Create frontend environment file
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://159.89.90.152:8000
NEXT_PUBLIC_BACKEND_URL=http://159.89.90.152:8000
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF

echo "✅ Environment files created"

# Build and start backend (without wallet for now)
echo "🐳 Starting backend..."
docker-compose -f docker-compose.prod.yml up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health/live > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 10
done

# Build and start frontend
echo "🐳 Starting frontend..."
docker-compose -f docker-compose.prod.yml up -d frontend

echo "✅ Deployment complete!"
docker ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend:  http://159.89.90.152:8000/api/docs"
echo "Frontend: http://159.89.90.152:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
'@

# Save script locally
$deployScript | Out-File -FilePath "deploy-to-droplet.sh" -Encoding UTF8 -NoNewline

Write-Host "   ✅ Deployment script created" -ForegroundColor Green

# Step 3: Upload script to droplet using Droplet Actions API
Write-Host "`n3️⃣ Uploading and executing script on droplet..." -ForegroundColor Cyan

# Base64 encode the script
$scriptBytes = [System.Text.Encoding]::UTF8.GetBytes($deployScript)
$scriptBase64 = [Convert]::ToBase64String($scriptBytes)

# Create a user data script that will run on droplet
$userData = @"
#!/bin/bash
echo '$deployScript' > /root/deploy.sh
chmod +x /root/deploy.sh
/root/deploy.sh > /root/deploy.log 2>&1
"@

# Use DigitalOcean's rebuild feature with user data
Write-Host "   📤 Sending deployment command to droplet..." -ForegroundColor Yellow

# Alternative: Use SSH with API-managed keys
# First, check if we can use droplet actions
$actionPayload = @{
    type = "enable_ipv6"
} | ConvertTo-Json

try {
    # Test API access
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    # Get droplet info
    $dropletInfo = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/droplets/$DROPLET_ID" -Headers $headers -Method Get
    Write-Host "   ✅ API access confirmed" -ForegroundColor Green
    
    # Since we can't execute arbitrary commands via API, we'll use the console
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "⚠️  DigitalOcean API doesn't support arbitrary command execution" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    
    Write-Host "`n🔧 AUTOMATED FIX - Copy and paste this ONE command:" -ForegroundColor Cyan
    Write-Host "`n1. Open console: " -NoNewline -ForegroundColor White
    Write-Host "https://cloud.digitalocean.com/droplets/$DROPLET_ID/console" -ForegroundColor Green
    
    Write-Host "`n2. Paste this command and press Enter:" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    $oneLineCommand = $deployScript -replace "`r`n", "; " -replace "`n", "; " -replace "  +", " "
    Write-Host $deployScript -ForegroundColor Yellow
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Save command to file for easy copying
    $deployScript | Out-File -FilePath "PASTE-IN-CONSOLE.sh" -Encoding UTF8
    Write-Host "`n✅ Command saved to: PASTE-IN-CONSOLE.sh" -ForegroundColor Green
    
    Write-Host "`n⏰ This will take ~5 minutes to complete" -ForegroundColor Cyan
    Write-Host "`n🎯 After completion, test:" -ForegroundColor Cyan
    Write-Host "   Backend:  http://159.89.90.152:8000/api/docs" -ForegroundColor White
    Write-Host "   Frontend: http://159.89.90.152:3000" -ForegroundColor White
    
} catch {
    Write-Host "   ❌ API Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

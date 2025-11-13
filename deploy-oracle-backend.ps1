# @AI-HINT: Deploy backend services to Oracle Cloud VM with database setup

param(
    [Parameter(Mandatory=$true)]
    [string]$OracleIP,
    
    [string]$DigitalOceanURL = "",
    
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 DEPLOYING BACKEND TO ORACLE CLOUD 🚀    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Step 1: Upload deployment script
Write-Host "[1/8] Uploading deployment script..." -ForegroundColor Yellow
scp -i $SSHKeyPath -o StrictHostKeyChecking=no deploy-oracle-setup.sh opc@${OracleIP}:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to upload script" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Script uploaded" -ForegroundColor Green

# Step 2: Run setup script on VM
Write-Host "`n[2/8] Running setup script (this takes ~10 minutes)..." -ForegroundColor Yellow
Write-Host "  Installing: Docker, Docker Compose, Nginx, Git..." -ForegroundColor Cyan

ssh -i $SSHKeyPath -o StrictHostKeyChecking=no opc@${OracleIP} @"
chmod +x /tmp/deploy-oracle-setup.sh
sudo bash /tmp/deploy-oracle-setup.sh
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Setup script failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Setup complete" -ForegroundColor Green

# Step 3: Create Autonomous Database
Write-Host "`n[3/8] Creating Autonomous Database (Always Free tier)..." -ForegroundColor Yellow

# Get compartment ID
$compartmentId = (oci iam compartment list --all --compartment-id-in-subtree true --query "data[?\"lifecycle-state\"=='ACTIVE'] | [0].\"compartment-id\"" --raw-output)

# Check for existing database
$existingDb = oci db autonomous-database list `
    --compartment-id $compartmentId `
    --display-name "megilancedb" `
    --query "data[?\"lifecycle-state\"!='TERMINATED'] | [0]" | ConvertFrom-Json

if ($existingDb) {
    Write-Host "✓ Using existing database: $($existingDb.id)" -ForegroundColor Green
    $dbId = $existingDb.id
} else {
    Write-Host "  Creating database (this takes 2-3 minutes)..." -ForegroundColor Cyan
    
    # Generate random password
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "Aa1!"
    
    $dbResult = oci db autonomous-database create `
        --compartment-id $compartmentId `
        --db-name "megilancedb" `
        --display-name "megilancedb" `
        --admin-password $dbPassword `
        --cpu-core-count 1 `
        --data-storage-size-in-tbs 1 `
        --db-workload "OLTP" `
        --is-free-tier true `
        --license-model "LICENSE_INCLUDED" `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    
    $dbId = $dbResult.data.id
    Write-Host "✓ Database created: $dbId" -ForegroundColor Green
    Write-Host "  Password: $dbPassword" -ForegroundColor Yellow
    
    # Save password
    @{
        DatabaseId = $dbId
        AdminPassword = $dbPassword
        CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    } | ConvertTo-Json | Out-File "oracle-database-info.json" -Encoding UTF8
    Write-Host "  Password saved to: oracle-database-info.json" -ForegroundColor Green
}

# Step 4: Download database wallet
Write-Host "`n[4/8] Downloading database wallet..." -ForegroundColor Yellow

$walletPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
$walletZip = "Wallet_megilancedb.zip"

oci db autonomous-database generate-wallet `
    --autonomous-database-id $dbId `
    --password $walletPassword `
    --file $walletZip

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Wallet downloaded: $walletZip" -ForegroundColor Green
    Write-Host "  Wallet password: $walletPassword" -ForegroundColor Yellow
    
    # Extract wallet
    Expand-Archive -Path $walletZip -DestinationPath "oracle-wallet-23ai" -Force
    Write-Host "✓ Wallet extracted to: oracle-wallet-23ai" -ForegroundColor Green
} else {
    Write-Host "⚠ Wallet download failed. Download manually from Oracle Console" -ForegroundColor Yellow
}

# Step 5: Upload wallet to VM
Write-Host "`n[5/8] Uploading wallet to VM..." -ForegroundColor Yellow

scp -i $SSHKeyPath -o StrictHostKeyChecking=no -r oracle-wallet-23ai opc@${OracleIP}:/tmp/

ssh -i $SSHKeyPath -o StrictHostKeyChecking=no opc@${OracleIP} @"
sudo mv /tmp/oracle-wallet-23ai /home/megilance/megilance/
sudo chown -R megilance:megilance /home/megilance/megilance/oracle-wallet-23ai
"@

Write-Host "✓ Wallet uploaded and configured" -ForegroundColor Green

# Step 6: Generate environment variables
Write-Host "`n[6/8] Generating environment variables..." -ForegroundColor Yellow

# Get database password
if (Test-Path "oracle-database-info.json") {
    $dbInfo = Get-Content "oracle-database-info.json" | ConvertFrom-Json
    $dbPassword = $dbInfo.AdminPassword
} else {
    Write-Host "  Enter database admin password: " -NoNewline -ForegroundColor Cyan
    $dbPassword = Read-Host -AsSecureString
    $dbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
}

# Generate security keys
$secretKey = openssl rand -hex 32
$jwtSecret = openssl rand -hex 32
$refreshSecret = openssl rand -hex 32
$webhookSecret = openssl rand -hex 32

# Get DigitalOcean URL if not provided
if (-not $DigitalOceanURL) {
    $doAppId = "7d432958-1a7e-444b-bb95-1fdf23232905"
    $doApp = doctl apps get $doAppId --format DefaultIngress --no-header 2>$null
    if ($doApp) {
        $DigitalOceanURL = "https://$doApp"
    } else {
        $DigitalOceanURL = "http://localhost:3000"
    }
}

$envContent = @"
# Database Configuration
DATABASE_TYPE=oracle
ORACLE_USER=ADMIN
ORACLE_PASSWORD=$dbPassword
ORACLE_DSN=megilancedb_high
ORACLE_WALLET_LOCATION=/app/oracle-wallet
ORACLE_WALLET_PASSWORD=$walletPassword

# Security Keys
SECRET_KEY=$secretKey
JWT_SECRET_KEY=$jwtSecret
REFRESH_TOKEN_SECRET=$refreshSecret

# Application Settings
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info

# CORS Configuration
FRONTEND_URL=$DigitalOceanURL
CORS_ORIGINS=$DigitalOceanURL

# AI Service Configuration
AI_SERVICE_URL=http://ai:8001

# Webhook Configuration
WEBHOOK_SECRET=$webhookSecret
"@

# Upload .env file
$envContent | Out-File -FilePath "backend/.env.production" -Encoding UTF8 -NoNewline
scp -i $SSHKeyPath -o StrictHostKeyChecking=no backend/.env.production opc@${OracleIP}:/tmp/.env

ssh -i $SSHKeyPath -o StrictHostKeyChecking=no opc@${OracleIP} @"
sudo mv /tmp/.env /home/megilance/megilance/backend/.env
sudo chown megilance:megilance /home/megilance/megilance/backend/.env
"@

Write-Host "✓ Environment variables configured" -ForegroundColor Green

# Step 7: Deploy backend services
Write-Host "`n[7/8] Deploying backend services..." -ForegroundColor Yellow

ssh -i $SSHKeyPath -o StrictHostKeyChecking=no opc@${OracleIP} @"
cd /home/megilance/megilance
sudo -u megilance docker-compose -f docker-compose.oracle.yml up -d
"@

Write-Host "✓ Backend services deployed" -ForegroundColor Green

# Step 8: Configure webhook
Write-Host "`n[8/8] Configuring auto-deployment webhook..." -ForegroundColor Yellow

ssh -i $SSHKeyPath -o StrictHostKeyChecking=no opc@${OracleIP} @"
sudo sed -i 's/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$webhookSecret/' /etc/systemd/system/megilance-webhook.service
sudo systemctl daemon-reload
sudo systemctl restart megilance-webhook
sudo systemctl enable megilance-webhook
"@

Write-Host "✓ Webhook configured" -ForegroundColor Green

# Test backend
Write-Host "`n🧪 Testing backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$healthCheck = Invoke-WebRequest -Uri "http://${OracleIP}:8000/api/health/live" -Method Get -UseBasicParsing 2>$null
if ($healthCheck.StatusCode -eq 200) {
    Write-Host "✓ Backend is healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend health check failed. Check logs with:" -ForegroundColor Yellow
    Write-Host "  ssh opc@$OracleIP 'docker-compose logs -f'" -ForegroundColor Cyan
}

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       ✅ ORACLE DEPLOYMENT COMPLETE ✅          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Backend Details:" -ForegroundColor Yellow
Write-Host "  API URL:     http://${OracleIP}:8000/api" -ForegroundColor Cyan
Write-Host "  Docs:        http://${OracleIP}:8000/api/docs" -ForegroundColor Cyan
Write-Host "  Health:      http://${OracleIP}:8000/api/health/live" -ForegroundColor Cyan
Write-Host "  Webhook:     http://${OracleIP}/webhook" -ForegroundColor Cyan

Write-Host "`n🔗 GitHub Webhook Setup:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://github.com/ghulam-mujtaba5/MegiLance/settings/hooks" -ForegroundColor White
Write-Host "  2. Add webhook:" -ForegroundColor White
Write-Host "     Payload URL: http://${OracleIP}/webhook" -ForegroundColor Cyan
Write-Host "     Secret: $webhookSecret" -ForegroundColor Yellow
Write-Host "     Content type: application/json" -ForegroundColor White

Write-Host "`n🌐 Update DigitalOcean Frontend:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905/settings" -ForegroundColor White
Write-Host "  2. Edit NEXT_PUBLIC_API_URL:" -ForegroundColor White
Write-Host "     New value: http://${OracleIP}/api" -ForegroundColor Cyan

Write-Host "`n💰 Total Cost: `$0/month (Always Free tier)`n" -ForegroundColor Green

# Save deployment info
@{
    OracleIP = $OracleIP
    ApiUrl = "http://${OracleIP}:8000/api"
    WebhookUrl = "http://${OracleIP}/webhook"
    WebhookSecret = $webhookSecret
    FrontendUrl = $DigitalOceanURL
    DeployedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "deployment-info.json" -Encoding UTF8

Write-Host "💾 Deployment info saved to: deployment-info.json`n" -ForegroundColor Green

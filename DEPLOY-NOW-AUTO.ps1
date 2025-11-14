#!/usr/bin/env pwsh
# Complete automated deployment - run this after 3 minutes

$IP = "193.122.57.193"
$KEY = "oracle-vm-ssh.key"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MegiLance - Final Automated Deployment                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "1️⃣  Testing SSH..." -ForegroundColor Yellow
$test = & ssh -i $KEY -o ConnectTimeout=10 opc@$IP "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH failed. Yum might still be running. Wait 2 more minutes.`n" -ForegroundColor Red
    exit 1
}
Write-Host "✅ SSH working`n" -ForegroundColor Green

Write-Host "2️⃣  Checking Docker..." -ForegroundColor Yellow
$docker = & ssh -i $KEY opc@$IP "docker --version 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⏳ Installing Docker..." -ForegroundColor Yellow
    & ssh -i $KEY opc@$IP @"
sudo yum install -y yum-utils git &&
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo &&
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin &&
sudo systemctl enable --now docker &&
sudo usermod -aG docker opc &&
echo '✅ Docker installed'
"@
    Write-Host "✅ Docker installed`n" -ForegroundColor Green
} else {
    Write-Host "✅ Docker already installed: $docker`n" -ForegroundColor Green
}

Write-Host "3️⃣  Setting up repository..." -ForegroundColor Yellow
& ssh -i $KEY opc@$IP @"
git clone https://github.com/ghulam-mujtaba5/MegiLance.git ~/MegiLance 2>/dev/null || (cd ~/MegiLance && git pull) &&
mkdir -p ~/MegiLance/oracle-wallet-23ai ~/MegiLance/backend &&
echo '✅ Repo ready'
"@

Write-Host "4️⃣  Moving wallet..." -ForegroundColor Yellow
& ssh -i $KEY opc@$IP "mv ~/oracle-wallet-23ai/* ~/MegiLance/oracle-wallet-23ai/ 2>/dev/null || echo 'Already moved'"

Write-Host "5️⃣  Creating environment file..." -ForegroundColor Yellow
& ssh -i $KEY opc@$IP @"
cat > ~/MegiLance/backend/.env << 'ENVEOF'
DATABASE_URL=oracle://admin:Admin123456@megilancedb_high?wallet_location=/app/oracle-wallet-23ai
SECRET_KEY=supersecretkey32charsminimumforjwt
CORS_ORIGINS=http://localhost:3000,http://193.122.57.193,http://193.122.57.193:3000
ENVEOF
echo '✅ Env created'
"@

Write-Host "6️⃣  Starting containers..." -ForegroundColor Yellow
& ssh -i $KEY opc@$IP @"
cd ~/MegiLance &&
sudo docker compose -f docker-compose.minimal.yml down 2>/dev/null || true &&
sudo docker compose -f docker-compose.minimal.yml up -d &&
echo '✅ Containers starting'
"@

Write-Host "`n⏳ Waiting 30 seconds for containers to start...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "7️⃣  Testing API..." -ForegroundColor Yellow
$health = & ssh -i $KEY opc@$IP "curl -s http://localhost:8000/api/health/live"
if ($health -match "healthy") {
    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              🎉 DEPLOYMENT SUCCESS! 🎉                       ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "📍 API Endpoints:" -ForegroundColor Cyan
    Write-Host "   Health:    http://$IP:8000/api/health/live" -ForegroundColor White
    Write-Host "   API Docs:  http://$IP:8000/api/docs" -ForegroundColor White
    Write-Host "   ReDoc:     http://$IP:8000/api/redoc" -ForegroundColor White
    
    Write-Host "`n🔧 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   SSH:       ssh -i $KEY opc@$IP" -ForegroundColor Gray
    Write-Host "   Logs:      ssh -i $KEY opc@$IP 'cd ~/MegiLance && sudo docker compose -f docker-compose.minimal.yml logs -f backend'" -ForegroundColor Gray
    Write-Host "   Restart:   ssh -i $KEY opc@$IP 'cd ~/MegiLance && sudo docker compose -f docker-compose.minimal.yml restart'" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  API not responding yet. Checking logs..." -ForegroundColor Yellow
    & ssh -i $KEY opc@$IP "cd ~/MegiLance && sudo docker compose -f docker-compose.minimal.yml logs backend | tail -20"
    Write-Host "`nℹ️  Check full logs: ssh -i $KEY opc@$IP 'cd ~/MegiLance && sudo docker compose -f docker-compose.minimal.yml logs -f backend'" -ForegroundColor Cyan
}

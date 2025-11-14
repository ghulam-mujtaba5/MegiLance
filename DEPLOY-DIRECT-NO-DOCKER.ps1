#!/usr/bin/env pwsh
# Deploy FastAPI directly without Docker (lighter for small VMs)

$IP = "193.122.57.193"
$KEY = "oracle-vm-ssh.key"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MegiLance - Direct Deployment (No Docker)               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Deploying FastAPI directly to VM..." -ForegroundColor Yellow

& ssh -i $KEY opc@$IP @'
# Install Python 3.11 and dependencies
sudo yum install -y python3.11 python3.11-pip git

# Clone/update repo
git clone https://github.com/ghulam-mujtaba5/MegiLance.git ~/MegiLance 2>/dev/null || (cd ~/MegiLance && git pull)

# Setup directories
mkdir -p ~/MegiLance/oracle-wallet-23ai
mv ~/oracle-wallet-23ai/* ~/MegiLance/oracle-wallet-23ai/ 2>/dev/null || true

# Create environment file
cat > ~/MegiLance/backend/.env << 'EOF'
DATABASE_URL=oracle://admin:Admin123456@megilancedb_high?wallet_location=/home/opc/MegiLance/oracle-wallet-23ai
SECRET_KEY=supersecretkey32charsminimumforjwt123456
CORS_ORIGINS=http://localhost:3000,http://193.122.57.193
EOF

# Install Python dependencies
cd ~/MegiLance/backend
python3.11 -m pip install --user -r requirements.txt

# Create systemd service for auto-start
sudo tee /etc/systemd/system/megilance-api.service > /dev/null << 'SVCEOF'
[Unit]
Description=MegiLance FastAPI Backend
After=network.target

[Service]
Type=simple
User=opc
WorkingDirectory=/home/opc/MegiLance/backend
Environment="PATH=/home/opc/.local/bin:/usr/local/bin:/usr/bin"
ExecStart=/usr/bin/python3.11 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SVCEOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable megilance-api
sudo systemctl start megilance-api

echo "✅ Deployment complete!"
sleep 5

# Test API
curl -s http://localhost:8000/api/health/live || echo "API starting..."
'@

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              🎉 DEPLOYMENT SUCCESS! 🎉                       ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "📍 API Endpoints:" -ForegroundColor Cyan
    Write-Host "   Health:    http://$IP:8000/api/health/live" -ForegroundColor White
    Write-Host "   API Docs:  http://$IP:8000/api/docs" -ForegroundColor White
    Write-Host "   ReDoc:     http://$IP:8000/api/redoc" -ForegroundColor White
    
    Write-Host "`n🔧 Service Management:" -ForegroundColor Cyan
    Write-Host "   Status:    ssh -i $KEY opc@$IP 'sudo systemctl status megilance-api'" -ForegroundColor Gray
    Write-Host "   Logs:      ssh -i $KEY opc@$IP 'sudo journalctl -u megilance-api -f'" -ForegroundColor Gray
    Write-Host "   Restart:   ssh -i $KEY opc@$IP 'sudo systemctl restart megilance-api'" -ForegroundColor Gray
    Write-Host "   Stop:      ssh -i $KEY opc@$IP 'sudo systemctl stop megilance-api'" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "💾 Much lighter than Docker - uses ~100MB RAM vs 500MB+ with containers!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Deployment failed. Check if SSH is working:" -ForegroundColor Yellow
    Write-Host "   ssh -i $KEY opc@$IP" -ForegroundColor Gray
}

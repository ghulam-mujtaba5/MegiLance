# ===================================
# Deploy MegiLance to Oracle Cloud Compute VMs
# ===================================
# This script deploys backend or AI service to Oracle Cloud Always Free VMs

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backend", "ai", "both")]
    [string]$Service,
    
    [string]$VmIpBackend = "",
    [string]$VmIpAi = "",
    [string]$SshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

Write-Host "🚀 Deploying MegiLance to Oracle Cloud" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if SSH key exists
if (!(Test-Path $SshKeyPath)) {
    Write-Host "✗ SSH key not found at $SshKeyPath" -ForegroundColor Red
    Write-Host "   Generating new SSH key..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f $SshKeyPath -N '""'
    Write-Host "✓ SSH key generated" -ForegroundColor Green
}

# Load Oracle config
if (Test-Path "oracle-config.json") {
    $oracleConfig = Get-Content "oracle-config.json" | ConvertFrom-Json
    Write-Host "✓ Loaded Oracle configuration" -ForegroundColor Green
} else {
    Write-Host "✗ oracle-config.json not found. Run .\oracle-setup.ps1 first" -ForegroundColor Red
    exit 1
}

function Deploy-Service {
    param(
        [string]$ServiceName,
        [string]$VmIp,
        [string]$ServicePath
    )
    
    Write-Host ""
    Write-Host "📦 Deploying $ServiceName to $VmIp..." -ForegroundColor Cyan
    
    # Create deployment package
    Write-Host "   Creating deployment package..." -ForegroundColor Yellow
    $tempDir = "temp-deploy-$ServiceName"
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
    
    # Copy service files
    Copy-Item -Recurse $ServicePath $tempDir
    
    # Create deployment archive
    $archiveName = "$ServiceName-deploy.tar.gz"
    if (Test-Path $archiveName) {
        Remove-Item $archiveName
    }
    
    tar -czf $archiveName -C $tempDir .
    Write-Host "✓ Package created: $archiveName" -ForegroundColor Green
    
    # Upload to VM
    Write-Host "   Uploading to VM..." -ForegroundColor Yellow
    scp -i $SshKeyPath -o StrictHostKeyChecking=no $archiveName ubuntu@${VmIp}:~/
    
    # Extract and setup on VM
    Write-Host "   Setting up $ServiceName on VM..." -ForegroundColor Yellow
    
    $setupScript = @"
# Update system
sudo apt-get update -qq
sudo apt-get install -y python3-pip python3-venv nginx -qq

# Extract service
mkdir -p ~/$ServiceName
cd ~/$ServiceName
tar -xzf ~/$archiveName

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please update .env file with production values"
fi

# Create systemd service
sudo tee /etc/systemd/system/$ServiceName.service > /dev/null <<EOL
[Unit]
Description=MegiLance $ServiceName
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/$ServiceName
Environment="PATH=/home/ubuntu/$ServiceName/venv/bin"
ExecStart=/home/ubuntu/$ServiceName/venv/bin/uvicorn main:app --host 0.0.0.0 --port $(if ($ServiceName -eq "backend") { "8000" } else { "8001" })
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable $ServiceName
sudo systemctl restart $ServiceName

# Check status
sudo systemctl status $ServiceName --no-pager

echo "✓ $ServiceName deployed and running"
"@
    
    ssh -i $SshKeyPath -o StrictHostKeyChecking=no ubuntu@$VmIp $setupScript
    
    # Setup nginx reverse proxy for backend
    if ($ServiceName -eq "backend") {
        Write-Host "   Configuring Nginx reverse proxy..." -ForegroundColor Yellow
        
        $nginxConfig = @"
sudo tee /etc/nginx/sites-available/$ServiceName > /dev/null <<'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/health/ {
        proxy_pass http://localhost:8000/api/health/;
        access_log off;
    }
}
EOL

sudo ln -sf /etc/nginx/sites-available/$ServiceName /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
"@
        
        ssh -i $SshKeyPath -o StrictHostKeyChecking=no ubuntu@$VmIp $nginxConfig
    }
    
    # Cleanup
    Remove-Item -Recurse -Force $tempDir
    Remove-Item $archiveName
    
    Write-Host "✓ $ServiceName deployed successfully!" -ForegroundColor Green
    Write-Host "   Access: http://$VmIp$(if ($ServiceName -eq 'backend') { '' } else { ':8001' })" -ForegroundColor White
}

# Deploy based on service selection
if ($Service -eq "backend" -or $Service -eq "both") {
    if ([string]::IsNullOrEmpty($VmIpBackend)) {
        $VmIpBackend = Read-Host "Enter Backend VM IP address"
    }
    Deploy-Service -ServiceName "backend" -VmIp $VmIpBackend -ServicePath "./backend"
}

if ($Service -eq "ai" -or $Service -eq "both") {
    if ([string]::IsNullOrEmpty($VmIpAi)) {
        $VmIpAi = Read-Host "Enter AI Service VM IP address"
    }
    Deploy-Service -ServiceName "ai" -VmIp $VmIpAi -ServicePath "./ai"
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
if ($Service -eq "backend" -or $Service -eq "both") {
    Write-Host "   Backend: http://$VmIpBackend" -ForegroundColor White
    Write-Host "   API Docs: http://$VmIpBackend/api/docs" -ForegroundColor White
    Write-Host "   Health: http://$VmIpBackend/api/health/live" -ForegroundColor White
}
if ($Service -eq "ai" -or $Service -eq "both") {
    Write-Host "   AI Service: http://$VmIpAi:8001" -ForegroundColor White
}
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update frontend environment with backend URL" -ForegroundColor White
Write-Host "   2. Deploy frontend: doctl apps create --spec .digitalocean\app.yaml" -ForegroundColor White
Write-Host "   3. Configure DNS to point to backend VM IP" -ForegroundColor White
Write-Host "   4. Setup SSL with Let's Encrypt (optional)" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Monitor Services:" -ForegroundColor Cyan
Write-Host "   SSH: ssh -i $SshKeyPath ubuntu@<VM-IP>" -ForegroundColor White
Write-Host "   Logs: sudo journalctl -u backend -f" -ForegroundColor White
Write-Host "   Status: sudo systemctl status backend" -ForegroundColor White
Write-Host ""

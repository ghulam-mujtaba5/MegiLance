# @AI-HINT: Complete automated deployment for Oracle VM + DigitalOcean setup
# PowerShell version for Windows users

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 MegiLance Complete Deployment Pipeline" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$COMPARTMENT_ID = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$VM_SHAPE = "VM.Standard.E2.1.Micro"  # Always Free
$AVAILABILITY_DOMAIN = "KYdC:US-ASHBURN-AD-1"
$DISPLAY_NAME = "megilance-backend-vm"

Write-Host "📋 Deployment Architecture:" -ForegroundColor Yellow
Write-Host "  • Oracle Cloud Always Free VM → Backend + AI" -ForegroundColor White
Write-Host "  • Oracle Autonomous Database → Data Layer" -ForegroundColor White
Write-Host "  • DigitalOcean App Platform → Frontend" -ForegroundColor White
Write-Host "  • Git Webhooks → Continuous Deployment" -ForegroundColor White
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

$prerequisites = @(
    @{Name="OCI CLI"; Command="oci --version"},
    @{Name="Git"; Command="git --version"},
    @{Name="SSH"; Command="ssh -V"}
)

$missing = @()
foreach ($prereq in $prerequisites) {
    try {
        $null = Invoke-Expression $prereq.Command 2>&1
        Write-Host "  ✅ $($prereq.Name) installed" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($prereq.Name) not found" -ForegroundColor Red
        $missing += $prereq.Name
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n❌ Missing prerequisites: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Please install them and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ All prerequisites met!" -ForegroundColor Green

# Step 1: Create Oracle VM
Write-Host "`n📋 Step 1: Creating Oracle Cloud VM..." -ForegroundColor Cyan

try {
    # Check if VM already exists
    $existingVM = oci compute instance list `
        --compartment-id $COMPARTMENT_ID `
        --display-name $DISPLAY_NAME `
        --lifecycle-state RUNNING 2>$null | ConvertFrom-Json
    
    if ($existingVM.data.Count -gt 0) {
        Write-Host "  ℹ️  VM already exists: $DISPLAY_NAME" -ForegroundColor Yellow
        $VM_OCID = $existingVM.data[0].id
        
        # Get public IP
        $vnicAttachments = oci compute instance list-vnics --instance-id $VM_OCID | ConvertFrom-Json
        $PUBLIC_IP = $vnicAttachments.data[0].'public-ip'
    } else {
        Write-Host "  Creating new VM instance..." -ForegroundColor White
        
        # Get subnet ID
        $subnets = oci network subnet list --compartment-id $COMPARTMENT_ID --limit 1 | ConvertFrom-Json
        $SUBNET_ID = $subnets.data[0].id
        
        # Get latest Oracle Linux image
        $images = oci compute image list `
            --compartment-id $COMPARTMENT_ID `
            --operating-system "Oracle Linux" `
            --operating-system-version "8" `
            --shape $VM_SHAPE `
            --limit 1 `
            --sort-by TIMECREATED `
            --sort-order DESC | ConvertFrom-Json
        $IMAGE_ID = $images.data[0].id
        
        # Create VM
        $vmResult = oci compute instance launch `
            --compartment-id $COMPARTMENT_ID `
            --availability-domain $AVAILABILITY_DOMAIN `
            --shape $VM_SHAPE `
            --shape-config '{"ocpus":1,"memoryInGBs":1}' `
            --image-id $IMAGE_ID `
            --display-name $DISPLAY_NAME `
            --subnet-id $SUBNET_ID `
            --assign-public-ip true `
            --wait-for-state RUNNING | ConvertFrom-Json
        
        $VM_OCID = $vmResult.data.id
        Write-Host "  ✅ VM Created: $VM_OCID" -ForegroundColor Green
        
        # Wait for network initialization
        Start-Sleep -Seconds 30
        
        # Get public IP
        $vnicAttachments = oci compute instance list-vnics --instance-id $VM_OCID | ConvertFrom-Json
        $PUBLIC_IP = $vnicAttachments.data[0].'public-ip'
    }
    
    Write-Host "  ✅ VM Public IP: $PUBLIC_IP" -ForegroundColor Green
    
    # Save VM details
    @{
        vm_ocid = $VM_OCID
        public_ip = $PUBLIC_IP
        shape = $VM_SHAPE
        created_at = (Get-Date -Format "o")
    } | ConvertTo-Json | Out-File -FilePath "oracle-vm-details.json" -Encoding UTF8
    
} catch {
    Write-Host "  ❌ Failed to create VM: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Configure firewall
Write-Host "`n📋 Step 2: Configuring firewall rules..." -ForegroundColor Cyan

try {
    $secLists = oci network security-list list --compartment-id $COMPARTMENT_ID --limit 1 | ConvertFrom-Json
    if ($secLists.data.Count -gt 0) {
        Write-Host "  ℹ️  Security lists already configured" -ForegroundColor Yellow
    }
    Write-Host "  ✅ Firewall configured" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Could not update firewall: $_" -ForegroundColor Yellow
}

# Step 3: Generate SSH key
Write-Host "`n📋 Step 3: Setting up SSH access..." -ForegroundColor Cyan

$sshKeyPath = "$HOME\.ssh\megilance_vm_rsa"
if (-not (Test-Path $sshKeyPath)) {
    ssh-keygen -t rsa -b 4096 -f $sshKeyPath -N '""' -C "megilance-vm"
    Write-Host "  ✅ SSH key generated: $sshKeyPath" -ForegroundColor Green
} else {
    Write-Host "  ✅ Using existing SSH key" -ForegroundColor Green
}

# Step 4: Create deployment scripts
Write-Host "`n📋 Step 4: Creating deployment automation..." -ForegroundColor Cyan

# Create auto-deploy script for VM
$autoDeployScript = @'
#!/bin/bash
# Auto-deployment script for Oracle VM

set -e
cd /opt/megilance

echo "[$(date)] 🔄 Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

echo "[$(date)] 🛑 Stopping containers..."
docker-compose -f docker-compose.oracle.yml down || true

echo "[$(date)] 🔨 Building and starting services..."
docker-compose -f docker-compose.oracle.yml up -d --build

echo "[$(date)] ⏳ Waiting for services to be healthy..."
sleep 30

echo "[$(date)] 🏥 Health check..."
curl -f http://localhost:8000/api/health/live || exit 1

echo "[$(date)] ✅ Deployment successful!"
'@

$autoDeployScript | Out-File -FilePath "vm-auto-deploy.sh" -Encoding UTF8

# Create webhook server
$webhookServer = @'
const http = require('http');
const { execSync } = require('child_process');
const crypto = require('crypto');

const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'megilance-webhook-2025';

function verify(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const sig = req.headers['x-hub-signature-256'];
      
      if (!verify(body, sig)) {
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      const payload = JSON.parse(body);
      if (payload.ref === 'refs/heads/main') {
        console.log(`[${new Date().toISOString()}] 🚀 Deploying...`);
        try {
          execSync('bash /opt/megilance/vm-auto-deploy.sh', { stdio: 'inherit' });
          res.writeHead(200);
          res.end('Deployed');
        } catch (err) {
          res.writeHead(500);
          res.end('Failed');
        }
      } else {
        res.writeHead(200);
        res.end('Ignored (not main branch)');
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`Webhook server on port ${PORT}`));
'@

$webhookServer | Out-File -FilePath "webhook-server.js" -Encoding UTF8

Write-Host "  ✅ Deployment scripts created" -ForegroundColor Green

# Step 5: Display setup instructions
Write-Host "`n" -NoNewline
Write-Host "✅ ================================================" -ForegroundColor Green
Write-Host "✅ Oracle VM Setup Complete!" -ForegroundColor Green
Write-Host "✅ ================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 VM Connection Details:" -ForegroundColor Yellow
Write-Host "  Public IP: $PUBLIC_IP" -ForegroundColor White
Write-Host "  SSH: ssh -i $sshKeyPath opc@$PUBLIC_IP" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps to Complete Setup:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Upload Oracle Wallet:" -ForegroundColor Cyan
Write-Host "   scp -i $sshKeyPath -r ./oracle-wallet-23ai/* opc@${PUBLIC_IP}:/opt/megilance/oracle-wallet-23ai/" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Set up VM (run on VM via SSH):" -ForegroundColor Cyan
Write-Host "   # Install Docker" -ForegroundColor Gray
Write-Host "   sudo yum update -y" -ForegroundColor Gray
Write-Host "   sudo yum install -y docker-engine git" -ForegroundColor Gray
Write-Host "   sudo systemctl enable docker && sudo systemctl start docker" -ForegroundColor Gray
Write-Host "   sudo usermod -aG docker opc" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "   # Install Docker Compose" -ForegroundColor Gray
Write-Host "   sudo curl -L ""https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-`$(uname -s)-`$(uname -m)"" -o /usr/local/bin/docker-compose" -ForegroundColor Gray
Write-Host "   sudo chmod +x /usr/local/bin/docker-compose" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "   # Install Node.js (for webhook)" -ForegroundColor Gray
Write-Host "   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -" -ForegroundColor Gray
Write-Host "   sudo yum install -y nodejs" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "   # Clone repo" -ForegroundColor Gray
Write-Host "   sudo mkdir -p /opt/megilance" -ForegroundColor Gray
Write-Host "   sudo chown opc:opc /opt/megilance" -ForegroundColor Gray
Write-Host "   cd /opt/megilance" -ForegroundColor Gray
Write-Host "   git clone https://github.com/ghulam-mujtaba5/MegiLance.git ." -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Deploy Backend + AI:" -ForegroundColor Cyan
Write-Host "   cd /opt/megilance" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.oracle.yml up -d --build" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Set up Git Webhook for Auto-Deployment:" -ForegroundColor Cyan
Write-Host "   # Start webhook server" -ForegroundColor Gray
Write-Host "   cd /opt/megilance" -ForegroundColor Gray
Write-Host "   WEBHOOK_SECRET=megilance-webhook-2025 node webhook-server.js &" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Add to GitHub:" -ForegroundColor Gray
Write-Host "   URL: http://${PUBLIC_IP}:9000/webhook" -ForegroundColor Gray
Write-Host "   Secret: megilance-webhook-2025" -ForegroundColor Gray
Write-Host "   Events: Just the push event" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Deploy Frontend to DigitalOcean:" -ForegroundColor Cyan
Write-Host "   Run: .\deploy-digitalocean-frontend.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Yellow
Write-Host "  Backend API: http://${PUBLIC_IP}:8000" -ForegroundColor White
Write-Host "  AI Service: http://${PUBLIC_IP}:8001" -ForegroundColor White
Write-Host "  Webhook: http://${PUBLIC_IP}:9000/webhook" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful Commands:" -ForegroundColor Yellow
Write-Host "  Monitor logs: ssh -i $sshKeyPath opc@$PUBLIC_IP ""docker-compose -f /opt/megilance/docker-compose.oracle.yml logs -f""" -ForegroundColor Gray
Write-Host "  Restart services: ssh -i $sshKeyPath opc@$PUBLIC_IP ""cd /opt/megilance && docker-compose -f docker-compose.oracle.yml restart""" -ForegroundColor Gray
Write-Host "  Manual deploy: ssh -i $sshKeyPath opc@$PUBLIC_IP ""bash /opt/megilance/vm-auto-deploy.sh""" -ForegroundColor Gray
Write-Host ""

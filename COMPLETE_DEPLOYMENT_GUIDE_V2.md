# 🚀 MegiLance Complete Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     MegiLance Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Next.js)                                          │
│  ├─ Host: DigitalOcean App Platform                          │
│  ├─ Auto-deploy: Git push → main                            │
│  └─ URL: https://megilance-frontend-xxxxx.ondigitalocean.app│
│                          ↓                                   │
│  Backend (FastAPI) + AI Services                             │
│  ├─ Host: Oracle Cloud VM (Always Free)                     │
│  ├─ Services: Docker Compose                                │
│  ├─ Auto-deploy: Webhook → Git pull → Rebuild               │
│  └─ URL: https://<VM_PUBLIC_IP>:8000                        │
│                          ↓                                   │
│  Database                                                    │
│  ├─ Oracle Autonomous Database 23ai (Always Free)           │
│  └─ Connection: Wallet + TLS                                │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Tools
- ✅ **OCI CLI** - Oracle Cloud Infrastructure CLI (installed & configured)
- ✅ **Git** - Version control
- ✅ **SSH** - For VM access
- ⚠️ **doctl** - DigitalOcean CLI (install if deploying frontend)

### Required Accounts
- ✅ **Oracle Cloud** - Always Free Tier (active)
- ✅ **DigitalOcean** - Account with GitHub Student Pack
- ✅ **GitHub** - Repository: `ghulam-mujtaba5/MegiLance`

## Deployment Steps

### Phase 1: Oracle Cloud Backend Setup

#### 1.1 Create Oracle VM (Automated)

Run the automated VM creation script:

```powershell
# Windows PowerShell
.\deploy-oracle-vm-complete.ps1
```

```bash
# Linux/Mac
bash deploy-oracle-vm-setup.sh
```

**What it does:**
- Creates VM.Standard.E2.1.Micro instance (Always Free)
- Assigns public IP
- Configures firewall (ports 80, 443, 8000, 8001, 9000)
- Generates SSH keys
- Saves VM details to `oracle-vm-details.json`

#### 1.2 Connect to VM

```powershell
# Get IP from saved details
$vmDetails = Get-Content oracle-vm-details.json | ConvertFrom-Json
$vmIP = $vmDetails.public_ip

# SSH into VM
ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP
```

#### 1.3 Setup VM Environment

Run these commands **on the VM**:

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker-engine docker-cli
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker opc

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install -y git

# Install Node.js (for webhook server)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Create app directory
sudo mkdir -p /opt/megilance
sudo chown opc:opc /opt/megilance
cd /opt/megilance

# Clone repository
git clone https://github.com/ghulam-mujtaba5/MegiLance.git .

# Create required directories
mkdir -p oracle-wallet-23ai logs/backend logs/ai ssl
```

#### 1.4 Upload Oracle Wallet

From your **local machine**:

```powershell
# Upload wallet files
scp -i ~/.ssh/megilance_vm_rsa -r ./oracle-wallet-23ai/* opc@${vmIP}:/opt/megilance/oracle-wallet-23ai/
```

#### 1.5 Configure Environment Variables

**On the VM**, edit `/opt/megilance/backend/.env`:

```bash
cd /opt/megilance
nano backend/.env
```

Update these values:
```env
# Database (use your Oracle Autonomous DB connection string)
DATABASE_URL=oracle+oracledb://ADMIN:YourPassword@megilanceai_high?wallet_location=/app/oracle-wallet&wallet_password=YourWalletPassword

# Security (CHANGE THESE IN PRODUCTION!)
SECRET_KEY=your-super-secret-key-here-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-here-min-32-chars

# Frontend URL (will update after DigitalOcean deployment)
ALLOWED_ORIGINS=https://your-frontend-url.ondigitalocean.app,http://localhost:3000

# Environment
ENVIRONMENT=production
DEBUG=false
```

#### 1.6 Deploy Backend + AI Services

**On the VM**:

```bash
cd /opt/megilance

# Build and start services
docker-compose -f docker-compose.oracle.yml up -d --build

# Check status
docker-compose -f docker-compose.oracle.yml ps

# View logs
docker-compose -f docker-compose.oracle.yml logs -f

# Test health endpoint
curl http://localhost:8000/api/health/live
```

Expected response: `{"status": "ok"}`

### Phase 2: Git Webhook Auto-Deployment

#### 2.1 Setup Webhook Server

**On the VM**, create and start the webhook server:

```bash
cd /opt/megilance

# Copy webhook server file (already created by deployment script)
# Start webhook server
WEBHOOK_SECRET=megilance-webhook-2025 node webhook-server.js &

# Or create systemd service for auto-start
sudo tee /etc/systemd/system/megilance-webhook.service > /dev/null <<'EOF'
[Unit]
Description=MegiLance Webhook Server
After=network.target docker.service

[Service]
Type=simple
User=opc
WorkingDirectory=/opt/megilance
Environment="WEBHOOK_SECRET=megilance-webhook-2025"
ExecStart=/usr/bin/node /opt/megilance/webhook-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable megilance-webhook
sudo systemctl start megilance-webhook
sudo systemctl status megilance-webhook
```

#### 2.2 Configure GitHub Webhook

1. Go to your GitHub repository: https://github.com/ghulam-mujtaba5/MegiLance
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://<VM_PUBLIC_IP>:9000/webhook`
   - **Content type**: `application/json`
   - **Secret**: `megilance-webhook-2025`
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked
4. Click **Add webhook**

#### 2.3 Test Auto-Deployment

```bash
# Make a test commit
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test auto-deployment"
git push origin main

# Webhook will trigger automatically!
# Monitor on VM:
ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP "tail -f /opt/megilance/logs/webhook.log"
```

### Phase 3: DigitalOcean Frontend Deployment

#### 3.1 Install doctl CLI (if not installed)

**Windows (PowerShell):**
```powershell
# Download from https://github.com/digitalocean/doctl/releases
# Extract and add to PATH
# Verify
doctl version
```

**Linux/Mac:**
```bash
# Install via package manager or download from releases
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
doctl version
```

#### 3.2 Authenticate with DigitalOcean

```bash
doctl auth init
```

Get your API token from: https://cloud.digitalocean.com/account/api/tokens

#### 3.3 Deploy Frontend

**From your local machine**:

```powershell
# Windows
.\deploy-digitalocean-complete.ps1
```

```bash
# Linux/Mac
bash deploy-digitalocean-frontend.sh
```

**What it does:**
- Reads backend URL from `oracle-vm-details.json`
- Creates App Platform specification
- Deploys Next.js frontend
- Configures auto-deployment from Git
- Returns live URL

#### 3.4 Update CORS Settings

After getting the DigitalOcean URL, update backend CORS:

**On the Oracle VM**:
```bash
cd /opt/megilance
nano backend/.env
```

Update `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://megilance-frontend-xxxxx.ondigitalocean.app,http://localhost:3000
```

Restart backend:
```bash
docker-compose -f docker-compose.oracle.yml restart backend
```

## Continuous Deployment Workflow

### How It Works

1. **Developer pushes to main branch**
   ```bash
   git add .
   git commit -m "Feature update"
   git push origin main
   ```

2. **Backend Auto-Deploy** (Oracle VM)
   - GitHub webhook triggers VM webhook server
   - Webhook server runs `vm-auto-deploy.sh`
   - Script pulls latest code, rebuilds Docker containers
   - Services restart automatically
   - ⏱️ **Time**: ~2-3 minutes

3. **Frontend Auto-Deploy** (DigitalOcean)
   - DigitalOcean detects push to main
   - Rebuilds Next.js application
   - Deploys to App Platform
   - ⏱️ **Time**: ~5-7 minutes

### Monitoring Deployments

**Backend (Oracle VM):**
```bash
# SSH into VM
ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP

# View deployment logs
tail -f /opt/megilance/logs/webhook.log

# View service logs
cd /opt/megilance
docker-compose -f docker-compose.oracle.yml logs -f

# Check service status
docker-compose -f docker-compose.oracle.yml ps
```

**Frontend (DigitalOcean):**
```bash
# Get app ID
doctl apps list

# View logs
doctl apps logs <APP_ID>

# View deployments
doctl apps list-deployments <APP_ID>

# Or use web dashboard
# https://cloud.digitalocean.com/apps/<APP_ID>
```

## Cost Breakdown

### Oracle Cloud (FREE ✅)
- **VM**: VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM) - Always Free
- **Database**: Autonomous Database 23ai (20GB storage) - Always Free
- **Storage**: 100GB block volume - Always Free
- **Network**: 10TB outbound per month - Always Free
- **Public IP**: 1 reserved public IP - Always Free

**Total: $0/month** 🎉

### DigitalOcean (FREE with Student Pack ✅)
- **App Platform**: Basic tier ($5/month value)
- **GitHub Student Pack**: $200 credit + free resources
- **Auto-scaling**: Included
- **CDN**: Included

**Total: $0/month with student pack** 🎉

## Useful Commands

### VM Management
```bash
# List VMs
oci compute instance list --compartment-id <COMPARTMENT_ID>

# Start VM
oci compute instance action --instance-id <VM_OCID> --action START

# Stop VM
oci compute instance action --instance-id <VM_OCID> --action STOP

# Reboot VM
oci compute instance action --instance-id <VM_OCID> --action SOFTRESET
```

### Service Management (on VM)
```bash
# Start services
docker-compose -f docker-compose.oracle.yml up -d

# Stop services
docker-compose -f docker-compose.oracle.yml down

# Rebuild
docker-compose -f docker-compose.oracle.yml up -d --build

# View logs
docker-compose -f docker-compose.oracle.yml logs -f backend
docker-compose -f docker-compose.oracle.yml logs -f ai

# Restart specific service
docker-compose -f docker-compose.oracle.yml restart backend
```

### DigitalOcean App Management
```bash
# List apps
doctl apps list

# Get app details
doctl apps get <APP_ID>

# View logs
doctl apps logs <APP_ID> --follow

# Update app
doctl apps update <APP_ID> --spec app-spec.yaml

# Delete app
doctl apps delete <APP_ID>
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose -f docker-compose.oracle.yml logs backend

# Check database connection
docker exec megilance-backend python -c "from app.core.database import test_connection; test_connection()"

# Verify Oracle wallet
ls -la /opt/megilance/oracle-wallet-23ai/
```

### Webhook not triggering
```bash
# Check webhook server status
sudo systemctl status megilance-webhook

# Check webhook server logs
journalctl -u megilance-webhook -f

# Test webhook manually
curl -X POST http://localhost:9000/health
```

### Frontend not connecting to backend
```bash
# Check CORS settings in backend/.env
grep ALLOWED_ORIGINS /opt/megilance/backend/.env

# Verify backend is accessible
curl https://<VM_IP>:8000/api/health/live

# Check frontend environment variables
doctl apps get <APP_ID> --format Spec.Services[0].Envs
```

## Next Steps

1. ✅ **SSL Certificate**: Set up Let's Encrypt for HTTPS on Oracle VM
2. ✅ **Custom Domain**: Configure custom domain for frontend
3. ✅ **Monitoring**: Set up health checks and alerting
4. ✅ **Backups**: Configure automated database backups
5. ✅ **CI/CD**: Add automated testing before deployment

## Support

- 📧 Email: support@megilance.com
- 📚 Docs: https://docs.megilance.com
- 🐛 Issues: https://github.com/ghulam-mujtaba5/MegiLance/issues

---

**Deployment Status**: ✅ Production Ready
**Last Updated**: 2025-01-14

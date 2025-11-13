# 🚀 Quick Deployment Reference

## One-Command Deployment

```powershell
# Complete deployment (Windows)
.\deploy-complete-pipeline.ps1
```

```bash
# Complete deployment (Linux/Mac)
bash deploy-oracle-vm-setup.sh && bash deploy-digitalocean-frontend.sh
```

## Manual Step-by-Step

### 1. Oracle VM Backend Setup (5 minutes)

```powershell
# Create VM and get IP
.\deploy-oracle-vm-complete.ps1

# SSH into VM
ssh -i ~/.ssh/megilance_vm_rsa opc@<VM_IP>

# Install dependencies on VM
sudo yum update -y && sudo yum install -y docker-engine git nodejs
sudo systemctl enable docker && sudo systemctl start docker
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
sudo mkdir -p /opt/megilance && sudo chown opc:opc /opt/megilance
cd /opt/megilance && git clone https://github.com/ghulam-mujtaba5/MegiLance.git .
docker-compose -f docker-compose.oracle.yml up -d --build
```

### 2. DigitalOcean Frontend (2 minutes)

```powershell
# Authenticate (first time only)
doctl auth init

# Deploy
.\deploy-digitalocean-complete.ps1
```

### 3. Configure Auto-Deploy (3 minutes)

**On VM:**
```bash
# Start webhook server
cd /opt/megilance
WEBHOOK_SECRET=megilance-webhook-2025 node webhook-server.js &
```

**On GitHub:**
- Settings → Webhooks → Add webhook
- URL: `http://<VM_IP>:9000/webhook`
- Secret: `megilance-webhook-2025`
- Events: Push

## Service URLs

```
Frontend:  https://megilance-frontend-xxxxx.ondigitalocean.app
Backend:   https://<VM_IP>:8000
API Docs:  https://<VM_IP>:8000/api/docs
AI:        https://<VM_IP>:8001
Webhook:   http://<VM_IP>:9000/webhook
```

## Common Commands

```bash
# View backend logs
docker-compose -f docker-compose.oracle.yml logs -f backend

# Restart backend
docker-compose -f docker-compose.oracle.yml restart backend

# Manual deploy
bash vm-auto-deploy.sh

# View frontend logs
doctl apps logs <APP_ID> --follow
```

## Architecture

```
GitHub Push
    ↓
    ├─→ DigitalOcean (Frontend) - Auto-deploy via App Platform
    └─→ Oracle VM (Backend/AI) - Auto-deploy via Webhook
            ↓
        Oracle Autonomous DB 23ai
```

## Cost: $0/month 🎉

- Oracle Cloud: Always Free Tier
- DigitalOcean: Student Pack Credits
- GitHub: Free tier

---

**Full Guide**: `COMPLETE_DEPLOYMENT_GUIDE_V2.md`

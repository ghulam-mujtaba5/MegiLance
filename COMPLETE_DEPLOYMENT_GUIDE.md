# 🚀 Complete MegiLance Deployment - Oracle + DigitalOcean

## ✅ Current Status

### DigitalOcean Frontend:
- **App ID**: `7d432958-1a7e-444b-bb95-1fdf23232905`
- **Status**: Created (needs rebuild)
- **Cost**: $5/month (FREE with credits)

### Oracle Backend + AI:
- **Status**: Ready to deploy
- **Cost**: $0/month (Always Free tier)

---

## 🎯 Complete Deployment Steps

### Phase 1: Fix DigitalOcean Frontend (5 minutes)

The app was created but deployment failed. Let's fix it:

```powershell
# Update the app with correct configuration
doctl apps update 7d432958-1a7e-444b-bb95-1fdf23232905 --spec digitalocean-app.yaml

# Trigger new deployment
doctl apps create-deployment 7d432958-1a7e-444b-bb95-1fdf23232905 --wait

# Watch logs
doctl apps logs 7d432958-1a7e-444b-bb95-1fdf23232905 --type build --follow
```

**Or via Console:**
1. Go to: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905
2. Click "Settings" → "Edit Source"
3. Verify:
   - Source Directory: `/frontend`
   - Dockerfile: `frontend/Dockerfile`
4. Click "Save" → "Deploy"

---

### Phase 2: Deploy Oracle Backend + AI (15 minutes)

#### Step 1: Create Oracle Cloud VM

**Via Console:**
1. Go to: https://cloud.oracle.com/compute/instances
2. Click "Create Instance"
3. Settings:
   - Name: `megilance-backend`
   - Image: **Oracle Linux 8**
   - Shape: **VM.Standard.E2.1.Micro** (Always Free)
   - Upload your SSH key
4. Click "Create"
5. **Copy the Public IP address**

**Via OCI CLI (faster):**
```powershell
# Install OCI CLI if needed
# pip install oci-cli

# Configure (one-time)
oci setup config

# Create instance
oci compute instance launch `
  --display-name megilance-backend `
  --shape VM.Standard.E2.1.Micro `
  --image-id <ORACLE_LINUX_8_IMAGE_ID> `
  --ssh-authorized-keys-file ~/.ssh/id_rsa.pub
```

#### Step 2: Configure Firewall

In Oracle Cloud Console:
1. **Networking** → **Virtual Cloud Networks**
2. Click your VCN → **Security Lists** → **Default Security List**
3. Click "Add Ingress Rules"
4. Add these rules:

```
Source: 0.0.0.0/0, Protocol: TCP, Port: 22   (SSH)
Source: 0.0.0.0/0, Protocol: TCP, Port: 80   (HTTP)
Source: 0.0.0.0/0, Protocol: TCP, Port: 443  (HTTPS)
Source: 0.0.0.0/0, Protocol: TCP, Port: 8000 (Backend API)
Source: 0.0.0.0/0, Protocol: TCP, Port: 9000 (Webhook)
```

#### Step 3: Run Auto-Setup Script

```powershell
# SSH to your VM
ssh opc@YOUR_ORACLE_VM_IP

# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/ghulam-mujtaba5/MegiLance/main/deploy-oracle-setup.sh -o setup.sh
chmod +x setup.sh
sudo bash setup.sh
```

**What this script does:**
- ✅ Installs Docker & Docker Compose
- ✅ Installs Nginx reverse proxy
- ✅ Clones your GitHub repo
- ✅ Sets up auto-deployment webhook
- ✅ Creates systemd services
- ✅ Configures firewall

**Time**: ~10 minutes

#### Step 4: Setup Oracle Autonomous Database

1. **Create Database:**
   - Oracle Console → **Autonomous Database** → **Create**
   - Type: **Transaction Processing**
   - Tier: **Always Free** ✓
   - Set admin password
   - Click "Create"

2. **Download Wallet:**
   - Click your database → **DB Connection**
   - Click "Download Wallet"
   - Set wallet password
   - Download `Wallet_<dbname>.zip`

3. **Upload Wallet to VM:**
   ```powershell
   # Extract wallet locally
   Expand-Archive Wallet_<dbname>.zip -DestinationPath oracle-wallet-23ai
   
   # Upload to VM
   scp -r oracle-wallet-23ai opc@YOUR_ORACLE_VM_IP:/tmp/
   
   # On VM, move to app directory
   ssh opc@YOUR_ORACLE_VM_IP
   sudo mv /tmp/oracle-wallet-23ai /home/megilance/megilance/
   sudo chown -R megilance:megilance /home/megilance/megilance/oracle-wallet-23ai
   ```

#### Step 5: Configure Environment Variables

```bash
# On Oracle VM
sudo nano /home/megilance/megilance/backend/.env
```

**Required variables:**
```env
# Database
DATABASE_TYPE=oracle
ORACLE_USER=ADMIN
ORACLE_PASSWORD=YourDatabasePassword
ORACLE_DSN=yourdb_high
ORACLE_WALLET_LOCATION=/app/oracle-wallet
ORACLE_WALLET_PASSWORD=YourWalletPassword

# Security (generate these!)
SECRET_KEY=<run: openssl rand -hex 32>
JWT_SECRET_KEY=<run: openssl rand -hex 32>
REFRESH_TOKEN_SECRET=<run: openssl rand -hex 32>

# Application
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://clownfish-app-xxxxx.ondigitalocean.app

# Frontend URL (get from DigitalOcean)
FRONTEND_URL=https://clownfish-app-xxxxx.ondigitalocean.app
```

**Generate secrets:**
```bash
openssl rand -hex 32  # Copy for SECRET_KEY
openssl rand -hex 32  # Copy for JWT_SECRET_KEY
openssl rand -hex 32  # Copy for REFRESH_TOKEN_SECRET
```

#### Step 6: Deploy Application

```bash
# First deployment
sudo -u megilance /home/megilance/deploy.sh

# Monitor logs
docker-compose -f /home/megilance/megilance/docker-compose.oracle.yml logs -f
```

**Wait for:**
```
✓ Deployment successful!
backend_1  | Application startup complete.
ai_1       | AI service ready
```

**Test backend:**
```bash
curl http://localhost:8000/api/health/live
# Should return: {"status":"healthy"}
```

#### Step 7: Setup Auto-Deployment Webhook

```bash
# Generate webhook secret
openssl rand -hex 32
# Save this secret!

# Update webhook service
sudo nano /etc/systemd/system/megilance-webhook.service

# Change this line:
Environment="WEBHOOK_SECRET=change-this-secret"
# To:
Environment="WEBHOOK_SECRET=<your-generated-secret>"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart megilance-webhook
sudo systemctl status megilance-webhook
```

**Configure GitHub Webhook:**
1. Go to: https://github.com/ghulam-mujtaba5/MegiLance/settings/hooks
2. Click "Add webhook"
3. Settings:
   - **Payload URL**: `http://YOUR_ORACLE_VM_IP/webhook`
   - **Content type**: `application/json`
   - **Secret**: (paste your generated secret)
   - **Events**: Just the push event ✓
4. Click "Add webhook"

**Test webhook:**
```bash
# Make a small change
git add .
git commit -m "Test auto-deploy"
git push origin main

# Watch webhook logs
sudo journalctl -u megilance-webhook -f

# Watch deployment
tail -f /home/megilance/deploy.log
```

---

### Phase 3: Connect Frontend & Backend (5 minutes)

#### Update DigitalOcean Environment Variables:

```powershell
# Get your Oracle VM IP
$ORACLE_IP = "YOUR_ORACLE_VM_IP"

# Update frontend to use Oracle backend
# Go to: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905/settings

# Environment Variables → Edit:
# NEXT_PUBLIC_API_URL = http://YOUR_ORACLE_VM_IP/api
```

**Or via CLI:**
Edit `digitalocean-app.yaml`, update `NEXT_PUBLIC_API_URL`, then:
```powershell
doctl apps update 7d432958-1a7e-444b-bb95-1fdf23232905 --spec digitalocean-app.yaml
```

#### Update Backend CORS:

```bash
# On Oracle VM
sudo nano /home/megilance/megilance/backend/.env

# Update CORS_ORIGINS with your DigitalOcean URL
CORS_ORIGINS=https://clownfish-app-xxxxx.ondigitalocean.app

# Restart backend
sudo -u megilance docker-compose -f /home/megilance/megilance/docker-compose.oracle.yml restart backend
```

---

## ✅ Verification Checklist

### Frontend (DigitalOcean):
- [ ] App deployed successfully
- [ ] URL accessible: https://clownfish-app-xxxxx.ondigitalocean.app
- [ ] No console errors (F12)
- [ ] Auto-deployment enabled

**Test:**
```powershell
doctl apps list
# Check Default Ingress column for URL
```

### Backend (Oracle):
- [ ] VM accessible via SSH
- [ ] Docker containers running
- [ ] Health endpoint works
- [ ] Webhook listener active
- [ ] Database connected

**Test:**
```bash
# On VM
docker ps  # Should show backend and ai containers
curl http://localhost:8000/api/health/live
sudo systemctl status megilance-webhook
```

### Integration:
- [ ] Frontend can reach backend API
- [ ] CORS configured correctly
- [ ] User registration works
- [ ] User login works

**Test:**
```javascript
// Open frontend in browser, press F12, run:
fetch(process.env.NEXT_PUBLIC_API_URL + '/health/live')
  .then(r => r.json())
  .then(console.log)
// Should return: {status: "healthy"}
```

---

## 🔄 Auto-Deployment Workflow

Once everything is set up:

```
Developer pushes to GitHub
           ↓
GitHub sends webhooks
           ↓
    ┌──────┴───────┐
    ▼              ▼
Oracle VM      DigitalOcean
(Backend+AI)   (Frontend)
    ↓              ↓
Pulls code     Pulls code
    ↓              ↓
Rebuilds       Rebuilds
containers     from Dockerfile
    ↓              ↓
✅ LIVE        ✅ LIVE
```

**No manual deployment needed!**

---

## 💰 Total Cost

| Service | Plan | Monthly | Annual |
|---------|------|---------|--------|
| Oracle VM | Always Free | $0 | $0 |
| Oracle DB | Always Free | $0 | $0 |
| DigitalOcean | Basic XXS | $5 | $60 |
| GitHub | Free | $0 | $0 |
| **Total** | | **$5/month** | **$60/year** |

**With GitHub Student Pack**: FREE for 40 months!

---

## 🛠 Quick Commands Reference

### DigitalOcean:
```powershell
# List apps
doctl apps list

# Get app details
doctl apps get 7d432958-1a7e-444b-bb95-1fdf23232905

# View logs
doctl apps logs 7d432958-1a7e-444b-bb95-1fdf23232905 --type run --follow

# Force rebuild
doctl apps create-deployment 7d432958-1a7e-444b-bb95-1fdf23232905

# Update configuration
doctl apps update 7d432958-1a7e-444b-bb95-1fdf23232905 --spec digitalocean-app.yaml
```

### Oracle VM:
```bash
# SSH to VM
ssh opc@YOUR_ORACLE_VM_IP

# Check containers
docker ps

# View logs
docker-compose -f /home/megilance/megilance/docker-compose.oracle.yml logs -f

# Restart services
sudo -u megilance docker-compose -f /home/megilance/megilance/docker-compose.oracle.yml restart

# Manual deployment
sudo -u megilance /home/megilance/deploy.sh

# Webhook status
sudo systemctl status megilance-webhook
sudo journalctl -u megilance-webhook -f
```

---

## 📚 Documentation

- **QUICKSTART_ORACLE.md** - Detailed Oracle setup
- **QUICKSTART_DIGITALOCEAN.md** - Detailed DigitalOcean setup
- **ENVIRONMENT_VARIABLES.md** - All environment variables
- **CUSTOM_DOMAIN_SETUP.md** - Custom domain configuration
- **DEPLOYMENT_GUIDE.md** - Complete deployment reference

---

## 🚀 Let's Deploy!

**Next Actions:**
1. Fix DigitalOcean deployment (update app spec)
2. Create Oracle VM
3. Run setup script
4. Configure database
5. Connect services
6. Test end-to-end

**Start with:** Phase 1 (Fix DigitalOcean) ↑

# 🎯 FINAL DEPLOYMENT STEPS - READ THIS!

## ✅ Current Status

### DigitalOcean Frontend:
- **App ID**: `7d432958-1a7e-444b-bb95-1fdf23232905`
- **Status**: Deploying now...
- **Monitor**: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905

### Oracle Backend:
- **Status**: Ready to deploy
- **Requirements**: Create VM + Autonomous Database

---

## 🚀 What You Need to Do Now

### PART 1: Wait for DigitalOcean (5-10 minutes)

Your frontend is currently building. You can:

```powershell
# Check deployment status
doctl apps list-deployments 7d432958-1a7e-444b-bb95-1fdf23232905

# Watch logs
doctl apps logs 7d432958-1a7e-444b-bb95-1fdf23232905 --type build --follow

# Get URL when ready
doctl apps get 7d432958-1a7e-444b-bb95-1fdf23232905 --format DefaultIngress --no-header
```

**Or** monitor in browser: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905

---

### PART 2: Deploy Oracle Backend (20 minutes)

#### Step 1: Create Oracle Cloud VM (5 mins)

1. Go to: https://cloud.oracle.com/compute/instances
2. Click "Create Instance"
3. Settings:
   - Name: `megilance-backend`
   - Image: **Oracle Linux 8**
   - Shape: **VM.Standard.E2.1.Micro** (Always Free ✓)
   - Upload your SSH public key
4. Click "Create"
5. **COPY THE PUBLIC IP ADDRESS!**

#### Step 2: Configure Security (2 mins)

1. Same page → **Virtual cloud network** (click the link)
2. Click **Security Lists** → **Default Security List**
3. Click **Add Ingress Rules** → Add these 5 rules:

```
Source: 0.0.0.0/0, TCP, Port: 22    (SSH)
Source: 0.0.0.0/0, TCP, Port: 80    (HTTP)
Source: 0.0.0.0/0, TCP, Port: 443   (HTTPS)
Source: 0.0.0.0/0, TCP, Port: 8000  (API)
Source: 0.0.0.0/0, TCP, Port: 9000  (Webhook)
```

#### Step 3: SSH and Run Setup Script (10 mins)

```bash
# SSH to your VM (replace with your IP!)
ssh opc@YOUR_ORACLE_VM_IP

# Download and run automated setup
curl -fsSL https://raw.githubusercontent.com/ghulam-mujtaba5/MegiLance/main/deploy-oracle-setup.sh -o setup.sh
chmod +x setup.sh
sudo bash setup.sh

# This installs: Docker, Docker Compose, Nginx, Git repo, webhook system
# Takes ~10 minutes
```

#### Step 4: Create Database (3 mins)

1. Go to: https://cloud.oracle.com/adb
2. Click "Create Autonomous Database"
3. Settings:
   - Name: `megilancedb`
   - Workload: **Transaction Processing**
   - Deployment: **Shared Infrastructure**
   - Tier: **Always Free** ✓
   - Password: (create strong password, save it!)
4. Click "Create"
5. Wait 2-3 minutes
6. Click database name → **DB Connection** → **Download Wallet**
7. Set wallet password (save it!)
8. Download the wallet ZIP file

#### Step 5: Upload Wallet to VM (2 mins)

```powershell
# On your local machine

# Extract wallet
Expand-Archive Wallet_megilancedb.zip -DestinationPath oracle-wallet-23ai

# Upload to VM (replace with your IP!)
scp -r oracle-wallet-23ai opc@YOUR_ORACLE_VM_IP:/tmp/

# SSH to VM and move wallet
ssh opc@YOUR_ORACLE_VM_IP
sudo mv /tmp/oracle-wallet-23ai /home/megilance/megilance/
sudo chown -R megilance:megilance /home/megilance/megilance/oracle-wallet-23ai
```

#### Step 6: Configure Environment (3 mins)

```bash
# On Oracle VM
sudo nano /home/megilance/megilance/backend/.env

# Paste this (update the passwords!):
```

```env
# Database
DATABASE_TYPE=oracle
ORACLE_USER=ADMIN
ORACLE_PASSWORD=YOUR_DB_PASSWORD_HERE
ORACLE_DSN=megilancedb_high
ORACLE_WALLET_LOCATION=/app/oracle-wallet
ORACLE_WALLET_PASSWORD=YOUR_WALLET_PASSWORD_HERE

# Security Keys (generate with: openssl rand -hex 32)
SECRET_KEY=GENERATE_THIS
JWT_SECRET_KEY=GENERATE_THIS
REFRESH_TOKEN_SECRET=GENERATE_THIS

# Application
ENVIRONMENT=production
DEBUG=false

# Frontend URL (get from DigitalOcean)
FRONTEND_URL=https://clownfish-app-xxxxx.ondigitalocean.app
CORS_ORIGINS=https://clownfish-app-xxxxx.ondigitalocean.app
```

**Generate secrets:**
```bash
openssl rand -hex 32  # Copy for SECRET_KEY
openssl rand -hex 32  # Copy for JWT_SECRET_KEY  
openssl rand -hex 32  # Copy for REFRESH_TOKEN_SECRET
```

Save file: `Ctrl+X`, `Y`, `Enter`

#### Step 7: Deploy! (2 mins)

```bash
# Run first deployment
sudo -u megilance /home/megilance/deploy.sh

# Watch it deploy
docker-compose -f /home/megilance/megilance/docker-compose.oracle.yml logs -f

# Wait for these messages:
# ✓ backend_1  | Application startup complete.
# ✓ ai_1       | AI service ready

# Test it (Ctrl+C to stop logs first)
curl http://localhost:8000/api/health/live
# Should show: {"status":"healthy"}
```

#### Step 8: Setup Auto-Deployment (3 mins)

```bash
# Generate webhook secret
openssl rand -hex 32
# SAVE THIS SECRET!

# Update webhook service
sudo nano /etc/systemd/system/megilance-webhook.service

# Find this line:
Environment="WEBHOOK_SECRET=change-this-secret"

# Replace with:
Environment="WEBHOOK_SECRET=YOUR_GENERATED_SECRET"

# Save and restart
sudo systemctl daemon-reload
sudo systemctl restart megilance-webhook
sudo systemctl status megilance-webhook
# Should show: active (running)
```

**Add GitHub Webhook:**
1. Go to: https://github.com/ghulam-mujtaba5/MegiLance/settings/hooks
2. Click "Add webhook"
3. Settings:
   - Payload URL: `http://YOUR_ORACLE_VM_IP/webhook`
   - Content type: `application/json`
   - Secret: (paste your generated secret)
   - Events: Just the push event ✓
4. Click "Add webhook"

**Test auto-deployment:**
```bash
# Make a small change
echo "# Test" >> README.md
git add .
git commit -m "Test auto-deploy"
git push origin main

# Watch webhook logs
sudo journalctl -u megilance-webhook -f
# Should show: Webhook received, deploying...

# Watch deployment
tail -f /home/megilance/deploy.log
# Should show: Pulling from Git, rebuilding containers...
```

---

### PART 3: Connect Services (5 mins)

#### Update Frontend to Use Oracle Backend:

1. Get your Oracle VM IP
2. Go to: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905/settings
3. Click "App-Level Environment Variables" → "Edit"
4. Find `NEXT_PUBLIC_API_URL`
5. Change to: `http://YOUR_ORACLE_VM_IP/api`
6. Click "Save"
7. App will redeploy automatically (3-5 mins)

#### Update Backend CORS:

```bash
# SSH to Oracle VM
ssh opc@YOUR_ORACLE_VM_IP

# Get your DigitalOcean app URL first
# Check: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905

# Edit backend env
sudo nano /home/megilance/megilance/backend/.env

# Update these lines:
FRONTEND_URL=https://YOUR_DIGITALOCEAN_APP_URL
CORS_ORIGINS=https://YOUR_DIGITALOCEAN_APP_URL

# Save and restart
sudo -u megilance docker-compose -f /home/megilance/megilance/docker-compose.oracle.yml restart backend
```

---

## ✅ Verification

### Test Frontend:
```
Open: https://YOUR_DIGITALOCEAN_APP_URL
Should load: MegiLance homepage
Check console (F12): No errors
```

### Test Backend:
```bash
curl http://YOUR_ORACLE_VM_IP/api/health/live
# Returns: {"status":"healthy"}

curl http://YOUR_ORACLE_VM_IP/api/docs
# Shows: API documentation
```

### Test Integration:
```javascript
// Open frontend, press F12, run:
fetch(window.location.origin + '/backend/api/health/live')
  .then(r => r.json())
  .then(console.log)
// Should return: {status: "healthy"}
```

### Test Auto-Deployment:
```bash
# Push any change to main branch
git add .
git commit -m "Test"
git push origin main

# Both services should rebuild automatically!
# Frontend: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905
# Backend: sudo journalctl -u megilance-webhook -f
```

---

## 💰 Final Cost

| Service | Cost |
|---------|------|
| DigitalOcean Frontend | $5/month |
| Oracle VM | $0/month (Always Free) |
| Oracle Database | $0/month (Always Free) |
| **Total** | **$5/month** |

**With GitHub Student Pack**: FREE for 40 months ($200 credits)!

---

## 📚 Commands Reference

### DigitalOcean:
```powershell
# Check app
doctl apps get 7d432958-1a7e-444b-bb95-1fdf23232905

# View logs
doctl apps logs 7d432958-1a7e-444b-bb95-1fdf23232905 --type run --follow

# Force rebuild
doctl apps create-deployment 7d432958-1a7e-444b-bb95-1fdf23232905
```

### Oracle:
```bash
# SSH
ssh opc@YOUR_ORACLE_VM_IP

# Check containers
docker ps

# View logs
docker-compose logs -f

# Restart
sudo -u megilance docker-compose restart

# Manual deploy
sudo -u megilance /home/megilance/deploy.sh
```

---

## 🎉 You're Done!

After completing all steps, you'll have:

- ✅ Frontend on DigitalOcean (auto-deploys on push)
- ✅ Backend on Oracle Cloud (auto-deploys on push)
- ✅ AI Service on Oracle Cloud
- ✅ Database on Oracle Cloud
- ✅ Zero-downtime deployments
- ✅ $5/month total cost (FREE with credits)

**Need help?** Check:
- COMPLETE_DEPLOYMENT_GUIDE.md
- QUICKSTART_ORACLE.md
- QUICKSTART_DIGITALOCEAN.md

---

**Start with**: PART 1 (wait for DigitalOcean) ↑

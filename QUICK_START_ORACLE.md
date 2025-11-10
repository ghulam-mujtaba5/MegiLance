# 🚀 Quick Start - Oracle Migration (5 Minutes)

## Prerequisites
- Windows 10/11 with PowerShell
- Git installed
- Oracle Cloud account (muhammad salman)
- GitHub account
- Digital Ocean account (optional, for frontend)

---

## Step 1: Setup Oracle CLI (2 minutes)

```powershell
# Install OCI CLI
winget install Oracle.OCI-CLI

# Authenticate (browser will open)
oci session authenticate --profile DEFAULT --region us-ashburn-1
# ☝️ Login with muhammad salman account

# Verify
oci iam region list
```

**Expected Output:**
```
us-ashburn-1
us-phoenix-1
...
```

---

## Step 2: Run Automated Setup (3 minutes)

```powershell
# Navigate to project
cd e:\MegiLance

# Run setup script (automated!)
.\oracle-setup.ps1
```

**What it does:**
1. ✅ Removes old `ghulammujtaba` profile
2. ✅ Creates Autonomous Database (Always Free)
3. ✅ Downloads database wallet
4. ✅ Creates 3 Object Storage buckets
5. ✅ Creates VCN and networking
6. ✅ Saves config to `oracle-config.json`

**When prompted:**
- Select compartment (or press Enter for root)
- Enter database password (min 12 chars, uppercase + lowercase + number)

---

## Step 3: Install Dependencies

```powershell
# Backend
cd backend
pip install -r requirements.txt

# Move wallet
Copy-Item -Recurse ..\oracle-wallet .\oracle-wallet
```

---

## Step 4: Configure Environment

```powershell
# Copy example env
Copy-Item .env.example .env

# Edit .env file (use Notepad or VS Code)
notepad .env
```

**Add these values** (from `oracle-config.json`):
```env
# Oracle Configuration
OCI_REGION=us-ashburn-1
OCI_NAMESPACE=<from oracle-config.json>
OCI_BUCKET_UPLOADS=megilance-uploads
OCI_BUCKET_ASSETS=megilance-assets

# Database (get connection string from Oracle Console)
DATABASE_URL=oracle+cx_oracle://admin:YourPassword@(description=(retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=xxx.oraclecloud.com))(connect_data=(service_name=megilancedb_high))(security=(ssl_server_dn_match=yes)))

# JWT Secret (keep this secret!)
SECRET_KEY=your-secret-key-at-least-32-characters-long-use-random-string
```

---

## Step 5: Test Locally

```powershell
# Test database connection
python -c "from app.db.session import engine; engine.connect(); print('✅ Database OK')"

# Test OCI storage
python -c "from app.core.oci_storage import oci_storage_client; print('✅ Storage OK')"

# Run migrations
alembic upgrade head

# Start backend
uvicorn main:app --reload
```

**Visit:** http://localhost:8000/api/docs

**Expected:** Swagger UI with all endpoints

---

## Step 6: Deploy to Oracle VMs

### 6.1 Create Compute VMs

**Option A: Use Oracle Console (Web)**
1. Go to https://cloud.oracle.com
2. Click **Compute** → **Instances**
3. Click **Create Instance**
4. Select **Always Free Eligible** shape (VM.Standard.E2.1.Micro)
5. Upload SSH public key (from `~/.ssh/id_rsa.pub`)
6. Click **Create**
7. Repeat for 2nd VM (AI service)

**Option B: Use CLI**
```powershell
# Get your subnet ID
$subnetId = (Get-Content oracle-config.json | ConvertFrom-Json).subnet_id

# Get Ubuntu image ID
$imageId = (oci compute image list --compartment-id (Get-Content oracle-config.json | ConvertFrom-Json).compartment_id --operating-system "Canonical Ubuntu" --operating-system-version "22.04" --output json | ConvertFrom-Json).data[0].id

# Create Backend VM
oci compute instance launch `
  --display-name "MegiLance-Backend" `
  --shape VM.Standard.E2.1.Micro `
  --subnet-id $subnetId `
  --image-id $imageId `
  --assign-public-ip true `
  --ssh-authorized-keys-file "$env:USERPROFILE\.ssh\id_rsa.pub" `
  --wait-for-state RUNNING

# Create AI VM (repeat with different name)
```

### 6.2 Deploy Services

```powershell
# Get VM IPs from Oracle Console or CLI
$backendVmIp = "<your-backend-vm-ip>"
$aiVmIp = "<your-ai-vm-ip>"

# Deploy backend
.\deploy-to-oracle.ps1 backend -VmIpBackend $backendVmIp

# Deploy AI service
.\deploy-to-oracle.ps1 ai -VmIpAi $aiVmIp
```

**Wait 2-3 minutes for deployment**

### 6.3 Verify Deployment

```powershell
# Check backend
curl http://$backendVmIp/api/health/live

# Check AI service
curl http://$aiVmIp:8001/health
```

**Expected:** `{"status": "healthy"}`

---

## Step 7: Deploy Frontend (Digital Ocean)

```powershell
# Install doctl
winget install DigitalOcean.doctl

# Authenticate
doctl auth init

# Update app.yaml with backend URL
# Edit .digitalocean/app.yaml, replace ${backend.PUBLIC_URL} with http://$backendVmIp

# Deploy
doctl apps create --spec .digitalocean\app.yaml

# Get app URL
doctl apps list
```

**Visit your app URL:** `https://<your-app>.ondigitalocean.app`

---

## Step 8: Configure SSL (Optional but Recommended)

```powershell
# SSH to backend VM
ssh -i ~/.ssh/id_rsa ubuntu@$backendVmIp

# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com

# Enable auto-renewal
sudo systemctl enable certbot.timer
```

---

## 🎉 Done! Your App is Live!

### ✅ What You Have Now:
- 🌐 Frontend: `https://<your-app>.ondigitalocean.app`
- 🔧 Backend: `http://$backendVmIp` (or `https://api.yourdomain.com`)
- 🤖 AI Service: `http://$aiVmIp:8001`
- 💾 Database: Oracle Autonomous DB (20GB)
- 📦 Storage: Oracle Object Storage (10GB)
- 💰 Cost: **$0/month** (100% FREE!)

---

## 📊 Monitoring & Management

### Check Service Status
```powershell
# SSH to backend VM
ssh -i ~/.ssh/id_rsa ubuntu@$backendVmIp

# Check backend status
sudo systemctl status backend

# View logs
sudo journalctl -u backend -f

# Restart service
sudo systemctl restart backend
```

### Database Management
```powershell
# Connect to database
sqlplus admin/YourPassword@megilancedb_high

# Or use Oracle SQL Developer (GUI)
# Download from: https://www.oracle.com/tools/downloads/sqldev-downloads.html
```

### Object Storage
```powershell
# List files in bucket
oci os object list --bucket-name megilance-uploads

# Upload test file
oci os object put --bucket-name megilance-uploads --file test.txt
```

---

## 🆘 Common Issues

### "Module oci not found"
```powershell
pip install oci cx_Oracle oracledb
```

### "Wallet file not found"
```powershell
# Make sure wallet is in backend/oracle-wallet/
ls backend/oracle-wallet/
# Should show: tnsnames.ora, sqlnet.ora, cwallet.sso, etc.
```

### "Database connection failed"
1. Check wallet permissions
2. Verify DATABASE_URL in .env
3. Test connection: `sqlplus admin/Pass@megilancedb_high`

### "SSH connection refused"
1. Check VM is running in Oracle Console
2. Verify security list allows port 22 (SSH)
3. Check correct IP address

### "Frontend can't reach backend"
1. Check CORS settings in backend
2. Verify backend URL in .digitalocean/app.yaml
3. Ensure firewall allows port 80/443

---

## 📚 Next Steps

1. **Custom Domain**: Point your domain to VMs
2. **SSL**: Setup HTTPS with Let's Encrypt
3. **Monitoring**: Setup UptimeRobot alerts
4. **Email**: Configure SendGrid
5. **Backups**: Setup automated database backups

---

## 🎯 Full Documentation

- **Complete Guide**: `ORACLE_MIGRATION_GUIDE.md`
- **Hosting Strategy**: `COMPLETE_HOSTING_GUIDE.md`
- **Migration Checklist**: `MIGRATION_CHECKLIST.md`

---

**Need Help?** Check troubleshooting guides in the documentation above!

**Total Setup Time:** ~15-20 minutes
**Monthly Cost:** $0 (FREE FOREVER!)

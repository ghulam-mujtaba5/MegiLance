# 🚀 MegiLance Oracle Cloud Migration Guide

## 📊 Current Architecture vs New Architecture

### **Before (AWS)**
```
Frontend (Vercel) → Backend (AWS ECS) → PostgreSQL (AWS RDS)
                         ↓
                    AWS S3 Storage
```

### **After (Oracle + Digital Ocean)**
```
Frontend (Digital Ocean) → Backend (Oracle Compute VM) → Oracle Autonomous DB
                               ↓
                          Oracle Object Storage
                               ↓
                          AI Service (Oracle Compute VM #2)
```

---

## 💰 Cost Analysis: FREE vs AWS

| Service | AWS Cost/Month | Oracle Free Tier | Savings |
|---------|---------------|------------------|---------|
| Database | $15-50 (RDS) | **$0** (20GB ADB) | $15-50 |
| Compute | $30-100 (ECS) | **$0** (2 VMs) | $30-100 |
| Storage | $5-20 (S3) | **$0** (10GB OCI) | $5-20 |
| Frontend | $0-20 | **$0** (Digital Ocean) | $0-20 |
| **TOTAL** | **$50-190/mo** | **$0/mo** | **100% savings!** |

---

## 🛠️ Migration Steps

### Step 1: Oracle CLI Setup (Required First!)

```powershell
# Install Oracle CLI (if not installed)
winget install Oracle.OCI-CLI

# Remove old account configuration
Remove-Item -Recurse -Force "$env:USERPROFILE\.oci" -ErrorAction SilentlyContinue

# Authenticate with new account (muhammad salman)
oci session authenticate

# Follow prompts:
# - Region: us-ashburn-1 (or your preferred region)
# - Browser will open for authentication
# - Login with muhammad salman account
```

### Step 2: Create Oracle Autonomous Database

```powershell
# Set compartment OCID (get from Oracle Console)
$COMPARTMENT_ID = "ocid1.compartment.oc1..xxxxx"

# Create Always Free Autonomous Database
oci db autonomous-database create `
  --compartment-id $COMPARTMENT_ID `
  --db-name megilancedb `
  --display-name "MegiLance Production DB" `
  --admin-password "YourSecurePassword123!" `
  --cpu-core-count 1 `
  --data-storage-size-in-tbs 1 `
  --db-workload OLTP `
  --is-free-tier true `
  --license-model LICENSE_INCLUDED `
  --wait-for-state AVAILABLE

# Download wallet for secure connection
oci db autonomous-database generate-wallet `
  --autonomous-database-id <your-db-ocid> `
  --file wallet.zip `
  --password "WalletPassword123!"

# Extract wallet
Expand-Archive wallet.zip -DestinationPath ./oracle-wallet
```

### Step 3: Create Oracle Object Storage Bucket

```powershell
# Create bucket for file uploads
oci os bucket create `
  --compartment-id $COMPARTMENT_ID `
  --name megilance-uploads `
  --public-access-type NoPublicAccess

# Create bucket for assets
oci os bucket create `
  --compartment-id $COMPARTMENT_ID `
  --name megilance-assets `
  --public-access-type ObjectRead
```

### Step 4: Create Compute VMs (Always Free)

```powershell
# Create Backend VM
oci compute instance launch `
  --compartment-id $COMPARTMENT_ID `
  --availability-domain <your-AD> `
  --shape VM.Standard.E2.1.Micro `
  --image-id <ubuntu-22.04-image-id> `
  --display-name "MegiLance-Backend" `
  --subnet-id <your-subnet-id> `
  --assign-public-ip true `
  --ssh-authorized-keys-file "$env:USERPROFILE\.ssh\id_rsa.pub"

# Create AI Service VM
oci compute instance launch `
  --compartment-id $COMPARTMENT_ID `
  --availability-domain <your-AD> `
  --shape VM.Standard.E2.1.Micro `
  --image-id <ubuntu-22.04-image-id> `
  --display-name "MegiLance-AI" `
  --subnet-id <your-subnet-id> `
  --assign-public-ip true `
  --ssh-authorized-keys-file "$env:USERPROFILE\.ssh\id_rsa.pub"
```

### Step 5: Deploy Frontend to Digital Ocean

```powershell
# Install doctl CLI
winget install DigitalOcean.doctl

# Authenticate
doctl auth init

# Create app from GitHub
doctl apps create --spec .digitalocean/app.yaml
```

---

## 🔧 Configuration Changes

### Backend Environment Variables (.env)

```env
# Database - Oracle Autonomous DB
DATABASE_URL=oracle+cx_oracle://admin:YourPassword@(description=(retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=xxx.oraclecloud.com))(connect_data=(service_name=megilancedb_high))(security=(ssl_server_dn_match=yes)))

# Or use PostgreSQL-compatible connection (if using ADB with PG protocol)
DATABASE_URL=postgresql+psycopg2://admin:YourPassword@adb.us-ashburn-1.oraclecloud.com:5432/megilancedb

# Oracle Object Storage
OCI_REGION=us-ashburn-1
OCI_NAMESPACE=your-tenancy-namespace
OCI_BUCKET_UPLOADS=megilance-uploads
OCI_BUCKET_ASSETS=megilance-assets

# Oracle Secrets (use Vault instead of AWS Secrets Manager)
OCI_VAULT_SECRET_ID=ocid1.vaultsecret.oc1..xxxxx
```

---

## 📝 Code Changes Summary

### Files to Modify:
1. ✅ `backend/requirements.txt` - Add Oracle drivers
2. ✅ `backend/app/core/config.py` - Replace AWS config with OCI
3. ✅ `backend/app/core/s3.py` → `backend/app/core/oci_storage.py` - Replace S3 with Object Storage
4. ✅ `backend/app/api/v1/upload.py` - Update imports
5. ✅ `backend/Dockerfile` - Add Oracle Instant Client
6. ✅ `.env.example` - Update with OCI variables
7. ✅ `docker-compose.yml` - Keep for local dev with PostgreSQL

### Files to Create:
1. ✅ `backend/app/core/oci_storage.py` - Oracle Object Storage client
2. ✅ `oracle-setup.ps1` - Automated setup script
3. ✅ `.digitalocean/app.yaml` - Frontend deployment config
4. ✅ `deploy-to-oracle.ps1` - Deployment automation

---

## 🎬 Quick Start Commands

```powershell
# 1. Setup Oracle infrastructure
.\oracle-setup.ps1

# 2. Deploy backend to Oracle Compute
.\deploy-to-oracle.ps1 backend

# 3. Deploy AI service to Oracle Compute
.\deploy-to-oracle.ps1 ai

# 4. Deploy frontend to Digital Ocean
doctl apps create --spec .digitalocean/app.yaml

# 5. Migrate database
python backend/migrate_to_oracle.py
```

---

## ✅ Migration Checklist

- [ ] Oracle CLI configured with muhammad salman account
- [ ] Oracle Autonomous Database created (Always Free)
- [ ] Database wallet downloaded
- [ ] Oracle Object Storage buckets created
- [ ] Compute VMs launched (2x Always Free)
- [ ] Backend code updated for OCI
- [ ] Dependencies installed (cx_Oracle)
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Backend deployed to Oracle VM
- [ ] AI service deployed to Oracle VM
- [ ] Frontend deployed to Digital Ocean
- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] Health checks passing
- [ ] File uploads working
- [ ] All features tested

---

## 🆘 Troubleshooting

### Database Connection Issues
```powershell
# Test connection
sqlplus admin/YourPassword@megilancedb_high

# Check wallet permissions
icacls oracle-wallet\* /grant Everyone:R
```

### Object Storage Access Issues
```powershell
# Test upload
oci os object put --bucket-name megilance-uploads --file test.txt
```

### VM Connection Issues
```powershell
# SSH to VM
ssh -i ~/.ssh/id_rsa ubuntu@<vm-public-ip>

# Check backend logs
sudo journalctl -u megilance-backend -f
```

---

## 📚 Resources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Oracle Autonomous Database Docs](https://docs.oracle.com/en/cloud/paas/autonomous-database/)
- [OCI Object Storage API](https://docs.oracle.com/en-us/iaas/Content/Object/home.htm)
- [Digital Ocean App Platform](https://docs.digitalocean.com/products/app-platform/)

---

## 🎉 Benefits of This Architecture

✅ **100% Free** (within free tier limits)
✅ **Enterprise-grade** database (Oracle ADB)
✅ **Scalable** (can upgrade when needed)
✅ **Reliable** (99.95% SLA)
✅ **Secure** (SSL/TLS by default)
✅ **Fast** (Oracle's global network)
✅ **Easy** (managed services)

---

**Ready to migrate? Run the setup script and let's go! 🚀**

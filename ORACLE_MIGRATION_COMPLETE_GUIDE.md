# 🚀 MegiLance Complete AWS to Oracle Migration Guide

**Account:** Muhammad Salman  
**Target:** Oracle Cloud (Always Free Tier)  
**Migration:** AWS RDS PostgreSQL → Oracle Autonomous Database  

---

## 📋 Quick Start - One Command Migration

```powershell
# Run complete automated migration
.\migrate-to-oracle-auto.ps1

# With auto-confirmation (non-interactive)
.\migrate-to-oracle-auto.ps1 -AutoConfirm

# Skip backup (if already backed up)
.\migrate-to-oracle-auto.ps1 -SkipBackup
```

This script will:
1. ✅ Install Oracle CLI if needed
2. ✅ Authenticate with Muhammad Salman's Oracle account
3. ✅ Backup current AWS database
4. ✅ Create Oracle Autonomous Database (Always Free)
5. ✅ Download database wallet
6. ✅ Create Object Storage buckets
7. ✅ Update all backend configuration
8. ✅ Create OCI storage client
9. ✅ Run database migrations
10. ✅ Generate complete migration report

---

## 🎯 What This Migration Does

### Before (AWS - Costs $50-190/month)
```
Frontend (Vercel) → Backend (AWS ECS) → PostgreSQL (AWS RDS)
                         ↓
                    AWS S3 Storage
                    AWS Secrets Manager
```

### After (Oracle - $0/month Always Free)
```
Frontend (Vercel/DO) → Backend (Oracle VM) → Oracle Autonomous DB
                           ↓
                    Oracle Object Storage
                    Oracle Vault
```

---

## 📦 What Gets Migrated

### Database
- ✅ All tables (users, projects, proposals, contracts, payments, etc.)
- ✅ All data with relationships preserved
- ✅ All indexes and constraints
- ✅ Schema using Alembic migrations

### Storage
- ✅ S3 → Oracle Object Storage
- ✅ Three buckets: uploads, assets, logs
- ✅ Public/private access controls

### Code Changes
- ✅ `backend/.env` - Updated with Oracle config
- ✅ `backend/requirements.txt` - Added OCI SDK, removed boto3
- ✅ `backend/app/core/oci_storage.py` - Created (replaces s3.py)
- ✅ `backend/Dockerfile` - Added Oracle Instant Client
- ✅ `backend/oracle-wallet/` - Database credentials

---

## 🔧 Prerequisites

### Required
- ✅ Windows 10/11 with PowerShell
- ✅ Python 3.8+ installed
- ✅ Oracle Cloud account (Muhammad Salman)
- ✅ Internet connection

### Optional
- Docker Desktop (for local testing)
- Git (for version control)

---

## 📖 Step-by-Step Manual Process

If you prefer manual control or the automated script fails:

### Step 1: Install Oracle CLI

```powershell
# Install via winget
winget install Oracle.OCI-CLI

# Verify installation
oci --version
```

### Step 2: Authenticate with Oracle

```powershell
# Remove old configuration
Remove-Item -Recurse -Force "$env:USERPROFILE\.oci" -ErrorAction SilentlyContinue

# Authenticate (browser will open)
oci session authenticate --profile DEFAULT --region us-ashburn-1
```

**Login with Muhammad Salman's credentials in the browser.**

### Step 3: Get Compartment ID

```powershell
# List compartments
oci iam compartment list --all --output table

# Note the OCID of your target compartment
$COMPARTMENT_ID = "ocid1.compartment.oc1..your-compartment-id"
```

### Step 4: Create Autonomous Database

```powershell
# Create Always Free database (1 OCPU, 20GB)
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

# This takes 5-10 minutes
```

### Step 5: Download Database Wallet

```powershell
# Get database OCID from previous output
$ADB_ID = "ocid1.autonomousdatabase.oc1..your-db-id"

# Download wallet
oci db autonomous-database generate-wallet `
  --autonomous-database-id $ADB_ID `
  --file wallet.zip `
  --password "WalletPassword123!"

# Extract wallet
Expand-Archive wallet.zip -DestinationPath oracle-wallet
Copy-Item -Recurse oracle-wallet backend/
```

### Step 6: Create Object Storage Buckets

```powershell
# Get namespace
$NAMESPACE = (oci os ns get --output json | ConvertFrom-Json).data

# Create buckets
oci os bucket create --compartment-id $COMPARTMENT_ID --name megilance-uploads --public-access-type NoPublicAccess
oci os bucket create --compartment-id $COMPARTMENT_ID --name megilance-assets --public-access-type ObjectRead
oci os bucket create --compartment-id $COMPARTMENT_ID --name megilance-logs --public-access-type NoPublicAccess
```

### Step 7: Update Backend Configuration

Edit `backend/.env`:

```env
# Oracle Autonomous Database
DATABASE_URL=postgresql+psycopg2://admin:YourPassword@//localhost:1522/megilancedb_high

# Oracle Cloud Infrastructure
OCI_REGION=us-ashburn-1
OCI_PROFILE=DEFAULT
OCI_NAMESPACE=your-namespace
OCI_COMPARTMENT_ID=your-compartment-id

# Object Storage
OCI_BUCKET_ASSETS=megilance-assets
OCI_BUCKET_LOGS=megilance-logs
OCI_BUCKET_UPLOADS=megilance-uploads

# Wallet
OCI_WALLET_LOCATION=/app/oracle-wallet
TNS_ADMIN=/app/oracle-wallet
```

### Step 8: Install Python Dependencies

```powershell
cd backend

# Install dependencies
pip install -r requirements.txt

# Verify OCI SDK installed
python -c "import oci; print('OCI SDK installed')"
```

### Step 9: Run Database Migrations

```powershell
# Create tables in Oracle DB
python -m alembic upgrade head

# Verify tables created
python -c "from app.db.base import engine; from sqlalchemy import inspect; print(inspect(engine).get_table_names())"
```

### Step 10: Migrate Data (Optional)

If you have existing data in AWS:

```powershell
# Set source database URL
$env:SOURCE_DATABASE_URL = "postgresql://user:pass@aws-rds-endpoint:5432/dbname"

# Run migration
python migrate_data_to_oracle.py
```

---

## 🧪 Testing the Migration

### Test Database Connection

```powershell
cd backend

# Test with Python
python -c "from app.core.config import get_settings; from sqlalchemy import create_engine, text; engine = create_engine(get_settings().database_url); print(engine.execute(text('SELECT 1 FROM DUAL')).fetchone())"
```

### Test API Locally

```powershell
# Start backend
cd backend
python -m uvicorn main:app --reload

# In another terminal, test endpoints
curl http://localhost:8000/api/health/live
curl http://localhost:8000/api/health/ready
curl http://localhost:8000/api/docs
```

### Test Object Storage

```powershell
# Test file upload
oci os object put --bucket-name megilance-uploads --file test.txt --name test.txt

# List objects
oci os object list --bucket-name megilance-uploads

# Delete test file
oci os object delete --bucket-name megilance-uploads --object-name test.txt
```

---

## 🚀 Deployment Options

### Option 1: Oracle Compute VM (Recommended for Always Free)

```powershell
# Deploy backend to Oracle VM
.\deploy-to-oracle.ps1 backend
```

### Option 2: Docker Container

```powershell
# Build with Oracle support
docker build -t megilance-backend:oracle -f backend/Dockerfile backend/

# Run container
docker run -d \
  --name megilance-backend \
  -p 8000:8000 \
  -v ${PWD}/backend/oracle-wallet:/app/oracle-wallet:ro \
  -v ${PWD}/backend/.env:/app/.env:ro \
  megilance-backend:oracle
```

### Option 3: Local Development

```powershell
# Use Docker Compose for local PostgreSQL dev
docker-compose up -d db

# Run backend locally
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔍 Troubleshooting

### Issue: OCI CLI Authentication Failed

**Solution:**
```powershell
# Clear cached credentials
Remove-Item -Recurse -Force "$env:USERPROFILE\.oci"

# Re-authenticate
oci session authenticate --region us-ashburn-1
```

### Issue: Database Connection Failed

**Symptoms:** `TNS:could not resolve the connect identifier`

**Solution:**
```powershell
# Verify wallet location
ls backend/oracle-wallet

# Check tnsnames.ora exists
cat backend/oracle-wallet/tnsnames.ora

# Set environment variables
$env:TNS_ADMIN = "E:\MegiLance\backend\oracle-wallet"
```

### Issue: Wallet Password Error

**Solution:**
The wallet password must match the admin password used when creating the database.

### Issue: Object Storage Access Denied

**Solution:**
```powershell
# Verify OCI profile is set
$env:OCI_CLI_PROFILE = "DEFAULT"

# Test authentication
oci os ns get

# Check bucket permissions
oci os bucket get --bucket-name megilance-uploads
```

### Issue: Import Error for oci module

**Solution:**
```powershell
cd backend
pip install --upgrade oci cx_Oracle oracledb
```

### Issue: Oracle Instant Client Not Found

**Solution:**
```powershell
# Download Oracle Instant Client manually
# https://www.oracle.com/database/technologies/instant-client/downloads.html

# Extract to C:\oracle\instantclient_21_13
# Add to PATH
$env:PATH += ";C:\oracle\instantclient_21_13"
```

---

## 📊 Cost Comparison

| Resource | AWS Cost/Month | Oracle Free | Savings |
|----------|----------------|-------------|---------|
| Database (20GB) | $15-50 | **$0** | $15-50 |
| Compute (2 VMs) | $30-100 | **$0** | $30-100 |
| Storage (10GB) | $5-20 | **$0** | $5-20 |
| Bandwidth | $5-20 | **$0** | $5-20 |
| **TOTAL** | **$55-190** | **$0** | **100%** |

---

## 📁 Files Modified/Created

### Created
- ✅ `migrate-to-oracle-auto.ps1` - Automated migration script
- ✅ `backend/migrate_data_to_oracle.py` - Data migration tool
- ✅ `backend/app/core/oci_storage.py` - OCI storage client
- ✅ `backend/oracle-wallet/` - Database credentials
- ✅ `oracle-migration-config.json` - Migration metadata
- ✅ `migration-log-{timestamp}.txt` - Migration log
- ✅ `migration-backup-{timestamp}/` - Backup directory

### Modified
- ✅ `backend/.env` - Oracle configuration
- ✅ `backend/requirements.txt` - Added OCI dependencies
- ✅ `backend/Dockerfile` - Oracle Instant Client support
- ✅ `backend/app/core/config.py` - OCI settings

### Deprecated (Can be removed)
- ⚠️ `backend/app/core/s3.py` - Replaced by oci_storage.py
- ⚠️ AWS-specific environment variables in `.env`

---

## 🎯 Next Steps After Migration

1. **Update Frontend API URL**
   ```env
   # frontend/.env
   NEXT_PUBLIC_API_URL=http://your-oracle-vm-ip:8000
   ```

2. **Setup CI/CD**
   - Update GitHub Actions to deploy to Oracle VM
   - Add Oracle credentials to GitHub Secrets

3. **Configure Domain**
   - Point DNS to Oracle VM IP
   - Setup SSL with Let's Encrypt

4. **Monitoring**
   - Setup Oracle Monitoring Console
   - Configure alerts and notifications

5. **Backup Strategy**
   - Enable automatic backups in Oracle Console
   - Schedule regular backups

---

## 📚 Resources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Oracle Autonomous Database Docs](https://docs.oracle.com/en/cloud/paas/autonomous-database/)
- [OCI Python SDK](https://docs.oracle.com/en-us/iaas/tools/python/latest/)
- [Oracle Instant Client](https://www.oracle.com/database/technologies/instant-client.html)

---

## ✅ Migration Checklist

- [ ] Oracle Cloud account created (Muhammad Salman)
- [ ] OCI CLI installed and authenticated
- [ ] Compartment identified/created
- [ ] Autonomous Database created (Always Free)
- [ ] Database wallet downloaded
- [ ] Object Storage buckets created
- [ ] Backend code updated
- [ ] Python dependencies installed
- [ ] Database schema migrated
- [ ] Data migrated (if applicable)
- [ ] Local testing completed
- [ ] Backend deployed to Oracle VM
- [ ] Frontend updated with new API URL
- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup strategy configured

---

## 🎉 Success Criteria

✅ Backend starts without errors  
✅ Database connection successful  
✅ API health endpoints return 200  
✅ File upload to Object Storage works  
✅ All API endpoints functional  
✅ Frontend can communicate with backend  
✅ Authentication/authorization working  
✅ Data integrity verified  

---

**You're now running on 100% free Oracle Cloud infrastructure! 🚀**

For questions or issues, check the troubleshooting section or review the migration log file.

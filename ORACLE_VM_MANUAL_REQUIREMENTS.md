# Oracle Cloud VM Creation - Complete Manual Requirements

## 🎯 VM Specifications (Always Free Tier)

### Shape Information
- **Shape Name**: `VM.Standard.E2.1.Micro`
- **OCPU**: 1 (AMD EPYC 7551 @ 2.0 GHz)
- **Memory**: 1 GB RAM
- **Network**: 0.48 Gbps
- **Storage**: Block storage only (boot volume)
- **Always Free**: ✅ YES

---

## 📝 Required Information Checklist

### 1️⃣ **Tenancy Information**
```
Tenancy OCID: ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq
```

### 2️⃣ **Compartment**
```
Compartment OCID: ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq
(Using root compartment - same as tenancy)
```

### 3️⃣ **Region Selection**
**Home Region**: `eu-frankfurt-1`

**Alternative Regions to Try** (if capacity issues):
- us-ashburn-1
- us-phoenix-1
- uk-london-1
- ap-mumbai-1
- ap-tokyo-1
- ca-toronto-1

### 4️⃣ **Availability Domain**
**Format**: `<region-code>-AD-<number>`

**Examples**:
- EU Frankfurt: `ppEr:EU-FRANKFURT-1-AD-1` or `ppEr:EU-FRANKFURT-1-AD-2` or `ppEr:EU-FRANKFURT-1-AD-3`
- US Ashburn: `hUij:US-ASHBURN-AD-1`
- US Phoenix: `hUij:US-PHOENIX-AD-1`

**How to Find**: 
```powershell
$env:OCI_CLI_AUTH = "security_token"
oci iam availability-domain list --region eu-frankfurt-1
```

### 5️⃣ **Networking Requirements**

#### Option A: Use Existing VCN (RECOMMENDED)
```
VCN Name: megilance-vcn
VCN OCID: (to be retrieved)

Subnet Name: megilance-subnet
Subnet OCID: ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaas2bgihzfymimftv6cab3wnjqilje7ue7ru2piysw44qktvfgbvba
```

**Get VCN OCID**:
```powershell
$env:OCI_CLI_AUTH = "security_token"
oci network vcn list --compartment-id ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq --region eu-frankfurt-1
```

#### Option B: Create New VCN (if needed)
```
VCN CIDR: 10.0.0.0/16
Subnet CIDR: 10.0.1.0/24
Internet Gateway: Required
Route Table: Required
Security List: Required (ports 22, 80, 443, 8000)
```

### 6️⃣ **VM Configuration**

#### Display Name
```
megilance-backend-vm
```

#### Image
**Operating System**: Ubuntu 22.04 (Canonical)

**Get Latest Image OCID**:
```powershell
$env:OCI_CLI_AUTH = "security_token"
oci compute image list --compartment-id ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq --operating-system "Canonical Ubuntu" --operating-system-version "22.04" --region eu-frankfurt-1 --limit 1 --sort-by TIMECREATED --sort-order DESC
```

**Common Ubuntu 22.04 Image OCIDs** (by region):
- EU Frankfurt: `ocid1.image.oc1.eu-frankfurt-1.aaaaaaaaxvz4gcvzfxxxxx` (check for latest)
- US Ashburn: `ocid1.image.oc1.iad.aaaaaaaaxvz4gcvzfxxxxx`
- US Phoenix: `ocid1.image.oc1.phx.aaaaaaaaxvz4gcvzfxxxxx`

#### Boot Volume
```
Size: 50 GB (Always Free includes up to 200 GB total across 2 boot volumes)
Boot volume type: Paravirtualized (recommended for performance)
```

#### SSH Access
**SSH Key Path**: `~/.ssh/id_rsa.pub` (or your public key location)

**Generate if needed**:
```powershell
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N '""'
```

**Read Public Key**:
```powershell
Get-Content ~/.ssh/id_rsa.pub
```

### 7️⃣ **Security List Rules Required**

#### Ingress Rules (Incoming)
```
1. SSH Access
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Port: 22
   - Description: SSH access

2. HTTP
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Port: 80
   - Description: HTTP traffic

3. HTTPS
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Port: 443
   - Description: HTTPS traffic

4. Backend API (optional direct access)
   - Source: 0.0.0.0/0
   - Protocol: TCP
   - Port: 8000
   - Description: Backend API
```

#### Egress Rules (Outgoing)
```
1. All traffic
   - Destination: 0.0.0.0/0
   - Protocol: All
   - Description: Allow all outbound
```

---

## 🗂️ Database Connection (Already Set Up)

### Autonomous Database 23ai
```
Database Name: megilanceai
Connection Type: TLS (mTLS)
Wallet Location: ./oracle-wallet-23ai
Connection String: megilanceai_high (from tnsnames.ora in wallet)

Backend .env Configuration:
DATABASE_URL=oracle+oracledb://ADMIN:your_password@megilanceai_high
WALLET_LOCATION=/app/oracle-wallet
```

---

## 🔧 What Gets Deployed on VM

### Docker Services (using docker-compose.minimal.yml)
```yaml
Services:
  - backend: FastAPI backend (~700 MB RAM)
    - Port: 8000
    - Oracle DB connected
    - Health checks enabled
    - Auto-restart on failure
  
  - nginx: Reverse proxy (~50 MB RAM)
    - Port: 80 (HTTP) and 443 (HTTPS)
    - Proxy to backend:8000
    - Static asset serving
```

### System Requirements
```
OS: Ubuntu 22.04 LTS
Docker: Latest (installed via script)
Docker Compose: Latest (installed via script)
Git: For continuous deployment webhook
Nginx: Running in container
```

---

## 📊 Memory Allocation Plan (Total 1 GB)

```
Backend Container:   768 MB (limit)
Nginx Container:      50 MB
System/Docker:       150 MB
Buffer:               32 MB
------------------------
Total:               ~1 GB
```

---

## 🚀 VM Creation Command Template

```powershell
$env:OCI_CLI_AUTH = "security_token"

# Variables
$compartmentId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$availabilityDomain = "ppEr:EU-FRANKFURT-1-AD-1"  # REPLACE with actual AD
$subnetId = "ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaas2bgihzfymimftv6cab3wnjqilje7ue7ru2piysw44qktvfgbvba"
$imageId = "ocid1.image.oc1.eu-frankfurt-1.XXXXXX"  # REPLACE with actual image OCID
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"

# Read SSH public key
$sshKey = Get-Content $sshKeyPath -Raw

# Create VM
oci compute instance launch `
  --compartment-id $compartmentId `
  --availability-domain $availabilityDomain `
  --shape "VM.Standard.E2.1.Micro" `
  --image-id $imageId `
  --subnet-id $subnetId `
  --display-name "megilance-backend-vm" `
  --assign-public-ip true `
  --ssh-authorized-keys-file $sshKeyPath `
  --boot-volume-size-in-gbs 50 `
  --region eu-frankfurt-1
```

---

## ✅ Pre-Flight Checklist

Before creating VM, verify you have:

- [ ] Tenancy OCID
- [ ] Compartment OCID
- [ ] Region selected
- [ ] Availability Domain identified
- [ ] VCN and Subnet OCIDs
- [ ] Ubuntu 22.04 Image OCID
- [ ] SSH public key generated
- [ ] Security list rules configured
- [ ] OCI CLI configured with security_token auth
- [ ] Autonomous Database wallet downloaded (already done ✅)

---

## 🔍 How to Get Missing Values

### Get Availability Domain
```powershell
$env:OCI_CLI_AUTH = "security_token"
oci iam availability-domain list `
  --compartment-id ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq `
  --region eu-frankfurt-1
```

### Get VCN OCID
```powershell
$env:OCI_CLI_AUTH = "security_token"
oci network vcn list `
  --compartment-id ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq `
  --region eu-frankfurt-1
```

### Get Subnet OCID (if different region)
```powershell
$env:OCI_CLI_AUTH = "security_token"
oci network subnet list `
  --compartment-id ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq `
  --vcn-id <VCN_OCID> `
  --region eu-frankfurt-1
```

### Get Ubuntu 22.04 Image OCID
```powershell
$env:OCI_CLI_AUTH = "security_token"
oci compute image list `
  --compartment-id ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq `
  --operating-system "Canonical Ubuntu" `
  --operating-system-version "22.04" `
  --region eu-frankfurt-1 `
  --limit 1 `
  --sort-by TIMECREATED `
  --sort-order DESC
```

---

## 📦 Post-Creation Steps

After VM is created:

1. **Get Public IP**:
```powershell
oci compute instance list-vnics --instance-id <INSTANCE_OCID>
```

2. **SSH into VM**:
```powershell
ssh ubuntu@<PUBLIC_IP>
```

3. **Deploy Application**:
```bash
# Clone repository
git clone https://github.com/ghulam-mujtaba5/MegiLance.git
cd MegiLance

# Copy oracle wallet
# (Upload via scp from local machine)

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Deploy backend
docker-compose -f docker-compose.minimal.yml up -d

# Setup Git webhook for continuous deployment
# (Will configure after VM is running)
```

---

## 🎯 Expected Result

After successful creation:
- ✅ VM.Standard.E2.1.Micro instance running
- ✅ Public IP assigned
- ✅ SSH access working
- ✅ Backend API accessible on port 8000
- ✅ Connected to Oracle Autonomous DB 23ai
- ✅ Ready for continuous deployment setup

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Out of capacity"
**Solution**: Try different availability domain or region

### Issue 2: "Authorization failed"
**Solution**: Verify you're in home region or region where you have quota

### Issue 3: "Shape not available"
**Solution**: VM.Standard.E2.1.Micro should always be available (Always Free), check region subscription

### Issue 4: SSH connection refused
**Solution**: Check security list has port 22 open, verify public IP assignment

---

## 📞 Next Steps After Manual VM Creation

Once you create the VM manually and provide me the:
1. **Instance OCID**
2. **Public IP address**

I will configure:
- ✅ Automated deployment scripts
- ✅ Git webhook for continuous deployment
- ✅ Backend deployment with Oracle DB connection
- ✅ Health monitoring
- ✅ Auto-restart on failure
- ✅ Frontend connection to DigitalOcean

---

**This VM is perfect for your needs** - it's free, Always Free eligible, and sufficient to run your FastAPI backend with Oracle DB connection! 🚀

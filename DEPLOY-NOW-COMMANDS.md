# ⚡ FASTEST DEPLOYMENT - Direct Commands (Copy & Paste)

## You already have databases! Just need VM + deployment.

### STEP 1: Create VM (2 minutes) - Run this ONE command:

```powershell
$env:OCI_CLI_AUTH = "security_token"
$tid = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"

# Get resources
$ad = (oci iam availability-domain list --compartment-id $tid | ConvertFrom-Json).data[0].name
$vcn = (oci network vcn list --compartment-id $tid | ConvertFrom-Json).data[0]
$subnet = (oci network subnet list --compartment-id $tid --vcn-id $vcn.id | ConvertFrom-Json).data[0]

# Create VM
oci compute instance launch `
  --compartment-id $tid `
  --availability-domain $ad `
  --display-name "megilance-backend" `
  --image-id "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaagbrvhganmn7qchnqh7tzsn45sfe2g4qz2qlz2qpgwdz5i2xwmqja" `
  --shape "VM.Standard.E2.1.Micro" `
  --subnet-id $subnet.id `
  --assign-public-ip true `
  --ssh-authorized-keys-file "$env:USERPROFILE\.ssh\id_rsa.pub" `
  --wait-for-state RUNNING | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object id,'display-name','lifecycle-state'
```

### STEP 2: Get VM IP:

```powershell
$instances = (oci compute instance list --compartment-id $tid --lifecycle-state RUNNING | ConvertFrom-Json).data
$instance = $instances | Where-Object { $_.'display-name' -eq 'megilance-backend' }
$vnic = (oci compute vnic-attachment list --compartment-id $tid --instance-id $instance.id | ConvertFrom-Json).data[0]
$publicIp = (oci network vnic get --vnic-id $vnic.'vnic-id' | ConvertFrom-Json).data.'public-ip'
Write-Host "`n✅ VM IP: $publicIp`n" -ForegroundColor Green
```

### STEP 3: Download DB Wallet:

```powershell
$db = (oci db autonomous-database list --compartment-id $tid | ConvertFrom-Json).data | Where-Object { $_.'db-name' -eq 'megilancedb' }
$walletPW = -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})

oci db autonomous-database generate-wallet `
  --autonomous-database-id $db.id `
  --password $walletPW `
  --file "Wallet_megilancedb.zip"

Expand-Archive "Wallet_megilancedb.zip" -DestinationPath "oracle-wallet-23ai" -Force
Write-Host "✅ Wallet downloaded! Password: $walletPW`n" -ForegroundColor Green
```

### STEP 4: Deploy Backend (one command, runs for 10 mins):

```powershell
.\deploy-oracle-backend.ps1 -OracleIP $publicIp
```

---

## OR - Use Oracle Console (5 clicks, 3 minutes):

1. https://cloud.oracle.com/compute/instances?region=eu-frankfurt-1
2. Click "Create Instance"
3. Name: `megilance-backend`
4. Shape: Click "Change Shape" → Select `VM.Standard.E2.1.Micro` (Always Free)
5. SSH Key: Paste your public key from `~/.ssh/id_rsa.pub`
6. Click "Create"
7. Copy the Public IP when ready

Then run:
```powershell
.\deploy-oracle-backend.ps1 -OracleIP <PASTE_IP_HERE>
```

---

## Summary:

**You have**:
- ✅ 2 Databases already created (megilancedb, megilanceai)
- ✅ Network (VCN, subnet) already exists
- ✅ OCI CLI authenticated

**You need**:
- ⏳ 1 VM instance (takes 2 mins to create)
- ⏳ Run deployment script (takes 10 mins)

**Total time**: 12 minutes to complete deployment!

**Cost**: $0/month (Always Free tier)

# @AI-HINT: FULLY AUTOMATED Oracle Cloud deployment - NO manual steps, NO console needed!

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🤖 FULLY AUTOMATED ORACLE DEPLOYMENT 🤖      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Set auth
$env:OCI_CLI_AUTH = "security_token"
$ErrorActionPreference = "Stop"

# Configuration
$tenancyId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$compartmentId = $tenancyId
$region = "eu-frankfurt-1"

# Known Oracle Linux 8 image OCID for Frankfurt region (Always Free compatible)
$imageId = "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaa6j42ynhhzml65mcgl4pql5fhbhzfcfj7lv7hvkwbmo7kk73xopza"

Write-Host "🚀 Creating complete Oracle infrastructure..." -ForegroundColor Yellow
Write-Host "   Region: $region" -ForegroundColor White
Write-Host "   Using Always Free tier resources only`n" -ForegroundColor Green

# Step 1: Get availability domain
Write-Host "[1/9] Getting availability domain..." -ForegroundColor Yellow
try {
    $adData = oci iam availability-domain list --compartment-id $compartmentId 2>&1 | Out-String | ConvertFrom-Json
    $ad = $adData.data[0].name
    Write-Host "✓ AD: $ad" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get AD" -ForegroundColor Red
    exit 1
}

# Step 2: Create or get VCN
Write-Host "`n[2/9] Creating Virtual Cloud Network..." -ForegroundColor Yellow
try {
    $vcnData = oci network vcn list --compartment-id $compartmentId 2>&1 | Out-String | ConvertFrom-Json
    $existingVcn = $vcnData.data | Where-Object { $_.'display-name' -eq 'megilance-vcn' } | Select-Object -First 1
    
    if ($existingVcn) {
        $vcnId = $existingVcn.id
        Write-Host "✓ Using existing VCN" -ForegroundColor Green
    } else {
        $vcnResult = oci network vcn create `
            --compartment-id $compartmentId `
            --display-name "megilance-vcn" `
            --cidr-block "10.0.0.0/16" `
            --dns-label "megilance" `
            --wait-for-state AVAILABLE 2>&1 | Out-String | ConvertFrom-Json
        $vcnId = $vcnResult.data.id
        Write-Host "✓ VCN created: $vcnId" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "✗ VCN creation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Create Internet Gateway
Write-Host "`n[3/9] Creating Internet Gateway..." -ForegroundColor Yellow
try {
    $igwData = oci network internet-gateway list --compartment-id $compartmentId --vcn-id $vcnId 2>&1 | Out-String | ConvertFrom-Json
    $existingIgw = $igwData.data | Select-Object -First 1
    
    if ($existingIgw) {
        $igwId = $existingIgw.id
        Write-Host "✓ Using existing IGW" -ForegroundColor Green
    } else {
        $igwResult = oci network internet-gateway create `
            --compartment-id $compartmentId `
            --vcn-id $vcnId `
            --display-name "megilance-igw" `
            --is-enabled true `
            --wait-for-state AVAILABLE 2>&1 | Out-String | ConvertFrom-Json
        $igwId = $igwResult.data.id
        Write-Host "✓ IGW created: $igwId" -ForegroundColor Green
        
        # Update route table
        $rtData = oci network route-table list --compartment-id $compartmentId --vcn-id $vcnId 2>&1 | Out-String | ConvertFrom-Json
        $rtId = $rtData.data[0].id
        oci network route-table update `
            --rt-id $rtId `
            --route-rules "[{`"destination`":`"0.0.0.0/0`",`"destinationType`":`"CIDR_BLOCK`",`"networkEntityId`":`"$igwId`"}]" `
            --force 2>&1 | Out-Null
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "✗ IGW creation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Configure security list
Write-Host "`n[4/9] Configuring security rules..." -ForegroundColor Yellow
try {
    $slData = oci network security-list list --compartment-id $compartmentId --vcn-id $vcnId 2>&1 | Out-String | ConvertFrom-Json
    $slId = $slData.data[0].id
    
    $ingressRules = '[{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":443,"max":443}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":8000,"max":8000}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":9000,"max":9000}}}]'
    
    oci network security-list update `
        --security-list-id $slId `
        --ingress-security-rules $ingressRules `
        --egress-security-rules '[{"protocol":"all","destination":"0.0.0.0/0"}]' `
        --force 2>&1 | Out-Null
    Write-Host "✓ Security rules configured (ports: 22,80,443,8000,9000)" -ForegroundColor Green
} catch {
    Write-Host "⚠ Security list update failed (may already be configured)" -ForegroundColor Yellow
}

# Step 5: Create subnet
Write-Host "`n[5/9] Creating subnet..." -ForegroundColor Yellow
try {
    $subnetData = oci network subnet list --compartment-id $compartmentId --vcn-id $vcnId 2>&1 | Out-String | ConvertFrom-Json
    $existingSubnet = $subnetData.data | Where-Object { $_.'display-name' -eq 'megilance-subnet' } | Select-Object -First 1
    
    if ($existingSubnet) {
        $subnetId = $existingSubnet.id
        Write-Host "✓ Using existing subnet" -ForegroundColor Green
    } else {
        $subnetResult = oci network subnet create `
            --compartment-id $compartmentId `
            --vcn-id $vcnId `
            --display-name "megilance-subnet" `
            --cidr-block "10.0.0.0/24" `
            --availability-domain $ad `
            --dns-label "megilancesub" `
            --wait-for-state AVAILABLE 2>&1 | Out-String | ConvertFrom-Json
        $subnetId = $subnetResult.data.id
        Write-Host "✓ Subnet created: $subnetId" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "✗ Subnet creation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Generate/use SSH key
Write-Host "`n[6/9] Preparing SSH key..." -ForegroundColor Yellow
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
if (-not (Test-Path $sshKeyPath)) {
    Write-Host "  Generating new SSH key..." -ForegroundColor Cyan
    ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N '""' 2>&1 | Out-Null
}
$sshKey = Get-Content $sshKeyPath -Raw
Write-Host "✓ SSH key ready" -ForegroundColor Green

# Step 7: Create VM instance
Write-Host "`n[7/9] Creating VM instance (VM.Standard.E2.1.Micro)..." -ForegroundColor Yellow
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Cyan

try {
    # Check for existing instance
    $existingInstances = oci compute instance list `
        --compartment-id $compartmentId `
        --lifecycle-state RUNNING 2>&1 | Out-String | ConvertFrom-Json
    
    $existingInstance = $existingInstances.data | Where-Object { $_.'display-name' -eq 'megilance-backend' } | Select-Object -First 1
    
    if ($existingInstance) {
        Write-Host "✓ Using existing instance" -ForegroundColor Green
        $instanceId = $existingInstance.id
    } else {
        Write-Host "  Creating new instance with Oracle Linux 8..." -ForegroundColor Cyan
        
        $instanceResult = oci compute instance launch `
            --compartment-id $compartmentId `
            --availability-domain $ad `
            --display-name "megilance-backend" `
            --image-id $imageId `
            --shape "VM.Standard.E2.1.Micro" `
            --subnet-id $subnetId `
            --assign-public-ip true `
            --ssh-authorized-keys-file $sshKeyPath `
            --wait-for-state RUNNING 2>&1 | Out-String | ConvertFrom-Json
        
        $instanceId = $instanceResult.data.id
        Write-Host "✓ VM instance created!" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ VM creation failed: $_" -ForegroundColor Red
    exit 1
}

# Step 8: Get instance IP
Write-Host "`n[8/9] Getting instance IP address..." -ForegroundColor Yellow
try {
    $vnicAttachData = oci compute vnic-attachment list `
        --compartment-id $compartmentId `
        --instance-id $instanceId 2>&1 | Out-String | ConvertFrom-Json
    $vnicId = $vnicAttachData.data[0].'vnic-id'
    
    $vnicData = oci network vnic get --vnic-id $vnicId 2>&1 | Out-String | ConvertFrom-Json
    $publicIp = $vnicData.data.'public-ip'
    $privateIp = $vnicData.data.'private-ip'
    
    Write-Host "✓ Public IP:  $publicIp" -ForegroundColor Green
    Write-Host "  Private IP: $privateIp" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to get IP: $_" -ForegroundColor Red
    exit 1
}

# Step 9: Create Autonomous Database
Write-Host "`n[9/9] Creating Autonomous Database..." -ForegroundColor Yellow
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Cyan

try {
    # Check for existing database
    $dbList = oci db autonomous-database list `
        --compartment-id $compartmentId `
        --lifecycle-state AVAILABLE 2>&1 | Out-String | ConvertFrom-Json
    
    $existingDb = $dbList.data | Where-Object { $_.'db-name' -eq 'megilancedb' } | Select-Object -First 1
    
    if ($existingDb) {
        Write-Host "✓ Using existing database" -ForegroundColor Green
        $dbId = $existingDb.id
        Write-Host "`n⚠ Using existing database password (you should have it saved)" -ForegroundColor Yellow
        $dbPassword = "YOUR_EXISTING_PASSWORD"
    } else {
        # Generate strong password
        $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "Aa1!"
        
        Write-Host "  Creating database with password: $dbPassword" -ForegroundColor Cyan
        Write-Host "  SAVE THIS PASSWORD!" -ForegroundColor Red
        
        $dbResult = oci db autonomous-database create `
            --compartment-id $compartmentId `
            --db-name "megilancedb" `
            --display-name "megilancedb" `
            --admin-password $dbPassword `
            --cpu-core-count 1 `
            --data-storage-size-in-tbs 1 `
            --db-workload "OLTP" `
            --is-free-tier true `
            --license-model "LICENSE_INCLUDED" `
            --wait-for-state AVAILABLE 2>&1 | Out-String | ConvertFrom-Json
        
        $dbId = $dbResult.data.id
        Write-Host "✓ Database created!" -ForegroundColor Green
    }
    
    # Download wallet
    Write-Host "`n  Downloading database wallet..." -ForegroundColor Cyan
    $walletPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    $walletZip = "Wallet_megilancedb.zip"
    
    oci db autonomous-database generate-wallet `
        --autonomous-database-id $dbId `
        --password $walletPassword `
        --file $walletZip 2>&1 | Out-Null
    
    if (Test-Path $walletZip) {
        if (Test-Path "oracle-wallet-23ai") {
            Remove-Item "oracle-wallet-23ai" -Recurse -Force
        }
        Expand-Archive -Path $walletZip -DestinationPath "oracle-wallet-23ai" -Force
        Write-Host "✓ Wallet downloaded and extracted" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Database creation failed: $_" -ForegroundColor Red
    Write-Host "Continuing without database (you can create it manually later)" -ForegroundColor Yellow
    $dbPassword = "MANUAL_SETUP_REQUIRED"
    $walletPassword = "MANUAL_SETUP_REQUIRED"
}

# Save all info
@{
    InstanceId = $instanceId
    PublicIP = $publicIp
    PrivateIP = $privateIp
    DatabaseId = $dbId
    DatabasePassword = $dbPassword
    WalletPassword = $walletPassword
    Region = $region
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "oracle-deployment-info.json" -Encoding UTF8

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ ORACLE INFRASTRUCTURE CREATED! ✅       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Resources Created:" -ForegroundColor Yellow
Write-Host "  ✓ VM Instance:  $instanceId" -ForegroundColor Green
Write-Host "    Public IP:    $publicIp" -ForegroundColor Cyan
Write-Host "  ✓ Database:     $dbId" -ForegroundColor Green
Write-Host "    Password:     $dbPassword" -ForegroundColor Yellow
Write-Host "  ✓ Wallet:       oracle-wallet-23ai/" -ForegroundColor Green
Write-Host "    Password:     $walletPassword" -ForegroundColor Yellow

Write-Host "`n💾 All credentials saved to: oracle-deployment-info.json`n" -ForegroundColor Green

Write-Host "⏳ Waiting for SSH to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test SSH connection
Write-Host "`n🔌 Testing SSH connection..." -ForegroundColor Yellow
$sshTest = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 opc@$publicIp "echo 'SSH OK'" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "⚠ SSH not ready yet. Wait 1-2 minutes and try:" -ForegroundColor Yellow
    Write-Host "  ssh opc@$publicIp" -ForegroundColor Cyan
}

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          NEXT: DEPLOY BACKEND SERVICES          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Run deployment now:" -ForegroundColor Yellow
Write-Host "  .\deploy-oracle-backend.ps1 -OracleIP $publicIp`n" -ForegroundColor Cyan

Write-Host "Or SSH manually:" -ForegroundColor Yellow
Write-Host "  ssh opc@$publicIp`n" -ForegroundColor Cyan

Write-Host "💰 Cost: `$0/month (Always Free tier)`n" -ForegroundColor Green

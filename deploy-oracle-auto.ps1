# @AI-HINT: Complete automated Oracle Cloud deployment using OCI CLI (Always Free tier only)
# Deploys: VM.Standard.E2.1.Micro + Autonomous Database Free + Backend services

param(
    [string]$SSHPublicKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
)

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 ORACLE CLOUD AUTO-DEPLOYMENT (FREE TIER)  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Set auth method to security_token
$env:OCI_CLI_AUTH = "security_token"

# Function to run OCI commands with error handling
function Invoke-OCI {
    param([string]$Command)
    Write-Host "→ $Command" -ForegroundColor DarkGray
    $result = Invoke-Expression $Command 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed: $result" -ForegroundColor Red
        return $null
    }
    return $result
}

# Step 1: Validate OCI CLI authentication
Write-Host "`n[1/10] Validating OCI CLI authentication..." -ForegroundColor Yellow
$validation = oci session validate 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ OCI CLI not authenticated properly" -ForegroundColor Red
    Write-Host "`nPlease run: oci session authenticate" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ OCI CLI authenticated" -ForegroundColor Green

# Step 2: Get tenancy and compartment info
Write-Host "`n[2/10] Getting tenancy information..." -ForegroundColor Yellow
# Use tenancy OCID from config
$tenancyId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$compartmentId = $tenancyId
$tenancyInfo = oci iam tenancy get --tenancy-id $tenancyId 2>&1 | Out-String | ConvertFrom-Json
if ($tenancyInfo.data) {
    Write-Host "✓ Using tenancy: $($tenancyInfo.data.name)" -ForegroundColor Green
    Write-Host "  Compartment ID: $compartmentId" -ForegroundColor DarkGray
} else {
    Write-Host "✗ Could not get tenancy info" -ForegroundColor Red
    exit 1
}

# Step 3: Get availability domain
Write-Host "`n[3/10] Getting availability domain..." -ForegroundColor Yellow
$ad = oci iam availability-domain list --compartment-id $compartmentId --query "data[0].name" --raw-output
Write-Host "✓ Availability Domain: $ad" -ForegroundColor Green

# Step 4: Create or get VCN (Virtual Cloud Network)
Write-Host "`n[4/10] Setting up Virtual Cloud Network..." -ForegroundColor Yellow
$existingVcn = oci network vcn list --compartment-id $compartmentId --query "data[?\"display-name\"=='megilance-vcn'] | [0]" | ConvertFrom-Json
if ($existingVcn) {
    $vcnId = $existingVcn.id
    Write-Host "✓ Using existing VCN: $vcnId" -ForegroundColor Green
} else {
    Write-Host "Creating new VCN..." -ForegroundColor Cyan
    $vcnResult = oci network vcn create `
        --compartment-id $compartmentId `
        --display-name "megilance-vcn" `
        --cidr-block "10.0.0.0/16" `
        --dns-label "megilance" `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    $vcnId = $vcnResult.data.id
    Write-Host "✓ Created VCN: $vcnId" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Step 5: Create or get Internet Gateway
Write-Host "`n[5/10] Setting up Internet Gateway..." -ForegroundColor Yellow
$existingIgw = oci network internet-gateway list --compartment-id $compartmentId --vcn-id $vcnId --query "data[0]" | ConvertFrom-Json
if ($existingIgw) {
    $igwId = $existingIgw.id
    Write-Host "✓ Using existing Internet Gateway: $igwId" -ForegroundColor Green
} else {
    Write-Host "Creating Internet Gateway..." -ForegroundColor Cyan
    $igwResult = oci network internet-gateway create `
        --compartment-id $compartmentId `
        --vcn-id $vcnId `
        --display-name "megilance-igw" `
        --is-enabled true `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    $igwId = $igwResult.data.id
    Write-Host "✓ Created Internet Gateway: $igwId" -ForegroundColor Green
    
    # Add route to route table
    $routeTable = oci network route-table list --compartment-id $compartmentId --vcn-id $vcnId --query "data[0]" | ConvertFrom-Json
    oci network route-table update `
        --rt-id $routeTable.id `
        --route-rules "[{\"destination\":\"0.0.0.0/0\",\"destinationType\":\"CIDR_BLOCK\",\"networkEntityId\":\"$igwId\"}]" `
        --force | Out-Null
    Start-Sleep -Seconds 5
}

# Step 6: Create or get Security List with required ports
Write-Host "`n[6/10] Configuring Security Rules..." -ForegroundColor Yellow
$securityList = oci network security-list list --compartment-id $compartmentId --vcn-id $vcnId --query "data[0]" | ConvertFrom-Json

$ingressRules = @"
[
  {
    "protocol": "6",
    "source": "0.0.0.0/0",
    "tcpOptions": {
      "destinationPortRange": {
        "min": 22,
        "max": 22
      }
    }
  },
  {
    "protocol": "6",
    "source": "0.0.0.0/0",
    "tcpOptions": {
      "destinationPortRange": {
        "min": 80,
        "max": 80
      }
    }
  },
  {
    "protocol": "6",
    "source": "0.0.0.0/0",
    "tcpOptions": {
      "destinationPortRange": {
        "min": 443,
        "max": 443
      }
    }
  },
  {
    "protocol": "6",
    "source": "0.0.0.0/0",
    "tcpOptions": {
      "destinationPortRange": {
        "min": 8000,
        "max": 8000
      }
    }
  },
  {
    "protocol": "6",
    "source": "0.0.0.0/0",
    "tcpOptions": {
      "destinationPortRange": {
        "min": 9000,
        "max": 9000
      }
    }
  }
]
"@

$egressRules = '[{"protocol":"all","destination":"0.0.0.0/0"}]'

oci network security-list update `
    --security-list-id $securityList.id `
    --ingress-security-rules $ingressRules `
    --egress-security-rules $egressRules `
    --force | Out-Null
Write-Host "✓ Security rules configured (ports: 22, 80, 443, 8000, 9000)" -ForegroundColor Green

# Step 7: Create or get Subnet
Write-Host "`n[7/10] Setting up Subnet..." -ForegroundColor Yellow
$existingSubnet = oci network subnet list --compartment-id $compartmentId --vcn-id $vcnId --query "data[?\"display-name\"=='megilance-subnet'] | [0]" | ConvertFrom-Json
if ($existingSubnet) {
    $subnetId = $existingSubnet.id
    Write-Host "✓ Using existing Subnet: $subnetId" -ForegroundColor Green
} else {
    Write-Host "Creating Subnet..." -ForegroundColor Cyan
    $subnetResult = oci network subnet create `
        --compartment-id $compartmentId `
        --vcn-id $vcnId `
        --display-name "megilance-subnet" `
        --cidr-block "10.0.0.0/24" `
        --availability-domain $ad `
        --dns-label "megilancesub" `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    $subnetId = $subnetResult.data.id
    Write-Host "✓ Created Subnet: $subnetId" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

# Step 8: Get Oracle Linux 8 image
Write-Host "`n[8/10] Finding Oracle Linux 8 image..." -ForegroundColor Yellow
$image = oci compute image list `
    --compartment-id $compartmentId `
    --operating-system "Oracle Linux" `
    --operating-system-version "8" `
    --shape "VM.Standard.E2.1.Micro" `
    --sort-by TIMECREATED `
    --sort-order DESC `
    --query "data[0]" | ConvertFrom-Json
$imageId = $image.id
Write-Host "✓ Image: $($image.'display-name')" -ForegroundColor Green
Write-Host "  Image ID: $imageId" -ForegroundColor DarkGray

# Step 9: Read SSH public key
Write-Host "`n[9/10] Reading SSH public key..." -ForegroundColor Yellow
if (-not (Test-Path $SSHPublicKeyPath)) {
    Write-Host "✗ SSH public key not found: $SSHPublicKeyPath" -ForegroundColor Red
    Write-Host "`nGenerating new SSH key..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N '""'
}
$sshPublicKey = Get-Content $SSHPublicKeyPath -Raw
Write-Host "✓ SSH key loaded" -ForegroundColor Green

# Step 10: Create VM instance (Always Free tier)
Write-Host "`n[10/10] Creating VM instance (Always Free tier)..." -ForegroundColor Yellow
Write-Host "  Shape: VM.Standard.E2.1.Micro (1/8 OCPU, 1GB RAM)" -ForegroundColor Cyan
Write-Host "  OS: Oracle Linux 8" -ForegroundColor Cyan
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Cyan

$existingInstance = oci compute instance list `
    --compartment-id $compartmentId `
    --display-name "megilance-backend" `
    --query "data[?\"lifecycle-state\"!='TERMINATED'] | [0]" | ConvertFrom-Json

if ($existingInstance) {
    Write-Host "✓ Using existing instance: $($existingInstance.id)" -ForegroundColor Green
    $instanceId = $existingInstance.id
} else {
    $metadata = @{
        "ssh_authorized_keys" = $sshPublicKey
    } | ConvertTo-Json -Compress

    $instanceResult = oci compute instance launch `
        --compartment-id $compartmentId `
        --availability-domain $ad `
        --display-name "megilance-backend" `
        --image-id $imageId `
        --shape "VM.Standard.E2.1.Micro" `
        --subnet-id $subnetId `
        --assign-public-ip true `
        --metadata $metadata `
        --wait-for-state RUNNING | ConvertFrom-Json
    
    $instanceId = $instanceResult.data.id
    Write-Host "✓ VM instance created: $instanceId" -ForegroundColor Green
}

# Get instance details
Write-Host "`n📡 Getting instance details..." -ForegroundColor Yellow
$instance = oci compute instance get --instance-id $instanceId | ConvertFrom-Json

# Get VNIC attachment
$vnicAttachment = oci compute vnic-attachment list `
    --compartment-id $compartmentId `
    --instance-id $instanceId `
    --query "data[0]" | ConvertFrom-Json

# Get VNIC details
$vnic = oci network vnic get --vnic-id $vnicAttachment.'vnic-id' | ConvertFrom-Json
$publicIp = $vnic.data.'public-ip'
$privateIp = $vnic.data.'private-ip'

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✅ VM CREATED SUCCESSFULLY ✅          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 VM Details:" -ForegroundColor Yellow
Write-Host "  Instance ID: $instanceId" -ForegroundColor White
Write-Host "  Public IP:   $publicIp" -ForegroundColor Cyan
Write-Host "  Private IP:  $privateIp" -ForegroundColor White
Write-Host "  Shape:       VM.Standard.E2.1.Micro (Always Free)" -ForegroundColor White
Write-Host "  OS:          Oracle Linux 8" -ForegroundColor White

# Save instance info
@{
    InstanceId = $instanceId
    PublicIP = $publicIp
    PrivateIP = $privateIp
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "oracle-instance-info.json" -Encoding UTF8

Write-Host "`n💾 Instance info saved to: oracle-instance-info.json" -ForegroundColor Green

# Wait for SSH to be ready
Write-Host "`n⏳ Waiting for SSH to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test SSH connection
Write-Host "`n🔌 Testing SSH connection..." -ForegroundColor Yellow
$sshTest = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 opc@$publicIp "echo 'SSH OK'" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "⚠ SSH not ready yet. Try manually in 1-2 minutes:" -ForegroundColor Yellow
    Write-Host "  ssh opc@$publicIp" -ForegroundColor Cyan
}

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          NEXT: DEPLOY BACKEND SERVICES          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Run the deployment script:" -ForegroundColor Yellow
Write-Host "  .\deploy-oracle-backend.ps1 -OracleIP $publicIp`n" -ForegroundColor Cyan

Write-Host "Or SSH manually:" -ForegroundColor Yellow
Write-Host "  ssh opc@$publicIp`n" -ForegroundColor Cyan

Write-Host "💰 Cost: FREE (Always Free tier)`n" -ForegroundColor Green

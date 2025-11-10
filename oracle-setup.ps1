# ===================================
# MegiLance Oracle Cloud Setup Script
# ===================================
# This script automates the setup of Oracle Cloud Infrastructure for MegiLance
# including Autonomous Database, Object Storage, and Compute VMs

param(
    [string]$CompartmentId = "",
    [string]$Region = "us-ashburn-1",
    [string]$DbPassword = "",
    [string]$Profile = "DEFAULT"
)

Write-Host "🚀 MegiLance Oracle Cloud Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if OCI CLI is installed
try {
    $ociVersion = oci --version
    Write-Host "✓ OCI CLI installed: $ociVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ OCI CLI not found. Installing..." -ForegroundColor Red
    winget install Oracle.OCI-CLI
    Write-Host "✓ OCI CLI installed successfully" -ForegroundColor Green
}

# Set profile
$env:OCI_CLI_PROFILE = $Profile
Write-Host "✓ Using OCI profile: $Profile" -ForegroundColor Green

# Remove old ghulammujtaba profile if exists
Write-Host ""
Write-Host "🗑️  Removing old account configuration..." -ForegroundColor Yellow
$ociConfigPath = "$env:USERPROFILE\.oci\config"
if (Test-Path $ociConfigPath) {
    $config = Get-Content $ociConfigPath -Raw
    if ($config -match "ghulammujtaba") {
        Write-Host "   Found old 'ghulammujtaba' profile, removing..." -ForegroundColor Yellow
        # Backup old config
        Copy-Item $ociConfigPath "$ociConfigPath.backup" -Force
        # Remove old profile section
        $newConfig = $config -replace '\[ghulammujtaba\][\s\S]*?(?=\[|$)', ''
        Set-Content $ociConfigPath $newConfig
        Write-Host "✓ Old profile removed and config backed up" -ForegroundColor Green
    }
}

# Authenticate with new account (muhammad salman)
Write-Host ""
Write-Host "🔐 Authenticating with Oracle Cloud..." -ForegroundColor Cyan
Write-Host "   Please login with muhammad salman account in the browser" -ForegroundColor Yellow
try {
    oci session authenticate --profile $Profile --region $Region
    Write-Host "✓ Authentication successful!" -ForegroundColor Green
} catch {
    Write-Host "✗ Authentication failed. Please try again." -ForegroundColor Red
    exit 1
}

# Get Compartment ID if not provided
if ([string]::IsNullOrEmpty($CompartmentId)) {
    Write-Host ""
    Write-Host "📂 Available Compartments:" -ForegroundColor Cyan
    $compartments = oci iam compartment list --all --output json | ConvertFrom-Json
    $i = 1
    foreach ($comp in $compartments.data) {
        Write-Host "   $i. $($comp.name) - $($comp.id)" -ForegroundColor White
        $i++
    }
    Write-Host ""
    $selection = Read-Host "Select compartment number (or press Enter to use root compartment)"
    if (![string]::IsNullOrEmpty($selection)) {
        $CompartmentId = $compartments.data[$selection - 1].id
    } else {
        # Get root compartment (tenancy)
        $tenancy = oci iam availability-domain list --output json | ConvertFrom-Json
        $CompartmentId = $tenancy.data[0].'compartment-id'
    }
}

Write-Host "✓ Using Compartment: $CompartmentId" -ForegroundColor Green

# Get DB Password if not provided
if ([string]::IsNullOrEmpty($DbPassword)) {
    Write-Host ""
    $securePassword = Read-Host "Enter password for Autonomous Database (min 12 chars, must include uppercase, lowercase, and number)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Create Autonomous Database (Always Free)
Write-Host ""
Write-Host "💾 Creating Oracle Autonomous Database (Always Free)..." -ForegroundColor Cyan
try {
    $adbResult = oci db autonomous-database create `
        --compartment-id $CompartmentId `
        --db-name megilancedb `
        --display-name "MegiLance Production DB" `
        --admin-password $DbPassword `
        --cpu-core-count 1 `
        --data-storage-size-in-tbs 1 `
        --db-workload OLTP `
        --is-free-tier true `
        --license-model LICENSE_INCLUDED `
        --wait-for-state AVAILABLE `
        --output json | ConvertFrom-Json
    
    $adbId = $adbResult.data.id
    Write-Host "✓ Autonomous Database created!" -ForegroundColor Green
    Write-Host "   DB Name: megilancedb" -ForegroundColor White
    Write-Host "   OCID: $adbId" -ForegroundColor White
    
    # Download wallet
    Write-Host ""
    Write-Host "📥 Downloading database wallet..." -ForegroundColor Cyan
    $walletPassword = $DbPassword
    oci db autonomous-database generate-wallet `
        --autonomous-database-id $adbId `
        --file "oracle-wallet.zip" `
        --password $walletPassword `
        --wait-for-state SUCCEEDED
    
    # Extract wallet
    if (Test-Path "oracle-wallet") {
        Remove-Item -Recurse -Force "oracle-wallet"
    }
    Expand-Archive -Path "oracle-wallet.zip" -DestinationPath "oracle-wallet" -Force
    Write-Host "✓ Wallet downloaded and extracted to ./oracle-wallet" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️  Database creation failed or already exists" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Create Object Storage Buckets (Always Free - 10GB)
Write-Host ""
Write-Host "🗄️  Creating Object Storage Buckets..." -ForegroundColor Cyan

$buckets = @("megilance-uploads", "megilance-assets", "megilance-logs")
foreach ($bucket in $buckets) {
    try {
        $publicAccess = if ($bucket -eq "megilance-assets") { "ObjectRead" } else { "NoPublicAccess" }
        oci os bucket create `
            --compartment-id $CompartmentId `
            --name $bucket `
            --public-access-type $publicAccess `
            --output json | Out-Null
        Write-Host "✓ Created bucket: $bucket" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Bucket '$bucket' already exists or creation failed" -ForegroundColor Yellow
    }
}

# Get namespace
$namespace = (oci os ns get --output json | ConvertFrom-Json).data
Write-Host "✓ Object Storage Namespace: $namespace" -ForegroundColor Green

# List Availability Domains
Write-Host ""
Write-Host "📍 Available Availability Domains:" -ForegroundColor Cyan
$ads = oci iam availability-domain list --compartment-id $CompartmentId --output json | ConvertFrom-Json
$i = 1
foreach ($ad in $ads.data) {
    Write-Host "   $i. $($ad.name)" -ForegroundColor White
    $i++
}

# Create VCN if not exists
Write-Host ""
Write-Host "🌐 Checking for Virtual Cloud Network (VCN)..." -ForegroundColor Cyan
$vcns = oci network vcn list --compartment-id $CompartmentId --output json | ConvertFrom-Json
$megilanceVcn = $vcns.data | Where-Object { $_.displayName -eq "MegiLance-VCN" } | Select-Object -First 1

if ($null -eq $megilanceVcn) {
    Write-Host "   Creating VCN..." -ForegroundColor Yellow
    $vcnResult = oci network vcn create `
        --compartment-id $CompartmentId `
        --display-name "MegiLance-VCN" `
        --cidr-block "10.0.0.0/16" `
        --wait-for-state AVAILABLE `
        --output json | ConvertFrom-Json
    $vcnId = $vcnResult.data.id
    Write-Host "✓ VCN created: $vcnId" -ForegroundColor Green
    
    # Create Internet Gateway
    $igwResult = oci network internet-gateway create `
        --compartment-id $CompartmentId `
        --vcn-id $vcnId `
        --is-enabled true `
        --display-name "MegiLance-IGW" `
        --wait-for-state AVAILABLE `
        --output json | ConvertFrom-Json
    Write-Host "✓ Internet Gateway created" -ForegroundColor Green
    
    # Create subnet
    $subnetResult = oci network subnet create `
        --compartment-id $CompartmentId `
        --vcn-id $vcnId `
        --cidr-block "10.0.1.0/24" `
        --display-name "MegiLance-Subnet" `
        --wait-for-state AVAILABLE `
        --output json | ConvertFrom-Json
    $subnetId = $subnetResult.data.id
    Write-Host "✓ Subnet created: $subnetId" -ForegroundColor Green
} else {
    $vcnId = $megilanceVcn.id
    Write-Host "✓ Using existing VCN: $vcnId" -ForegroundColor Green
    
    # Get subnet
    $subnets = oci network subnet list --compartment-id $CompartmentId --vcn-id $vcnId --output json | ConvertFrom-Json
    $subnetId = $subnets.data[0].id
    Write-Host "✓ Using existing subnet: $subnetId" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Oracle Cloud Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "   Region: $Region" -ForegroundColor White
Write-Host "   Compartment: $CompartmentId" -ForegroundColor White
Write-Host "   Database: megilancedb" -ForegroundColor White
Write-Host "   Wallet: ./oracle-wallet/" -ForegroundColor White
Write-Host "   Buckets: megilance-uploads, megilance-assets, megilance-logs" -ForegroundColor White
Write-Host "   Namespace: $namespace" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update backend/.env with OCI configuration" -ForegroundColor White
Write-Host "   2. Copy oracle-wallet/ to backend/ directory" -ForegroundColor White
Write-Host "   3. Run: pip install -r backend/requirements.txt" -ForegroundColor White
Write-Host "   4. Deploy backend: .\deploy-to-oracle.ps1 backend" -ForegroundColor White
Write-Host "   5. Deploy AI service: .\deploy-to-oracle.ps1 ai" -ForegroundColor White
Write-Host "   6. Deploy frontend: doctl apps create --spec .digitalocean\app.yaml" -ForegroundColor White
Write-Host ""

# Save configuration to file
$config = @{
    region = $Region
    compartment_id = $CompartmentId
    database_name = "megilancedb"
    namespace = $namespace
    buckets = @{
        uploads = "megilance-uploads"
        assets = "megilance-assets"
        logs = "megilance-logs"
    }
    vcn_id = $vcnId
    subnet_id = $subnetId
}

$config | ConvertTo-Json | Set-Content "oracle-config.json"
Write-Host "✓ Configuration saved to oracle-config.json" -ForegroundColor Green
Write-Host ""

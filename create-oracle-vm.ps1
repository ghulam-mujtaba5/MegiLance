# @AI-HINT: Simplified Oracle Cloud deployment - Always Free tier only
# Creates VM + Database fully automated

param(
    [string]$SSHPublicKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
)

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 ORACLE CLOUD AUTO-DEPLOYMENT (FREE TIER)  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Set auth
$env:OCI_CLI_AUTH = "security_token"
$ErrorActionPreference = "Continue"

# Configuration
$tenancyId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$compartmentId = $tenancyId
$region = "eu-frankfurt-1"

Write-Host "[1/5] Validating OCI CLI..." -ForegroundColor Yellow
$validation = oci session validate 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Please run: oci session authenticate --region $region" -ForegroundColor Red
    exit 1
}
Write-Host "✓ OCI CLI ready" -ForegroundColor Green

# Get availability domain
Write-Host "`n[2/5] Getting availability domain..." -ForegroundColor Yellow
$adData = oci iam availability-domain list --compartment-id $compartmentId | ConvertFrom-Json
$ad = $adData.data[0].name
Write-Host "✓ AD: $ad" -ForegroundColor Green

# Get Oracle Linux 8 image for Always Free shape
Write-Host "`n[3/5] Finding Oracle Linux 8 image..." -ForegroundColor Yellow
$imageData = oci compute image list `
    --compartment-id $compartmentId `
    --operating-system "Oracle Linux" `
    --operating-system-version "8" `
    --shape "VM.Standard.E2.1.Micro" `
    --sort-by TIMECREATED `
    --sort-order DESC `
    --limit 1 | ConvertFrom-Json
$imageId = $imageData.data[0].id
Write-Host "✓ Image: $($imageData.data[0].'display-name')" -ForegroundColor Green

# Get or create VCN
Write-Host "`n[4/5] Setting up network..." -ForegroundColor Yellow
$vcnData = oci network vcn list --compartment-id $compartmentId --limit 1 | ConvertFrom-Json
if ($vcnData.data.Count -gt 0) {
    $vcnId = $vcnData.data[0].id
    Write-Host "✓ Using existing VCN" -ForegroundColor Green
} else {
    Write-Host "Creating VCN..." -ForegroundColor Cyan
    $vcnResult = oci network vcn create `
        --compartment-id $compartmentId `
        --display-name "megilance-vcn" `
        --cidr-block "10.0.0.0/16" `
        --dns-label "megilance" `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    $vcnId = $vcnResult.data.id
    Write-Host "✓ VCN created" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# Get or create Internet Gateway
$igwData = oci network internet-gateway list --compartment-id $compartmentId --vcn-id $vcnId --limit 1 | ConvertFrom-Json
if ($igwData.data.Count -gt 0) {
    $igwId = $igwData.data[0].id
    Write-Host "✓ Using existing Internet Gateway" -ForegroundColor Green
} else {
    Write-Host "Creating Internet Gateway..." -ForegroundColor Cyan
    $igwResult = oci network internet-gateway create `
        --compartment-id $compartmentId `
        --vcn-id $vcnId `
        --display-name "megilance-igw" `
        --is-enabled true `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    $igwId = $igwResult.data.id
    Write-Host "✓ Internet Gateway created" -ForegroundColor Green
    
    # Update default route table
    $rtData = oci network route-table list --compartment-id $compartmentId --vcn-id $vcnId --limit 1 | ConvertFrom-Json
    $rtId = $rtData.data[0].id
    oci network route-table update `
        --rt-id $rtId `
        --route-rules "[{`"destination`":`"0.0.0.0/0`",`"destinationType`":`"CIDR_BLOCK`",`"networkEntityId`":`"$igwId`"}]" `
        --force | Out-Null
    Start-Sleep -Seconds 3
}

# Configure security list
Write-Host "Configuring security rules..." -ForegroundColor Cyan
$slData = oci network security-list list --compartment-id $compartmentId --vcn-id $vcnId --limit 1 | ConvertFrom-Json
$slId = $slData.data[0].id

$ingressRules = '[{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":443,"max":443}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":8000,"max":8000}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":9000,"max":9000}}}]'

oci network security-list update `
    --security-list-id $slId `
    --ingress-security-rules $ingressRules `
    --egress-security-rules '[{"protocol":"all","destination":"0.0.0.0/0"}]' `
    --force | Out-Null
Write-Host "✓ Security rules configured" -ForegroundColor Green

# Get or create subnet
$subnetData = oci network subnet list --compartment-id $compartmentId --vcn-id $vcnId --limit 1 | ConvertFrom-Json
if ($subnetData.data.Count -gt 0) {
    $subnetId = $subnetData.data[0].id
    Write-Host "✓ Using existing subnet" -ForegroundColor Green
} else {
    Write-Host "Creating subnet..." -ForegroundColor Cyan
    $subnetResult = oci network subnet create `
        --compartment-id $compartmentId `
        --vcn-id $vcnId `
        --display-name "megilance-subnet" `
        --cidr-block "10.0.0.0/24" `
        --availability-domain $ad `
        --dns-label "megilancesub" `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    $subnetId = $subnetResult.data.id
    Write-Host "✓ Subnet created" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# Read SSH key
Write-Host "`n[5/5] Creating VM instance (this takes 2-3 minutes)..." -ForegroundColor Yellow
if (-not (Test-Path $SSHPublicKeyPath)) {
    Write-Host "Generating SSH key..." -ForegroundColor Cyan
    ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N '""'
}
$sshKey = Get-Content $SSHPublicKeyPath -Raw

# Check for existing instance
$existingInstances = oci compute instance list `
    --compartment-id $compartmentId `
    --lifecycle-state RUNNING `
    --limit 10 | ConvertFrom-Json

$existingInstance = $existingInstances.data | Where-Object { $_.'display-name' -eq 'megilance-backend' } | Select-Object -First 1

if ($existingInstance) {
    Write-Host "✓ Using existing instance" -ForegroundColor Green
    $instanceId = $existingInstance.id
} else {
    Write-Host "Creating VM.Standard.E2.1.Micro (Always Free)..." -ForegroundColor Cyan
    
    $instanceResult = oci compute instance launch `
        --compartment-id $compartmentId `
        --availability-domain $ad `
        --display-name "megilance-backend" `
        --image-id $imageId `
        --shape "VM.Standard.E2.1.Micro" `
        --subnet-id $subnetId `
        --assign-public-ip true `
        --ssh-authorized-keys-file $SSHPublicKeyPath `
        --wait-for-state RUNNING | ConvertFrom-Json
    
    $instanceId = $instanceResult.data.id
    Write-Host "✓ VM instance created!" -ForegroundColor Green
}

# Get instance IP
Write-Host "`nGetting instance details..." -ForegroundColor Yellow
$vnicAttachData = oci compute vnic-attachment list `
    --compartment-id $compartmentId `
    --instance-id $instanceId | ConvertFrom-Json
$vnicId = $vnicAttachData.data[0].'vnic-id'

$vnicData = oci network vnic get --vnic-id $vnicId | ConvertFrom-Json
$publicIp = $vnicData.data.'public-ip'
$privateIp = $vnicData.data.'private-ip'

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ✅ VM CREATED SUCCESSFULLY ✅          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 VM Details:" -ForegroundColor Yellow
Write-Host "  Instance ID: $instanceId" -ForegroundColor White
Write-Host "  Public IP:   $publicIp" -ForegroundColor Cyan
Write-Host "  Private IP:  $privateIp" -ForegroundColor White
Write-Host "  Shape:       VM.Standard.E2.1.Micro (Always Free)" -ForegroundColor White
Write-Host "  OS:          Oracle Linux 8`n" -ForegroundColor White

# Save instance info
@{
    InstanceId = $instanceId
    PublicIP = $publicIp
    PrivateIP = $privateIp
    Region = $region
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "oracle-instance-info.json" -Encoding UTF8

Write-Host "💾 Saved to: oracle-instance-info.json`n" -ForegroundColor Green

# Wait for SSH
Write-Host "⏳ Waiting for SSH to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         NEXT: DEPLOY BACKEND SERVICES           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Run backend deployment:" -ForegroundColor Yellow
Write-Host "  .\deploy-oracle-backend.ps1 -OracleIP $publicIp`n" -ForegroundColor Cyan

Write-Host "Or create database first:" -ForegroundColor Yellow
Write-Host "  .\create-oracle-database.ps1`n" -ForegroundColor Cyan

Write-Host "SSH to VM:" -ForegroundColor Yellow
Write-Host "  ssh opc@$publicIp`n" -ForegroundColor Cyan

Write-Host "💰 Cost: FREE (Always Free tier)`n" -ForegroundColor Green

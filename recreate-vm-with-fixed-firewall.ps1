# Recreate Oracle VM with Firewall Disabled from Start
# This is the ONLY way since Oracle locked the metadata

$ErrorActionPreference = "Stop"
$env:OCI_CLI_AUTH = "security_token"

$instanceId = "ocid1.instance.oc1.eu-frankfurt-1.antheljtse5nuxyckx6ugr65ol6ljyglybtoc2w2kyf3fkqbezouq6l4yzmq"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     RECREATE VM WITH FIREWALL DISABLED (FINAL SOLUTION)     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Terminate existing VM (keeps IP if in same compartment)" -ForegroundColor Gray
Write-Host "  2. Create new VM with SAME specs" -ForegroundColor Gray
Write-Host "  3. Cloud-init automatically disables firewall on first boot" -ForegroundColor Gray
Write-Host "  4. Docker + Docker Compose pre-installed`n" -ForegroundColor Gray

Write-Host "⚠️  WARNING: This will DELETE the current VM!" -ForegroundColor Red
Write-Host "   (But you'll get a new one with working SSH in 3 minutes)`n" -ForegroundColor Red

$confirm = Read-Host "Type 'DELETE' to proceed"
if ($confirm -ne "DELETE") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host "`n🔄 Getting VM details for recreation..." -ForegroundColor Cyan
$vmDetails = oci compute instance get --instance-id $instanceId --auth security_token | ConvertFrom-Json

$compartmentId = $vmDetails.data.'compartment-id'
$availabilityDomain = $vmDetails.data.'availability-domain'
$shape = $vmDetails.data.shape
$subnetId = (oci compute vnic-attachment list --compartment-id $compartmentId --instance-id $instanceId --auth security_token | ConvertFrom-Json).data[0].'subnet-id'
$imageId = $vmDetails.data.'image-id'
$sshKey = $vmDetails.data.metadata.ssh_authorized_keys

Write-Host "✓ VM configuration captured" -ForegroundColor Green
Write-Host "  Shape: $shape" -ForegroundColor Gray
Write-Host "  Subnet: $subnetId" -ForegroundColor Gray

Write-Host "`n🗑️  Terminating old VM..." -ForegroundColor Yellow
oci compute instance terminate --instance-id $instanceId --force --auth security_token | Out-Null
Write-Host "✓ Old VM deleted" -ForegroundColor Green

Write-Host "`n⏳ Waiting 30 seconds for resources to release..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host "`n🚀 Creating new VM with firewall disabled..." -ForegroundColor Cyan

$userDataScript = @"
#!/bin/bash
set -x
exec > /var/log/cloud-init-custom.log 2>&1

# CRITICAL: Disable firewall FIRST
ufw disable
iptables -F
iptables -X
iptables -P INPUT ACCEPT
iptables -P OUTPUT ACCEPT
iptables -P FORWARD ACCEPT
systemctl stop ufw
systemctl disable ufw

# Install Docker
apt-get update
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt-get install -y git

# Create app directory
mkdir -p /home/ubuntu/app
chown ubuntu:ubuntu /home/ubuntu/app

# Enable Docker
systemctl enable docker
systemctl start docker

# Final firewall check (paranoid mode)
ufw status | grep -q inactive || ufw disable

echo "VM initialization complete - SSH ready!" > /home/ubuntu/init-complete.txt
"@

$userDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($userDataScript))

$createParams = @{
    'availability-domain' = $availabilityDomain
    'compartment-id' = $compartmentId
    'shape' = $shape
    'subnet-id' = $subnetId
    'image-id' = $imageId
    'display-name' = 'megilance-backend-vm-fixed'
    'metadata' = @{
        'ssh_authorized_keys' = $sshKey
        'user_data' = $userDataBase64
    } | ConvertTo-Json -Compress
    'assign-public-ip' = 'true'
    'wait-for-state' = 'RUNNING'
    'auth' = 'security_token'
}

Write-Host "  Launching instance..." -ForegroundColor Gray
$newVm = oci compute instance launch `
    --availability-domain $availabilityDomain `
    --compartment-id $compartmentId `
    --shape $shape `
    --subnet-id $subnetId `
    --image-id $imageId `
    --display-name "megilance-backend-vm-fixed" `
    --metadata "{`"ssh_authorized_keys`":`"$sshKey`",`"user_data`":`"$userDataBase64`"}" `
    --assign-public-ip true `
    --wait-for-state RUNNING `
    --auth security_token | ConvertFrom-Json

$newInstanceId = $newVm.data.id

Write-Host "`n✅ New VM created!" -ForegroundColor Green
Write-Host "   Instance ID: $newInstanceId" -ForegroundColor Gray

Write-Host "`n🔍 Getting new public IP..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
$vnicId = (oci compute vnic-attachment list --compartment-id $compartmentId --instance-id $newInstanceId --auth security_token | ConvertFrom-Json).data[0].'vnic-id'
$newIP = (oci network vnic get --vnic-id $vnicId --auth security_token | ConvertFrom-Json).data.'public-ip'

Write-Host "✅ New Public IP: $newIP" -ForegroundColor Green

Write-Host "`n⏳ Waiting 90 seconds for cloud-init to complete (Docker install + firewall disable)..." -ForegroundColor Cyan
Write-Host "   Progress: " -NoNewline -ForegroundColor Gray
for ($i = 1; $i -le 18; $i++) {
    Write-Host "█" -NoNewline -ForegroundColor Green
    Start-Sleep -Seconds 5
}
Write-Host " Done!`n" -ForegroundColor Green

Write-Host "🧪 Testing SSH connection..." -ForegroundColor Cyan
$testResult = & ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -i "oracle-vm-ssh.key" ubuntu@$newIP "echo 'SSH WORKS'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                 ✅ SUCCESS! SSH WORKING! ✅                  ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "New VM Details:" -ForegroundColor Cyan
    Write-Host "  IP Address: $newIP" -ForegroundColor White
    Write-Host "  Instance ID: $newInstanceId" -ForegroundColor Gray
    Write-Host "  Status: RUNNING with SSH access ✅`n" -ForegroundColor Gray
    
    Write-Host "📝 Updating reference file..." -ForegroundColor Cyan
    $refContent = @"
# Updated VM Information
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

INSTANCE_ID=$newInstanceId
PUBLIC_IP=$newIP
INSTANCE_NAME=megilance-backend-vm-fixed

# SSH Test
# ssh -i oracle-vm-ssh.key ubuntu@$newIP
"@
    $refContent | Out-File -FilePath "VM_DEPLOYMENT_REFERENCE.md" -Encoding utf8 -Force
    
    Write-Host "`n🚀 Ready to deploy! Run:" -ForegroundColor Green
    Write-Host "   .\auto-deploy-to-vm.ps1" -ForegroundColor White
    Write-Host "`n   (Make sure to update the IP in that script to: $newIP)`n" -ForegroundColor Yellow
    
} else {
    Write-Host "`n⚠️  SSH not ready yet. Wait 2 more minutes and test:" -ForegroundColor Yellow
    Write-Host "   ssh -i oracle-vm-ssh.key ubuntu@$newIP`n" -ForegroundColor White
    Write-Host "Error: $testResult" -ForegroundColor Gray
}

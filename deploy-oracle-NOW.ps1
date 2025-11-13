# @AI-HINT: FULLY AUTOMATED Oracle deployment - ZERO manual steps, maximum speed
# Uses parallel jobs for network + DB creation while VM launches

$env:OCI_CLI_AUTH = "security_token"
$ErrorActionPreference = "Continue"

$tenancyId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$compartmentId = $tenancyId

Write-Host "`n🚀 FULL AUTO DEPLOYMENT - STARTING...`n" -ForegroundColor Green

# Get AD
$adData = oci iam availability-domain list --compartment-id $compartmentId | ConvertFrom-Json
$ad = $adData.data[0].name

# Known Oracle Linux 8 image OCID for Frankfurt region (Always Free compatible)
$imageId = "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaagbrvhganmn7qchnqh7tzsn45sfe2g4qz2qlz2qpgwdz5i2xwmqja"

# Check existing resources
$vcnList = oci network vcn list --compartment-id $compartmentId --all 2>$null | ConvertFrom-Json
$vcn = $vcnList.data | Where-Object { $_.'lifecycle-state' -eq 'AVAILABLE' } | Select-Object -First 1

if (-not $vcn) {
    Write-Host "[1/3] Creating network (30s)..." -ForegroundColor Yellow
    $vcnResult = oci network vcn create --compartment-id $compartmentId --display-name "megilance-vcn" --cidr-block "10.0.0.0/16" --wait-for-state AVAILABLE | ConvertFrom-Json
    $vcnId = $vcnResult.data.id
    
    # Create IGW + Subnet + Security in parallel
    $igwResult = oci network internet-gateway create --compartment-id $compartmentId --vcn-id $vcnId --display-name "megilance-igw" --is-enabled true --wait-for-state AVAILABLE | ConvertFrom-Json
    $igwId = $igwResult.data.id
    
    $rtData = oci network route-table list --compartment-id $compartmentId --vcn-id $vcnId --limit 1 | ConvertFrom-Json
    oci network route-table update --rt-id $rtData.data[0].id --route-rules "[{`"destination`":`"0.0.0.0/0`",`"networkEntityId`":`"$igwId`"}]" --force | Out-Null
    
    $slData = oci network security-list list --compartment-id $compartmentId --vcn-id $vcnId --limit 1 | ConvertFrom-Json
    oci network security-list update --security-list-id $slData.data[0].id --ingress-security-rules '[{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":443,"max":443}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":8000,"max":8000}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":9000,"max":9000}}}]' --egress-security-rules '[{"protocol":"all","destination":"0.0.0.0/0"}]' --force | Out-Null
    
    $subnetResult = oci network subnet create --compartment-id $compartmentId --vcn-id $vcnId --cidr-block "10.0.0.0/24" --availability-domain $ad --wait-for-state AVAILABLE | ConvertFrom-Json
    $subnetId = $subnetResult.data.id
    Write-Host "✓ Network ready" -ForegroundColor Green
} else {
    $vcnId = $vcn.id
    $subnetData = oci network subnet list --compartment-id $compartmentId --vcn-id $vcnId --limit 1 | ConvertFrom-Json
    $subnetId = $subnetData.data[0].id
    Write-Host "✓ Using existing network" -ForegroundColor Green
}

# Generate SSH key if needed
if (-not (Test-Path "$env:USERPROFILE\.ssh\id_rsa.pub")) {
    ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N '""' | Out-Null
}

# START VM + DATABASE IN PARALLEL
Write-Host "[2/3] Creating VM + Database in parallel..." -ForegroundColor Yellow

$vmJob = Start-Job -ScriptBlock {
    param($compartmentId, $ad, $imageId, $subnetId, $sshKeyPath)
    $env:OCI_CLI_AUTH = "security_token"
    
    $instances = oci compute instance list --compartment-id $compartmentId --lifecycle-state RUNNING --limit 10 | ConvertFrom-Json
    $existing = $instances.data | Where-Object { $_.'display-name' -eq 'megilance-backend' } | Select-Object -First 1
    
    if ($existing) {
        return $existing.id
    }
    
    $result = oci compute instance launch --compartment-id $compartmentId --availability-domain $ad --display-name "megilance-backend" --image-id $imageId --shape "VM.Standard.E2.1.Micro" --subnet-id $subnetId --assign-public-ip true --ssh-authorized-keys-file $sshKeyPath --wait-for-state RUNNING | ConvertFrom-Json
    return $result.data.id
} -ArgumentList $compartmentId, $ad, $imageId, $subnetId, "$env:USERPROFILE\.ssh\id_rsa.pub"

$dbJob = Start-Job -ScriptBlock {
    param($compartmentId)
    $env:OCI_CLI_AUTH = "security_token"
    
    $dbList = oci db autonomous-database list --compartment-id $compartmentId --lifecycle-state AVAILABLE --limit 10 | ConvertFrom-Json
    $existing = $dbList.data | Where-Object { $_.'db-name' -eq 'megilancedb' } | Select-Object -First 1
    
    if ($existing) {
        return @{id=$existing.id; password="EXISTING"}
    }
    
    $password = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "Aa1!"
    $result = oci db autonomous-database create --compartment-id $compartmentId --db-name "megilancedb" --display-name "megilancedb" --admin-password $password --cpu-core-count 1 --data-storage-size-in-tbs 1 --db-workload "OLTP" --is-free-tier true --license-model "LICENSE_INCLUDED" --wait-for-state AVAILABLE | ConvertFrom-Json
    return @{id=$result.data.id; password=$password}
} -ArgumentList $compartmentId

# Wait for both jobs
while ($vmJob.State -eq 'Running' -or $dbJob.State -eq 'Running') {
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline -ForegroundColor Cyan
}
Write-Host ""

$instanceId = Receive-Job $vmJob
$dbInfo = Receive-Job $dbJob

Write-Host "✓ VM created: $instanceId" -ForegroundColor Green
Write-Host "✓ Database created: $($dbInfo.id)" -ForegroundColor Green

# Get VM IP
$vnicData = oci compute vnic-attachment list --compartment-id $compartmentId --instance-id $instanceId | ConvertFrom-Json
$vnicInfo = oci network vnic get --vnic-id $vnicData.data[0].'vnic-id' | ConvertFrom-Json
$publicIp = $vnicInfo.data.'public-ip'

# Download wallet
$walletPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
Write-Host "[3/3] Downloading wallet..." -ForegroundColor Yellow
oci db autonomous-database generate-wallet --autonomous-database-id $dbInfo.id --password $walletPassword --file "Wallet_megilancedb.zip" | Out-Null
if (Test-Path "oracle-wallet-23ai") { Remove-Item "oracle-wallet-23ai" -Recurse -Force }
Expand-Archive "Wallet_megilancedb.zip" -DestinationPath "oracle-wallet-23ai" -Force
Write-Host "✓ Wallet ready" -ForegroundColor Green

# Save info
@{
    InstanceId = $instanceId
    PublicIP = $publicIp
    DatabaseId = $dbInfo.id
    AdminPassword = $dbInfo.password
    WalletPassword = $walletPassword
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "oracle-deployment-info.json" -Encoding UTF8

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       ✅ ORACLE RESOURCES CREATED ✅            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green
Write-Host "Public IP:       $publicIp" -ForegroundColor Cyan
Write-Host "DB Password:     $($dbInfo.password)" -ForegroundColor Yellow
Write-Host "Wallet Password: $walletPassword`n" -ForegroundColor Yellow

Write-Host "🚀 NOW DEPLOYING BACKEND...`n" -ForegroundColor Cyan
Start-Sleep -Seconds 30  # Wait for SSH

# Deploy backend
Write-Host "Uploading setup script..." -ForegroundColor Yellow
scp -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no deploy-oracle-setup.sh opc@${publicIp}:/tmp/ 2>$null

Write-Host "Running setup (10 mins)..." -ForegroundColor Yellow
ssh -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no opc@${publicIp} "chmod +x /tmp/deploy-oracle-setup.sh && sudo bash /tmp/deploy-oracle-setup.sh" 2>$null

Write-Host "Uploading wallet..." -ForegroundColor Yellow
scp -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no -r oracle-wallet-23ai opc@${publicIp}:/tmp/ 2>$null
ssh -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no opc@${publicIp} "sudo mv /tmp/oracle-wallet-23ai /home/megilance/megilance/ && sudo chown -R megilance:megilance /home/megilance/megilance/oracle-wallet-23ai" 2>$null

# Get DigitalOcean URL
$doApp = doctl apps get 7d432958-1a7e-444b-bb95-1fdf23232905 --format DefaultIngress --no-header 2>$null
$frontendUrl = if ($doApp) { "https://$doApp" } else { "http://localhost:3000" }

# Create .env
$secretKey = openssl rand -hex 32
$jwtSecret = openssl rand -hex 32
$refreshSecret = openssl rand -hex 32
$webhookSecret = openssl rand -hex 32

$envContent = @"
DATABASE_TYPE=oracle
ORACLE_USER=ADMIN
ORACLE_PASSWORD=$($dbInfo.password)
ORACLE_DSN=megilancedb_high
ORACLE_WALLET_LOCATION=/app/oracle-wallet
ORACLE_WALLET_PASSWORD=$walletPassword
SECRET_KEY=$secretKey
JWT_SECRET_KEY=$jwtSecret
REFRESH_TOKEN_SECRET=$refreshSecret
ENVIRONMENT=production
DEBUG=false
FRONTEND_URL=$frontendUrl
CORS_ORIGINS=$frontendUrl
AI_SERVICE_URL=http://ai:8001
WEBHOOK_SECRET=$webhookSecret
"@

$envContent | Out-File "backend/.env.production" -Encoding UTF8 -NoNewline
scp -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no backend/.env.production opc@${publicIp}:/tmp/.env 2>$null
ssh -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no opc@${publicIp} "sudo mv /tmp/.env /home/megilance/megilance/backend/.env && sudo chown megilance:megilance /home/megilance/megilance/backend/.env" 2>$null

Write-Host "Starting services..." -ForegroundColor Yellow
ssh -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no opc@${publicIp} "cd /home/megilance/megilance && sudo -u megilance docker-compose -f docker-compose.oracle.yml up -d" 2>$null

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         ✅ DEPLOYMENT COMPLETE! ✅              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green
Write-Host "API:     http://$publicIp:8000/api" -ForegroundColor Cyan
Write-Host "Docs:    http://$publicIp:8000/api/docs" -ForegroundColor Cyan
Write-Host "Webhook: $webhookSecret`n" -ForegroundColor Yellow
Write-Host "Update DigitalOcean NEXT_PUBLIC_API_URL to: http://$publicIp/api`n" -ForegroundColor Cyan

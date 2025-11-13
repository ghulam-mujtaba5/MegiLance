# Oracle VM Deployment via Console Connection
# This script uses OCI CLI to access and configure the VM

$ErrorActionPreference = "Continue"
$env:OCI_CLI_AUTH = "security_token"

$instanceId = "ocid1.instance.oc1.eu-frankfurt-1.antheljtse5nuxyckx6ugr65ol6ljyglybtoc2w2kyf3fkqbezouq6l4yzmq"
$publicIp = "152.70.31.175"
$compartmentId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"

Write-Host "`n🚀 MegiLance Backend Deployment to Oracle VM" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Step 1: Check VM status
Write-Host "1️⃣ Checking VM status..." -ForegroundColor Yellow
$vmStatus = oci compute instance get --instance-id $instanceId --region eu-frankfurt-1 2>$null | ConvertFrom-Json
if ($vmStatus.data.'lifecycle-state' -eq 'RUNNING') {
    Write-Host "   ✅ VM is RUNNING" -ForegroundColor Green
} else {
    Write-Host "   ❌ VM Status: $($vmStatus.data.'lifecycle-state')" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Test connectivity
Write-Host "2️⃣ Testing network connectivity..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $publicIp -Count 2 -Quiet
if ($pingResult) {
    Write-Host "   ✅ VM is reachable (ping successful)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Ping failed, but VM might still be accessible" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Check if SSH key exists
Write-Host "3️⃣ Checking SSH key..." -ForegroundColor Yellow
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
if (Test-Path $sshKeyPath) {
    Write-Host "   ✅ SSH key found at: $sshKeyPath" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Default SSH key not found" -ForegroundColor Yellow
    Write-Host "   Looking for oracle-vm-key..." -ForegroundColor Gray
    
    # Check for Oracle-generated key
    $oracleKey = Get-ChildItem -Path $PWD -Filter "oracle-vm-key*" -File | Select-Object -First 1
    if ($oracleKey) {
        $sshKeyPath = $oracleKey.FullName
        Write-Host "   ✅ Found Oracle key: $($oracleKey.Name)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No SSH key found. You may need to use Oracle Console Connection" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 4: Try SSH connection
Write-Host "4️⃣ Attempting SSH connection..." -ForegroundColor Yellow
Write-Host "   Trying: ssh ubuntu@$publicIp" -ForegroundColor Gray

$sshTest = $null
if (Test-Path $sshKeyPath) {
    $sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i $sshKeyPath ubuntu@$publicIp "echo 'connected'" 2>&1
} else {
    $sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$publicIp "echo 'connected'" 2>&1
}

if ($sshTest -match "connected") {
    Write-Host "   ✅ SSH connection successful!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "5️⃣ Running setup script on VM..." -ForegroundColor Yellow
    
    # Upload and run setup script
    if (Test-Path $sshKeyPath) {
        scp -o StrictHostKeyChecking=no -i $sshKeyPath "vm-setup-script.sh" "ubuntu@${publicIp}:/home/ubuntu/" 2>$null
        ssh -o StrictHostKeyChecking=no -i $sshKeyPath ubuntu@$publicIp "chmod +x /home/ubuntu/vm-setup-script.sh && /home/ubuntu/vm-setup-script.sh"
    } else {
        scp -o StrictHostKeyChecking=no "vm-setup-script.sh" "ubuntu@${publicIp}:/home/ubuntu/" 2>$null
        ssh -o StrictHostKeyChecking=no ubuntu@$publicIp "chmod +x /home/ubuntu/vm-setup-script.sh && /home/ubuntu/vm-setup-script.sh"
    }
    
} else {
    Write-Host "   ❌ SSH connection failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Manual Steps Required:" -ForegroundColor Yellow
    Write-Host "=" * 60 -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 1: Use Oracle Cloud Shell" -ForegroundColor Cyan
    Write-Host "  1. Open Oracle Cloud Console" -ForegroundColor Gray
    Write-Host "  2. Click Cloud Shell icon (>_) in top right" -ForegroundColor Gray
    Write-Host "  3. Run: ssh ubuntu@$publicIp" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Use Console Connection" -ForegroundColor Cyan
    Write-Host "  1. Go to VM instance page in Oracle Console" -ForegroundColor Gray
    Write-Host "  2. Click 'Console Connection' on left menu" -ForegroundColor Gray
    Write-Host "  3. Create console connection" -ForegroundColor Gray
    Write-Host "  4. Launch Cloud Shell connection" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3: Wait and Retry" -ForegroundColor Cyan
    Write-Host "  The VM might still be initializing. Wait 5 minutes and run:" -ForegroundColor Gray
    Write-Host "  ssh ubuntu@$publicIp" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "📊 VM Information:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Instance OCID: $instanceId" -ForegroundColor Gray
Write-Host "Public IP:     $publicIp" -ForegroundColor Yellow
Write-Host "Private IP:    10.0.0.126" -ForegroundColor Gray
Write-Host "VCN:           megilance-vcn" -ForegroundColor Gray
Write-Host "Region:        eu-frankfurt-1" -ForegroundColor Gray
Write-Host ""

# Next steps guide
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "Once you can SSH into the VM:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Upload Oracle DB wallet:" -ForegroundColor White
Write-Host "   scp -r .\oracle-wallet-23ai\* ubuntu@${publicIp}:/home/ubuntu/app/MegiLance/oracle-wallet-23ai/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy backend:" -ForegroundColor White
Write-Host "   ssh ubuntu@$publicIp" -ForegroundColor Gray
Write-Host "   cd /home/ubuntu/app/MegiLance" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.minimal.yml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify deployment:" -ForegroundColor White
Write-Host "   docker ps" -ForegroundColor Gray
Write-Host "   curl http://localhost:8000/api/health/live" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Tip: If SSH doesn't work from your machine, use Oracle Cloud Shell!" -ForegroundColor Cyan
Write-Host ""

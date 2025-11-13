# FINAL VM Creation - Use Original VCN with SSH Rules Already Configured
$ErrorActionPreference = "Stop"
$env:OCI_CLI_AUTH = "security_token"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CREATE VM IN CORRECT SUBNET (SSH RULES ALREADY EXIST)      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# The ORIGINAL VCN that we added SSH rules to earlier
$vcnWithRules = "ocid1.vcn.oc1.eu-frankfurt-1.amaaaaaase5nuxyasj23hbdrc3f7cho3kquf6om4mzyzm4b26kn4x6mjgyza"
$compartmentId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"

Write-Host "Getting subnet from VCN with SSH rules..." -ForegroundColor Cyan
$subnetId = (oci network subnet list --compartment-id $compartmentId --vcn-id $vcnWithRules --auth security_token | ConvertFrom-Json).data[0].id
Write-Host "✓ Subnet ID: $subnetId`n" -ForegroundColor Green

# Create metadata
$metadata = @{
    ssh_authorized_keys = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDoR027D6WBwhKTVqtZIBkAQZrVv9PC+AgXMEq9gf13QkFsof16TcdmUJrKHeMiYYKRXl5clvKypJkYDPRFtobUubmhf1msPJ7yVGzMiSJfFkMYznIX70dXEPgP1r9DPPfFmctBUbHrlIoPssxOq/qmEotGDXZ7cDnoehTN9BCLi4Kw3fGy1zHGNItJHO6P5hpm9BJcwJUEDBxRanufu3BkrXlPbpKe3ZAfWUnGD4I1JLSBGY8cEKvXPxNTOGMGbzY7FoSvthMHVSbiK8BOudpZjzdlEkd91RIVaJqKXLGC63lcDFa3yFtjaAYuaodSnJt1/qpg2YJHP1welPYFpvlV ssh-key-2025-11-13"
    user_data = "IyEvYmluL2Jhc2gKdWZ3IGRpc2FibGUKaXB0YWJsZXMgLUYKc3lzdGVtY3RsIHJlc3RhcnQgc3NoZA=="
}
$metadata | ConvertTo-Json -Compress | Out-File metadata-final.json -Encoding utf8

Write-Host "Creating VM..." -ForegroundColor Cyan
$result = oci compute instance launch `
    --availability-domain "WDxd:EU-FRANKFURT-1-AD-3" `
    --compartment-id $compartmentId `
    --shape "VM.Standard.E2.1.Micro" `
    --subnet-id $subnetId `
    --image-id "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaaylo6ubrzuwm3yaxgem3i2d5evrrgth3qkttqdmlevzs6k5yaudoq" `
    --display-name "megilance-backend-WORKING" `
    --assign-public-ip true `
    --metadata file://metadata-final.json `
    --wait-for-state RUNNING `
    --auth security_token | ConvertFrom-Json

$instanceId = $result.data.id
Write-Host "✅ VM Created: $instanceId`n" -ForegroundColor Green

Write-Host "Getting IP address..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
$vnicId = (oci compute vnic-attachment list --compartment-id $compartmentId --instance-id $instanceId --auth security_token | ConvertFrom-Json).data[0].'vnic-id'
$ip = (oci network vnic get --vnic-id $vnicId --auth security_token | ConvertFrom-Json).data.'public-ip'

Write-Host "✅ IP Address: $ip`n" -ForegroundColor Green

Write-Host "Waiting 90 seconds for boot + cloud-init..." -ForegroundColor Yellow
for ($i = 1; $i -le 18; $i++) {
    Write-Host "█" -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 5
}
Write-Host " Done!`n" -ForegroundColor Green

Write-Host "Testing SSH..." -ForegroundColor Cyan
$sshTest = & ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -i "oracle-vm-ssh.key" ubuntu@$ip "echo 'SSH WORKS'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                 ✅ SUCCESS! SSH WORKING! ✅                  ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "VM Details:" -ForegroundColor Cyan
    Write-Host "  IP: $ip" -ForegroundColor White
    Write-Host "  Instance ID: $instanceId`n" -ForegroundColor Gray
    
    Write-Host "Ready to deploy! Update auto-deploy-to-vm.ps1 with IP: $ip" -ForegroundColor Green
    Write-Host "Then run: .\auto-deploy-to-vm.ps1`n" -ForegroundColor White
} else {
    Write-Host "`n⚠️  SSH not ready yet" -ForegroundColor Yellow
    Write-Host "Wait 2 more minutes and test: ssh -i oracle-vm-ssh.key ubuntu@$ip`n" -ForegroundColor Gray
    Write-Host "Error: $sshTest" -ForegroundColor Gray
}

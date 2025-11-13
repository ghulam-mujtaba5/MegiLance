#!/usr/bin/env pwsh
# Create VM with Oracle Linux (NO firewall by default!)

$env:OCI_CLI_AUTH = "security_token"

Write-Host "🔍 Finding Oracle Linux image..." -ForegroundColor Cyan
$oracleLinuxImage = oci compute image list `
    --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" `
    --operating-system "Oracle Linux" `
    --operating-system-version "8" `
    --shape "VM.Standard.E2.1.Micro" `
    --query 'data[0].id' `
    --raw-output `
    --auth security_token

Write-Host "Oracle Linux Image: $oracleLinuxImage`n" -ForegroundColor Yellow

Write-Host "📝 Creating metadata..." -ForegroundColor Cyan
$cloudInit = @"
#!/bin/bash
# Oracle Linux doesn't have firewall enabled, but let's be sure
systemctl stop firewalld || true
systemctl disable firewalld || true

# Install Docker
yum install -y yum-utils
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker

# Add oracle user to docker group
usermod -aG docker opc

echo "INIT COMPLETE" > /root/cloud-init-done.txt
"@

$cloudInitBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($cloudInit))

$metadata = @{
    ssh_authorized_keys = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDoR027D6WBwhKTVqtZIBkAQZrVv9PC+AgXMEq9gf13QkFsof16TcdmUJrKHeMiYYKRXl5clvKypJkYDPRFtobUubmhf1msPJ7yVGzMiSJfFkMYznIX70dXEPgP1r9DPPfFmctBUbHrlIoPssxOq/qmEotGDXZ7cDnoehTN9BCLi4Kw3fGy1zHGNItJHO6P5hpm9BJcwJUEDBxRanufu3BkrXlPbpKe3ZAfWUnGD4I1JLSBGY8cEKvXPxNTOGMGbzY7FoSvthMHVSbiK8BOudpZjzdlEkd91RIVaJqKXLGC63lcDFa3yFtjaAYuaodSnJt1/qpg2YJHP1welPYFpvlV ssh-key-2025-11-13"
    user_data = $cloudInitBase64
}

$metadata | ConvertTo-Json -Compress | Out-File metadata-oracle-linux.json -Encoding utf8

Write-Host "🗑️  Deleting old Ubuntu VM (if exists)..." -ForegroundColor Yellow
$oldVm = (oci compute instance list `
    --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" `
    --display-name "megilance-backend-FINAL" `
    --auth security_token | ConvertFrom-Json).data[0]

if ($oldVm) {
    Write-Host "Terminating: $($oldVm.id)" -ForegroundColor Red
    oci compute instance terminate `
        --instance-id $oldVm.id `
        --force `
        --wait-for-state TERMINATED `
        --auth security_token
    Write-Host "✅ Deleted`n" -ForegroundColor Green
}

Write-Host "🚀 Creating VM with Oracle Linux (NO firewall!)..." -ForegroundColor Green

$subnetId = oci network subnet list `
    --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" `
    --vcn-id "ocid1.vcn.oc1.eu-frankfurt-1.amaaaaaase5nuxyasj23hbdrc3f7cho3kquf6om4mzyzm4b26kn4x6mjgyza" `
    --query 'data[0].id' `
    --raw-output `
    --auth security_token

Write-Host "Using subnet: $subnetId`n" -ForegroundColor Cyan

oci compute instance launch `
    --availability-domain "WDxd:EU-FRANKFURT-1-AD-3" `
    --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" `
    --shape "VM.Standard.E2.1.Micro" `
    --subnet-id $subnetId `
    --image-id $oracleLinuxImage `
    --display-name "megilance-backend-oracle" `
    --assign-public-ip true `
    --metadata file://metadata-oracle-linux.json `
    --wait-for-state RUNNING `
    --auth security_token

Write-Host "`n✅ VM Created! Getting IP..." -ForegroundColor Green

$newVm = (oci compute instance list `
    --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" `
    --display-name "megilance-backend-oracle" `
    --auth security_token | ConvertFrom-Json).data[0]

$vnicId = (oci compute instance list-vnics `
    --instance-id $newVm.id `
    --auth security_token | ConvertFrom-Json).data[0].id

$publicIp = (oci network vnic get `
    --vnic-id $vnicId `
    --auth security_token | ConvertFrom-Json).data.'public-ip'

Write-Host "✅ IP Address: $publicIp" -ForegroundColor Green
Write-Host "`nWaiting 60 seconds for cloud-init..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host "`n🔌 Testing SSH..." -ForegroundColor Cyan
# Oracle Linux uses 'opc' user, not 'ubuntu'
ssh -i oracle-vm-ssh.key -o StrictHostKeyChecking=no -o ConnectTimeout=10 opc@$publicIp "echo '✅ SSH WORKS!'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! SSH WORKING!" -ForegroundColor Green
    Write-Host "VM IP: $publicIp" -ForegroundColor Cyan
    Write-Host "User: opc (not ubuntu)" -ForegroundColor Yellow
    Write-Host "`nUpdate auto-deploy-to-vm.ps1 with new IP and user" -ForegroundColor White
} else {
    Write-Host "`n⚠️  SSH not ready yet. Wait 2 more minutes and test:" -ForegroundColor Yellow
    Write-Host "ssh -i oracle-vm-ssh.key opc@$publicIp" -ForegroundColor White
}

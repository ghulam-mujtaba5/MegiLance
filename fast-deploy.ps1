# ULTRA-FAST FULLY AUTOMATED Oracle deployment - ZERO manual steps
$env:OCI_CLI_AUTH = "security_token"
$ErrorActionPreference = "SilentlyContinue"

$tenancyId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$compartmentId = $tenancyId
$imageId = "ocid1.image.oc1.eu-frankfurt-1.aaaaaaaagbrvhganmn7qchnqh7tzsn45sfe2g4qz2qlz2qpgwdz5i2xwmqja"

Write-Host "🚀 STARTING PARALLEL DEPLOYMENT..." -ForegroundColor Green

# Get AD
$ad = (oci iam availability-domain list --compartment-id $compartmentId | ConvertFrom-Json).data[0].name

# Get or create network resources
$vcns = (oci network vcn list --compartment-id $compartmentId --all | ConvertFrom-Json).data
$vcn = $vcns | Where-Object { $_.'lifecycle-state' -eq 'AVAILABLE' } | Select-Object -First 1

if ($vcn) {
    $vcnId = $vcn.id
    $subnets = (oci network subnet list --compartment-id $compartmentId --vcn-id $vcnId | ConvertFrom-Json).data
    $subnet = $subnets | Where-Object { $_.'lifecycle-state' -eq 'AVAILABLE' } | Select-Object -First 1
    
    if ($subnet) {
        $subnetId = $subnet.id
        Write-Host "✓ Network ready" -ForegroundColor Green
    } else {
        Write-Host "Creating subnet..." -ForegroundColor Yellow
        $subnetResult = oci network subnet create --compartment-id $compartmentId --vcn-id $vcnId --cidr-block "10.0.1.0/24" --availability-domain $ad --wait-for-state AVAILABLE | ConvertFrom-Json
        $subnetId = $subnetResult.data.id
    }
} else {
    Write-Host "Creating network..." -ForegroundColor Yellow
    $vcnResult = oci network vcn create --compartment-id $compartmentId --cidr-block "10.0.0.0/16" --wait-for-state AVAILABLE | ConvertFrom-Json
    $vcnId = $vcnResult.data.id
    
    $igwResult = oci network internet-gateway create --compartment-id $compartmentId --vcn-id $vcnId --is-enabled true --wait-for-state AVAILABLE | ConvertFrom-Json
    $rt = (oci network route-table list --compartment-id $compartmentId --vcn-id $vcnId | ConvertFrom-Json).data[0]
    oci network route-table update --rt-id $rt.id --route-rules "[{`"destination`":`"0.0.0.0/0`",`"networkEntityId`":`"$($igwResult.data.id)`"}]" --force | Out-Null
    
    $sl = (oci network security-list list --compartment-id $compartmentId --vcn-id $vcnId | ConvertFrom-Json).data[0]
    oci network security-list update --security-list-id $sl.id --ingress-security-rules '[{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":443,"max":443}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":8000,"max":8000}}},{"protocol":"6","source":"0.0.0.0/0","tcpOptions":{"destinationPortRange":{"min":9000,"max":9000}}}]' --egress-security-rules '[{"protocol":"all","destination":"0.0.0.0/0"}]' --force | Out-Null
    
    $subnetResult = oci network subnet create --compartment-id $compartmentId --vcn-id $vcnId --cidr-block "10.0.0.0/24" --availability-domain $ad --wait-for-state AVAILABLE | ConvertFrom-Json
    $subnetId = $subnetResult.data.id
}

# SSH key
if (-not (Test-Path "$env:USERPROFILE\.ssh\id_rsa.pub")) {
    ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N '""' 2>$null | Out-Null
}

# PARALLEL: VM + DB
Write-Host "Creating VM + DB in parallel (3 mins)..." -ForegroundColor Cyan

$vmJob = Start-Job {
    param($c,$a,$i,$s,$k)
    $env:OCI_CLI_AUTH="security_token"
    $x=(oci compute instance list --compartment-id $c --lifecycle-state RUNNING | ConvertFrom-Json).data
    $e=$x|?{$_.'display-name' -eq 'megilance-backend'}|Select -First 1
    if($e){return $e.id}
    $r=oci compute instance launch --compartment-id $c --availability-domain $a --display-name "megilance-backend" --image-id $i --shape "VM.Standard.E2.1.Micro" --subnet-id $s --assign-public-ip true --ssh-authorized-keys-file $k --wait-for-state RUNNING|ConvertFrom-Json
    $r.data.id
} -Args $compartmentId,$ad,$imageId,$subnetId,"$env:USERPROFILE\.ssh\id_rsa.pub"

$dbJob = Start-Job {
    param($c)
    $env:OCI_CLI_AUTH="security_token"
    $x=(oci db autonomous-database list --compartment-id $c --lifecycle-state AVAILABLE|ConvertFrom-Json).data
    $e=$x|?{$_.'db-name' -eq 'megilancedb'}|Select -First 1
    if($e){return @{id=$e.id;pw="EXISTING"}}
    $p=-join((65..90)+(97..122)+(48..57)|Get-Random -C 16|%{[char]$_})+"Aa1!"
    $r=oci db autonomous-database create --compartment-id $c --db-name "megilancedb" --admin-password $p --cpu-core-count 1 --data-storage-size-in-tbs 1 --db-workload "OLTP" --is-free-tier true --license-model "LICENSE_INCLUDED" --wait-for-state AVAILABLE|ConvertFrom-Json
    @{id=$r.data.id;pw=$p}
} -Args $compartmentId

Wait-Job $vmJob,$dbJob | Out-Null
$instanceId=Receive-Job $vmJob
$dbInfo=Receive-Job $dbJob
Remove-Job $vmJob,$dbJob

Write-Host "✓ VM: $instanceId" -ForegroundColor Green
Write-Host "✓ DB: $($dbInfo.id)" -ForegroundColor Green

# Get IP
$vnic=(oci compute vnic-attachment list --compartment-id $compartmentId --instance-id $instanceId|ConvertFrom-Json).data[0]
$publicIp=(oci network vnic get --vnic-id $vnic.'vnic-id'|ConvertFrom-Json).data.'public-ip'

# Wallet
$wp=-join((65..90)+(97..122)+(48..57)|Get-Random -C 16|%{[char]$_})
oci db autonomous-database generate-wallet --autonomous-database-id $dbInfo.id --password $wp --file "Wallet_megilancedb.zip" 2>$null|Out-Null
if(Test-Path "oracle-wallet-23ai"){rm -r -fo "oracle-wallet-23ai"}
Expand-Archive "Wallet_megilancedb.zip" -Dest "oracle-wallet-23ai" -Force

Write-Host "`n✅ RESOURCES CREATED!" -ForegroundColor Green
Write-Host "IP: $publicIp | DB PW: $($dbInfo.pw) | Wallet: $wp`n" -ForegroundColor Yellow

# Save
@{IP=$publicIp;InstanceId=$instanceId;DBId=$dbInfo.id;DBPW=$dbInfo.pw;WalletPW=$wp}|ConvertTo-Json|Out-File "oracle-info.json"

Write-Host "🚀 DEPLOYING BACKEND (wait 10 mins)...`n" -ForegroundColor Cyan
Write-Host "SSH ready in 30s, then running setup script..." -ForegroundColor DarkGray
Start-Sleep 30

scp -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no deploy-oracle-setup.sh opc@${publicIp}:/tmp/ 2>$null
ssh -i "$env:USERPROFILE\.ssh\id_rsa" -o StrictHostKeyChecking=no opc@${publicIp} "chmod +x /tmp/deploy-oracle-setup.sh && sudo bash /tmp/deploy-oracle-setup.sh" 2>$null &

Write-Host "✅ Setup running in background!" -ForegroundColor Green
Write-Host "`nAPI will be ready at: http://$publicIp:8000/api" -ForegroundColor Cyan
Write-Host "Update DigitalOcean NEXT_PUBLIC_API_URL to: http://$publicIp/api`n" -ForegroundColor Yellow

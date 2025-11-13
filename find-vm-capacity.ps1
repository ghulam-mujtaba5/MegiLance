# @AI-HINT: Try all Oracle regions to find VM capacity
$ErrorActionPreference = "Stop"

$env:OCI_CLI_AUTH = "security_token"
$tid = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"

Write-Host "`n🔍 Searching for available VM capacity..." -ForegroundColor Cyan

# Try different regions
$regions = @(
    @{name="us-ashburn-1"; ad="KYdC:US-ASHBURN-AD-1"},
    @{name="us-phoenix-1"; ad="ERyt:PHX-AD-1"},
    @{name="eu-frankfurt-1"; ad="WDxd:EU-FRANKFURT-1-AD-1"},
    @{name="uk-london-1"; ad="lVvK:UK-LONDON-1-AD-1"},
    @{name="ap-tokyo-1"; ad="gFJR:AP-TOKYO-1-AD-1"}
)

foreach ($region in $regions) {
    Write-Host "`n🌍 Trying $($region.name)..." -ForegroundColor Yellow
    
    # Get or create VCN
    $vcn = oci network vcn list --compartment-id $tid --region $region.name --limit 1 2>$null | ConvertFrom-Json
    if ($vcn.data.Count -eq 0) {
        Write-Host "  Creating VCN..." -ForegroundColor Gray
        $vcnResult = oci network vcn create --compartment-id $tid --region $region.name --display-name "megilance-vcn" --cidr-block "10.0.0.0/16" 2>$null | ConvertFrom-Json
        if ($vcnResult.data) {
            $vcnId = $vcnResult.data.id
            
            # Create internet gateway
            $igw = oci network internet-gateway create --compartment-id $tid --region $region.name --vcn-id $vcnId --is-enabled true --display-name "igw" 2>$null | ConvertFrom-Json
            
            # Create route table
            $rt = oci network route-table list --compartment-id $tid --region $region.name --vcn-id $vcnId 2>$null | ConvertFrom-Json
            $rtId = $rt.data[0].id
            
            # Add route
            $routeRules = @(@{destination="0.0.0.0/0"; networkEntityId=$igw.data.id}) | ConvertTo-Json -Compress
            oci network route-table update --rt-id $rtId --region $region.name --route-rules $routeRules --force 2>$null | Out-Null
            
            # Create security list with ports 22, 80, 443, 8000
            $secList = oci network security-list list --compartment-id $tid --region $region.name --vcn-id $vcnId 2>$null | ConvertFrom-Json
            $secListId = $secList.data[0].id
            
            $ingressRules = @(
                @{protocol="6"; source="0.0.0.0/0"; tcpOptions=@{destinationPortRange=@{min=22;max=22}}}
                @{protocol="6"; source="0.0.0.0/0"; tcpOptions=@{destinationPortRange=@{min=80;max=80}}}
                @{protocol="6"; source="0.0.0.0/0"; tcpOptions=@{destinationPortRange=@{min=443;max=443}}}
                @{protocol="6"; source="0.0.0.0/0"; tcpOptions=@{destinationPortRange=@{min=8000;max=8000}}}
            ) | ConvertTo-Json
            
            oci network security-list update --security-list-id $secListId --region $region.name --ingress-security-rules $ingressRules --force 2>$null | Out-Null
            
            # Create subnet
            $subnetResult = oci network subnet create --compartment-id $tid --region $region.name --vcn-id $vcnId --cidr-block "10.0.1.0/24" --availability-domain $region.ad --display-name "megilance-subnet" 2>$null | ConvertFrom-Json
            $subnetId = $subnetResult.data.id
        } else {
            continue
        }
    } else {
        $vcnId = $vcn.data[0].id
        $subnet = oci network subnet list --compartment-id $tid --region $region.name --vcn-id $vcnId --limit 1 2>$null | ConvertFrom-Json
        if ($subnet.data.Count -eq 0) { continue }
        $subnetId = $subnet.data[0].id
    }
    
    # Try ARM first (A1.Flex - up to 4 OCPU, 24GB free)
    $images = oci compute image list --compartment-id $tid --region $region.name --operating-system "Oracle Linux" --shape "VM.Standard.A1.Flex" --limit 1 2>$null | ConvertFrom-Json
    if ($images.data.Count -gt 0) {
        $image = $images.data[0].id
        @{ocpus=1; memoryInGBs=6} | ConvertTo-Json -Compress | Set-Content "shape-config.json" -NoNewline
        
        Write-Host "  Trying ARM VM (1 OCPU, 6GB)..." -ForegroundColor Cyan
        $result = oci compute instance launch --compartment-id $tid --region $region.name --availability-domain $region.ad --shape "VM.Standard.A1.Flex" --shape-config file://shape-config.json --image-id $image --display-name "megilance-backend" --subnet-id $subnetId --assign-public-ip true 2>&1 | Out-String
        
        if ($result -match '"id"') {
            $vmData = $result | ConvertFrom-Json
            $vmId = $vmData.data.id
            Write-Host "`n✅ SUCCESS! VM created in $($region.name)" -ForegroundColor Green
            Write-Host "VM ID: $vmId" -ForegroundColor White
            
            Write-Host "`nWaiting for VM to start..." -ForegroundColor Yellow
            Start-Sleep -Seconds 45
            
            $vnicId = (oci compute instance list-vnics --instance-id $vmId --region $region.name 2>$null | ConvertFrom-Json).data[0].id
            $publicIp = (oci network vnic get --vnic-id $vnicId --region $region.name 2>$null | ConvertFrom-Json).data.'public-ip'
            
            Write-Host "`n✅ VM READY!" -ForegroundColor Green
            Write-Host "Public IP: $publicIp" -ForegroundColor Yellow
            Write-Host "Region: $($region.name)" -ForegroundColor Cyan
            Write-Host "Shape: VM.Standard.A1.Flex (1 OCPU, 6GB RAM)" -ForegroundColor Cyan
            
            @{
                vm_ocid=$vmId
                public_ip=$publicIp
                region=$region.name
                shape="VM.Standard.A1.Flex"
                ocpus=1
                memory_gb=6
                created_at=(Get-Date -Format "o")
            } | ConvertTo-Json | Out-File -FilePath "oracle-vm-details.json" -Encoding UTF8
            
            Write-Host "`n📋 Next: SSH and deploy" -ForegroundColor Yellow
            Write-Host "ssh opc@$publicIp" -ForegroundColor White
            exit 0
        }
    }
    
    Write-Host "  ⚠️ No capacity in $($region.name)" -ForegroundColor Yellow
}

Write-Host "`n❌ No VM capacity found in any region" -ForegroundColor Red
Write-Host "Try again in a few hours or use DigitalOcean instead" -ForegroundColor Yellow

# Simple VM capacity checker for Oracle Cloud
# Checks VM.Standard.E2.1.Micro availability across key regions

$ErrorActionPreference = "Continue"

# Regions to check (focusing on Always Free eligible regions)
$regions = @(
    "us-ashburn-1",
    "us-phoenix-1", 
    "eu-frankfurt-1",
    "uk-london-1",
    "ap-tokyo-1",
    "ap-seoul-1",
    "ap-mumbai-1",
    "sa-saopaulo-1",
    "ca-toronto-1",
    "ap-sydney-1"
)

$shape = "VM.Standard.E2.1.Micro"

Write-Host "`n🔍 Checking VM.Standard.E2.1.Micro capacity across regions...`n" -ForegroundColor Cyan

foreach ($region in $regions) {
    Write-Host "📍 Checking $region..." -ForegroundColor Yellow
    
    # List availability domains in the region
    $adOutput = oci iam availability-domain list --region $region 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to query region" -ForegroundColor Red
        continue
    }
    
    $ads = $adOutput | ConvertFrom-Json
    
    foreach ($ad in $ads.data) {
        $adName = $ad.name
        
        # Check compute capacity for this AD
        Write-Host "  Checking AD: $adName" -ForegroundColor Gray
        
        # Try to get compute capacity information
        $capacityOutput = oci compute compute-capacity-report create `
            --availability-domain $adName `
            --compartment-id "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq" `
            --region $region `
            --shape-availabilities "[{\"instanceShape\":\"$shape\"}]" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $capacity = $capacityOutput | ConvertFrom-Json
            
            # Check if shape is available
            $shapeAvail = $capacity.data.'shape-availabilities' | Where-Object { $_.'instance-shape' -eq $shape }
            
            if ($shapeAvail -and $shapeAvail.'availability-status' -eq 'AVAILABLE') {
                Write-Host "  ✅ AVAILABLE in $region ($adName)" -ForegroundColor Green
                Write-Host "`n🎯 Found available capacity!" -ForegroundColor Green
                Write-Host "Region: $region" -ForegroundColor Cyan
                Write-Host "AD: $adName" -ForegroundColor Cyan
                
                # Save results
                @{
                    Region = $region
                    AvailabilityDomain = $adName
                    Shape = $shape
                    Status = "AVAILABLE"
                } | ConvertTo-Json | Out-File "vm-capacity-found.json"
                
                exit 0
            }
        }
    }
    
    Write-Host "  ℹ️  Not available in $region" -ForegroundColor DarkGray
}

Write-Host "`n⚠️  No available capacity found in checked regions" -ForegroundColor Yellow
Write-Host "Recommendation: Try again later or use a different approach" -ForegroundColor Yellow
exit 1

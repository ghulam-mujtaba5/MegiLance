# @AI-HINT: Create Oracle Autonomous Database (Always Free tier)

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 CREATING AUTONOMOUS DATABASE (FREE TIER)   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Set auth
$env:OCI_CLI_AUTH = "security_token"
$ErrorActionPreference = "Continue"

# Configuration
$tenancyId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"
$compartmentId = $tenancyId

Write-Host "[1/3] Checking for existing database..." -ForegroundColor Yellow
$dbList = oci db autonomous-database list `
    --compartment-id $compartmentId `
    --lifecycle-state AVAILABLE `
    --limit 10 | ConvertFrom-Json

$existingDb = $dbList.data | Where-Object { $_.'db-name' -eq 'megilancedb' } | Select-Object -First 1

if ($existingDb) {
    Write-Host "✓ Using existing database: $($existingDb.'db-name')" -ForegroundColor Green
    $dbId = $existingDb.id
    $dbPassword = Read-Host -Prompt "Enter existing database ADMIN password" -AsSecureString
    $dbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
} else {
    Write-Host "[2/3] Creating Autonomous Database (this takes 2-3 minutes)..." -ForegroundColor Yellow
    Write-Host "  Name: megilancedb" -ForegroundColor Cyan
    Write-Host "  Tier: Always Free (20GB storage)" -ForegroundColor Cyan
    Write-Host "  Workload: Transaction Processing (OLTP)" -ForegroundColor Cyan
    
    # Generate strong password
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "Aa1!"
    
    Write-Host "`n  Generated ADMIN password: $dbPassword" -ForegroundColor Yellow
    Write-Host "  SAVE THIS PASSWORD!" -ForegroundColor Red
    
    $dbResult = oci db autonomous-database create `
        --compartment-id $compartmentId `
        --db-name "megilancedb" `
        --display-name "megilancedb" `
        --admin-password $dbPassword `
        --cpu-core-count 1 `
        --data-storage-size-in-tbs 1 `
        --db-workload "OLTP" `
        --is-free-tier true `
        --license-model "LICENSE_INCLUDED" `
        --wait-for-state AVAILABLE | ConvertFrom-Json
    
    $dbId = $dbResult.data.id
    Write-Host "`n✓ Database created!" -ForegroundColor Green
}

Write-Host "`n[3/3] Downloading database wallet..." -ForegroundColor Yellow

# Generate wallet password
$walletPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
$walletZip = "Wallet_megilancedb.zip"

oci db autonomous-database generate-wallet `
    --autonomous-database-id $dbId `
    --password $walletPassword `
    --file $walletZip | Out-Null

if ($LASTEXITCODE -eq 0 -and (Test-Path $walletZip)) {
    Write-Host "✓ Wallet downloaded: $walletZip" -ForegroundColor Green
    
    # Extract wallet
    if (Test-Path "oracle-wallet-23ai") {
        Remove-Item "oracle-wallet-23ai" -Recurse -Force
    }
    Expand-Archive -Path $walletZip -DestinationPath "oracle-wallet-23ai" -Force
    Write-Host "✓ Wallet extracted to: oracle-wallet-23ai" -ForegroundColor Green
} else {
    Write-Host "✗ Wallet download failed" -ForegroundColor Red
    exit 1
}

# Save database info
@{
    DatabaseId = $dbId
    DatabaseName = "megilancedb"
    AdminPassword = $dbPassword
    WalletPassword = $walletPassword
    WalletPath = (Resolve-Path "oracle-wallet-23ai").Path
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "oracle-database-info.json" -Encoding UTF8

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║      ✅ DATABASE CREATED SUCCESSFULLY ✅        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 Database Details:" -ForegroundColor Yellow
Write-Host "  Database ID:     $dbId" -ForegroundColor White
Write-Host "  Database Name:   megilancedb" -ForegroundColor Cyan
Write-Host "  ADMIN Password:  $dbPassword" -ForegroundColor Yellow
Write-Host "  Wallet Password: $walletPassword" -ForegroundColor Yellow
Write-Host "  Wallet Location: oracle-wallet-23ai\" -ForegroundColor White
Write-Host "  Tier:            Always Free (20GB)`n" -ForegroundColor Green

Write-Host "💾 Credentials saved to: oracle-database-info.json`n" -ForegroundColor Green

Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         NEXT: DEPLOY BACKEND SERVICES           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if (Test-Path "oracle-instance-info.json") {
    $instanceInfo = Get-Content "oracle-instance-info.json" | ConvertFrom-Json
    $oracleIP = $instanceInfo.PublicIP
    
    Write-Host "Run backend deployment:" -ForegroundColor Yellow
    Write-Host "  .\deploy-oracle-backend.ps1 -OracleIP $oracleIP`n" -ForegroundColor Cyan
} else {
    Write-Host "First create VM:" -ForegroundColor Yellow
    Write-Host "  .\create-oracle-vm.ps1`n" -ForegroundColor Cyan
}

Write-Host "💰 Cost: FREE (Always Free tier)`n" -ForegroundColor Green

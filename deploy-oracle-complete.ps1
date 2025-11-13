# @AI-HINT: SIMPLIFIED - Complete Oracle deployment guide with console + CLI hybrid approach

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 COMPLETE ORACLE DEPLOYMENT - STEP BY STEP  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "This will guide you through:" -ForegroundColor Yellow
Write-Host "  1. Creating VM via Oracle Console (5 mins)" -ForegroundColor White
Write-Host "  2. Creating Database via OCI CLI (3 mins)" -ForegroundColor White
Write-Host "  3. Deploying backend automatically (10 mins)`n" -ForegroundColor White

Write-Host "💰 All resources use Always Free tier = `$0/month`n" -ForegroundColor Green

# Set auth for CLI operations
$env:OCI_CLI_AUTH = "security_token"

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 1: CREATE VM (5 minutes)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Opening Oracle Cloud Console..." -ForegroundColor Yellow
Start-Process "https://cloud.oracle.com/compute/instances?region=eu-frankfurt-1"

Write-Host "`n📋 Follow these steps in the browser:" -ForegroundColor Yellow
Write-Host "  1. Click 'Create Instance'" -ForegroundColor White
Write-Host "  2. Name: megilance-backend" -ForegroundColor Cyan
Write-Host "  3. Image: Oracle Linux 8" -ForegroundColor Cyan
Write-Host "  4. Shape: Click 'Change Shape'" -ForegroundColor White
Write-Host "     → Select 'VM.Standard.E2.1.Micro' (Always Free)" -ForegroundColor Cyan
Write-Host "  5. Networking: Use defaults" -ForegroundColor White
Write-Host "  6. Add SSH key:" -ForegroundColor White

# Generate SSH key if needed
if (-not (Test-Path "$env:USERPROFILE\.ssh\id_rsa.pub")) {
    Write-Host "`n  Generating SSH key..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N '""'
}

$sshKey = Get-Content "$env:USERPROFILE\.ssh\id_rsa.pub"
Write-Host "     → Paste this SSH key:" -ForegroundColor Cyan
Write-Host "     ────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "     $sshKey" -ForegroundColor Yellow
Write-Host "     ────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  7. Click 'Create'`n" -ForegroundColor White

Write-Host "⏳ Wait for instance to be created (2-3 minutes)..." -ForegroundColor Yellow
Write-Host "Press Enter when the instance shows 'Running' state..." -ForegroundColor Cyan
Read-Host

Write-Host "`nEnter the Public IP address from the console:" -ForegroundColor Cyan
$oracleIP = Read-Host "Public IP"

if (-not $oracleIP) {
    Write-Host "✗ No IP provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "✓ VM IP: $oracleIP" -ForegroundColor Green

# Save instance info
@{
    PublicIP = $oracleIP
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    CreatedManually = $true
} | ConvertTo-Json | Out-File "oracle-instance-info.json" -Encoding UTF8

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 2: CREATE DATABASE (3 minutes)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Creating Autonomous Database via OCI CLI..." -ForegroundColor Yellow

$tenancyId = "ocid1.tenancy.oc1..aaaaaaaa4h764yvig7p4xtyxhmty36cwnbhqxsr3ldbaxnwykf2a5ws3qwlq"

# Check for existing database
Write-Host "Checking for existing database..." -ForegroundColor DarkGray
$dbList = oci db autonomous-database list --compartment-id $tenancyId --lifecycle-state AVAILABLE --limit 10 2>$null | ConvertFrom-Json
$existingDb = $dbList.data | Where-Object { $_.'db-name' -eq 'megilancedb' } | Select-Object -First 1

if ($existingDb) {
    Write-Host "✓ Using existing database: megilancedb" -ForegroundColor Green
    $dbId = $existingDb.id
    Write-Host "Enter existing database ADMIN password:" -ForegroundColor Cyan
    $securePassword = Read-Host -AsSecureString
    $dbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
} else {
    Write-Host "Creating new database (this takes 2-3 minutes)..." -ForegroundColor Cyan
    
    # Generate strong password
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_}) + "Aa1!"
    
    Write-Host "`n🔑 Generated ADMIN password: " -NoNewline -ForegroundColor Yellow
    Write-Host "$dbPassword" -ForegroundColor Red
    Write-Host "   SAVE THIS PASSWORD NOW!" -ForegroundColor Red
    
    $dbResult = oci db autonomous-database create `
        --compartment-id $tenancyId `
        --db-name "megilancedb" `
        --display-name "megilancedb" `
        --admin-password $dbPassword `
        --cpu-core-count 1 `
        --data-storage-size-in-tbs 1 `
        --db-workload "OLTP" `
        --is-free-tier true `
        --license-model "LICENSE_INCLUDED" `
        --wait-for-state AVAILABLE 2>&1 | Out-String | ConvertFrom-Json
    
    if ($dbResult.data) {
        $dbId = $dbResult.data.id
        Write-Host "✓ Database created!" -ForegroundColor Green
    } else {
        Write-Host "✗ Database creation failed" -ForegroundColor Red
        Write-Host "Creating manually via console..." -ForegroundColor Yellow
        Start-Process "https://cloud.oracle.com/adb?region=eu-frankfurt-1"
        Write-Host "`nCreate database with:" -ForegroundColor Cyan
        Write-Host "  Name: megilancedb" -ForegroundColor White
        Write-Host "  Workload: Transaction Processing" -ForegroundColor White
        Write-Host "  Deployment: Shared Infrastructure" -ForegroundColor White
        Write-Host "  Always Free: YES" -ForegroundColor Green
        Write-Host "  Password: $dbPassword`n" -ForegroundColor Yellow
        Write-Host "Press Enter when database is created..." -ForegroundColor Cyan
        Read-Host
        
        # Get database ID
        $dbList = oci db autonomous-database list --compartment-id $tenancyId --lifecycle-state AVAILABLE --limit 10 | ConvertFrom-Json
        $db = $dbList.data | Where-Object { $_.'db-name' -eq 'megilancedb' } | Select-Object -First 1
        $dbId = $db.id
    }
}

# Download wallet
Write-Host "`nDownloading database wallet..." -ForegroundColor Yellow
$walletPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
$walletZip = "Wallet_megilancedb.zip"

oci db autonomous-database generate-wallet `
    --autonomous-database-id $dbId `
    --password $walletPassword `
    --file $walletZip 2>$null | Out-Null

if (Test-Path $walletZip) {
    if (Test-Path "oracle-wallet-23ai") {
        Remove-Item "oracle-wallet-23ai" -Recurse -Force
    }
    Expand-Archive -Path $walletZip -DestinationPath "oracle-wallet-23ai" -Force
    Write-Host "✓ Wallet downloaded and extracted" -ForegroundColor Green
} else {
    Write-Host "✗ Wallet download failed via CLI" -ForegroundColor Yellow
    Write-Host "Download manually from console..." -ForegroundColor Cyan
    Start-Process "https://cloud.oracle.com/adb?region=eu-frankfurt-1"
    Write-Host "1. Click database name" -ForegroundColor White
    Write-Host "2. DB Connection → Download Wallet" -ForegroundColor White
    Write-Host "3. Password: $walletPassword" -ForegroundColor Yellow
    Write-Host "4. Extract to: oracle-wallet-23ai\" -ForegroundColor White
    Write-Host "`nPress Enter when wallet is extracted..." -ForegroundColor Cyan
    Read-Host
}

# Save database info
@{
    DatabaseId = $dbId
    DatabaseName = "megilancedb"
    AdminPassword = $dbPassword
    WalletPassword = $walletPassword
    CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json | Out-File "oracle-database-info.json" -Encoding UTF8

Write-Host "✓ Database ready!" -ForegroundColor Green
Write-Host "  ADMIN Password:  $dbPassword" -ForegroundColor Yellow
Write-Host "  Wallet Password: $walletPassword`n" -ForegroundColor Yellow

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 3: DEPLOY BACKEND (10 minutes)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Running deployment script..." -ForegroundColor Yellow
Write-Host "`n.\deploy-oracle-backend.ps1 -OracleIP $oracleIP`n" -ForegroundColor Cyan

& ".\deploy-oracle-backend.ps1" -OracleIP $oracleIP

Write-Host "`n╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ ORACLE DEPLOYMENT COMPLETE! ✅          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🌐 Your Backend:" -ForegroundColor Yellow
Write-Host "   API:     http://$oracleIP:8000/api" -ForegroundColor Cyan
Write-Host "   Docs:    http://$oracleIP:8000/api/docs" -ForegroundColor Cyan
Write-Host "   Health:  http://$oracleIP:8000/api/health/live`n" -ForegroundColor Cyan

Write-Host "📱 Next: Connect DigitalOcean Frontend" -ForegroundColor Yellow
Write-Host "   1. Go to: https://cloud.digitalocean.com/apps/7d432958-1a7e-444b-bb95-1fdf23232905/settings" -ForegroundColor White
Write-Host "   2. Edit NEXT_PUBLIC_API_URL:" -ForegroundColor White
Write-Host "      New value: http://$oracleIP/api`n" -ForegroundColor Cyan

Write-Host "💰 Total Cost: `$0/month (Always Free)`n" -ForegroundColor Green

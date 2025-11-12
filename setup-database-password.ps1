# Quick Setup - Oracle Database Password Configuration
# Run this script to configure your database password

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MegiLance Oracle Database - Password Setup              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$ADB_OCID = "ocid1.autonomousdatabase.oc1.eu-frankfurt-1.antheljsse5nuxyanko5wvhvquyzeqmymjipj6eoiedjocmd6qjozflqeyia"

Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "  1. Set a new database password" -ForegroundColor White
Write-Host "  2. I already have the password (skip to configuration)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host "`nEnter a new ADMIN password for the database:" -ForegroundColor Yellow
    Write-Host "Requirements: 12-30 chars, uppercase, lowercase, number, special char" -ForegroundColor Gray
    $password = Read-Host "Password" -AsSecureString
    $passwordConfirm = Read-Host "Confirm Password" -AsSecureString
    
    # Convert to plain text for comparison
    $pwd1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    $pwd2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordConfirm))
    
    if ($pwd1 -eq $pwd2) {
        Write-Host "`nUpdating database password..." -ForegroundColor Yellow
        
        oci db autonomous-database update `
            --autonomous-database-id $ADB_OCID `
            --admin-password $pwd1 `
            --wait-for-state AVAILABLE
        
        Write-Host "✅ Password updated successfully!" -ForegroundColor Green
        
        # Update backend/.env
        $envPath = "backend\.env"
        $envContent = Get-Content $envPath -Raw
        $walletLocation = (Get-Location).Path + "\oracle-wallet"
        $newDbUrl = "DATABASE_URL=oracle+oracledb://ADMIN:$pwd1@megilancedb_high?wallet_location=$walletLocation&wallet_password=MegiLance2025!Wallet"
        
        $envContent = $envContent -replace 'DATABASE_URL=.*', $newDbUrl
        $envContent | Out-File -FilePath $envPath -Encoding UTF8 -Force
        
        Write-Host "✅ backend\.env updated with new password!" -ForegroundColor Green
    } else {
        Write-Host "❌ Passwords don't match!" -ForegroundColor Red
        exit 1
    }
} elseif ($choice -eq "2") {
    Write-Host "`nEnter your existing ADMIN password:" -ForegroundColor Yellow
    $password = Read-Host "Password" -AsSecureString
    $pwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    # Update backend/.env
    $envPath = "backend\.env"
    $envContent = Get-Content $envPath -Raw
    $walletLocation = (Get-Location).Path + "\oracle-wallet"
    $newDbUrl = "DATABASE_URL=oracle+oracledb://ADMIN:$pwd@megilancedb_high?wallet_location=$walletLocation&wallet_password=MegiLance2025!Wallet"
    
    $envContent = $envContent -replace 'DATABASE_URL=.*', $newDbUrl
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -Force
    
    Write-Host "✅ backend\.env updated!" -ForegroundColor Green
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Test connection: python test-oracle-connection.py" -ForegroundColor White
Write-Host "  2. Initialize database: cd backend && alembic upgrade head" -ForegroundColor White
Write-Host "  3. Start backend: cd backend && uvicorn main:app --reload" -ForegroundColor White
Write-Host ""

# Update Oracle Database Password in Digital Ocean

Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║  Oracle Autonomous Database - Password Configuration            ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n📋 Your Oracle Database Connection:" -ForegroundColor Yellow
Write-Host "   Database: megilanceai" -ForegroundColor White
Write-Host "   Service:  megilanceai_high" -ForegroundColor White
Write-Host "   Location: EU Frankfurt" -ForegroundColor White

Write-Host "`n🔐 Enter your Oracle ADMIN password:" -ForegroundColor Yellow
$password = Read-Host -AsSecureString

# Convert secure string to plain text for the connection string
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Update backend-spec.yaml with the actual password
$specContent = Get-Content "backend-spec.yaml" -Raw
$specContent = $specContent -replace 'CHANGE_ME_ORACLE_PASSWORD', $plainPassword
$specContent | Set-Content "backend-spec.yaml"

Write-Host "`n✅ Updated backend-spec.yaml with your Oracle password" -ForegroundColor Green

# Apply the updated spec to Digital Ocean
Write-Host "`n🚀 Applying updated configuration to Digital Ocean..." -ForegroundColor Cyan
doctl apps update ce7acc8e-3398-42d0-95bb-8e44a7c8ad48 --spec backend-spec.yaml

Write-Host "`n✅ Configuration applied! Digital Ocean will now deploy with Oracle DB." -ForegroundColor Green
Write-Host "`n📊 Monitoring deployment..." -ForegroundColor Yellow

# Wait a few seconds for deployment to start
Start-Sleep 5

# Check deployment status
doctl apps list-deployments ce7acc8e-3398-42d0-95bb-8e44a7c8ad48 --format ID,Progress,Phase

Write-Host "`n💡 Tip: The backend will now:" -ForegroundColor Cyan
Write-Host "   ✓ Connect to Oracle Autonomous Database" -ForegroundColor Green
Write-Host "   ✓ Use wallet for secure authentication" -ForegroundColor Green
Write-Host "   ✓ Auto-create database tables on first run" -ForegroundColor Green
Write-Host "   ✓ Use 180s health check initial delay" -ForegroundColor Green

Write-Host "`n⚠️  IMPORTANT: The password in backend-spec.yaml is now in plain text!" -ForegroundColor Red
Write-Host "   Don't commit this file to git!" -ForegroundColor Red
Write-Host "   It's already in your .gitignore" -ForegroundColor Yellow

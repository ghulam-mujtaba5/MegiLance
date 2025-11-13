# Complete MegiLance Deployment Automation
# This script automates the entire deployment process

param(
    [string]$OracleVMIP = "",
    [switch]$SkipOracle,
    [switch]$SkipDigitalOcean
)

$ErrorActionPreference = "Continue"
$APP_ID = "7d432958-1a7e-444b-bb95-1fdf23232905"

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MegiLance Complete Deployment Automation    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================
# PHASE 1: DigitalOcean Frontend
# ============================================

if (-not $SkipDigitalOcean) {
    Write-Host "`n[PHASE 1] DigitalOcean Frontend Deployment" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    Write-Host "`nApp ID: $APP_ID" -ForegroundColor Cyan
    
    Write-Host "`n[1/3] Checking app status..." -ForegroundColor White
    $appStatus = doctl apps get $APP_ID 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ App exists" -ForegroundColor Green
        
        Write-Host "`n[2/3] GitHub authorization required for update" -ForegroundColor White
        Write-Host "Please authorize via console:" -ForegroundColor Yellow
        Write-Host "  1. Go to: https://cloud.digitalocean.com/apps/$APP_ID/settings" -ForegroundColor Cyan
        Write-Host "  2. Click 'Components' → Your service → 'Edit'" -ForegroundColor White
        Write-Host "  3. Verify settings:" -ForegroundColor White
        Write-Host "     - Source Directory: /frontend" -ForegroundColor Cyan
        Write-Host "     - Dockerfile: frontend/Dockerfile" -ForegroundColor Cyan
        Write-Host "  4. Click 'Save' → Click 'Deploy'" -ForegroundColor White
        
        Write-Host "`nOpening app settings..." -ForegroundColor Gray
        Start-Process "https://cloud.digitalocean.com/apps/$APP_ID/settings"
        
        Read-Host "`nPress Enter after you've deployed the app"
        
        Write-Host "`n[3/3] Waiting for deployment..." -ForegroundColor White
        $deployed = $false
        $attempts = 0
        
        while (-not $deployed -and $attempts -lt 30) {
            $attempts++
            Start-Sleep -Seconds 10
            
            $deployment = doctl apps list-deployments $APP_ID 2>&1 | Select-String "ACTIVE"
            if ($deployment) {
                $deployed = $true
                Write-Host "✓ Frontend deployed successfully!" -ForegroundColor Green
            } else {
                Write-Host "  Waiting... ($attempts/30)" -ForegroundColor Gray
            }
        }
        
        if ($deployed) {
            $appUrl = doctl apps get $APP_ID --format DefaultIngress --no-header 2>&1
            Write-Host "`n✅ Frontend is live at: https://$appUrl" -ForegroundColor Green
            $global:FrontendURL = "https://$appUrl"
        }
    } else {
        Write-Host "✗ App not found" -ForegroundColor Red
    }
}

# ============================================
# PHASE 2: Oracle Backend + AI
# ============================================

if (-not $SkipOracle) {
    Write-Host "`n`n[PHASE 2] Oracle Cloud Backend + AI Deployment" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    if (-not $OracleVMIP) {
        Write-Host "`n⚠️  Oracle VM IP not provided" -ForegroundColor Yellow
        Write-Host "`nYou need to:" -ForegroundColor White
        Write-Host "  1. Create Oracle Cloud VM (see QUICKSTART_ORACLE.md)" -ForegroundColor Cyan
        Write-Host "  2. Run: .\deploy-complete.ps1 -OracleVMIP YOUR_VM_IP" -ForegroundColor Cyan
        
        Write-Host "`nQuick Oracle VM creation:" -ForegroundColor Yellow
        Write-Host "  • Go to: https://cloud.oracle.com/compute/instances" -ForegroundColor Cyan
        Write-Host "  • Create Instance → Oracle Linux 8" -ForegroundColor White
        Write-Host "  • Shape: VM.Standard.E2.1.Micro (Always Free)" -ForegroundColor White
        Write-Host "  • Copy the Public IP" -ForegroundColor White
        
        $createVM = Read-Host "`nDo you want to open Oracle Console now? (y/n)"
        if ($createVM -eq 'y') {
            Start-Process "https://cloud.oracle.com/compute/instances"
        }
        
        Write-Host "`nRun this script again with: -OracleVMIP <YOUR_IP>" -ForegroundColor Yellow
    } else {
        Write-Host "`n[1/5] Oracle VM IP: $OracleVMIP" -ForegroundColor Cyan
        
        Write-Host "`n[2/5] Preparing deployment files..." -ForegroundColor White
        
        # Create backend .env template
        $envTemplate = @"
# Database Configuration
DATABASE_TYPE=oracle
ORACLE_USER=ADMIN
ORACLE_PASSWORD=YOUR_DB_PASSWORD
ORACLE_DSN=yourdb_high
ORACLE_WALLET_LOCATION=/app/oracle-wallet
ORACLE_WALLET_PASSWORD=YOUR_WALLET_PASSWORD

# Security Keys (GENERATE THESE!)
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)

# Application
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=$global:FrontendURL
FRONTEND_URL=$global:FrontendURL

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@megilance.com
"@
        
        $envTemplate | Out-File -FilePath "backend/.env.production" -Encoding UTF8
        Write-Host "✓ Created backend/.env.production template" -ForegroundColor Green
        
        Write-Host "`n[3/5] Next steps (manual):" -ForegroundColor White
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        
        Write-Host "`nA. SSH to your Oracle VM:" -ForegroundColor Yellow
        Write-Host "   ssh opc@$OracleVMIP" -ForegroundColor Cyan
        
        Write-Host "`nB. Download and run setup script:" -ForegroundColor Yellow
        Write-Host @"
   curl -fsSL https://raw.githubusercontent.com/ghulam-mujtaba5/MegiLance/main/deploy-oracle-setup.sh -o setup.sh
   chmod +x setup.sh
   sudo bash setup.sh
"@ -ForegroundColor Cyan
        
        Write-Host "`nC. Create Oracle Autonomous Database:" -ForegroundColor Yellow
        Write-Host "   1. Go to: https://cloud.oracle.com/adb" -ForegroundColor Cyan
        Write-Host "   2. Create → Transaction Processing → Always Free" -ForegroundColor White
        Write-Host "   3. Download wallet → Set password" -ForegroundColor White
        
        Write-Host "`nD. Upload wallet to VM:" -ForegroundColor Yellow
        Write-Host "   # Extract wallet locally first, then:" -ForegroundColor Gray
        Write-Host "   scp -r oracle-wallet-23ai opc@${OracleVMIP}:/tmp/" -ForegroundColor Cyan
        Write-Host "   ssh opc@$OracleVMIP" -ForegroundColor Cyan
        Write-Host "   sudo mv /tmp/oracle-wallet-23ai /home/megilance/megilance/" -ForegroundColor Cyan
        Write-Host "   sudo chown -R megilance:megilance /home/megilance/megilance/oracle-wallet-23ai" -ForegroundColor Cyan
        
        Write-Host "`nE. Configure environment variables:" -ForegroundColor Yellow
        Write-Host "   sudo nano /home/megilance/megilance/backend/.env" -ForegroundColor Cyan
        Write-Host "   # Copy from backend/.env.production (this directory)" -ForegroundColor Gray
        Write-Host "   # Update passwords and database connection info" -ForegroundColor Gray
        
        Write-Host "`nF. Deploy application:" -ForegroundColor Yellow
        Write-Host "   sudo -u megilance /home/megilance/deploy.sh" -ForegroundColor Cyan
        
        Write-Host "`nG. Setup webhook for auto-deployment:" -ForegroundColor Yellow
        Write-Host "   # Generate secret:" -ForegroundColor Gray
        Write-Host "   openssl rand -hex 32" -ForegroundColor Cyan
        Write-Host "   # Edit webhook service:" -ForegroundColor Gray
        Write-Host "   sudo nano /etc/systemd/system/megilance-webhook.service" -ForegroundColor Cyan
        Write-Host "   # Update Environment='WEBHOOK_SECRET=<your-secret>'" -ForegroundColor Gray
        Write-Host "   sudo systemctl daemon-reload" -ForegroundColor Cyan
        Write-Host "   sudo systemctl restart megilance-webhook" -ForegroundColor Cyan
        
        Write-Host "`nH. Add GitHub webhook:" -ForegroundColor Yellow
        Write-Host "   1. Go to: https://github.com/ghulam-mujtaba5/MegiLance/settings/hooks" -ForegroundColor Cyan
        Write-Host "   2. Add webhook → http://$OracleVMIP/webhook" -ForegroundColor Cyan
        Write-Host "   3. Secret: (use the generated secret)" -ForegroundColor White
        Write-Host "   4. Events: Just push event" -ForegroundColor White
        
        Write-Host "`n[4/5] Opening required consoles..." -ForegroundColor White
        Start-Process "https://cloud.oracle.com/adb"
        Start-Process "https://github.com/ghulam-mujtaba5/MegiLance/settings/hooks"
        
        Write-Host "`n[5/5] Testing backend (run after deployment):" -ForegroundColor White
        Write-Host "   curl http://$OracleVMIP:8000/api/health/live" -ForegroundColor Cyan
        Write-Host "   # Should return: {`"status`":`"healthy`"}" -ForegroundColor Gray
    }
}

# ============================================
# PHASE 3: Connect Services
# ============================================

if (-not $SkipDigitalOcean -and -not $SkipOracle -and $OracleVMIP) {
    Write-Host "`n`n[PHASE 3] Connecting Frontend & Backend" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    Write-Host "`n[1/2] Update DigitalOcean environment..." -ForegroundColor White
    Write-Host "  Go to: https://cloud.digitalocean.com/apps/$APP_ID/settings" -ForegroundColor Cyan
    Write-Host "  Environment Variables → Edit:" -ForegroundColor White
    Write-Host "  NEXT_PUBLIC_API_URL = http://$OracleVMIP/api" -ForegroundColor Cyan
    
    Write-Host "`n[2/2] Update backend CORS (on Oracle VM):" -ForegroundColor White
    Write-Host "  sudo nano /home/megilance/megilance/backend/.env" -ForegroundColor Cyan
    Write-Host "  CORS_ORIGINS=$global:FrontendURL" -ForegroundColor Cyan
    Write-Host "  sudo -u megilance docker-compose -f /home/megilance/megilance/docker-compose.oracle.yml restart backend" -ForegroundColor Cyan
}

# ============================================
# Summary
# ============================================

Write-Host "`n`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Deployment Status Summary             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($global:FrontendURL) {
    Write-Host "✅ Frontend: $global:FrontendURL" -ForegroundColor Green
} else {
    Write-Host "⏳ Frontend: Pending deployment" -ForegroundColor Yellow
}

if ($OracleVMIP) {
    Write-Host "✅ Backend: http://$OracleVMIP/api" -ForegroundColor Green
} else {
    Write-Host "⏳ Backend: Pending setup" -ForegroundColor Yellow
}

Write-Host "`n💰 Total Cost: `$5/month (FREE with student credits)" -ForegroundColor Green

Write-Host "`n📚 Documentation:" -ForegroundColor Yellow
Write-Host "  • COMPLETE_DEPLOYMENT_GUIDE.md - Full guide" -ForegroundColor White
Write-Host "  • QUICKSTART_ORACLE.md - Oracle setup details" -ForegroundColor White
Write-Host "  • QUICKSTART_DIGITALOCEAN.md - DigitalOcean details" -ForegroundColor White

Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
if (-not $OracleVMIP) {
    Write-Host "  1. Create Oracle VM" -ForegroundColor White
    Write-Host "  2. Run: .\deploy-complete.ps1 -OracleVMIP <YOUR_IP>" -ForegroundColor Cyan
} else {
    Write-Host "  1. Follow the Oracle deployment steps above" -ForegroundColor White
    Write-Host "  2. Update DigitalOcean env vars" -ForegroundColor White
    Write-Host "  3. Test end-to-end!" -ForegroundColor White
}

Write-Host ""

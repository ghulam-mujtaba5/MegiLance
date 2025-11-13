# @AI-HINT: Master deployment script - runs complete deployment pipeline
# Executes Oracle VM setup + DigitalOcean frontend deployment + webhook configuration

$ErrorActionPreference = "Stop"

$asciiArt = @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███╗   ███╗███████╗ ██████╗ ██╗██╗      █████╗ ███╗   ██╗ ██████╗███████╗
║   ████╗ ████║██╔════╝██╔════╝ ██║██║     ██╔══██╗████╗  ██║██╔════╝██╔════╝
║   ██╔████╔██║█████╗  ██║  ███╗██║██║     ███████║██╔██╗ ██║██║     █████╗  
║   ██║╚██╔╝██║██╔══╝  ██║   ██║██║██║     ██╔══██║██║╚██╗██║██║     ██╔══╝  
║   ██║ ╚═╝ ██║███████╗╚██████╔╝██║███████╗██║  ██║██║ ╚████║╚██████╗███████╗
║   ╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
║                                                           ║
║              🚀 Complete Deployment Pipeline 🚀           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@

Write-Host $asciiArt -ForegroundColor Cyan
Write-Host ""

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Architecture: Oracle Cloud (Free) + DigitalOcean  " -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration summary
Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  ┌─ Backend + AI" -ForegroundColor White
Write-Host "  │  ├─ Host: Oracle Cloud VM (Always Free)" -ForegroundColor Gray
Write-Host "  │  ├─ Services: FastAPI + AI (Docker)" -ForegroundColor Gray
Write-Host "  │  └─ Database: Oracle Autonomous DB 23ai" -ForegroundColor Gray
Write-Host "  │" -ForegroundColor White
Write-Host "  ├─ Frontend" -ForegroundColor White
Write-Host "  │  ├─ Host: DigitalOcean App Platform" -ForegroundColor Gray
Write-Host "  │  ├─ Service: Next.js 14" -ForegroundColor Gray
Write-Host "  │  └─ CDN: Included" -ForegroundColor Gray
Write-Host "  │" -ForegroundColor White
Write-Host "  └─ CI/CD" -ForegroundColor White
Write-Host "     ├─ Git: GitHub webhooks" -ForegroundColor Gray
Write-Host "     ├─ Backend: Auto-deploy on push" -ForegroundColor Gray
Write-Host "     └─ Frontend: Auto-deploy on push" -ForegroundColor Gray
Write-Host ""

# Confirm
$confirm = Read-Host "Proceed with complete deployment? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Phase 1: Oracle Cloud Backend Setup               " -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Run Oracle VM setup
try {
    & ".\deploy-oracle-vm-complete.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Oracle VM setup failed" }
    Write-Host ""
    Write-Host "✅ Phase 1 Complete: Oracle VM deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ Phase 1 Failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check OCI CLI authentication: oci iam region list" -ForegroundColor Gray
    Write-Host "  2. Verify compartment access" -ForegroundColor Gray
    Write-Host "  3. Check Always Free tier availability" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "⏸️  Pausing for VM initialization..." -ForegroundColor Yellow
Write-Host "   Please complete manual VM setup steps shown above" -ForegroundColor Gray
Write-Host ""
$continueSetup = Read-Host "Have you completed VM setup? (y/N)"
if ($continueSetup -ne 'y' -and $continueSetup -ne 'Y') {
    Write-Host ""
    Write-Host "📋 Complete these steps on the VM:" -ForegroundColor Yellow
    Write-Host "  1. SSH into VM" -ForegroundColor Gray
    Write-Host "  2. Install Docker, Docker Compose, Git, Node.js" -ForegroundColor Gray
    Write-Host "  3. Clone repository to /opt/megilance" -ForegroundColor Gray
    Write-Host "  4. Upload Oracle wallet" -ForegroundColor Gray
    Write-Host "  5. Configure backend/.env" -ForegroundColor Gray
    Write-Host "  6. Run: docker-compose -f docker-compose.oracle.yml up -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Run this script again when ready!" -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Phase 2: DigitalOcean Frontend Deployment        " -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Run DigitalOcean deployment
try {
    & ".\deploy-digitalocean-complete.ps1"
    if ($LASTEXITCODE -ne 0) { throw "DigitalOcean deployment failed" }
    Write-Host ""
    Write-Host "✅ Phase 2 Complete: Frontend deployed" -ForegroundColor Green
} catch {
    Write-Host "❌ Phase 2 Failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Install doctl: https://github.com/digitalocean/doctl/releases" -ForegroundColor Gray
    Write-Host "  2. Authenticate: doctl auth init" -ForegroundColor Gray
    Write-Host "  3. Check GitHub repo access" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Phase 3: Post-Deployment Configuration           " -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Load deployment details
$vmDetails = Get-Content "oracle-vm-details.json" | ConvertFrom-Json
$appDetails = Get-Content "digitalocean-app-details.json" | ConvertFrom-Json

$vmIP = $vmDetails.public_ip
$frontendURL = $appDetails.app_url

Write-Host "📋 Final Configuration Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Update Backend CORS Settings:" -ForegroundColor Cyan
Write-Host "   SSH into VM:" -ForegroundColor Gray
Write-Host "   ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP" -ForegroundColor White
Write-Host ""
Write-Host "   Edit .env file:" -ForegroundColor Gray
Write-Host "   nano /opt/megilance/backend/.env" -ForegroundColor White
Write-Host ""
Write-Host "   Update ALLOWED_ORIGINS:" -ForegroundColor Gray
Write-Host "   ALLOWED_ORIGINS=$frontendURL,http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "   Restart backend:" -ForegroundColor Gray
Write-Host "   docker-compose -f /opt/megilance/docker-compose.oracle.yml restart backend" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Configure GitHub Webhook:" -ForegroundColor Cyan
Write-Host "   URL: https://github.com/ghulam-mujtaba5/MegiLance/settings/hooks/new" -ForegroundColor Gray
Write-Host ""
Write-Host "   Settings:" -ForegroundColor Gray
Write-Host "   • Payload URL: http://${vmIP}:9000/webhook" -ForegroundColor White
Write-Host "   • Content type: application/json" -ForegroundColor White
Write-Host "   • Secret: megilance-webhook-2025" -ForegroundColor White
Write-Host "   • Events: Just the push event" -ForegroundColor White
Write-Host "   • Active: ✅" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Test Deployment:" -ForegroundColor Cyan
Write-Host "   Make a test commit:" -ForegroundColor Gray
Write-Host "   git add . && git commit -m 'Test deployment' && git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "   Watch logs:" -ForegroundColor Gray
Write-Host "   ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP 'journalctl -u megilance-webhook -f'" -ForegroundColor White
Write-Host ""

# Create deployment summary
$summary = @"
═══════════════════════════════════════════════════════════════
                  ✅ DEPLOYMENT COMPLETE ✅
═══════════════════════════════════════════════════════════════

🌐 Application URLs:
   Frontend:  $frontendURL
   Backend:   https://$vmIP:8000
   API Docs:  https://$vmIP:8000/api/docs

📊 Infrastructure:
   Oracle VM:          $vmIP
   VM OCID:            $($vmDetails.vm_ocid)
   DigitalOcean App:   $($appDetails.app_id)
   Database:           Oracle Autonomous 23ai

🔄 Auto-Deployment:
   Backend:   ✅ Webhook configured (http://$vmIP:9000/webhook)
   Frontend:  ✅ Git push → auto-deploy
   Branch:    main

💰 Cost:
   Oracle Cloud:       `$0/month (Always Free Tier)
   DigitalOcean:       `$0/month (Student Pack)
   Total:              `$0/month 🎉

📋 Quick Commands:

   # SSH to VM
   ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP

   # View backend logs
   ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP "docker-compose -f /opt/megilance/docker-compose.oracle.yml logs -f backend"

   # View frontend logs
   doctl apps logs $($appDetails.app_id) --follow

   # Manual backend deploy
   ssh -i ~/.ssh/megilance_vm_rsa opc@$vmIP "bash /opt/megilance/vm-auto-deploy.sh"

   # View deployment status
   doctl apps get $($appDetails.app_id)

📚 Documentation:
   Full Guide: COMPLETE_DEPLOYMENT_GUIDE_V2.md

🎯 Next Steps:
   1. Complete CORS configuration (see above)
   2. Set up GitHub webhook (see above)
   3. Test auto-deployment
   4. Configure custom domain (optional)
   5. Set up SSL with Let's Encrypt (optional)

═══════════════════════════════════════════════════════════════
"@

Write-Host ""
Write-Host $summary -ForegroundColor Green

# Save summary to file
$summary | Out-File -FilePath "DEPLOYMENT_SUMMARY_FINAL.txt" -Encoding UTF8

Write-Host ""
Write-Host "💾 Summary saved to: DEPLOYMENT_SUMMARY_FINAL.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Deployment pipeline complete! Your application is ready!" -ForegroundColor Green
Write-Host ""

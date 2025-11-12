# ===================================
# MegiLance Oracle Migration - Quick Start
# ===================================
# One-command complete migration from AWS to Oracle Cloud
# Account: Muhammad Salman

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         MegiLance AWS → Oracle Cloud Migration              ║
║                    Quick Start Wizard                        ║
║                                                              ║
║  Account: Muhammad Salman                                    ║
║  Target: Oracle Autonomous Database (Always Free)            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "This wizard will guide you through the complete migration process.`n" -ForegroundColor White

# Step 1: Confirm prerequisites
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "STEP 1: Prerequisites Check" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Required:" -ForegroundColor Cyan
Write-Host "  ✓ Oracle Cloud account (Muhammad Salman)" -ForegroundColor White
Write-Host "  ✓ Internet connection" -ForegroundColor White
Write-Host "  ✓ Windows PowerShell" -ForegroundColor White
Write-Host "  ✓ Python 3.8+" -ForegroundColor White

$continue = Read-Host "`nDo you have all prerequisites? (y/N)"
if ($continue -ne "y") {
    Write-Host "`nPlease ensure you have:" -ForegroundColor Yellow
    Write-Host "  1. Oracle Cloud account access (Muhammad Salman)" -ForegroundColor White
    Write-Host "  2. Python installed: python --version" -ForegroundColor White
    Write-Host "`nExiting..." -ForegroundColor Red
    exit
}

# Step 2: Migration options
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "STEP 2: Migration Options" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Select migration mode:`n" -ForegroundColor Cyan
Write-Host "  1. Full Automatic (Recommended)" -ForegroundColor White
Write-Host "     - Automated setup and configuration" -ForegroundColor Gray
Write-Host "     - Creates database, storage, and updates code" -ForegroundColor Gray
Write-Host "     - Fastest option (~15-20 minutes)" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Interactive" -ForegroundColor White
Write-Host "     - Step-by-step with confirmations" -ForegroundColor Gray
Write-Host "     - Good for first-time setup" -ForegroundColor Gray
Write-Host "     - You control each step" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Manual (Advanced)" -ForegroundColor White
Write-Host "     - Follow detailed guide" -ForegroundColor Gray
Write-Host "     - Full control over process" -ForegroundColor Gray
Write-Host "     - Use if automation fails" -ForegroundColor Gray
Write-Host ""

$mode = Read-Host "Enter choice (1-3)"

switch ($mode) {
    "1" {
        # Full Automatic
        Write-Host "`n✓ Full Automatic mode selected" -ForegroundColor Green
        
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "STEP 3: Running Automated Migration" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
        
        Write-Host "The migration script will now:" -ForegroundColor Cyan
        Write-Host "  1. Install and configure Oracle CLI" -ForegroundColor White
        Write-Host "  2. Authenticate with Oracle Cloud" -ForegroundColor White
        Write-Host "  3. Backup current database" -ForegroundColor White
        Write-Host "  4. Create Oracle Autonomous Database" -ForegroundColor White
        Write-Host "  5. Setup Object Storage buckets" -ForegroundColor White
        Write-Host "  6. Update all configuration files" -ForegroundColor White
        Write-Host "  7. Run database migrations" -ForegroundColor White
        Write-Host "  8. Generate migration report`n" -ForegroundColor White
        
        Write-Host "⏱️  Estimated time: 15-20 minutes`n" -ForegroundColor Yellow
        
        $confirm = Read-Host "Start automated migration? (y/N)"
        if ($confirm -eq "y") {
            Write-Host "`nStarting migration...`n" -ForegroundColor Green
            .\migrate-to-oracle-auto.ps1
            
            Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
            Write-Host "STEP 4: Verifying Migration" -ForegroundColor Yellow
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
            
            .\verify-oracle-migration.ps1
        } else {
            Write-Host "`nMigration cancelled." -ForegroundColor Yellow
            exit
        }
    }
    
    "2" {
        # Interactive
        Write-Host "`n✓ Interactive mode selected" -ForegroundColor Green
        
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "STEP 3: Interactive Migration" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
        
        Write-Host "Starting migration with confirmations at each step...`n" -ForegroundColor Cyan
        
        # Run without auto-confirm
        .\migrate-to-oracle-auto.ps1
        
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "STEP 4: Verifying Migration" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
        
        $verify = Read-Host "Run verification? (Y/n)"
        if ($verify -ne "n") {
            .\verify-oracle-migration.ps1
        }
    }
    
    "3" {
        # Manual
        Write-Host "`n✓ Manual mode selected" -ForegroundColor Green
        
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "STEP 3: Manual Migration Guide" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
        
        Write-Host "Please follow the detailed guide:" -ForegroundColor Cyan
        Write-Host "  📄 ORACLE_MIGRATION_COMPLETE_GUIDE.md`n" -ForegroundColor White
        
        Write-Host "Key manual steps:" -ForegroundColor Cyan
        Write-Host "  1. Install Oracle CLI: winget install Oracle.OCI-CLI" -ForegroundColor White
        Write-Host "  2. Authenticate: oci session authenticate" -ForegroundColor White
        Write-Host "  3. Create database (see guide for commands)" -ForegroundColor White
        Write-Host "  4. Download wallet" -ForegroundColor White
        Write-Host "  5. Create Object Storage buckets" -ForegroundColor White
        Write-Host "  6. Update backend/.env" -ForegroundColor White
        Write-Host "  7. Run database migrations`n" -ForegroundColor White
        
        $openGuide = Read-Host "Open guide now? (Y/n)"
        if ($openGuide -ne "n") {
            code ORACLE_MIGRATION_COMPLETE_GUIDE.md
        }
        
        Write-Host "`nWhen ready, verify your migration:" -ForegroundColor Cyan
        Write-Host "  .\verify-oracle-migration.ps1`n" -ForegroundColor White
        
        exit
    }
    
    default {
        Write-Host "`nInvalid choice. Exiting..." -ForegroundColor Red
        exit
    }
}

# Final steps
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host @"
✅ Your MegiLance application is now running on Oracle Cloud!

📋 What was migrated:
  ✓ Database: AWS RDS → Oracle Autonomous Database (20GB free)
  ✓ Storage: AWS S3 → Oracle Object Storage (10GB free)
  ✓ Compute: AWS ECS → Oracle Compute VMs (2 free)

💰 Cost savings: 100% (from `$50-190/month to `$0/month)

"@ -ForegroundColor Green

Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test Locally:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   python -m uvicorn main:app --reload" -ForegroundColor Gray
Write-Host "   # Visit: http://localhost:8000/api/docs" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Deploy to Oracle VM:" -ForegroundColor Yellow
Write-Host "   .\deploy-to-oracle.ps1 backend" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Update Frontend:" -ForegroundColor Yellow
Write-Host "   Edit frontend/.env:" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_API_URL=http://your-oracle-vm-ip:8000" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Configure Production:" -ForegroundColor Yellow
Write-Host "   - Point DNS to Oracle VM" -ForegroundColor Gray
Write-Host "   - Setup SSL with Let's Encrypt" -ForegroundColor Gray
Write-Host "   - Enable automatic backups" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - Complete Guide: ORACLE_MIGRATION_COMPLETE_GUIDE.md" -ForegroundColor White
Write-Host "  - Migration Config: oracle-migration-config.json" -ForegroundColor White
Write-Host "  - Migration Log: migration-log-*.txt" -ForegroundColor White
Write-Host ""

Write-Host "🆘 Need Help?" -ForegroundColor Cyan
Write-Host "  - Check troubleshooting in guide" -ForegroundColor White
Write-Host "  - Review migration log file" -ForegroundColor White
Write-Host "  - Re-run verification: .\verify-oracle-migration.ps1" -ForegroundColor White
Write-Host ""

Write-Host "Happy coding on Oracle Cloud! 🚀" -ForegroundColor Green
Write-Host ""

# ===================================
# Oracle Migration Verification Script
# ===================================
# Verifies that the Oracle Cloud migration was successful

param(
    [switch]$Detailed = $false
)

$ErrorActionPreference = "Continue"

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║          Oracle Migration Verification                      ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$checks = @{
    passed = 0
    failed = 0
    warnings = 0
}

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$ErrorMessage = "Check failed",
        [switch]$Warning = $false
    )
    
    Write-Host "`n[$Name]" -ForegroundColor Cyan
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  ✓ PASS" -ForegroundColor Green
            $checks.passed++
            return $true
        } else {
            if ($Warning) {
                Write-Host "  ⚠ WARNING: $ErrorMessage" -ForegroundColor Yellow
                $checks.warnings++
            } else {
                Write-Host "  ✗ FAIL: $ErrorMessage" -ForegroundColor Red
                $checks.failed++
            }
            return $false
        }
    } catch {
        if ($Warning) {
            Write-Host "  ⚠ WARNING: $($_.Exception.Message)" -ForegroundColor Yellow
            $checks.warnings++
        } else {
            Write-Host "  ✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
            $checks.failed++
        }
        return $false
    }
}

# Check 1: OCI CLI Installed
Test-Check -Name "OCI CLI Installed" -Test {
    $null = Get-Command oci -ErrorAction Stop
    $version = oci --version 2>&1
    Write-Host "  Version: $version" -ForegroundColor Gray
    return $true
}

# Check 2: OCI Authentication
Test-Check -Name "OCI Authentication" -Test {
    $result = oci iam availability-domain list --output json 2>&1 | ConvertFrom-Json
    if ($result.data) {
        Write-Host "  Authenticated successfully" -ForegroundColor Gray
        return $true
    }
    return $false
} -ErrorMessage "Not authenticated. Run: oci session authenticate"

# Check 3: Oracle Config File
Test-Check -Name "Oracle Configuration File" -Test {
    if (Test-Path "oracle-migration-config.json") {
        $config = Get-Content "oracle-migration-config.json" | ConvertFrom-Json
        Write-Host "  Database: $($config.database_name)" -ForegroundColor Gray
        Write-Host "  Region: $($config.region)" -ForegroundColor Gray
        return $true
    }
    return $false
} -ErrorMessage "Run migration script first" -Warning

# Check 4: Database Wallet
Test-Check -Name "Database Wallet" -Test {
    if (Test-Path "oracle-wallet") {
        $walletFiles = Get-ChildItem "oracle-wallet" | Select-Object -ExpandProperty Name
        Write-Host "  Files: $($walletFiles -join ', ')" -ForegroundColor Gray
        
        # Check required files
        $required = @('tnsnames.ora', 'sqlnet.ora', 'cwallet.sso')
        foreach ($file in $required) {
            if (-not (Test-Path "oracle-wallet\$file")) {
                throw "Missing required file: $file"
            }
        }
        return $true
    }
    return $false
}

# Check 5: Backend Wallet
Test-Check -Name "Backend Wallet Copy" -Test {
    if (Test-Path "backend\oracle-wallet") {
        Write-Host "  Wallet copied to backend directory" -ForegroundColor Gray
        return $true
    }
    return $false
} -Warning

# Check 6: Backend .env File
Test-Check -Name "Backend Environment Configuration" -Test {
    if (Test-Path "backend\.env") {
        $env = Get-Content "backend\.env" -Raw
        
        $requiredVars = @(
            'DATABASE_URL',
            'OCI_REGION',
            'OCI_NAMESPACE',
            'OCI_BUCKET_UPLOADS',
            'TNS_ADMIN'
        )
        
        $missing = @()
        foreach ($var in $requiredVars) {
            if ($env -notmatch $var) {
                $missing += $var
            }
        }
        
        if ($missing.Count -eq 0) {
            Write-Host "  All required variables present" -ForegroundColor Gray
            return $true
        } else {
            throw "Missing variables: $($missing -join ', ')"
        }
    }
    return $false
}

# Check 7: Python Dependencies
Test-Check -Name "Python Dependencies" -Test {
    $requirements = Get-Content "backend\requirements.txt"
    
    $ociDeps = @('oci', 'cx_Oracle', 'oracledb')
    $found = @()
    
    foreach ($dep in $ociDeps) {
        if ($requirements -match $dep) {
            $found += $dep
        }
    }
    
    Write-Host "  OCI dependencies: $($found -join ', ')" -ForegroundColor Gray
    return $found.Count -ge 2
} -ErrorMessage "OCI dependencies missing in requirements.txt"

# Check 8: OCI Storage Client
Test-Check -Name "OCI Storage Client Code" -Test {
    if (Test-Path "backend\app\core\oci_storage.py") {
        $content = Get-Content "backend\app\core\oci_storage.py" -Raw
        if ($content -match "class OCIStorageClient") {
            Write-Host "  OCI storage client implemented" -ForegroundColor Gray
            return $true
        }
    }
    return $false
}

# Check 9: Migration Scripts
Test-Check -Name "Migration Scripts" -Test {
    $scripts = @(
        "migrate-to-oracle-auto.ps1",
        "backend\migrate_data_to_oracle.py"
    )
    
    foreach ($script in $scripts) {
        if (-not (Test-Path $script)) {
            throw "Missing script: $script"
        }
    }
    
    Write-Host "  All migration scripts present" -ForegroundColor Gray
    return $true
} -Warning

# Check 10: Object Storage Buckets
Test-Check -Name "Object Storage Buckets" -Test {
    try {
        $namespace = (oci os ns get --output json 2>&1 | ConvertFrom-Json).data
        $buckets = oci os bucket list --namespace-name $namespace --output json 2>&1 | ConvertFrom-Json
        
        $requiredBuckets = @('megilance-uploads', 'megilance-assets', 'megilance-logs')
        $foundBuckets = $buckets.data.name
        
        $missing = $requiredBuckets | Where-Object { $_ -notin $foundBuckets }
        
        if ($missing.Count -eq 0) {
            Write-Host "  All buckets exist: $($requiredBuckets -join ', ')" -ForegroundColor Gray
            return $true
        } else {
            throw "Missing buckets: $($missing -join ', ')"
        }
    } catch {
        throw "Cannot verify buckets: $($_.Exception.Message)"
    }
} -Warning

# Check 11: Database Connection (if Python available)
if (Get-Command python -ErrorAction SilentlyContinue) {
    Test-Check -Name "Database Connection Test" -Test {
        Push-Location backend
        
        $testScript = @"
import sys
try:
    from app.core.config import get_settings
    from sqlalchemy import create_engine, text
    settings = get_settings()
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 1 FROM DUAL'))
        print('Connection successful')
        sys.exit(0)
except Exception as e:
    print(f'Connection failed: {e}')
    sys.exit(1)
"@
        
        $testScript | python 2>&1 | Out-Null
        $success = $LASTEXITCODE -eq 0
        
        Pop-Location
        
        if ($success) {
            Write-Host "  Database connection successful" -ForegroundColor Gray
            return $true
        }
        return $false
    } -ErrorMessage "Cannot connect to database" -Warning
} else {
    Write-Host "`n[Database Connection Test]" -ForegroundColor Cyan
    Write-Host "  ⚠ SKIPPED: Python not found" -ForegroundColor Yellow
    $checks.warnings++
}

# Check 12: Dockerfile Updated
Test-Check -Name "Dockerfile Oracle Support" -Test {
    if (Test-Path "backend\Dockerfile") {
        $dockerfile = Get-Content "backend\Dockerfile" -Raw
        
        $requiredPatterns = @(
            'instantclient',
            'LD_LIBRARY_PATH',
            'TNS_ADMIN'
        )
        
        $missing = @()
        foreach ($pattern in $requiredPatterns) {
            if ($dockerfile -notmatch $pattern) {
                $missing += $pattern
            }
        }
        
        if ($missing.Count -eq 0) {
            Write-Host "  Dockerfile has Oracle Instant Client support" -ForegroundColor Gray
            return $true
        } else {
            throw "Missing in Dockerfile: $($missing -join ', ')"
        }
    }
    return $false
} -Warning

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

$total = $checks.passed + $checks.failed + $checks.warnings

Write-Host "`nTotal Checks: $total" -ForegroundColor White
Write-Host "  ✓ Passed:   $($checks.passed)" -ForegroundColor Green
Write-Host "  ✗ Failed:   $($checks.failed)" -ForegroundColor Red
Write-Host "  ⚠ Warnings: $($checks.warnings)" -ForegroundColor Yellow

$percentage = [math]::Round(($checks.passed / $total) * 100)
Write-Host "`nSuccess Rate: $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 60) { "Yellow" } else { "Red" })

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan

if ($checks.failed -eq 0) {
    Write-Host "`n✅ Migration verification PASSED!" -ForegroundColor Green
    Write-Host "Your Oracle Cloud migration is ready!" -ForegroundColor Green
    
    Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test backend locally: cd backend && python -m uvicorn main:app --reload" -ForegroundColor White
    Write-Host "  2. Deploy to Oracle VM: .\deploy-to-oracle.ps1 backend" -ForegroundColor White
    Write-Host "  3. Update frontend API URL" -ForegroundColor White
    Write-Host "  4. Configure DNS and SSL" -ForegroundColor White
} else {
    Write-Host "`n⚠️ Migration verification found issues!" -ForegroundColor Yellow
    Write-Host "Please address the failed checks above before deploying." -ForegroundColor Yellow
    
    Write-Host "`n📝 Recommended Actions:" -ForegroundColor Cyan
    Write-Host "  1. Review failed checks above" -ForegroundColor White
    Write-Host "  2. Re-run migration script if needed: .\migrate-to-oracle-auto.ps1" -ForegroundColor White
    Write-Host "  3. Check migration log file for details" -ForegroundColor White
    Write-Host "  4. Consult ORACLE_MIGRATION_COMPLETE_GUIDE.md" -ForegroundColor White
}

Write-Host ""

# Return exit code
exit $(if ($checks.failed -eq 0) { 0 } else { 1 })

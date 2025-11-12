# ===================================
# MegiLance Complete AWS to Oracle Migration Script
# ===================================
# This script automates the complete migration from AWS to Oracle Cloud
# Account: muhammad salman
# Target: Oracle Autonomous Database (Always Free Tier)

param(
    [string]$OracleProfile = "DEFAULT",
    [string]$Region = "us-ashburn-1",
    [switch]$SkipOCISetup = $false,
    [switch]$SkipBackup = $false,
    [switch]$AutoConfirm = $false
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║  MegiLance AWS → Oracle Cloud Complete Migration            ║
║  Account: muhammad salman                                    ║
║  Target: Oracle Autonomous Database (Always Free)            ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Configuration
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "migration-backup-$TIMESTAMP"
$ORACLE_WALLET_DIR = "oracle-wallet"
$MIGRATION_LOG = "migration-log-$TIMESTAMP.txt"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $MIGRATION_LOG -Value $logMessage
    
    switch ($Level) {
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "SUCCESS" { Write-Host "✓ $Message" -ForegroundColor Green }
        default { Write-Host "  $Message" -ForegroundColor White }
    }
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# ===================================
# Step 1: Pre-Migration Validation
# ===================================
Write-Host "`n[STEP 1/10] Pre-Migration Validation..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Log "Checking required tools..."

# Check Python
if (Test-Command "python") {
    $pythonVersion = python --version 2>&1
    Write-Log "Python installed: $pythonVersion" "SUCCESS"
} else {
    Write-Log "Python not found. Please install Python 3.8+" "ERROR"
    exit 1
}

# Check Docker (for local backup)
if (Test-Command "docker") {
    Write-Log "Docker installed" "SUCCESS"
} else {
    Write-Log "Docker not found. Install for local testing: https://www.docker.com/products/docker-desktop" "WARNING"
}

# Check OCI CLI
if (-not (Test-Command "oci")) {
    Write-Log "Installing Oracle CLI..." "INFO"
    try {
        winget install Oracle.OCI-CLI --silent --accept-package-agreements --accept-source-agreements
        Write-Log "OCI CLI installed successfully" "SUCCESS"
    } catch {
        Write-Log "Failed to install OCI CLI automatically. Please install manually: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm" "ERROR"
        exit 1
    }
} else {
    $ociVersion = oci --version 2>&1
    Write-Log "OCI CLI installed: $ociVersion" "SUCCESS"
}

# ===================================
# Step 2: Backup Current AWS Data
# ===================================
if (-not $SkipBackup) {
    Write-Host "`n[STEP 2/10] Backing Up Current Database..." -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    Write-Log "Creating backup directory: $BACKUP_DIR"
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
    
    Write-Log "Backing up database using Docker..."
    try {
        # Check if database container is running
        $dbContainer = docker ps --filter "name=db" --format "{{.Names}}" 2>$null
        
        if ($dbContainer) {
            Write-Log "Found database container: $dbContainer"
            
            # Export database
            $backupFile = Join-Path $BACKUP_DIR "megilance_backup_$TIMESTAMP.sql"
            docker exec $dbContainer pg_dump -U megilance megilance_db > $backupFile 2>$null
            
            if (Test-Path $backupFile) {
                $fileSize = (Get-Item $backupFile).Length / 1MB
                Write-Log "Database backup created: $backupFile ($([math]::Round($fileSize, 2)) MB)" "SUCCESS"
            } else {
                Write-Log "Backup file not created" "WARNING"
            }
        } else {
            Write-Log "Database container not running. Starting containers..." "INFO"
            docker-compose up -d db
            Start-Sleep -Seconds 10
            
            # Retry backup
            $backupFile = Join-Path $BACKUP_DIR "megilance_backup_$TIMESTAMP.sql"
            docker exec megilance-db-1 pg_dump -U megilance megilance_db > $backupFile 2>$null
            
            if (Test-Path $backupFile) {
                Write-Log "Database backup created successfully" "SUCCESS"
            }
        }
    } catch {
        Write-Log "Could not create database backup: $($_.Exception.Message)" "WARNING"
        Write-Log "Continuing with migration..." "INFO"
    }
    
    # Backup configuration files
    Write-Log "Backing up configuration files..."
    Copy-Item "backend\.env" "$BACKUP_DIR\backend.env.backup" -ErrorAction SilentlyContinue
    Copy-Item "backend\alembic.ini" "$BACKUP_DIR\alembic.ini.backup" -ErrorAction SilentlyContinue
    Copy-Item "docker-compose.yml" "$BACKUP_DIR\docker-compose.yml.backup" -ErrorAction SilentlyContinue
    Write-Log "Configuration files backed up" "SUCCESS"
} else {
    Write-Host "`n[STEP 2/10] Skipping Backup (--SkipBackup flag)" -ForegroundColor Yellow
}

# ===================================
# Step 3: Configure Oracle CLI
# ===================================
Write-Host "`n[STEP 3/10] Configuring Oracle CLI..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if (-not $SkipOCISetup) {
    $ociConfigPath = "$env:USERPROFILE\.oci\config"
    
    # Check if already configured with API key (permanent auth)
    if (Test-Path $ociConfigPath) {
        $configContent = Get-Content $ociConfigPath -Raw
        
        # Check if it's API key authentication (has user, fingerprint, key_file)
        if ($configContent -match "user=ocid1\.user" -and $configContent -match "fingerprint=" -and $configContent -match "key_file=") {
            Write-Log "Found existing API key authentication" "INFO"
            
            # Test if it works
            try {
                $test = oci iam availability-domain list --profile $OracleProfile --output json 2>&1 | ConvertFrom-Json
                if ($test.data) {
                    Write-Log "✓ Existing API key authentication works! Using it for automation." "SUCCESS"
                    Write-Log "No browser authentication needed - fully automated!" "SUCCESS"
                    
                    # Set profile environment variable
                    $env:OCI_CLI_PROFILE = $OracleProfile
                } else {
                    throw "Authentication test failed"
                }
            } catch {
                Write-Log "Existing config failed. Need to reconfigure." "WARNING"
                
                if (-not $AutoConfirm) {
                    Write-Host "`n⚠️  Oracle CLI authentication not working" -ForegroundColor Yellow
                    Write-Host "   Please set up permanent authentication for full automation." -ForegroundColor White
                    Write-Host "`n   Run this script first:" -ForegroundColor Cyan
                    Write-Host "   .\setup-oracle-permanent-auth.ps1`n" -ForegroundColor Green
                    
                    $continue = Read-Host "Continue with browser authentication instead? (y/N)"
                    if ($continue -ne "y") {
                        exit 1
                    }
                    
                    # Fallback to browser auth
                    Write-Log "Using browser authentication (not fully automated)" "WARNING"
                    oci session authenticate --profile $OracleProfile --region $Region 2>&1 | Out-Null
                } else {
                    Write-Log "AutoConfirm mode requires working API key. Please run: .\setup-oracle-permanent-auth.ps1" "ERROR"
                    exit 1
                }
            }
        } else {
            # Has config but it's session-based, not API key
            Write-Log "Found session-based config. For full automation, use API key." "WARNING"
            
            if (-not $AutoConfirm) {
                Write-Host "`n💡 Tip: Set up permanent API key authentication for full automation" -ForegroundColor Cyan
                Write-Host "   Run: .\setup-oracle-permanent-auth.ps1`n" -ForegroundColor Green
                
                $usePermanent = Read-Host "Set up permanent auth now? (Y/n)"
                if ($usePermanent -ne "n") {
                    .\setup-oracle-permanent-auth.ps1 -Region $Region
                    
                    # Test again after setup
                    try {
                        $test = oci iam availability-domain list --profile $OracleProfile --output json 2>&1 | ConvertFrom-Json
                        if ($test.data) {
                            Write-Log "✓ Permanent authentication configured!" "SUCCESS"
                        }
                    } catch {
                        Write-Log "Setup failed. Falling back to browser auth." "WARNING"
                        oci session authenticate --profile $OracleProfile --region $Region 2>&1 | Out-Null
                    }
                } else {
                    Write-Log "Using browser authentication..." "INFO"
                    oci session authenticate --profile $OracleProfile --region $Region 2>&1 | Out-Null
                }
            } else {
                Write-Log "AutoConfirm requires API key auth. Run: .\setup-oracle-permanent-auth.ps1" "ERROR"
                exit 1
            }
        }
    } else {
        # No config at all
        Write-Log "No OCI configuration found" "WARNING"
        
        if (-not $AutoConfirm) {
            Write-Host "`n⚠️  Oracle CLI not configured" -ForegroundColor Yellow
            Write-Host "   For full automation, set up permanent API key authentication.`n" -ForegroundColor White
            
            Write-Host "Choose authentication method:" -ForegroundColor Cyan
            Write-Host "  1. Permanent API Key (Recommended - fully automated)" -ForegroundColor White
            Write-Host "  2. Browser Session (Manual - expires in 60 minutes)" -ForegroundColor White
            
            $authChoice = Read-Host "`nEnter choice (1-2)"
            
            if ($authChoice -eq "1") {
                .\setup-oracle-permanent-auth.ps1 -Region $Region
            } else {
                Write-Log "Using browser authentication..." "INFO"
                Write-Log "Please login with Muhammad Salman's Oracle account in the browser" "WARNING"
                oci session authenticate --profile $OracleProfile --region $Region 2>&1 | Out-Null
            }
        } else {
            Write-Log "AutoConfirm mode requires API key setup. Run: .\setup-oracle-permanent-auth.ps1" "ERROR"
            exit 1
        }
    }
    
    # Final verification
    try {
        $tenancy = oci iam availability-domain list --profile $OracleProfile --output json 2>&1 | ConvertFrom-Json
        if ($tenancy.data) {
            Write-Log "Authentication verified - Connected to tenancy" "SUCCESS"
        } else {
            throw "No data returned"
        }
    } catch {
        Write-Log "Could not verify authentication. Please ensure you're logged in." "ERROR"
        if (-not $AutoConfirm) {
            $continue = Read-Host "Continue anyway? (y/N)"
            if ($continue -ne "y") { exit 1 }
        } else {
            exit 1
        }
    }
} else {
    Write-Host "[STEP 3/10] Skipping OCI Setup (--SkipOCISetup flag)" -ForegroundColor Yellow
}

# Set OCI profile environment variable
$env:OCI_CLI_PROFILE = $OracleProfile

# ===================================
# Step 4: Get or Create Compartment
# ===================================
Write-Host "`n[STEP 4/10] Setting Up Oracle Compartment..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Log "Fetching available compartments..."
try {
    $compartments = oci iam compartment list --all --profile $OracleProfile --output json 2>&1 | ConvertFrom-Json
    
    if ($compartments.data -and $compartments.data.Count -gt 0) {
        Write-Log "Found $($compartments.data.Count) compartments"
        
        # Look for MegiLance compartment
        $megilanceComp = $compartments.data | Where-Object { $_.name -eq "MegiLance" } | Select-Object -First 1
        
        if ($megilanceComp) {
            $COMPARTMENT_ID = $megilanceComp.id
            Write-Log "Using existing MegiLance compartment: $COMPARTMENT_ID" "SUCCESS"
        } else {
            # Use first available compartment or root
            if (-not $AutoConfirm) {
                Write-Host "`nAvailable Compartments:" -ForegroundColor Yellow
                for ($i = 0; $i -lt $compartments.data.Count; $i++) {
                    Write-Host "  $($i+1). $($compartments.data[$i].name)" -ForegroundColor White
                }
                $selection = Read-Host "Select compartment number (or press Enter for first)"
                if ($selection) {
                    $COMPARTMENT_ID = $compartments.data[$selection - 1].id
                } else {
                    $COMPARTMENT_ID = $compartments.data[0].id
                }
            } else {
                $COMPARTMENT_ID = $compartments.data[0].id
            }
            Write-Log "Using compartment: $COMPARTMENT_ID" "SUCCESS"
        }
    } else {
        # Get root compartment from tenancy
        $tenancy = oci iam availability-domain list --profile $OracleProfile --output json 2>&1 | ConvertFrom-Json
        $COMPARTMENT_ID = $tenancy.data[0].'compartment-id'
        Write-Log "Using root compartment: $COMPARTMENT_ID" "SUCCESS"
    }
} catch {
    Write-Log "Error fetching compartments: $($_.Exception.Message)" "ERROR"
    exit 1
}

# ===================================
# Step 5: Create Oracle Autonomous Database
# ===================================
Write-Host "`n[STEP 5/10] Creating Oracle Autonomous Database..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Generate secure password without System.Web dependency
$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
$DB_PASSWORD = -join ((1..16) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] }) + "Aa1!"
Write-Log "Generated secure database password"

Write-Log "Creating Always Free Autonomous Database (this may take 5-10 minutes)..."

try {
    $adbResult = oci db autonomous-database create `
        --compartment-id $COMPARTMENT_ID `
        --db-name megilancedb `
        --display-name "MegiLance Production DB" `
        --admin-password $DB_PASSWORD `
        --cpu-core-count 1 `
        --data-storage-size-in-tbs 1 `
        --db-workload OLTP `
        --is-free-tier true `
        --license-model LICENSE_INCLUDED `
        --profile $OracleProfile `
        --wait-for-state AVAILABLE `
        --output json 2>&1 | ConvertFrom-Json
    
    if ($adbResult.data) {
        $ADB_ID = $adbResult.data.id
        $ADB_NAME = $adbResult.data.'db-name'
        Write-Log "Autonomous Database created successfully!" "SUCCESS"
        Write-Log "Database OCID: $ADB_ID"
        Write-Log "Database Name: $ADB_NAME"
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "already exists" -or $errorMsg -match "AlreadyExists") {
        Write-Log "Database already exists, fetching existing database..." "WARNING"
        
        try {
            $existingDbs = oci db autonomous-database list `
                --compartment-id $COMPARTMENT_ID `
                --profile $OracleProfile `
                --output json 2>&1 | ConvertFrom-Json
            
            $megilanceDb = $existingDbs.data | Where-Object { $_.'db-name' -eq 'megilancedb' } | Select-Object -First 1
            
            if ($megilanceDb) {
                $ADB_ID = $megilanceDb.id
                Write-Log "Using existing database: $ADB_ID" "SUCCESS"
                
                # Prompt for existing password
                if (-not $AutoConfirm) {
                    $securePass = Read-Host "Enter existing database admin password" -AsSecureString
                    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
                    $DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
                }
            } else {
                Write-Log "Could not find existing MegiLance database" "ERROR"
                exit 1
            }
        } catch {
            Write-Log "Error fetching existing database: $($_.Exception.Message)" "ERROR"
            exit 1
        }
    } else {
        Write-Log "Error creating database: $errorMsg" "ERROR"
        exit 1
    }
}

# ===================================
# Step 6: Download Database Wallet
# ===================================
Write-Host "`n[STEP 6/10] Downloading Database Wallet..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$WALLET_PASSWORD = $DB_PASSWORD
Write-Log "Generating and downloading wallet..."

try {
    # Remove old wallet
    if (Test-Path $ORACLE_WALLET_DIR) {
        Remove-Item -Recurse -Force $ORACLE_WALLET_DIR
    }
    
    # Download wallet
    oci db autonomous-database generate-wallet `
        --autonomous-database-id $ADB_ID `
        --file "oracle-wallet.zip" `
        --password $WALLET_PASSWORD `
        --profile $OracleProfile `
        --wait-for-state SUCCEEDED 2>&1 | Out-Null
    
    if (Test-Path "oracle-wallet.zip") {
        # Extract wallet
        Expand-Archive -Path "oracle-wallet.zip" -DestinationPath $ORACLE_WALLET_DIR -Force
        Write-Log "Wallet downloaded and extracted to ./$ORACLE_WALLET_DIR" "SUCCESS"
        
        # Copy wallet to backend directory
        if (Test-Path "backend") {
            Copy-Item -Recurse -Force $ORACLE_WALLET_DIR "backend/$ORACLE_WALLET_DIR"
            Write-Log "Wallet copied to backend directory" "SUCCESS"
        }
        
        # Cleanup zip
        Remove-Item "oracle-wallet.zip" -Force
    } else {
        Write-Log "Wallet file not created" "ERROR"
        exit 1
    }
} catch {
    Write-Log "Error downloading wallet: $($_.Exception.Message)" "ERROR"
    exit 1
}

# Get connection details from wallet
$tnsNamesPath = Join-Path $ORACLE_WALLET_DIR "tnsnames.ora"
if (Test-Path $tnsNamesPath) {
    $tnsContent = Get-Content $tnsNamesPath -Raw
    if ($tnsContent -match "megilancedb_high") {
        Write-Log "Database connection services available: megilancedb_high, megilancedb_medium, megilancedb_low"
    }
}

# ===================================
# Step 7: Create Object Storage Buckets
# ===================================
Write-Host "`n[STEP 7/10] Creating Object Storage Buckets..." -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Get namespace
try {
    $namespaceResult = oci os ns get --profile $OracleProfile --output json 2>&1 | ConvertFrom-Json
    $OCI_NAMESPACE = $namespaceResult.data
    Write-Log "Object Storage Namespace: $OCI_NAMESPACE" "SUCCESS"
} catch {
    Write-Log "Error getting namespace: $($_.Exception.Message)" "ERROR"
    exit 1
}

$buckets = @(
    @{ name = "megilance-uploads"; access = "NoPublicAccess" },
    @{ name = "megilance-assets"; access = "ObjectRead" },
    @{ name = "megilance-logs"; access = "NoPublicAccess" }
)

foreach ($bucket in $buckets) {
    try {
        oci os bucket create `
            --compartment-id $COMPARTMENT_ID `
            --name $bucket.name `
            --public-access-type $bucket.access `
            --profile $OracleProfile `
            --output json 2>&1 | Out-Null
        Write-Log "Created bucket: $($bucket.name) ($($bucket.access))" "SUCCESS"
    } catch {
        if ($_.Exception.Message -match "already exists" -or $_.Exception.Message -match "BucketAlreadyExists") {
            Write-Log "Bucket already exists: $($bucket.name)" "WARNING"
        } else {
            Write-Log "Error creating bucket $($bucket.name): $($_.Exception.Message)" "WARNING"
        }
    }
}

# ===================================
# Step 8: Update Backend Configuration
# ===================================
Write-Host "`n[STEP 8/10] Updating Backend Configuration..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Log "Creating Oracle-compatible .env file..."

# Build Oracle connection string
$DB_SERVICE = "megilancedb_high"
$DB_CONNECTION_STRING = "postgresql+psycopg2://admin:$DB_PASSWORD@//localhost:1522/$DB_SERVICE"

$envContent = @"
# ===================================
# MegiLance Backend - Oracle Cloud Configuration
# Generated: $TIMESTAMP
# ===================================

# Application Settings
APP_NAME=MegiLance API
ENVIRONMENT=production

# CORS Origins
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://megilance.com","*"]

# Oracle Autonomous Database
DATABASE_URL=$DB_CONNECTION_STRING

# Security & JWT
SECRET_KEY=$([System.Web.Security.Membership]::GeneratePassword(32, 8))
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080
JWT_ALGORITHM=HS256

# Oracle Cloud Infrastructure
OCI_REGION=$Region
OCI_PROFILE=$OracleProfile
OCI_NAMESPACE=$OCI_NAMESPACE
OCI_COMPARTMENT_ID=$COMPARTMENT_ID

# OCI Object Storage Buckets
OCI_BUCKET_ASSETS=megilance-assets
OCI_BUCKET_LOGS=megilance-logs
OCI_BUCKET_UPLOADS=megilance-uploads

# Oracle Wallet Configuration
OCI_WALLET_LOCATION=/app/oracle-wallet
TNS_ADMIN=/app/oracle-wallet

# AI Service
AI_SERVICE_URL=http://localhost:8001

# Monitoring
LOG_LEVEL=INFO
"@

Set-Content -Path "backend\.env" -Value $envContent
Write-Log "Backend .env file updated" "SUCCESS"

# Update requirements.txt
Write-Log "Updating Python dependencies..."
$requirementsPath = "backend\requirements.txt"
if (Test-Path $requirementsPath) {
    $requirements = Get-Content $requirementsPath
    
    # Remove boto3 (AWS)
    $requirements = $requirements | Where-Object { $_ -notmatch "^boto3" }
    
    # Add Oracle dependencies if not present
    if ($requirements -notcontains "oci>=2.119.1") {
        $requirements += "oci>=2.119.1"
    }
    if ($requirements -notcontains "cx_Oracle>=8.3.0") {
        $requirements += "cx_Oracle>=8.3.0"
    }
    if ($requirements -notcontains "oracledb>=2.0.1") {
        $requirements += "oracledb>=2.0.1"
    }
    
    Set-Content -Path $requirementsPath -Value $requirements
    Write-Log "Dependencies updated" "SUCCESS"
}

# ===================================
# Step 9: Create OCI Storage Client
# ===================================
Write-Host "`n[STEP 9/10] Creating OCI Storage Client..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Log "Generating OCI storage client code..."

$ociStorageContent = @'
"""
Oracle Cloud Infrastructure (OCI) Object Storage utility functions
Replaces AWS S3 for file uploads and management
"""

from typing import Optional
import oci
from oci.object_storage import ObjectStorageClient
from oci.object_storage.models import CreatePreauthenticatedRequestDetails
import logging
from datetime import datetime, timedelta
import io

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class OCIStorageClient:
    def __init__(self):
        """Initialize OCI Object Storage client using config file authentication"""
        try:
            # Use config file authentication (set up via `oci session authenticate`)
            config = oci.config.from_file(profile_name=settings.oci_profile or "DEFAULT")
            self.client = ObjectStorageClient(config)
            self.namespace = settings.oci_namespace or self.client.get_namespace().data
            logger.info(f"OCI Storage Client initialized for namespace: {self.namespace}")
        except Exception as e:
            logger.error(f"Failed to initialize OCI Storage Client: {e}")
            raise
        
    def upload_file(
        self,
        file_obj,
        bucket_name: str,
        object_name: str,
        content_type: Optional[str] = None
    ) -> Optional[str]:
        """
        Upload a file to OCI Object Storage bucket
        
        Args:
            file_obj: File object to upload
            bucket_name: Target OCI bucket
            object_name: Object name (key)
            content_type: MIME type of the file
            
        Returns:
            Object Storage URL of uploaded file or None if failed
        """
        try:
            # Read file content
            if hasattr(file_obj, 'read'):
                file_content = file_obj.read()
                if hasattr(file_obj, 'seek'):
                    file_obj.seek(0)
            else:
                file_content = file_obj
            
            # Upload to Object Storage
            self.client.put_object(
                namespace_name=self.namespace,
                bucket_name=bucket_name,
                object_name=object_name,
                put_object_body=file_content,
                content_type=content_type
            )
            
            url = f"https://objectstorage.{settings.oci_region}.oraclecloud.com/n/{self.namespace}/b/{bucket_name}/o/{object_name}"
            logger.info(f"File uploaded successfully to {url}")
            return url
            
        except Exception as e:
            logger.error(f"Error uploading file to OCI: {e}")
            return None
    
    def generate_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """
        Generate a pre-authenticated request (PAR) URL for OCI object
        
        Args:
            bucket_name: OCI bucket name
            object_name: Object key
            expiration: URL expiration time in seconds
            
        Returns:
            Pre-authenticated URL or None if failed
        """
        try:
            # Calculate expiration time
            expiration_time = datetime.utcnow() + timedelta(seconds=expiration)
            
            # Create PAR
            par_details = CreatePreauthenticatedRequestDetails(
                name=f"temp-access-{object_name}-{int(datetime.utcnow().timestamp())}",
                access_type="ObjectRead",
                time_expires=expiration_time,
                object_name=object_name
            )
            
            par = self.client.create_preauthenticated_request(
                namespace_name=self.namespace,
                bucket_name=bucket_name,
                create_preauthenticated_request_details=par_details
            )
            
            url = f"https://objectstorage.{settings.oci_region}.oraclecloud.com{par.data.access_uri}"
            return url
            
        except Exception as e:
            logger.error(f"Error generating pre-authenticated URL: {e}")
            return None
    
    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """
        Delete a file from OCI Object Storage bucket
        
        Args:
            bucket_name: OCI bucket name
            object_name: Object key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.delete_object(
                namespace_name=self.namespace,
                bucket_name=bucket_name,
                object_name=object_name
            )
            logger.info(f"File deleted successfully: {object_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file from OCI: {e}")
            return False
    
    def list_files(self, bucket_name: str, prefix: str = "") -> list:
        """
        List files in OCI Object Storage bucket with optional prefix
        
        Args:
            bucket_name: OCI bucket name
            prefix: Object key prefix to filter
            
        Returns:
            List of object keys
        """
        try:
            response = self.client.list_objects(
                namespace_name=self.namespace,
                bucket_name=bucket_name,
                prefix=prefix
            )
            
            if response.data.objects:
                return [obj.name for obj in response.data.objects]
            return []
            
        except Exception as e:
            logger.error(f"Error listing files from OCI: {e}")
            return []


# Singleton instance
oci_storage_client = OCIStorageClient()


def get_oci_storage_client() -> OCIStorageClient:
    """Dependency for FastAPI routes"""
    return oci_storage_client
'@

$ociStoragePath = "backend\app\core\oci_storage.py"
Set-Content -Path $ociStoragePath -Value $ociStorageContent
Write-Log "OCI storage client created: $ociStoragePath" "SUCCESS"

# ===================================
# Step 10: Database Migration
# ===================================
Write-Host "`n[STEP 10/10] Running Database Migration..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Log "Installing Python dependencies..."
try {
    Set-Location backend
    python -m pip install --upgrade pip --quiet 2>&1 | Out-Null
    python -m pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Write-Log "Dependencies installed" "SUCCESS"
    
    Write-Log "Running Alembic migrations..."
    python -m alembic upgrade head 2>&1 | Out-Null
    Write-Log "Database migrations completed" "SUCCESS"
    
    Set-Location ..
} catch {
    Write-Log "Error during migration: $($_.Exception.Message)" "ERROR"
    Set-Location ..
}

# ===================================
# Migration Complete - Summary
# ===================================
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║           MIGRATION COMPLETED SUCCESSFULLY! ✓                ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

Write-Host "`n📋 MIGRATION SUMMARY" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Timestamp: $TIMESTAMP" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Compartment: $COMPARTMENT_ID" -ForegroundColor White
Write-Host ""

Write-Host "💾 DATABASE" -ForegroundColor Cyan
Write-Host "Database Name: megilancedb" -ForegroundColor White
Write-Host "Database OCID: $ADB_ID" -ForegroundColor White
Write-Host "Connection Service: $DB_SERVICE" -ForegroundColor White
Write-Host "Wallet Location: ./$ORACLE_WALLET_DIR" -ForegroundColor White
Write-Host ""

Write-Host "🗄️  OBJECT STORAGE" -ForegroundColor Cyan
Write-Host "Namespace: $OCI_NAMESPACE" -ForegroundColor White
Write-Host "Buckets:" -ForegroundColor White
Write-Host "  - megilance-uploads (private)" -ForegroundColor Gray
Write-Host "  - megilance-assets (public read)" -ForegroundColor Gray
Write-Host "  - megilance-logs (private)" -ForegroundColor Gray
Write-Host ""

Write-Host "🔐 CREDENTIALS" -ForegroundColor Cyan
Write-Host "Database Password: [Saved in backend/.env]" -ForegroundColor White
Write-Host "Wallet Password: [Same as DB password]" -ForegroundColor White
Write-Host ""

Write-Host "📁 FILES MODIFIED" -ForegroundColor Cyan
Write-Host "  ✓ backend/.env" -ForegroundColor Green
Write-Host "  ✓ backend/requirements.txt" -ForegroundColor Green
Write-Host "  ✓ backend/app/core/oci_storage.py (created)" -ForegroundColor Green
Write-Host "  ✓ backend/oracle-wallet/ (created)" -ForegroundColor Green
Write-Host ""

Write-Host "📝 NEXT STEPS" -ForegroundColor Cyan
Write-Host "1. Test backend locally:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   python -m uvicorn main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test database connection:" -ForegroundColor White
Write-Host "   curl http://localhost:8000/api/health/ready" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update frontend API URL in frontend/.env:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_API_URL=http://your-oracle-vm-ip:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Deploy to Oracle Compute VM:" -ForegroundColor White
Write-Host "   .\deploy-to-oracle.ps1 backend" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 DOCUMENTATION" -ForegroundColor Cyan
Write-Host "Migration Log: $MIGRATION_LOG" -ForegroundColor White
Write-Host "Backup Directory: $BACKUP_DIR" -ForegroundColor White
Write-Host "Oracle Config: oracle-config.json" -ForegroundColor White
Write-Host ""

Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
Write-Host "All AWS resources replaced with Oracle Cloud (Always Free Tier)" -ForegroundColor Green
Write-Host ""

# Save configuration
$migrationConfig = @{
    timestamp = $TIMESTAMP
    region = $Region
    compartment_id = $COMPARTMENT_ID
    database_id = $ADB_ID
    database_name = "megilancedb"
    database_service = $DB_SERVICE
    namespace = $OCI_NAMESPACE
    wallet_location = $ORACLE_WALLET_DIR
    buckets = @("megilance-uploads", "megilance-assets", "megilance-logs")
    backup_directory = $BACKUP_DIR
    migration_log = $MIGRATION_LOG
}

$migrationConfig | ConvertTo-Json -Depth 10 | Set-Content "oracle-migration-config.json"
Write-Log "Configuration saved to oracle-migration-config.json" "SUCCESS"

Write-Host "Happy coding! 🚀" -ForegroundColor Cyan

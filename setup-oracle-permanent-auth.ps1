# ===================================
# Oracle CLI Permanent Authentication Setup
# ===================================
# Sets up API key authentication for Muhammad Salman's Oracle account
# After this, all automation works without browser prompts

param(
    [string]$Region = "us-ashburn-1",
    [switch]$UseExistingSession = $false
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║     Oracle CLI Permanent Authentication Setup               ║
║     Account: Muhammad Salman                                 ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`nThis will set up permanent API key authentication for Oracle CLI." -ForegroundColor White
Write-Host "After this one-time setup, all scripts will work automatically.`n" -ForegroundColor White

# Create .oci directory
$ociDir = "$env:USERPROFILE\.oci"
if (-not (Test-Path $ociDir)) {
    New-Item -ItemType Directory -Force -Path $ociDir | Out-Null
    Write-Host "✓ Created .oci directory" -ForegroundColor Green
}

# Check if we already have a valid config
if (Test-Path "$ociDir\config") {
    Write-Host "`n⚠️  Existing OCI config found" -ForegroundColor Yellow
    Write-Host "   Location: $ociDir\config" -ForegroundColor Gray
    
    # Test if it works
    Write-Host "`n   Testing existing configuration..." -ForegroundColor Cyan
    try {
        $test = oci iam availability-domain list --output json 2>&1 | ConvertFrom-Json
        if ($test.data) {
            Write-Host "   ✓ Existing config works!" -ForegroundColor Green
            
            $overwrite = Read-Host "`n   Reconfigure anyway? (y/N)"
            if ($overwrite -ne "y") {
                Write-Host "`n✓ Using existing configuration" -ForegroundColor Green
                Write-Host "`nYou're all set for automated migration!" -ForegroundColor Green
                Write-Host "Run: .\migrate-to-oracle-auto.ps1 -AutoConfirm`n" -ForegroundColor White
                exit 0
            }
        }
    } catch {
        Write-Host "   ✗ Existing config has issues, will reconfigure" -ForegroundColor Yellow
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Setup Method Selection" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Choose authentication method:`n" -ForegroundColor Cyan
Write-Host "  1. Automated API Key Setup (Recommended)" -ForegroundColor White
Write-Host "     - Generate keys automatically" -ForegroundColor Gray
Write-Host "     - You upload public key to Oracle Console" -ForegroundColor Gray
Write-Host "     - Fastest option" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. I Already Have API Key" -ForegroundColor White
Write-Host "     - Provide existing key details" -ForegroundColor Gray
Write-Host "     - If you've set up OCI before" -ForegroundColor Gray
Write-Host ""

$method = Read-Host "Enter choice (1-2)"

if ($method -eq "1") {
    # Automated setup
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Step 1: Generate API Key Pair" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    # Check for ssh-keygen
    if (-not (Get-Command ssh-keygen -ErrorAction SilentlyContinue)) {
        Write-Host "✗ ssh-keygen not found" -ForegroundColor Red
        Write-Host "`nInstalling OpenSSH Client..." -ForegroundColor Yellow
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
    }
    
    # Generate key pair
    $keyPath = "$ociDir\oci_api_key.pem"
    $pubKeyPath = "$ociDir\oci_api_key_public.pem"
    
    if (Test-Path $keyPath) {
        $overwrite = Read-Host "`nAPI key already exists. Overwrite? (y/N)"
        if ($overwrite -ne "y") {
            Write-Host "Using existing key..." -ForegroundColor Yellow
        } else {
            Remove-Item $keyPath, $pubKeyPath -ErrorAction SilentlyContinue
        }
    }
    
    if (-not (Test-Path $keyPath)) {
        Write-Host "Generating RSA key pair (no passphrase for automation)..." -ForegroundColor Cyan
        
        # Check for OpenSSL first (needed for Oracle-compatible format)
        $opensslPath = $null
        $opensslLocations = @(
            "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
            "C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.exe",
            "C:\OpenSSL-Win64\bin\openssl.exe",
            "C:\OpenSSL-Win32\bin\openssl.exe"
        )
        
        foreach ($location in $opensslLocations) {
            if (Test-Path $location) {
                $opensslPath = $location
                break
            }
        }
        
        if (-not $opensslPath) {
            $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
        }
        
        if ($opensslPath) {
            Write-Host "✓ Found OpenSSL at: $opensslPath" -ForegroundColor Green
            
            # Generate private key using OpenSSL directly (no passphrase)
            & $opensslPath genrsa -out $keyPath 4096 2>&1 | Out-Null
            
            # Generate public key in PEM format
            & $opensslPath rsa -pubout -in $keyPath -out $pubKeyPath 2>&1 | Out-Null
            
            Write-Host "✓ API key pair generated using OpenSSL" -ForegroundColor Green
            Write-Host "  Private key: $keyPath" -ForegroundColor Gray
            Write-Host "  Public key: $pubKeyPath" -ForegroundColor Gray
        } else {
            # OpenSSL not found - provide easy installation method
            Write-Host "`n⚠️  OpenSSL is required to generate Oracle-compatible API keys" -ForegroundColor Yellow
            Write-Host "`nI can help you install it now. Choose an option:`n" -ForegroundColor Cyan
            
            Write-Host "  1. Install via Chocolatey (Recommended - fastest)" -ForegroundColor White
            Write-Host "  2. Install via winget" -ForegroundColor White
            Write-Host "  3. Download manually and I'll wait" -ForegroundColor White
            Write-Host "  4. Use Oracle Console to generate keys (manual)" -ForegroundColor White
            
            $installChoice = Read-Host "`nEnter choice (1-4)"
            
            switch ($installChoice) {
                "1" {
                    Write-Host "`nInstalling OpenSSL via Chocolatey..." -ForegroundColor Cyan
                    
                    # Check if choco is installed
                    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
                        Write-Host "Installing Chocolatey first..." -ForegroundColor Yellow
                        Set-ExecutionPolicy Bypass -Scope Process -Force
                        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
                        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
                    }
                    
                    choco install openssl -y
                    
                    # Refresh PATH
                    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                    
                    # Try again
                    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
                    if ($opensslPath) {
                        Write-Host "✓ OpenSSL installed successfully!" -ForegroundColor Green
                        
                        # Generate keys
                        openssl genrsa -out $keyPath 4096 2>&1 | Out-Null
                        openssl rsa -pubout -in $keyPath -out $pubKeyPath 2>&1 | Out-Null
                        
                        Write-Host "✓ API key pair generated" -ForegroundColor Green
                    } else {
                        Write-Host "✗ Installation failed. Please restart PowerShell and try again." -ForegroundColor Red
                        exit 1
                    }
                }
                "2" {
                    Write-Host "`nInstalling OpenSSL via winget..." -ForegroundColor Cyan
                    winget install --id=ShiningLight.OpenSSL -e --silent --accept-package-agreements --accept-source-agreements
                    
                    # Refresh PATH
                    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                    
                    # Try to find OpenSSL
                    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
                    if (-not $opensslPath) {
                        # Try common locations
                        foreach ($location in $opensslLocations) {
                            if (Test-Path $location) {
                                $opensslPath = $location
                                break
                            }
                        }
                    }
                    
                    if ($opensslPath) {
                        Write-Host "✓ OpenSSL installed successfully!" -ForegroundColor Green
                        
                        # Generate keys
                        & $opensslPath genrsa -out $keyPath 4096 2>&1 | Out-Null
                        & $opensslPath rsa -pubout -in $keyPath -out $pubKeyPath 2>&1 | Out-Null
                        
                        Write-Host "✓ API key pair generated" -ForegroundColor Green
                    } else {
                        Write-Host "✗ Installation completed but OpenSSL not found in PATH." -ForegroundColor Yellow
                        Write-Host "   Please restart PowerShell and run this script again." -ForegroundColor Yellow
                        exit 1
                    }
                }
                "3" {
                    Write-Host "`nDownload OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Cyan
                    Write-Host "Install it, then press Enter to continue..." -ForegroundColor Yellow
                    
                    Start-Process "https://slproweb.com/products/Win32OpenSSL.html"
                    Read-Host
                    
                    # Try to find OpenSSL after manual install
                    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
                    if (-not $opensslPath) {
                        foreach ($location in $opensslLocations) {
                            if (Test-Path $location) {
                                $opensslPath = $location
                                break
                            }
                        }
                    }
                    
                    if ($opensslPath) {
                        Write-Host "✓ OpenSSL found!" -ForegroundColor Green
                        
                        # Generate keys
                        & $opensslPath genrsa -out $keyPath 4096 2>&1 | Out-Null
                        & $opensslPath rsa -pubout -in $keyPath -out $pubKeyPath 2>&1 | Out-Null
                        
                        Write-Host "✓ API key pair generated" -ForegroundColor Green
                    } else {
                        Write-Host "✗ OpenSSL still not found. Please add it to PATH and try again." -ForegroundColor Red
                        exit 1
                    }
                }
                "4" {
                    Write-Host "`n📋 Manual Key Generation via Oracle Console:" -ForegroundColor Cyan
                    Write-Host "`n1. Open: https://cloud.oracle.com/" -ForegroundColor White
                    Write-Host "2. Login with Muhammad Salman's account" -ForegroundColor White
                    Write-Host "3. Click profile icon → User Settings" -ForegroundColor White
                    Write-Host "4. Under Resources → API Keys" -ForegroundColor White
                    Write-Host "5. Click 'Add API Key'" -ForegroundColor White
                    Write-Host "6. Select 'Generate API Key Pair'" -ForegroundColor White
                    Write-Host "7. Click 'Download Private Key' - save as oci_api_key.pem" -ForegroundColor White
                    Write-Host "8. Click 'Download Public Key' - save as oci_api_key_public.pem" -ForegroundColor White
                    Write-Host "9. Copy both files to: $ociDir" -ForegroundColor White
                    Write-Host "10. Copy the Configuration File Preview" -ForegroundColor White
                    
                    Start-Process "https://cloud.oracle.com/"
                    
                    Write-Host "`nPress Enter when you've downloaded and copied the keys..." -ForegroundColor Yellow
                    Read-Host
                    
                    # Check if keys exist
                    if ((Test-Path $keyPath) -and (Test-Path $pubKeyPath)) {
                        Write-Host "✓ Keys found!" -ForegroundColor Green
                    } else {
                        Write-Host "✗ Keys not found at expected location." -ForegroundColor Red
                        Write-Host "   Expected location: $ociDir" -ForegroundColor Gray
                        exit 1
                    }
                }
                default {
                    Write-Host "`nInvalid choice. Exiting..." -ForegroundColor Red
                    exit 1
                }
            }
        }
    }
    
    # Display public key
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Step 2: Upload Public Key to Oracle Cloud" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    Write-Host "Your public key (copy this):`n" -ForegroundColor Cyan
    Write-Host "┌────────────────────────────────────────────────────────────┐" -ForegroundColor Gray
    $publicKey = Get-Content $pubKeyPath -Raw
    Write-Host $publicKey -ForegroundColor White
    Write-Host "└────────────────────────────────────────────────────────────┘" -ForegroundColor Gray
    
    # Copy to clipboard
    $publicKey | Set-Clipboard
    Write-Host "`n✓ Public key copied to clipboard!" -ForegroundColor Green
    
    Write-Host "`nNow follow these steps in Oracle Cloud Console:`n" -ForegroundColor Cyan
    Write-Host "  1. Open: https://cloud.oracle.com/" -ForegroundColor White
    Write-Host "  2. Login with Muhammad Salman's account" -ForegroundColor White
    Write-Host "  3. Click profile icon (top right) → User Settings" -ForegroundColor White
    Write-Host "  4. Under Resources (left) → API Keys" -ForegroundColor White
    Write-Host "  5. Click 'Add API Key'" -ForegroundColor White
    Write-Host "  6. Select 'Paste Public Key'" -ForegroundColor White
    Write-Host "  7. Paste the key (already in clipboard)" -ForegroundColor White
    Write-Host "  8. Click 'Add'" -ForegroundColor White
    Write-Host "  9. Copy the Configuration File Preview" -ForegroundColor White
    
    # Open browser
    $openBrowser = Read-Host "`nOpen Oracle Console in browser? (Y/n)"
    if ($openBrowser -ne "n") {
        Start-Process "https://cloud.oracle.com/?region=$Region"
    }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Step 3: Enter Configuration Details" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    Write-Host "After adding the API key, Oracle shows a Configuration File Preview." -ForegroundColor Cyan
    Write-Host "Copy those values here:`n" -ForegroundColor Cyan
    
    # Get user OCID
    $userOcid = Read-Host "Enter user OCID (starts with ocid1.user.oc1..)"
    
    # Get tenancy OCID
    $tenancyOcid = Read-Host "Enter tenancy OCID (starts with ocid1.tenancy.oc1..)"
    
    # Get fingerprint
    $fingerprint = Read-Host "Enter fingerprint (format: xx:xx:xx:xx:...)"
    
    # Create config file
    $configContent = @"
[DEFAULT]
user=$userOcid
fingerprint=$fingerprint
tenancy=$tenancyOcid
region=$Region
key_file=$keyPath
"@
    
    Set-Content -Path "$ociDir\config" -Value $configContent
    Write-Host "`n✓ Configuration file created" -ForegroundColor Green
    
} elseif ($method -eq "2") {
    # Existing key
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Enter Existing Configuration" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    $userOcid = Read-Host "Enter user OCID"
    $tenancyOcid = Read-Host "Enter tenancy OCID"
    $fingerprint = Read-Host "Enter fingerprint"
    $existingKeyPath = Read-Host "Enter path to private key file"
    
    # Verify key exists
    if (-not (Test-Path $existingKeyPath)) {
        Write-Host "`n✗ Private key file not found: $existingKeyPath" -ForegroundColor Red
        exit 1
    }
    
    # Create config file
    $configContent = @"
[DEFAULT]
user=$userOcid
fingerprint=$fingerprint
tenancy=$tenancyOcid
region=$Region
key_file=$existingKeyPath
"@
    
    Set-Content -Path "$ociDir\config" -Value $configContent
    Write-Host "`n✓ Configuration file created" -ForegroundColor Green
    
} else {
    Write-Host "`nInvalid choice. Exiting..." -ForegroundColor Red
    exit 1
}

# Verify configuration
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Verifying Configuration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Testing authentication..." -ForegroundColor Cyan

try {
    # Test 1: List availability domains
    Write-Host "  Test 1: Availability domains... " -NoNewline
    $adTest = oci iam availability-domain list --output json 2>&1 | ConvertFrom-Json
    if ($adTest.data) {
        Write-Host "✓" -ForegroundColor Green
    } else {
        throw "No data returned"
    }
    
    # Test 2: List compartments
    Write-Host "  Test 2: Compartments... " -NoNewline
    $compTest = oci iam compartment list --all --output json 2>&1 | ConvertFrom-Json
    if ($compTest.data) {
        Write-Host "✓" -ForegroundColor Green
    } else {
        throw "No data returned"
    }
    
    # Test 3: Get namespace
    Write-Host "  Test 3: Object Storage namespace... " -NoNewline
    $nsTest = oci os ns get --output json 2>&1 | ConvertFrom-Json
    if ($nsTest.data) {
        Write-Host "✓" -ForegroundColor Green
    } else {
        throw "No data returned"
    }
    
    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
    
    # Display summary
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
    
    Write-Host "Oracle CLI is now configured for permanent authentication." -ForegroundColor White
    Write-Host "Region: $Region" -ForegroundColor Gray
    Write-Host "Config: $ociDir\config" -ForegroundColor Gray
    
    Write-Host "`n🚀 Ready for Automated Migration!`n" -ForegroundColor Cyan
    
    Write-Host "Run the fully automated migration:" -ForegroundColor White
    Write-Host "  .\migrate-to-oracle-auto.ps1 -AutoConfirm`n" -ForegroundColor Green
    
    Write-Host "Or use the interactive wizard:" -ForegroundColor White
    Write-Host "  .\START_ORACLE_MIGRATION.ps1`n" -ForegroundColor Green
    
} catch {
    Write-Host "✗" -ForegroundColor Red
    Write-Host "`n❌ Configuration test failed!" -ForegroundColor Red
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Yellow
    
    Write-Host "`n🔧 Troubleshooting:`n" -ForegroundColor Cyan
    Write-Host "  1. Verify OCIDs are correct:" -ForegroundColor White
    Write-Host "     User OCID should start with: ocid1.user.oc1.." -ForegroundColor Gray
    Write-Host "     Tenancy OCID should start with: ocid1.tenancy.oc1.." -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Verify fingerprint format:" -ForegroundColor White
    Write-Host "     Should be: xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Check Oracle Console:" -ForegroundColor White
    Write-Host "     Profile → User Settings → API Keys" -ForegroundColor Gray
    Write-Host "     Verify the key fingerprint matches" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  4. Re-run this script to try again:" -ForegroundColor White
    Write-Host "     .\setup-oracle-permanent-auth.ps1`n" -ForegroundColor Gray
    
    Write-Host "📚 See detailed guide: SETUP_ORACLE_AUTH_PERMANENT.md`n" -ForegroundColor Cyan
    
    exit 1
}

# Quick OpenSSL Installer for Oracle CLI Setup

Write-Host "🔧 Installing OpenSSL for Oracle API Key Generation" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Method 1: Try Chocolatey (fastest)
Write-Host "`nMethod 1: Installing via Chocolatey..." -ForegroundColor Yellow

if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "✓ Chocolatey found" -ForegroundColor Green
    choco install openssl -y
} else {
    Write-Host "Installing Chocolatey first..." -ForegroundColor Cyan
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        Write-Host "✓ Chocolatey installed" -ForegroundColor Green
        Write-Host "Installing OpenSSL..." -ForegroundColor Cyan
        choco install openssl -y
    } catch {
        Write-Host "✗ Chocolatey installation failed, trying winget..." -ForegroundColor Yellow
        
        # Method 2: Try winget
        Write-Host "`nMethod 2: Installing via winget..." -ForegroundColor Yellow
        try {
            winget install --id=ShiningLight.OpenSSL -e --silent --accept-package-agreements --accept-source-agreements
        } catch {
            Write-Host "✗ winget installation failed" -ForegroundColor Red
            Write-Host "`nMethod 3: Manual Download" -ForegroundColor Yellow
            Write-Host "Please download and install from:" -ForegroundColor White
            Write-Host "https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Cyan
            Start-Process "https://slproweb.com/products/Win32OpenSSL.html"
            Read-Host "`nPress Enter after installation to continue"
        }
    }
}

# Refresh environment PATH
Write-Host "`nRefreshing environment variables..." -ForegroundColor Cyan
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host "`nVerifying OpenSSL installation..." -ForegroundColor Cyan

$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

if (-not $opensslPath) {
    # Try common locations
    $opensslLocations = @(
        "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
        "C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.exe",
        "C:\OpenSSL-Win64\bin\openssl.exe",
        "C:\OpenSSL-Win32\bin\openssl.exe",
        "C:\ProgramData\chocolatey\bin\openssl.exe"
    )
    
    foreach ($location in $opensslLocations) {
        if (Test-Path $location) {
            $opensslPath = $location
            break
        }
    }
}

if ($opensslPath) {
    Write-Host "✓ OpenSSL installed successfully!" -ForegroundColor Green
    Write-Host "  Location: $opensslPath" -ForegroundColor Gray
    
    # Test version
    $version = & $opensslPath version
    Write-Host "  Version: $version" -ForegroundColor Gray
    
    Write-Host "`n✅ Ready! Now run:" -ForegroundColor Green
    Write-Host "  .\setup-oracle-permanent-auth.ps1`n" -ForegroundColor White
} else {
    Write-Host "✗ OpenSSL not found in PATH" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "  1. Restart PowerShell (to refresh PATH)" -ForegroundColor White
    Write-Host "  2. Run: .\install-openssl.ps1 again" -ForegroundColor White
    Write-Host "`nOr install manually from:" -ForegroundColor Yellow
    Write-Host "  https://slproweb.com/products/Win32OpenSSL.html`n" -ForegroundColor Cyan
}

# @AI-HINT: PowerShell script to setup Turso database connection for MegiLance
# This script helps retrieve Turso credentials and update .env file

Write-Host "🚀 MegiLance - Turso Database Setup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check if Turso CLI is installed
Write-Host "📦 Checking Turso CLI installation..." -ForegroundColor Yellow
try {
    $tursoVersion = turso --version 2>&1
    Write-Host "✅ Turso CLI is installed: $tursoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Turso CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Install Turso CLI with:" -ForegroundColor Yellow
    Write-Host "   iwr -useb https://get.tur.so/install.ps1 | iex" -ForegroundColor White
    Write-Host ""
    Write-Host "Or visit: https://docs.turso.tech/cli/installation" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Check if logged in
Write-Host "🔐 Checking Turso authentication..." -ForegroundColor Yellow
$authCheck = turso auth token 2>&1 | Out-String

if ($authCheck -match "not logged in") {
    Write-Host "❌ You are not logged in to Turso" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔑 Please login first with:" -ForegroundColor Yellow
    Write-Host "   turso auth login" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Authenticated with Turso" -ForegroundColor Green
Write-Host ""

# List databases
Write-Host "📊 Available Turso databases:" -ForegroundColor Yellow
$dbList = turso db list 2>&1 | Out-String
Write-Host $dbList

Write-Host ""
Write-Host "Enter your database name (e.g., megilance-db): " -ForegroundColor Cyan -NoNewline
$dbName = Read-Host

if ([string]::IsNullOrWhiteSpace($dbName)) {
    Write-Host "❌ Database name is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Fetching database credentials..." -ForegroundColor Yellow

# Get database URL
try {
    $dbUrl = (turso db show $dbName --url 2>&1 | Out-String).Trim()
    
    if ($dbUrl -match "error" -or $dbUrl -match "not found") {
        Write-Host "❌ Database '$dbName' not found" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Create a new database with:" -ForegroundColor Yellow
        Write-Host "   turso db create $dbName" -ForegroundColor White
        exit 1
    }
    
    Write-Host "✅ Database URL: $dbUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get database URL: $_" -ForegroundColor Red
    exit 1
}

# Create auth token
Write-Host ""
Write-Host "🔑 Creating authentication token..." -ForegroundColor Yellow
try {
    $authToken = (turso db tokens create $dbName 2>&1 | Out-String).Trim()
    
    if ($authToken -match "error") {
        Write-Host "❌ Failed to create auth token" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Auth token created: ${authToken.Substring(0, 20)}..." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create auth token: $_" -ForegroundColor Red
    exit 1
}

# Update .env file
Write-Host ""
Write-Host "📝 Updating backend/.env file..." -ForegroundColor Yellow

$envPath = "backend\.env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ File not found: $envPath" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envPath -Raw

# Update TURSO_DATABASE_URL
if ($envContent -match "TURSO_DATABASE_URL=.*") {
    $envContent = $envContent -replace "TURSO_DATABASE_URL=.*", "TURSO_DATABASE_URL=$dbUrl"
} else {
    $envContent += "`nTURSO_DATABASE_URL=$dbUrl"
}

# Update TURSO_AUTH_TOKEN
if ($envContent -match "TURSO_AUTH_TOKEN=.*") {
    $envContent = $envContent -replace "TURSO_AUTH_TOKEN=.*", "TURSO_AUTH_TOKEN=$authToken"
} else {
    $envContent += "`nTURSO_AUTH_TOKEN=$authToken"
}

# Save updated .env
Set-Content -Path $envPath -Value $envContent

Write-Host "✅ Updated $envPath" -ForegroundColor Green

# Also update .env.production if it exists
$envProdPath = "backend\.env.production"
if (Test-Path $envProdPath) {
    Write-Host "📝 Updating backend/.env.production file..." -ForegroundColor Yellow
    
    $envProdContent = Get-Content $envProdPath -Raw
    
    # Update TURSO_DATABASE_URL
    if ($envProdContent -match "TURSO_DATABASE_URL=.*") {
        $envProdContent = $envProdContent -replace "TURSO_DATABASE_URL=.*", "TURSO_DATABASE_URL=$dbUrl"
    }
    
    # Update TURSO_AUTH_TOKEN
    if ($envProdContent -match "TURSO_AUTH_TOKEN=.*") {
        $envProdContent = $envProdContent -replace "TURSO_AUTH_TOKEN=.*", "TURSO_AUTH_TOKEN=$authToken"
    }
    
    Set-Content -Path $envProdPath -Value $envProdContent
    Write-Host "✅ Updated $envProdPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ Turso setup complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Database: $dbName" -ForegroundColor White
Write-Host "   URL: $dbUrl" -ForegroundColor White
Write-Host "   Token: ${authToken.Substring(0, 20)}..." -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Initialize database schema:" -ForegroundColor White
Write-Host "      cd backend" -ForegroundColor Gray
Write-Host "      alembic upgrade head" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Start the backend server:" -ForegroundColor White
Write-Host "      cd backend" -ForegroundColor Gray
Write-Host "      python -m uvicorn main:app --reload --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 The backend will now use Turso remote database!" -ForegroundColor Green
Write-Host ""

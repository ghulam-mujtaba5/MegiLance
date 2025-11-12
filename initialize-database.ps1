# Initialize Oracle Database Schema
# This script runs database migrations using Alembic

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MegiLance Database Initialization                        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "🔍 Checking Prerequisites..." -ForegroundColor Cyan

$errors = @()

# Check wallet
if (-not (Test-Path "oracle-wallet")) {
    $errors += "Oracle wallet directory not found"
}

# Check backend/.env
if (-not (Test-Path "backend\.env")) {
    $errors += "backend\.env not found"
} else {
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match '<ADMIN_PASSWORD>') {
        $errors += "Database password not configured in backend\.env"
    }
}

# Check Python
try {
    $null = python --version 2>&1
} catch {
    $errors += "Python not found"
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Errors found:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   • $error" -ForegroundColor Red
    }
    Write-Host "`nPlease fix these issues before running database initialization." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All prerequisites met!`n" -ForegroundColor Green

# Navigate to backend
Set-Location backend

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "🔧 Activating virtual environment..." -ForegroundColor Cyan
    .\venv\Scripts\Activate.ps1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pip install --quiet -r requirements.txt

# Test database connection
Write-Host "`n🔌 Testing database connection..." -ForegroundColor Cyan
$testScript = @'
import sys
from app.core.config import get_settings
from sqlalchemy import create_engine, text

try:
    settings = get_settings()
    print(f"Connecting to: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'database'}")
    
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1 FROM DUAL"))
        print("✅ Database connection successful!")
        sys.exit(0)
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    sys.exit(1)
'@

$testScript | python -
$connectionResult = $LASTEXITCODE

if ($connectionResult -ne 0) {
    Write-Host "`n❌ Database connection failed!" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in backend\.env" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

# Run Alembic migrations
Write-Host "`n🗄️  Running database migrations..." -ForegroundColor Cyan
Write-Host "This will create all tables and schemas...`n" -ForegroundColor Gray

alembic upgrade head

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Database initialized successfully!" -ForegroundColor Green
    
    # Optional: Seed initial data
    Write-Host "`n🌱 Do you want to seed initial data? (y/N): " -ForegroundColor Yellow -NoNewline
    $seedChoice = Read-Host
    
    if ($seedChoice -eq 'y' -or $seedChoice -eq 'Y') {
        Write-Host "Seeding database..." -ForegroundColor Cyan
        python -c "from app.db.seed_db import seed_database; seed_database()"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
        }
    }
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Start backend: uvicorn main:app --reload" -ForegroundColor White
    Write-Host "  2. Test API: http://localhost:8000/api/docs" -ForegroundColor White
    Write-Host "  3. Start frontend: cd ../frontend && npm run dev" -ForegroundColor White
    
} else {
    Write-Host "`n❌ Database initialization failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
}

Set-Location ..

# Start MegiLance in production mode
# Usage: .\start-prod.ps1

Write-Host "🚀 Starting MegiLance in Production Mode..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker compose down 2>$null

# Build and start services
Write-Host "🔨 Building and starting services in production mode..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Production environment started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Services:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:   http://localhost:8000/api/docs" -ForegroundColor White
    Write-Host "   Database:  localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Cyan
    Write-Host "   All:       docker compose logs -f" -ForegroundColor White
    Write-Host "   Frontend:  docker compose logs -f frontend" -ForegroundColor White
    Write-Host "   Backend:   docker compose logs -f backend" -ForegroundColor White
    Write-Host ""
    Write-Host "🛑 Stop services:" -ForegroundColor Cyan
    Write-Host "   docker compose down" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to start production environment" -ForegroundColor Red
    Write-Host "Run 'docker compose logs' to see errors" -ForegroundColor Yellow
    exit 1
}

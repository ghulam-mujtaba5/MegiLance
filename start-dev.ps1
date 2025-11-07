# Start MegiLance in development mode with hot reloading
# Usage: .\start-dev.ps1

Write-Host "🚀 Starting MegiLance in Development Mode with Hot Reloading..." -ForegroundColor Cyan
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
docker compose -f docker-compose.dev.yml down 2>$null

# Build and start services
Write-Host "🔨 Building and starting services with hot reloading..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Development environment started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Services:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3000 (Hot Reload: ✓)" -ForegroundColor White
    Write-Host "   Backend:   http://localhost:8000/api/docs (Hot Reload: ✓)" -ForegroundColor White
    Write-Host "   Database:  localhost:5432" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Code changes will automatically reload!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Cyan
    Write-Host "   All:       docker compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
    Write-Host "   Frontend:  docker compose -f docker-compose.dev.yml logs -f frontend" -ForegroundColor White
    Write-Host "   Backend:   docker compose -f docker-compose.dev.yml logs -f backend" -ForegroundColor White
    Write-Host ""
    Write-Host "🛑 Stop services:" -ForegroundColor Cyan
    Write-Host "   docker compose -f docker-compose.dev.yml down" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to start development environment" -ForegroundColor Red
    Write-Host "Run 'docker compose -f docker-compose.dev.yml logs' to see errors" -ForegroundColor Yellow
    exit 1
}

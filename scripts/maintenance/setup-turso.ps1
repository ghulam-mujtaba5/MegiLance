# MegiLance Setup with Turso Database

Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║         MegiLance - Turso Database Setup Complete!              ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n✅ Database Configuration:" -ForegroundColor Green
Write-Host "   Account: megilance" -ForegroundColor White
Write-Host "   Database: megilance-db" -ForegroundColor White
Write-Host "   Region: AWS Asia Pacific (Mumbai)" -ForegroundColor White
Write-Host "   URL: libsql://megilance-db-megilance.aws-ap-south-1.turso.io" -ForegroundColor Gray

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow

Write-Host "`n1️⃣  Wait for Docker Desktop to start (check system tray)" -ForegroundColor White

Write-Host "`n2️⃣  Build and start services:" -ForegroundColor White
Write-Host "   docker compose build backend" -ForegroundColor Cyan
Write-Host "   docker compose up -d" -ForegroundColor Cyan

Write-Host "`n3️⃣  Initialize database:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   docker compose exec backend alembic upgrade head" -ForegroundColor Cyan

Write-Host "`n4️⃣  Access services:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000/api/docs" -ForegroundColor Cyan

Write-Host "`n🔧 Useful Commands:" -ForegroundColor Yellow
Write-Host "   turso db shell megilance-db           # Access database shell" -ForegroundColor Gray
Write-Host "   turso db show megilance-db            # Show database info" -ForegroundColor Gray
Write-Host "   docker compose logs -f backend        # View backend logs" -ForegroundColor Gray
Write-Host "   docker compose restart backend        # Restart backend" -ForegroundColor Gray

Write-Host "`n💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Your .env file has been updated with Turso credentials" -ForegroundColor White
Write-Host "   • For production, use TURSO_DATABASE_URL and TURSO_AUTH_TOKEN" -ForegroundColor White
Write-Host "   • For local dev, it uses file:./local.db (SQLite)" -ForegroundColor White

Write-Host "`n═══════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Check Docker status
Write-Host "🐳 Checking Docker status..." -ForegroundColor Cyan
$dockerRunning = $false
$retries = 0
$maxRetries = 30

while (-not $dockerRunning -and $retries -lt $maxRetries) {
    try {
        docker info > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Host "✅ Docker is ready!" -ForegroundColor Green
        } else {
            Write-Host "⏳ Waiting for Docker Desktop to start... ($retries/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            $retries++
        }
    } catch {
        Write-Host "⏳ Waiting for Docker Desktop to start... ($retries/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $retries++
    }
}

if ($dockerRunning) {
    Write-Host "`n🚀 Ready to build! Run:" -ForegroundColor Green
    Write-Host "   docker compose build backend" -ForegroundColor Cyan
    Write-Host "   docker compose up -d" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Docker Desktop not ready. Please:" -ForegroundColor Yellow
    Write-Host "   1. Check if Docker Desktop is running (system tray)" -ForegroundColor White
    Write-Host "   2. Wait a minute and try again" -ForegroundColor White
    Write-Host "   3. Run: docker info" -ForegroundColor Cyan
}

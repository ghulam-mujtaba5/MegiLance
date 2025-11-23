# Quick Test - Database Connection Fix
# Run this after applying the fixes

Write-Host "🧪 Testing Database Connection Fix..." -ForegroundColor Cyan
Write-Host ""

# Stop any running containers
Write-Host "1️⃣ Stopping existing containers..." -ForegroundColor Yellow
docker compose down -v

Write-Host ""
Write-Host "2️⃣ Rebuilding backend with fixes..." -ForegroundColor Yellow
docker compose build backend

Write-Host ""
Write-Host "3️⃣ Starting backend and database..." -ForegroundColor Yellow
docker compose up -d backend db

Write-Host ""
Write-Host "4️⃣ Waiting for backend to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "5️⃣ Checking configuration..." -ForegroundColor Yellow
docker compose exec backend python check_config.py

Write-Host ""
Write-Host "6️⃣ Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health/live" -Method Get
    Write-Host "✅ Health Check Response:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "7️⃣ Checking environment variables..." -ForegroundColor Yellow
docker compose exec backend env | Select-String -Pattern "ENVIRONMENT|DATABASE_URL|DB_TYPE|TNS_ADMIN"

Write-Host ""
Write-Host "8️⃣ Checking Oracle wallet files..." -ForegroundColor Yellow
docker compose exec backend ls -la /app/oracle-wallet

Write-Host ""
Write-Host "=" * 60
Write-Host "✅ Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "If you see:"
Write-Host "  ✅ 'Production mode with Oracle - CORRECT'" -ForegroundColor Green
Write-Host "  ✅ Wallet files listed" -ForegroundColor Green
Write-Host "  ✅ Health check returns 200" -ForegroundColor Green
Write-Host ""
Write-Host "Then the fix is working! You can deploy to production." -ForegroundColor Cyan
Write-Host "=" * 60

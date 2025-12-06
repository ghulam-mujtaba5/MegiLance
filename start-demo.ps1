# MegiLance - Professor Demo Quick Start Script
# This script sets up and runs the complete platform demonstration

Write-Host "🎓 MegiLance - Professor Demonstration Setup" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Please run this script from the MegiLance root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Step 1: Installing Backend Dependencies..." -ForegroundColor Yellow
cd backend
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Gray
& .\venv\Scripts\Activate.ps1

Write-Host "Installing Python packages..." -ForegroundColor Gray
pip install -q -r requirements.txt

Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "🌱 Step 2: Generating Comprehensive Demo Data..." -ForegroundColor Yellow
Write-Host "This will create:" -ForegroundColor Gray
Write-Host "  - 14 users (admin, clients, freelancers)" -ForegroundColor Gray
Write-Host "  - 60+ skills across 7 categories" -ForegroundColor Gray
Write-Host "  - 10 projects with proposals and contracts" -ForegroundColor Gray
Write-Host "  - Payment transactions and reviews" -ForegroundColor Gray
Write-Host "  - Notifications and portfolio items" -ForegroundColor Gray
Write-Host ""

python scripts/seed_demo_comprehensive.py

Write-Host ""
Write-Host "🚀 Step 3: Starting Backend Server..." -ForegroundColor Yellow
Write-Host "API Documentation: http://localhost:8000/api/docs" -ForegroundColor Gray
Write-Host ""

# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000"

Write-Host "✅ Backend server starting..." -ForegroundColor Green
Write-Host ""

# Give backend time to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 QUICK START GUIDE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. API Documentation (Swagger):" -ForegroundColor White
Write-Host "   http://localhost:8000/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Login Credentials:" -ForegroundColor White
Write-Host "   Admin:      admin@megilance.com / admin123" -ForegroundColor Gray
Write-Host "   Client:     client1@example.com / password123" -ForegroundColor Gray
Write-Host "   Freelancer: freelancer1@example.com / password123" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Try These Features:" -ForegroundColor White
Write-Host "   ✨ AI Matching:        GET /api/matching/projects" -ForegroundColor Gray
Write-Host "   🔍 FTS5 Search:        POST /api/search/advanced/projects" -ForegroundColor Gray
Write-Host "   🔔 Real-time:          WS /api/realtime/notifications" -ForegroundColor Gray
Write-Host "   📊 Analytics:          GET /api/analytics/dashboard-summary" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Documentation:" -ForegroundColor White
Write-Host "   Professor Showcase: docs/PROFESSOR_SHOWCASE.md" -ForegroundColor Gray
Write-Host "   Architecture:       docs/Architecture.md" -ForegroundColor Gray
Write-Host "   Turso Setup:        docs/TURSO_SETUP.md" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Tip: Open the Swagger docs and try the '/api/matching/freelancers/1' endpoint" -ForegroundColor Yellow
Write-Host "       to see the AI-powered matching in action!" -ForegroundColor Yellow
Write-Host ""

Write-Host "Press Enter to continue..." -ForegroundColor Cyan
Read-Host

# Optional: Start frontend
Write-Host ""
Write-Host "Would you like to start the frontend as well? (y/n)" -ForegroundColor Cyan
$startFrontend = Read-Host

if ($startFrontend -eq 'y' -or $startFrontend -eq 'Y') {
    Write-Host ""
    Write-Host "🎨 Starting Frontend..." -ForegroundColor Yellow
    cd ..\frontend
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing npm packages (this may take a few minutes)..." -ForegroundColor Gray
        npm install
    }
    
    Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    
    Write-Host "✅ Frontend starting..." -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access the platform:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Gray
    Write-Host "   Backend:  http://localhost:8000/api/docs" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎓 Enjoy your MegiLance demonstration!" -ForegroundColor Cyan
Write-Host ""

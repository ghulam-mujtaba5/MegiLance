# PowerShell script to seed new features data
# Runs the comprehensive seed script for all new tables

Write-Host "🌱 MegiLance - Seeding New Features Data" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend container is running
Write-Host "Checking backend container status..." -ForegroundColor Yellow
$backendStatus = docker ps --filter "name=backend" --format "{{.Status}}"

if (-not $backendStatus) {
    Write-Host "❌ Backend container is not running!" -ForegroundColor Red
    Write-Host "Please start the backend first:" -ForegroundColor Yellow
    Write-Host "  docker compose up -d backend" -ForegroundColor White
    exit 1
}

Write-Host "✅ Backend container is running" -ForegroundColor Green
Write-Host ""

# Run seed script in backend container
Write-Host "Running seed script..." -ForegroundColor Yellow
Write-Host "This will create:" -ForegroundColor Cyan
Write-Host "  • Categories (hierarchical structure)" -ForegroundColor White
Write-Host "  • Tags (skills, priorities, locations)" -ForegroundColor White
Write-Host "  • Project-Tag associations" -ForegroundColor White
Write-Host "  • Time Entries (work hours tracking)" -ForegroundColor White
Write-Host "  • Invoices (pending, paid, overdue)" -ForegroundColor White
Write-Host "  • Escrow records (active, released)" -ForegroundColor White
Write-Host "  • Favorites (projects and freelancers)" -ForegroundColor White
Write-Host "  • Support Tickets (various statuses)" -ForegroundColor White
Write-Host "  • Refund requests" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with seeding? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Seeding cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting seed process..." -ForegroundColor Green

try {
    docker exec -it backend python -m scripts.seed_new_features
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Seeding completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now test the new APIs:" -ForegroundColor Cyan
        Write-Host "  • Time Tracking: /api/time-entries" -ForegroundColor White
        Write-Host "  • Invoices: /api/invoices" -ForegroundColor White
        Write-Host "  • Escrow: /api/escrow" -ForegroundColor White
        Write-Host "  • Categories: /api/categories" -ForegroundColor White
        Write-Host "  • Tags: /api/tags" -ForegroundColor White
        Write-Host "  • Favorites: /api/favorites" -ForegroundColor White
        Write-Host "  • Support: /api/support-tickets" -ForegroundColor White
        Write-Host "  • Refunds: /api/refunds" -ForegroundColor White
        Write-Host "  • Search: /api/search" -ForegroundColor White
        Write-Host ""
        Write-Host "Visit Swagger docs: http://localhost:8000/api/docs" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Seeding failed with errors" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running seed script: $_" -ForegroundColor Red
    exit 1
}

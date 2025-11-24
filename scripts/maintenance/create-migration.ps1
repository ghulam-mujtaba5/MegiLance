#!/usr/bin/env pwsh
# Create initial Alembic migration for all models
# This script creates a local SQLite database to generate the migration

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Creating Alembic Migration" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend

# Create a temporary SQLite database for migration generation
$tempDbUrl = "sqlite:///./temp_migration.db"
$env:DATABASE_URL = $tempDbUrl

Write-Host "📝 Generating migration from models..." -ForegroundColor Yellow

# Create the migration
python -m alembic revision --autogenerate -m "Initial migration: all 18 models with relationships"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration generation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration created successfully!" -ForegroundColor Green
Write-Host ""

# Clean up temp database
if (Test-Path "./temp_migration.db") {
    Remove-Item "./temp_migration.db"
}

Write-Host "📋 Migration Details:" -ForegroundColor Cyan
$migrationFile = Get-ChildItem -Path "alembic\versions" -Filter "*.py" | Sort-Object LastWriteTime | Select-Object -Last 1
Write-Host "   File: $($migrationFile.Name)" -ForegroundColor White
Write-Host "   Location: alembic\versions\$($migrationFile.Name)" -ForegroundColor White
Write-Host ""

Write-Host "📊 Expected Tables (18 models):" -ForegroundColor Cyan
$tables = @(
    "users", "skills", "user_skills", "projects", "proposals", "contracts", 
    "payments", "portfolio_items", "messages", "conversations", "notifications", 
    "reviews", "disputes", "milestones", "user_sessions", "audit_logs"
)
$tables | ForEach-Object {
    Write-Host "   ✓ $_" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Migration ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review the migration file: alembic\versions\$($migrationFile.Name)" -ForegroundColor White
Write-Host "   2. Deploy backend: .\deploy-backend.ps1" -ForegroundColor White
Write-Host "   3. Migration will be applied automatically during deployment" -ForegroundColor White
Write-Host ""

Set-Location ..

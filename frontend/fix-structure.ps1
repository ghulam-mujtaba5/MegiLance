# Frontend Structure Cleanup Script
# Fixes redundancies and follows Next.js 16 best practices

$ErrorActionPreference = "Stop"
Set-Location "E:\MegiLance\frontend"

Write-Host "`n🔧 FRONTEND STRUCTURE CLEANUP" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# ISSUE 1: Duplicate freelancer routes
# app/freelancer/ (17 routes) vs app/(portal)/freelancer/ (3 routes)
# SOLUTION: Keep app/(portal)/freelancer for authenticated routes, move old ones there

Write-Host "1️⃣  Fixing duplicate freelancer routes..." -ForegroundColor Yellow

$oldFreelancer = "app\freelancer"
$newFreelancer = "app\(portal)\freelancer"

if (Test-Path $oldFreelancer) {
    # Get all subdirectories in old freelancer folder
    $oldDirs = Get-ChildItem $oldFreelancer -Directory
    
    foreach ($dir in $oldDirs) {
        $dirName = $dir.Name
        $targetPath = Join-Path $newFreelancer $dirName
        
        # Skip if already exists in (portal)
        if (Test-Path $targetPath) {
            Write-Host "   ⏭️  Skipped: $dirName (already in portal)" -ForegroundColor Gray
        } else {
            # Move to portal
            Move-Item $dir.FullName $targetPath -Force
            Write-Host "   ✅ Moved: $dirName → (portal)/freelancer/" -ForegroundColor Green
        }
    }
    
    # Check if old freelancer folder is now empty or only has layout.tsx
    $remaining = Get-ChildItem $oldFreelancer
    if ($remaining.Count -le 1 -and $remaining.Name -eq "layout.tsx") {
        Remove-Item $oldFreelancer -Recurse -Force
        Write-Host "   🗑️  Removed: app/freelancer/" -ForegroundColor Green
    }
}

# ISSUE 2: app/portal/ vs app/(portal)/
# SOLUTION: Merge app/portal/ into app/(portal)/

Write-Host "`n2️⃣  Fixing portal route group..." -ForegroundColor Yellow

$oldPortal = "app\portal"
$newPortal = "app\(portal)"

if (Test-Path $oldPortal) {
    $portalDirs = Get-ChildItem $oldPortal -Directory
    
    foreach ($dir in $portalDirs) {
        $dirName = $dir.Name
        $targetPath = Join-Path $newPortal $dirName
        
        if (Test-Path $targetPath) {
            Write-Host "   ⏭️  Skipped: $dirName (already exists)" -ForegroundColor Gray
        } else {
            Move-Item $dir.FullName $targetPath -Force
            Write-Host "   ✅ Moved: $dirName → (portal)/" -ForegroundColor Green
        }
    }
    
    # Remove layout.tsx if exists and then remove folder
    if (Test-Path "$oldPortal\layout.tsx") {
        Remove-Item "$oldPortal\layout.tsx" -Force
    }
    
    if ((Get-ChildItem $oldPortal).Count -eq 0) {
        Remove-Item $oldPortal -Force
        Write-Host "   🗑️  Removed: app/portal/" -ForegroundColor Green
    }
}

# ISSUE 3: Capitalized route folders (bad practice)
# Profile, Projects, Messages, Payments, Settings, Home
# SOLUTION: Keep as-is for now (requires extensive refactoring)

Write-Host "`n3️⃣  Capitalized folders (requires manual review)..." -ForegroundColor Yellow

$capitalized = @("Profile", "Projects", "Messages", "Payments", "Settings", "Home")
foreach ($folder in $capitalized) {
    if (Test-Path "app\$folder") {
        Write-Host "   ⚠️  app/$folder/ - Should be lowercase (manual fix needed)" -ForegroundColor Yellow
    }
}

# ISSUE 4: root components/ vs app/components/
# SOLUTION: Keep both - root for legacy/shared, app for Next.js components

Write-Host "`n4️⃣  Component folders..." -ForegroundColor Yellow
if (Test-Path "components") {
    Write-Host "   ℹ️  root components/ - Legacy shared components (OK)" -ForegroundColor Cyan
}
if (Test-Path "app\components") {
    Write-Host "   ℹ️  app/components/ - Next.js components (OK)" -ForegroundColor Cyan
}

Write-Host "`n✅ Structure cleanup complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   - Consolidated freelancer routes into (portal)" -ForegroundColor White
Write-Host "   - Merged portal/ into (portal) route group" -ForegroundColor White
Write-Host "   - Capitalized folders flagged for review" -ForegroundColor White
Write-Host "`nNext: Run 'npm run build' to verify" -ForegroundColor Gray

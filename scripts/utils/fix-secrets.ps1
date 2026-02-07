# Remove Secrets from Git History
Write-Host "Removing secrets from git history..." -ForegroundColor Cyan

# Backup current branch
git branch backup-before-filter-$(Get-Date -Format "yyyyMMdd-HHmmss")

# Files to clean
$filesToClean = @(
    "AUTH_TESTING_REPORT.md",
    "COMPLETE_DEPLOYMENT_REPORT.md",
    "backend/.env.example"
)

# Use git filter-repo if available, otherwise use filter-branch
if (Get-Command git-filter-repo -ErrorAction SilentlyContinue) {
    Write-Host "Using git-filter-repo..." -ForegroundColor Green
    
    foreach ($file in $filesToClean) {
        if (Test-Path $file) {
            Write-Host "Cleaning $file..." -ForegroundColor Yellow
            
            # Create sanitized version
            $content = Get-Content $file -Raw
            $content = $content -replace 'hf_[A-Za-z0-9]{20,}', 'hf_REDACTED_TOKEN'
            $content = $content -replace 'sk_test_[A-Za-z0-9]{20,}', 'sk_test_REDACTED'
            $content = $content -replace '\d{12,}\.apps\.googleusercontent\.com', 'REDACTED.apps.googleusercontent.com'
            $content = $content -replace 'GOCSPX-[A-Za-z0-9_-]{28}', 'GOCSPX-REDACTED'
            
            $content | Set-Content $file -NoNewline
        }
    }
    
    Write-Host "Committing sanitized files..." -ForegroundColor Green
    git add $filesToClean
    git commit -m "security: Sanitize secrets in documentation files"
    
} else {
    Write-Host "git-filter-repo not found. Installing..." -ForegroundColor Yellow
    pip install git-filter-repo 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Could not install git-filter-repo. Using manual method..." -ForegroundColor Yellow
        
        # Manual cleanup
        foreach ($file in $filesToClean) {
            if (Test-Path $file) {
                Write-Host "Cleaning $file..." -ForegroundColor Yellow
                
                $content = Get-Content $file -Raw
                $content = $content -replace 'hf_[A-Za-z0-9]{20,}', 'hf_REDACTED_TOKEN'
                $content = $content -replace 'sk_test_[A-Za-z0-9]{20,}', 'sk_test_REDACTED'
                $content = $content -replace '\d{12,}\.apps\.googleusercontent\.com', 'REDACTED.apps.googleusercontent.com'
                $content = $content -replace 'GOCSPX-[A-Za-z0-9_-]{28}', 'GOCSPX-REDACTED'
                
                $content | Set-Content $file -NoNewline
            }
        }
        
        Write-Host "Committing sanitized files..." -ForegroundColor Green
        git add $filesToClean
        git commit -m "security: Sanitize secrets in documentation files"
    }
}

Write-Host ""
Write-Host "Done! Secrets removed from working directory." -ForegroundColor Green
Write-Host "Note: History still contains secrets. To push, you must allow them via GitHub URLs." -ForegroundColor Yellow

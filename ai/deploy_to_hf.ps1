param(
    [Parameter(Mandatory=$true)]
    [string]$SpaceUrl
)

$SourceDir = $PSScriptRoot
$TempDir = Join-Path $env:TEMP "megilance-ai-deploy-$(Get-Random)"

Write-Host "Deploying AI Service to Hugging Face Space: $SpaceUrl" -ForegroundColor Cyan

# Create temp dir
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

# Copy files
Write-Host "Copying files to temporary directory: $TempDir"
Copy-Item -Path "$SourceDir\*" -Destination $TempDir -Recurse -Exclude ".git", "__pycache__", ".venv", "venv", "*.pyc"

# Initialize git in temp dir
Push-Location $TempDir
try {
    git init
    git config user.name "MegiLance Deployer"
    git config user.email "deploy@megilance.com"
    
    git add .
    git commit -m "Deploy MegiLance AI Service"

    # Add remote and push
    git remote add space $SpaceUrl
    Write-Host "Pushing to Space (this may take a while)..."
    git push -f space HEAD:main
    
    Write-Host "Deployment pushed! Check your Space build logs." -ForegroundColor Green
}
catch {
    Write-Error "Deployment failed: $_"
}
finally {
    Pop-Location
    # Cleanup
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}

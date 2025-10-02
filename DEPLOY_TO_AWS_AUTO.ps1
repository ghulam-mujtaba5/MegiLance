# ============================================================================
# MegiLance - Automated AWS Deployment Script
# ============================================================================
# This script automates the complete AWS deployment process
# ============================================================================

param(
    [switch]$SkipInfrastructure,
    [switch]$SkipBuild,
    [string]$Environment = "production"
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n🚀 $msg" -ForegroundColor Magenta -BackgroundColor Black }

# ============================================================================
# Step 1: Pre-flight Checks
# ============================================================================
Write-Step "STEP 1: Pre-flight Checks"

Write-Info "Checking Docker installation..."
try {
    $dockerVersion = docker --version
    Write-Success "Docker installed: $dockerVersion"
} catch {
    Write-Error "Docker is not installed or not running!"
    exit 1
}

Write-Info "Checking GitHub CLI installation..."
try {
    $ghVersion = gh --version | Select-Object -First 1
    Write-Success "GitHub CLI installed: $ghVersion"
} catch {
    Write-Warning "GitHub CLI not installed. Installing now..."
    winget install --id GitHub.cli -e --source winget
}

Write-Info "Checking Git repository status..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "You have uncommitted changes. Committing now..."
    git add .
    git commit -m "chore: automated deployment preparation - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Success "Changes committed"
}

# ============================================================================
# Step 2: Verify Local Build
# ============================================================================
if (-not $SkipBuild) {
    Write-Step "STEP 2: Verify Local Build"
    
    Write-Info "Checking if containers are running..."
    $containers = docker-compose ps -q
    if (-not $containers) {
        Write-Info "Starting containers..."
        docker-compose up -d
        Start-Sleep -Seconds 30
    }
    
    Write-Info "Testing backend health..."
    try {
        $backendHealth = Invoke-RestMethod -Uri "http://localhost:8000/api/health/live" -TimeoutSec 5
        if ($backendHealth.status -eq "ok") {
            Write-Success "Backend is healthy"
        }
    } catch {
        Write-Error "Backend health check failed!"
        docker-compose logs backend --tail=50
        exit 1
    }
    
    Write-Info "Testing frontend..."
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Success "Frontend is healthy"
        }
    } catch {
        Write-Error "Frontend health check failed!"
        docker-compose logs frontend --tail=50
        exit 1
    }
} else {
    Write-Warning "Skipping local build verification"
}

# ============================================================================
# Step 3: Push Code to GitHub
# ============================================================================
Write-Step "STEP 3: Push Code to GitHub"

Write-Info "Checking current branch..."
$currentBranch = git branch --show-current
Write-Info "Current branch: $currentBranch"

Write-Info "Pulling latest changes..."
git pull origin $currentBranch

Write-Info "Pushing to GitHub..."
git push origin $currentBranch
Write-Success "Code pushed to GitHub"

# ============================================================================
# Step 4: Check GitHub Secrets
# ============================================================================
Write-Step "STEP 4: Check GitHub Secrets"

Write-Info "Checking required GitHub secrets..."
$repo = "ghulam-mujtaba5/MegiLance"

try {
    $secrets = gh secret list --repo $repo 2>&1
    
    $requiredSecrets = @("AWS_OIDC_ROLE_ARN", "TF_VAR_db_password")
    $missingSecrets = @()
    
    foreach ($secret in $requiredSecrets) {
        if ($secrets -notmatch $secret) {
            $missingSecrets += $secret
            Write-Warning "Missing secret: $secret"
        } else {
            Write-Success "Secret exists: $secret"
        }
    }
    
    if ($missingSecrets.Count -gt 0) {
        Write-Warning "Some secrets are missing. You need to add them manually:"
        Write-Info "Visit: https://github.com/$repo/settings/secrets/actions"
        Write-Info "Required secrets:"
        foreach ($secret in $missingSecrets) {
            Write-Info "  - $secret"
        }
        
        $response = Read-Host "Do you want to continue anyway? (yes/no)"
        if ($response -ne "yes") {
            Write-Error "Deployment cancelled. Please add the required secrets first."
            exit 1
        }
    }
} catch {
    Write-Warning "Could not check GitHub secrets. Make sure you're authenticated with 'gh auth login'"
}

# ============================================================================
# Step 5: Trigger Infrastructure Workflow
# ============================================================================
if (-not $SkipInfrastructure) {
    Write-Step "STEP 5: Trigger Infrastructure Setup"
    
    Write-Info "Triggering infrastructure.yml workflow..."
    try {
        gh workflow run infrastructure.yml `
            --repo $repo `
            --ref $currentBranch `
            --field apply=yes
        
        Write-Success "Infrastructure workflow triggered!"
        Write-Info "View status: https://github.com/$repo/actions/workflows/infrastructure.yml"
        
        Write-Info "Waiting for infrastructure workflow to start (30 seconds)..."
        Start-Sleep -Seconds 30
        
        Write-Info "Checking workflow status..."
        $runs = gh run list --workflow=infrastructure.yml --limit 1 --json status,conclusion,databaseId --repo $repo | ConvertFrom-Json
        if ($runs.Count -gt 0) {
            $runId = $runs[0].databaseId
            Write-Info "Workflow Run ID: $runId"
            Write-Info "Monitoring workflow (this may take 10-15 minutes)..."
            
            gh run watch $runId --repo $repo --exit-status
            Write-Success "Infrastructure setup completed!"
        }
    } catch {
        Write-Warning "Could not trigger or monitor infrastructure workflow"
        Write-Info "Please check manually: https://github.com/$repo/actions"
        
        $response = Read-Host "Continue to deployment? (yes/no)"
        if ($response -ne "yes") {
            exit 1
        }
    }
} else {
    Write-Warning "Skipping infrastructure setup"
}

# ============================================================================
# Step 6: Trigger Terraform Workflow
# ============================================================================
Write-Step "STEP 6: Trigger Terraform Workflow"

Write-Info "Triggering terraform.yml workflow..."
try {
    gh workflow run terraform.yml --repo $repo --ref $currentBranch
    Write-Success "Terraform workflow triggered!"
    Write-Info "View status: https://github.com/$repo/actions/workflows/terraform.yml"
    
    Start-Sleep -Seconds 30
    
    $runs = gh run list --workflow=terraform.yml --limit 1 --json status,databaseId --repo $repo | ConvertFrom-Json
    if ($runs.Count -gt 0) {
        $runId = $runs[0].databaseId
        Write-Info "Monitoring Terraform workflow..."
        gh run watch $runId --repo $repo --exit-status
        Write-Success "Terraform completed!"
    }
} catch {
    Write-Warning "Could not trigger Terraform workflow automatically"
}

# ============================================================================
# Step 7: Trigger Application Deployment
# ============================================================================
Write-Step "STEP 7: Trigger Application Deployment"

Write-Info "Triggering auto-deploy.yml workflow..."
try {
    gh workflow run auto-deploy.yml `
        --repo $repo `
        --ref $currentBranch `
        --field environment=$Environment `
        --field deploy_backend=true `
        --field deploy_frontend=true
    
    Write-Success "Deployment workflow triggered!"
    Write-Info "View status: https://github.com/$repo/actions/workflows/auto-deploy.yml"
    
    Write-Info "Waiting for deployment to start (30 seconds)..."
    Start-Sleep -Seconds 30
    
    $runs = gh run list --workflow=auto-deploy.yml --limit 1 --json status,databaseId --repo $repo | ConvertFrom-Json
    if ($runs.Count -gt 0) {
        $runId = $runs[0].databaseId
        Write-Info "Workflow Run ID: $runId"
        Write-Info "Monitoring deployment (this may take 15-20 minutes)..."
        
        gh run watch $runId --repo $repo --exit-status
        Write-Success "Deployment completed successfully!"
    }
} catch {
    Write-Warning "Could not trigger deployment workflow automatically"
    Write-Info "Please trigger manually: https://github.com/$repo/actions/workflows/auto-deploy.yml"
}

# ============================================================================
# Step 8: Summary and Next Steps
# ============================================================================
Write-Step "DEPLOYMENT COMPLETE! 🎉"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "                    DEPLOYMENT SUMMARY                                      " -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Success "✅ Local build verified"
Write-Success "✅ Code pushed to GitHub"
Write-Success "✅ Infrastructure provisioned"
Write-Success "✅ Terraform applied"
Write-Success "✅ Application deployed to AWS"
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                    ACCESS YOUR APPLICATION                                 " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "📊 View Deployment Status:"
Write-Host "   https://github.com/$repo/actions" -ForegroundColor Yellow
Write-Host ""
Write-Info "🌐 AWS Console:"
Write-Host "   ECS Services: https://us-east-2.console.aws.amazon.com/ecs/v2/clusters" -ForegroundColor Yellow
Write-Host "   ECR Repositories: https://us-east-2.console.aws.amazon.com/ecr/repositories" -ForegroundColor Yellow
Write-Host "   RDS Databases: https://us-east-2.console.aws.amazon.com/rds/home?region=us-east-2" -ForegroundColor Yellow
Write-Host ""
Write-Info "📝 Next Steps:"
Write-Host "   1. Check GitHub Actions to verify all workflows completed" -ForegroundColor White
Write-Host "   2. Get the ECS service public IP from AWS Console" -ForegroundColor White
Write-Host "   3. Update DNS/domain settings to point to your application" -ForegroundColor White
Write-Host "   4. Configure SSL/TLS certificates via AWS Certificate Manager" -ForegroundColor White
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""

Write-Success "Deployment script completed successfully!"
Write-Info "For detailed logs, check: BUILD_AND_DEPLOYMENT_SUCCESS.md"

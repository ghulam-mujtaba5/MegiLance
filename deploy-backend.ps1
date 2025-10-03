#!/usr/bin/env pwsh
# Automated deployment script for MegiLance Backend to AWS ECS
# This script handles: Docker build, ECR push, database migrations, ECS deployment

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigrations,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

# Configuration
$AWS_REGION = "us-east-2"
$AWS_ACCOUNT_ID = "789406175220"
$ECR_REPO_NAME = "megilance-backend"
$ECS_CLUSTER = "megilance-cluster"
$ECS_SERVICE = "megilance-backend-service"
$DB_SECRET_NAME = "megilance/prod/database"

Write-Host "🚀 MegiLance Backend Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pre-flight checks
Write-Host "📋 Pre-flight checks..." -ForegroundColor Yellow
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Test AWS credentials
try {
    $awsIdentity = aws sts get-caller-identity --region $AWS_REGION | ConvertFrom-Json
    Write-Host "✅ AWS credentials valid: $($awsIdentity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials invalid or expired." -ForegroundColor Red
    exit 1
}

# Step 2: Run tests
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    Set-Location backend
    try {
        python -m pytest tests/ -v
        Write-Host "✅ All tests passed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Tests failed. Fix tests before deploying." -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

# Step 3: Build Docker image
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
    Set-Location backend
    
    $imageTag = "$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $imageName = "megilance-backend:$imageTag"
    
    docker build -t $imageName .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker build failed" -ForegroundColor Red
        exit 1
    }
    
    docker tag $imageName "$imageName-latest"
    Write-Host "✅ Docker image built: $imageName" -ForegroundColor Green
    
    # Step 4: Push to ECR
    Write-Host ""
    Write-Host "📤 Pushing to ECR..." -ForegroundColor Yellow
    
    # Login to ECR
    $ecrLogin = aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ECR login failed" -ForegroundColor Red
        exit 1
    }
    
    # Tag for ECR
    $ecrImage = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPO_NAME}:$imageTag"
    $ecrImageLatest = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${ECR_REPO_NAME}:latest"
    
    docker tag $imageName $ecrImage
    docker tag $imageName $ecrImageLatest
    
    # Push both tags
    docker push $ecrImage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ECR push failed" -ForegroundColor Red
        exit 1
    }
    
    docker push $ecrImageLatest
    Write-Host "✅ Pushed to ECR: $ecrImage" -ForegroundColor Green
    
    Set-Location ..
} else {
    Write-Host "⏩ Skipping Docker build (using existing image)" -ForegroundColor Yellow
}

# Step 5: Run database migrations
if (-not $SkipMigrations) {
    Write-Host ""
    Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
    
    # Get database credentials from Secrets Manager
    Write-Host "   Fetching database credentials..."
    $dbSecret = aws secretsmanager get-secret-value --secret-id $DB_SECRET_NAME --region $AWS_REGION | ConvertFrom-Json
    $dbConfig = $dbSecret.SecretString | ConvertFrom-Json
    
    # Set environment variables for migration
    $env:DATABASE_URL = "postgresql://$($dbConfig.username):$($dbConfig.password)@$($dbConfig.host):$($dbConfig.port)/$($dbConfig.dbname)"
    
    Set-Location backend
    
    # Create migration if none exists
    $versionsDir = "alembic\versions"
    $migrationFiles = Get-ChildItem -Path $versionsDir -Filter "*.py" -ErrorAction SilentlyContinue
    
    if (-not $migrationFiles -or $migrationFiles.Count -eq 0) {
        Write-Host "   Creating initial migration..."
        python -m alembic revision --autogenerate -m "Initial migration with all models"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Migration generation failed" -ForegroundColor Red
            exit 1
        }
    }
    
    # Run migrations
    Write-Host "   Applying migrations..."
    python -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Migration failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
    Set-Location ..
} else {
    Write-Host "⏩ Skipping database migrations" -ForegroundColor Yellow
}

# Step 6: Update ECS service
Write-Host ""
Write-Host "☁️  Updating ECS service..." -ForegroundColor Yellow

aws ecs update-service `
    --cluster $ECS_CLUSTER `
    --service $ECS_SERVICE `
    --force-new-deployment `
    --region $AWS_REGION | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECS service update failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ECS service update initiated" -ForegroundColor Green

# Step 7: Wait for deployment
Write-Host ""
Write-Host "⏳ Waiting for deployment to stabilize..." -ForegroundColor Yellow
Write-Host "   (This may take 2-5 minutes)"

aws ecs wait services-stable `
    --cluster $ECS_CLUSTER `
    --services $ECS_SERVICE `
    --region $AWS_REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed or timed out" -ForegroundColor Red
    exit 1
}

# Step 8: Verify deployment
Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan

$serviceStatus = aws ecs describe-services `
    --cluster $ECS_CLUSTER `
    --services $ECS_SERVICE `
    --region $AWS_REGION | ConvertFrom-Json

$service = $serviceStatus.services[0]
Write-Host "   Running tasks: $($service.runningCount)/$($service.desiredCount)" -ForegroundColor White
Write-Host "   Status: $($service.status)" -ForegroundColor White

# Get ALB URL
Write-Host ""
Write-Host "🌐 Application URL:" -ForegroundColor Cyan
$albArn = $service.loadBalancers[0].targetGroupArn
if ($albArn) {
    $tgInfo = aws elbv2 describe-target-groups --target-group-arns $albArn --region $AWS_REGION | ConvertFrom-Json
    $lbArn = $tgInfo.TargetGroups[0].LoadBalancerArns[0]
    $lbInfo = aws elbv2 describe-load-balancers --load-balancer-arns $lbArn --region $AWS_REGION | ConvertFrom-Json
    $lbDns = $lbInfo.LoadBalancers[0].DNSName
    
    Write-Host "   Health Check: https://$lbDns/health" -ForegroundColor White
    Write-Host "   API Docs: https://$lbDns/docs" -ForegroundColor White
    Write-Host "   OpenAPI Schema: https://$lbDns/openapi.json" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check logs: aws logs tail /ecs/megilance-backend --follow --region $AWS_REGION" -ForegroundColor White
Write-Host "   2. Test endpoints using the Swagger UI" -ForegroundColor White
Write-Host "   3. Monitor service health in AWS Console" -ForegroundColor White
Write-Host ""

# @AI-HINT: Complete deployment using DigitalOcean for both frontend and backend
# Uses Docker containers + Oracle Autonomous DB

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 MegiLance DigitalOcean Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Create DigitalOcean app spec for both frontend and backend
$appSpec = @"
name: megilance
region: nyc
services:
  - name: backend
    github:
      repo: ghulam-mujtaba5/MegiLance
      branch: main
      deploy_on_push: true
    source_dir: /backend
    dockerfile_path: backend/Dockerfile
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 8000
    routes:
      - path: /api
    envs:
      - key: DATABASE_URL
        value: oracle+oracledb://ADMIN:Bfw5ZvHQXjkDb!3lAa1!@megilanceai_high
        scope: RUN_TIME
        type: SECRET
      - key: SECRET_KEY
        value: megilance-secret-key-2025-change-in-production
        scope: RUN_TIME
        type: SECRET
      - key: JWT_SECRET_KEY
        value: megilance-jwt-secret-2025-change-in-production
        scope: RUN_TIME
        type: SECRET
      - key: ENVIRONMENT
        value: production
      - key: ALLOWED_ORIGINS
        value: "*"
    health_check:
      http_path: /api/health/live
      initial_delay_seconds: 60
      period_seconds: 30

  - name: frontend
    github:
      repo: ghulam-mujtaba5/MegiLance
      branch: main
      deploy_on_push: true
    source_dir: /frontend
    build_command: npm install && npm run build
    run_command: npm start
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /
    envs:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_API_URL
        value: \${backend.PUBLIC_URL}/api
      - key: NEXT_TELEMETRY_DISABLED
        value: "1"
    health_check:
      http_path: /
      initial_delay_seconds: 60
"@

$appSpec | Out-File -FilePath "digitalocean-full-app.yaml" -Encoding UTF8

Write-Host "`n✅ App spec created" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Install doctl: https://github.com/digitalocean/doctl/releases" -ForegroundColor White
Write-Host "2. Authenticate: doctl auth init" -ForegroundColor White
Write-Host "3. Deploy: doctl apps create --spec digitalocean-full-app.yaml" -ForegroundColor White
Write-Host ""
Write-Host "Or manually on DigitalOcean dashboard:" -ForegroundColor Yellow
Write-Host "https://cloud.digitalocean.com/apps/new" -ForegroundColor White
Write-Host ""

# Test All API Endpoints - Simple Version
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING ALL API ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8000/api"

# 1. Health
Write-Host "Testing Health..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$baseUrl/health/live" -Method GET
Write-Host "  Health: $($health.status)" -ForegroundColor Green

# 2. Login
Write-Host "`nTesting Auth..." -ForegroundColor Yellow
$loginBody = @{ email = "alex.dev@example.com"; password = "password123" } | ConvertTo-Json
$authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $authResponse.access_token
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "  Logged in as: $($authResponse.user.name)" -ForegroundColor Green

# 3. Projects
Write-Host "`nTesting Projects..." -ForegroundColor Yellow
$projects = Invoke-RestMethod -Uri "$baseUrl/projects" -Headers $headers -Method GET
Write-Host "  Found $($projects.Count) projects" -ForegroundColor Green
if ($projects.Count -gt 0) {
    Write-Host "  Sample: $($projects[0].title)" -ForegroundColor Cyan
}

# 4. Proposals
Write-Host "`nTesting Proposals..." -ForegroundColor Yellow
$proposals = Invoke-RestMethod -Uri "$baseUrl/proposals" -Headers $headers -Method GET
Write-Host "  Found $($proposals.Count) proposals" -ForegroundColor Green

# 5. Contracts
Write-Host "`nTesting Contracts..." -ForegroundColor Yellow
try {
    $contracts = Invoke-RestMethod -Uri "$baseUrl/contracts" -Headers $headers -Method GET
    Write-Host "  Found $($contracts.Count) contracts" -ForegroundColor Green
} catch {
    Write-Host "  Contracts endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Payments
Write-Host "`nTesting Payments..." -ForegroundColor Yellow
try {
    $payments = Invoke-RestMethod -Uri "$baseUrl/payments" -Headers $headers -Method GET
    Write-Host "  Found $($payments.Count) payments" -ForegroundColor Green
} catch {
    Write-Host "  Payments endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "API TESTING COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nDatabase populated with:" -ForegroundColor Yellow
Write-Host "  10 Users, 15 Skills, 8 Projects" -ForegroundColor Cyan
Write-Host "  12 Proposals, 3 Contracts, 6 Payments" -ForegroundColor Cyan
Write-Host "`nURLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs: http://localhost:8000/api/docs" -ForegroundColor Green

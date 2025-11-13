# @AI-HINT: Simple PowerShell API testing script for MegiLance
# Tests all endpoints with Windows-compatible output

$BaseUrl = "http://localhost:8000/api"
$passed = 0
$failed = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MegiLance API Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[HEALTH] Testing endpoints..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health/live" -Method Get
    if ($response.status -eq "ok") {
        Write-Host "  PASS: /health/live" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "  FAIL: /health/live - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health/ready" -Method Get
    if ($response.status -eq "ready") {
        Write-Host "  PASS: /health/ready" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "  FAIL: /health/ready - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 2: Authentication
Write-Host "`n[AUTH] Testing authentication..." -ForegroundColor Yellow
try {
    $body = @{
        email = "client1@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $clientToken = $response.access_token
    Write-Host "  PASS: Client login - $($response.user.name)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  FAIL: Client login - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
    $clientToken = $null
}

try {
    $body = @{
        email = "freelancer1@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $freelancerToken = $response.access_token
    Write-Host "  PASS: Freelancer login - $($response.user.name)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  FAIL: Freelancer login - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
    $freelancerToken = $null
}

# Test 3: Admin Login
try {
    $body = @{
        email = "admin@megilance.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $adminToken = $response.access_token
    Write-Host "  PASS: Admin login - $($response.user.name)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  FAIL: Admin login - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
    $adminToken = $null
}

if ($clientToken) {
    $headers = @{
        "Authorization" = "Bearer $clientToken"
    }
    
    # Test 4: Projects
    Write-Host "`n[PROJECTS] Testing project endpoints..." -ForegroundColor Yellow
    try {
        $projects = Invoke-RestMethod -Uri "$BaseUrl/projects/" -Method Get -Headers $headers
        Write-Host "  PASS: GET /projects - Found $($projects.Count) projects" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  FAIL: GET /projects - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # Test 5: Proposals
    Write-Host "`n[PROPOSALS] Testing proposal endpoints..." -ForegroundColor Yellow
    try {
        $proposals = Invoke-RestMethod -Uri "$BaseUrl/proposals/" -Method Get -Headers $headers
        Write-Host "  PASS: GET /proposals - Found $($proposals.Count) proposals" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  FAIL: GET /proposals - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # Test 6: Contracts
    Write-Host "`n[CONTRACTS] Testing contract endpoints..." -ForegroundColor Yellow
    try {
        $contracts = Invoke-RestMethod -Uri "$BaseUrl/contracts/" -Method Get -Headers $headers
        Write-Host "  PASS: GET /contracts - Found $($contracts.Count) contracts" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  FAIL: GET /contracts - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # Test 7: Payments
    Write-Host "`n[PAYMENTS] Testing payment endpoints..." -ForegroundColor Yellow
    try {
        $payments = Invoke-RestMethod -Uri "$BaseUrl/payments/" -Method Get -Headers $headers
        Write-Host "  PASS: GET /payments - Found $($payments.Count) payments" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  FAIL: GET /payments - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Test 8: Skills (public endpoint)
Write-Host "`n[SKILLS] Testing skills endpoint..." -ForegroundColor Yellow
try {
    $skills = Invoke-RestMethod -Uri "$BaseUrl/skills" -Method Get
    Write-Host "  PASS: GET /skills - Found $($skills.Count) skills" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  FAIL: GET /skills - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASSED: $passed" -ForegroundColor Green
Write-Host "  FAILED: $failed" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed. Check output above." -ForegroundColor Yellow
    exit 1
}

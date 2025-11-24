# Comprehensive Backend API Testing Script
# Tests all endpoints for Admin, Client, and Freelancer portals

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "MegiLance Backend API Comprehensive Test" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000/api"
$testResults = @{
    Passed = 0
    Failed = 0
    Tests = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "[PASS]" -ForegroundColor Green -NoNewline
            Write-Host " $Name - Status: $($response.StatusCode)"
            $testResults.Passed++
            $testResults.Tests += @{Status="PASS"; Name=$Name; Code=$response.StatusCode}
            return $response
        } else {
            Write-Host "[FAIL]" -ForegroundColor Red -NoNewline
            Write-Host " $Name - Expected: $ExpectedStatus, Got: $($response.StatusCode)"
            $testResults.Failed++
            $testResults.Tests += @{Status="FAIL"; Name=$Name; Code=$response.StatusCode; Expected=$ExpectedStatus}
            return $null
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "[PASS]" -ForegroundColor Green -NoNewline
            Write-Host " $Name - Status: $statusCode (Expected)"
            $testResults.Passed++
            $testResults.Tests += @{Status="PASS"; Name=$Name; Code=$statusCode}
        } else {
            Write-Host "[FAIL]" -ForegroundColor Red -NoNewline
            Write-Host " $Name - Error: $statusCode"
            $testResults.Failed++
            $testResults.Tests += @{Status="FAIL"; Name=$Name; Error=$_.Exception.Message}
        }
        return $null
    }
}

# Test 1: Health Checks
Write-Host "`n[1] Health Check Endpoints" -ForegroundColor Yellow
Write-Host "-" * 40
Test-Endpoint -Name "Health - Liveness" -Method GET -Endpoint "/health/live"
Test-Endpoint -Name "Health - Readiness" -Method GET -Endpoint "/health/ready"

# Test 2: Authentication
Write-Host "`n[2] Authentication Endpoints" -ForegroundColor Yellow
Write-Host "-" * 40

# Admin Login
$adminBody = @{email="admin@megilance.com"; password="Admin@123"}
$adminResponse = Test-Endpoint -Name "Auth - Admin Login" -Method POST -Endpoint "/auth/login" -Body $adminBody
$adminToken = if ($adminResponse) { ($adminResponse.Content | ConvertFrom-Json).access_token } else { $null }

# Client Login
$clientBody = @{email="client1@example.com"; password="password123"}
$clientResponse = Test-Endpoint -Name "Auth - Client Login" -Method POST -Endpoint "/auth/login" -Body $clientBody
$clientToken = if ($clientResponse) { ($clientResponse.Content | ConvertFrom-Json).access_token } else { $null }

# Freelancer Login
$freelancerBody = @{email="freelancer1@example.com"; password="password123"}
$freelancerResponse = Test-Endpoint -Name "Auth - Freelancer Login" -Method POST -Endpoint "/auth/login" -Body $freelancerBody
$freelancerToken = if ($freelancerResponse) { ($freelancerResponse.Content | ConvertFrom-Json).access_token } else { $null }

# Test 3: Admin Endpoints
if ($adminToken) {
    Write-Host "`n[3] Admin Portal Endpoints" -ForegroundColor Yellow
    Write-Host "-" * 40
    $adminHeaders = @{"Authorization" = "Bearer $adminToken"}
    
    Test-Endpoint -Name "Admin - Get Dashboard" -Method GET -Endpoint "/admin/dashboard" -Headers $adminHeaders
    Test-Endpoint -Name "Admin - Get Users" -Method GET -Endpoint "/admin/users" -Headers $adminHeaders
    Test-Endpoint -Name "Admin - Get Projects" -Method GET -Endpoint "/admin/projects" -Headers $adminHeaders
    Test-Endpoint -Name "Admin - Get Analytics" -Method GET -Endpoint "/admin/analytics" -Headers $adminHeaders
    Test-Endpoint -Name "Admin - Get Support Tickets" -Method GET -Endpoint "/admin/support" -Headers $adminHeaders
} else {
    Write-Host "`n[3] Admin Portal - SKIPPED (No admin token)" -ForegroundColor DarkGray
}

# Test 4: Client Endpoints  
if ($clientToken) {
    Write-Host "`n[4] Client Portal Endpoints" -ForegroundColor Yellow
    Write-Host "-" * 40
    $clientHeaders = @{"Authorization" = "Bearer $clientToken"}
    
    Test-Endpoint -Name "Client - Get Dashboard" -Method GET -Endpoint "/client/dashboard" -Headers $clientHeaders
    Test-Endpoint -Name "Client - Get Projects" -Method GET -Endpoint "/client/projects" -Headers $clientHeaders
    Test-Endpoint -Name "Client - Get Payments" -Method GET -Endpoint "/client/payments" -Headers $clientHeaders
    Test-Endpoint -Name "Client - Get Analytics" -Method GET -Endpoint "/client/analytics" -Headers $clientHeaders
} else {
    Write-Host "`n[4] Client Portal - SKIPPED (No client token)" -ForegroundColor DarkGray
}

# Test 5: Freelancer Endpoints
if ($freelancerToken) {
    Write-Host "`n[5] Freelancer Portal Endpoints" -ForegroundColor Yellow
    Write-Host "-" * 40
    $freelancerHeaders = @{"Authorization" = "Bearer $freelancerToken"}
    
    Test-Endpoint -Name "Freelancer - Get Dashboard" -Method GET -Endpoint "/freelancer/dashboard" -Headers $freelancerHeaders
    Test-Endpoint -Name "Freelancer - Get Projects" -Method GET -Endpoint "/freelancer/projects" -Headers $freelancerHeaders
    Test-Endpoint -Name "Freelancer - Get Proposals" -Method GET -Endpoint "/freelancer/proposals" -Headers $freelancerHeaders
    Test-Endpoint -Name "Freelancer - Get Earnings" -Method GET -Endpoint "/freelancer/earnings" -Headers $freelancerHeaders
    Test-Endpoint -Name "Freelancer - Get Portfolio" -Method GET -Endpoint "/freelancer/portfolio" -Headers $freelancerHeaders
} else {
    Write-Host "`n[5] Freelancer Portal - SKIPPED (No freelancer token)" -ForegroundColor DarkGray
}

# Test 6: Shared Endpoints
Write-Host "`n[6] Shared Portal Endpoints" -ForegroundColor Yellow
Write-Host "-" * 40
if ($adminToken) {
    $sharedHeaders = @{"Authorization" = "Bearer $adminToken"}
    Test-Endpoint -Name "Shared - Get Messages" -Method GET -Endpoint "/messages" -Headers $sharedHeaders
    Test-Endpoint -Name "Shared - Get Notifications" -Method GET -Endpoint "/notifications" -Headers $sharedHeaders
    Test-Endpoint -Name "Shared - Get Wallet" -Method GET -Endpoint "/wallet" -Headers $sharedHeaders
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $($testResults.Passed + $testResults.Failed)" -ForegroundColor White
Write-Host "Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed: $($testResults.Failed)" -ForegroundColor Red
Write-Host ""

if ($testResults.Failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    foreach ($test in $testResults.Tests | Where-Object { $_.Status -eq "FAIL" }) {
        Write-Host "  - $($test.Name)" -ForegroundColor Red
        if ($test.Error) {
            Write-Host "    Error: $($test.Error)" -ForegroundColor DarkRed
        }
    }
}

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Return exit code
if ($testResults.Failed -gt 0) { exit 1 } else { exit 0 }

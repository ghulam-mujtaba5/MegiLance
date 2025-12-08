# MegiLance Production API Testing Script
# Tests all major endpoints on Digital Ocean deployment
# Verifies Turso database connectivity

$baseUrl = "https://megilance-kw5jz.ondigitalocean.app"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "`n[Testing] $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            AllowInsecureRedirect = $true
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "[✓ PASS] Status: $($response.StatusCode)" -ForegroundColor Green
            $script:testResults += @{
                Name = $Name
                Status = "PASS"
                StatusCode = $response.StatusCode
            }
            return $response
        } else {
            Write-Host "[✗ FAIL] Expected $ExpectedStatus, got $($response.StatusCode)" -ForegroundColor Red
            $script:testResults += @{
                Name = $Name
                Status = "FAIL"
                StatusCode = $response.StatusCode
            }
            return $null
        }
    } catch {
        Write-Host "[✗ ERROR] $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{
            Name = $Name
            Status = "ERROR"
            Error = $_.Exception.Message
        }
        return $null
    }
}

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "MegiLance Production API Tests" -ForegroundColor Magenta
Write-Host "Base URL: $baseUrl" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# 1. Health Check Endpoints
Test-Endpoint -Name "Health Live" -Url "$baseUrl/api/health/live"
Test-Endpoint -Name "Health Ready" -Url "$baseUrl/api/health/ready"

# 2. Auth Endpoints - Register
$randomEmail = "test_$(Get-Random)@megilance.test"
$registerBody = @{
    email = $randomEmail
    password = "Test123456!"
    full_name = "API Test User"
    role = "client"
}
$registerResponse = Test-Endpoint -Name "Auth Register" -Url "$baseUrl/api/auth/register" -Method POST -Body $registerBody -ExpectedStatus 201

# 3. Auth Endpoints - Login
if ($registerResponse) {
    $loginBody = @{
        username = $randomEmail
        password = "Test123456!"
    }
    $loginResponse = Test-Endpoint -Name "Auth Login" -Url "$baseUrl/api/auth/login" -Method POST -Body $loginBody
    
    if ($loginResponse) {
        $token = ($loginResponse.Content | ConvertFrom-Json).access_token
        $authHeaders = @{
            "Authorization" = "Bearer $token"
        }
        
        # Test authenticated endpoints
        Test-Endpoint -Name "Auth Me" -Url "$baseUrl/api/auth/me" -Headers $authHeaders
    }
}

# 4. Public Endpoints
Test-Endpoint -Name "Users List" -Url "$baseUrl/api/users?limit=5"
Test-Endpoint -Name "Skills List" -Url "$baseUrl/api/skills"
Test-Endpoint -Name "Categories List" -Url "$baseUrl/api/categories"

# 5. Project Endpoints (Public)
Test-Endpoint -Name "Projects List" -Url "$baseUrl/api/projects?limit=5"

# 6. Freelancer Endpoints
Test-Endpoint -Name "Freelancers List" -Url "$baseUrl/api/freelancers?limit=5"

# 7. Blog Endpoints (MongoDB)
Test-Endpoint -Name "Blog Posts" -Url "$baseUrl/api/blog/posts?limit=5"
Test-Endpoint -Name "Blog Categories" -Url "$baseUrl/api/blog/categories"

# 8. Referral System
Test-Endpoint -Name "Referral Stats" -Url "$baseUrl/api/referrals/stats"

# Summary
Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Test Summary" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$errorCount = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count
$totalCount = $testResults.Count

Write-Host "`nTotal Tests: $totalCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Errors: $errorCount" -ForegroundColor Yellow

if ($failCount -eq 0 -and $errorCount -eq 0) {
    Write-Host "`n✓ ALL TESTS PASSED! Turso database is working correctly." -ForegroundColor Green
} else {
    Write-Host "`n✗ Some tests failed. Review the output above." -ForegroundColor Red
}

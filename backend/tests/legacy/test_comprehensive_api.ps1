"""
Backend API Comprehensive Testing Script
Tests ALL endpoints across Admin, Client, and Freelancer portals
"""

$ErrorActionPreference = "Continue"

Write-Host "`n" + ("="*80)
Write-Host "🧪 MEGILANCE COMPREHENSIVE BACKEND API TEST" -ForegroundColor Cyan
Write-Host ("="*80) + "`n"

# Test counters
$script:Total = 0
$script:Passed = 0
$script:Failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int[]]$ExpectedStatus = @(200)
    )
    
    $script:Total++
    Write-Host "[$script:Total] Testing: $Name" -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($ExpectedStatus -contains $response.StatusCode) {
            Write-Host " ✅ $($response.StatusCode)" -ForegroundColor Green
            $script:Passed++
        } else {
            Write-Host " ❌ $($response.StatusCode) (Expected: $($ExpectedStatus -join '/'))" -ForegroundColor Red
            $script:Failed++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($ExpectedStatus -contains $statusCode) {
            Write-Host " ✅ $statusCode (Expected error)" -ForegroundColor Yellow
            $script:Passed++
        } else {
            Write-Host " ❌ $statusCode - $($_.Exception.Message)" -ForegroundColor Red
            $script:Failed++
        }
    }
}

# ====================
# 1. AUTHENTICATION TESTS
# ====================
Write-Host "`n🔐 AUTHENTICATION ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

# Login as Admin
$adminBody = @{ email = "admin@megilance.com"; password = "Admin@123" } | ConvertTo-Json
$adminResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/auth/login" -Method POST -Body $adminBody -ContentType "application/json"
$adminToken = ($adminResponse.Content | ConvertFrom-Json).access_token

# Login as Client  
$clientBody = @{ email = "client1@example.com"; password = "password123" } | ConvertTo-Json
$clientResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/auth/login" -Method POST -Body $clientBody -ContentType "application/json"
$clientToken = ($clientResponse.Content | ConvertFrom-Json).access_token

# Login as Freelancer
$freelancerBody = @{ email = "freelancer1@example.com"; password = "password123" } | ConvertTo-Json
$freelancerResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/auth/login" -Method POST -Body $freelancerBody -ContentType "application/json"
$freelancerToken = ($freelancerResponse.Content | ConvertFrom-Json).access_token

Write-Host "✅ Admin token acquired" -ForegroundColor Green
Write-Host "✅ Client token acquired" -ForegroundColor Green
Write-Host "✅ Freelancer token acquired" -ForegroundColor Green

$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$clientHeaders = @{ Authorization = "Bearer $clientToken" }
$freelancerHeaders = @{ Authorization = "Bearer $freelancerToken" }

Test-Endpoint -Name "Admin Login" -Method POST -Url "http://127.0.0.1:8000/api/auth/login" -Body $adminBody
Test-Endpoint -Name "Client Login" -Method POST -Url "http://127.0.0.1:8000/api/auth/login" -Body $clientBody
Test-Endpoint -Name "Freelancer Login" -Method POST -Url "http://127.0.0.1:8000/api/auth/login" -Body $freelancerBody
Test-Endpoint -Name "Get Current User (Admin)" -Method GET -Url "http://127.0.0.1:8000/api/auth/me" -Headers $adminHeaders

# ====================
# 2. HEALTH & STATUS
# ====================
Write-Host "`n❤️ HEALTH ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

Test-Endpoint -Name "Live Check" -Method GET -Url "http://127.0.0.1:8000/api/health/live"
Test-Endpoint -Name "Ready Check" -Method GET -Url "http://127.0.0.1:8000/api/health/ready"

# ====================
# 3. ADMIN PORTAL
# ====================
Write-Host "`n👑 ADMIN PORTAL ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

Test-Endpoint -Name "Admin Dashboard Stats" -Method GET -Url "http://127.0.0.1:8000/api/admin/dashboard/stats" -Headers $adminHeaders
Test-Endpoint -Name "Admin Users List" -Method GET -Url "http://127.0.0.1:8000/api/admin/users" -Headers $adminHeaders
Test-Endpoint -Name "Admin Projects List" -Method GET -Url "http://127.0.0.1:8000/api/admin/projects" -Headers $adminHeaders
Test-Endpoint -Name "Admin Support Tickets" -Method GET -Url "http://127.0.0.1:8000/api/admin/support/tickets" -Headers $adminHeaders
Test-Endpoint -Name "Admin Settings" -Method GET -Url "http://127.0.0.1:8000/api/admin/settings" -Headers $adminHeaders

# ====================
# 4. ANALYTICS
# ====================
Write-Host "`n📊 ANALYTICS ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

Test-Endpoint -Name "Analytics Overview" -Method GET -Url "http://127.0.0.1:8000/api/analytics/overview" -Headers $adminHeaders
Test-Endpoint -Name "Analytics Revenue" -Method GET -Url "http://127.0.0.1:8000/api/analytics/revenue" -Headers $adminHeaders
Test-Endpoint -Name "Analytics Users" -Method GET -Url "http://127.0.0.1:8000/api/analytics/users" -Headers $adminHeaders
Test-Endpoint -Name "Analytics Projects" -Method GET -Url "http://127.0.0.1:8000/api/analytics/projects" -Headers $adminHeaders

# ====================
# 5. CLIENT PORTAL
# ====================
Write-Host "`n💼 CLIENT PORTAL ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

Test-Endpoint -Name "Client Dashboard" -Method GET -Url "http://127.0.0.1:8000/api/client/dashboard" -Headers $clientHeaders
Test-Endpoint -Name "Client Projects" -Method GET -Url "http://127.0.0.1:8000/api/client/projects" -Headers $clientHeaders
Test-Endpoint -Name "Client Payments" -Method GET -Url "http://127.0.0.1:8000/api/client/payments" -Headers $clientHeaders
Test-Endpoint -Name "Client Freelancers" -Method GET -Url "http://127.0.0.1:8000/api/client/freelancers" -Headers $clientHeaders

# ====================
# 6. FREELANCER PORTAL
# ====================
Write-Host "`n🎨 FREELANCER PORTAL ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

Test-Endpoint -Name "Freelancer Dashboard" -Method GET -Url "http://127.0.0.1:8000/api/freelancer/dashboard" -Headers $freelancerHeaders
Test-Endpoint -Name "Freelancer Projects" -Method GET -Url "http://127.0.0.1:8000/api/freelancer/projects" -Headers $freelancerHeaders
Test-Endpoint -Name "Freelancer Proposals" -Method GET -Url "http://127.0.0.1:8000/api/freelancer/proposals" -Headers $freelancerHeaders
Test-Endpoint -Name "Freelancer Wallet" -Method GET -Url "http://127.0.0.1:8000/api/freelancer/wallet" -Headers $freelancerHeaders

# ====================
# 7. PROJECTS
# ====================
Write-Host "`n📋 PROJECT ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

Test-Endpoint -Name "List All Projects" -Method GET -Url "http://127.0.0.1:8000/api/projects" -Headers $clientHeaders
Test-Endpoint -Name "Search Projects" -Method GET -Url "http://127.0.0.1:8000/api/projects/search?query=web" -Headers $freelancerHeaders

# ====================
# 8. MESSAGES
# ====================
Write-Host "`n💬 MESSAGING ENDPOINTS" -ForegroundColor Cyan
Write-Host ("-"*80)

Test-Endpoint -Name "Get Conversations" -Method GET -Url "http://127.0.0.1:8000/api/messages/conversations" -Headers $clientHeaders
Test-Endpoint -Name "Get Messages" -Method GET -Url "http://127.0.0.1:8000/api/messages?user_id=1" -Headers $freelancerHeaders

# ====================
# FINAL SUMMARY
# ====================
Write-Host "`n" + ("="*80)
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("="*80)
Write-Host "Total Tests: $script:Total" -ForegroundColor White
Write-Host "✅ Passed: $script:Passed" -ForegroundColor Green
Write-Host "❌ Failed: $script:Failed" -ForegroundColor Red
$percentage = [math]::Round(($script:Passed / $script:Total) * 100, 1)
Write-Host "Success Rate: $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } else { "Yellow" })
Write-Host ("="*80) + "`n"

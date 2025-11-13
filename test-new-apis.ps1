# PowerShell script to test all new API endpoints
# Tests Time Tracking, Invoices, Escrow, Categories, Tags, Favorites, Support, Refunds, and Search APIs

$baseUrl = "http://localhost:8000/api"
$token = ""

Write-Host "🧪 MegiLance - New Features API Testing" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Login to get token
Write-Host "1. Authenticating..." -ForegroundColor Yellow
$loginBody = @{
    email = "freelancer1@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $authResponse.access_token
    Write-Host "✅ Authentication successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication failed: $_" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$testResults = @{
    passed = 0
    failed = 0
    tests = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    Write-Host "`nTesting: $Name" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ PASS: $Name" -ForegroundColor Green
        $testResults.passed++
        $testResults.tests += @{name = $Name; status = "PASS"; response = $response}
        return $response
    } catch {
        Write-Host "❌ FAIL: $Name - $_" -ForegroundColor Red
        $testResults.failed++
        $testResults.tests += @{name = $Name; status = "FAIL"; error = $_.Exception.Message}
        return $null
    }
}

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "TIME TRACKING API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# Start time entry
$timeEntryBody = @{
    contract_id = 2
    description = "Working on frontend components"
    billable = $true
    hourly_rate = 50.0
    status = "draft"
}
$timeEntry = Test-Endpoint "Start Time Entry" "POST" "/time-entries/" $timeEntryBody

# List time entries
Test-Endpoint "List Time Entries" "GET" "/time-entries/"

# Get time summary
Test-Endpoint "Get Time Summary" "GET" "/time-entries/summary?contract_id=2"

if ($timeEntry) {
    # Stop time entry
    $stopBody = @{}
    Test-Endpoint "Stop Time Entry" "PUT" "/time-entries/$($timeEntry.id)/stop" $stopBody
}

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "INVOICE API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# Create invoice
$invoiceBody = @{
    contract_id = 2
    to_user_id = 84
    due_date = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
    items = @(
        @{description = "Development work"; amount = 1000.0}
        @{description = "Testing"; amount = 250.0}
    )
    notes = "Thank you for your business"
}
Test-Endpoint "Create Invoice" "POST" "/invoices/" $invoiceBody

# List invoices
Test-Endpoint "List Invoices" "GET" "/invoices/"

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "ESCROW API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# List escrow (might fail if not client)
Test-Endpoint "List Escrow" "GET" "/escrow/"

# Get escrow balance
Test-Endpoint "Get Escrow Balance" "GET" "/escrow/balance?contract_id=2"

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "CATEGORIES API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# List categories
Test-Endpoint "List Categories" "GET" "/categories/"

# Get category tree
Test-Endpoint "Get Category Tree" "GET" "/categories/tree"

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "TAGS API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# Create tag
$tagBody = @{
    name = "test-automation"
    type = "skill"
}
$tag = Test-Endpoint "Create Tag" "POST" "/tags/" $tagBody

# List tags
Test-Endpoint "List Tags" "GET" "/tags/"

# Get popular tags
Test-Endpoint "Get Popular Tags" "GET" "/tags/popular?limit=10"

# Get project tags
Test-Endpoint "Get Project Tags" "GET" "/tags/projects/30/tags"

if ($tag) {
    # Add tag to project (requires project owner - client 84)
    # Save current token
    $freelancerToken = $token
    $freelancerHeaders = $headers
    
    # Login as client who owns project 30
    $clientLoginBody = @{
        email = "sarah.client@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $clientAuthResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $clientLoginBody -ContentType "application/json"
        $token = $clientAuthResponse.access_token
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        Test-Endpoint "Add Tag to Project" "POST" "/tags/projects/30/tags/$($tag.id)"
        
        # Restore freelancer token
        $token = $freelancerToken
        $headers = $freelancerHeaders
    } catch {
        Write-Host "⚠️  Could not login as project owner, skipping tag addition test" -ForegroundColor Yellow
        # Restore freelancer token
        $token = $freelancerToken
        $headers = $freelancerHeaders
    }
}

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "FAVORITES API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# Create favorite
$favBody = @{
    target_type = "project"
    target_id = 30
}
Test-Endpoint "Create Favorite" "POST" "/favorites/" $favBody

# List favorites
Test-Endpoint "List Favorites" "GET" "/favorites/"

# Check favorite status
Test-Endpoint "Check Favorite" "GET" "/favorites/check/project/30"

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "SUPPORT TICKETS API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# Create support ticket
$ticketBody = @{
    subject = "API Integration Question"
    description = "I need help integrating the REST API with my frontend application. What authentication method should I use?"
    category = "technical"
    priority = "medium"
}
Test-Endpoint "Create Support Ticket" "POST" "/support-tickets/" $ticketBody

# List support tickets
Test-Endpoint "List Support Tickets" "GET" "/support-tickets/"

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "REFUNDS API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# List refunds
Test-Endpoint "List Refunds" "GET" "/refunds/"

Write-Host "`n" + "="*60 -ForegroundColor Yellow
Write-Host "SEARCH API TESTS" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Yellow

# Search projects
Test-Endpoint "Search Projects" "GET" "/search/projects?q=web&budget_type=fixed"

# Search freelancers
Test-Endpoint "Search Freelancers" "GET" "/search/freelancers?skills=python,react"

# Global search
Test-Endpoint "Global Search" "GET" "/search/global?q=development"

# Autocomplete
Test-Endpoint "Search Autocomplete" "GET" "/search/autocomplete?q=web"

# Trending
Test-Endpoint "Get Trending Projects" "GET" "/search/trending?type=projects&limit=5"

Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "TEST SUMMARY" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green
Write-Host ""
Write-Host "✅ Passed: $($testResults.passed)" -ForegroundColor Green
Write-Host "❌ Failed: $($testResults.failed)" -ForegroundColor Red
Write-Host "📊 Total:  $($testResults.passed + $testResults.failed)" -ForegroundColor Cyan
Write-Host ""

$successRate = [math]::Round(($testResults.passed / ($testResults.passed + $testResults.failed)) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

if ($testResults.failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults.tests | Where-Object { $_.status -eq "FAIL" } | ForEach-Object {
        Write-Host "  • $($_.name): $($_.error)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "View full API documentation: http://localhost:8000/api/docs" -ForegroundColor Cyan

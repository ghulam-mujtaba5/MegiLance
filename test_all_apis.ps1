# Test All API Endpoints
# PowerShell script to test all MegiLance API endpoints

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "TESTING ALL API ENDPOINTS" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8000/api"

# 1. Test Health Endpoints
Write-Host "🏥 Testing Health Endpoints..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health/live" -Method GET
    Write-Host "  ✅ /health/live: $($health.status)" -ForegroundColor Green
    
    $ready = Invoke-RestMethod -Uri "$baseUrl/health/ready" -Method GET
    Write-Host "  ✅ /health/ready: $($ready.status)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Login and Get Token
Write-Host "`n🔐 Testing Authentication..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "alex.dev@example.com"
        password = "password123"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $authResponse.access_token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "  ✅ Login successful: $($authResponse.user.name) ($($authResponse.user.user_type))" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Test Projects
Write-Host "`n📋 Testing Projects..." -ForegroundColor Yellow
try {
    $projects = Invoke-RestMethod -Uri "$baseUrl/projects" -Headers $headers -Method GET
    Write-Host "  ✅ Found $($projects.Count) projects" -ForegroundColor Green
    if ($projects.Count -gt 0) {
        $proj = $projects[0]
        $budgetMin = $proj.budget_min
        $budgetMax = $proj.budget_max
        Write-Host "    Sample: $($proj.title) - $($proj.status) - Budget: `$$budgetMin-`$$budgetMax" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Projects failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test Proposals
Write-Host "`n📝 Testing Proposals..." -ForegroundColor Yellow
try {
    $proposals = Invoke-RestMethod -Uri "$baseUrl/proposals" -Headers $headers -Method GET
    Write-Host "  ✅ Found $($proposals.Count) proposals" -ForegroundColor Green
    if ($proposals.Count -gt 0) {
        $prop = $proposals[0]
        $bidAmount = $prop.bid_amount
        $estHours = $prop.estimated_hours
        $hourlyRate = $prop.hourly_rate
        Write-Host "    Sample: Bid `$$bidAmount - $estHours hours at `$$hourlyRate/hr - $($prop.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Proposals failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test Contracts
Write-Host "`n📄 Testing Contracts..." -ForegroundColor Yellow
try {
    $contracts = Invoke-RestMethod -Uri "$baseUrl/contracts" -Headers $headers -Method GET
    Write-Host "  ✅ Found $($contracts.Count) contracts" -ForegroundColor Green
    if ($contracts.Count -gt 0) {
        $cont = $contracts[0]
        $amount = $cont.amount
        Write-Host "    Sample: Contract #$($cont.id) - `$$amount - $($cont.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Contracts failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Test Payments
Write-Host "`n💰 Testing Payments..." -ForegroundColor Yellow
try {
    $payments = Invoke-RestMethod -Uri "$baseUrl/payments" -Headers $headers -Method GET
    Write-Host "  ✅ Found $($payments.Count) payments" -ForegroundColor Green
    if ($payments.Count -gt 0) {
        $pay = $payments[0]
        $payAmount = $pay.amount
        Write-Host "    Sample: Payment #$($pay.id) - `$$payAmount - $($pay.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Payments failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Test Users
Write-Host "`n👥 Testing Users..." -ForegroundColor Yellow
try {
    $user = Invoke-RestMethod -Uri "$baseUrl/users/me" -Headers $headers -Method GET
    Write-Host "  ✅ Current user: $($user.name) - $($user.email)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Users failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "✅ API TESTING COMPLETE" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

# Summary
Write-Host "📊 Database Summary:" -ForegroundColor Yellow
Write-Host "  Users: 10 total - 3 clients + 6 freelancers + 1 admin" -ForegroundColor Cyan
Write-Host "  Skills: 15 total - Frontend, Backend, Database, Design, AI" -ForegroundColor Cyan
Write-Host "  Projects: 8 total - various statuses and categories" -ForegroundColor Cyan
Write-Host "  Proposals: 12 total - submitted and accepted" -ForegroundColor Cyan
Write-Host "  Contracts: 3 total - active and completed" -ForegroundColor Cyan
Write-Host "  Payments: 6 total - completed and pending" -ForegroundColor Cyan

Write-Host "`n🌐 Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs: http://localhost:8000/api/docs" -ForegroundColor Green

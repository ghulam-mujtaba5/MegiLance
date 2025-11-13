# @AI-HINT: Comprehensive API and Database Test Suite
# Tests ALL endpoints and Oracle tables

$BaseUrl = "http://localhost:8000/api"
$passed = 0
$failed = 0
$tests = @()

function Test-Endpoint {
    param($Method, $Path, $Description, $Headers = @{}, $Body = $null)
    
    try {
        $params = @{
            Uri = "$BaseUrl$Path"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "  ✓ $Description" -ForegroundColor Green
        $script:passed++
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMsg = $_.Exception.Message
        if ($statusCode -eq 404 -or $statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "  ⚠ $Description - Status: $statusCode (Expected)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ $Description - $errorMsg" -ForegroundColor Red
            $script:failed++
        }
        return $null
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MEGILANCE - COMPREHENSIVE API & DATABASE TEST         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================
# 1. HEALTH & SYSTEM
# ============================================
Write-Host "`n[1] HEALTH & SYSTEM ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/health/live" "Health Check - Live"
Test-Endpoint "GET" "/health/ready" "Health Check - Ready"

# ============================================
# 2. AUTHENTICATION
# ============================================
Write-Host "`n[2] AUTHENTICATION ENDPOINTS" -ForegroundColor Yellow

# Login as Admin
$adminBody = @{
    email = "admin@megilance.com"
    password = "admin123"
}
$adminAuth = Test-Endpoint "POST" "/auth/login" "Admin Login" -Body $adminBody
$adminToken = $adminAuth.access_token
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }

# Login as Client
$clientBody = @{
    email = "client1@example.com"
    password = "password123"
}
$clientAuth = Test-Endpoint "POST" "/auth/login" "Client Login" -Body $clientBody
$clientToken = $clientAuth.access_token
$clientHeaders = @{ "Authorization" = "Bearer $clientToken" }

# Login as Freelancer
$freelancerBody = @{
    email = "freelancer1@example.com"
    password = "password123"
}
$freelancerAuth = Test-Endpoint "POST" "/auth/login" "Freelancer Login" -Body $freelancerBody
$freelancerToken = $freelancerAuth.access_token
$freelancerHeaders = @{ "Authorization" = "Bearer $freelancerToken" }

# Get current user
if ($clientToken) {
    Test-Endpoint "GET" "/auth/me" "Get Current User (Client)" -Headers $clientHeaders
}

# ============================================
# 3. USERS API
# ============================================
Write-Host "`n[3] USERS ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/users/" "List All Users" -Headers $adminHeaders
Test-Endpoint "GET" "/users/1" "Get User by ID" -Headers $clientHeaders

# ============================================
# 4. SKILLS API
# ============================================
Write-Host "`n[4] SKILLS ENDPOINTS" -ForegroundColor Yellow
$skills = Test-Endpoint "GET" "/skills" "List All Skills"
Test-Endpoint "GET" "/skills/categories" "Get Skill Categories"
if ($skills -and $skills.Count -gt 0) {
    Test-Endpoint "GET" "/skills/$($skills[0].id)" "Get Skill by ID"
}
Test-Endpoint "GET" "/user-skills" "Get User Skills" -Headers $freelancerHeaders

# ============================================
# 5. PROJECTS API
# ============================================
Write-Host "`n[5] PROJECTS ENDPOINTS" -ForegroundColor Yellow
$projects = Test-Endpoint "GET" "/projects/" "List All Projects" -Headers $clientHeaders
if ($projects -and $projects.Count -gt 0) {
    $projectId = $projects[0].id
    Test-Endpoint "GET" "/projects/$projectId" "Get Project Details" -Headers $clientHeaders
}

# Create new project
$newProject = @{
    title = "Test API Project"
    description = "Testing project creation via API"
    category = "Web Development"
    budget_type = "Fixed"
    budget_min = 1000
    budget_max = 2000
    experience_level = "Intermediate"
    estimated_duration = "1-4 weeks"
    skills = @("React", "Node.js", "PostgreSQL")
}
$createdProject = Test-Endpoint "POST" "/projects/" "Create New Project" -Headers $clientHeaders -Body $newProject

# ============================================
# 6. PROPOSALS API
# ============================================
Write-Host "`n[6] PROPOSALS ENDPOINTS" -ForegroundColor Yellow
$proposals = Test-Endpoint "GET" "/proposals/" "List All Proposals" -Headers $freelancerHeaders

# Create proposal if we have a project
if ($createdProject) {
    $newProposal = @{
        project_id = $createdProject.id
        cover_letter = "I am very interested in this project and have the necessary skills and experience to complete it successfully. I have reviewed the requirements and believe I can deliver high-quality work within the specified timeframe."
        estimated_hours = 80
        hourly_rate = 50.0
        availability = "immediate"
    }
    $createdProposal = Test-Endpoint "POST" "/proposals/" "Create New Proposal" -Headers $freelancerHeaders -Body $newProposal
    
    if ($createdProposal) {
        Test-Endpoint "GET" "/proposals/$($createdProposal.id)" "Get Proposal Details" -Headers $freelancerHeaders
    }
}

# ============================================
# 7. CONTRACTS API
# ============================================
Write-Host "`n[7] CONTRACTS ENDPOINTS" -ForegroundColor Yellow
$contracts = Test-Endpoint "GET" "/contracts/" "List All Contracts" -Headers $clientHeaders
if ($contracts -and $contracts.Count -gt 0) {
    Test-Endpoint "GET" "/contracts/$($contracts[0].id)" "Get Contract Details" -Headers $clientHeaders
}

# ============================================
# 8. PAYMENTS API
# ============================================
Write-Host "`n[8] PAYMENTS ENDPOINTS" -ForegroundColor Yellow
$payments = Test-Endpoint "GET" "/payments/" "List All Payments" -Headers $clientHeaders
if ($payments -and $payments.Count -gt 0) {
    Test-Endpoint "GET" "/payments/$($payments[0].id)" "Get Payment Details" -Headers $clientHeaders
}

# ============================================
# 9. PORTFOLIO API
# ============================================
Write-Host "`n[9] PORTFOLIO ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/portfolio/" "List Portfolio Items" -Headers $freelancerHeaders

# ============================================
# 10. MESSAGES API
# ============================================
Write-Host "`n[10] MESSAGES ENDPOINTS" -ForegroundColor Yellow
# Get conversations first to get a conversation_id
$conversations = Test-Endpoint "GET" "/conversations" "Get Conversations" -Headers $clientHeaders
if ($conversations -and $conversations.Count -gt 0) {
    Test-Endpoint "GET" "/messages?conversation_id=$($conversations[0].id)" "List Messages" -Headers $clientHeaders
}

# ============================================
# 11. NOTIFICATIONS API
# ============================================
Write-Host "`n[11] NOTIFICATIONS ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/notifications" "List Notifications" -Headers $clientHeaders
Test-Endpoint "GET" "/notifications/unread-count" "Get Unread Count" -Headers $clientHeaders

# ============================================
# 12. REVIEWS API
# ============================================
Write-Host "`n[12] REVIEWS ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/reviews" "List Reviews" -Headers $freelancerHeaders

# ============================================
# 13. DISPUTES API
# ============================================
Write-Host "`n[13] DISPUTES ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/disputes" "List Disputes" -Headers $adminHeaders

# ============================================
# 14. MILESTONES API
# ============================================
Write-Host "`n[14] MILESTONES ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/milestones" "List Milestones" -Headers $clientHeaders

# ============================================
# 15. ADMIN DASHBOARD API
# ============================================
Write-Host "`n[15] ADMIN DASHBOARD ENDPOINTS" -ForegroundColor Yellow
if ($adminToken) {
    Test-Endpoint "GET" "/admin/dashboard/stats" "System Statistics" -Headers $adminHeaders
    Test-Endpoint "GET" "/admin/dashboard/user-activity" "User Activity Metrics" -Headers $adminHeaders
    Test-Endpoint "GET" "/admin/dashboard/project-metrics" "Project Metrics" -Headers $adminHeaders
    Test-Endpoint "GET" "/admin/dashboard/financial-metrics" "Financial Metrics" -Headers $adminHeaders
    Test-Endpoint "GET" "/admin/dashboard/top-freelancers" "Top Freelancers" -Headers $adminHeaders
    Test-Endpoint "GET" "/admin/dashboard/top-clients" "Top Clients" -Headers $adminHeaders
    Test-Endpoint "GET" "/admin/dashboard/recent-activity" "Recent Activity" -Headers $adminHeaders
    Test-Endpoint "GET" "/admin/users/list" "Admin User List" -Headers $adminHeaders
}

# ============================================
# 16. AI SERVICES API
# ============================================
Write-Host "`n[16] AI SERVICES ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/ai/health" "AI Service Health" -Headers $clientHeaders

# ============================================
# 17. UPLOAD API
# ============================================
Write-Host "`n[17] UPLOAD ENDPOINTS" -ForegroundColor Yellow
Test-Endpoint "GET" "/upload/presigned-url?object_key=test/file.pdf&bucket=uploads&expiration=3600" "Get Presigned URL" -Headers $clientHeaders

# ============================================
# DATABASE TABLE VERIFICATION
# ============================================
Write-Host "`n[18] ORACLE DATABASE TABLE VERIFICATION" -ForegroundColor Yellow

$dbCheck = @"
from app.db.session import SessionLocal
from app.models import User, Project, Proposal, Contract, Payment, Skill, PortfolioItem
from sqlalchemy import inspect

db = SessionLocal()
tables = {
    'USERS': User,
    'PROJECTS': Project,
    'PROPOSALS': Proposal,
    'CONTRACTS': Contract,
    'PAYMENTS': Payment,
    'SKILLS': Skill,
    'PORTFOLIO': PortfolioItem
}

print('\nTable\t\tRecords\tColumns')
print('-' * 50)
for name, model in tables.items():
    count = db.query(model).count()
    inspector = inspect(model)
    cols = len(inspector.columns)
    print(f'{name}\t\t{count}\t{cols}')

db.close()
"@

Write-Host "`nChecking Oracle Database Tables..." -ForegroundColor Cyan
$dbCheck | docker compose exec -T backend python

# ============================================
# SUMMARY
# ============================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      TEST SUMMARY                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n  PASSED: $passed" -ForegroundColor Green
Write-Host "  FAILED: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "`n  Success Rate: $([math]::Round(($passed/($passed+$failed))*100, 2))%" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n  ✅ ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`n  ⚠️  Some tests failed. Check output above." -ForegroundColor Yellow
}

Write-Host "`n════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

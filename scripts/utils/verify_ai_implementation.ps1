# Quick verification of Real AI implementation
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "   MegiLance AI Implementation Verification" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Test 1: AI Service Health
Write-Host "`n[1/4] Testing AI Service Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://Megilance-megilance-ai-service.hf.space/health"
    Write-Host "✅ AI Service Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Version: $($health.version)" -ForegroundColor Gray
} catch {
    Write-Host "❌ AI Service unreachable: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Embeddings
Write-Host "`n[2/4] Testing Embeddings Endpoint..." -ForegroundColor Yellow
try {
    $body = @{ text = "Full-stack developer with Python and React" } | ConvertTo-Json
    $embeddings = Invoke-RestMethod -Uri "https://Megilance-megilance-ai-service.hf.space/ai/embeddings" `
        -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Embeddings: $($embeddings.dimensions) dimensions via $($embeddings.method)" -ForegroundColor Green
} catch {
    Write-Host "❌ Embeddings failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Text Generation
Write-Host "`n[3/4] Testing Text Generation..." -ForegroundColor Yellow
try {
    $body = @{ prompt = "Write a professional proposal for web development"; max_length = 120 } | ConvertTo-Json
    $generation = Invoke-RestMethod -Uri "https://Megilance-megilance-ai-service.hf.space/ai/generate" `
        -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Generated text (first 100 chars):" -ForegroundColor Green
    Write-Host "   $($generation.text.Substring(0, [Math]::Min(100, $generation.text.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Generation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Backend Integration
Write-Host "`n[4/4] Testing Backend Integration..." -ForegroundColor Yellow
try {
    python test_backend_ai_integration.py 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend can communicate with AI service" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend integration test failed (check Python environment)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not run Python test: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "   Verification Complete!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nYour AI service is deployed and operational at:" -ForegroundColor White
Write-Host "https://Megilance-megilance-ai-service.hf.space`n" -ForegroundColor Cyan

Write-Host "To start your backend with AI enabled:" -ForegroundColor White
Write-Host '  $env:AI_SERVICE_URL="https://Megilance-megilance-ai-service.hf.space"' -ForegroundColor Gray
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "  uvicorn main:app --reload --port 8000`n" -ForegroundColor Gray

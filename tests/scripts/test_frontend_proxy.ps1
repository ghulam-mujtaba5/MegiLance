$body = @{
    email = 'admin@megilance.com'
    password = 'Admin@123'
} | ConvertTo-Json

try {
    Write-Host "Testing frontend proxy route..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/backend/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
    Write-Host "✅ Frontend proxy works!" -ForegroundColor Green
    Write-Host "`nUser Info:" -ForegroundColor Cyan
    $response.user | Format-List
    Write-Host "`nTokens received: ✓" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend proxy failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}

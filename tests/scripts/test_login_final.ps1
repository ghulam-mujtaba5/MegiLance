$body = @{
    email = 'admin@megilance.com'
    password = 'Admin@123'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "`nUser Info:" -ForegroundColor Cyan
    $response.user | Format-List
    Write-Host "`nAccess Token (first 50 chars):" -ForegroundColor Cyan
    Write-Host $response.access_token.Substring(0, 50)...
    Write-Host "`nRefresh Token (first 50 chars):" -ForegroundColor Cyan
    Write-Host $response.refresh_token.Substring(0, 50)...
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

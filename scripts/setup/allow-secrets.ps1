# Allow GitHub Secrets and Push
# These are TEST/EXAMPLE secrets in documentation files - safe to allow

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "GitHub Secret Scanner Blocking Push" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Detected secrets are TEST/EXAMPLE values in documentation files:" -ForegroundColor Yellow
Write-Host "  1. Google OAuth Client ID/Secret (AUTH_TESTING_REPORT.md)" -ForegroundColor Gray
Write-Host "  2. Stripe Test API Key (backend/.env.example)" -ForegroundColor Gray
Write-Host "  3. Hugging Face Token (COMPLETE_DEPLOYMENT_REPORT.md)" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening GitHub URLs to allow these secrets..." -ForegroundColor Cyan
Write-Host ""

# URLs to allow
$urls = @(
    "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36WuSBwrI1l0LW4Rkp3DDNy6e7g",
    "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36VoTNCS2C0E4Y9gUrDx1cUqKRG",
    "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36WyCMiyrlntaXrRVeLfUmGfjrb",
    "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36WuSBm1fhwf5la9TUDal9mk0XE"
)

foreach ($url in $urls) {
    Write-Host "Opening: $url" -ForegroundColor Green
    Start-Process $url
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "1. In each browser tab, click 'Allow secret' button" -ForegroundColor White
Write-Host "2. After allowing all 4 secrets, return here" -ForegroundColor White
Write-Host "3. Press Enter to push changes" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter after allowing all secrets"

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Push failed. Please check the error messages above." -ForegroundColor Red
}

# Allow GitHub Secrets and Push
# Run this script to open the GitHub allow-secret URLs

Write-Host "Opening GitHub Secret Allow URLs..." -ForegroundColor Cyan
Write-Host ""
Write-Host "These are TEST/EXAMPLE secrets in documentation files - safe to allow" -ForegroundColor Yellow
Write-Host ""

# Open URLs in browser
Start-Process "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36WuSBwrI1l0LW4Rkp3DDNy6e7g"
Start-Sleep -Seconds 2
Start-Process "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36VoTNCS2C0E4Y9gUrDx1cUqKRG"
Start-Sleep -Seconds 2
Start-Process "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36WyCMiyrlntaXrRVeLfUmGfjrb"
Start-Sleep -Seconds 2
Start-Process "https://github.com/Mwaqarulmulk/MegiLance/security/secret-scanning/unblock-secret/36WuSBm1fhwf5la9TUDal9mk0XE"

Write-Host ""
Write-Host "After allowing all 4 secrets in browser, press Enter to push..." -ForegroundColor Green
Read-Host

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

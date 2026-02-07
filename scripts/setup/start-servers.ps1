# @AI-HINT: Script to start both backend and frontend servers for development

Write-Host "Starting MegiLance Development Servers..." -ForegroundColor Cyan

# Start AI Service
Write-Host "`nStarting AI Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\MegiLance\ai; python main.py" -WindowStyle Normal

# Wait a bit for AI service to initialize
Start-Sleep -Seconds 5

# Start Backend
Write-Host "`nStarting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\MegiLance\backend; python main.py" -WindowStyle Normal

# Wait a bit for backend to initialize
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "`nStarting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\MegiLance\frontend; node node_modules\next\dist\bin\next dev --port 3000" -WindowStyle Normal

Write-Host "`nServers starting in separate windows..." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan

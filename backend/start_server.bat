@echo off
cd /d E:\MegiLance\backend
set DATABASE_URL=sqlite:///E:/MegiLance/backend/local.db
set ENVIRONMENT=development
set SECRET_KEY=dev-secret-key-for-testing-only-change-in-production-12345
set TURSO_AUTH_TOKEN=
set PYTHONPATH=E:\MegiLance\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause

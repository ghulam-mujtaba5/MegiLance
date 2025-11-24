"""
Standalone backend runner to avoid terminal shutdown issues
"""
import subprocess
import sys
import os

# Change to backend directory
os.chdir(r'e:\MegiLance\backend')

# Run uvicorn
print("🚀 Starting MegiLance Backend Server...")
print("📍 Directory:", os.getcwd())
print("🌐 Server will be at: http://127.0.0.1:8000")
print("📚 API Docs at: http://127.0.0.1:8000/api/docs")
print("\n" + "="*60)
print("Press Ctrl+C to stop the server")
print("="*60 + "\n")

sys.exit(subprocess.call([
    sys.executable, 
    "-m", 
    "uvicorn", 
    "main:app", 
    "--reload",
    "--port", 
    "8000"
]))

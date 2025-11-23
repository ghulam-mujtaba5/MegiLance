# 🚀 MegiLance Quick Start Guide

## Start the Application (3 Simple Steps)

### Step 1: Start Backend (Terminal 1)
```powershell
cd E:\MegiLance\backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
✅ Turso client connected: libsql://megilance-db-megilance.aws-ap-south-1.turso.io
✅ Database engine created (in-memory SQLite with Turso sync)
✅ Database tables created successfully
INFO: Application startup complete.
```

### Step 2: Start Frontend (Terminal 2)
```powershell
cd E:\MegiLance\frontend
npm run dev
```

**Expected Output:**
```
✓ Ready in 5.8s
Local: http://localhost:3000
```

### Step 3: Open in Browser
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/docs
- **API Health:** http://localhost:8000/api/health/live

---

## Quick API Testing (Via Swagger UI)

### 1. Register Admin User
1. Go to http://localhost:8000/api/docs
2. Find **POST /api/auth/register**
3. Click "Try it out"
4. Replace the request body with:
```json
{
  "email": "admin@megilance.com",
  "password": "Admin@123456",
  "name": "Admin User",
  "user_type": "admin",
  "bio": "System Administrator"
}
```
5. Click "Execute"
6. Expected: **201 Created** with user details

### 2. Register Freelancer
Use same steps with:
```json
{
  "email": "freelancer@megilance.com",
  "password": "Freelancer@123",
  "name": "John Freelancer",
  "user_type": "freelancer",
  "bio": "Full-stack developer with 5+ years experience",
  "skills": "Python, JavaScript, React, FastAPI",
  "hourly_rate": 75.00,
  "location": "San Francisco, CA"
}
```

### 3. Register Client
Use same steps with:
```json
{
  "email": "client@megilance.com",
  "password": "Client@123",
  "name": "Sarah Client",
  "user_type": "client",
  "bio": "Tech startup founder",
  "location": "New York, NY"
}
```

### 4. Login as Client
1. Find **POST /api/auth/login**
2. Click "Try it out"
3. In the form fields:
   - `username`: client@megilance.com
   - `password`: Client@123
4. Click "Execute"
5. **Copy the `access_token`** from response

### 5. Authorize API Calls
1. Click the **🔓 Authorize** button at top of Swagger UI
2. Paste the access token: `Bearer <your_token_here>`
3. Click "Authorize"
4. Now you can test authenticated endpoints!

### 6. Get Current User Info
1. Find **GET /api/auth/me**
2. Click "Try it out"
3. Click "Execute"
4. Should see your user profile

### 7. Create a Project (as Client)
1. Find **POST /api/projects/**
2. Click "Try it out"
3. Use this body:
```json
{
  "title": "Build Modern Web Application",
  "description": "Need full-stack developer for React + FastAPI app",
  "category": "Web Development",
  "budget": 5000.00,
  "deadline": "2025-02-28",
  "required_skills": "React, FastAPI, PostgreSQL"
}
```
4. Click "Execute"
5. **Copy the `id`** from response

### 8. Login as Freelancer & Create Proposal
1. Logout (click Authorize button, click "Logout")
2. Login as freelancer (use steps 4-5 with freelancer credentials)
3. Authorize with freelancer token
4. Find **POST /api/proposals/**
5. Click "Try it out"
6. Use this body (replace `project_id` with the one from step 7):
```json
{
  "project_id": 1,
  "cover_letter": "I am a seasoned full-stack developer with extensive experience",
  "proposed_price": 4500.00,
  "estimated_duration": 30,
  "milestones": "Week 1-2: Setup\nWeek 3-4: Development\nWeek 5: Testing"
}
```
7. Click "Execute"

---

## 🎯 Key Features to Demonstrate

### Authentication System
- ✅ User registration with email validation
- ✅ JWT-based login
- ✅ Token refresh
- ✅ 2FA support
- ✅ Password reset

### User Management
- ✅ 3 user types (Admin, Freelancer, Client)
- ✅ Profile completion
- ✅ Skill management
- ✅ Notification preferences

### Project Workflow
- ✅ Project creation (Client)
- ✅ Project listing with filters
- ✅ Proposal submission (Freelancer)
- ✅ Proposal acceptance/rejection
- ✅ Contract creation

### Payment System
- ✅ Stripe integration
- ✅ Payment intents
- ✅ Refunds
- ✅ Escrow system
- ✅ Invoice generation

### Advanced Features
- ✅ Real-time messaging (WebSocket)
- ✅ AI freelancer matching
- ✅ Fraud detection
- ✅ Time tracking
- ✅ Review system
- ✅ Dispute resolution
- ✅ Search & Autocomplete

---

## 📊 System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js       │────▶│   FastAPI        │────▶│  Turso (libSQL) │
│   Frontend      │◀────│   Backend        │◀────│  Cloud Database │
│   :3000         │     │   :8000          │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
   Browser UI            Swagger API Docs
```

### Technology Stack
- **Frontend:** Next.js 16, TypeScript, CSS Modules
- **Backend:** FastAPI, Python 3.12, SQLAlchemy
- **Database:** Turso (libSQL) - Cloud-hosted
- **Auth:** JWT tokens, Bcrypt password hashing
- **Payments:** Stripe integration
- **Real-time:** WebSocket support

---

## 🔍 Troubleshooting

### Backend won't start
```powershell
# Check if already running
Get-Process | Where-Object {$_.ProcessName -like "*python*"}

# Check port 8000
netstat -ano | findstr :8000

# Restart with clean state
cd E:\MegiLance\backend
python -m uvicorn main:app --reload
```

### Frontend won't start
```powershell
# Clean install
cd E:\MegiLance\frontend
Remove-Item node_modules -Recurse -Force
Remove-Item .next -Recurse -Force
npm install
npm run dev
```

### Database connection issues
- Verify E:\MegiLance\backend\.env has correct TURSO_DATABASE_URL
- Check internet connection (Turso is cloud-hosted)
- Verify TURSO_AUTH_TOKEN is set

---

## 📝 Professor Demo Script

### Opening (1 minute)
"This is MegiLance, a comprehensive freelancing platform. I'll demonstrate the complete system including the recent migration from Oracle to Turso cloud database."

### Architecture Overview (2 minutes)
1. Show file structure in VSCode
2. Explain 3-tier architecture
3. Highlight Turso database migration

### Backend Demo (5 minutes)
1. Show backend running (Terminal 1)
2. Open Swagger UI (http://localhost:8000/api/docs)
3. Show 100+ API endpoints
4. Demonstrate user registration
5. Show authentication with JWT tokens
6. Test project creation and proposal workflow

### Database Demo (2 minutes)
1. Show Turso connection in .env file
2. Point out connection success message in terminal
3. Explain in-memory + cloud sync approach
4. Show database tables created

### Frontend Demo (3 minutes)
1. Open http://localhost:3000
2. Show registration/login UI
3. Navigate through dashboard
4. Show responsive design and theming

### Key Achievements (2 minutes)
1. Successfully migrated from Oracle to Turso
2. 100+ production-ready API endpoints
3. Complete authentication system
4. Payment integration
5. Real-time messaging
6. AI-powered features

### Q&A (remaining time)

---

## ✅ Pre-Demo Checklist

- [ ] Both terminals ready (backend + frontend)
- [ ] Browsers open to correct URLs
- [ ] Test data prepared (user credentials)
- [ ] Network connection verified
- [ ] Swagger UI loaded successfully
- [ ] Frontend displaying correctly
- [ ] Database connection confirmed

---

**IMPORTANT:** Keep both backend and frontend terminals running throughout the demo. DO NOT close them!

**Backup Plan:** If live demo fails, show:
1. Code in VSCode
2. API documentation (static)
3. Screenshots/recordings
4. TEST_PLAN_SUMMARY.md

---

**Good luck with your presentation! 🎓✨**

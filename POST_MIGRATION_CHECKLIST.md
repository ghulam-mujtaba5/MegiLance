# ✅ Post-Migration Checklist

After removing Oracle and migrating to Turso, follow this checklist to ensure everything is working correctly.

---

## 🔍 Verification Steps

### 1. Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**Expected:** 
- ✅ No Oracle packages (oci, oracledb, cx_Oracle)
- ✅ No PostgreSQL packages (psycopg2-binary)
- ✅ libsql-client installed successfully

### 2. Configuration Files
```bash
# Check .env file
cat backend/.env.example
```

**Expected:**
- ✅ `DATABASE_URL=file:./local.db` (for local dev)
- ✅ `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` placeholders
- ✅ No Oracle/OCI variables
- ✅ No PostgreSQL variables
- ✅ `UPLOAD_DIR` for file storage

### 3. Database Session
```bash
# Check database session file
cat backend/app/db/session.py
```

**Expected:**
- ✅ Turso/SQLite connection logic
- ✅ No Oracle references
- ✅ Proper SQLite connection args

### 4. Docker Configuration
```bash
# Check docker-compose.yml
cat docker-compose.yml
```

**Expected:**
- ✅ No PostgreSQL service
- ✅ No Oracle wallet volumes
- ✅ SQLite database volume mounted
- ✅ Uploads directory mounted

### 5. Dockerfile
```bash
# Check Dockerfile
cat backend/Dockerfile
```

**Expected:**
- ✅ No Oracle Instant Client installation
- ✅ No PostgreSQL development packages
- ✅ Minimal build dependencies
- ✅ Uploads directory created

---

## 🧪 Testing

### Test 1: Local Development
```bash
# Start services
docker compose up -d

# Check logs
docker compose logs backend

# Expected output:
# ✅ "Database engine created: file:./local.db"
# ✅ No Oracle errors
# ✅ Application started successfully
```

### Test 2: Health Endpoints
```bash
# Check live endpoint
curl http://localhost:8000/api/health/live

# Expected: {"status": "live"}

# Check ready endpoint
curl http://localhost:8000/api/health/ready

# Expected: {"status": "ready", "database": "connected"}
```

### Test 3: Database Migrations
```bash
cd backend

# Run migrations
alembic upgrade head

# Expected:
# ✅ All migrations applied successfully
# ✅ No Oracle-related errors
# ✅ Tables created in local.db
```

### Test 4: API Documentation
```bash
# Open Swagger UI
open http://localhost:8000/api/docs

# Check:
# ✅ All endpoints listed
# ✅ No errors in console
# ✅ Can expand and view schemas
```

---

## 🚀 Production Setup (Optional)

### Option A: Local SQLite (Simple)
No additional setup needed! Just deploy with `DATABASE_URL=file:./local.db`

**Pros:**
- Simple, no external dependencies
- Works everywhere
- Free

**Cons:**
- Single server only (no replication)
- Limited to server storage

### Option B: Turso Cloud (Recommended)
```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Login
turso auth login

# 3. Create database
turso db create megilance

# 4. Get credentials
turso db show megilance --url
# Output: libsql://megilance-yourorg.turso.io

turso db tokens create megilance
# Output: eyJhbGc...your-token

# 5. Update production .env
TURSO_DATABASE_URL=libsql://megilance-yourorg.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...your-token

# 6. Run migrations against Turso
DATABASE_URL=$TURSO_DATABASE_URL alembic upgrade head
```

**Pros:**
- Global edge replication
- Free tier: 9GB storage, 1B reads/month
- Better performance worldwide
- Built-in backups

---

## 📝 Common Tasks

### Initialize Fresh Database
```bash
cd backend

# Delete old database (if exists)
rm local.db

# Run migrations
alembic upgrade head

# Seed demo data (optional)
python seed_demo_data.py
```

### Create New Migration
```bash
cd backend

# Auto-generate migration
alembic revision --autogenerate -m "Add new feature"

# Review generated migration
cat alembic/versions/xxxx_add_new_feature.py

# Apply migration
alembic upgrade head
```

### Switch to Turso in Production
```bash
# Update .env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Restart application
docker compose restart backend

# Verify connection
curl http://localhost:8000/api/health/ready
```

---

## 🐛 Troubleshooting

### Issue: "No module named 'libsql_client'"
**Solution:**
```bash
cd backend
pip install libsql-client
```

### Issue: "Database file not found"
**Solution:**
```bash
cd backend
alembic upgrade head
```

### Issue: "Permission denied: local.db"
**Solution:**
```bash
# Fix permissions
chmod 666 backend/local.db

# Or in Docker
docker compose exec backend chown appuser:appuser /app/local.db
```

### Issue: "Turso connection failed"
**Solution:**
```bash
# Verify credentials
turso db show megilance
turso db tokens create megilance

# Test connection
turso db shell megilance "SELECT 'Hello' as message"
```

### Issue: "File upload failed"
**Solution:**
```bash
# Ensure uploads directory exists and is writable
mkdir -p uploads
chmod 777 uploads

# In Docker
docker compose exec backend ls -la /app/uploads
```

---

## ✅ Final Verification

Run this comprehensive check:

```bash
#!/bin/bash

echo "🔍 MegiLance Post-Migration Verification"
echo "========================================"

# Check dependencies
echo "📦 Checking dependencies..."
cd backend
pip list | grep -E "libsql|oracle|psycopg" || echo "✅ Dependencies look good"

# Check environment
echo ""
echo "⚙️ Checking environment..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    grep -q "DATABASE_URL" .env && echo "✅ DATABASE_URL configured"
else
    echo "⚠️ No .env file found. Copy from .env.example"
fi

# Check database
echo ""
echo "🗄️ Checking database..."
if [ -f "local.db" ]; then
    echo "✅ Database file exists"
else
    echo "⚠️ Database not initialized. Run: alembic upgrade head"
fi

# Check Docker
echo ""
echo "🐳 Checking Docker..."
docker compose config > /dev/null 2>&1 && echo "✅ docker-compose.yml valid" || echo "❌ docker-compose.yml has errors"

# Check uploads directory
echo ""
echo "📁 Checking uploads..."
[ -d "uploads" ] && echo "✅ Uploads directory exists" || echo "⚠️ Create uploads directory"

echo ""
echo "========================================"
echo "✅ Verification complete!"
echo "Run 'docker compose up -d' to start"
```

---

## 🎉 Success Criteria

You're ready to go when:

- ✅ `pip install -r requirements.txt` succeeds without errors
- ✅ `docker compose up -d` starts all services
- ✅ `curl http://localhost:8000/api/health/live` returns `{"status": "live"}`
- ✅ `curl http://localhost:8000/api/health/ready` returns database connected
- ✅ No Oracle/PostgreSQL errors in logs
- ✅ Swagger UI loads at http://localhost:8000/api/docs
- ✅ Database migrations run successfully

---

## 📚 Documentation References

- [TURSO_SETUP.md](TURSO_SETUP.md) - Complete Turso guide
- [ORACLE_REMOVAL_COMPLETE.md](ORACLE_REMOVAL_COMPLETE.md) - Migration summary
- [README.md](README.md) - Updated architecture
- [backend/.env.example](backend/.env.example) - Configuration template

---

**Need help?** Check the documentation or [Turso Discord](https://discord.gg/turso)

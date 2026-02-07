# 🚀 Turso Database Setup for MegiLance

MegiLance now uses **Turso** - a distributed SQLite database service built on libSQL. It provides:
- ✅ Free tier with generous limits (500 databases, 9GB storage, 1B row reads/month)
- ✅ Edge database replication for low latency worldwide
- ✅ SQLite compatibility with SQLAlchemy
- ✅ No Oracle/PostgreSQL complexity
- ✅ Simple migration path from SQLite

---

## 🎯 Quick Start

### 1️⃣ Local Development (No Account Needed)

For local development, MegiLance uses a local SQLite file:

```bash
# Backend .env file
DATABASE_URL=file:./local.db
```

That's it! Your database will be created automatically at `backend/local.db`.

### 2️⃣ Production Setup (Turso Cloud)

#### Step 1: Create Turso Account

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login
```

#### Step 2: Create Database

```bash
# Create a new database
turso db create megilance

# Get database URL
turso db show megilance --url
# Output: libsql://megilance-yourorg.turso.io

# Create authentication token
turso db tokens create megilance
# Output: eyJhbGc...your-token
```

#### Step 3: Update Production Environment

```env
# Production .env
TURSO_DATABASE_URL=libsql://megilance-yourorg.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...your-token
```

---

## 📊 Database Management

### Initialize Schema

```bash
cd backend

# Run migrations
alembic upgrade head

# Or initialize directly
python -c "from app.db.base import Base; from app.db.session import get_engine; Base.metadata.create_all(bind=get_engine())"
```

### Create Migrations

```bash
# Auto-generate migration
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head
```

### Seed Data

```bash
# Add sample data
python scripts/seed_data.py
```

---

## 🔧 Turso CLI Commands

```bash
# List all databases
turso db list

# Show database info
turso db show megilance

# Access database shell
turso db shell megilance

# Create replica in another region
turso db replicate megilance --location fra

# View usage stats
turso db inspect megilance
```

---

## 🌍 Edge Replication

Turso allows you to replicate your database to multiple locations:

```bash
# Add replicas for global coverage
turso db replicate megilance --location ams  # Amsterdam
turso db replicate megilance --location syd  # Sydney
turso db replicate megilance --location sfo  # San Francisco
```

Clients automatically connect to the nearest replica!

---

## 💰 Pricing

### Starter Plan (FREE Forever)
- ✅ 500 databases
- ✅ 9 GB total storage
- ✅ 1 billion row reads/month
- ✅ 25 million row writes/month
- ✅ 3 locations

### Scaler Plan ($29/month)
- ✅ Unlimited databases
- ✅ 50 GB storage (then $0.50/GB)
- ✅ Unlimited reads/writes
- ✅ Unlimited locations

Perfect for MegiLance's needs! Free tier is more than enough for starting.

---

## 🔄 Migration from PostgreSQL/Oracle

The migration is already complete! The app now uses:

- **Local Dev**: SQLite file (`file:./local.db`)
- **Production**: Turso cloud database
- **ORM**: SQLAlchemy (unchanged)
- **Models**: Same as before (SQLite is compatible)

No data migration needed - start fresh with Turso!

---

## 🐛 Troubleshooting

### Connection Issues

```bash
# Test connection
turso db shell megilance "SELECT 'Hello from Turso!' as message"

# Check token
turso auth token
```

### Database Not Found

```bash
# Verify database exists
turso db list

# Create if missing
turso db create megilance
```

### Schema Issues

```bash
# Reset database (CAUTION: Deletes all data)
turso db destroy megilance --yes
turso db create megilance

# Re-run migrations
cd backend && alembic upgrade head
```

---

## 📚 Resources

- [Turso Documentation](https://docs.turso.tech/)
- [libSQL GitHub](https://github.com/tursodatabase/libsql)
- [SQLAlchemy Turso Guide](https://docs.turso.tech/sdk/python/orm/sqlalchemy)
- [Turso Pricing](https://turso.tech/pricing)

---

## ✅ Benefits Over Oracle

| Feature | Oracle | Turso |
|---------|--------|-------|
| Setup Time | Hours | Minutes |
| Free Tier | Limited (Always Free) | Generous |
| Complexity | High (wallets, clients) | Low (one URL + token) |
| Global Replication | Enterprise only | Included free |
| SQLite Compatible | No | Yes |
| Edge Performance | No | Yes |
| Vendor Lock-in | High | Low (open source libSQL) |

---

**Need help?** Check the [Turso Discord](https://discord.gg/turso) or [GitHub Issues](https://github.com/tursodatabase/libsql/issues).

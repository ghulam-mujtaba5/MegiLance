"""
Direct test of authenticate_user function
"""
from app.core.database import get_db
from app.core.security import authenticate_user

# Test database connection
db = next(get_db())

print("="*60)
print("Testing authenticate_user function directly")
print("="*60)

# Test admin
print("\n1️⃣ Testing Admin...")
admin_user = authenticate_user(db, "admin@megilance.com", "Admin@123")
if admin_user:
    print(f"   ✅ Admin authenticated: {admin_user.email}, Role: {admin_user.role}")
else:
    print(f"   ❌ Admin authentication failed")

# Test client
print("\n2️⃣ Testing Client...")
client_user = authenticate_user(db, "client1@example.com", "password123")
if client_user:
    print(f"   ✅ Client authenticated: {client_user.email}, Role: {client_user.role}")
else:
    print(f"   ❌ Client authentication failed")

# Test freelancer
print("\n3️⃣ Testing Freelancer...")
freelancer_user = authenticate_user(db, "freelancer1@example.com", "password123")
if freelancer_user:
    print(f"   ✅ Freelancer authenticated: {freelancer_user.email}, Role: {freelancer_user.role}")
else:
    print(f"   ❌ Freelancer authentication failed")

print("\n" + "="*60)

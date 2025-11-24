"""
Test bcrypt directly
"""
import bcrypt

hash_from_turso = "$2b$12$/a7xuoKlIJ7wI0GZuDpFFetKHbmOlAt7fJqR6nhQ1lW67KV/s.8Ea"
password = "Admin@123"

print("🔐 Testing bcrypt directly")
print(f"   Password: {password}")
print(f"   Hash: {hash_from_turso}")

# Test with bcrypt directly
try:
    result = bcrypt.checkpw(password.encode('utf-8'), hash_from_turso.encode('utf-8'))
    print(f"\n✅ bcrypt.checkpw result: {result}")
    
    if result:
        print("\n✅ ✅ ✅ PASSWORD MATCHES! ✅ ✅ ✅")
    else:
        print("\n❌ Password does not match")
except Exception as e:
    print(f"\n❌ Error: {e}")

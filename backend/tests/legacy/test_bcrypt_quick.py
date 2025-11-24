import bcrypt

print(f"bcrypt version: {bcrypt.__version__}")

# ACTUAL admin password hash from Turso (retrieved just now)
admin_hash = b"$2b$12$DoxDDUy/Ythvhmh7xg4z5uFpJ6WJsKzLjfPZhMvKRN.8FJv3e7jbW"

# Test all possible admin passwords
passwords = ["Admin@123", "admin@123", "Admin123", "admin123", "password123"]

for pwd in passwords:
    result = bcrypt.checkpw(pwd.encode(), admin_hash)
    print(f"Password '{pwd}': {result}")

import oracledb
import os
import bcrypt

# Connection details
user = "ADMIN"
password = "Bfw5ZvHQXjkDb!3lAa1!"
dsn = "megilanceai_high"

# Set wallet location
os.environ['TNS_ADMIN'] = os.path.join(os.getcwd(), 'oracle-wallet-23ai')

# Hash password with bcrypt (same as passlib uses)
test_password = "password123"
hashed = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"New password hash: {hashed}")

try:
    connection = oracledb.connect(
        user=user,
        password=password,
        dsn=dsn,
        config_dir=os.environ['TNS_ADMIN'],
        wallet_location=os.environ['TNS_ADMIN'],
        wallet_password="MegiLance2025!Wallet"
    )
    
    print("✅ Connected to 26ai database")
    
    cursor = connection.cursor()
    
    # Update all user passwords with fresh bcrypt hash
    emails = ['client1@example.com', 'client2@example.com', 'freelancer1@example.com', 
              'freelancer2@example.com', 'admin@megilance.com']
    
    for email in emails:
        cursor.execute("""
            UPDATE USERS 
            SET HASHED_PASSWORD = :1
            WHERE EMAIL = :2
        """, [hashed, email])
        print(f"✅ Updated password for {email}")
    
    connection.commit()
    print(f"\n✅ All passwords updated to: password123")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"❌ Error: {e}")

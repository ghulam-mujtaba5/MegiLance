import oracledb
import os

# Connection details
user = "ADMIN"
password = "Bfw5ZvHQXjkDb!3lAa1!"
dsn = "megilanceai_high"

# Set wallet location
os.environ['TNS_ADMIN'] = os.path.join(os.getcwd(), 'oracle-wallet-23ai')

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
    cursor.execute("""
        SELECT USER_ID, EMAIL, USERNAME, FIRST_NAME, LAST_NAME, ROLE 
        FROM USERS
        ORDER BY USER_ID
    """)
    
    print("\n📋 Users in database:")
    print("-" * 80)
    for row in cursor:
        print(f"ID: {row[0]}, Email: {row[1]}, Username: {row[2]}, Name: {row[3]} {row[4]}, Role: {row[5]}")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"❌ Error: {e}")

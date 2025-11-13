import oracledb
import os

# Connection details
user = "ADMIN"
password = "Bfw5ZvHQXjkDb!3lAa1!"
dsn = "megilanceai_high"

# Set wallet location
os.environ['TNS_ADMIN'] = '/app/oracle-wallet'

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
    
    print("\n📋 Adding missing columns to SKILLS table...")
    
    # Add missing columns to SKILLS table
    columns_to_add = [
        "ALTER TABLE SKILLS ADD (description CLOB)",
        "ALTER TABLE SKILLS ADD (icon_url VARCHAR2(500))",
        "ALTER TABLE SKILLS ADD (is_active NUMBER DEFAULT 1)",
        "ALTER TABLE SKILLS ADD (sort_order NUMBER DEFAULT 0)",
        "ALTER TABLE SKILLS ADD (updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    ]
    
    for sql in columns_to_add:
        try:
            cursor.execute(sql)
            col_name = sql.split('ADD (')[1].split()[0]
            print(f"  ✅ Added {col_name}")
        except Exception as e:
            if 'ORA-01430' in str(e):  # Column already exists
                col_name = sql.split('ADD (')[1].split()[0]
                print(f"  ℹ️  {col_name} already exists")
            else:
                print(f"  ❌ Error: {e}")
    
    connection.commit()
    
    # Verify final schema
    print("\n📋 Verifying SKILLS table schema...")
    cursor.execute("""
        SELECT COLUMN_NAME, DATA_TYPE, NULLABLE 
        FROM USER_TAB_COLUMNS 
        WHERE TABLE_NAME = 'SKILLS'
        ORDER BY COLUMN_ID
    """)
    
    for row in cursor:
        nullable = "NULL" if row[2] == 'Y' else "NOT NULL"
        print(f"  {row[0]:20} {row[1]:15} {nullable}")
    
    cursor.close()
    connection.close()
    
    print("\n✅ Schema update complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")

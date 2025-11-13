import oracledb

print("🔧 Adding missing columns to USERS table for 26ai...")

c = oracledb.connect(user='ADMIN',password='Bfw5ZvHQXjkDb!3lAa1!',dsn='megilanceai_high',
                     config_dir='/wallet',wallet_location='/wallet',wallet_password='MegiLance2025!Wallet')
cur = c.cursor()

# Add missing columns from backend User model
alterations = [
    "ALTER TABLE users ADD (first_name VARCHAR2(100))",
    "ALTER TABLE users ADD (last_name VARCHAR2(100))",
    "ALTER TABLE users ADD (name VARCHAR2(255))",
    "ALTER TABLE users ADD (user_type VARCHAR2(20))",
    "ALTER TABLE users ADD (bio CLOB)",
    "ALTER TABLE users ADD (skills CLOB)",
    "ALTER TABLE users ADD (hourly_rate NUMBER)",
    "ALTER TABLE users ADD (profile_image_url VARCHAR2(500))",
    "ALTER TABLE users ADD (location VARCHAR2(100))",
    "ALTER TABLE users ADD (account_balance NUMBER DEFAULT 0.0)",
    "ALTER TABLE users ADD (created_by NUMBER)",
    "ALTER TABLE users ADD (joined_at TIMESTAMP DEFAULT SYSTIMESTAMP)",
]

for i, sql in enumerate(alterations, 1):
    try:
        cur.execute(sql)
        col_name = sql.split('(')[1].split()[0]
        print(f"  ✅ Added {col_name}")
    except Exception as e:
        if 'ORA-01430' in str(e):  # column already exists
            col_name = sql.split('(')[1].split()[0]
            print(f"  ⏭️  {col_name} already exists")
        else:
            print(f"  ❌ Error: {e}")

# Update existing users to have compatible data
print("\n🔄 Updating existing user records...")

# Split FULL_NAME into FIRST_NAME and LAST_NAME
cur.execute("""
    UPDATE users 
    SET first_name = SUBSTR(full_name, 1, INSTR(full_name || ' ', ' ') - 1),
        last_name = SUBSTR(full_name, INSTR(full_name || ' ', ' ') + 1),
        name = full_name,
        user_type = role,
        joined_at = created_at
    WHERE full_name IS NOT NULL
""")
print(f"  ✅ Updated {cur.rowcount} users")

c.commit()

# Verify final schema
print("\n📊 Final USERS table schema:")
cur.execute("SELECT column_name, data_type FROM user_tab_columns WHERE table_name='USERS' ORDER BY column_id")
for row in cur:
    print(f"  {row[0]}: {row[1]}")

c.close()
print("\n🎉 Schema update complete!")

import oracledb
import os

# Connection details
user = "ADMIN"
password = "Bfw5ZvHQXjkDb!3lAa1!"
dsn = "megilanceai_high"
os.environ['TNS_ADMIN'] = '/app/oracle-wallet'

try:
    connection = oracledb.connect(
        user=user, password=password, dsn=dsn,
        config_dir=os.environ['TNS_ADMIN'],
        wallet_location=os.environ['TNS_ADMIN'],
        wallet_password="MegiLance2025!Wallet"
    )
    
    print("✅ Connected to database")
    cursor = connection.cursor()
    
    # PROJECTS table missing columns
    print("\n📋 Fixing PROJECTS table...")
    project_columns = [
        "ALTER TABLE PROJECTS ADD (category VARCHAR2(100))",
        "ALTER TABLE PROJECTS ADD (budget_type VARCHAR2(20))",
        "ALTER TABLE PROJECTS ADD (experience_level VARCHAR2(20))",
        "ALTER TABLE PROJECTS ADD (estimated_duration VARCHAR2(50))",
        "ALTER TABLE PROJECTS ADD (skills CLOB)"
    ]
    
    for sql in project_columns:
        try:
            cursor.execute(sql)
            col = sql.split('ADD (')[1].split()[0]
            print(f"  ✅ Added {col}")
        except Exception as e:
            if 'ORA-01430' in str(e):
                col = sql.split('ADD (')[1].split()[0]
                print(f"  ℹ️  {col} exists")
            else:
                print(f"  ❌ {e}")
    
    # PROPOSALS table - check if missing columns
    print("\n📋 Fixing PROPOSALS table...")
    proposal_columns = [
        "ALTER TABLE PROPOSALS ADD (estimated_hours NUMBER)",
        "ALTER TABLE PROPOSALS ADD (hourly_rate NUMBER)",
        "ALTER TABLE PROPOSALS ADD (availability VARCHAR2(20))",
        "ALTER TABLE PROPOSALS ADD (attachments CLOB)"
    ]
    
    for sql in proposal_columns:
        try:
            cursor.execute(sql)
            col = sql.split('ADD (')[1].split()[0]
            print(f"  ✅ Added {col}")
        except Exception as e:
            if 'ORA-01430' in str(e):
                col = sql.split('ADD (')[1].split()[0]
                print(f"  ℹ️  {col} exists")
            else:
                print(f"  ❌ {e}")
    
    # CONTRACTS table
    print("\n📋 Fixing CONTRACTS table...")
    contract_columns = [
        "ALTER TABLE CONTRACTS ADD (contract_address VARCHAR2(100))",
        "ALTER TABLE CONTRACTS ADD (winning_bid_id NUMBER)",
        "ALTER TABLE CONTRACTS ADD (contract_amount NUMBER)",
        "ALTER TABLE CONTRACTS ADD (platform_fee NUMBER DEFAULT 0.0)",
        "ALTER TABLE CONTRACTS ADD (description CLOB)",
        "ALTER TABLE CONTRACTS ADD (milestones CLOB)",
        "ALTER TABLE CONTRACTS ADD (blockchain_hash VARCHAR2(255))",
        "ALTER TABLE CONTRACTS ADD (milestone_count NUMBER DEFAULT 0)",
        "ALTER TABLE CONTRACTS ADD (hourly_rate NUMBER)",
        "ALTER TABLE CONTRACTS ADD (total_hours NUMBER)",
        "ALTER TABLE CONTRACTS ADD (completed_at TIMESTAMP)"
    ]
    
    for sql in contract_columns:
        try:
            cursor.execute(sql)
            col = sql.split('ADD (')[1].split()[0]
            print(f"  ✅ Added {col}")
        except Exception as e:
            if 'ORA-01430' in str(e):
                col = sql.split('ADD (')[1].split()[0]
                print(f"  ℹ️  {col} exists")
            else:
                print(f"  ❌ {e}")
    
    # PAYMENTS table
    print("\n📋 Fixing PAYMENTS table...")
    payment_columns = [
        "ALTER TABLE PAYMENTS ADD (milestone_id NUMBER)",
        "ALTER TABLE PAYMENTS ADD (from_user_id NUMBER)",
        "ALTER TABLE PAYMENTS ADD (to_user_id NUMBER)",
        "ALTER TABLE PAYMENTS ADD (payment_type VARCHAR2(20))",
        "ALTER TABLE PAYMENTS ADD (blockchain_tx_hash VARCHAR2(200))",
        "ALTER TABLE PAYMENTS ADD (payment_details CLOB)",
        "ALTER TABLE PAYMENTS ADD (platform_fee NUMBER DEFAULT 0.0)",
        "ALTER TABLE PAYMENTS ADD (freelancer_amount NUMBER)",
        "ALTER TABLE PAYMENTS ADD (description CLOB)",
        "ALTER TABLE PAYMENTS ADD (processed_at TIMESTAMP)",
        "ALTER TABLE PAYMENTS ADD (paid_at TIMESTAMP)",
        "ALTER TABLE PAYMENTS ADD (payer_id NUMBER)",
        "ALTER TABLE PAYMENTS ADD (payee_id NUMBER)"
    ]
    
    for sql in payment_columns:
        try:
            cursor.execute(sql)
            col = sql.split('ADD (')[1].split()[0]
            print(f"  ✅ Added {col}")
        except Exception as e:
            if 'ORA-01430' in str(e):
                col = sql.split('ADD (')[1].split()[0]
                print(f"  ℹ️  {col} exists")
            else:
                print(f"  ❌ {e}")
    
    connection.commit()
    print("\n✅ All schema updates complete!")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"❌ Error: {e}")

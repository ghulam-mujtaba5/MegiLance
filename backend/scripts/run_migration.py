"""
@AI-HINT: Standalone database migration script using SQLite3 directly
Creates 25+ new tables for MFA, multi-currency, AI, security, and video features
"""

import sqlite3
import os
from pathlib import Path


def apply_migration():
    """Apply advanced_schema.sql migration"""
    print("🔄 Starting database migration for advanced features...")
    
    # Read schema file
    schema_path = Path(__file__).parent.parent / "app" / "db" / "advanced_schema.sql"
    
    if not schema_path.exists():
        print(f"❌ Schema file not found: {schema_path}")
        return False
    
    print(f"📄 Reading schema from: {schema_path}")
    schema_sql = schema_path.read_text(encoding="utf-8")
    
    # Get database path (local SQLite for now)
    db_path = Path(__file__).parent.parent / "local.db"
    print(f"🔗 Connecting to database: {db_path}")
    
    try:
        # Connect to database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Split SQL statements
        statements = []
        current_statement = []
        
        for line in schema_sql.split('\n'):
            # Skip comments and empty lines
            if line.strip().startswith('--') or not line.strip():
                continue
            
            current_statement.append(line)
            
            # Check if statement is complete
            if line.strip().endswith(';'):
                stmt = '\n'.join(current_statement)
                statements.append(stmt)
                current_statement = []
        
        print(f"📊 Found {len(statements)} SQL statements to execute\n")
        
        # Execute each statement
        success_count = 0
        for i, stmt in enumerate(statements, 1):
            try:
                cursor.execute(stmt)
                success_count += 1
                
                # Extract table/index name for logging
                if 'CREATE TABLE' in stmt:
                    table_name = stmt.split('CREATE TABLE IF NOT EXISTS')[1].split('(')[0].strip()
                    print(f"  ✅ [{i}/{len(statements)}] Created table: {table_name}")
                elif 'CREATE INDEX' in stmt:
                    index_name = stmt.split('CREATE INDEX IF NOT EXISTS')[1].split('ON')[0].strip()
                    print(f"  ✅ [{i}/{len(statements)}] Created index: {index_name}")
                else:
                    print(f"  ✅ [{i}/{len(statements)}] Executed statement")
                    
            except Exception as e:
                error_msg = str(e)
                if 'already exists' in error_msg.lower():
                    print(f"  ⏭️ [{i}/{len(statements)}] Already exists, skipping")
                    success_count += 1
                else:
                    print(f"  ⚠️ [{i}/{len(statements)}] Warning: {error_msg}")
                continue
        
        conn.commit()
        
        print(f"\n✅ Migration complete: {success_count}/{len(statements)} statements executed\n")
        
        # Verify tables
        print("🔍 Verifying created tables...\n")
        tables_to_verify = [
            'mfa_methods', 'mfa_backup_codes', 'security_events', 'ip_whitelist',
            'exchange_rates', 'transactions', 'crypto_wallets', 'crypto_transactions',
            'video_calls', 'video_participants', 'video_recordings', 'screen_share_sessions',
            'whiteboard_sessions', 'fraud_alerts', 'quality_assessments', 'skill_matches',
            'price_suggestions', 'user_sessions'
        ]
        
        verified_count = 0
        for table in tables_to_verify:
            try:
                result = cursor.execute(
                    f"SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                    (table,)
                ).fetchone()
                
                if result:
                    print(f"  ✅ Table verified: {table}")
                    verified_count += 1
                else:
                    print(f"  ❌ Table missing: {table}")
            except Exception as e:
                print(f"  ⚠️ Could not verify {table}: {e}")
        
        print(f"\n📊 Verification: {verified_count}/{len(tables_to_verify)} tables confirmed\n")
        
        conn.close()
        
        if verified_count == len(tables_to_verify):
            print("🎉 All tables created successfully!\n")
            return True
        else:
            print(f"⚠️ {len(tables_to_verify) - verified_count} tables missing\n")
            return False
            
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}\n")
        import traceback
        traceback.print_exc()
        return False


def seed_development_data():
    """Seed development data for testing"""
    print("🌱 Seeding development data...\n")
    
    db_path = Path(__file__).parent.parent / "local.db"
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Seed exchange rates
        exchange_rates_data = [
            ('USD', 'EUR', 0.92, 'seed'),
            ('USD', 'GBP', 0.79, 'seed'),
            ('USD', 'JPY', 149.50, 'seed'),
            ('USD', 'CAD', 1.35, 'seed'),
            ('USD', 'AUD', 1.52, 'seed'),
            ('BTC', 'USD', 43500.00, 'coingecko'),
            ('ETH', 'USD', 2300.00, 'coingecko'),
            ('USDC', 'USD', 1.00, 'coingecko'),
            ('USDT', 'USD', 1.00, 'coingecko'),
            ('BNB', 'USD', 315.00, 'coingecko'),
            ('SOL', 'USD', 105.00, 'coingecko'),
            ('MATIC', 'USD', 0.85, 'coingecko')
        ]
        
        for from_curr, to_curr, rate, provider in exchange_rates_data:
            try:
                cursor.execute(
                    """INSERT OR REPLACE INTO exchange_rates 
                       (from_currency, to_currency, rate, provider, updated_at)
                       VALUES (?, ?, ?, ?, datetime('now'))""",
                    (from_curr, to_curr, rate, provider)
                )
                print(f"  ✅ Added rate: {from_curr} → {to_curr} = {rate}")
            except Exception as e:
                print(f"  ⚠️ Could not add {from_curr}/{to_curr}: {e}")
        
        conn.commit()
        conn.close()
        
        print("\n✅ Development data seeded successfully!\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}\n")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main migration runner"""
    import sys
    
    command = sys.argv[1] if len(sys.argv) > 1 else 'apply'
    
    if command == 'apply':
        success = apply_migration()
        if success:
            # Auto-seed data
            print("📦 Seeding development data...\n")
            seed_development_data()
    
    elif command == 'seed':
        success = seed_development_data()
    
    else:
        print("❌ Unknown command. Use: apply or seed")
        success = False
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

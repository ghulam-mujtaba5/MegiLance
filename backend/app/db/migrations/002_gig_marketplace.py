"""
@AI-HINT: Database migration script for Gig Marketplace features
Creates tables for Fiverr-style gigs, orders, reviews, seller stats, and talent invitations
"""

import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.db.turso_http import TursoHTTP


def apply_migration():
    """Apply gig_marketplace_schema.sql migration"""
    print("🔄 Starting database migration for Gig Marketplace...")
    
    # Read schema file
    schema_path = Path(__file__).parent.parent / "gig_marketplace_schema.sql"
    
    if not schema_path.exists():
        print(f"❌ Schema file not found: {schema_path}")
        return False
    
    print(f"📄 Reading schema from: {schema_path}")
    schema_sql = schema_path.read_text(encoding="utf-8")
    
    # Get Turso client
    try:
        client = TursoHTTP.get_instance()
        print("🔗 Connected to Turso database")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return False
    
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
    
    print(f"📊 Found {len(statements)} SQL statements to execute")
    
    # Execute each statement
    success_count = 0
    error_count = 0
    
    for i, stmt in enumerate(statements, 1):
        try:
            client.execute(stmt)
            success_count += 1
            
            # Extract table/index name for logging
            if 'CREATE TABLE' in stmt:
                parts = stmt.split('CREATE TABLE IF NOT EXISTS')
                if len(parts) > 1:
                    table_name = parts[1].split('(')[0].strip()
                    print(f"  ✅ [{i}/{len(statements)}] Created table: {table_name}")
                else:
                    print(f"  ✅ [{i}/{len(statements)}] Executed CREATE TABLE")
            elif 'CREATE INDEX' in stmt:
                parts = stmt.split('CREATE INDEX IF NOT EXISTS')
                if len(parts) > 1:
                    index_name = parts[1].split(' ON')[0].strip()
                    print(f"  ✅ [{i}/{len(statements)}] Created index: {index_name}")
                else:
                    print(f"  ✅ [{i}/{len(statements)}] Executed CREATE INDEX")
            else:
                print(f"  ✅ [{i}/{len(statements)}] Executed statement")
                
        except Exception as e:
            error_str = str(e)
            # Ignore "already exists" errors
            if 'already exists' in error_str.lower() or 'duplicate' in error_str.lower():
                print(f"  ⏭️  [{i}/{len(statements)}] Already exists (skipped)")
                success_count += 1
            else:
                print(f"  ❌ [{i}/{len(statements)}] Error: {error_str[:100]}")
                error_count += 1
    
    print(f"\n📊 Migration Summary:")
    print(f"  ✅ Successful: {success_count}")
    print(f"  ❌ Failed: {error_count}")
    print(f"  📝 Total: {len(statements)}")
    
    if error_count == 0:
        print("\n✅ Migration completed successfully!")
        return True
    else:
        print(f"\n⚠️  Migration completed with {error_count} errors")
        return False


if __name__ == "__main__":
    apply_migration()

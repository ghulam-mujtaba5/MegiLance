"""
@AI-HINT: Migration script for Billion Dollar Upgrade features
Applies turso_billion_dollar_upgrade.sql and turso_billion_dollar_fts.sql
"""

import sqlite3
import os
from pathlib import Path

def apply_sql_file(cursor, file_path):
    print(f"📄 Reading schema from: {file_path}")
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
        
    schema_sql = file_path.read_text(encoding="utf-8")
    
    try:
        cursor.executescript(schema_sql)
        print(f"  ✅ Executed script successfully")
    except Exception as e:
        print(f"  ❌ Script execution failed: {str(e)}")
        return False
            
    return True

def main():
    print("🚀 Starting Billion Dollar Upgrade Migration...")
    
    # Get database path
    db_path = Path(__file__).parent.parent / "local.db"
    print(f"🔗 Connecting to database: {db_path}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        # Enable FTS5 extension if needed, usually built-in
        conn.enable_load_extension(True)
    except:
        pass # Might fail if not allowed or not needed

    try:
        cursor = conn.cursor()
        
        # Apply Schema Changes
        schema_path = Path(__file__).parent.parent / "turso_billion_dollar_upgrade.sql"
        apply_sql_file(cursor, schema_path)
        
        # Apply FTS Changes
        fts_path = Path(__file__).parent.parent / "turso_billion_dollar_fts.sql"
        apply_sql_file(cursor, fts_path)
        
        conn.commit()
        conn.close()
        print("\n✅ Migration complete!\n")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

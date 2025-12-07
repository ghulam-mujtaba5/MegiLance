import os
import sys

os.chdir(r'e:\MegiLance\backend')
sys.path.insert(0, r'e:\MegiLance\backend')

from sqlalchemy import create_engine, text

# Connect to database
engine = create_engine('sqlite:///./local_dev.db', connect_args={'check_same_thread': False})

print("Tables in database:")
try:
    with engine.connect() as conn:
        # Check tables
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"))
        tables = [row[0] for row in result]
        for t in tables:
            # Get row count
            try:
                count_result = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"'))
                count = count_result.scalar()
                print(f"  - {t} ({count} rows)")
            except:
                print(f"  - {t} (query error)")
        
        print(f"\nLooking for user-related tables...")
        for t in tables:
            if 'user' in t.lower():
                print(f"\nFound: {t}")
                # Get columns
                col_result = conn.execute(text(f"PRAGMA table_info('{t}')"))
                print("  Columns:")
                for col in col_result:
                    print(f"    - {col[1]} ({col[2]})")
                
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

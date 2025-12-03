from sqlalchemy import text
from app.db.session import get_session_local

def verify_data():
    db = get_session_local()()
    try:
        tables = [
            "users", "skills", "projects", "proposals", "contracts", "milestones",
            "categories", "tags", "project_tags", "time_entries", "invoices",
            "escrow", "favorites", "support_tickets", "refunds", "payments"
        ]
        
        print("\n📊 Database Verification:\n")
        for table in tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"✅ {table}: {count} rows")
            except Exception as e:
                print(f"❌ {table}: Error - {e}")
                
    finally:
        db.close()

if __name__ == "__main__":
    verify_data()

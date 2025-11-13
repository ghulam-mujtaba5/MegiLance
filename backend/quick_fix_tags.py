"""Quick fix for tags with invalid types"""
import sys
sys.path.insert(0, '/app')

from app.db.session import SessionLocal
from app.models import Tag

db = SessionLocal()
try:
    # Find tags with invalid types
    invalid_tags = db.query(Tag).filter(
        ~Tag.type.in_(['skill', 'priority', 'location', 'budget', 'general'])
    ).all()
    
    print(f"🔍 Found {len(invalid_tags)} tags with invalid types")
    
    if invalid_tags:
        for tag in invalid_tags:
            print(f"  - '{tag.name}': {tag.type} → general")
            tag.type = 'general'
        
        db.commit()
        print(f"\n✅ Updated {len(invalid_tags)} tags to type='general'")
    else:
        print("✅ All tags have valid types!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()

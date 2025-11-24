"""Fix tags with invalid types - Simple version"""
import sys
sys.path.insert(0, '/app')

from app.db.session import SessionLocal
from app.models import Tag

db = SessionLocal()
try:
    # Find and fix invalid tags
    invalid_tags = db.query(Tag).filter(
        ~Tag.type.in_(['skill', 'priority', 'location', 'budget', 'general'])
    ).all()
    
    print(f"Found {len(invalid_tags)} tags with invalid types")
    
    for tag in invalid_tags:
        print(f"  Fixing: {tag.name} ({tag.type} -> general)")
        tag.type = 'general'
    
    db.commit()
    print(f"\n✅ Fixed {len(invalid_tags)} tags")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()

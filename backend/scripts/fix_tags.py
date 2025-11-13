#!/usr/bin/env python3
"""Fix tags with invalid types"""

import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'app'))

from db.session import SessionLocal
from models.tag import Tag

def main():
    db = SessionLocal()
    try:
        # Find tags with invalid types
        invalid_types = db.query(Tag).filter(
            ~Tag.type.in_(['skill', 'priority', 'location', 'budget', 'general'])
        ).all()
        
        print(f"🔍 Found {len(invalid_types)} tags with invalid types")
        
        if invalid_types:
            for tag in invalid_types:
                print(f"  - '{tag.name}': {tag.type} → general")
                tag.type = 'general'
            
            db.commit()
            print(f"\n✅ Updated {len(invalid_types)} tags to type='general'")
        else:
            print("✅ All tags have valid types!")
        
        # List all tags
        all_tags = db.query(Tag).all()
        print(f"\n📊 Total tags in database: {len(all_tags)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()

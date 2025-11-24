"""
@AI-HINT: Database population script with CORRECTED schema mappings.
Populates Turso database with comprehensive sample data for testing.
FIXED: All column names match actual SQLAlchemy models.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import Settings
from app.core.security import get_password_hash
import json
from datetime import datetime, timedelta

# Load settings
settings = Settings()

# Create engine  
engine = create_engine(
    settings.database_url,  # CORRECT: database_url (lowercase)
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)
SessionLocal = sessionmaker(bind=engine)

def populate_database():
    """Populate database with comprehensive sample data"""
    db = SessionLocal()
    
    try:
        # Step 1: Update existing user passwords
        print("🔐 [1/7] Updating user passwords...")
        users_to_update = [
            ("admin@megilance.com", "Admin@123"),
            ("client1@example.com", "password123"),
            ("freelancer1@example.com", "password123"),
        ]
        
        updated_count = 0
        for email, new_password in users_to_update:
            hashed_password = get_password_hash(new_password)
            result = db.execute(
                text("UPDATE users SET hashed_password = :pwd WHERE email = :email"),
                {"pwd": hashed_password, "email": email}
            )
            if result.rowcount > 0:
                updated_count += 1
                print(f"   ✅ Updated password for {email}")
        
        db.commit()
        print(f"   ✅ [1/7] Password updates complete: {updated_count}/3 users updated\n")
        
        # Step 2: Add sample users
        print("👥 [2/7] Adding sample users...")
        try:
            sample_users = [
                {
                    "email": "freelancer2@example.com",
                    "hashed_password": get_password_hash("password123"),
                    "first_name": "Sarah",
                    "last_name": "Johnson",
                    "name": "Sarah Johnson",
                    "role": "freelancer",
                    "user_type": "freelancer",
                    "is_active": True,
                    "is_verified": True,
                    "email_verified": True,
                    "two_factor_enabled": False,
                    "bio": "Full-stack developer with 5+ years experience",
                    "skills": json.dumps(["React", "Node.js", "Python", "AWS"]),
                    "hourly_rate": 75.0,
                    "location": "San Francisco, CA",
                },
                {
                    "email": "freelancer3@example.com",
                    "hashed_password": get_password_hash("password123"),
                    "first_name": "Michael",
                    "last_name": "Chen",
                    "name": "Michael Chen",
                    "role": "freelancer",
                    "user_type": "freelancer",
                    "is_active": True,
                    "is_verified": True,
                    "email_verified": True,
                    "bio": "UI/UX Designer specializing in mobile apps",
                    "skills": json.dumps(["Figma", "Adobe XD", "UI Design", "Prototyping"]),
                    "hourly_rate": 60.0,
                    "location": "New York, NY",
                },
                {
                    "email": "client2@example.com",
                    "hashed_password": get_password_hash("password123"),
                    "first_name": "Emily",
                    "last_name": "Rodriguez",
                    "name": "Emily Rodriguez",
                    "role": "client",
                    "user_type": "client",
                    "is_active": True,
                    "is_verified": True,
                    "email_verified": True,
                    "bio": "Tech startup founder looking for talented developers",
                    "location": "Austin, TX",
                },
            ]
            
            for user_data in sample_users:
                columns = ", ".join(user_data.keys())
                placeholders = ", ".join([f":{key}" for key in user_data.keys()])
                query = f"INSERT INTO users ({columns}) VALUES ({placeholders})"
                db.execute(text(query), user_data)
            
            db.commit()
            print(f"   ✅ [2/7] Added {len(sample_users)} sample users\n")
        except Exception as e:
            print(f"   ❌ [2/7] Failed to add users: {str(e)}\n")
            db.rollback()
        
        # Step 3: Create sample projects with CORRECT schema (experience_level, estimated_duration)
        print("📦 [3/7] Creating sample projects...")
        try:
            sample_projects = [
                {
                    "title": "E-Commerce Website Development",
                    "description": "Build a modern e-commerce platform with payment integration",
                    "category": "Web Development",
                    "budget_type": "Fixed",
                    "budget_min": 5000.0,
                    "budget_max": 8000.0,
                    "experience_level": "Expert",
                    "estimated_duration": "1-3 months",
                    "skills": json.dumps(["React", "Node.js", "PostgreSQL", "Stripe"]),
                    "client_id": 1,
                    "status": "open",
                },
                {
                    "title": "Mobile App UI/UX Design",
                    "description": "Design user-friendly mobile app interface",
                    "category": "Design",
                    "budget_type": "Fixed",
                    "budget_min": 2000.0,
                    "budget_max": 3500.0,
                    "experience_level": "Intermediate",
                    "estimated_duration": "1-4 weeks",
                    "skills": json.dumps(["Figma", "Adobe XD", "UI/UX", "Mobile Design"]),
                    "client_id": 1,
                    "status": "open",
                },
                {
                    "title": "Data Analysis Dashboard",
                    "description": "Create interactive dashboard for business analytics",
                    "category": "Data Science",
                    "budget_type": "Hourly",
                    "budget_min": 50.0,
                    "budget_max": 80.0,
                    "experience_level": "Expert",
                    "estimated_duration": "1-4 weeks",
                    "skills": json.dumps(["Python", "Pandas", "Tableau", "Data Visualization"]),
                    "client_id": 1,
                    "status": "in_progress",
                },
                {
                    "title": "Marketing Campaign Content Writing",
                    "description": "Write engaging content for digital marketing campaigns",
                    "category": "Writing",
                    "budget_type": "Fixed",
                    "budget_min": 500.0,
                    "budget_max": 1000.0,
                    "experience_level": "Entry",
                    "estimated_duration": "Less than 1 week",
                    "skills": json.dumps(["Copywriting", "SEO", "Content Marketing"]),
                    "client_id": 1,
                    "status": "completed",
                },
            ]
            
            for project_data in sample_projects:
                columns = ", ".join(project_data.keys())
                placeholders = ", ".join([f":{key}" for key in project_data.keys()])
                query = f"INSERT INTO projects ({columns}) VALUES ({placeholders})"
                db.execute(text(query), project_data)
            
            db.commit()
            print(f"   ✅ [3/7] Created {len(sample_projects)} sample projects\n")
        except Exception as e:
            print(f"   ❌ [3/7] Failed to create projects: {str(e)}\n")
            db.rollback()
        
        # Step 4: Create proposals with CORRECT schema (bid_amount exists)
        print("📝 [4/7] Creating proposals...")
        try:
            sample_proposals = [
                {
                    "project_id": 9,  # E-Commerce project
                    "freelancer_id": 3,
                    "cover_letter": "I have 5+ years of experience building e-commerce platforms...",
                    "bid_amount": 6500.0,  # CORRECT: This column exists
                    "estimated_hours": 200,
                    "hourly_rate": 75.0,
                    "availability": "immediate",
                    "status": "submitted",
                    "is_draft": False,
                },
                {
                    "project_id": 10,  # Mobile UI/UX project
                    "freelancer_id": 3,
                    "cover_letter": "Experienced mobile designer with portfolio of successful apps...",
                    "bid_amount": 2800.0,
                    "estimated_hours": 60,
                    "hourly_rate": 60.0,
                    "availability": "1-2_weeks",
                    "status": "accepted",
                    "is_draft": False,
                },
                {
                    "project_id": 11,  # Data dashboard project
                    "freelancer_id": 3,
                    "cover_letter": "Data scientist specializing in interactive dashboards...",
                    "bid_amount": 4800.0,
                    "estimated_hours": 80,
                    "hourly_rate": 60.0,
                    "availability": "immediate",
                    "status": "submitted",
                    "is_draft": False,
                },
            ]
            
            for proposal_data in sample_proposals:
                columns = ", ".join(proposal_data.keys())
                placeholders = ", ".join([f":{key}" for key in proposal_data.keys()])
                query = f"INSERT INTO proposals ({columns}) VALUES ({placeholders})"
                db.execute(text(query), proposal_data)
            
            db.commit()
            print(f"   ✅ [4/7] Created {len(sample_proposals)} proposals\n")
        except Exception as e:
            print(f"   ❌ [4/7] Failed to create proposals: {str(e)}\n")
            db.rollback()
        
        # Step 5: Create contracts with CORRECT schema (amount not total_amount)
        print("📄 [5/7] Creating contracts...")
        try:
            sample_contracts = [
                {
                    "project_id": 11,  # Data dashboard
                    "freelancer_id": 3,
                    "client_id": 1,
                    "amount": 4800.0,  # CORRECT: amount field, not total_amount
                    "contract_amount": 4800.0,
                    "platform_fee": 480.0,
                    "status": "active",
                    "start_date": datetime.utcnow(),
                    "description": "Data analysis dashboard development contract",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                },
                {
                    "project_id": 10,  # Mobile UI/UX
                    "freelancer_id": 3,
                    "client_id": 1,
                    "amount": 2800.0,
                    "contract_amount": 2800.0,
                    "platform_fee": 280.0,
                    "status": "active",
                    "start_date": datetime.utcnow() - timedelta(days=15),
                    "description": "Mobile app UI/UX design contract",
                },
            ]
            
            for contract_data in sample_contracts:
                columns = ", ".join(contract_data.keys())
                placeholders = ", ".join([f":{key}" for key in contract_data.keys()])
                query = f"INSERT INTO contracts ({columns}) VALUES ({placeholders})"
                db.execute(text(query), contract_data)
            
            db.commit()
            print(f"   ✅ [5/7] Created {len(sample_contracts)} contracts\n")
        except Exception as e:
            print(f"   ❌ [5/7] Failed to create contracts: {str(e)}\n")
            db.rollback()
        
        # Step 6: Create payments with CORRECT schema (payment_method exists)
        print("💰 [6/7] Creating payments...")
        try:
            sample_payments = [
                {
                    "contract_id": 4,
                    "from_user_id": 1,
                    "to_user_id": 3,
                    "amount": 2520.0,
                    "payment_type": "milestone",
                    "payment_method": "usdc",  # CORRECT: payment_method exists
                    "status": "completed",
                    "transaction_id": f"TXN-{datetime.utcnow().timestamp()}",
                    "platform_fee": 280.0,
                    "freelancer_amount": 2240.0,
                    "description": "Milestone 1 payment",
                    "processed_at": datetime.utcnow(),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                },
                {
                    "contract_id": 5,
                    "from_user_id": 1,
                    "to_user_id": 3,
                    "amount": 4800.0,
                    "payment_type": "project",
                    "payment_method": "usdc",
                    "status": "pending",
                    "platform_fee": 480.0,
                    "freelancer_amount": 4320.0,
                    "description": "Full project payment",
                },
            ]
            
            for payment_data in sample_payments:
                columns = ", ".join(payment_data.keys())
                placeholders = ", ".join([f":{key}" for key in payment_data.keys()])
                query = f"INSERT INTO payments ({columns}) VALUES ({placeholders})"
                db.execute(text(query), payment_data)
            
            db.commit()
            print(f"   ✅ [6/7] Created {len(sample_payments)} payments\n")
        except Exception as e:
            print(f"   ❌ [6/7] Failed to create payments: {str(e)}\n")
            db.rollback()
        
        # Step 7: Update account balances
        print("💵 [7/7] Updating account balances...")
        try:
            # Get completed payments and update balances
            result = db.execute(text("""
                SELECT to_user_id, SUM(freelancer_amount) as total_earned
                FROM payments
                WHERE status = 'completed'
                GROUP BY to_user_id
            """))
            
            updated = 0
            for row in result:
                user_id = row[0]
                total_earned = row[1]
                db.execute(
                    text("UPDATE users SET account_balance = :balance WHERE id = :user_id"),
                    {"balance": total_earned, "user_id": user_id}
                )
                updated += 1
                print(f"   💰 Updated balance for User {user_id}: ${total_earned:,.2f}")
            
            db.commit()
            print(f"   ✅ [7/7] Updated account balances for {updated} users\n")
        except Exception as e:
            print(f"   ❌ [7/7] Failed to update balances: {str(e)}\n")
            db.rollback()
        
        # Final summary
        print("=" * 60)
        print("📊 DATABASE POPULATION SUMMARY")
        print("=" * 60)
        
        stats = {}
        for table in ["users", "projects", "proposals", "contracts", "payments"]:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            stats[table] = result.scalar()
            print(f"   {table.title()}: {stats[table]}")
        
        print("=" * 60)
        print("✅ Database population complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀 MEGILANCE DATABASE POPULATION SCRIPT (FIXED)")
    print("=" * 60)
    print(f"Database: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'local'}")
    print("=" * 60 + "\n")
    
    populate_database()

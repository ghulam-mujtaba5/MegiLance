# @AI-HINT: Comprehensive seed data for all new tables
"""
Seed data script for Time Entries, Invoices, Escrow, Categories, Favorites, Tags, Support Tickets, and Refunds
Run this script to populate the database with realistic test data
"""

from sqlalchemy.orm import Session
from app.db.session import get_session_local
from app.models import (
    TimeEntry, Invoice, Escrow, Category, Favorite, Tag, ProjectTag,
    SupportTicket, Refund, User, Project, Contract, Payment
)
from datetime import datetime, timedelta
import random
import json

def seed_categories(db: Session):
    """Create hierarchical categories"""
    print("Seeding categories...")
    
    categories = [
        # Parent categories
        {"name": "Web Development", "slug": "web-development", "icon": "🌐", "sort_order": 1},
        {"name": "Mobile Development", "slug": "mobile-development", "icon": "📱", "sort_order": 2},
        {"name": "Data Science", "slug": "data-science", "icon": "📊", "sort_order": 3},
        {"name": "Design & Creative", "slug": "design-creative", "icon": "🎨", "sort_order": 4},
        {"name": "Writing & Content", "slug": "writing-content", "icon": "✍️", "sort_order": 5},
        {"name": "Marketing & Sales", "slug": "marketing-sales", "icon": "📈", "sort_order": 6},
    ]
    
    created_cats = {}
    for cat_data in categories:
        cat = Category(**cat_data, project_count=0, is_active=True)
        db.add(cat)
        db.flush()
        created_cats[cat_data["name"]] = cat.id
    
    # Child categories
    subcategories = [
        {"name": "Frontend Development", "slug": "frontend-dev", "parent_id": created_cats["Web Development"], "sort_order": 1},
        {"name": "Backend Development", "slug": "backend-dev", "parent_id": created_cats["Web Development"], "sort_order": 2},
        {"name": "Full Stack Development", "slug": "fullstack-dev", "parent_id": created_cats["Web Development"], "sort_order": 3},
        {"name": "iOS Development", "slug": "ios-dev", "parent_id": created_cats["Mobile Development"], "sort_order": 1},
        {"name": "Android Development", "slug": "android-dev", "parent_id": created_cats["Mobile Development"], "sort_order": 2},
        {"name": "Machine Learning", "slug": "machine-learning", "parent_id": created_cats["Data Science"], "sort_order": 1},
        {"name": "Data Analysis", "slug": "data-analysis", "parent_id": created_cats["Data Science"], "sort_order": 2},
        {"name": "UI/UX Design", "slug": "ui-ux-design", "parent_id": created_cats["Design & Creative"], "sort_order": 1},
        {"name": "Graphic Design", "slug": "graphic-design", "parent_id": created_cats["Design & Creative"], "sort_order": 2},
        {"name": "Content Writing", "slug": "content-writing", "parent_id": created_cats["Writing & Content"], "sort_order": 1},
        {"name": "Technical Writing", "slug": "technical-writing", "parent_id": created_cats["Writing & Content"], "sort_order": 2},
        {"name": "SEO Marketing", "slug": "seo-marketing", "parent_id": created_cats["Marketing & Sales"], "sort_order": 1},
        {"name": "Social Media Marketing", "slug": "social-media-marketing", "parent_id": created_cats["Marketing & Sales"], "sort_order": 2},
    ]
    
    for subcat in subcategories:
        db.add(Category(**subcat, project_count=0, is_active=True))
    
    db.commit()
    print(f"✅ Created {len(categories) + len(subcategories)} categories")

def seed_tags(db: Session):
    """Create tags for projects"""
    print("Seeding tags...")
    
    tags_data = [
        # Skills
        {"name": "react", "type": "skill", "slug": "react"},
        {"name": "python", "type": "skill", "slug": "python"},
        {"name": "javascript", "type": "skill", "slug": "javascript"},
        {"name": "typescript", "type": "skill", "slug": "typescript"},
        {"name": "node.js", "type": "skill", "slug": "nodejs"},
        {"name": "fastapi", "type": "skill", "slug": "fastapi"},
        {"name": "django", "type": "skill", "slug": "django"},
        {"name": "postgresql", "type": "skill", "slug": "postgresql"},
        {"name": "turso", "type": "skill", "slug": "turso"},
        {"name": "figma", "type": "skill", "slug": "figma"},
        {"name": "photoshop", "type": "skill", "slug": "photoshop"},
        {"name": "ui/ux", "type": "skill", "slug": "ui-ux"},
        # Priorities
        {"name": "urgent", "type": "priority", "slug": "urgent"},
        {"name": "high-priority", "type": "priority", "slug": "high-priority"},
        {"name": "flexible-timeline", "type": "priority", "slug": "flexible-timeline"},
        # Budgets
        {"name": "fixed-price", "type": "budget", "slug": "fixed-price"},
        {"name": "hourly-rate", "type": "budget", "slug": "hourly-rate"},
        {"name": "budget-friendly", "type": "budget", "slug": "budget-friendly"},
        # Locations
        {"name": "remote", "type": "location", "slug": "remote"},
        {"name": "usa", "type": "location", "slug": "usa"},
        {"name": "europe", "type": "location", "slug": "europe"},
        {"name": "asia", "type": "location", "slug": "asia"},
        # General
        {"name": "long-term", "type": "general", "slug": "long-term"},
        {"name": "short-term", "type": "general", "slug": "short-term"},
        {"name": "part-time", "type": "general", "slug": "part-time"},
        {"name": "full-time", "type": "general", "slug": "full-time"},
    ]
    
    created_tags = []
    for tag_data in tags_data:
        tag = Tag(**tag_data, usage_count=random.randint(0, 50))
        db.add(tag)
        db.flush()
        created_tags.append(tag)
    
    db.commit()
    print(f"✅ Created {len(tags_data)} tags")
    return created_tags

def seed_project_tags(db: Session, tags: list):
    """Associate tags with projects"""
    print("Seeding project-tag associations...")
    
    projects = db.query(Project).all()
    if not projects:
        print("⚠️  No projects found, skipping project-tag associations")
        return
    
    associations = 0
    for project in projects:
        # Randomly assign 2-5 tags to each project
        num_tags = random.randint(2, 5)
        project_tags = random.sample(tags, min(num_tags, len(tags)))
        
        for tag in project_tags:
            # Check if association exists
            existing = db.query(ProjectTag).filter(
                ProjectTag.project_id == project.id,
                ProjectTag.tag_id == tag.id
            ).first()
            
            if not existing:
                db.add(ProjectTag(project_id=project.id, tag_id=tag.id))
                tag.usage_count += 1
                associations += 1
    
    db.commit()
    print(f"✅ Created {associations} project-tag associations")

def seed_time_entries(db: Session):
    """Create time entries for contracts"""
    print("Seeding time entries...")
    
    contracts = db.query(Contract).filter(Contract.status == "active").all()
    if not contracts:
        print("⚠️  No active contracts found, skipping time entries")
        return
    
    entries = []
    for contract in contracts[:5]:  # First 5 contracts
        freelancer = db.query(User).filter(User.id == contract.freelancer_id).first()
        
        # Create 3-7 time entries per contract
        for i in range(random.randint(3, 7)):
            days_ago = random.randint(1, 30)
            start_time = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 8))
            duration_hours = random.uniform(1, 8)
            end_time = start_time + timedelta(hours=duration_hours)
            duration_minutes = int(duration_hours * 60)
            
            hourly_rate = freelancer.hourly_rate or 50.0
            amount = (duration_minutes / 60) * hourly_rate
            
            entry = TimeEntry(
                user_id=contract.freelancer_id,
                contract_id=contract.id,
                description=f"Work session {i+1} - Development and testing",
                start_time=start_time,
                end_time=end_time,
                duration_minutes=duration_minutes,
                billable=True,
                hourly_rate=hourly_rate,
                amount=round(amount, 2),
                status=random.choice(["draft", "submitted", "approved", "invoiced"])
            )
            entries.append(entry)
            db.add(entry)
    
    db.commit()
    print(f"✅ Created {len(entries)} time entries")
    return entries

def seed_invoices(db: Session):
    """Create invoices for contracts"""
    print("Seeding invoices...")
    
    contracts = db.query(Contract).filter(Contract.status == "active").all()
    if not contracts:
        print("⚠️  No active contracts found, skipping invoices")
        return
    
    invoices = []
    for i, contract in enumerate(contracts[:5]):  # First 5 contracts
        invoice_num = f"INV-2025-01-{1000 + i:04d}"
        
        # Create invoice items
        items = [
            {"description": "Development work - Week 1", "hours": 20, "rate": 50.0, "amount": 1000.0},
            {"description": "Bug fixes and optimization", "hours": 5, "rate": 50.0, "amount": 250.0},
        ]
        
        subtotal = sum(item["amount"] for item in items)
        tax = subtotal * 0.1  # 10% tax
        total = subtotal + tax
        
        status = random.choice(["pending", "paid", "overdue"])
        payment_id = None
        paid_date = None
        
        if status == "paid":
            # Find a payment for this contract
            payment = db.query(Payment).filter(
                Payment.contract_id == contract.id,
                Payment.status == "completed"
            ).first()
            if payment:
                payment_id = payment.id
                paid_date = datetime.utcnow() - timedelta(days=random.randint(1, 10))
        
        invoice = Invoice(
            invoice_number=invoice_num,
            contract_id=contract.id,
            from_user_id=contract.freelancer_id,
            to_user_id=contract.client_id,
            subtotal=subtotal,
            tax=tax,
            total=total,
            due_date=datetime.utcnow() + timedelta(days=14),
            status=status,
            items=json.dumps(items),
            payment_id=payment_id,
            paid_date=paid_date,
            notes="Thank you for your business!"
        )
        invoices.append(invoice)
        db.add(invoice)
    
    db.commit()
    print(f"✅ Created {len(invoices)} invoices")
    return invoices

def seed_escrow(db: Session):
    """Create escrow records"""
    print("Seeding escrow records...")
    
    contracts = db.query(Contract).filter(Contract.status == "active").all()
    if not contracts:
        print("⚠️  No active contracts found, skipping escrow")
        return
    
    escrow_records = []
    for contract in contracts[:3]:  # First 3 contracts
        amount = contract.amount * random.uniform(0.3, 0.5)  # 30-50% of contract
        released = amount * random.uniform(0, 0.7) if random.random() > 0.3 else 0
        
        status = random.choice(["active", "released", "pending"])
        if released >= amount:
            status = "released"
        
        escrow = Escrow(
            contract_id=contract.id,
            client_id=contract.client_id,
            amount=round(amount, 2),
            released_amount=round(released, 2),
            status=status,
            expires_at=datetime.utcnow() + timedelta(days=90)
        )
        escrow_records.append(escrow)
        db.add(escrow)
    
    db.commit()
    print(f"✅ Created {len(escrow_records)} escrow records")
    return escrow_records

def seed_favorites(db: Session):
    """Create user favorites"""
    print("Seeding favorites...")
    
    users = db.query(User).filter(User.user_type == "client").all()
    projects = db.query(Project).all()
    freelancers = db.query(User).filter(User.user_type == "freelancer").all()
    
    if not users or not projects:
        print("⚠️  No users or projects found, skipping favorites")
        return
    
    favorites = []
    for user in users:
        # Favorite 2-4 projects
        for project in random.sample(projects, min(random.randint(2, 4), len(projects))):
            fav = Favorite(
                user_id=user.id,
                target_type="project",
                target_id=project.id
            )
            favorites.append(fav)
            db.add(fav)
        
        # Favorite 1-3 freelancers
        if freelancers:
            for freelancer in random.sample(freelancers, min(random.randint(1, 3), len(freelancers))):
                fav = Favorite(
                    user_id=user.id,
                    target_type="freelancer",
                    target_id=freelancer.id
                )
                favorites.append(fav)
                db.add(fav)
    
    db.commit()
    print(f"✅ Created {len(favorites)} favorites")

def seed_support_tickets(db: Session):
    """Create support tickets"""
    print("Seeding support tickets...")
    
    users = db.query(User).limit(10).all()
    admins = db.query(User).filter(User.role == "admin").all()
    
    if not users:
        print("⚠️  No users found, skipping support tickets")
        return
    
    tickets_data = [
        {
            "subject": "Payment issue - Unable to withdraw funds",
            "description": "I've been trying to withdraw my earnings for the past 3 days but the transaction keeps failing. Can you please help?",
            "category": "billing",
            "priority": "high"
        },
        {
            "subject": "How to verify my account?",
            "description": "I uploaded my documents but haven't heard back. How long does verification take?",
            "category": "account",
            "priority": "medium"
        },
        {
            "subject": "API integration help needed",
            "description": "I'm trying to integrate the API but getting 401 errors. The documentation seems incomplete.",
            "category": "technical",
            "priority": "urgent"
        },
        {
            "subject": "Question about fees",
            "description": "What are the platform fees for freelancers? I couldn't find clear information on the pricing page.",
            "category": "billing",
            "priority": "low"
        },
        {
            "subject": "Dispute resolution timeline",
            "description": "I filed a dispute 2 weeks ago and haven't received any update. What's the typical resolution time?",
            "category": "other",
            "priority": "high"
        },
    ]
    
    tickets = []
    for i, ticket_data in enumerate(tickets_data):
        user = random.choice(users)
        status = random.choice(["open", "in_progress", "resolved", "closed"])
        assigned_to = random.choice(admins).id if admins and status in ["in_progress", "resolved", "closed"] else None
        
        ticket = SupportTicket(
            user_id=user.id,
            assigned_to=assigned_to,
            status=status,
            **ticket_data
        )
        tickets.append(ticket)
        db.add(ticket)
    
    db.commit()
    print(f"✅ Created {len(tickets)} support tickets")

def seed_refunds(db: Session):
    """Create refund requests"""
    print("Seeding refunds...")
    
    payments = db.query(Payment).filter(Payment.status == "completed").all()
    admins = db.query(User).filter(User.role == "admin").all()
    
    if not payments:
        print("⚠️  No completed payments found, skipping refunds")
        return
    
    refunds = []
    for payment in payments[:3]:  # Create refunds for first 3 payments
        amount = payment.amount * random.uniform(0.3, 1.0)  # 30-100% refund
        status = random.choice(["pending", "approved", "rejected", "processed"])
        
        approved_by = None
        processed_at = None
        
        if status in ["approved", "processed"]:
            approved_by = random.choice(admins).id if admins else None
        
        if status == "processed":
            processed_at = datetime.utcnow() - timedelta(days=random.randint(1, 5))
        
        refund = Refund(
            payment_id=payment.id,
            amount=round(amount, 2),
            reason="Project cancelled by client. Requesting partial/full refund.",
            status=status,
            requested_by=payment.from_user_id,
            approved_by=approved_by,
            processed_at=processed_at
        )
        refunds.append(refund)
        db.add(refund)
    
    db.commit()
    print(f"✅ Created {len(refunds)} refunds")

def main():
    """Main seed function"""
    print("\n🌱 Starting comprehensive database seeding...\n")
    
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        # Seed in order (respecting dependencies)
        seed_categories(db)
        tags = seed_tags(db)
        seed_project_tags(db, tags)
        seed_time_entries(db)
        seed_invoices(db)
        seed_escrow(db)
        seed_favorites(db)
        seed_support_tickets(db)
        seed_refunds(db)
        
        print("\n✅ Database seeding completed successfully!\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}\n")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()

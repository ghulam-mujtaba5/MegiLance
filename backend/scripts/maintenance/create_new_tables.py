"""
Create critical missing tables using existing database connection
Run this inside the backend container
"""
from app.db.session import engine
from sqlalchemy import text

print("\n🔌 Using existing database connection (Turso/libSQL preferred)...")

# SQL statements for critical tables
tables_sql = [
    # 1. ESCROW table
    """
    CREATE TABLE escrow (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        contract_id NUMBER NOT NULL,
        client_id NUMBER NOT NULL,
        amount NUMBER(12,2) NOT NULL,
        status VARCHAR2(20) DEFAULT 'pending',
        released_amount NUMBER(12,2) DEFAULT 0,
        released_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_escrow_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
        CONSTRAINT fk_escrow_client FOREIGN KEY (client_id) REFERENCES users(id)
    )
    """,
    
    # 2. TIME_ENTRIES table
    """
    CREATE TABLE time_entries (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id NUMBER NOT NULL,
        contract_id NUMBER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes NUMBER,
        description VARCHAR2(1000),
        billable NUMBER(1) DEFAULT 1,
        hourly_rate NUMBER(10,2),
        amount NUMBER(10,2),
        status VARCHAR2(20) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_time_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_time_contract FOREIGN KEY (contract_id) REFERENCES contracts(id)
    )
    """,
    
    # 3. INVOICES table
    """
    CREATE TABLE invoices (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        invoice_number VARCHAR2(50) UNIQUE NOT NULL,
        contract_id NUMBER NOT NULL,
        from_user_id NUMBER NOT NULL,
        to_user_id NUMBER NOT NULL,
        subtotal NUMBER(12,2) NOT NULL,
        tax NUMBER(10,2) DEFAULT 0,
        total NUMBER(12,2) NOT NULL,
        due_date TIMESTAMP,
        paid_date TIMESTAMP,
        status VARCHAR2(20) DEFAULT 'pending',
        items CLOB,
        payment_id NUMBER,
        notes VARCHAR2(2000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_invoice_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
        CONSTRAINT fk_invoice_from FOREIGN KEY (from_user_id) REFERENCES users(id),
        CONSTRAINT fk_invoice_to FOREIGN KEY (to_user_id) REFERENCES users(id),
        CONSTRAINT fk_invoice_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    )
    """,
    
    # 4. CATEGORIES table
    """
    CREATE TABLE categories (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR2(100) UNIQUE NOT NULL,
        slug VARCHAR2(100) UNIQUE NOT NULL,
        description VARCHAR2(500),
        icon VARCHAR2(100),
        parent_id NUMBER,
        is_active NUMBER(1) DEFAULT 1,
        project_count NUMBER DEFAULT 0,
        sort_order NUMBER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
    """,
    
    # 5. FAVORITES table
    """
    CREATE TABLE favorites (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id NUMBER NOT NULL,
        target_type VARCHAR2(20) NOT NULL,
        target_id NUMBER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT uq_favorite UNIQUE (user_id, target_type, target_id)
    )
    """,
    
    # 6. PROJECT_VIEWS table
    """
    CREATE TABLE project_views (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id NUMBER NOT NULL,
        viewer_id NUMBER,
        view_count NUMBER DEFAULT 1,
        last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_view_project FOREIGN KEY (project_id) REFERENCES projects(id),
        CONSTRAINT fk_view_user FOREIGN KEY (viewer_id) REFERENCES users(id)
    )
    """,
    
    # 7. SUPPORT_TICKETS table
    """
    CREATE TABLE support_tickets (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id NUMBER NOT NULL,
        subject VARCHAR2(255) NOT NULL,
        description CLOB NOT NULL,
        category VARCHAR2(50),
        priority VARCHAR2(20) DEFAULT 'medium',
        status VARCHAR2(20) DEFAULT 'open',
        assigned_to NUMBER,
        attachments VARCHAR2(2000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_ticket_assigned FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
    """,
    
    # 8. TAGS table
    """
    CREATE TABLE tags (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR2(50) UNIQUE NOT NULL,
        slug VARCHAR2(50) UNIQUE NOT NULL,
        type VARCHAR2(20) DEFAULT 'general',
        usage_count NUMBER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    
    # 9. PROJECT_TAGS table
    """
    CREATE TABLE project_tags (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id NUMBER NOT NULL,
        tag_id NUMBER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ptag_project FOREIGN KEY (project_id) REFERENCES projects(id),
        CONSTRAINT fk_ptag_tag FOREIGN KEY (tag_id) REFERENCES tags(id),
        CONSTRAINT uq_project_tag UNIQUE (project_id, tag_id)
    )
    """,
    
    # 10. REFUNDS table
    """
    CREATE TABLE refunds (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        payment_id NUMBER NOT NULL,
        amount NUMBER(12,2) NOT NULL,
        reason VARCHAR2(500),
        status VARCHAR2(20) DEFAULT 'pending',
        requested_by NUMBER NOT NULL,
        approved_by NUMBER,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
        CONSTRAINT fk_refund_requester FOREIGN KEY (requested_by) REFERENCES users(id),
        CONSTRAINT fk_refund_approver FOREIGN KEY (approved_by) REFERENCES users(id)
    )
    """
]

table_names = ['escrow', 'time_entries', 'invoices', 'categories', 'favorites', 
               'project_views', 'support_tickets', 'tags', 'project_tags', 'refunds']

created_count = 0
skipped_count = 0

with engine.connect() as conn:
    for i, sql in enumerate(tables_sql):
        table_name = table_names[i]
        try:
            print(f"📋 Creating table: {table_name.upper()}...")
            conn.execute(text(sql))
            conn.commit()
            print(f"✅ Table {table_name.upper()} created!")
            created_count += 1
        except Exception as e:
            if 'ORA-00955' in str(e) or 'already exists' in str(e).lower():
                print(f"⚠️  Table {table_name.upper()} already exists, skipping...")
                skipped_count += 1
            else:
                print(f"❌ Error creating {table_name.upper()}: {e}")

print(f"\n{'='*60}")
print(f"✅ Created {created_count} new tables")
print(f"⚠️  Skipped {skipped_count} existing tables")
print(f"{'='*60}\n")

# Insert default data
print("📂 Inserting default categories...")
categories_data = [
    ('Web Development', 'web-development', 'Build websites and web applications', 'code'),
    ('Mobile Development', 'mobile-development', 'iOS and Android app development', 'mobile'),
    ('Design & Creative', 'design-creative', 'Graphic design, UI/UX, branding', 'palette'),
    ('Writing & Content', 'writing-content', 'Content writing, copywriting, technical writing', 'edit'),
    ('Marketing & Sales', 'marketing-sales', 'Digital marketing, SEO, social media', 'trending-up'),
    ('Data & Analytics', 'data-analytics', 'Data science, analytics, visualization', 'bar-chart'),
    ('Blockchain & Web3', 'blockchain-web3', 'Smart contracts, DeFi, NFTs', 'link'),
    ('AI & Machine Learning', 'ai-ml', 'AI models, ML algorithms, LLMs', 'cpu'),
    ('DevOps & Cloud', 'devops-cloud', 'Cloud infrastructure, CI/CD, automation', 'cloud'),
    ('Consulting', 'consulting', 'Strategy, business consulting, advising', 'briefcase'),
]

with engine.connect() as conn:
    try:
        for name, slug, desc, icon in categories_data:
            conn.execute(text("""
                INSERT INTO categories (name, slug, description, icon, is_active, project_count, sort_order)
                VALUES (:name, :slug, :desc, :icon, 1, 0, 0)
            """), {"name": name, "slug": slug, "desc": desc, "icon": icon})
        conn.commit()
        print(f"✅ Inserted {len(categories_data)} default categories")
    except Exception as e:
        print(f"⚠️  Categories might already exist: {e}")

# Insert sample tags
print("🏷️  Inserting sample tags...")
tags_data = [
    ('react', 'react', 'skill'), ('nodejs', 'nodejs', 'skill'), ('python', 'python', 'skill'),
    ('java', 'java', 'skill'), ('typescript', 'typescript', 'skill'), ('aws', 'aws', 'skill'),
    ('docker', 'docker', 'skill'), ('kubernetes', 'kubernetes', 'skill'),
    ('urgent', 'urgent', 'priority'), ('remote-only', 'remote-only', 'location'),
    ('long-term', 'long-term', 'duration'), ('fixed-price', 'fixed-price', 'budget'),
]

with engine.connect() as conn:
    try:
        for name, slug, tag_type in tags_data:
            conn.execute(text("""
                INSERT INTO tags (name, slug, type, usage_count)
                VALUES (:name, :slug, :tag_type, 0)
            """), {"name": name, "slug": slug, "tag_type": tag_type})
        conn.commit()
        print(f"✅ Inserted {len(tags_data)} sample tags")
    except Exception as e:
        print(f"⚠️  Tags might already exist: {e}")

print("\n🎉 Database setup complete!")
print("\n📊 New Tables Created:")
for i, name in enumerate(table_names, 1):
    print(f"   {i}. {name}")

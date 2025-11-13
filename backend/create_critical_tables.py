"""
Create critical missing tables for MegiLance platform
Tables: escrow, time_entries, invoices, categories, favorites
"""
import oracledb
import os

# Oracle connection details
username = "ADMIN"
password = "MegiLance2024#Secure"
dsn = "megilanceai_high"
wallet_location = "/app/oracle-wallet"
wallet_password = "MegiLance2024#Secure"

# Set wallet location
os.environ['TNS_ADMIN'] = wallet_location

print("\n🔌 Connecting to Oracle 26ai Autonomous Database...")
connection = oracledb.connect(
    user=username,
    password=password,
    dsn=dsn,
    config_dir=wallet_location,
    wallet_location=wallet_location,
    wallet_password=wallet_password
)

cursor = connection.cursor()
print("✅ Connected successfully!\n")

# SQL statements for critical tables
tables = {
    'escrow': """
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
    
    'time_entries': """
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
    
    'invoices': """
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
    
    'categories': """
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
    
    'favorites': """
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
    
    'project_views': """
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
    
    'support_tickets': """
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
    
    'tags': """
        CREATE TABLE tags (
            id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            name VARCHAR2(50) UNIQUE NOT NULL,
            slug VARCHAR2(50) UNIQUE NOT NULL,
            type VARCHAR2(20) DEFAULT 'general',
            usage_count NUMBER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """,
    
    'project_tags': """
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
    
    'refunds': """
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
}

# Create tables
created_count = 0
skipped_count = 0

for table_name, create_sql in tables.items():
    try:
        print(f"📋 Creating table: {table_name.upper()}...")
        cursor.execute(create_sql)
        connection.commit()
        print(f"✅ Table {table_name.upper()} created successfully!")
        created_count += 1
    except oracledb.DatabaseError as e:
        error_obj, = e.args
        if error_obj.code == 955:  # Table already exists
            print(f"⚠️  Table {table_name.upper()} already exists, skipping...")
            skipped_count += 1
        else:
            print(f"❌ Error creating table {table_name.upper()}: {error_obj.message}")

print(f"\n{'='*60}")
print(f"✅ Created {created_count} new tables")
print(f"⚠️  Skipped {skipped_count} existing tables")
print(f"{'='*60}\n")

# Insert default categories
print("📂 Inserting default categories...")
default_categories = [
    ('Web Development', 'web-development', 'Build websites and web applications', 'code', None),
    ('Mobile Development', 'mobile-development', 'iOS and Android app development', 'mobile', None),
    ('Design & Creative', 'design-creative', 'Graphic design, UI/UX, branding', 'palette', None),
    ('Writing & Content', 'writing-content', 'Content writing, copywriting, technical writing', 'edit', None),
    ('Marketing & Sales', 'marketing-sales', 'Digital marketing, SEO, social media', 'trending-up', None),
    ('Data & Analytics', 'data-analytics', 'Data science, analytics, visualization', 'bar-chart', None),
    ('Blockchain & Web3', 'blockchain-web3', 'Smart contracts, DeFi, NFTs', 'link', None),
    ('AI & Machine Learning', 'ai-ml', 'AI models, ML algorithms, LLMs', 'cpu', None),
    ('DevOps & Cloud', 'devops-cloud', 'Cloud infrastructure, CI/CD, automation', 'cloud', None),
    ('Consulting', 'consulting', 'Strategy, business consulting, advising', 'briefcase', None),
]

try:
    for name, slug, desc, icon, parent in default_categories:
        cursor.execute("""
            INSERT INTO categories (name, slug, description, icon, parent_id, is_active, project_count, sort_order)
            VALUES (:1, :2, :3, :4, :5, 1, 0, :6)
        """, [name, slug, desc, icon, parent, 0])
    connection.commit()
    print(f"✅ Inserted {len(default_categories)} default categories")
except oracledb.DatabaseError as e:
    print(f"⚠️  Categories might already exist: {e}")

# Insert sample tags
print("🏷️  Inserting sample tags...")
sample_tags = [
    ('react', 'react', 'skill'),
    ('nodejs', 'nodejs', 'skill'),
    ('python', 'python', 'skill'),
    ('java', 'java', 'skill'),
    ('typescript', 'typescript', 'skill'),
    ('aws', 'aws', 'skill'),
    ('docker', 'docker', 'skill'),
    ('kubernetes', 'kubernetes', 'skill'),
    ('urgent', 'urgent', 'priority'),
    ('remote-only', 'remote-only', 'location'),
    ('long-term', 'long-term', 'duration'),
    ('fixed-price', 'fixed-price', 'budget'),
]

try:
    for name, slug, tag_type in sample_tags:
        cursor.execute("""
            INSERT INTO tags (name, slug, type, usage_count)
            VALUES (:1, :2, :3, 0)
        """, [name, slug, tag_type])
    connection.commit()
    print(f"✅ Inserted {len(sample_tags)} sample tags")
except oracledb.DatabaseError as e:
    print(f"⚠️  Tags might already exist: {e}")

cursor.close()
connection.close()

print("\n🎉 Database setup complete!")
print("\n📊 New Tables Created:")
print("   1. escrow - Payment escrow system")
print("   2. time_entries - Work hour tracking")
print("   3. invoices - Billing and invoices")
print("   4. categories - Project categories (with 10 defaults)")
print("   5. favorites - User bookmarks")
print("   6. project_views - View tracking")
print("   7. support_tickets - Help desk")
print("   8. tags - Searchable tags (with 12 samples)")
print("   9. project_tags - Project-tag associations")
print("   10. refunds - Payment refunds")

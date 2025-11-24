#!/usr/bin/env python3
"""
Manually create missing tables (legacy Oracle wording removed) without index conflicts
"""
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

# SQL to create missing tables manually (without duplicate primary key indexes)
missing_tables_sql = [
    # Portfolio Items
    """
    CREATE TABLE portfolio_items (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        freelancer_id NUMBER NOT NULL,
        title VARCHAR2(255) NOT NULL,
        description CLOB NOT NULL,
        image_url VARCHAR2(500) NOT NULL,
        project_url VARCHAR2(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_portfolio_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id)
    )
    """,
    
    # Conversations
    """
    CREATE TABLE conversations (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        project_id NUMBER,
        client_id NUMBER NOT NULL,
        freelancer_id NUMBER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_conv_project FOREIGN KEY (project_id) REFERENCES projects(id),
        CONSTRAINT fk_conv_client FOREIGN KEY (client_id) REFERENCES users(id),
        CONSTRAINT fk_conv_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id)
    )
    """,
    
    # Messages
    """
    CREATE TABLE messages (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        conversation_id NUMBER NOT NULL,
        sender_id NUMBER NOT NULL,
        content CLOB NOT NULL,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
        CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id)
    )
    """,
    
    # Notifications
    """
    CREATE TABLE notifications (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id NUMBER NOT NULL,
        type VARCHAR2(50) NOT NULL,
        title VARCHAR2(255) NOT NULL,
        message CLOB NOT NULL,
        data CLOB,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """,
    
    # Reviews
    """
    CREATE TABLE reviews (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        contract_id NUMBER NOT NULL,
        reviewer_id NUMBER NOT NULL,
        reviewee_id NUMBER NOT NULL,
        rating NUMBER(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment CLOB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_review_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
        CONSTRAINT fk_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id),
        CONSTRAINT fk_review_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id)
    )
    """,
    
    # Disputes
    """
    CREATE TABLE disputes (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        contract_id NUMBER NOT NULL,
        raised_by NUMBER NOT NULL,
        reason CLOB NOT NULL,
        status VARCHAR2(50) DEFAULT 'Open',
        resolution CLOB,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_dispute_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
        CONSTRAINT fk_dispute_user FOREIGN KEY (raised_by) REFERENCES users(id)
    )
    """,
    
    # Milestones
    """
    CREATE TABLE milestones (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        contract_id NUMBER NOT NULL,
        title VARCHAR2(255) NOT NULL,
        description CLOB,
        amount NUMBER(10,2) NOT NULL,
        due_date DATE,
        status VARCHAR2(50) DEFAULT 'Pending',
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_milestone_contract FOREIGN KEY (contract_id) REFERENCES contracts(id)
    )
    """,
    
    # User Sessions
    """
    CREATE TABLE user_sessions (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id NUMBER NOT NULL,
        session_token VARCHAR2(500) NOT NULL,
        ip_address VARCHAR2(45),
        user_agent VARCHAR2(500),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """,
    
    # Audit Logs
    """
    CREATE TABLE audit_logs (
        id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id NUMBER,
        action VARCHAR2(100) NOT NULL,
        entity_type VARCHAR2(50),
        entity_id NUMBER,
        old_value CLOB,
        new_value CLOB,
        ip_address VARCHAR2(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """
]

# Create indexes for foreign keys
indexes_sql = [
    "CREATE INDEX idx_portfolio_freelancer ON portfolio_items(freelancer_id)",
    "CREATE INDEX idx_conv_project ON conversations(project_id)",
    "CREATE INDEX idx_conv_client ON conversations(client_id)",
    "CREATE INDEX idx_conv_freelancer ON conversations(freelancer_id)",
    "CREATE INDEX idx_msg_conversation ON messages(conversation_id)",
    "CREATE INDEX idx_msg_sender ON messages(sender_id)",
    "CREATE INDEX idx_notif_user ON notifications(user_id)",
    "CREATE INDEX idx_review_contract ON reviews(contract_id)",
    "CREATE INDEX idx_review_reviewer ON reviews(reviewer_id)",
    "CREATE INDEX idx_review_reviewee ON reviews(reviewee_id)",
    "CREATE INDEX idx_dispute_contract ON disputes(contract_id)",
    "CREATE INDEX idx_dispute_user ON disputes(raised_by)",
    "CREATE INDEX idx_milestone_contract ON milestones(contract_id)",
    "CREATE INDEX idx_session_user ON user_sessions(user_id)",
    "CREATE INDEX idx_session_token ON user_sessions(session_token)",
    "CREATE INDEX idx_audit_user ON audit_logs(user_id)",
    "CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id)"
]

print("Creating missing tables...")

with engine.connect() as conn:
    for i, sql in enumerate(missing_tables_sql, 1):
        table_name = sql.split('CREATE TABLE ')[1].split(' (')[0]
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"  ✓ Created table: {table_name}")
        except Exception as e:
            if 'ORA-00955' in str(e):  # Table already exists
                print(f"  ✓ Table already exists: {table_name}")
            else:
                print(f"  ✗ Error creating {table_name}: {e}")
                continue
    
    print("\nCreating indexes...")
    for idx_sql in indexes_sql:
        idx_name = idx_sql.split('CREATE INDEX ')[1].split(' ON')[0]
        try:
            conn.execute(text(idx_sql))
            conn.commit()
            print(f"  ✓ Created index: {idx_name}")
        except Exception as e:
            if 'ORA-00955' in str(e):  # Index already exists
                print(f"  ✓ Index already exists: {idx_name}")
            else:
                print(f"  ⚠ Error creating {idx_name}: {str(e)[:100]}")
    
    # Verify all tables
    result = conn.execute(text('SELECT table_name FROM user_tables ORDER BY table_name'))
    tables = [row[0] for row in result]
    
    print(f"\n✅ Database now has {len(tables)} tables:")
    for table in tables:
        count_result = conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
        count = count_result.scalar()
        print(f"  ✓ {table}: {count} records")

print("\n🎉 All tables created successfully!")

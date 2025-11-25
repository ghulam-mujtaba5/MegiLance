import sys
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.turso_http import execute_query

def create_table():
    print("Creating job_alerts table...")
    
    sql = """
    CREATE TABLE IF NOT EXISTS job_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        keywords VARCHAR(255) NOT NULL,
        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
        is_ai_powered BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """
    
    try:
        result = execute_query(sql, [])
        print("Table created successfully or already exists.")
        print(result)
    except Exception as e:
        print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_table()

import os
from dotenv import load_dotenv
load_dotenv()

from app.db.turso_http import execute_query

def add_tags_column():
    sql = 'ALTER TABLE portfolio_items ADD COLUMN tags TEXT'
    print('Adding tags column to portfolio_items...')
    try:
        result = execute_query(sql, [])
        print('Result:', result)
    except Exception as e:
        print('Error (maybe column exists):', e)

if __name__ == '__main__':
    add_tags_column()

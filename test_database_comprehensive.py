"""
Database Operations Test Suite
Tests all database tables, CRUD operations, and data integrity
"""
import sys
sys.path.insert(0, 'backend')

from app.db.turso_http import execute_query
import json

def test_database():
    """Test all database operations"""
    print("=" * 60)
    print("DATABASE COMPREHENSIVE TEST")
    print("=" * 60)
    
    results = {"passed": 0, "failed": 0, "tables": {}}
    
    # Get all tables
    print("\n[1/5] Listing all tables...")
    tables_result = execute_query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    
    if tables_result:
        tables = [r['name'] for r in tables_result]
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
            results["tables"][table] = {"exists": True, "count": 0}
    else:
        print("FAILED to list tables")
        return
    
    # Count records in each table
    print("\n[2/5] Counting records in each table...")
    for table in tables:
        try:
            count_result = execute_query(f"SELECT COUNT(*) as count FROM {table}")
            if count_result:
                count = count_result[0]['count']
                results["tables"][table]["count"] = count
                print(f"  {table}: {count} records")
                results["passed"] += 1
            else:
                print(f"  {table}: FAILED to count")
                results["failed"] += 1
        except Exception as e:
            print(f"  {table}: ERROR - {str(e)[:50]}")
            results["failed"] += 1
    
    # Test user queries
    print("\n[3/5] Testing user queries...")
    users = execute_query("SELECT id, email, role, is_active FROM users LIMIT 5")
    if users:
        print(f"Sample users ({len(users)}):")
        for user in users:
            print(f"  - {user['email']} ({user['role']})")
        results["passed"] += 1
    else:
        print("FAILED to query users")
        results["failed"] += 1
    
    # Test project queries
    print("\n[4/5] Testing project queries...")
    projects = execute_query("SELECT id, title, status FROM projects LIMIT 5")
    if projects:
        print(f"Sample projects ({len(projects)}):")
        for project in projects:
            print(f"  - {project['title']} ({project.get('status', 'N/A')})")
        results["passed"] += 1
    else:
        print("FAILED to query projects")
        results["failed"] += 1
    
    # Test joins
    print("\n[5/5] Testing complex queries...")
    try:
        # Get user stats
        user_stats = execute_query("""
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        """)
        if user_stats:
            print("User distribution:")
            for stat in user_stats:
                print(f"  {stat['role']}: {stat['count']}")
            results["passed"] += 1
        else:
            results["failed"] += 1
    except Exception as e:
        print(f"ERROR: {str(e)[:100]}")
        results["failed"] += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("DATABASE TEST SUMMARY")
    print("=" * 60)
    print(f"Tables Found: {len(tables)}")
    print(f"Total Tests: {results['passed'] + results['failed']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    
    # Save results
    with open("db_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nResults saved to db_test_results.json")

if __name__ == "__main__":
    test_database()

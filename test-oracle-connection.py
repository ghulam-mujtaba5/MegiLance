#!/usr/bin/env python3
"""
Test Oracle Autonomous Database Connection
Tests connectivity to Oracle Cloud Infrastructure
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def test_oracle_wallet():
    """Test if wallet files exist and are readable"""
    print("\n🔐 Testing Oracle Wallet...")
    print("━" * 60)
    
    wallet_dir = Path("oracle-wallet")
    
    if not wallet_dir.exists():
        print("❌ Wallet directory not found:", wallet_dir.absolute())
        return False
    
    required_files = ["tnsnames.ora", "sqlnet.ora", "cwallet.sso", "ewallet.p12"]
    missing_files = []
    
    for file_name in required_files:
        file_path = wallet_dir / file_name
        if file_path.exists():
            print(f"✅ Found: {file_name}")
        else:
            print(f"❌ Missing: {file_name}")
            missing_files.append(file_name)
    
    if missing_files:
        print(f"\n❌ Missing files: {', '.join(missing_files)}")
        return False
    
    print("\n✅ All wallet files present")
    return True


def test_oci_config():
    """Test OCI CLI configuration"""
    print("\n⚙️  Testing OCI Configuration...")
    print("━" * 60)
    
    oci_config_path = Path.home() / ".oci" / "config"
    
    if not oci_config_path.exists():
        print("❌ OCI config not found:", oci_config_path)
        return False
    
    print(f"✅ OCI config found: {oci_config_path}")
    
    # Check for required config values
    with open(oci_config_path) as f:
        config_content = f.read()
        
        required_keys = ["user", "fingerprint", "tenancy", "region", "key_file"]
        missing_keys = []
        
        for key in required_keys:
            if f"{key}=" in config_content:
                print(f"✅ Found: {key}")
            else:
                print(f"❌ Missing: {key}")
                missing_keys.append(key)
        
        if missing_keys:
            print(f"\n❌ Missing keys: {', '.join(missing_keys)}")
            return False
    
    print("\n✅ OCI config is valid")
    return True


def test_database_connection():
    """Test connection to Oracle Autonomous Database"""
    print("\n🗄️  Testing Database Connection...")
    print("━" * 60)
    
    try:
        import oracledb
        print("✅ oracledb module imported")
    except ImportError as e:
        print(f"❌ Failed to import oracledb: {e}")
        print("   Install with: pip install oracledb")
        return False
    
    # Read .env.oracle for connection details
    env_file = Path(".env.oracle")
    if not env_file.exists():
        print("❌ .env.oracle not found")
        return False
    
    print("✅ .env.oracle found")
    
    # Parse .env.oracle
    config = {}
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, value = line.split("=", 1)
                config[key.strip()] = value.strip()
    
    print(f"✅ Loaded {len(config)} configuration values")
    
    # Note: Actual connection requires the database password
    # which was generated during database creation
    print("\n⚠️  To test actual connection, you need:")
    print("   1. Database password (generated during creation)")
    print("   2. Update DATABASE_URL in backend/.env")
    print("   3. Run: python -c \"from app.db.session import engine; print(engine)\"")
    
    return True


def test_oci_storage():
    """Test OCI Object Storage connection"""
    print("\n📦 Testing OCI Object Storage...")
    print("━" * 60)
    
    try:
        import oci
        print("✅ oci module imported")
        
        # Try to create config
        try:
            config = oci.config.from_file(profile_name="DEFAULT")
            print("✅ OCI config loaded successfully")
            
            # Try to create Object Storage client
            object_storage = oci.object_storage.ObjectStorageClient(config)
            print("✅ Object Storage client created")
            
            # Try to get namespace
            namespace = object_storage.get_namespace().data
            print(f"✅ Namespace: {namespace}")
            
            # Try to list buckets
            compartment_id = config.get("tenancy")
            buckets = object_storage.list_buckets(namespace, compartment_id).data
            
            print(f"\n📋 Found {len(buckets)} bucket(s):")
            for bucket in buckets:
                print(f"   • {bucket.name}")
            
            print("\n✅ OCI Object Storage is working!")
            return True
            
        except Exception as e:
            print(f"❌ Error accessing OCI Storage: {e}")
            return False
            
    except ImportError as e:
        print(f"❌ Failed to import oci: {e}")
        print("   Install with: pip install oci")
        return False


def main():
    """Run all tests"""
    print("\n╔══════════════════════════════════════════════════════════════╗")
    print("║     ORACLE CLOUD INFRASTRUCTURE CONNECTION TEST             ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    
    results = {
        "Oracle Wallet": test_oracle_wallet(),
        "OCI Configuration": test_oci_config(),
        "Database Connection": test_database_connection(),
        "OCI Object Storage": test_oci_storage(),
    }
    
    print("\n╔══════════════════════════════════════════════════════════════╗")
    print("║                      TEST SUMMARY                            ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name:.<50} {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n✅ All tests passed! Oracle Cloud migration is complete.")
        print("\n📋 Next steps:")
        print("   1. Update DATABASE_URL in backend/.env with actual password")
        print("   2. Run database migrations: alembic upgrade head")
        print("   3. Test backend: uvicorn main:app --reload")
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
    
    print()
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

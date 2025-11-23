#!/usr/bin/env python3
# @AI-HINT: Diagnostic script to check database configuration and environment variables

import os
import sys
from app.core.config import get_settings

def check_configuration():
    """Check and display current configuration"""
    print("=" * 60)
    print("🔍 MegiLance Backend Configuration Check")
    print("=" * 60)
    
    settings = get_settings()
    
    print(f"\n📋 Environment Variables:")
    print(f"   ENVIRONMENT: {os.getenv('ENVIRONMENT', 'NOT SET')}")
    print(f"   environment: {os.getenv('environment', 'NOT SET')}")
    print(f"   DB_TYPE: {os.getenv('DB_TYPE', 'NOT SET')}")
    print(f"   TNS_ADMIN: {os.getenv('TNS_ADMIN', 'NOT SET')}")
    print(f"   ORACLE_CLIENT_DIR: {os.getenv('ORACLE_CLIENT_DIR', 'NOT SET')}")
    
    print(f"\n⚙️  Settings Object:")
    print(f"   App Name: {settings.app_name}")
    print(f"   Environment: {settings.environment}")
    print(f"   Database URL: {settings.database_url[:50]}...")
    print(f"   Oracle Wallet: {settings.oracle_wallet_location}")
    print(f"   Oracle Service: {settings.oracle_service_name}")
    
    print(f"\n🗄️  Database Type Detection:")
    if 'oracle' in settings.database_url.lower():
        print("   ✅ Oracle Autonomous Database")
        print(f"   Wallet Location: {settings.oracle_wallet_location or '/app/oracle-wallet'}")
        
        # Check if wallet files exist
        wallet_path = settings.oracle_wallet_location or '/app/oracle-wallet'
        if os.path.exists(wallet_path):
            print(f"   ✅ Wallet directory exists")
            wallet_files = os.listdir(wallet_path)
            print(f"   📁 Wallet files: {', '.join(wallet_files)}")
        else:
            print(f"   ❌ Wallet directory NOT FOUND: {wallet_path}")
            
    elif 'postgresql' in settings.database_url.lower():
        print("   ✅ PostgreSQL Database")
        print(f"   Connection: {settings.database_url}")
    else:
        print("   ⚠️  Unknown database type")
    
    print(f"\n🔐 Security:")
    print(f"   Secret Key Set: {'✅' if settings.secret_key and len(settings.secret_key) > 20 else '❌'}")
    print(f"   CORS Origins: {settings.backend_cors_origins}")
    
    print(f"\n📊 Summary:")
    if settings.environment == 'production':
        if 'oracle' in settings.database_url.lower():
            print("   ✅ Production mode with Oracle - CORRECT")
        else:
            print("   ⚠️  Production mode but using PostgreSQL - CHECK CONFIG")
    else:
        print(f"   ℹ️  Development mode ({settings.environment})")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        check_configuration()
    except Exception as e:
        print(f"\n❌ Error checking configuration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

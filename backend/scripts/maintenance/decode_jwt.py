import sys
from jose import jwt

# Token from login
token = sys.argv[1] if len(sys.argv) > 1 else ""

if not token:
    print("Usage: python decode_jwt.py <token>")
    sys.exit(1)

try:
    # Decode without verification to see payload
    payload = jwt.get_unverified_claims(token)
    print("✅ JWT Payload:")
    for key, value in payload.items():
        print(f"   {key}: {value}")
except Exception as e:
    print(f"❌ Error decoding JWT: {e}")

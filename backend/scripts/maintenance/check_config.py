from app.core.config import get_settings

s = get_settings()
print(f"Database URL: {s.turso_database_url}")
print(f"Auth Token: {s.turso_auth_token[:30] if s.turso_auth_token else 'None'}...")

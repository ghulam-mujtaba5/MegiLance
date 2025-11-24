from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///local.db')
with engine.connect() as conn:
    result = conn.execute(text('SELECT id, email, name, user_type, typeof(hashed_password) FROM users WHERE email = :email'), {'email': 'admin@megilance.com'})
    row = result.fetchone()
    if row:
        print(f"ID: {row[0]}")
        print(f"Email: {row[1]}")
        print(f"Name: {row[2]}")
        print(f"User Type: {row[3]}")
        print(f"Password Type: {row[4]}")
    else:
        print("User not found")

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hash_from_db = "$2b$12$G70ijlqG2xfdoLBpTO4Zgu0sDc8naiFMhftIx39LPm5Ul8PYHbeUK"
password = "Freelancer@123"

print(f"Hash: {hash_from_db}")
print(f"Password: {password}")
is_valid = pwd_context.verify(password, hash_from_db)
print(f"Generated Hash: {pwd_context.hash(password)}")

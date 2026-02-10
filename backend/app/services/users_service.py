# @AI-HINT: Service layer for user management operations (password changes, etc.)
# Contains business logic and all direct database queries for user endpoints

from app.db.turso_http import execute_query
from app.core.security import verify_password, get_password_hash
from typing import Optional


def get_user_password_hash(user_id: int) -> Optional[str]:
    """Fetch the hashed password for a user by ID."""
    result = execute_query(
        "SELECT hashed_password FROM users WHERE id = ?",
        [user_id]
    )
    if not result or not result.get("rows"):
        return None

    val = result["rows"][0][0]
    if isinstance(val, bytes):
        return val.decode("utf-8")
    return str(val) if val is not None else None


def update_user_password(user_id: int, new_password: str) -> None:
    """Hash and store a new password for the given user."""
    new_hash = get_password_hash(new_password)
    execute_query(
        "UPDATE users SET hashed_password = ? WHERE id = ?",
        [new_hash, user_id]
    )

"""
@AI-HINT: Turso HTTP API client for synchronous database queries
This module provides a simple HTTP-based interface to Turso/libSQL database
without using async/await to avoid event loop issues in FastAPI sync contexts.
Turso remote database ONLY - no local fallback.
"""

import requests
from typing import Optional, List, Dict, Any
from app.core.config import get_settings


class TursoHTTP:
    """Synchronous HTTP client for Turso remote database ONLY"""
    
    _instance = None
    _url: str = None
    _token: str = None
    _initialized: bool = False
    
    @classmethod
    def reset_instance(cls):
        """Reset singleton instance - used when settings change"""
        cls._instance = None
        cls._initialized = False
    
    @classmethod
    def get_instance(cls) -> Optional['TursoHTTP']:
        """Get singleton instance of TursoHTTP client - Turso remote database ONLY"""
        if cls._instance is None:
            settings = get_settings()
            cls._instance = cls()
            
            # Require Turso configuration
            if not settings.turso_database_url or not settings.turso_auth_token:
                raise RuntimeError(
                    "Turso database not configured. "
                    "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables."
                )
            
            # Check for placeholder tokens
            if "CHANGE_ME" in (settings.turso_auth_token or "") or len(settings.turso_auth_token or "") < 50:
                raise RuntimeError(
                    "Invalid Turso auth token. "
                    "Please set a valid TURSO_AUTH_TOKEN in environment variables."
                )
            
            cls._url = settings.turso_database_url.replace("libsql://", "https://")
            if not cls._url.endswith("/"):
                cls._url += "/"
            cls._token = settings.turso_auth_token
            print(f"[TURSO] HTTP client initialized: {cls._url[:50]}...")
                
        return cls._instance
    
    def execute(self, sql: str, params: List[Any] = None) -> Dict[str, Any]:
        """
        Execute a SQL query against Turso remote database
        """
        if params is None:
            params = []
        
        return self._execute_remote(sql, params)

    def _execute_remote(self, sql: str, params: List[Any]) -> Dict[str, Any]:
        """Execute query against Turso HTTP API"""
        response = requests.post(
            self._url,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json"
            },
            json={
                "statements": [{
                    "q": sql,
                    "params": params
                }]
            },
            timeout=10
        )
        
        if response.status_code != 200:
            raise Exception(f"Turso HTTP error: {response.status_code} - {response.text}")
        
        data = response.json()
        if not data or len(data) == 0:
            return {"columns": [], "rows": []}
        
        result = data[0].get("results", {})
        return {
            "columns": result.get("columns", []),
            "rows": result.get("rows", [])
        }
    
    def execute_many(self, statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute multiple statements against Turso remote database"""
        response = requests.post(
            self._url,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json"
            },
            json={"statements": statements},
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Turso HTTP error: {response.status_code} - {response.text}")
        
        data = response.json()
        results = []
        for item in data:
            result = item.get("results", {})
            results.append({
                "columns": result.get("columns", []),
                "rows": result.get("rows", [])
            })
        return results
    
    def fetch_one(self, sql: str, params: List[Any] = None) -> Optional[List[Any]]:
        """Execute query and return first row or None"""
        result = self.execute(sql, params)
        rows = result.get("rows", [])
        return rows[0] if rows else None
    
    def fetch_all(self, sql: str, params: List[Any] = None) -> List[List[Any]]:
        """Execute query and return all rows"""
        result = self.execute(sql, params)
        return result.get("rows", [])
    
    def fetch_scalar(self, sql: str, params: List[Any] = None) -> Any:
        """Execute query and return single value"""
        row = self.fetch_one(sql, params)
        return row[0] if row else None


def get_turso_http() -> TursoHTTP:
    """Get Turso HTTP client instance"""
    client = TursoHTTP.get_instance()
    return client


# ============ Simple helper functions for direct use ============

def execute_query(sql: str, params: List[Any] = None) -> Optional[Dict[str, Any]]:
    """
    Execute a SQL query and return the result.
    """
    try:
        client = TursoHTTP.get_instance()
        result = client.execute(sql, params)
        
        # Convert to the format expected by the frontend/helper (cols, rows with types)
        # This is a bit messy because the original execute_query returned a specific format
        # mimicking Turso's raw response structure for the frontend.
        
        columns = result.get("columns", [])
        rows_raw = result.get("rows", [])
        
        cols = [{"name": col} for col in columns]
        
        rows = []
        for row in rows_raw:
            row_data = []
            for val in row:
                if val is None:
                    row_data.append({"type": "null", "value": None})
                else:
                    row_data.append({"type": "text", "value": val})
            rows.append(row_data)
            
        return {
            "cols": cols,
            "rows": rows
        }

    except Exception as e:
        print(f"[DB] execute_query error: {e}")
        return None


def parse_rows(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Parse Turso result rows into list of dicts"""
    if not result:
        return []
    
    cols = result.get("cols", [])
    rows = result.get("rows", [])
    
    parsed = []
    for row in rows:
        item = {}
        for i, col in enumerate(cols):
            col_name = col.get("name", f"col_{i}")
            if i < len(row):
                cell = row[i]
                if cell.get("type") == "null":
                    item[col_name] = None
                else:
                    item[col_name] = cell.get("value")
            else:
                item[col_name] = None
        parsed.append(item)
    return parsed


def to_str(value: Any) -> Optional[str]:
    """Convert value to string, handling bytes and Turso dict format"""
    if value is None:
        return None
    # Handle Turso format: {"type": "text", "value": "..."}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    if isinstance(value, bytes):
        return value.decode('utf-8')
    return str(value)


def to_int(value: Any) -> Optional[int]:
    """Convert value to integer, handling Turso dict format"""
    if value is None:
        return None
    # Handle Turso format: {"type": "integer", "value": 123}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def to_float(value: Any) -> Optional[float]:
    """Convert value to float, handling Turso dict format"""
    if value is None:
        return None
    # Handle Turso format: {"type": "float"|"real", "value": 123.45}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def parse_date(value: Any) -> Optional[Any]:
    """Parse date value safely"""
    if value is None:
        return None
    # Handle Turso format: {"type": "text", "value": "..."}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    if isinstance(value, bytes):
        value = value.decode('utf-8')
    # Try to parse as datetime if it's a string
    if isinstance(value, str):
        from datetime import datetime
        try:
            # Handle ISO format
            if 'T' in value:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            # Handle date-only format
            return datetime.strptime(value[:19], '%Y-%m-%d %H:%M:%S')
        except (ValueError, TypeError):
            try:
                return datetime.strptime(value[:10], '%Y-%m-%d')
            except (ValueError, TypeError):
                return value
    return value

"""
@AI-HINT: Turso HTTP API client for synchronous database queries
This module provides a simple HTTP-based interface to Turso/libSQL database
without using async/await to avoid event loop issues in FastAPI sync contexts
"""

import requests
from typing import Optional, List, Dict, Any
from app.core.config import get_settings


class TursoHTTP:
    """Synchronous HTTP client for Turso database"""
    
    _instance = None
    _url: str = None
    _token: str = None
    
    @classmethod
    def get_instance(cls) -> Optional['TursoHTTP']:
        """Get singleton instance of TursoHTTP client"""
        if cls._instance is None:
            settings = get_settings()
            if settings.turso_database_url and settings.turso_auth_token:
                cls._instance = cls()
                cls._url = settings.turso_database_url.replace("libsql://", "https://")
                if not cls._url.endswith("/"):
                    cls._url += "/"
                cls._token = settings.turso_auth_token
                print(f"[TURSO] HTTP client initialized: {cls._url[:50]}...")
            else:
                print("[TURSO] No Turso credentials configured")
        return cls._instance
    
    def execute(self, sql: str, params: List[Any] = None) -> Dict[str, Any]:
        """
        Execute a SQL query against Turso
        
        Args:
            sql: SQL query string with ? placeholders
            params: List of parameter values
            
        Returns:
            Dict with 'columns' and 'rows' keys, or raises exception
        """
        if params is None:
            params = []
            
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
        """
        Execute multiple SQL statements in a single request
        
        Args:
            statements: List of {"q": sql, "params": [...]} dicts
            
        Returns:
            List of results, one per statement
        """
        response = requests.post(
            self._url,
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json"
            },
            json={"statements": statements},
            timeout=15
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
    """Get Turso HTTP client instance - raises exception if not configured"""
    client = TursoHTTP.get_instance()
    if client is None:
        raise Exception("Turso database not configured - set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN")
    return client


# ============ Simple helper functions for direct use ============

def execute_query(sql: str, params: List[Any] = None) -> Optional[Dict[str, Any]]:
    """
    Execute a SQL query and return the result.
    
    Args:
        sql: SQL query string with ? placeholders
        params: List of parameter values
        
    Returns:
        Dict with 'cols' and 'rows' keys, or None on error
    """
    if params is None:
        params = []
    
    try:
        settings = get_settings()
        url = settings.turso_database_url.replace("libsql://", "https://")
        token = settings.turso_auth_token
        
        # Build the statement - use object format if params provided
        if params:
            # Convert params to the correct format for ? placeholders
            statement = {
                "q": sql,
                "params": params
            }
        else:
            # Simple string format for no params
            statement = sql
        
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "statements": [statement]
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"[TURSO] HTTP error: {response.status_code} - {response.text}")
            return None
        
        data = response.json()
        if not data or len(data) == 0:
            return {"cols": [], "rows": []}
        
        first_result = data[0]
        if "error" in first_result:
            print(f"[TURSO] Query error: {first_result['error']}")
            return None
        
        results = first_result.get("results", {})
        
        # Convert to standard format with cols and rows
        columns = results.get("columns", [])
        rows_raw = results.get("rows", [])
        
        # Convert columns to col format expected by parse_rows
        cols = [{"name": col} for col in columns]
        
        # Convert rows to value format expected by parse_rows
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
        print(f"[TURSO] execute_query error: {e}")
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
    """Convert value to string, handling bytes"""
    if value is None:
        return None
    if isinstance(value, bytes):
        return value.decode('utf-8')
    return str(value)


def parse_date(value: Any) -> Optional[Any]:
    """Parse date value safely"""
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

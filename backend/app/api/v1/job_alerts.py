from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.security import get_current_user_from_token
from app.db.turso_http import execute_query, parse_rows

router = APIRouter()

# --- Schemas ---
class JobAlertBase(BaseModel):
    keywords: str
    frequency: str = "daily"
    is_ai_powered: bool = False

class JobAlertCreate(JobAlertBase):
    pass

class JobAlertUpdate(BaseModel):
    keywords: Optional[str] = None
    frequency: Optional[str] = None
    is_ai_powered: Optional[bool] = None

class JobAlert(JobAlertBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[JobAlert])
def get_job_alerts(current_user = Depends(get_current_user_from_token)):
    """Get all job alerts for the current user"""
    user_id = current_user.get("user_id")
    
    result = execute_query(
        "SELECT id, user_id, keywords, frequency, is_ai_powered, created_at, updated_at FROM job_alerts WHERE user_id = ? ORDER BY created_at DESC",
        [user_id]
    )
    
    alerts = []
    if result and result.get("rows"):
        for row in parse_rows(result):
            # Convert boolean
            row["is_ai_powered"] = bool(row.get("is_ai_powered"))
            alerts.append(row)
            
    return alerts

@router.post("/", response_model=JobAlert, status_code=status.HTTP_201_CREATED)
def create_job_alert(
    alert: JobAlertCreate,
    current_user = Depends(get_current_user_from_token)
):
    """Create a new job alert"""
    user_id = current_user.get("user_id")
    now = datetime.utcnow().isoformat()
    
    # Insert
    result = execute_query(
        """INSERT INTO job_alerts (user_id, keywords, frequency, is_ai_powered, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        [user_id, alert.keywords, alert.frequency, alert.is_ai_powered, now, now]
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create job alert")
        
    # Get ID
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
            
    return {
        "id": new_id,
        "user_id": user_id,
        "keywords": alert.keywords,
        "frequency": alert.frequency,
        "is_ai_powered": alert.is_ai_powered,
        "created_at": now,
        "updated_at": now
    }

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_alert(
    alert_id: int,
    current_user = Depends(get_current_user_from_token)
):
    """Delete a job alert"""
    user_id = current_user.get("user_id")
    
    # Check ownership
    check = execute_query("SELECT user_id FROM job_alerts WHERE id = ?", [alert_id])
    if not check or not check.get("rows"):
        raise HTTPException(status_code=404, detail="Job alert not found")
        
    rows = parse_rows(check)
    if rows[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this alert")
        
    execute_query("DELETE FROM job_alerts WHERE id = ?", [alert_id])
    return None

@router.put("/{alert_id}", response_model=JobAlert)
def update_job_alert(
    alert_id: int,
    alert_update: JobAlertUpdate,
    current_user = Depends(get_current_user_from_token)
):
    """Update a job alert"""
    user_id = current_user.get("user_id")
    
    # Check ownership
    check = execute_query("SELECT * FROM job_alerts WHERE id = ?", [alert_id])
    if not check or not check.get("rows"):
        raise HTTPException(status_code=404, detail="Job alert not found")
        
    rows = parse_rows(check)
    current_alert = rows[0]
    
    if current_alert["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this alert")
        
    # Build update query
    updates = []
    params = []
    now = datetime.utcnow().isoformat()
    
    if alert_update.keywords is not None:
        updates.append("keywords = ?")
        params.append(alert_update.keywords)
        
    if alert_update.frequency is not None:
        updates.append("frequency = ?")
        params.append(alert_update.frequency)
        
    if alert_update.is_ai_powered is not None:
        updates.append("is_ai_powered = ?")
        params.append(alert_update.is_ai_powered)
        
    updates.append("updated_at = ?")
    params.append(now)
    
    params.append(alert_id)
    
    execute_query(f"UPDATE job_alerts SET {', '.join(updates)} WHERE id = ?", params)
    
    # Return updated
    updated_result = execute_query("SELECT * FROM job_alerts WHERE id = ?", [alert_id])
    updated_rows = parse_rows(updated_result)
    updated_alert = updated_rows[0]
    updated_alert["is_ai_powered"] = bool(updated_alert["is_ai_powered"])
    
    return updated_alert

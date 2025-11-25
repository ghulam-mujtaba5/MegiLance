# @AI-HINT: Invoice API endpoints - Turso HTTP only (NO SQLite fallback)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date
import json

from app.db.turso_http import execute_query, to_str, parse_date
from app.core.security import get_current_user
from app.models import User
from app.schemas.invoice import (
    InvoiceCreate, InvoiceUpdate, InvoiceRead, 
    InvoicePayment, InvoiceList
)

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _row_to_invoice(row) -> dict:
    """Convert Turso row to invoice dict"""
    items = to_str(row[11])
    try:
        items_parsed = json.loads(items) if items else []
    except:
        items_parsed = []
    
    return {
        "id": int(row[0].get("value")) if row[0].get("type") != "null" else None,
        "invoice_number": to_str(row[1]),
        "contract_id": int(row[2].get("value")) if row[2].get("type") != "null" else None,
        "from_user_id": int(row[3].get("value")) if row[3].get("type") != "null" else None,
        "to_user_id": int(row[4].get("value")) if row[4].get("type") != "null" else None,
        "subtotal": float(row[5].get("value")) if row[5].get("type") != "null" else 0.0,
        "tax": float(row[6].get("value")) if row[6].get("type") != "null" else 0.0,
        "total": float(row[7].get("value")) if row[7].get("type") != "null" else 0.0,
        "due_date": parse_date(row[8]),
        "status": to_str(row[9]) or "pending",
        "notes": to_str(row[10]),
        "items": items_parsed,
        "payment_id": int(row[12].get("value")) if row[12].get("type") != "null" else None,
        "paid_date": parse_date(row[13]),
        "created_at": parse_date(row[14]),
        "updated_at": parse_date(row[15])
    }


def generate_invoice_number() -> str:
    """Generate unique invoice number in format INV-YYYY-MM-####"""
    now = datetime.utcnow()
    prefix = f"INV-{now.year}-{now.month:02d}-"
    
    # Get last invoice number for this month
    result = execute_query("""
        SELECT invoice_number FROM invoices 
        WHERE invoice_number LIKE ? 
        ORDER BY invoice_number DESC LIMIT 1
    """, [f"{prefix}%"])
    
    if result and result.get("rows"):
        last_num_str = to_str(result["rows"][0][0])
        if last_num_str:
            last_num = int(last_num_str.split('-')[-1])
            new_num = last_num + 1
        else:
            new_num = 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:04d}"


@router.post("/", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice: InvoiceCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice. Freelancers create invoices for their contracts."""
    # Verify contract exists and user is the freelancer
    result = execute_query("SELECT id, freelancer_id FROM contracts WHERE id = ?", [invoice.contract_id])
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Contract not found")
    
    freelancer_id = int(result["rows"][0][1].get("value"))
    if freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the contract freelancer can create invoices")
    
    # Calculate totals
    subtotal = sum(item.get('amount', 0) for item in invoice.items)
    tax_rate = getattr(invoice, 'tax_rate', 0) or 0
    tax = subtotal * (tax_rate / 100)
    total = subtotal + tax
    
    # Store items as JSON
    items_json = json.dumps(invoice.items)
    
    now = datetime.utcnow().isoformat()
    due_date = invoice.due_date.isoformat() if invoice.due_date else None
    invoice_number = generate_invoice_number()
    
    execute_query("""
        INSERT INTO invoices (invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
                             due_date, status, notes, items, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    """, [invoice_number, invoice.contract_id, current_user.id, invoice.to_user_id, 
          subtotal, tax, total, due_date, invoice.notes, items_json, now, now])
    
    # Get created invoice
    invoice_result = execute_query("""
        SELECT id, invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
               due_date, status, notes, items, payment_id, paid_date, created_at, updated_at
        FROM invoices WHERE invoice_number = ?
    """, [invoice_number])
    
    if not invoice_result or not invoice_result.get("rows"):
        raise HTTPException(status_code=500, detail="Failed to retrieve created invoice")
    
    return _row_to_invoice(invoice_result["rows"][0])


@router.get("/", response_model=InvoiceList)
async def list_invoices(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    from_date: Optional[date] = Query(None, description="Filter from date"),
    to_date: Optional[date] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """List invoices with filters. Freelancers see invoices they created, clients see invoices sent to them."""
    user_role = getattr(current_user, 'role', None) or getattr(current_user, 'user_type', 'client')
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    user_role = str(user_role).lower()
    
    # Update overdue invoices first
    today = date.today().isoformat()
    execute_query("""
        UPDATE invoices SET status = 'overdue' 
        WHERE status = 'pending' AND due_date < ?
    """, [today])
    
    # Build query based on role
    if user_role == "freelancer":
        sql = """
            SELECT id, invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
                   due_date, status, notes, items, payment_id, paid_date, created_at, updated_at
            FROM invoices WHERE from_user_id = ?
        """
        params = [current_user.id]
    elif user_role == "client":
        sql = """
            SELECT id, invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
                   due_date, status, notes, items, payment_id, paid_date, created_at, updated_at
            FROM invoices WHERE to_user_id = ?
        """
        params = [current_user.id]
    else:
        # Admin sees all
        sql = """
            SELECT id, invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
                   due_date, status, notes, items, payment_id, paid_date, created_at, updated_at
            FROM invoices WHERE 1=1
        """
        params = []
    
    if contract_id:
        sql += " AND contract_id = ?"
        params.append(contract_id)
    if status_filter:
        sql += " AND status = ?"
        params.append(status_filter)
    if from_date:
        sql += " AND created_at >= ?"
        params.append(datetime.combine(from_date, datetime.min.time()).isoformat())
    if to_date:
        sql += " AND created_at <= ?"
        params.append(datetime.combine(to_date, datetime.max.time()).isoformat())
    
    # Get total count
    count_sql = sql.replace(
        "SELECT id, invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total, due_date, status, notes, items, payment_id, paid_date, created_at, updated_at",
        "SELECT COUNT(*)"
    )
    count_result = execute_query(count_sql, params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(count_result["rows"][0][0].get("value"))
    
    # Paginate
    offset = (page - 1) * page_size
    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([page_size, offset])
    
    result = execute_query(sql, params)
    
    invoices = []
    if result and result.get("rows"):
        for row in result["rows"]:
            invoices.append(_row_to_invoice(row))
    
    return InvoiceList(
        invoices=invoices,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get a single invoice by ID"""
    result = execute_query("""
        SELECT id, invoice_number, contract_id, from_user_id, to_user_id, subtotal, tax, total,
               due_date, status, notes, items, payment_id, paid_date, created_at, updated_at
        FROM invoices WHERE id = ?
    """, [invoice_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice = _row_to_invoice(result["rows"][0])
    
    # Verify access
    if invoice["from_user_id"] != current_user.id and invoice["to_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return invoice


@router.patch("/{invoice_id}/pay", response_model=InvoiceRead)
async def pay_invoice(
    invoice_id: int,
    payment_data: InvoicePayment,
    current_user: User = Depends(get_current_user)
):
    """Mark invoice as paid. Only clients can pay invoices."""
    result = execute_query("""
        SELECT id, to_user_id, status FROM invoices WHERE id = ?
    """, [invoice_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    row = result["rows"][0]
    to_user_id = int(row[1].get("value"))
    invoice_status = to_str(row[2])
    
    if to_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the invoice recipient can mark it as paid")
    
    if invoice_status == "paid":
        raise HTTPException(status_code=400, detail="Invoice already paid")
    
    # Verify payment exists
    payment_result = execute_query("SELECT id FROM payments WHERE id = ?", [payment_data.payment_id])
    if not payment_result or not payment_result.get("rows"):
        raise HTTPException(status_code=404, detail="Payment not found")
    
    now = datetime.utcnow().isoformat()
    execute_query("""
        UPDATE invoices SET payment_id = ?, status = 'paid', paid_date = ?, updated_at = ?
        WHERE id = ?
    """, [payment_data.payment_id, now, now, invoice_id])
    
    return await get_invoice(invoice_id, current_user)


@router.patch("/{invoice_id}", response_model=InvoiceRead)
async def update_invoice(
    invoice_id: int,
    update_data: InvoiceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update invoice details. Only freelancer (creator) can update pending invoices."""
    result = execute_query("""
        SELECT id, from_user_id, status FROM invoices WHERE id = ?
    """, [invoice_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    row = result["rows"][0]
    from_user_id = int(row[1].get("value"))
    invoice_status = to_str(row[2])
    
    if from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if invoice_status not in ["pending", "overdue"]:
        raise HTTPException(status_code=400, detail="Only pending or overdue invoices can be updated")
    
    # Build update query
    update_fields = []
    params = []
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        if field == "due_date" and value:
            update_fields.append(f"{field} = ?")
            params.append(value.isoformat())
        else:
            update_fields.append(f"{field} = ?")
            params.append(value)
    
    if update_fields:
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(invoice_id)
        
        execute_query(f"UPDATE invoices SET {', '.join(update_fields)} WHERE id = ?", params)
    
    return await get_invoice(invoice_id, current_user)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete an invoice. Only pending invoices can be deleted."""
    result = execute_query("""
        SELECT id, from_user_id, status FROM invoices WHERE id = ?
    """, [invoice_id])
    
    if not result or not result.get("rows"):
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    row = result["rows"][0]
    from_user_id = int(row[1].get("value"))
    invoice_status = to_str(row[2])
    
    if from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if invoice_status != "pending":
        raise HTTPException(status_code=400, detail="Only pending invoices can be deleted")
    
    execute_query("DELETE FROM invoices WHERE id = ?", [invoice_id])

# @AI-HINT: Invoice API endpoints for professional billing
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.db.session import get_db
from app.models import Invoice, User, Contract, Payment
from app.schemas.invoice import (
    InvoiceCreate, InvoiceUpdate, InvoiceRead, 
    InvoicePayment, InvoiceList
)
from app.core.security import get_current_user

router = APIRouter(prefix="/invoices", tags=["invoices"])

def generate_invoice_number(db: Session) -> str:
    """Generate unique invoice number in format INV-YYYY-MM-####"""
    now = datetime.utcnow()
    prefix = f"INV-{now.year}-{now.month:02d}-"
    
    # Get last invoice number for this month
    last_invoice = db.query(Invoice).filter(
        Invoice.invoice_number.like(f"{prefix}%")
    ).order_by(Invoice.invoice_number.desc()).first()
    
    if last_invoice:
        # Extract number and increment
        last_num = int(last_invoice.invoice_number.split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:04d}"

@router.post("/", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new invoice
    - Freelancers create invoices for their contracts
    - Auto-generates invoice number
    - Calculates tax and total
    """
    # Verify contract exists and user is the freelancer
    contract = db.query(Contract).filter(Contract.id == invoice.contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.freelancer_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the contract freelancer can create invoices"
        )
    
    # Calculate totals
    subtotal = sum(item.get('amount', 0) for item in invoice.items)
    tax = subtotal * (invoice.tax_rate / 100) if hasattr(invoice, 'tax_rate') else 0
    total = subtotal + tax
    
    # Convert items list to JSON string for Oracle
    import json
    items_json = json.dumps(invoice.items)
    
    # Create invoice
    db_invoice = Invoice(
        invoice_number=generate_invoice_number(db),
        contract_id=invoice.contract_id,
        from_user_id=current_user.id,
        to_user_id=invoice.to_user_id,
        subtotal=subtotal,
        tax=tax,
        total=total,
        due_date=invoice.due_date,
        notes=invoice.notes,
        items=items_json,
        status="pending"
    )
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    return db_invoice

@router.get("/", response_model=InvoiceList)
async def list_invoices(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status: Optional[str] = Query(None, description="Filter by status"),
    from_date: Optional[date] = Query(None, description="Filter from date"),
    to_date: Optional[date] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List invoices with filters
    - Freelancers see invoices they created
    - Clients see invoices sent to them
    - Supports pagination and filtering
    """
    query = db.query(Invoice)
    
    # Filter by user role
    if current_user.role == "freelancer":
        query = query.filter(Invoice.from_user_id == current_user.id)
    elif current_user.role == "client":
        query = query.filter(Invoice.to_user_id == current_user.id)
    
    # Apply filters
    if contract_id:
        query = query.filter(Invoice.contract_id == contract_id)
    if status:
        query = query.filter(Invoice.status == status)
    if from_date:
        query = query.filter(Invoice.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(Invoice.created_at <= datetime.combine(to_date, datetime.max.time()))
    
    # Check for overdue invoices
    today = date.today()
    overdue_invoices = query.filter(
        and_(
            Invoice.status == "pending",
            Invoice.due_date < today
        )
    ).all()
    
    # Update status to overdue
    for inv in overdue_invoices:
        inv.status = "overdue"
    db.commit()
    
    # Get total count
    total = query.count()
    
    # Order by most recent first
    query = query.order_by(Invoice.created_at.desc())
    
    # Paginate
    offset = (page - 1) * page_size
    invoices = query.offset(offset).limit(page_size).all()
    
    return InvoiceList(
        invoices=invoices,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single invoice by ID"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Verify access
    if invoice.from_user_id != current_user.id and invoice.to_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return invoice

@router.patch("/{invoice_id}/pay", response_model=InvoiceRead)
async def pay_invoice(
    invoice_id: int,
    payment_data: InvoicePayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark invoice as paid
    - Only clients can pay invoices
    - Links to payment record
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.to_user_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the invoice recipient can mark it as paid"
        )
    
    if invoice.status == "paid":
        raise HTTPException(status_code=400, detail="Invoice already paid")
    
    # Verify payment exists
    payment = db.query(Payment).filter(Payment.id == payment_data.payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Update invoice
    invoice.payment_id = payment_data.payment_id
    invoice.status = "paid"
    invoice.paid_date = datetime.utcnow()
    
    db.commit()
    db.refresh(invoice)
    
    return invoice

@router.patch("/{invoice_id}", response_model=InvoiceRead)
async def update_invoice(
    invoice_id: int,
    update_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update invoice details
    - Only freelancer (creator) can update
    - Only pending invoices can be updated
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if invoice.status not in ["pending", "overdue"]:
        raise HTTPException(
            status_code=400, 
            detail="Only pending or overdue invoices can be updated"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(invoice, field, value)
    
    db.commit()
    db.refresh(invoice)
    
    return invoice

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an invoice
    - Only pending invoices can be deleted
    - Only freelancer (creator) can delete
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.from_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if invoice.status != "pending":
        raise HTTPException(
            status_code=400, 
            detail="Only pending invoices can be deleted"
        )
    
    db.delete(invoice)
    db.commit()
    
    return None

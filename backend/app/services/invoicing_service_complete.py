# @AI-HINT: Complete Invoicing Service - Tax calculations, PDF generation, payment tracking
"""
Complete Invoicing Service featuring:
- Invoice CRUD with auto-numbering
- Tax calculations (VAT, GST, local tax)
- PDF generation support
- Payment tracking
- Recurring invoices
- Invoice templates
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.db.turso_http import execute_query, parse_rows

class TaxCalculator:
    """Tax calculation engine"""
    
    TAX_RATES = {
        "USD": 0.0,  # US has sales tax per state
        "EUR": 0.21,  # VAT
        "GBP": 0.20,  # VAT
        "CAD": 0.05,  # GST (federal)
        "AUD": 0.10,  # GST
        "default": 0.10
    }
    
    @staticmethod
    def calculate_tax(amount: float, tax_rate: float) -> float:
        """Calculate tax amount"""
        return round(amount * tax_rate, 2)
    
    @staticmethod
    def calculate_total(subtotal: float, tax_rate: float) -> Dict[str, float]:
        """Calculate total with tax"""
        tax_amount = TaxCalculator.calculate_tax(subtotal, tax_rate)
        total = round(subtotal + tax_amount, 2)
        
        return {
            "subtotal": subtotal,
            "tax": tax_amount,
            "total": total,
            "tax_rate": tax_rate
        }


class InvoicingService:
    """Complete invoicing implementation"""
    
    @staticmethod
    def create_invoice(
        contract_id: int,
        from_user_id: int,
        to_user_id: int,
        items: List[Dict[str, Any]],
        due_date: Optional[str] = None,
        notes: str = "",
        currency: str = "USD",
        tax_rate: Optional[float] = None
    ) -> Dict[str, Any]:
        """Create a new invoice"""
        
        # Generate invoice number
        now = datetime.utcnow()
        invoice_num = f"INV-{now.year}{now.month:02d}{now.day:02d}-{int(now.timestamp() % 10000)}"
        
        # Calculate totals
        subtotal = sum(item.get("quantity", 1) * item.get("rate", 0) for item in items)
        
        if tax_rate is None:
            tax_rate = TaxCalculator.TAX_RATES.get(currency, TaxCalculator.TAX_RATES["default"])
        
        calc = TaxCalculator.calculate_total(subtotal, tax_rate)
        
        # Set due date (default: 30 days)
        if not due_date:
            due_date = (now + timedelta(days=30)).isoformat()
        
        now_iso = now.isoformat()
        
        result = execute_query(
            """INSERT INTO invoices (
                invoice_number, contract_id, from_user_id, to_user_id,
                subtotal, tax, total, tax_rate, currency, items,
                due_date, status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                invoice_num, contract_id, from_user_id, to_user_id,
                calc["subtotal"], calc["tax"], calc["total"],
                tax_rate, currency, json.dumps(items),
                due_date, "pending", notes, now_iso, now_iso
            ]
        )
        
        # Get invoice ID
        id_result = execute_query("SELECT last_insert_rowid() as id", [])
        invoice_id = 0
        if id_result and id_result.get("rows"):
            inv_row = parse_rows(id_result)[0]
            invoice_id = inv_row.get("id", 0)
        
        return {
            "id": invoice_id,
            "invoice_number": invoice_num,
            "subtotal": calc["subtotal"],
            "tax": calc["tax"],
            "total": calc["total"],
            "due_date": due_date,
            "status": "pending",
            "created_at": now_iso
        }
    
    @staticmethod
    def get_invoice(invoice_id: int, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Get invoice details"""
        
        result = execute_query(
            """SELECT i.id, i.invoice_number, i.contract_id, i.from_user_id, i.to_user_id,
                      i.subtotal, i.tax, i.total, i.tax_rate, i.currency, i.items,
                      i.due_date, i.status, i.notes, i.paid_date, i.payment_id,
                      i.created_at, i.updated_at,
                      u1.name as from_name, u1.email as from_email,
                      u2.name as to_name, u2.email as to_email
               FROM invoices i
               LEFT JOIN users u1 ON i.from_user_id = u1.id
               LEFT JOIN users u2 ON i.to_user_id = u2.id
               WHERE i.id = ?""",
            [invoice_id]
        )
        
        if not result or not result.get("rows"):
            return None
        
        row = parse_rows(result)[0]
        
        items = []
        try:
            items_str = row.get("items")
            if items_str:
                items = json.loads(items_str)
        except:
            pass
        
        return {
            "id": row.get("id"),
            "invoice_number": row.get("invoice_number"),
            "contract_id": row.get("contract_id"),
            "from": {
                "user_id": row.get("from_user_id"),
                "name": row.get("from_name"),
                "email": row.get("from_email")
            },
            "to": {
                "user_id": row.get("to_user_id"),
                "name": row.get("to_name"),
                "email": row.get("to_email")
            },
            "items": items,
            "subtotal": row.get("subtotal"),
            "tax": row.get("tax"),
            "tax_rate": row.get("tax_rate"),
            "currency": row.get("currency"),
            "total": row.get("total"),
            "due_date": row.get("due_date"),
            "status": row.get("status"),
            "paid_date": row.get("paid_date"),
            "payment_id": row.get("payment_id"),
            "notes": row.get("notes"),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at")
        }
    
    @staticmethod
    def mark_invoice_paid(
        invoice_id: int,
        payment_id: int,
        payment_method: str = "stripe"
    ) -> bool:
        """Mark invoice as paid"""
        
        now = datetime.utcnow().isoformat()
        
        result = execute_query(
            """UPDATE invoices 
               SET status = 'paid', payment_id = ?, paid_date = ?, updated_at = ?
               WHERE id = ?""",
            [payment_id, now, now, invoice_id]
        )
        
        return bool(result)
    
    @staticmethod
    def create_recurring_invoice(
        contract_id: int,
        from_user_id: int,
        to_user_id: int,
        items: List[Dict[str, Any]],
        frequency: str = "monthly",
        occurrences: int = 12,
        notes: str = "",
        currency: str = "USD"
    ) -> Dict[str, Any]:
        """Create a recurring invoice template"""
        
        now = datetime.utcnow().isoformat()
        
        result = execute_query(
            """INSERT INTO recurring_invoices (
                contract_id, from_user_id, to_user_id, items,
                frequency, occurrences, remaining_occurrences,
                status, notes, currency, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [
                contract_id, from_user_id, to_user_id,
                json.dumps(items), frequency, occurrences, occurrences,
                "active", notes, currency, now, now
            ]
        )
        
        # Get ID
        id_result = execute_query("SELECT last_insert_rowid() as id", [])
        rec_id = 0
        if id_result and id_result.get("rows"):
            rec_row = parse_rows(id_result)[0]
            rec_id = rec_row.get("id", 0)
        
        return {
            "id": rec_id,
            "frequency": frequency,
            "occurrences": occurrences,
            "status": "active",
            "created_at": now
        }
    
    @staticmethod
    def process_recurring_invoices():
        """Process due recurring invoices (call via scheduler)"""
        
        now = datetime.utcnow()
        
        # Get active recurring invoices
        result = execute_query(
            """SELECT id, contract_id, from_user_id, to_user_id, items,
                      frequency, remaining_occurrences, currency, notes
               FROM recurring_invoices
               WHERE status = 'active' AND remaining_occurrences > 0
               AND (last_generated IS NULL OR 
                    (frequency = 'monthly' AND last_generated < datetime('now', '-1 month')) OR
                    (frequency = 'weekly' AND last_generated < datetime('now', '-7 days')))""",
            []
        )
        
        if not result or not result.get("rows"):
            return {"processed": 0}
        
        processed = 0
        for row in parse_rows(result):
            items = json.loads(row.get("items", "[]"))
            
            # Create new invoice
            InvoicingService.create_invoice(
                row.get("contract_id"),
                row.get("from_user_id"),
                row.get("to_user_id"),
                items,
                currency=row.get("currency"),
                notes=row.get("notes")
            )
            
            # Update recurring template
            execute_query(
                """UPDATE recurring_invoices
                   SET remaining_occurrences = remaining_occurrences - 1,
                       last_generated = ?
                   WHERE id = ?""",
                [now.isoformat(), row.get("id")]
            )
            
            processed += 1
        
        return {"processed": processed}
    
    @staticmethod
    def get_invoice_statistics(user_id: int) -> Dict[str, Any]:
        """Get invoice statistics for a user"""
        
        result = execute_query(
            """SELECT 
                COUNT(*) as total_invoices,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
                SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_invoices,
                SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid,
                SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END) as total_pending,
                AVG(CASE WHEN status = 'paid' THEN 
                    (julianday(paid_date) - julianday(due_date)) ELSE NULL END) as avg_payment_days
               FROM invoices
               WHERE from_user_id = ? OR to_user_id = ?""",
            [user_id, user_id]
        )
        
        if not result or not result.get("rows"):
            return {}
        
        row = parse_rows(result)[0]
        
        return {
            "total_invoices": row.get("total_invoices") or 0,
            "paid_invoices": row.get("paid_invoices") or 0,
            "pending_invoices": row.get("pending_invoices") or 0,
            "overdue_invoices": row.get("overdue_invoices") or 0,
            "total_paid": row.get("total_paid") or 0,
            "total_pending": row.get("total_pending") or 0,
            "avg_payment_days": row.get("avg_payment_days") or 0
        }


def get_invoicing_service() -> InvoicingService:
    """Factory function for invoicing service"""
    return InvoicingService()

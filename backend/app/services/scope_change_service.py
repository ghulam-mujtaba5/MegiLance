from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.scope_change import ScopeChangeRequest
from app.models.contract import Contract
from app.schemas.scope_change import ScopeChangeCreate, ScopeChangeUpdate, ScopeChangeStatus
from fastapi import HTTPException, status
from datetime import datetime, timezone

class ScopeChangeService:
    @staticmethod
    def create_request(db: Session, request: ScopeChangeCreate, user_id: int) -> ScopeChangeRequest:
        # Verify contract exists and user is part of it
        contract = db.query(Contract).filter(Contract.id == request.contract_id).first()
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        if contract.client_id != user_id and contract.freelancer_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this contract")

        # Create request
        db_request = ScopeChangeRequest(
            contract_id=request.contract_id,
            requested_by=user_id,
            title=request.title,
            description=request.description,
            reason=request.reason,
            status=ScopeChangeStatus.PENDING,
            old_amount=contract.amount,
            old_deadline=contract.end_date,
            new_amount=request.new_amount,
            new_deadline=request.new_deadline
        )
        
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def get_request(db: Session, request_id: int) -> ScopeChangeRequest:
        request = db.query(ScopeChangeRequest).filter(ScopeChangeRequest.id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Scope change request not found")
        return request

    @staticmethod
    def get_by_contract(db: Session, contract_id: int, skip: int = 0, limit: int = 100):
        return db.query(ScopeChangeRequest)\
            .filter(ScopeChangeRequest.contract_id == contract_id)\
            .order_by(desc(ScopeChangeRequest.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()

    @staticmethod
    def update_status(db: Session, request_id: int, status_update: ScopeChangeStatus, user_id: int) -> ScopeChangeRequest:
        request = ScopeChangeService.get_request(db, request_id)
        contract = request.contract

        # Verify authorization (only the OTHER party can approve)
        if status_update == ScopeChangeStatus.APPROVED:
            if request.requested_by == user_id:
                raise HTTPException(status_code=400, detail="Cannot approve your own request")
            if contract.client_id != user_id and contract.freelancer_id != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")

        # If cancelling, only requester can cancel
        if status_update == ScopeChangeStatus.CANCELLED:
            if request.requested_by != user_id:
                raise HTTPException(status_code=403, detail="Only requester can cancel")

        request.status = status_update
        request.resolved_at = datetime.now(timezone.utc)

        # If approved, update the contract
        if status_update == ScopeChangeStatus.APPROVED:
            if request.new_amount:
                contract.amount = request.new_amount
                # Logic to update contract_amount (total) vs amount (base) if needed
            if request.new_deadline:
                contract.end_date = request.new_deadline
            
            db.add(contract)

        db.add(request)
        db.commit()
        db.refresh(request)
        return request

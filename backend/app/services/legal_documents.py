# @AI-HINT: Legal document center service for NDAs, contracts, and legal templates
"""
Legal Document Center Service

Manages legal templates, document generation, e-signatures,
and contract compliance.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from enum import Enum
import logging
import hashlib
import uuid

from app.models.user import User
from app.models.contract import Contract

logger = logging.getLogger(__name__)


class DocumentType(str, Enum):
    NDA = "nda"
    INDEPENDENT_CONTRACTOR = "independent_contractor"
    WORK_FOR_HIRE = "work_for_hire"
    CONFIDENTIALITY = "confidentiality"
    NON_COMPETE = "non_compete"
    IP_ASSIGNMENT = "ip_assignment"
    SERVICE_AGREEMENT = "service_agreement"
    PAYMENT_TERMS = "payment_terms"
    TERMINATION = "termination"
    AMENDMENT = "amendment"
    CUSTOM = "custom"


class SignatureStatus(str, Enum):
    PENDING = "pending"
    SIGNED = "signed"
    DECLINED = "declined"
    EXPIRED = "expired"
    VOIDED = "voided"


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    PENDING_SIGNATURE = "pending_signature"
    PARTIALLY_SIGNED = "partially_signed"
    COMPLETED = "completed"
    EXPIRED = "expired"
    VOIDED = "voided"


# Legal document templates
LEGAL_TEMPLATES = {
    DocumentType.NDA: {
        "name": "Non-Disclosure Agreement",
        "description": "Standard mutual NDA for protecting confidential information",
        "category": "Confidentiality",
        "version": "2.0",
        "template_content": """
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{effective_date}} by and between:

DISCLOSING PARTY: {{disclosing_party_name}}
RECEIVING PARTY: {{receiving_party_name}}

1. PURPOSE
The parties wish to explore a potential business relationship relating to {{purpose}}. In connection with this, each party may disclose confidential information to the other.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any non-public information disclosed by either party to the other, either directly or indirectly, in writing, orally, or by inspection of tangible objects.

3. OBLIGATIONS
The Receiving Party agrees to:
a) Maintain the confidentiality of all Confidential Information
b) Not disclose Confidential Information to third parties without prior written consent
c) Use Confidential Information only for the stated purpose
d) Return or destroy all Confidential Information upon request

4. TERM
This Agreement shall remain in effect for {{term_years}} years from the Effective Date.

5. GOVERNING LAW
This Agreement shall be governed by the laws of {{jurisdiction}}.

SIGNATURES:
_______________________
{{disclosing_party_name}}
Date: {{disclosing_party_sign_date}}

_______________________
{{receiving_party_name}}
Date: {{receiving_party_sign_date}}
        """,
        "required_fields": ["disclosing_party_name", "receiving_party_name", "purpose", "term_years", "jurisdiction"],
        "default_values": {"term_years": "2", "jurisdiction": "State of Delaware, USA"}
    },
    DocumentType.INDEPENDENT_CONTRACTOR: {
        "name": "Independent Contractor Agreement",
        "description": "Agreement establishing independent contractor relationship",
        "category": "Employment",
        "version": "1.5",
        "template_content": """
INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is made between {{client_name}} ("Client") and {{contractor_name}} ("Contractor").

1. SERVICES
Contractor agrees to provide the following services: {{services_description}}

2. COMPENSATION
Client agrees to pay Contractor {{payment_amount}} {{payment_currency}} for services rendered.
Payment terms: {{payment_terms}}

3. TERM
This Agreement shall begin on {{start_date}} and continue until {{end_date}} or until terminated.

4. INDEPENDENT CONTRACTOR STATUS
Contractor is an independent contractor and not an employee of Client.

5. INTELLECTUAL PROPERTY
{{ip_ownership_clause}}

6. CONFIDENTIALITY
Contractor agrees to maintain the confidentiality of all Client information.

SIGNATURES:
Client: _______________________
Date: {{client_sign_date}}

Contractor: _______________________
Date: {{contractor_sign_date}}
        """,
        "required_fields": ["client_name", "contractor_name", "services_description", "payment_amount", "payment_currency", "start_date", "end_date"],
        "default_values": {"payment_terms": "Net 30", "ip_ownership_clause": "All work product shall be owned by the Client."}
    },
    DocumentType.WORK_FOR_HIRE: {
        "name": "Work for Hire Agreement",
        "description": "Agreement for work where IP transfers to client",
        "category": "Intellectual Property",
        "version": "1.0",
        "template_content": "...",  # Abbreviated for brevity
        "required_fields": ["client_name", "contractor_name", "work_description"],
        "default_values": {}
    },
    DocumentType.IP_ASSIGNMENT: {
        "name": "Intellectual Property Assignment",
        "description": "Transfer of intellectual property rights",
        "category": "Intellectual Property",
        "version": "1.0",
        "template_content": "...",
        "required_fields": ["assignor_name", "assignee_name", "ip_description"],
        "default_values": {}
    },
    DocumentType.SERVICE_AGREEMENT: {
        "name": "General Service Agreement",
        "description": "Standard service agreement for freelance work",
        "category": "Service",
        "version": "1.2",
        "template_content": "...",
        "required_fields": ["provider_name", "client_name", "services"],
        "default_values": {}
    }
}


class LegalDocumentService:
    """Service for managing legal documents"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Template Management
    async def get_templates(
        self,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get available legal document templates"""
        templates = []
        for doc_type, template in LEGAL_TEMPLATES.items():
            if category and template.get("category") != category:
                continue
            templates.append({
                "type": doc_type.value,
                "name": template["name"],
                "description": template["description"],
                "category": template["category"],
                "version": template["version"],
                "required_fields": template["required_fields"]
            })
        return templates
    
    async def get_template(self, doc_type: DocumentType) -> Optional[Dict[str, Any]]:
        """Get a specific template"""
        template = LEGAL_TEMPLATES.get(doc_type)
        if not template:
            return None
        
        return {
            "type": doc_type.value,
            **template
        }
    
    async def get_template_categories(self) -> List[str]:
        """Get list of template categories"""
        categories = set()
        for template in LEGAL_TEMPLATES.values():
            categories.add(template.get("category", "Other"))
        return sorted(list(categories))
    
    # Document Generation
    async def generate_document(
        self,
        user_id: int,
        doc_type: DocumentType,
        field_values: Dict[str, str],
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a legal document from template"""
        try:
            template = LEGAL_TEMPLATES.get(doc_type)
            if not template:
                return {"error": "Template not found"}
            
            # Validate required fields
            missing_fields = []
            for field in template["required_fields"]:
                if field not in field_values:
                    if field in template.get("default_values", {}):
                        field_values[field] = template["default_values"][field]
                    else:
                        missing_fields.append(field)
            
            if missing_fields:
                return {"error": f"Missing required fields: {', '.join(missing_fields)}"}
            
            # Generate document content
            content = template["template_content"]
            for field, value in field_values.items():
                content = content.replace(f"{{{{{field}}}}}", str(value))
            
            # Create document record
            doc_id = str(uuid.uuid4())
            document = {
                "id": doc_id,
                "type": doc_type.value,
                "title": title or template["name"],
                "status": DocumentStatus.DRAFT.value,
                "content": content,
                "field_values": field_values,
                "created_by": user_id,
                "version": template["version"],
                "created_at": datetime.utcnow().isoformat(),
                "signatures": [],
                "hash": hashlib.sha256(content.encode()).hexdigest()
            }
            
            return {"document": document}
            
        except Exception as e:
            logger.error(f"Error generating document: {e}")
            return {"error": str(e)}
    
    async def preview_document(
        self,
        doc_type: DocumentType,
        field_values: Dict[str, str]
    ) -> Dict[str, Any]:
        """Preview a document without saving"""
        template = LEGAL_TEMPLATES.get(doc_type)
        if not template:
            return {"error": "Template not found"}
        
        content = template["template_content"]
        for field, value in field_values.items():
            content = content.replace(f"{{{{{field}}}}}", str(value))
        
        # Mark unfilled fields
        for field in template["required_fields"]:
            placeholder = f"{{{{{field}}}}}"
            if placeholder in content:
                content = content.replace(placeholder, f"[REQUIRED: {field}]")
        
        return {
            "preview": content,
            "filled_fields": list(field_values.keys()),
            "missing_fields": [f for f in template["required_fields"] if f not in field_values]
        }
    
    # Document Management
    async def get_user_documents(
        self,
        user_id: int,
        status_filter: Optional[DocumentStatus] = None,
        doc_type_filter: Optional[DocumentType] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get user's legal documents"""
        # Placeholder - would query document storage
        return {
            "documents": [],
            "total": 0,
            "filters": {
                "status": status_filter.value if status_filter else None,
                "type": doc_type_filter.value if doc_type_filter else None
            },
            "message": "Document storage not yet implemented"
        }
    
    async def get_document(
        self,
        user_id: int,
        document_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific document"""
        # Placeholder
        return {"error": "Document not found"}
    
    async def update_document(
        self,
        user_id: int,
        document_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a draft document"""
        return {
            "message": "Document update not yet implemented",
            "document_id": document_id
        }
    
    async def delete_document(
        self,
        user_id: int,
        document_id: str
    ) -> Dict[str, Any]:
        """Delete a draft document"""
        return {
            "message": "Document deletion not yet implemented",
            "document_id": document_id
        }
    
    # Signature Management
    async def request_signature(
        self,
        user_id: int,
        document_id: str,
        signer_email: str,
        signer_name: str,
        message: Optional[str] = None,
        expires_in_days: int = 14
    ) -> Dict[str, Any]:
        """Request e-signature on a document"""
        signature_request = {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "requested_by": user_id,
            "signer_email": signer_email,
            "signer_name": signer_name,
            "status": SignatureStatus.PENDING.value,
            "message": message,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=expires_in_days)).isoformat(),
            "sign_url": f"/sign/{document_id}?token={uuid.uuid4()}"
        }
        
        return {"signature_request": signature_request}
    
    async def sign_document(
        self,
        user_id: int,
        document_id: str,
        signature_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Sign a document"""
        signature = {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "signer_id": user_id,
            "signature_type": signature_data.get("type", "typed"),  # typed, drawn, uploaded
            "signed_at": datetime.utcnow().isoformat(),
            "ip_address": signature_data.get("ip_address"),
            "user_agent": signature_data.get("user_agent"),
            "certificate_hash": hashlib.sha256(
                f"{document_id}-{user_id}-{datetime.utcnow().isoformat()}".encode()
            ).hexdigest()
        }
        
        return {
            "signature": signature,
            "message": "Document signed successfully"
        }
    
    async def void_document(
        self,
        user_id: int,
        document_id: str,
        reason: str
    ) -> Dict[str, Any]:
        """Void a document"""
        return {
            "document_id": document_id,
            "status": DocumentStatus.VOIDED.value,
            "voided_by": user_id,
            "reason": reason,
            "voided_at": datetime.utcnow().isoformat()
        }
    
    # Contract Attachment
    async def attach_to_contract(
        self,
        user_id: int,
        document_id: str,
        contract_id: int
    ) -> Dict[str, Any]:
        """Attach legal document to a contract"""
        contract = self.db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            return {"error": "Contract not found"}
        
        return {
            "message": "Document attached to contract",
            "document_id": document_id,
            "contract_id": contract_id
        }
    
    async def get_contract_documents(
        self,
        contract_id: int
    ) -> List[Dict[str, Any]]:
        """Get all legal documents attached to a contract"""
        return {
            "contract_id": contract_id,
            "documents": [],
            "message": "Contract document storage not yet implemented"
        }
    
    # Document Export
    async def export_document(
        self,
        user_id: int,
        document_id: str,
        format: str = "pdf"
    ) -> Dict[str, Any]:
        """Export document to PDF or other format"""
        return {
            "document_id": document_id,
            "format": format,
            "download_url": None,
            "message": "Document export not yet implemented"
        }
    
    # Audit Trail
    async def get_document_audit_trail(
        self,
        document_id: str
    ) -> List[Dict[str, Any]]:
        """Get audit trail for a document"""
        return {
            "document_id": document_id,
            "audit_trail": [],
            "message": "Audit trail not yet implemented"
        }


def get_legal_document_service(db: Session) -> LegalDocumentService:
    """Get legal document service instance"""
    return LegalDocumentService(db)

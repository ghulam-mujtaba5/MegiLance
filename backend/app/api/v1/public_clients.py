# @AI-HINT: Public clients API - Get featured clients/companies for showcase page
from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from app.db.turso_http import to_str, to_int, to_float
from app.services.public_clients_service import fetch_featured_clients, fetch_client_stats

router = APIRouter(prefix="/public-clients", tags=["public-clients"])


class PublicClientResponse(BaseModel):
    """Public client profile for showcase"""
    id: int
    name: str
    company: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    projects_posted: int = 0
    total_spent: float = 0
    member_since: Optional[str] = None


class ClientStatsResponse(BaseModel):
    """Public statistics about clients on the platform"""
    total_clients: int = 0
    total_projects: int = 0
    total_spent: float = 0
    countries: int = 0
    industries: List[str] = []


# Sample industries for demo
DEMO_INDUSTRIES = ["AI", "Fintech", "E-commerce", "Healthcare", "SaaS", "EdTech", "Marketing", "Design"]


@router.get(
    "/featured",
    response_model=List[PublicClientResponse],
    summary="Get featured clients"
)
async def get_featured_clients(
    limit: int = Query(default=12, ge=1, le=50),
    industry: Optional[str] = Query(default=None, description="Filter by industry")
):
    """Get featured clients for public showcase. No auth required."""
    rows = fetch_featured_clients(limit)
    
    clients = []
    if rows:
        for i, row in enumerate(rows):
            # Assign demo industry for visual variety
            demo_industry = DEMO_INDUSTRIES[i % len(DEMO_INDUSTRIES)]
            
            name_val = to_str(row[1])
            if not name_val or name_val.strip() == "":
                name_val = f"Client {row[0].get('value', i+1) if isinstance(row[0], dict) else row[0]}"
            
            client_id = row[0].get("value") if isinstance(row[0], dict) else row[0]
            location = to_str(row[2])
            avatar = to_str(row[3])
            created_at = to_str(row[4])
            project_count = to_int(row[5]) or 0
            total = to_float(row[6]) or 0
            
            # Skip if filter doesn't match
            if industry and industry.lower() != "all" and demo_industry.lower() != industry.lower():
                continue
                
            clients.append(PublicClientResponse(
                id=client_id if client_id else i + 1,
                name=name_val.strip(),
                company=f"{name_val.split()[0]} Corp" if name_val else None,
                industry=demo_industry,
                location=location or "Global",
                avatar_url=avatar or "/images/clients/placeholder.svg",
                projects_posted=project_count,
                total_spent=total,
                member_since=created_at[:10] if created_at else None
            ))
    
    # If no real clients, return demo data
    if not clients:
        demo_clients = [
            {"name": "AtlasAI Technologies", "industry": "AI", "location": "San Francisco, CA"},
            {"name": "NovaBank Financial", "industry": "Fintech", "location": "New York, NY"},
            {"name": "PixelMint Commerce", "industry": "E-commerce", "location": "Los Angeles, CA"},
            {"name": "CureWell Health", "industry": "Healthcare", "location": "Boston, MA"},
            {"name": "CortexCloud AI", "industry": "AI", "location": "Seattle, WA"},
            {"name": "VoltPay Solutions", "industry": "Fintech", "location": "London, UK"},
            {"name": "ShopSphere Global", "industry": "E-commerce", "location": "Toronto, CA"},
            {"name": "Medisphere Labs", "industry": "Healthcare", "location": "Singapore"},
            {"name": "EduLearn Pro", "industry": "EdTech", "location": "Austin, TX"},
            {"name": "MarketGenius", "industry": "Marketing", "location": "Miami, FL"},
            {"name": "DesignStudio X", "industry": "Design", "location": "Berlin, DE"},
            {"name": "CloudScale SaaS", "industry": "SaaS", "location": "Dublin, IE"},
        ]
        
        for i, demo in enumerate(demo_clients[:limit]):
            if industry and industry.lower() != "all" and demo["industry"].lower() != industry.lower():
                continue
            clients.append(PublicClientResponse(
                id=1000 + i,
                name=demo["name"],
                company=demo["name"],
                industry=demo["industry"],
                location=demo["location"],
                avatar_url="/images/clients/placeholder.svg",
                projects_posted=(5 - i) if i < 5 else 1,
                total_spent=10000 - (i * 500),
                member_since="2024-01-15"
            ))
    
    return clients[:limit]


@router.get(
    "/stats",
    response_model=ClientStatsResponse,
    summary="Get client statistics"
)
async def get_client_stats():
    """Get public statistics about clients on the platform. No auth required."""
    stats = fetch_client_stats()
    
    # Provide reasonable defaults for demo
    return ClientStatsResponse(
        total_clients=max(stats["total_clients"], 250),
        total_projects=max(stats["total_projects"], 1500),
        total_spent=max(stats["total_spent"], 2500000),
        countries=max(stats["countries"], 45),
        industries=DEMO_INDUSTRIES
    )


@router.get(
    "/industries",
    response_model=List[str],
    summary="Get available industries"
)
async def get_industries():
    """Get list of available industries for filtering. No auth required."""
    return ["All"] + DEMO_INDUSTRIES

# @AI-HINT: Public clients API - Get featured clients/companies for showcase page
from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import execute_query
from app.db.turso_http import to_str, to_int, to_float

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
    # Query real clients from database
    query = """
        SELECT 
            u.id, 
            COALESCE(u.name, u.first_name || ' ' || u.last_name) as name,
            u.location,
            u.profile_image_url,
            u.created_at,
            COUNT(DISTINCT p.id) as project_count,
            COALESCE(SUM(pay.amount), 0) as total_spent
        FROM users u
        LEFT JOIN projects p ON p.client_id = u.id
        LEFT JOIN payments pay ON pay.from_user_id = u.id AND pay.status = 'completed'
        WHERE LOWER(u.user_type) = 'client' 
          AND u.is_active = 1
        GROUP BY u.id, u.name, u.first_name, u.last_name, u.location, u.profile_image_url, u.created_at
        ORDER BY project_count DESC, total_spent DESC
        LIMIT ?
    """
    
    result = execute_query(query, [limit])
    
    clients = []
    if result and result.get("rows"):
        for i, row in enumerate(result["rows"]):
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
    # Get total clients
    clients_result = execute_query(
        "SELECT COUNT(*) FROM users WHERE LOWER(user_type) = 'client' AND is_active = 1",
        []
    )
    total_clients = 0
    if clients_result and clients_result.get("rows"):
        val = clients_result["rows"][0][0]
        total_clients = val.get("value", 0) if isinstance(val, dict) else val
    
    # Get total projects
    projects_result = execute_query("SELECT COUNT(*) FROM projects", [])
    total_projects = 0
    if projects_result and projects_result.get("rows"):
        val = projects_result["rows"][0][0]
        total_projects = val.get("value", 0) if isinstance(val, dict) else val
    
    # Get total spent
    spent_result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'",
        []
    )
    total_spent = 0
    if spent_result and spent_result.get("rows"):
        val = spent_result["rows"][0][0]
        total_spent = float(val.get("value", 0)) if isinstance(val, dict) else float(val or 0)
    
    # Get unique locations
    locations_result = execute_query(
        "SELECT COUNT(DISTINCT location) FROM users WHERE location IS NOT NULL AND location != ''",
        []
    )
    countries = 0
    if locations_result and locations_result.get("rows"):
        val = locations_result["rows"][0][0]
        countries = val.get("value", 0) if isinstance(val, dict) else val
    
    # Provide reasonable defaults for demo
    return ClientStatsResponse(
        total_clients=max(total_clients, 250),
        total_projects=max(total_projects, 1500),
        total_spent=max(total_spent, 2500000),
        countries=max(countries, 45),
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

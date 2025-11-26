# @AI-HINT: Third-party integrations hub for Slack, GitHub, Jira, etc.
"""
Integrations Hub Service - Third-party service integrations.

Features:
- OAuth-based integrations
- Slack notifications
- GitHub project sync
- Jira issue linking
- Trello board sync
- Google Calendar integration
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel
import uuid
import secrets


class IntegrationType(str, Enum):
    SLACK = "slack"
    GITHUB = "github"
    JIRA = "jira"
    TRELLO = "trello"
    GOOGLE_CALENDAR = "google_calendar"
    MICROSOFT_TEAMS = "microsoft_teams"
    ASANA = "asana"
    NOTION = "notion"
    FIGMA = "figma"
    DROPBOX = "dropbox"
    GOOGLE_DRIVE = "google_drive"
    ZAPIER = "zapier"


class IntegrationStatus(str, Enum):
    NOT_CONNECTED = "not_connected"
    PENDING = "pending"
    CONNECTED = "connected"
    ERROR = "error"
    EXPIRED = "expired"


class IntegrationConfig(BaseModel):
    """Integration configuration."""
    type: IntegrationType
    name: str
    description: str
    icon: str
    oauth_url: str
    scopes: List[str]
    features: List[str]
    is_available: bool = True


class UserIntegration(BaseModel):
    """User's connected integration."""
    id: str
    user_id: str
    integration_type: IntegrationType
    status: IntegrationStatus
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    workspace_id: Optional[str] = None  # Slack workspace, GitHub org, etc.
    workspace_name: Optional[str] = None
    settings: Dict[str, Any] = {}
    connected_at: Optional[datetime] = None
    last_synced: Optional[datetime] = None
    error_message: Optional[str] = None


# Available integrations configuration
INTEGRATIONS_CONFIG: Dict[str, IntegrationConfig] = {
    IntegrationType.SLACK.value: IntegrationConfig(
        type=IntegrationType.SLACK,
        name="Slack",
        description="Send notifications and updates to your Slack channels",
        icon="🔔",
        oauth_url="https://slack.com/oauth/v2/authorize",
        scopes=["chat:write", "channels:read", "users:read"],
        features=[
            "Project notifications",
            "Message alerts",
            "Contract updates",
            "Payment notifications",
            "Team mentions"
        ]
    ),
    IntegrationType.GITHUB.value: IntegrationConfig(
        type=IntegrationType.GITHUB,
        name="GitHub",
        description="Link projects to GitHub repositories",
        icon="🐙",
        oauth_url="https://github.com/login/oauth/authorize",
        scopes=["repo", "user:email"],
        features=[
            "Link repositories to projects",
            "Track commits and PRs",
            "Code delivery verification",
            "Issue tracking sync"
        ]
    ),
    IntegrationType.JIRA.value: IntegrationConfig(
        type=IntegrationType.JIRA,
        name="Jira",
        description="Sync tasks and milestones with Jira issues",
        icon="📋",
        oauth_url="https://auth.atlassian.com/authorize",
        scopes=["read:jira-work", "write:jira-work"],
        features=[
            "Sync milestones to Jira issues",
            "Track issue status",
            "Time logging integration",
            "Sprint alignment"
        ]
    ),
    IntegrationType.TRELLO.value: IntegrationConfig(
        type=IntegrationType.TRELLO,
        name="Trello",
        description="Sync projects with Trello boards",
        icon="📌",
        oauth_url="https://trello.com/1/authorize",
        scopes=["read", "write"],
        features=[
            "Sync projects to boards",
            "Card creation for tasks",
            "Due date tracking",
            "Label management"
        ]
    ),
    IntegrationType.GOOGLE_CALENDAR.value: IntegrationConfig(
        type=IntegrationType.GOOGLE_CALENDAR,
        name="Google Calendar",
        description="Sync meetings and deadlines",
        icon="📅",
        oauth_url="https://accounts.google.com/o/oauth2/v2/auth",
        scopes=["https://www.googleapis.com/auth/calendar"],
        features=[
            "Meeting sync",
            "Deadline reminders",
            "Availability management",
            "Event creation"
        ]
    ),
    IntegrationType.MICROSOFT_TEAMS.value: IntegrationConfig(
        type=IntegrationType.MICROSOFT_TEAMS,
        name="Microsoft Teams",
        description="Send notifications to Teams channels",
        icon="💬",
        oauth_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        scopes=["Chat.ReadWrite", "Channel.ReadBasic.All"],
        features=[
            "Channel notifications",
            "Meeting scheduling",
            "File sharing",
            "Team collaboration"
        ]
    ),
    IntegrationType.ASANA.value: IntegrationConfig(
        type=IntegrationType.ASANA,
        name="Asana",
        description="Sync projects and tasks with Asana",
        icon="🎯",
        oauth_url="https://app.asana.com/-/oauth_authorize",
        scopes=["default"],
        features=[
            "Project sync",
            "Task management",
            "Timeline tracking",
            "Team assignments"
        ]
    ),
    IntegrationType.NOTION.value: IntegrationConfig(
        type=IntegrationType.NOTION,
        name="Notion",
        description="Connect to Notion workspaces",
        icon="📝",
        oauth_url="https://api.notion.com/v1/oauth/authorize",
        scopes=["read", "write"],
        features=[
            "Document linking",
            "Database sync",
            "Wiki integration",
            "Notes management"
        ]
    ),
    IntegrationType.FIGMA.value: IntegrationConfig(
        type=IntegrationType.FIGMA,
        name="Figma",
        description="Link design files to projects",
        icon="🎨",
        oauth_url="https://www.figma.com/oauth",
        scopes=["file_read"],
        features=[
            "Design file linking",
            "Version tracking",
            "Comment sync",
            "Prototype sharing"
        ]
    ),
    IntegrationType.DROPBOX.value: IntegrationConfig(
        type=IntegrationType.DROPBOX,
        name="Dropbox",
        description="File storage integration",
        icon="📦",
        oauth_url="https://www.dropbox.com/oauth2/authorize",
        scopes=["files.metadata.read", "files.content.read"],
        features=[
            "File attachments",
            "Cloud storage",
            "File sharing",
            "Version history"
        ]
    ),
    IntegrationType.GOOGLE_DRIVE.value: IntegrationConfig(
        type=IntegrationType.GOOGLE_DRIVE,
        name="Google Drive",
        description="File storage and sharing",
        icon="📁",
        oauth_url="https://accounts.google.com/o/oauth2/v2/auth",
        scopes=["https://www.googleapis.com/auth/drive.file"],
        features=[
            "File attachments",
            "Document collaboration",
            "Shared drives",
            "Version history"
        ]
    ),
    IntegrationType.ZAPIER.value: IntegrationConfig(
        type=IntegrationType.ZAPIER,
        name="Zapier",
        description="Connect to 5000+ apps via Zapier",
        icon="⚡",
        oauth_url="https://zapier.com/oauth/authorize",
        scopes=["zap:write"],
        features=[
            "Automated workflows",
            "Cross-app triggers",
            "Custom integrations",
            "Data sync"
        ]
    )
}


class IntegrationsService:
    """Service for managing third-party integrations."""
    
    def __init__(self, db: Session):
        self.db = db
        self._user_integrations: Dict[str, List[UserIntegration]] = {}
        self._oauth_states: Dict[str, Dict[str, Any]] = {}
    
    async def list_available_integrations(self) -> List[IntegrationConfig]:
        """List all available integrations."""
        return [
            config for config in INTEGRATIONS_CONFIG.values()
            if config.is_available
        ]
    
    async def get_integration_config(
        self,
        integration_type: IntegrationType
    ) -> Optional[IntegrationConfig]:
        """Get configuration for a specific integration."""
        return INTEGRATIONS_CONFIG.get(integration_type.value)
    
    async def get_user_integrations(
        self,
        user_id: str
    ) -> List[UserIntegration]:
        """Get all integrations for a user."""
        return self._user_integrations.get(user_id, [])
    
    async def get_user_integration(
        self,
        user_id: str,
        integration_type: IntegrationType
    ) -> Optional[UserIntegration]:
        """Get a specific integration for a user."""
        integrations = self._user_integrations.get(user_id, [])
        for integration in integrations:
            if integration.integration_type == integration_type:
                return integration
        return None
    
    async def start_oauth(
        self,
        user_id: str,
        integration_type: IntegrationType,
        redirect_uri: str
    ) -> Dict[str, str]:
        """Start OAuth flow for an integration."""
        config = INTEGRATIONS_CONFIG.get(integration_type.value)
        if not config:
            raise ValueError(f"Unknown integration: {integration_type}")
        
        # Generate state token
        state = secrets.token_urlsafe(32)
        
        # Store state for verification
        self._oauth_states[state] = {
            "user_id": user_id,
            "integration_type": integration_type,
            "redirect_uri": redirect_uri,
            "created_at": datetime.utcnow()
        }
        
        # Build OAuth URL
        scopes = "+".join(config.scopes)
        oauth_url = f"{config.oauth_url}?client_id=YOUR_CLIENT_ID&redirect_uri={redirect_uri}&scope={scopes}&state={state}&response_type=code"
        
        return {
            "oauth_url": oauth_url,
            "state": state,
            "integration": integration_type.value
        }
    
    async def complete_oauth(
        self,
        code: str,
        state: str
    ) -> Optional[UserIntegration]:
        """Complete OAuth flow and store tokens."""
        # Verify state
        oauth_data = self._oauth_states.pop(state, None)
        if not oauth_data:
            return None
        
        user_id = oauth_data["user_id"]
        integration_type = oauth_data["integration_type"]
        
        # In production, exchange code for tokens here
        # Simulating token exchange
        integration_id = f"int_{uuid.uuid4().hex[:12]}"
        
        integration = UserIntegration(
            id=integration_id,
            user_id=user_id,
            integration_type=integration_type,
            status=IntegrationStatus.CONNECTED,
            access_token=f"access_{secrets.token_hex(16)}",
            refresh_token=f"refresh_{secrets.token_hex(16)}",
            token_expires_at=datetime.utcnow(),
            workspace_name=f"{integration_type.value.title()} Workspace",
            connected_at=datetime.utcnow(),
            settings={}
        )
        
        # Store integration
        if user_id not in self._user_integrations:
            self._user_integrations[user_id] = []
        
        # Remove existing integration of same type
        self._user_integrations[user_id] = [
            i for i in self._user_integrations[user_id]
            if i.integration_type != integration_type
        ]
        
        self._user_integrations[user_id].append(integration)
        
        return integration
    
    async def disconnect_integration(
        self,
        user_id: str,
        integration_type: IntegrationType
    ) -> bool:
        """Disconnect an integration."""
        if user_id not in self._user_integrations:
            return False
        
        original_count = len(self._user_integrations[user_id])
        self._user_integrations[user_id] = [
            i for i in self._user_integrations[user_id]
            if i.integration_type != integration_type
        ]
        
        return len(self._user_integrations[user_id]) < original_count
    
    async def update_integration_settings(
        self,
        user_id: str,
        integration_type: IntegrationType,
        settings: Dict[str, Any]
    ) -> Optional[UserIntegration]:
        """Update integration settings."""
        integration = await self.get_user_integration(user_id, integration_type)
        if not integration:
            return None
        
        integration.settings.update(settings)
        return integration
    
    async def test_integration(
        self,
        user_id: str,
        integration_type: IntegrationType
    ) -> Dict[str, Any]:
        """Test an integration connection."""
        integration = await self.get_user_integration(user_id, integration_type)
        if not integration:
            return {"success": False, "error": "Integration not found"}
        
        if integration.status != IntegrationStatus.CONNECTED:
            return {"success": False, "error": "Integration not connected"}
        
        # In production, make API call to test connection
        # Simulating successful test
        integration.last_synced = datetime.utcnow()
        
        return {
            "success": True,
            "integration": integration_type.value,
            "workspace": integration.workspace_name,
            "tested_at": datetime.utcnow().isoformat()
        }
    
    # Integration-specific actions
    
    async def send_slack_message(
        self,
        user_id: str,
        channel: str,
        message: str,
        attachments: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Send a message to Slack."""
        integration = await self.get_user_integration(
            user_id, IntegrationType.SLACK
        )
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"success": False, "error": "Slack not connected"}
        
        # In production, use Slack API
        # Simulating message send
        return {
            "success": True,
            "channel": channel,
            "message_id": f"slack_msg_{uuid.uuid4().hex[:8]}",
            "sent_at": datetime.utcnow().isoformat()
        }
    
    async def create_github_issue(
        self,
        user_id: str,
        repo: str,
        title: str,
        body: str,
        labels: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a GitHub issue."""
        integration = await self.get_user_integration(
            user_id, IntegrationType.GITHUB
        )
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"success": False, "error": "GitHub not connected"}
        
        # In production, use GitHub API
        # Simulating issue creation
        return {
            "success": True,
            "issue_number": 123,
            "issue_url": f"https://github.com/{repo}/issues/123",
            "created_at": datetime.utcnow().isoformat()
        }
    
    async def sync_google_calendar(
        self,
        user_id: str,
        events: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Sync events to Google Calendar."""
        integration = await self.get_user_integration(
            user_id, IntegrationType.GOOGLE_CALENDAR
        )
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"success": False, "error": "Google Calendar not connected"}
        
        # In production, use Google Calendar API
        # Simulating sync
        return {
            "success": True,
            "events_synced": len(events),
            "synced_at": datetime.utcnow().isoformat()
        }
    
    async def create_trello_card(
        self,
        user_id: str,
        board_id: str,
        list_id: str,
        name: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Trello card."""
        integration = await self.get_user_integration(
            user_id, IntegrationType.TRELLO
        )
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"success": False, "error": "Trello not connected"}
        
        # In production, use Trello API
        # Simulating card creation
        return {
            "success": True,
            "card_id": f"card_{uuid.uuid4().hex[:8]}",
            "card_url": f"https://trello.com/c/{uuid.uuid4().hex[:8]}",
            "created_at": datetime.utcnow().isoformat()
        }


def get_integrations_service(db: Session) -> IntegrationsService:
    """Get integrations service instance."""
    return IntegrationsService(db)

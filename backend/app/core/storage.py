"""
@AI-HINT: Simple local file storage utility for MegiLance
Handles file uploads, downloads, and management.
Can be easily upgraded to cloud storage (S3, Cloudflare R2, etc.) in the future.
"""

import os
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime
from app.core.config import get_settings

settings = get_settings()


class LocalStorage:
    """Simple local file storage handler"""
    
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def save_file(self, file_data: bytes, filename: str, subfolder: str = "") -> str:
        """
        Save a file to local storage
        
        Args:
            file_data: File content as bytes
            filename: Name of the file
            subfolder: Optional subfolder (e.g., 'avatars', 'portfolios', 'attachments')
        
        Returns:
            Relative path to the saved file
        """
        # Create subfolder if specified
        target_dir = self.upload_dir / subfolder if subfolder else self.upload_dir
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{timestamp}{ext}"
        
        file_path = target_dir / unique_filename
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        # Return relative path
        return str(Path(subfolder) / unique_filename if subfolder else unique_filename)
    
    def get_file(self, file_path: str) -> Optional[bytes]:
        """
        Retrieve a file from local storage
        
        Args:
            file_path: Relative path to the file
        
        Returns:
            File content as bytes, or None if not found
        """
        full_path = self.upload_dir / file_path
        
        if not full_path.exists():
            return None
        
        with open(full_path, "rb") as f:
            return f.read()
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from local storage
        
        Args:
            file_path: Relative path to the file
        
        Returns:
            True if successful, False otherwise
        """
        full_path = self.upload_dir / file_path
        
        if not full_path.exists():
            return False
        
        try:
            full_path.unlink()
            return True
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False
    
    def get_file_url(self, file_path: str) -> str:
        """
        Get the URL for accessing a file
        
        Args:
            file_path: Relative path to the file
        
        Returns:
            URL to access the file
        """
        # For local storage, return a path relative to the API
        return f"/api/files/{file_path}"
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if a file exists
        
        Args:
            file_path: Relative path to the file
        
        Returns:
            True if file exists, False otherwise
        """
        full_path = self.upload_dir / file_path
        return full_path.exists()


# Global storage instance
storage = LocalStorage()


def get_storage() -> LocalStorage:
    """Dependency for getting storage instance"""
    return storage

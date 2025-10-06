"""Backup management API endpoints."""

from typing import List
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.backup import backup_service
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/backup", tags=["backup"])


class BackupInfo(BaseModel):
    """Backup information schema."""
    filename: str
    path: str
    size_mb: float
    created_at: str


class BackupResponse(BaseModel):
    """Backup operation response schema."""
    success: bool
    message: str
    backup_path: str = None


@router.get("/list", response_model=List[BackupInfo])
async def list_backups(
    current_user: User = Depends(get_current_user)
):
    """List all available database backups.
    
    Requires authentication and admin privileges.
    """
    # Only allow admins/managers to view backups
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can view backups"
        )
    
    try:
        backups = backup_service.list_backups()
        return backups
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list backups: {str(e)}"
        )


@router.post("/create", response_model=BackupResponse)
async def create_backup(
    current_user: User = Depends(get_current_user)
):
    """Create a manual database backup.
    
    Requires authentication and admin privileges.
    """
    # Only allow admins to create backups
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can create backups"
        )
    
    try:
        backup_path = backup_service.create_backup()
        
        if backup_path:
            return BackupResponse(
                success=True,
                message="Backup created successfully",
                backup_path=str(backup_path)
            )
        else:
            return BackupResponse(
                success=False,
                message="Backup creation failed"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create backup: {str(e)}"
        )


@router.post("/restore/{filename}", response_model=BackupResponse)
async def restore_backup(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Restore database from a backup file.
    
    WARNING: This will overwrite the current database!
    Requires authentication and superuser privileges.
    """
    # Only allow superusers to restore backups
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can restore backups"
        )
    
    try:
        backup_path = Path("backups") / filename
        
        if not backup_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Backup file not found: {filename}"
            )
        
        success = backup_service.restore_backup(backup_path)
        
        if success:
            return BackupResponse(
                success=True,
                message="Database restored successfully",
                backup_path=str(backup_path)
            )
        else:
            return BackupResponse(
                success=False,
                message="Database restore failed"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to restore backup: {str(e)}"
        )


@router.get("/status")
async def backup_status(
    current_user: User = Depends(get_current_user)
):
    """Get backup system status.
    
    Returns information about the backup system configuration.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can view backup status"
        )
    
    try:
        backups = backup_service.list_backups()
        total_size_mb = sum(b['size_mb'] for b in backups)
        
        return {
            "backup_directory": str(backup_service.backup_dir),
            "total_backups": len(backups),
            "total_size_mb": round(total_size_mb, 2),
            "schedule": "Every 24 hours",
            "retention_days": 30,
            "latest_backup": backups[0] if backups else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get backup status: {str(e)}"
        )

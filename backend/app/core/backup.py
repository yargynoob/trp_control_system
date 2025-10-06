"""Database backup service."""

import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseBackupService:
    """Service for managing database backups."""
    
    def __init__(self, backup_dir: str = "backups"):
        """Initialize backup service.
        
        Args:
            backup_dir: Directory to store backups
        """
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Parse database URL to get connection parameters
        self.db_user = settings.POSTGRES_USER
        self.db_password = settings.POSTGRES_PASSWORD
        self.db_host = settings.POSTGRES_HOST
        self.db_port = settings.POSTGRES_PORT
        self.db_name = settings.POSTGRES_DB
        
        # Set PostgreSQL binaries path
        self.pg_bin_path = Path(settings.PG_BIN_PATH) if settings.PG_BIN_PATH else None
        
    def create_backup(self) -> Optional[Path]:
        """Create a database backup.
        
        Returns:
            Path to the backup file if successful, None otherwise
        """
        try:
            # Generate backup filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"backup_{self.db_name}_{timestamp}.sql"
            backup_path = self.backup_dir / backup_filename
            
            logger.info(f"Starting database backup to {backup_path}")
            
            # Set environment variable for password
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password
            
            # Build pg_dump command with full path if specified
            pg_dump_cmd = str(self.pg_bin_path / 'pg_dump') if self.pg_bin_path else 'pg_dump'
            
            cmd = [
                pg_dump_cmd,
                '-h', self.db_host,
                '-p', str(self.db_port),
                '-U', self.db_user,
                '-d', self.db_name,
                '-F', 'c',  # Custom format (compressed)
                '-b',  # Include large objects
                '-v',  # Verbose
                '-f', str(backup_path)
            ]
            
            # Execute pg_dump
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                file_size = backup_path.stat().st_size / (1024 * 1024)  # MB
                logger.info(f"Backup created successfully: {backup_path} ({file_size:.2f} MB)")
                
                # Clean up old backups (keep last 30 days)
                self._cleanup_old_backups(days=30)
                
                return backup_path
            else:
                logger.error(f"Backup failed: {result.stderr}")
                return None
                
        except subprocess.TimeoutExpired:
            logger.error("Backup failed: pg_dump timeout")
            return None
        except Exception as e:
            logger.error(f"Backup failed: {str(e)}")
            return None
    
    def _cleanup_old_backups(self, days: int = 30):
        """Remove backups older than specified days.
        
        Args:
            days: Number of days to keep backups
        """
        try:
            from datetime import timedelta
            cutoff_time = datetime.now() - timedelta(days=days)
            
            removed_count = 0
            for backup_file in self.backup_dir.glob("backup_*.sql"):
                if backup_file.stat().st_mtime < cutoff_time.timestamp():
                    backup_file.unlink()
                    removed_count += 1
                    logger.info(f"Removed old backup: {backup_file}")
            
            if removed_count > 0:
                logger.info(f"Cleaned up {removed_count} old backup(s)")
                
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
    
    def restore_backup(self, backup_path: Path) -> bool:
        """Restore database from backup.
        
        Args:
            backup_path: Path to the backup file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not backup_path.exists():
                logger.error(f"Backup file not found: {backup_path}")
                return False
            
            logger.info(f"Starting database restore from {backup_path}")
            
            # Set environment variable for password
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password
            
            # Build pg_restore command with full path if specified
            pg_restore_cmd = str(self.pg_bin_path / 'pg_restore') if self.pg_bin_path else 'pg_restore'
            
            cmd = [
                pg_restore_cmd,
                '-h', self.db_host,
                '-p', str(self.db_port),
                '-U', self.db_user,
                '-d', self.db_name,
                '-c',  # Clean (drop) database objects before recreating
                '-v',  # Verbose
                str(backup_path)
            ]
            
            # Execute pg_restore
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode == 0:
                logger.info(f"Database restored successfully from {backup_path}")
                return True
            else:
                logger.error(f"Restore failed: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("Restore failed: pg_restore timeout")
            return False
        except Exception as e:
            logger.error(f"Restore failed: {str(e)}")
            return False
    
    def list_backups(self) -> list[dict]:
        """List all available backups.
        
        Returns:
            List of backup information dictionaries
        """
        backups = []
        
        for backup_file in sorted(self.backup_dir.glob("backup_*.sql"), reverse=True):
            stat = backup_file.stat()
            backups.append({
                'filename': backup_file.name,
                'path': str(backup_file),
                'size_mb': stat.st_size / (1024 * 1024),
                'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        
        return backups


# Global backup service instance
backup_service = DatabaseBackupService()

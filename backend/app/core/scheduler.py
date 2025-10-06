"""Scheduler for automated tasks."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI

from app.core.backup import backup_service

logger = logging.getLogger(__name__)


class BackupScheduler:
    """Scheduler for automated database backups."""
    
    def __init__(self):
        """Initialize the backup scheduler."""
        self.scheduler = AsyncIOScheduler()
        
    def start(self):
        """Start the scheduler."""
        try:
            # Schedule backup every 24 hours
            self.scheduler.add_job(
                func=self._perform_backup,
                trigger=IntervalTrigger(hours=24),
                id='database_backup',
                name='Database Backup',
                replace_existing=True
            )
            
            # Start the scheduler
            self.scheduler.start()
            logger.info("Backup scheduler started - backups will run every 24 hours")
            
            # Perform initial backup on startup
            logger.info("Performing initial backup on startup...")
            self._perform_backup()
            
        except Exception as e:
            logger.error(f"Failed to start backup scheduler: {str(e)}")
    
    def shutdown(self):
        """Shutdown the scheduler."""
        try:
            self.scheduler.shutdown()
            logger.info("Backup scheduler stopped")
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {str(e)}")
    
    def _perform_backup(self):
        """Perform database backup."""
        try:
            logger.info("Starting scheduled database backup...")
            backup_path = backup_service.create_backup()
            
            if backup_path:
                logger.info(f"Scheduled backup completed successfully: {backup_path}")
            else:
                logger.error("Scheduled backup failed")
                
        except Exception as e:
            logger.error(f"Error during scheduled backup: {str(e)}")


# Global scheduler instance
scheduler = BackupScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """FastAPI lifespan context manager.
    
    This manages startup and shutdown events for the application.
    """
    # Startup
    logger.info("Application startup - initializing services")
    scheduler.start()
    
    yield
    
    # Shutdown
    logger.info("Application shutdown - cleaning up services")
    scheduler.shutdown()
